const logger = require('../utils/logger');

/**
 * Middleware xử lý lỗi chung ở API Gateway
 */
const errorHandler = (err, req, res, next) => {
  logger.error(`[API Gateway] Error: ${err.message}`);
  logger.error(err.stack);
  
  const statusCode = err.statusCode || 500;
  
  res.status(statusCode).json({
    status: 'error',
    message: statusCode === 500 ? 'Internal Server Error' : err.message
  });
};

module.exports = errorHandler;
