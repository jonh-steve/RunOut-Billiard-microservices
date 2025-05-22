/**
 * Vị trí file: product-service/src/middleware/validate.middleware.js
 * Middleware kiểm tra dữ liệu đầu vào cho các API sản phẩm
 * Style: Hồng dễ thương dành cho anh yêu dễ thương 🩷
 */
const mongoose = require('mongoose');
const { ApiError } = require("../utils/error-handler");
/**
 * Middleware kiểm tra dữ liệu đầu vào cho cập nhật sản phẩm (UC-2.5)
 */
const validateUpdateProduct = (req, res, next) => {
  const updates = req.body;
  const errors = [];
  
  // Kiểm tra các trường không được phép gửi lên
  const restrictedFields = ['_id', 'createdAt', 'updatedAt', 'reviews', 'ratings'];
  
  // Kiểm tra nếu có trường bị giới hạn - đã sửa để tuân thủ ESLint
  const hasRestrictedField = restrictedFields.some(field => Object.prototype.hasOwnProperty.call(updates, field));
  if (hasRestrictedField) {
    errors.push('Cannot update restricted fields (_id, createdAt, updatedAt, reviews, ratings)');
  }
  
  // Kiểm tra price nếu có
  if (updates.price !== undefined) {
    if (isNaN(updates.price) || updates.price < 0) {
      errors.push('Price must be a valid positive number');
    }
  }
  
  // Kiểm tra salePrice nếu có
  if (updates.salePrice !== undefined) {
    if (isNaN(updates.salePrice) || updates.salePrice < 0) {
      errors.push('Sale price must be a valid positive number');
    }
    
    // Kiểm tra salePrice phải nhỏ hơn price nếu cả hai đều được gửi lên
    if (updates.price !== undefined && updates.salePrice >= updates.price) {
      errors.push('Sale price must be less than regular price');
    }
  }
  
  // Kiểm tra stock nếu có
  if (updates.stock !== undefined) {
    if (isNaN(updates.stock) || updates.stock < 0) {
      errors.push('Stock must be a valid non-negative number');
    }
  }
  
  // Kiểm tra category nếu có
  if (updates.category !== undefined) {
    if (!mongoose.Types.ObjectId.isValid(updates.category)) {
      errors.push('Invalid category ID format');
    }
  }
  
  // Trả về lỗi nếu có
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }
  
  next();
};

const validateCreateProduct = (req, res, next) => {
  const { name, price, category } = req.body;
  const errors = [];
  
  // Kiểm tra các trường bắt buộc
  if (!name || name.trim() === '') {
    errors.push('Name is required');
  }
  
  if (!price) {
    errors.push('Price is required');
  } else if (isNaN(price) || price < 0) {
    errors.push('Price must be a valid positive number');
  }
  
  if (!category) {
    errors.push('Category is required');
  } else if (!mongoose.Types.ObjectId.isValid(category)) {
    errors.push('Invalid category ID');
  }
  
  // Nếu có lỗi, trả về response lỗi
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }
  
  // Nếu không có lỗi, chuyển đến middleware tiếp theo
  next();
};

/**
 * Middleware kiểm tra dữ liệu đầu vào cho request khôi phục tồn kho
 * Liên quan đến UC-8.3: Khôi phục tồn kho khi đơn hàng được hoàn tiền
 */
const validateRestoreInventoryRequest = (req, res, next) => {
  try {
    const { orderId } = req.body;
    const errors = [];

    // Kiểm tra orderId
    if (!orderId) {
      errors.push('Order ID is required');
    } else if (!mongoose.Types.ObjectId.isValid(orderId)) {
      errors.push('Invalid Order ID format');
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
 * Middleware kiểm tra dữ liệu đầu vào cho request khôi phục tồn kho đơn hàng bị hủy
 * UC-8.4
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validateCancelledOrderInventoryRequest = (req, res, next) => {
  try {
    const { orderId } = req.body;
    const errors = [];

    // Kiểm tra orderId
    if (!orderId) {
      errors.push('Order ID is required');
    } else if (!mongoose.Types.ObjectId.isValid(orderId)) {
      errors.push('Invalid Order ID format');
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


// Export các hàm middleware validation
module.exports = {
  validateUpdateProduct,
  validateCreateProduct,
  validateRestoreInventoryRequest,
  validateCancelledOrderInventoryRequest
};