const logger = require('../utils/logger');

/**
 * Middleware để log tất cả requests
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log khi request bắt đầu
  logger.info(`[API Gateway] ${req.method} ${req.url} - Request received`);
  
  // Capture the original end method
  const originalEnd = res.end;
  
  // Override the end method
  res.end = function(...args) {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    
    // Determine log level based on status code
    const logMethod = statusCode >= 500 
      ? logger.error.bind(logger) 
      : statusCode >= 400 
        ? logger.warn.bind(logger) 
        : logger.info.bind(logger);
    
    // Log response details
    logMethod(`[API Gateway] ${req.method} ${req.url} - Status: ${statusCode} - Duration: ${duration}ms`);
    
    // Call the original end method
    return originalEnd.apply(this, args);
  };
  
  next();
};

module.exports = requestLogger;
