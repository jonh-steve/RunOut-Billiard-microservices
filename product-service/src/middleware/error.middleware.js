const logger = require('../utils/logger');

/**
 * Middleware xử lý lỗi chung cho Product Service
 * @param {Error} err - Lỗi được bắt
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const errorHandler = (err, req, res, next) => {
  logger.error(`[Product Service] Error: ${err.message}`);
  logger.error(err.stack);
  
  const statusCode = err.statusCode || 500;
  
  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? 'Internal Server Error' : err.message
  });
  
  next();
};

module.exports = errorHandler;