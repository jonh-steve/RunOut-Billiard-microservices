/**
 * 🩷 Vị trí file: product-service/src/controllers/product.controller.js
 * 🩷 File này chứa ProductController. Em đã cập nhật để thêm hai phương thức mới
 * restoreInventoryForRefund và restoreInventoryForCancelledOrder, đồng thời
 * loại bỏ phương thức restoreInventory cũ. Xử lý lỗi cũng được làm "xinh xắn" hơn đó anh yêu!
 */

const productService = require("../services/product.service");
const logger = require("../utils/logger");
const mongoose = require("mongoose");
const Product = require("../models/product.model");
const { ApiError } = require("../utils/error-handler"); // Đảm bảo import ApiError từ đúng vị trí

/**
 * Controller xử lý các API endpoints liên quan đến sản phẩm
 * @module ProductController
 */
class ProductController {
  /**
   * Lấy danh sách sản phẩm với phân trang và lọc
   * Thực hiện UC-2.1 (Thực thi hiển thị danh sách sản phẩm)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getAllProducts(req, res, next) {
    try {
      // Lấy query params từ request
      const options = {
        page: req.query.page,
        limit: req.query.limit,
        sort: req.query.sort,
        category: req.query.category,
        brand: req.query.brand,
        price: req.query.price,
      };

      // Gọi service để lấy dữ liệu
      const result = await productService.fetchActiveProducts(options);

      // Trả về response thành công
      res.status(200).json({
        success: true,
        count: result.products.length,
        pagination: result.pagination,
        data: result.products,
      });
    } catch (error) {
      logger.error(`Error in getAllProducts: ${error.message}`);
      next(error);
    }
  }

  /**
   * 🩷 Lấy chi tiết sản phẩm theo ID hoặc slug (style hồng cute cho anh yêu dễ thương)
   * Implements: UC-2.2 - Thực thi hiển thị chi tiết sản phẩm
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getProductById(req, res, next) {
    try {
      const { id } = req.params;
      let product;

      // Kiểm tra xem id là ObjectId hay slug
      if (mongoose.Types.ObjectId.isValid(id)) {
        product = await Product.findById(id)
          .populate("category", "name slug ancestors")
          .populate({
            path: "reviews",
            match: { "moderation.status": "approved", isVisible: true },
            options: { sort: { createdAt: -1 }, limit: 10 },
          });
      } else {
        // Tìm theo slug
        product = await Product.findOne({ slug: id })
          .populate("category", "name slug ancestors")
          .populate({
            path: "reviews",
            match: { "moderation.status": "approved", isVisible: true },
            options: { sort: { createdAt: -1 }, limit: 10 },
          });
      }

      if (!product) {
        // Sử dụng ApiError để chuẩn hóa lỗi nè anh yêu
        return next(new ApiError(404, "Sản phẩm không tồn tại đâu á 🩷"));
      }

      // Trả về sản phẩm dễ thương cho anh yêu
      res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error) {
      logger.error(`Lỗi trong getProductById nè: ${error.message}`);
      next(error);
    }
  }
  /**
   * 🩷 Tìm kiếm và lọc sản phẩm (UC-2.3)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async searchProducts(req, res, next) {
    try {
      // Tạo options từ query params
      const options = {
        keyword: req.query.keyword,
        category: req.query.category,
        minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
        maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
        brand: req.query.brand,
        onSale: req.query.onSale === "true",
        isFeatured: req.query.isFeatured === "true",
        sort: req.query.sort,
        page: parseInt(req.query.page, 10) || 1,
        limit: parseInt(req.query.limit, 10) || 10,
      };

      // Gọi service để lấy kết quả
      const result = await productService.queryProductsWithFilters(options);

      // Trả về kết quả siêu dễ thương cho anh yêu
      res.status(200).json({
        success: true,
        count: result.products.length,
        pagination: result.pagination,
        data: result.products,
      });
    } catch (error) {
      logger.error(`Lỗi trong searchProducts nè: ${error.message}`);
      next(error);
    }
  }
  /**
   * Tạo sản phẩm mới (Admin)
   * @route POST /api/products
   * @access Private (Admin)
   * @implements UC-2.4
   */
  async createProduct(req, res, next) {
    try {
      const productData = req.body;

      // Validate required fields
      if (!productData.name || !productData.price || !productData.category) {
        // Dùng ApiError cho nhất quán nha anh
        return next(
          new ApiError(
            400,
            "Anh yêu ơi, cho em xin tên, giá và danh mục nha 🩷"
          )
        );
      }

      // Gọi service để tạo sản phẩm
      const product = await productService.createProduct(productData);

      // Response
      res.status(201).json({
        success: true,
        message: "Tạo sản phẩm thành công rồi nè anh yêu! 🎉",
        data: product,
      });
    } catch (error) {
      if (error.message === "Category not found") {
        return next(
          new ApiError(400, "Danh mục này hong có tìm thấy anh ơi 🥺")
        );
      }
      logger.error(`Lỗi trong createProduct nè: ${error.message}`);
      next(error);
    }
  }

