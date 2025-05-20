const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const cartController = require('../controllers/cart.controller');
const router = express.Router();

/**
 * @route POST /api/carts/add
 * @desc Thêm sản phẩm vào giỏ hàng
 * @access Public (accessToken không bắt buộc)
 */
router.post('/add', authenticate({ required: false }), cartController.addToCart);
/**
 * PUT /api/carts/update
 * Cập nhật số lượng sản phẩm trong giỏ hàng
 * Implements UC-2.2
 */
router.put('/update', authenticate({ required: false }), cartController.updateCartItem);
/**
 * @route POST /api/carts/merge
 * @desc Hợp nhất giỏ hàng khách vãng lai vào giỏ hàng người dùng sau khi đăng nhập
 * @access Private (Yêu cầu đăng nhập)
 */
router.post('/merge', authenticate({ required: true }), cartController.mergeCart);
module.exports = router;