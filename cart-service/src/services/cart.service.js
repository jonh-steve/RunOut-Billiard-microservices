
/**
 * 📂 Vị trí file: cart-service/src/services/cart.service.js
 * 
 * File này chứa CartService với các chức năng quản lý giỏ hàng siêu dễ thương cho anh yêu dễ thương 💖
 */

const Cart = require('../models/cart.model');
const axios = require('axios');
const logger = require('../../utils/logger'); // Đã sửa lại import logger cho chuẩn cute

class CartService {
  /**
   * 🛒 Tìm giỏ hàng đang active theo userId hoặc sessionId
   * @param {string|null} userId - ID người dùng (nếu đã đăng nhập)
   * @param {string|null} sessionId - ID phiên (nếu là khách vãng lai)
   * @returns {Promise<Cart|null>} - Giỏ hàng tìm thấy hoặc null
   */
  async findActiveCart(userId, sessionId) {
    try {
      let cart = null;
      if (userId) {
        cart = await Cart.findOne({ user: userId, status: 'active' });
      } else if (sessionId) {
        cart = await Cart.findOne({ sessionId, status: 'active' });
      }
      return cart;
    } catch (error) {
      logger.error(`Error finding active cart: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🩷 Kiểm tra tồn kho sản phẩm thông qua Product Service
   * @param {string} productId - ID sản phẩm
   * @param {number} requestedQuantity - Số lượng yêu cầu
   * @returns {Promise<{success: boolean, product: object|null, message: string|null}>}
   */
  async checkProductStock(productId, requestedQuantity) {
    try {
      // Gọi API đến Product Service để kiểm tra tồn kho
      const productServiceUrl = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002';
      const response = await axios.get(`${productServiceUrl}/api/products/${productId}`);
      if (!response.data.success) {
        return {
          success: false,
          product: null,
          message: 'Product not found'
        };
      }
      const product = response.data.data;
      // Kiểm tra tồn kho
      if (product.stock < requestedQuantity) {
        return {
          success: false,
          product,
          message: `Not enough stock. Available: ${product.stock}`
        };
      }
      return {
        success: true,
        product,
        message: null
      };
    } catch (error) {
      logger.error(`Error checking product stock: ${error.message}`);
      // Xử lý trường hợp Product Service không khả dụng
      if (error.response && error.response.status === 404) {
        return {
          success: false,
          product: null,
          message: 'Product not found'
        };
      }
      throw error;
    }
  }

  /**
   * 🩷 Cập nhật số lượng sản phẩm trong giỏ hàng
   * @param {string|null} userId - ID người dùng (nếu đã đăng nhập)
   * @param {string|null} sessionId - ID phiên (nếu là khách vãng lai)
   * @param {string} productId - ID sản phẩm
   * @param {number} quantity - Số lượng mới
   * @returns {Promise<{success: boolean, cart: Cart|null, message: string|null}>}
   */
  async updateCartItem(userId, sessionId, productId, quantity) {
    try {
      // Tìm giỏ hàng đang active
      const cart = await this.findActiveCart(userId, sessionId);
      // Nếu không tìm thấy giỏ hàng
      if (!cart) {
        return {
          success: false,
          cart: null,
          message: 'Cart not found'
        };
      }
      // Tìm vị trí của sản phẩm trong giỏ hàng
      const existingItemIndex = cart.items.findIndex(
        item => item.product.toString() === productId
      );
      // Nếu sản phẩm không có trong giỏ hàng
      if (existingItemIndex === -1) {
        return {
          success: false,
          cart: null,
          message: 'Product not in cart'
        };
      }
      // Nếu số lượng = 0, xóa sản phẩm khỏi giỏ hàng
      if (quantity === 0) {
        cart.items.splice(existingItemIndex, 1);
        await cart.save();
        return {
          success: true,
          cart,
          message: 'Product removed from cart'
        };
      }
      // Kiểm tra tồn kho sản phẩm
      const stockCheck = await this.checkProductStock(productId, quantity);
      if (!stockCheck.success) {
        return {
          success: false,
          cart: null,
          message: stockCheck.message
        };
      }
      // Cập nhật số lượng
      cart.items[existingItemIndex].quantity = quantity;
      // Lưu giỏ hàng (subtotal sẽ được tính lại trong pre-save hook)
      await cart.save();
      return {
        success: true,
        cart,
        message: 'Cart updated successfully'
      };
    } catch (error) {
      logger.error(`Error updating cart item: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🩷 Thêm sản phẩm vào giỏ hàng (giữ lại logic cũ, bổ sung kiểm tra tồn kho bằng checkProductStock)
   * @param {Object} options - Thông tin sản phẩm và người dùng
   * @param {string} options.userId - ID người dùng (nếu đã đăng nhập)
   * @param {string} options.sessionId - ID phiên (nếu chưa đăng nhập)
   * @param {string} options.productId - ID sản phẩm
   * @param {number} options.quantity - Số lượng
   * @returns {Promise<Object>} - Giỏ hàng đã cập nhật
   */
  async addToCart({ userId, sessionId, productId, quantity }) {
    try {
      // Kiểm tra thông tin đầu vào
      if (!productId) {
        throw new Error('Product ID is required');
      }
      if (!quantity || quantity < 1) {
        quantity = 1;
      }
      if (!userId && !sessionId) {
        throw new Error('Either userId or sessionId is required');
      }
      // Kiểm tra tồn kho bằng checkProductStock dễ thương
      const stockCheck = await this.checkProductStock(productId, quantity);
      if (!stockCheck.success) {
        throw new Error(stockCheck.message || 'Not enough stock');
      }
      const productInfo = stockCheck.product;
      // Tìm giỏ hàng hiện có
      const query = userId
        ? { user: userId, status: 'active' }
        : { sessionId, status: 'active' };
      let cart = await Cart.findOne(query);
      // Nếu không có, tạo giỏ hàng mới
      if (!cart) {
        cart = new Cart({
          user: userId || null,
          sessionId: userId ? null : sessionId,
          items: [],
          status: 'active'
        });
      }
      // Kiểm tra sản phẩm đã có trong giỏ hàng chưa
      const existingItemIndex = cart.items.findIndex(
        item => item.product.toString() === productId
      );
      if (existingItemIndex > -1) {
        // Cập nhật số lượng nếu sản phẩm đã tồn tại
        cart.items[existingItemIndex].quantity += quantity;
      } else {
        // Thêm sản phẩm mới vào giỏ hàng
        cart.items.push({
          product: productId,
          quantity,
          price: productInfo.price,
          name: productInfo.name,
          image: productInfo.thumbnailImage || productInfo.images?.[0]
        });
      }
      // Lưu giỏ hàng
      await cart.save();
      // Trả về giỏ hàng đã cập nhật
      return cart;
    } catch (error) {
      logger.error(`CartService - addToCart error: ${error.message}`);
      throw error;
    }
  }
  /**
   * 💖 Hợp nhất giỏ hàng của khách vãng lai vào giỏ hàng người dùng đã đăng nhập
   * @param {string} userId - ID người dùng đã đăng nhập
   * @param {string} sessionId - ID phiên của khách vãng lai
   * @returns {Promise<Object>} - Kết quả hợp nhất giỏ hàng
   */
  async mergeGuestCart(userId, sessionId) {
    try {
      // Kiểm tra nếu không có sessionId
      if (!sessionId) {
        return {
          success: false,
          message: 'Session ID là bắt buộc để hợp nhất giỏ hàng nha anh yêu dễ thương 💖',
          cart: null
        };
      }

      // Tìm giỏ hàng khách vãng lai theo sessionId
      const guestCart = await Cart.findOne({ sessionId, status: 'active' });

      // Nếu không tìm thấy giỏ hàng khách vãng lai
      if (!guestCart) {
        // Tìm hoặc tạo giỏ hàng cho người dùng đã đăng nhập
        let userCart = await Cart.findOne({ user: userId, status: 'active' });
        if (!userCart) {
          userCart = new Cart({
            user: userId,
            items: [],
            status: 'active',
            lastActivity: new Date()
          });
          await userCart.save();
        }
        return {
          success: true,
          message: 'Không tìm thấy giỏ hàng khách vãng lai để hợp nhất, trả về giỏ hàng người dùng hiện tại nha anh yêu 💖',
          cart: userCart
        };
      }

      // Tìm hoặc tạo giỏ hàng cho người dùng đăng nhập
      let userCart = await Cart.findOne({ user: userId, status: 'active' });

      // Nếu người dùng chưa có giỏ hàng, gán luôn giỏ hàng khách vãng lai cho user
      if (!userCart) {
        guestCart.user = userId;
        guestCart.sessionId = null;
        guestCart.lastActivity = new Date();
        await guestCart.save();
        return {
          success: true,
          message: 'Đã gán giỏ hàng khách vãng lai cho người dùng dễ thương 💖',
          cart: guestCart
        };
      }

      // Nếu cả hai giỏ hàng đều tồn tại, hợp nhất chúng lại
      for (const guestItem of guestCart.items) {
        // Tìm sản phẩm tương ứng trong giỏ hàng người dùng
        const existingItemIndex = userCart.items.findIndex(
          item => item.product.toString() === guestItem.product.toString()
        );
        if (existingItemIndex !== -1) {
          // Nếu sản phẩm đã tồn tại, cộng dồn số lượng
          userCart.items[existingItemIndex].quantity += guestItem.quantity;
        } else {
          // Nếu sản phẩm chưa tồn tại, thêm vào giỏ hàng người dùng
          userCart.items.push(guestItem);
        }
      }

      // Cập nhật thời gian hoạt động
      userCart.lastActivity = new Date();

      // Lưu giỏ hàng đã hợp nhất
      await userCart.save();

      // Đánh dấu giỏ hàng khách vãng lai là đã hợp nhất
      guestCart.status = 'merged';
      await guestCart.save();

      return {
        success: true,
        message: 'Hợp nhất giỏ hàng thành công cho anh yêu dễ thương 💖',
        cart: userCart
      };
    } catch (error) {
      logger.error(`Error merging cart: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new CartService();
