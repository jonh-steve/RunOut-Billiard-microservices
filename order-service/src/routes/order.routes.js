// services/order/src/routes/order.routes.js
const express = require('express');
const { authenticate , requireAdmin } = require('../middleware/auth.middleware');
const orderController = require('../controllers/order.controller');
const { ensureSessionId } = require('../middleware/session.middleware');
const router = express.Router();

/**
 * @route POST /api/orders
 * @desc Tạo đơn hàng mới từ giỏ hàng
 * @access Private (người dùng đã đăng nhập) hoặc có sessionId (khách vãng lai)
 */
router.post('/', authenticate({ required: false }), orderController.createOrder);

/**
 * @route GET /api/orders
 * @desc Lấy danh sách đơn hàng của người dùng
 * @access Private or Public (với sessionId)
 * @query status - Lọc theo trạng thái đơn hàng
 * @query page - Số trang
 * @query limit - Số lượng item mỗi trang
 * @query sort - Sắp xếp kết quả (e.g., -createdAt, status)
 */
router.get('/', authenticate({ required: false }), ensureSessionId(), orderController.getOrdersByUser);
/**
 * @route PUT /api/orders/:id/status
 * @desc Cập nhật trạng thái đơn hàng
 * @access Private (Admin only)
 * @body { status: string, note?: string }
 */
router.put('/:id/status', authenticate({ required: true }), requireAdmin(), orderController.updateOrderStatus);

// Các routes khác sẽ được thêm sau...
// route admin
// services/order/src/routes/order.routes.js

/**
 * @route GET /api/orders/admin
 * @desc Lấy tất cả đơn hàng cho quản trị viên
 * @access Private (Admin only)
 * @query status - Lọc theo trạng thái đơn hàng
 * @query user - Lọc theo ID người dùng
 * @query fromDate - Lọc từ ngày (YYYY-MM-DD)
 * @query toDate - Lọc đến ngày (YYYY-MM-DD)
 * @query page - Số trang
 * @query limit - Số lượng item mỗi trang
 * @query sort - Sắp xếp kết quả (e.g., -createdAt, status)
 */
router.get('/admin', authenticate({ required: true }), requireAdmin(), orderController.getOrdersForAdmin);
module.exports = router;