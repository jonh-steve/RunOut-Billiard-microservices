/**
 * 📂 Vị trí file: services/payment/src/services/payment.service.js
 * Service xử lý thanh toán – tone hồng dễ thương 🌸
 */

const axios = require('axios');
const Payment = require('../models/payment.model');
const { v4: uuidv4 } = require('uuid');

// Logger & Error chung toàn hệ thống
const logger = require('../../utils/logger');
const { ApiError } = require('../../utils/error-handler');

// Mock gateway trong DEV
const { generateVNPayUrl, generateMomoUrl , refundVNPay, refundMomo } = require('../../utils/payment-gateway.mock');

class PaymentService {
  // services/payment/src/services/payment.service.js

  /**
   * Tạo giao dịch thanh toán trực tuyến (UC-7.1)
   * @param {Object} data - Dữ liệu thanh toán
   * @param {string} data.orderId - ID đơn hàng
   * @param {string} data.paymentMethod - Phương thức thanh toán (VNPay, Momo)
   * @returns {Promise<Object>} Thông tin URL thanh toán và transactionId
   */
  async createOnlinePayment(data) {
    const requestId = `REQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    try {
      const { orderId, paymentMethod } = data;

      // Lấy thông tin đơn hàng từ Order Service
      logger.info(`[${requestId}] Fetching order details for ${orderId}`);
      const orderDetails = await this.getOrderDetails(orderId, requestId);

      // Kiểm tra trạng thái đơn hàng
      if (
        orderDetails.status !== "pending" &&
        orderDetails.status !== "confirmed"
      ) {
        throw new ApiError(
          400,
          `Cannot process payment for order with status: ${orderDetails.status}`,
          true
        );
      }

      // Kiểm tra trạng thái thanh toán
      if (orderDetails.paymentStatus === "paid") {
        throw new ApiError(400, "Order has already been paid", true);
      }

      // Lấy tổng tiền từ đơn hàng thay vì hardcode
      const amount = orderDetails.totalAmount;

      // Tạo thông tin khách hàng để truyền vào cổng thanh toán
      const customerInfo = {
        name: orderDetails.customerInfo?.name || "Customer",
        email: orderDetails.customerInfo?.email || "",
        phone: orderDetails.customerInfo?.phone || "",
      };

      // Tạo URL thanh toán dựa vào payment method
      let paymentInfo;

      if (paymentMethod === "VNPay") {
        logger.info(`[${requestId}] Generating VNPay URL for order ${orderId}`);
        paymentInfo = await this.createVNPayTransaction(
          orderId,
          amount,
          customerInfo,
          requestId
        );
      } else if (paymentMethod === "Momo") {
        logger.info(`[${requestId}] Generating Momo URL for order ${orderId}`);
        paymentInfo = await this.createMomoTransaction(
          orderId,
          amount,
          customerInfo,
          requestId
        );
      } else {
        throw new ApiError(400, "Unsupported payment method", true);
      }

      // Kiểm tra nếu payment đã tồn tại với orderId và status pending
      const existingPayment = await Payment.findOne({
        orderId,
        status: "pending",
        paymentMethod,
      });

      if (existingPayment) {
        logger.info(
          `[${requestId}] Found existing pending payment for order ${orderId}, updating...`
        );

        // Cập nhật payment hiện có thay vì tạo mới
        existingPayment.transactionId = paymentInfo.transactionId;
        existingPayment.paymentGateway = paymentMethod;
        existingPayment.amount = amount; // Cập nhật amount từ order mới nhất
        existingPayment.updatedAt = new Date();

        // Lưu payment đã cập nhật
        await existingPayment.save();

        logger.info(
          `[${requestId}] Updated existing payment for order ${orderId} with ${paymentMethod}`
        );

        // Cập nhật trạng thái đơn hàng
        await this.updateOrderPaymentStatus(orderId, "processing", requestId);

        return {
          success: true,
          paymentUrl: paymentInfo.paymentUrl,
          transactionId: paymentInfo.transactionId,
          amount: amount,
        };
      }

      // Tạo bản ghi Payment mới nếu không có payment pending
      try {
        const payment = new Payment({
          orderId,
          amount,
          paymentMethod,
          status: "pending",
          transactionId: paymentInfo.transactionId,
          paymentGateway: paymentMethod,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Lưu vào database
        await payment.save();

        // Cập nhật trạng thái đơn hàng
        await this.updateOrderPaymentStatus(orderId, "processing", requestId);

        logger.info(
          `[${requestId}] Created online payment for order ${orderId} with ${paymentMethod}, amount: ${amount}`
        );

        // Trả về thông tin thanh toán
        return {
          success: true,
          paymentUrl: paymentInfo.paymentUrl,
          transactionId: paymentInfo.transactionId,
          amount: amount,
        };
      } catch (error) {
        // MongoDB duplicate key error (nếu transactionId bị trùng)
        if (error.code === 11000) {
          // Sử dụng warning thay vì error cho trường hợp này
          logger.warn(
            `[${requestId}] Duplicate transaction ID detected. Generating new one for order ${orderId}`
          );

          // Tạo URL thanh toán mới với transactionId mới
          if (paymentMethod === "VNPay") {
            paymentInfo = await this.createVNPayTransaction(
              orderId,
              amount,
              customerInfo,
              requestId,
              true
            ); // true = force new
          } else if (paymentMethod === "Momo") {
            paymentInfo = await this.createMomoTransaction(
              orderId,
              amount,
              customerInfo,
              requestId,
              true
            ); // true = force new
          }

          // Thử lại với transactionId mới
          const payment = new Payment({
            orderId,
            amount,
            paymentMethod,
            status: "pending",
            transactionId: paymentInfo.transactionId,
            paymentGateway: paymentMethod,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          await payment.save();

          // Cập nhật trạng thái đơn hàng
          await this.updateOrderPaymentStatus(orderId, "processing", requestId);

          logger.info(
            `[${requestId}] Created payment with new transactionId for order ${orderId}`
          );

          return {
            success: true,
            paymentUrl: paymentInfo.paymentUrl,
            transactionId: paymentInfo.transactionId,
            amount: amount,
          };
        } else {
          // Rethrow các lỗi khác
          throw error;
        }
      }
    } catch (error) {
      logger.error(
        `[${requestId}] Error creating online payment: ${error.message}`
      );

      // Nếu đã là ApiError, throw lại
      if (error instanceof ApiError) {
        throw error;
      }

      // Các lỗi khác
      throw new ApiError(
        500,
        "Error creating online payment",
        false,
        error.stack
      );
    }
  }

  /* ------------------------------------------------------------------ */
  /* 🔧 Helper: truy vấn đơn hàng từ Order Service                       */
  /* ------------------------------------------------------------------ */
  /**
   * Lấy thông tin đơn hàng từ Order Service
   * @param {string} orderId - ID đơn hàng
   * @param {string} requestId - ID request để trace log
   * @returns {Promise<Object>} Thông tin đơn hàng
   */
  async getOrderDetails(orderId, requestId) {
    try {
      const orderServiceUrl =
        process.env.ORDER_SERVICE_URL || "http://localhost:3004";
      logger.info(
        `[${requestId}] Calling Order Service to get details for order ${orderId}`
      );

      const response = await axios.get(
        `${orderServiceUrl}/api/orders/${orderId}`
      );

      if (!response.data.success) {
        logger.warn(
          `[${requestId}] Order Service returned unsuccessful response for ${orderId}`
        );
        throw new ApiError(404, "Order not found", true);
      }

      logger.info(
        `[${requestId}] Successfully retrieved order details for ${orderId}`
      );
      return response.data.data;
    } catch (error) {
      logger.error(
        `[${requestId}] Error fetching order details: ${error.message}`
      );

      if (error.response) {
        // Lỗi từ Order Service
        throw new ApiError(
          error.response.status,
          error.response.data.message || "Error fetching order details",
          true
        );
      }

      throw new ApiError(500, "Order service unavailable", false);
    }
  }

  /* ------------------------------------------------------------------ */
  /* 🔧 Helper: cập nhật trạng thái thanh toán của đơn hàng             */
  /* ------------------------------------------------------------------ */
  /**
   * Cập nhật trạng thái thanh toán của đơn hàng
   * @param {string} orderId - ID đơn hàng
   * @param {string} paymentStatus - Trạng thái thanh toán mới
   * @param {string} requestId - ID request để trace log
   */
  async updateOrderPaymentStatus(orderId, paymentStatus, requestId) {
    try {
      const orderServiceUrl =
        process.env.ORDER_SERVICE_URL || "http://localhost:3004";
      logger.info(
        `[${requestId}] Updating payment status for order ${orderId} to ${paymentStatus}`
      );

      await axios.put(
        `${orderServiceUrl}/api/orders/${orderId}/payment-status`,
        {
          paymentStatus,
        }
      );

      logger.info(
        `[${requestId}] Successfully updated payment status for order ${orderId} to ${paymentStatus}`
      );
    } catch (error) {
      logger.warn(
        `[${requestId}] Error updating order payment status: ${error.message}`
      );
      // Không throw error ở đây để không ảnh hưởng đến luồng chính
    }
  }

  /* ------------------------------------------------------------------ */
  /* 🔧 Tạo giao dịch VNPay thực tế / mock                               */
  /* ------------------------------------------------------------------ */
  /**
   * Tạo giao dịch thanh toán VNPay thực tế
   * @param {string} orderId - ID đơn hàng
   * @param {number} amount - Số tiền thanh toán
   * @param {Object} customerInfo - Thông tin khách hàng
   * @param {string} requestId - ID request để trace log
   * @param {boolean} forceNew - Bắt buộc tạo transaction ID mới
   * @returns {Promise<Object>} Thông tin URL thanh toán và transactionId
   */
  async createVNPayTransaction(
    orderId,
    amount,
    customerInfo,
    requestId,
    forceNew = false
  ) {
    try {
      // Trong môi trường phát triển, sử dụng mock
      if (process.env.NODE_ENV !== "production") {
        logger.info(
          `[${requestId}] Using mock VNPay for development environment`
        );
        return generateVNPayUrl(orderId, forceNew);
      }

      // Cấu hình từ .env
      const vnpayConfig = {
        merchantCode: process.env.VNPAY_MERCHANT_CODE,
        secretKey: process.env.VNPAY_HASH_SECRET,
        version: process.env.VNPAY_VERSION || "2.1.0",
        command: "pay",
        currencyCode: "VND",
        locale: "vn",
        returnUrl: process.env.VNPAY_RETURN_URL,
      };

      // Tạo một transactionId duy nhất
      const now = Date.now();
      const randomSuffix = forceNew
        ? Math.floor(Math.random() * 1000000)
        : Math.floor(Math.random() * 1000);
      const transactionId = `VNPAY-${now}-${randomSuffix}`;

      logger.info(
        `[${requestId}] Creating VNPay transaction with ID: ${transactionId}`
      );

      // Tạo object payload theo tài liệu VNPay
      const vnpayPayload = {
        vnp_Version: vnpayConfig.version,
        vnp_Command: vnpayConfig.command,
        vnp_TmnCode: vnpayConfig.merchantCode,
        vnp_Amount: amount * 100, // VNPay yêu cầu amount * 100 (VND)
        vnp_CreateDate: this.formatVNPayDate(new Date()),
        vnp_CurrCode: vnpayConfig.currencyCode,
        vnp_IpAddr: "127.0.0.1", // Trong thực tế, lấy IP của client
        vnp_Locale: vnpayConfig.locale,
        vnp_OrderInfo: `Thanh toan don hang #${orderId}`,
        vnp_OrderType: "billpayment",
        vnp_ReturnUrl: `${vnpayConfig.returnUrl}?requestId=${requestId}`,
        vnp_TxnRef: transactionId,
      };

