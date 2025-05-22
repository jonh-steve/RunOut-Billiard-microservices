const jwt = require("jsonwebtoken");
const { ApiError } = require("../utils/error-handler");

/**
 * Middleware để xác thực JWT token
 * @param {Object} options - Tùy chọn xác thực
 * @param {boolean} options.required - Có yêu cầu token không
 */
const authenticate = (options = { required: true }) => {
  return (req, res, next) => {
    try {
      // Lấy token từ header
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        if (options.required) {
          throw new ApiError(401, "Unauthorized: Invalid authentication token");
        }

        // Nếu xác thực không bắt buộc, tiếp tục mà không có thông tin user
        return next();
      }

      const token = authHeader.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Lưu thông tin người dùng vào request
      req.user = decoded;

      next();
    } catch (error) {
      if (error.name === "JsonWebTokenError") {
        return next(
          new ApiError(401, "Unauthorized: Invalid authentication token")
        );
      }
      if (error.name === "TokenExpiredError") {
        return next(new ApiError(401, "Unauthorized: Token expired"));
      }
      next(error);
    }
  };
};

/**
 * Middleware kiểm tra quyền admin
 */
const requireAdmin = () => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== "admin") {
      return next(new ApiError(403, "Forbidden: Admin access required"));
    }
    next();
  };
};

/**
 * Middleware kiểm tra quyền người dùng hoặc admin
 */
const requireOwnerOrAdmin = () => {
  return (req, res, next) => {
    const userId = req.params.userId || req.query.userId;

    // Cho phép nếu là admin
    if (req.user.role === "admin") {
      return next();
    }

    // Cho phép nếu đang truy cập resource của chính mình
    if (userId && req.user.id === userId) {
      return next();
    }

    return next(new ApiError(403, "Forbidden: Insufficient permissions"));
  };
};

module.exports = {
  authenticate,
  requireAdmin,
  requireOwnerOrAdmin,
};
