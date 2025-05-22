// services/payment/src/controllers/payment.controller.js

const paymentService = require("../services/payment.service");
const logger = require("../../utils/logger");
const { ApiError } = require("../../utils/error-handler");
const Payment = require("../models/payment.model");
const axios = require("axios");
const { verifyMomoReturnUrl } = require("../../utils/payment-gateway.mock");

/**
 * Controller xử lý các request liên quan đến thanh toán
 */
class PaymentController {
  /**
   * Tạo yêu cầu thanh toán mới
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   * @returns {Promise<void>}
   */
  async createPayment(req, res, next) {
    try {
      const { orderId, amount, method } = req.body;

      // Validate dữ liệu đầu vào (có thể đã được middleware xử lý)
      if (!orderId || !amount) {
        throw new ApiError(
          400,
          "Missing required fields: orderId, amount",
          true
        );
      }

      // Gọi service để tạo thanh toán
      const result = await paymentService.createPayment({
        orderId,
        amount,
        paymentMethod: method || "CashOnDelivery",
      });

      // Trả về kết quả
      res.status(201).json(result);
    } catch (error) {
      // Nếu đã là ApiError, chuyển tiếp cho middleware xử lý
      if (error instanceof ApiError) {
        return next(error);
      }

      logger.error(`Error in createPayment controller: ${error.message}`);
      // Chuyển đổi lỗi thông thường thành ApiError với status 500
      next(new ApiError(500, "Internal server error", false, error.stack));
    }
  }
  /**
   * Tạo giao dịch thanh toán trực tuyến (UC-7.1)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   * @returns {Promise<void>}
   */
  async createOnlinePayment(req, res, next) {
    const requestId = `REQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    try {
      const { orderId, paymentMethod } = req.body;

      logger.info(
        `[${requestId}] Processing online payment request for order ${orderId} with ${paymentMethod}`
      );

      // Validation đã được xử lý bởi middleware validateOnlinePaymentRequest

      // Gọi service để tạo thanh toán online
      const result = await paymentService.createOnlinePayment({
        orderId,
        paymentMethod,
        requestId, // Truyền requestId vào service để trace log
      });

      // Trả về kết quả với URL thanh toán
      logger.info(
        `[${requestId}] Successfully generated payment URL for order ${orderId}`
      );
      res.status(200).json({
        success: true,
        paymentUrl: result.paymentUrl,
        transactionId: result.transactionId,
        amount: result.amount,
        requestId: requestId, // Trả về requestId để frontend có thể sử dụng trace log
      });
    } catch (error) {
      logger.error(
        `[${requestId}] Error in createOnlinePayment controller: ${error.message}`
      );

      // Nếu đã là ApiError, chuyển tiếp cho middleware xử lý
      if (error instanceof ApiError) {
        return next(error);
      }

      // Chuyển đổi lỗi thông thường thành ApiError với status 500
      next(new ApiError(500, "Internal server error", false, error.stack));
    }
  }

  // Thêm phương thức xử lý callback từ VNPay
  /**
   * Xử lý callback từ VNPay
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async handleVNPayCallback(req, res, next) {
    // Lấy requestId từ query params hoặc tạo mới
    const requestId =
      req.query.requestId ||
      `REQ-CB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    try {
      // VNPay gửi dữ liệu qua query params
      const vnpParams = req.query;
      logger.info(
        `[${requestId}] Received VNPay callback: ${JSON.stringify(vnpParams)}`
      );

      // Kiểm tra chữ ký từ VNPay
      const secureHash = vnpParams.vnp_SecureHash;
      delete vnpParams.vnp_SecureHash;
      delete vnpParams.vnp_SecureHashType;
      delete vnpParams.requestId; // Xóa requestId của chúng ta khỏi params để kiểm tra chữ ký

      // Tạo chữ ký để kiểm tra
      const sortedParams = this.sortObject(vnpParams);
      let signData = Object.entries(sortedParams)
        .map(([key, value]) => `${key}=${value}`)
        .join("&");

      const crypto = require("crypto");
      const hmac = crypto.createHmac("sha512", process.env.VNPAY_HASH_SECRET);
      const signed = hmac.update(signData).digest("hex");

      // So sánh chữ ký
      if (secureHash !== signed) {
        logger.warn(`[${requestId}] VNPay callback: Invalid secure hash`);
        return res
          .status(400)
          .json({ success: false, message: "Invalid signature" });
      }

      // Lấy thông tin giao dịch
      const transactionId = vnpParams.vnp_TxnRef;
      const responseCode = vnpParams.vnp_ResponseCode;

      // Tìm payment theo transactionId
      const payment = await Payment.findOne({ transactionId });

      if (!payment) {
        logger.warn(
          `[${requestId}] VNPay callback: Payment not found for transaction ${transactionId}`
        );
        return res
          .status(404)
          .json({ success: false, message: "Payment not found" });
      }

      // Cập nhật trạng thái payment
      const newStatus = responseCode === "00" ? "success" : "failed";
      payment.status = newStatus;
      payment.callbackPayload = vnpParams;
      payment.updatedAt = new Date();
      await payment.save();

      // Cập nhật trạng thái đơn hàng
      const orderStatus = responseCode === "00" ? "paid" : "payment_failed";
      await this.updateOrderPaymentStatus(
        payment.orderId,
        orderStatus,
        requestId
      );

      logger.info(
        `[${requestId}] Updated payment status to ${newStatus} for transaction ${transactionId}`
      );

      // Trả về trang kết quả
      res.redirect(
        `${process.env.PAYMENT_RESULT_URL}?status=${newStatus}&orderId=${payment.orderId}&transactionId=${transactionId}`
      );
    } catch (error) {
      logger.error(
        `[${requestId}] Error handling VNPay callback: ${error.message}`
      );
      next(error);
    }
  }