      // Tạo chuỗi hash để ký payload
      const sortedPayload = this.sortObject(vnpayPayload);
      let signData = Object.entries(sortedPayload)
        .map(([key, value]) => `${key}=${value}`)
        .join("&");

      const crypto = require("crypto");
      const hmac = crypto.createHmac("sha512", vnpayConfig.secretKey);
      const signed = hmac.update(signData).digest("hex");

      // Thêm chữ ký vào payload
      vnpayPayload.vnp_SecureHash = signed;

      // Tạo URL thanh toán
      const vnpayUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
      const queryString = Object.entries(vnpayPayload)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join("&");

      const paymentUrl = `${vnpayUrl}?${queryString}`;

      logger.info(
        `[${requestId}] Successfully created VNPay transaction: ${transactionId}`
      );

      return {
        paymentUrl,
        transactionId,
      };
    } catch (error) {
      logger.error(
        `[${requestId}] Error creating VNPay transaction: ${error.message}`
      );
      throw new ApiError(500, "Error creating VNPay transaction", false);
    }
  }

  /* ------------------------------------------------------------------ */
  /* 🔧 Tạo giao dịch Momo thực tế / mock                                */
  /* ------------------------------------------------------------------ */

  /**
   * Tạo giao dịch thanh toán Momo thực tế
   * @param {string} orderId - ID đơn hàng
   * @param {number} amount - Số tiền thanh toán
   * @param {Object} customerInfo - Thông tin khách hàng
   * @param {string} requestId - ID request để trace log
   * @param {boolean} forceNew - Bắt buộc tạo transaction ID mới
   * @returns {Promise<Object>} Thông tin URL thanh toán và transactionId
   */
  async createMomoTransaction(
    orderId,
    amount,
    customerInfo,
    requestId,
    forceNew = false
  ) {
    try {
      // Trong môi trường phát triển, sử dụng mock
      if (process.env.NODE_ENV !== "production") {
        logger.info(
          `[${requestId}] Using mock Momo for development environment`
        );
        return generateMomoUrl(orderId, forceNew);
      }

      // Cấu hình từ .env
      const momoConfig = {
        partnerCode: process.env.MOMO_PARTNER_CODE,
        accessKey: process.env.MOMO_ACCESS_KEY,
        secretKey: process.env.MOMO_SECRET_KEY,
        apiEndpoint:
          process.env.MOMO_API_ENDPOINT ||
          "https://test-payment.momo.vn/v2/gateway/api/create",
        redirectUrl: process.env.MOMO_REDIRECT_URL,
        ipnUrl: process.env.MOMO_IPN_URL,
      };

      // Tạo một transactionId duy nhất
      const now = Date.now();
      const randomSuffix = forceNew
        ? Math.floor(Math.random() * 1000000)
        : Math.floor(Math.random() * 1000);
      const transactionId = `MOMO-${now}-${randomSuffix}`;
      const uniqueRequestId = `REQ-${requestId}-${now}`;

      logger.info(
        `[${requestId}] Creating Momo transaction with ID: ${transactionId}`
      );

      // Tạo payload theo tài liệu Momo
      const momoPayload = {
        partnerCode: momoConfig.partnerCode,
        accessKey: momoConfig.accessKey,
        requestId: uniqueRequestId,
        amount: amount,
        orderId: transactionId,
        orderInfo: `Thanh toan don hang #${orderId}`,
        redirectUrl: `${momoConfig.redirectUrl}?requestId=${requestId}`,
        ipnUrl: `${momoConfig.ipnUrl}?requestId=${requestId}`,
        extraData: Buffer.from(JSON.stringify({ orderId, requestId })).toString(
          "base64"
        ),
        requestType: "captureWallet",
      };

      // Tạo chữ ký
      const rawSignature = Object.entries(momoPayload)
        .map(([key, value]) => `${key}=${value}`)
        .join("&");

      const crypto = require("crypto");
      const signature = crypto
        .createHmac("sha256", momoConfig.secretKey)
        .update(rawSignature)
        .digest("hex");

      momoPayload.signature = signature;

      // Gọi API Momo
      const response = await axios.post(momoConfig.apiEndpoint, momoPayload, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.data.resultCode !== 0) {
        logger.warn(
          `[${requestId}] Momo API returned error: ${response.data.message}`
        );
        throw new Error(`Momo error: ${response.data.message}`);
      }

      logger.info(
        `[${requestId}] Successfully created Momo transaction: ${transactionId}`
      );

      return {
        paymentUrl: response.data.payUrl,
        transactionId: transactionId,
      };
    } catch (error) {
      logger.error(
        `[${requestId}] Error creating Momo transaction: ${error.message}`
      );
      throw new ApiError(500, "Error creating Momo transaction", false);
    }
  }

  /* ------------------------------------------------------------------ */
  /* 🔧 Utils cho VNPay                                                 */
  /* ------------------------------------------------------------------ */
  formatVNPayDate(date) {
    const yyyy = date.getFullYear();
    const MM = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const HH = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    const ss = String(date.getSeconds()).padStart(2, "0");
    return `${yyyy}${MM}${dd}${HH}${mm}${ss}`;
  }

  sortObject(obj) {
    const sorted = {};
    for (const key of Object.keys(obj).sort()) {
      if (obj[key]) sorted[key] = obj[key];
    }
    return sorted;
  }

  /* ------------------------------------------------------------------ */
  /* ⚙️  Hàm COD cũ giữ nguyên để không break                           */
  /* ------------------------------------------------------------------ */
  async createPayment(paymentData) {
    try {
      const { orderId, amount, paymentMethod = "CashOnDelivery" } = paymentData;

      const transactionId =
        paymentMethod === "CashOnDelivery"
          ? `COD-${uuidv4().substring(0, 8)}`
          : null;

      const payment = new Payment({
        orderId,
        amount,
        paymentMethod,
        status: "pending",
        transactionId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await payment.save();

      return {
        success: true,
        message: "Payment created successfully",
        data: {
          _id: payment._id,
          orderId: payment.orderId,
          amount: payment.amount,
          method: payment.paymentMethod,
          status: payment.status,
          transactionId: payment.transactionId,
        },
      };
    } catch (error) {
      logger.error(`Error creating payment: ${error.message}`);

      if (error.code === 11000) {
        throw new ApiError(409, "Duplicate transaction ID", true);
      }
      if (error.name === "ValidationError") {
        throw new ApiError(400, error.message, true);
      }
      throw new ApiError(500, "Error creating payment", false, error.stack);
    }
  }

  /**
   * Hoàn tiền cho đơn hàng đã thanh toán
   * @param {Object} data - Dữ liệu hoàn tiền
   * @param {string} data.orderId - ID đơn hàng
   * @param {string} data.reason - Lý do hoàn tiền
   * @param {string} data.userId - ID của admin thực hiện hoàn tiền
   * @param {string} data.requestId - ID request để trace log
   * @returns {Promise<Object>} - Kết quả hoàn tiền
   */
  async refundPayment({ orderId, reason, userId, requestId }) {
    try {
      logger.info(
        `[${requestId}] Processing refund request for order ${orderId}`
      );

      // Tìm payment theo orderId và status = success
      const payment = await Payment.findOne({
        orderId,
        status: "success",
      });

      // Kiểm tra nếu payment không tồn tại
      if (!payment) {
        logger.warn(
          `[${requestId}] No successful payment found for order ${orderId}`
        );
        throw new ApiError(
          404,
          "No successful payment found for this order",
          true
        );
      }

      // Kiểm tra nếu đã hoàn tiền trước đó
      if (payment.status === "refunded" || payment.refundInfo) {
        logger.warn(
          `[${requestId}] Payment already refunded for order ${orderId}`
        );
        throw new ApiError(409, "This payment has already been refunded", true);
      }

      // Lấy thông tin giao dịch
      const { transactionId, paymentMethod, amount } = payment;

      // Kiểm tra phương thức thanh toán
      if (paymentMethod === "CashOnDelivery") {
        logger.warn(
          `[${requestId}] Cannot refund cash on delivery payment for order ${orderId}`
        );
        throw new ApiError(400, "Cannot refund cash on delivery payment", true);
      }

      // Gọi API hoàn tiền tương ứng
      let refundResult;

      if (paymentMethod === "VNPay") {
        logger.info(
          `[${requestId}] Processing VNPay refund for transaction ${transactionId}`
        );
        refundResult = await refundVNPay(transactionId, requestId);
      } else if (paymentMethod === "Momo") {
        logger.info(
          `[${requestId}] Processing Momo refund for transaction ${transactionId}`
        );
        refundResult = await refundMomo(transactionId, requestId);
      } else {
        logger.warn(
          `[${requestId}] Unsupported payment method: ${paymentMethod}`
        );
        throw new ApiError(
          400,
          `Unsupported payment method: ${paymentMethod}`,
          true
        );
      }

      // Kiểm tra kết quả hoàn tiền
      if (!refundResult.success) {
        logger.error(
          `[${requestId}] Payment gateway refund failed: ${refundResult.message}`
        );
        throw new ApiError(
          500,
          `Refund failed: ${refundResult.message}`,
          false
        );
      }

      // Cập nhật trạng thái payment
      payment.status = "refunded";
      payment.refundInfo = {
        refundAmount: amount,
        refundReason: reason,
        refundedAt: new Date(),
        refundedBy: userId,
      };
      payment.updatedAt = new Date();

      // Lưu payment đã cập nhật
      await payment.save();

      logger.info(
        `[${requestId}] Payment status updated to refunded for transaction ${transactionId}`
      );

      // Cập nhật trạng thái đơn hàng
      try {
        const orderServiceUrl =
          process.env.ORDER_SERVICE_URL || "http://localhost:3004";

        logger.info(
          `[${requestId}] Updating order payment status to refunded for order ${orderId}`
        );

        await axios.put(
          `${orderServiceUrl}/api/orders/${orderId}/payment-status`,
          {
            paymentStatus: "refunded",
            note: reason,
          }
        );

        logger.info(
          `[${requestId}] Successfully updated order payment status for order ${orderId}`
        );
      } catch (error) {
        // Log lỗi nhưng không throw error ở đây để không ảnh hưởng đến luồng chính
        logger.warn(
          `[${requestId}] Error updating order payment status: ${error.message}`
        );
      }

      // Trả về kết quả thành công
      return {
        success: true,
        message: "Refund processed successfully",
        data: {
          transactionId: payment.transactionId,
          refundTime: payment.refundInfo.refundedAt,
          gatewayResponse: refundResult.data,
        },
      };
    } catch (error) {
      // Re-throw ApiError
      if (error instanceof ApiError) {
        throw error;
      }

      // Các lỗi khác
      logger.error(`[${requestId}] Error processing refund: ${error.message}`);
      throw new ApiError(500, "Error processing refund", false, error.stack);
    }
  }

  /* … (các phương thức khác nếu có) … */
}

module.exports = new PaymentService();