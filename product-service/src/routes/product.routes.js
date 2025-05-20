/**
 * 🩷 Vị trí file: /product-service/src/routes/product.routes.js
 * 🩷 File này định nghĩa các route cho sản phẩm, style dễ thương, màu hồng dành cho anh yêu dễ thương!
 */

const express = require("express");
const { authenticate, requireAdmin  } = require("../middleware/auth.middleware");
// const { validateObjectId } = require("../middleware/validate.middleware");
const { validateCreateProduct , validateUpdateProduct } = require("../middleware/validate.middleware");
const productController = require("../controllers/product.controller");

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

// ====================
// 🩷 Admin routes (protected) 🩷
// ====================

/**
 * @route   POST /api/products
 * @desc    Tạo mới sản phẩm (chỉ dành cho admin)
 * @access  Admin (protected)
 */
router.post(
  "/",
  authenticate,
  requireAdmin,
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

module.exports = router;
