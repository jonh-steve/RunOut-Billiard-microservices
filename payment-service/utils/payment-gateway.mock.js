// services/payment/src/utils/payment-gateway.mock.js

const { v4: uuidv4 } = require("uuid");
const logger = require("../utils/logger");

/**
 * Tạo URL thanh toán giả lập VNPay
 * @param {string} orderId - ID đơn hàng
 * @param {boolean} forceNew - Bắt buộc tạo transactionId mới
 * @returns {Object} Thông tin URL thanh toán và transactionId
 */
const generateVNPayUrl = (orderId, forceNew = false) => {
  try {
    // Tạo mã giao dịch duy nhất với timestamp để tránh trùng lặp
    const timestamp = Date.now();
    const randomId = forceNew
      ? Math.random().toString(36).substring(2, 10)
      : uuidv4().substring(0, 8);
    const transactionId = `VNPAY-${timestamp}-${randomId}`;

    // URL giả lập (trong thực tế, sẽ gọi SDK/API của VNPay)
    const paymentUrl = `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?orderId=${orderId}&transactionId=${transactionId}`;

    logger.info(
      `Generated VNPay URL for order ${orderId}, transaction ${transactionId}`
    );

    return {
      paymentUrl,
      transactionId,
    };
  } catch (error) {
    logger.error(`Error generating VNPay URL: ${error.message}`);
    throw error;
  }
};

/**
 * Tạo URL thanh toán giả lập Momo
 * @param {string} orderId - ID đơn hàng
 * @param {boolean} forceNew - Bắt buộc tạo transactionId mới
 * @returns {Object} Thông tin URL thanh toán và transactionId
 */
const generateMomoUrl = (orderId, forceNew = false) => {
  try {
    // Tạo mã giao dịch duy nhất với timestamp để tránh trùng lặp
    const timestamp = Date.now();
    const randomId = forceNew
      ? Math.random().toString(36).substring(2, 10)
      : uuidv4().substring(0, 8);
    const transactionId = `MOMO-${timestamp}-${randomId}`;

    // URL giả lập (trong thực tế, sẽ gọi SDK/API của Momo)
    const paymentUrl = `https://test-payment.momo.vn/gw_payment/transactionProcessor?orderId=${orderId}&transactionId=${transactionId}`;

    logger.info(
      `Generated Momo URL for order ${orderId}, transaction ${transactionId}`
    );

    return {
      paymentUrl,
      transactionId,
    };
  } catch (error) {
    logger.error(`Error generating Momo URL: ${error.message}`);
    throw error;
  }
};

/**
 * Mock hoàn tiền qua VNPay
 * @param {string} transactionId - ID giao dịch cần hoàn tiền
 * @param {string} requestId - ID request để trace log
 * @returns {Promise<Object>} Kết quả hoàn tiền
 */
const refundVNPay = async (transactionId, requestId) => {
  try {
    logger.info(`[${requestId}] Processing refund for VNPay transaction: ${transactionId}`);
    
    // Tạo refund code giả lập
    const refundCode = `VNPAY-REFUND-${Date.now()}-${uuidv4().substring(0, 6)}`;
    
    // Simulate delay (500-1000ms)
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
    
    // Giả lập response từ VNPay
    const response = {
      refundCode,
      transactionId,
      status: 'SUCCESS',
      message: 'Refund processed successfully',
      processingTime: new Date().toISOString(),
      refundReference: uuidv4()
    };
    
    logger.info(`[${requestId}] VNPay refund successful: ${refundCode}`);
    
    return {
      success: true,
      data: response
    };
  } catch (error) {
    logger.error(`[${requestId}] Error processing VNPay refund: ${error.message}`);
    
    return {
      success: false,
      message: error.message || 'Failed to process refund with VNPay'
    };
  }
};

/**
 * Mock hoàn tiền qua Momo
 * @param {string} transactionId - ID giao dịch cần hoàn tiền
 * @param {string} requestId - ID request để trace log
 * @returns {Promise<Object>} Kết quả hoàn tiền
 */
const refundMomo = async (transactionId, requestId) => {
  try {
    logger.info(`[${requestId}] Processing refund for Momo transaction: ${transactionId}`);
    
    // Tạo refund code giả lập
    const refundCode = `MOMO-REFUND-${Date.now()}-${uuidv4().substring(0, 6)}`;
    
    // Simulate delay (500-1000ms)
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
    
    // Giả lập response từ Momo
    const response = {
      partnerCode: "MOMO",
      orderId: refundCode,
      requestId: uuidv4(),
      amount: 0, // Hoàn tiền toàn bộ
      transId: transactionId,
      resultCode: 0,
      message: "Successful",
      responseTime: Date.now(),
      extraData: ""
    };
    
    logger.info(`[${requestId}] Momo refund successful: ${refundCode}`);
    
    return {
      success: true,
      data: response
    };
  } catch (error) {
    logger.error(`[${requestId}] Error processing Momo refund: ${error.message}`);
    
    return {
      success: false,
      message: error.message || 'Failed to process refund with Momo'
    };
  }
};

/**
 * Xác thực callback từ Momo
 * @param {Object} momoParams - Tham số từ Momo callback
 * @param {string} requestId - ID request để trace log
 * @returns {Promise<Object>} Kết quả xác thực
 */
const verifyMomoReturnUrl = async (momoParams, requestId) => {
  try {
    logger.info(`[${requestId}] Verifying Momo callback params: ${JSON.stringify(momoParams)}`);
    
    // Trong môi trường thực tế, cần xác thực chữ ký từ Momo
    // 1. Lấy secretKey từ config
    // 2. Tạo chuỗi chữ ký từ các tham số
    // 3. So sánh với signature từ Momo
    
    // Giả lập xác thực thành công
    const isValidSignature = true;
    
    if (!isValidSignature) {
      logger.warn(`[${requestId}] Momo callback: Invalid signature`);
      return {
        success: false,
        message: 'Invalid signature'
      };
    }
    
    // Kiểm tra trạng thái giao dịch
    const resultCode = momoParams.resultCode;
    const isSuccess = resultCode === '0' || resultCode === 0;
    
    logger.info(`[${requestId}] Momo callback verification successful. Transaction ${isSuccess ? 'successful' : 'failed'} with code ${resultCode}`);
    
    return {
      success: true,
      data: {
        isSuccess,
        transactionId: momoParams.transId || momoParams.orderId,
        amount: momoParams.amount,
        responseTime: momoParams.responseTime,
        resultCode,
        message: momoParams.message
      }
    };
  } catch (error) {
    logger.error(`[${requestId}] Error verifying Momo callback: ${error.message}`);
    
    return {
      success: false,
      message: error.message || 'Failed to verify Momo callback'
    };
  }
};

module.exports = {
  generateVNPayUrl,
  generateMomoUrl,
  refundVNPay,
  refundMomo,
  verifyMomoReturnUrl
};
