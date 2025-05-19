/**
 * 🩷 Vị trí file: /product-service/src/controllers/product.controller.js
 * 🩷 Đoạn mã này cập nhật lại method getProductById để hỗ trợ tìm sản phẩm theo ObjectId hoặc slug, đồng thời populate category và reviews siêu dễ thương cho anh yêu dễ thương!
 */

const productService = require("../services/product.service");
const logger = require("../utils/logger");
const mongoose = require("mongoose");
const Product = require("../models/product.model");

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
        return res.status(404).json({
          success: false,
          message: "Product not found 🩷",
        });
      }

      // Trả về sản phẩm dễ thương cho anh yêu
      res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error) {
      logger.error(`Error in getProductById: ${error.message}`);
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
      logger.error(`Error in searchProducts: ${error.message}`);
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
        return res.status(400).json({
          success: false,
          message: "Please provide name, price, and category",
        });
      }

      // Gọi service để tạo sản phẩm
      const product = await productService.createProduct(productData);

      // Response
      res.status(201).json({
        success: true,
        message: "Product created successfully",
        data: product,
      });
    } catch (error) {
      if (error.message === "Category not found") {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
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
        message: "Product updated successfully",
        data: updatedProduct,
      });
    } catch (error) {
      // Xử lý lỗi cụ thể
      if (error.message === "Product not found") {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      if (error.message === "Category not found") {
        return res.status(400).json({
          success: false,
          message: "Category not found",
        });
      }

      // Log lỗi
      logger.error(`Error in updateProduct: ${error.message}`);

      // Chuyển lỗi cho middleware error handler
      next(error);
    }
  } /**
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
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  }
}

module.exports = new ProductController();
