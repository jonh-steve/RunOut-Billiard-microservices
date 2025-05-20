const jwt = require('jsonwebtoken');
const logger = require('../../utils/logger');

/**
 * Middleware xác thực JWT
 * @param {Object} options - Tùy chọn: { required: boolean }
 * @returns {Function} - Middleware Express
 */
const authenticate = (options = { required: true }) => {
  return (req, res, next) => {
    try {
      // Lấy token từ header
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // Nếu không có token và token là bắt buộc
        if (options.required) {
          return res.status(401).json({
            success: false,
            message: 'Authentication required'
          });
        }
        // Nếu không bắt buộc, tiếp tục nhưng không có req.user
        return next();
      }
      
      const token = authHeader.split(' ')[1];
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Thêm thông tin người dùng vào request
      req.user = decoded;
      
      next();
    } catch (error) {
      logger.warn(`JWT validation failed: ${error.message}`);
      
      // Nếu token là bắt buộc, trả về lỗi
      if (options.required) {
        if (error.name === 'JsonWebTokenError') {
          return res.status(401).json({
            success: false,
            message: 'Invalid authentication token'
          });
        }
        
        if (error.name === 'TokenExpiredError') {
          return res.status(401).json({
            success: false,
            message: 'Authentication token expired'
          });
        }
        
        return res.status(401).json({
          success: false,
          message: 'Authentication failed'
        });
      }
      
      // Nếu không bắt buộc, tiếp tục nhưng không có req.user
      next();
    }
  };
};

/**
 * Middleware kiểm tra quyền admin
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

module.exports = {
  authenticate,
  requireAdmin
};