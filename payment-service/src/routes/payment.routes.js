// services/payment/src/routes/payment.routes.js

const express = require("express");
const { authenticate , requireAdmin } = require("../middleware/auth.middleware");
const {
  validateCreatePayment,
  validateOnlinePaymentRequest,
  validateRefundRequest,
} = require("../middleware/validate.middleware");
const paymentController = require("../controllers/payment.controller");

const router = express.Router();

/**
 * @route POST /api/payments
 * @desc Tạo yêu cầu thanh toán mới (payment cơ bản)
 * @access Private
 */
router.post(
  "/",
  authenticate(),
  validateCreatePayment,
  paymentController.createPayment
);

/**
 * @route POST /api/payments/online
 * @desc Tạo giao dịch thanh toán trực tuyến (UC-7.1)
 * @access Private
 */
router.post(
  "/online",
  authenticate(),
  validateOnlinePaymentRequest,
  paymentController.createOnlinePayment
);

/**
 * @route GET /api/payments/transaction/:transactionId
 * @desc Lấy thông tin thanh toán theo transactionId
 * @access Public (để frontend có thể kiểm tra)
 */
router.get(
  "/transaction/:transactionId",
  paymentController.getPaymentByTransactionId
);

/**
 * @route GET /api/payments/callback/vnpay
 * @desc Xử lý callback từ VNPay
 * @access Public (để VNPay gọi được)
 */
router.get("/callback/vnpay", paymentController.handleVNPayCallback);

/**
 * @route POST /api/payments/callback/momo
 * @desc Xử lý callback từ Momo
 * @access Public (để Momo gọi được)
 */
router.post("/callback/momo", paymentController.handleMomoCallback);
router.get("/callback/momo", paymentController.handleMomoCallback);

/**
 * @route POST /api/payments/refund
 * @desc Hoàn tiền cho đơn hàng đã thanh toán
 * @access Private (Admin only)
 * @body { orderId: string, reason: string }
 */
router.post('/refund', authenticate({ required: true }), requireAdmin(), validateRefundRequest, paymentController.refundPayment);

module.exports = router;