  /**
   * Xử lý callback từ Momo
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async handleMomoCallback(req, res, next) {
    // Lấy requestId từ query params hoặc tạo mới
    const requestId =
      req.query.requestId ||
      `REQ-CB-MOMO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    try {
      // Momo có thể gửi callback qua GET hoặc POST
      const momoParams = req.method === "POST" ? req.body : req.query;

      logger.info(
        `[${requestId}] Received Momo callback: ${JSON.stringify(momoParams)}`
      );

      // Xác thực callback từ Momo
      const verifyResult = await verifyMomoReturnUrl(momoParams, requestId);

      if (!verifyResult.success) {
        logger.warn(
          `[${requestId}] Momo callback verification failed: ${verifyResult.message}`
        );
        return res
          .status(400)
          .json({ success: false, message: verifyResult.message });
      }

      // Lấy thông tin từ kết quả xác thực
      const { isSuccess, transactionId } = verifyResult.data;

      // Tìm payment theo transactionId
      const payment = await Payment.findOne({ transactionId });

      if (!payment) {
        logger.warn(
          `[${requestId}] Momo callback: Payment not found for transaction ${transactionId}`
        );
        return res
          .status(404)
          .json({ success: false, message: "Payment not found" });
      }

      // Cập nhật trạng thái payment
      const newStatus = isSuccess ? "success" : "failed";
      payment.status = newStatus;
      payment.callbackPayload = momoParams;
      payment.updatedAt = new Date();
      await payment.save();

      // Cập nhật trạng thái đơn hàng
      const orderStatus = isSuccess ? "paid" : "payment_failed";
      try {
        const orderServiceUrl =
          process.env.ORDER_SERVICE_URL || "http://localhost:3004";

        logger.info(
          `[${requestId}] Updating order payment status to ${orderStatus} for order ${payment.orderId}`
        );

        await axios.put(
          `${orderServiceUrl}/api/orders/${payment.orderId}/payment-status`,
          {
            paymentStatus: orderStatus,
            note: isSuccess
              ? "Payment successful via Momo"
              : "Payment failed via Momo",
          }
        );

        logger.info(
          `[${requestId}] Successfully updated order payment status for order ${payment.orderId}`
        );
      } catch (error) {
        // Log lỗi nhưng không throw error
        logger.warn(
          `[${requestId}] Error updating order payment status: ${error.message}`
        );
      }

      logger.info(
        `[${requestId}] Updated payment status to ${newStatus} for transaction ${transactionId}`
      );

      // Nếu là request từ browser (IPN), redirect người dùng đến trang kết quả
      if (
        req.headers["user-agent"] &&
        !req.headers["user-agent"].includes("momo-ipn")
      ) {
        return res.redirect(
          `${process.env.PAYMENT_RESULT_URL}?status=${newStatus}&orderId=${payment.orderId}&transactionId=${transactionId}`
        );
      }

      // Nếu là request từ server Momo (IPN), trả về status OK
      return res.status(200).json({
        success: true,
        message: `Payment ${newStatus}`,
        data: {
          orderId: payment.orderId,
          transactionId,
          status: newStatus,
        },
      });
    } catch (error) {
      logger.error(
        `[${requestId}] Error handling Momo callback: ${error.message}`
      );
      next(error);
    }
  }
  /**
   * Cập nhật trạng thái thanh toán của đơn hàng
   * @param {string} orderId - ID đơn hàng
   * @param {string} paymentStatus - Trạng thái thanh toán mới
   */
  async updateOrderPaymentStatus(orderId, paymentStatus) {
    try {
      const orderServiceUrl =
        process.env.ORDER_SERVICE_URL || "http://localhost:3004";
      await axios.put(
        `${orderServiceUrl}/api/orders/${orderId}/payment-status`,
        {
          paymentStatus,
        }
      );

      logger.info(
        `Updated payment status for order ${orderId} to ${paymentStatus}`
      );
    } catch (error) {
      logger.error(`Error updating order payment status: ${error.message}`);
      // Không throw error ở đây để không ảnh hưởng đến luồng chính
    }
  }