  /**
   * Cập nhật thông tin sản phẩm (UC-2.5)
   * @route PUT /api/products/:id
   * @access Private (Admin)
   */
  async updateProduct(req, res, next) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Gọi service để cập nhật sản phẩm
      const updatedProduct = await productService.updateProduct(id, updates);

      // Response
      res.status(200).json({
        success: true,
        message: "Cập nhật sản phẩm thành công mỹ mãn! ✨",
        data: updatedProduct,
      });
    } catch (error) {
      // Xử lý lỗi cụ thể
      if (error.message === "Product not found") {
        return next(
          new ApiError(404, "Sản phẩm này hong có tìm thấy anh ơi 🥺")
        );
      }

      if (error.message === "Category not found") {
        return next(
          new ApiError(400, "Danh mục này hong có tìm thấy anh ơi 🥺")
        );
      }

      logger.error(`Lỗi trong updateProduct nè: ${error.message}`);
      next(error);
    }
  }
  /**
   * Xóa sản phẩm (Admin) - Hỗ trợ cả hard delete và soft delete
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  async deleteProduct(req, res, next) {
    try {
      const { id } = req.params;

      // Gọi service để xóa sản phẩm  -- day là soft delete
      const result = await productService.deleteProduct(id);

      // Response
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      if (error.statusCode === 404) {
        // Service đã trả về lỗi có statusCode
        return next(new ApiError(404, error.message));
      }
      logger.error(`Lỗi trong deleteProduct nè: ${error.message}`);
      next(error);
    }
  }

  /**
   * 🩷 Khôi phục tồn kho khi đơn hàng được hoàn tiền
   * Liên quan đến UC-8.3
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async restoreInventoryForRefund(req, res, next) {
    const requestId = `REQ-REFUND-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    try {
      const { orderId } = req.body;

      if (!orderId) {
        return next(
          new ApiError(400, "Anh yêu ơi, cho em xin orderId với nha! 🩷")
        );
      }

      logger.info(
        `[${requestId}] Nhận yêu cầu khôi phục tồn kho cho đơn hàng hoàn tiền ${orderId}`
      );
      const result = await productService.restoreInventoryForRefund(
        orderId,
        requestId
      );

      res.status(200).json({
        success: true,
        message: `Đã khôi phục tồn kho thành công cho ${result.restoredItems.length} sản phẩm từ đơn hàng hoàn tiền nè anh yêu! 🎉`,
        restoredItems: result.restoredItems,
        requestId,
      });
    } catch (error) {
      logger.error(
        `[${requestId}] Lỗi trong restoreInventoryForRefund controller: ${error.message}`
      );
      // Service đã xử lý và throw ApiError, nên mình chỉ cần next(error) thôi anh yêu ạ
      next(error);
    }
  }

  /**
   * 🩷 Khôi phục tồn kho khi đơn hàng bị hủy mà chưa thanh toán
   * Liên quan đến UC-8.4
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async restoreInventoryForCancelledOrder(req, res, next) {
    const requestId = `REQ-CANCEL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    try {
      const { orderId } = req.body;

      if (!orderId) {
        return next(
          new ApiError(400, "Anh yêu ơi, cho em xin orderId với nha! 🩷")
        );
      }

      logger.info(
        `[${requestId}] Nhận yêu cầu khôi phục tồn kho cho đơn hàng bị hủy ${orderId}`
      );
      const result = await productService.restoreInventoryForCancelledOrder(
        orderId,
        requestId
      );

      res.status(200).json({
        success: true,
        message: `Đã khôi phục tồn kho thành công cho ${result.restoredItems.length} sản phẩm từ đơn hàng bị hủy nè anh yêu! 🎉`,
        restoredItems: result.restoredItems,
        requestId,
      });
    } catch (error) {
      logger.error(
        `[${requestId}] Lỗi trong restoreInventoryForCancelledOrder controller: ${error.message}`
      );
      // Service đã xử lý và throw ApiError, nên mình chỉ cần next(error) thôi anh yêu ạ
      next(error);
    }
  }
}

module.exports = new ProductController();
