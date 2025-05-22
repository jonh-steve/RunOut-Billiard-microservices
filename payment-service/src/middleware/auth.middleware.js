// services/order/src/middleware/auth.middleware.js
const jwt = require('jsonwebtoken');
const logger = require('../../utils/logger');

/**
 * Middleware xác thực JWT
 * @param {Object} options - Tùy chọn middleware
 * @param {boolean} options.required - Xác thực bắt buộc hoặc không
 * @returns {Function} Middleware function
 */
const authenticate = (options = { required: true }) => {
  return (req, res, next) => {
    try {
      // Lấy token từ header
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        if (options.required) {
          return res.status(401).json({
            success: false,
            message: 'Unauthorized: No token provided'
          });
        }
        
        // Nếu không bắt buộc, tiếp tục mà không có thông tin người dùng
        return next();
      }
      
      const token = authHeader.split(' ')[1];
      
      // Xác thực token
      jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
          if (options.required) {
            logger.warn(`JWT validation failed: ${err.message}`);
            
            if (err.name === 'TokenExpiredError') {
              return res.status(401).json({
                success: false,
                message: 'Unauthorized: Token expired'
              });
            }
            
            return res.status(401).json({
              success: false,
              message: 'Unauthorized: Invalid token'
            });
          }
          
          // Nếu không bắt buộc và token không hợp lệ, tiếp tục mà không có thông tin người dùng
          return next();
        }
        
        // Lưu thông tin người dùng vào request
        req.user = decoded;
        next();
      });
    } catch (error) {
      logger.error(`Authentication error: ${error.message}`);
      
      if (options.required) {
        return res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
      }
      
      next();
    }
  };
};
// shared/src/middleware/auth.js

/**
 * Middleware kiểm tra quyền admin
 * Phải sử dụng sau middleware authenticate
 * @returns {Function} Express middleware function
 */
const requireAdmin = () => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
      // Sử dụng ApiError nếu có sẵn trong hệ thống
      // return next(new ApiError(403, 'Forbidden: Admin access required'));
      
      // Hoặc trả về JSON response nếu không dùng ApiError
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Admin access required'
      });
    }
    
    next();
  };
};


module.exports = {
  authenticate,
  requireAdmin
};