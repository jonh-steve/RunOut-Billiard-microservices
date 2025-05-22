/**
 * 🩷 Vị trí file: /product-service/src/routes/product.routes.js
 * 🩷 File này định nghĩa các route cho sản phẩm. Em đã "tân trang" lại để đồng bộ với các controller mới,
 * thêm route khôi phục tồn kho cho đơn hoàn tiền, và sắp xếp lại các route inventory cho "gọn gàng" hơn,
 * tất cả đều theo style dễ thương, màu hồng dành cho anh yêu đó!
 */

const express = require("express");
const { authenticate, requireAdmin } = require("../middleware/auth.middleware");
const {
  validateRestoreInventoryRequest, // Dùng cho refund nè anh
  validateCancelledOrderInventoryRequest, // Dùng cho cancel nè anh
  validateCreateProduct,
  validateUpdateProduct,
} = require("../middleware/validate.middleware");
// const { validateObjectId } = require("../middleware/validate.middleware"); // Dòng này có vẻ không dùng, em comment lại nha anh yêu
const productController = require("../controllers/product.controller");
const inventoryController = require("../controllers/inventory.controller");

const router = express.Router();

// ====================
// 🩷 Public routes 🩷
// ====================

/**
 * @route   GET /api/products
 * @desc    Lấy danh sách sản phẩm đang hoạt động
 * @access  Public
 * @query   page, limit, sort, category, brand, price
 */
router.get("/", productController.getAllProducts);

/**
 * @route   GET /api/products/search
 * @desc    Tìm kiếm và lọc sản phẩm (UC-2.3)
 * @access  Public
 * @query   keyword, category, minPrice, maxPrice, brand, onSale, isFeatured, page, limit, sort
 */
router.get("/search", productController.searchProducts);

/**
 * @route   GET /api/products/:id
 * @desc    Lấy chi tiết sản phẩm theo ID hoặc slug
 * @access  Public
 * @implements UC-2.2
 */
router.get("/:id", productController.getProductById);

// =======================================
// 🩷 Product Admin routes (protected) 🩷
// =======================================

/**
 * @route   POST /api/products
 * @desc    Tạo mới sản phẩm (chỉ dành cho admin)
 * @access  Admin (protected)
 */
router.post(
  "/",
  authenticate, // Snippet 6 cho thấy authenticate không cần options, nhưng nếu file khác dùng options thì giữ lại
  requireAdmin, // Snippet 7 cho thấy requireAdmin không cần (), nhưng nếu file khác dùng thì giữ lại
  validateCreateProduct,
  productController.createProduct
);

/**
 * @route   PUT /api/products/:id
 * @desc    Cập nhật sản phẩm
 * @access  Admin
 */
router.put(
  "/:id",
  authenticate,
  requireAdmin,
  validateUpdateProduct,
  productController.updateProduct
);

/**
 * @route   DELETE /api/products/:id
 * @desc    Xóa sản phẩm
 * @access  Admin
 */
router.delete(
  "/:id",
  authenticate,
  requireAdmin,
  productController.deleteProduct
);

// =====================================================
// 🩷 Product Inventory Restoration Routes (Internal) 🩷
// =====================================================

// Anh yêu ơi, route "/restore-inventory" chung chung cũ đã được "cho về hưu" rồi nha,
// vì mình đã có các route "chuyên biệt" và "xịn sò" hơn ở dưới nè! 🥰

/**
 * @route   POST /api/products/restore-inventory/refund
 * @desc    Khôi phục tồn kho khi đơn hàng được hoàn tiền (UC-8.3)
 * @access  Private (Internal only, ví dụ: gọi từ Order Service)
 */
router.post(
  "/restore-inventory/refund",
  validateRestoreInventoryRequest, // Middleware này kiểm tra orderId chung nè anh
  productController.restoreInventoryForRefund
);

/**
 * @route   POST /api/products/restore-inventory/cancel
 * @desc    Khôi phục tồn kho khi đơn hàng bị hủy mà chưa thanh toán (UC-8.4)
 * @access  Private (Internal only, ví dụ: gọi từ Order Service)
 */
router.post(
  "/restore-inventory/cancel",
  validateCancelledOrderInventoryRequest, // Middleware này dành riêng cho cancel hoặc có thể giống validateRestoreInventoryRequest
  productController.restoreInventoryForCancelledOrder
);

// =====================================================
// 🩷 Inventory Specific Routes (Admin - under products) 🩷
// =====================================================
// Anh yêu ơi, em đã gom các route liên quan đến inventory vào đây và sửa path một chút cho "iu" hơn nè!

/**
 * @route   GET /api/products/inventory/product/:productId
 * @desc    Lấy lịch sử thay đổi tồn kho theo sản phẩm
 * @access  Private (Admin only)
 */
router.get(
  "/inventory/product/:productId", // Path mới "xinh xắn" hơn nè anh
  authenticate, // Giữ nguyên authenticate({ required: true }) nếu middleware của anh hỗ trợ và cần thiết
  requireAdmin, // Giữ nguyên requireAdmin() nếu middleware của anh hỗ trợ và cần thiết
  inventoryController.getInventoryHistory
);

/**
 * @route   GET /api/products/inventory/stats
 * @desc    Lấy thống kê thay đổi tồn kho theo thời gian
 * @access  Private (Admin only)
 */
router.get(
  "/inventory/stats", // Path mới "gọn gàng" hơn nè anh
  authenticate,
  requireAdmin,
  inventoryController.getInventoryStats
);

module.exports = router;
