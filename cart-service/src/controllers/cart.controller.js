const cartService = require('../services/cart.service');
const logger = require('../../utils/logger');

/**
 * Thêm sản phẩm vào giỏ hàng
 * @param {Object} req - Request Express
 * @param {Object} res - Response Express
 * @param {Function} next - Next middleware
 */
const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    
    // Lấy userId từ token JWT hoặc sessionId từ cookie
    const userId = req.user?.id;
    const sessionId = req.cookies?.sessionId || req.body.sessionId;
    
    // Kiểm tra nếu không có userId hoặc sessionId
    if (!userId && !sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Thêm vào giỏ hàng qua service
    const cart = await cartService.addToCart({
      userId,
      sessionId,
      productId,
      quantity: parseInt(quantity, 10)
    });
    
    // Trả về response thành công
    res.status(200).json({
      success: true,
      message: 'Product added to cart successfully',
      data: cart
    });
  } catch (error) {
    logger.error(`CartController - addToCart error: ${error.message}`);
    
    // Xử lý các lỗi cụ thể
    if (error.message.includes('Not enough stock')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.message.includes('Product not found')) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Chuyển các lỗi khác cho middleware xử lý
    next(error);
  }
};

/**
 * Cập nhật số lượng sản phẩm trong giỏ hàng (UC-2.2)
 * @param {Object} req - Request Express
 * @param {Object} res - Response Express
 * @param {Function} next - Next middleware
 */
const updateCartItem = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;

    // Validate input
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }
    if (quantity === undefined || quantity === null) {
      return res.status(400).json({
        success: false,
        message: 'Quantity is required'
      });
    }

    // Chuyển đổi quantity thành số nguyên
    const parsedQuantity = parseInt(quantity, 10);
    if (isNaN(parsedQuantity) || parsedQuantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a non-negative integer'
      });
    }

    // Xác định userId và sessionId
    const userId = req.user ? req.user.id : null;
    // Lấy sessionId từ cookie hoặc body (giống addToCart)
    const sessionId = req.cookies?.sessionId || req.body.sessionId;

    // Kiểm tra nếu không có cả userId và sessionId
    if (!userId && !sessionId) {
      return res.status(400).json({
        success: false,
        message: 'User ID or Session ID is required'
      });
    }

    // Gọi service để cập nhật giỏ hàng
    const result = await cartService.updateCartItem(
      userId,
      sessionId,
      productId,
      parsedQuantity
    );

    // Nếu không thành công
    if (!result.success) {
      // Xác định mã HTTP dựa trên loại lỗi
      let statusCode = 400;
      if (result.message === 'Cart not found') {
        statusCode = 404;
      } else if (result.message === 'Product not in cart') {
        statusCode = 404;
      } else if (result.message && result.message.startsWith('Not enough stock')) {
        statusCode = 400;
      } else if (result.message === 'Product not found') {
        statusCode = 404;
      }
      return res.status(statusCode).json({
        success: false,
        message: result.message
      });
    }

    // Trả về kết quả thành công
    res.status(200).json({
      success: true,
      message: 'Cart updated successfully',
      data: result.cart
    });
  } catch (error) {
    logger.error(`Error in updateCartItem controller: ${error.message}`);
    next(error);
  }
};
/**
 * Hợp nhất giỏ hàng sau khi người dùng đăng nhập
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
const mergeCart = async (req, res, next) => {
  try {
    // Lấy userId từ token JWT (đã xác thực từ middleware)
    const userId = req.user.id;

    // Lấy sessionId từ request (có thể từ cookie, body hoặc middleware)
    const sessionId = req.sessionId || req.cookies?.sessionId || req.body.sessionId;

    // Kiểm tra nếu không có sessionId
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID là bắt buộc để hợp nhất giỏ hàng nha anh yêu dễ thương 💖'
      });
    }

    // Gọi service để hợp nhất giỏ hàng
    const result = await cartService.mergeGuestCart(userId, sessionId);

    // Nếu có lỗi từ service
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    // Trả về kết quả thành công, style hồng cute
    res.status(200).json({
      success: true,
      message: result.message,
      data: result.cart
    });
  } catch (error) {
    logger.error(`Error in mergeCart controller: ${error.message}`);
    next(error);
  }
};


module.exports = {
  addToCart,
  updateCartItem,
  mergeCart
};