  /**
   * Sắp xếp object theo key (yêu cầu của VNPay)
   * @param {Object} obj - Object cần sắp xếp
   * @returns {Object} Object đã sắp xếp
   */
  sortObject(obj) {
    const sorted = {};
    const keys = Object.keys(obj).sort();

    for (const key of keys) {
      if (obj[key]) {
        sorted[key] = obj[key];
      }
    }

    return sorted;
  }

  /**
   * Lấy thông tin thanh toán
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getPaymentByTransactionId(req, res, next) {
    try {
      const { transactionId } = req.params;

      if (!transactionId) {
        throw new ApiError(400, "Transaction ID is required", true);
      }

      // Tìm payment theo transactionId
      const payment = await Payment.findOne({ transactionId });

      if (!payment) {
        throw new ApiError(404, "Payment not found", true);
      }

      res.status(200).json({
        success: true,
        data: {
          _id: payment._id,
          orderId: payment.orderId,
          amount: payment.amount,
          method: payment.paymentMethod,
          status: payment.status,
          transactionId: payment.transactionId,
          createdAt: payment.createdAt,
          updatedAt: payment.updatedAt,
        },
      });
    } catch (error) {
      logger.error(`Error in getPaymentByTransactionId: ${error.message}`);

      if (error instanceof ApiError) {
        return next(error);
      }

      next(new ApiError(500, "Internal server error", false, error.stack));
    }
  }
  /**
   * Xử lý yêu cầu hoàn tiền đơn hàng (UC-7.2)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   * @returns {Promise<void>}
   */
  async refundPayment(req, res, next) {
    // Tạo requestId để trace log
    const requestId = `REQ-REFUND-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    try {
      // Lấy dữ liệu từ request body (đã được validate bởi middleware)
      const { orderId, reason } = req.body;

      // Lấy userId từ user đã xác thực
      const userId = req.user.id;

      logger.info(
        `[${requestId}] Admin ${userId} requested refund for order ${orderId}: ${reason}`
      );

      // Gọi service để xử lý hoàn tiền
      const result = await paymentService.refundPayment({
        orderId,
        reason,
        userId,
        requestId,
      });

      // Trả về kết quả thành công
      res.status(200).json(result);
    } catch (error) {
      // Log lỗi
      logger.error(
        `[${requestId}] Error in refundPayment controller: ${error.message}`
      );

      // Nếu đã là ApiError, chuyển tiếp cho middleware xử lý
      if (error instanceof ApiError) {
        return next(error);
      }

      // Chuyển đổi lỗi thông thường thành ApiError với status 500
      next(new ApiError(500, "Internal server error", false, error.stack));
    }
  }
}

module.exports = new PaymentController();
