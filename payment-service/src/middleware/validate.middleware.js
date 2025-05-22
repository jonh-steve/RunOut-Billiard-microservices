
/**
 * 📂 Vị trí file: services/payment/src/middleware/validate.middleware.js
 * Middleware validate các request thanh toán – phong cách hường phấn dễ thương 🌸
 */

const mongoose = require('mongoose');
const { ApiError } = require('../../utils/error-handler');

/**
 * Validate dữ liệu cho request tạo thanh toán online (VNPay, Momo)
 */
const validateOnlinePaymentRequest = (req, res, next) => {
  try {
    const { orderId, paymentMethod } = req.body;
    const errors = [];

    // Kiểm tra orderId
    if (!orderId) {
      errors.push('Order ID is required');
    } else if (!mongoose.Types.ObjectId.isValid(orderId)) {
      errors.push('Invalid Order ID format');
    }

    // Kiểm tra paymentMethod
    if (!paymentMethod) {
      errors.push('Payment method is required');
    } else if (!['VNPay', 'Momo'].includes(paymentMethod)) {
      errors.push('Invalid payment method. Must be VNPay or Momo');
    }

    // Nếu có lỗi
    if (errors.length > 0) {
      throw new ApiError(400, 'Validation failed: ' + errors.join(', '), true);
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Tái sử dụng validateCreatePayment từ triển khai cũ (thanh toán nói chung)
 */
const validateCreatePayment = (req, res, next) => {
  try {
    const { orderId, amount, method } = req.body;
    const errors = [];

    // Kiểm tra orderId
    if (!orderId) {
      errors.push('Order ID is required');
    } else if (!mongoose.Types.ObjectId.isValid(orderId)) {
      errors.push('Invalid Order ID format');
    }

    // Kiểm tra amount
    if (!amount) {
      errors.push('Amount is required');
    } else if (isNaN(amount) || amount <= 0) {
      errors.push('Amount must be a positive number');
    }

    // Kiểm tra method (nếu được cung cấp)
    if (method && !['VNPay', 'Momo', 'CashOnDelivery'].includes(method)) {
      errors.push('Invalid payment method. Must be VNPay, Momo, or CashOnDelivery');
    }

    // Nếu có lỗi
    if (errors.length > 0) {
      throw new ApiError(400, 'Validation failed: ' + errors.join(', '), true);
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate dữ liệu cho request refund payment
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validateRefundRequest = (req, res, next) => {
  try {
    const { orderId, reason } = req.body;
    const errors = [];

    // Kiểm tra orderId
    if (!orderId) {
      errors.push('Order ID is required');
    } else if (!mongoose.Types.ObjectId.isValid(orderId)) {
      errors.push('Invalid Order ID format');
    }

    // Kiểm tra reason
    if (!reason) {
      errors.push('Reason is required');
    } else if (typeof reason !== 'string' || reason.trim() === '') {
      errors.push('Reason must be a non-empty string');
    }

    // Nếu có lỗi
    if (errors.length > 0) {
      throw new ApiError(400, 'Validation failed: ' + errors.join(', '), true);
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  validateCreatePayment,
  validateOnlinePaymentRequest,
  validateRefundRequest,
};
