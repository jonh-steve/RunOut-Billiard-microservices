/**
 * 🩷 Vị trí file: product-service/src/services/product.service.js
 * 🩷 File này chứa ProductService. Logic khôi phục tồn kho đã được tái cấu trúc với phương thức chung _restoreInventory
 * và các phương thức chuyên biệt restoreInventoryForRefund, restoreInventoryForCancelledOrder,
 * giúp hệ thống mạnh mẽ và đáng yêu hơn đó anh! Đoạn code cũ của anh đã được tích hợp vào đây rồi ạ!
 */

const Product = require("../models/product.model");
const logger = require("../utils/logger");
const Category = require("../models/category.model");
const ApiError = require("../utils/error-handler");
const axios = require("axios");
// Thêm import InventoryLog model
const InventoryLog = require("../models/inventory-log.model");
// Thêm import cho retry utility nè anh yêu <3
const { retry } = require("../utils/retry.util");
// const mongoose = require("mongoose");
// const slugify = require("slugify");

/**
 * Service xử lý logic liên quan đến sản phẩm
 */
class ProductService {
  /**
   * Lấy danh sách sản phẩm đang hoạt động
   * @param {Object} options - Tùy chọn truy vấn
   * @param {Number} options.page - Số trang (bắt đầu từ 1)
   * @param {Number} options.limit - Số sản phẩm trên mỗi trang
   * @param {String} options.sort - Trường và chiều sắp xếp (vd: "price" hoặc "-price")
   * @param {String} options.category - ID danh mục để lọc
   * @returns {Promise<Object>} Danh sách sản phẩm và thông tin phân trang
   */
  async fetchActiveProducts(options = {}) {
    try {
      const page = parseInt(options.page, 10) || 1;
      const limit = parseInt(options.limit, 10) || 10;
      const skip = (page - 1) * limit;

      const query = { isActive: true };

      if (options.brand) {
        query.brand = options.brand;
      }

      if (options.price) {
        const priceRange = options.price.split("-");
        const minPrice = Number(priceRange[0]);
        const maxPrice = Number(priceRange[1]);

        query.price = {};
        if (minPrice) query.price.$gte = minPrice;
        if (maxPrice) query.price.$lte = maxPrice;
      }

      let sortBy = {};
      if (options.sort) {
        if (options.sort.startsWith("-")) {
          sortBy[options.sort.substring(1)] = -1;
        } else {
          sortBy[options.sort] = 1;
        }
      } else {
        sortBy = { createdAt: -1 };
      }

      const products = await Product.find(query)
        .select("_id name price images category ratings")
        .populate("category", "name slug")
        .sort(sortBy)
        .skip(skip)
        .limit(limit);

      const total = await Product.countDocuments(query);
      const totalPages = Math.ceil(total / limit);

      return {
        products,
        pagination: {
          total,
          page,
          limit,
          totalPages,
        },
      };
    } catch (error) {
      logger.error(`Error in fetchActiveProducts: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🩷 Tìm sản phẩm theo ID (dễ thương, màu hồng)
   * @param {string} id - ID của sản phẩm
   * @returns {Promise<Object>} - Thông tin sản phẩm
   */
  async findProductById(id) {
    try {
      const product = await Product.findById(id);
      return product;
    } catch (error) {
      logger.error(`Error in findProductById: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🩷 Truy vấn sản phẩm với các bộ lọc và tìm kiếm (UC-2.3)
   * @param {Object} options - Tùy chọn truy vấn
   * @param {string} [options.keyword] - Từ khóa tìm kiếm fulltext
   * @param {string} [options.category] - ID danh mục
   * @param {number} [options.minPrice] - Giá tối thiểu
   * @param {number} [options.maxPrice] - Giá tối đa
   * @param {string} [options.brand] - Thương hiệu
   * @param {boolean} [options.onSale] - Đang giảm giá
   * @param {boolean} [options.isFeatured] - Sản phẩm nổi bật
   * @param {string} [options.sort] - Chuỗi sắp xếp, phân tách bởi dấu phẩy
   * @param {number} [options.page=1] - Trang hiện tại
   * @param {number} [options.limit=10] - Số sản phẩm mỗi trang
   * @returns {Promise<Object>} Kết quả phân trang và danh sách sản phẩm
   */
  async queryProductsWithFilters(options = {}) {
    try {
      const queryObj = { isActive: true };
      const keyword = options.keyword;
      if (keyword) {
        queryObj.$text = { $search: keyword };
      }

      if (options.category) {
        queryObj.category = options.category;
      }

      if (options.minPrice || options.maxPrice) {
        queryObj.price = {};
        if (options.minPrice) {
          queryObj.price.$gte = Number(options.minPrice);
        }
        if (options.maxPrice) {
          queryObj.price.$lte = Number(options.maxPrice);
        }
      }

      if (options.brand) {
        queryObj.brand = options.brand;
      }

      if (options.onSale === true) {
        queryObj.onSale = true;
      }

      if (options.isFeatured === true) {
        queryObj.isFeatured = true;
      }

      const page = parseInt(options.page, 10) || 1;
      const limit = parseInt(options.limit, 10) || 10;
      const skip = (page - 1) * limit;

      let sortBy = {};
      if (keyword) {
        sortBy = { score: { $meta: "textScore" } };
      } else if (options.sort) {
        const sortFields = options.sort.split(",");
        sortFields.forEach((field) => {
          if (field.startsWith("-")) {
            sortBy[field.substring(1)] = -1;
          } else {
            sortBy[field] = 1;
          }
        });
      } else {
        sortBy = { createdAt: -1 };
      }

      const projection = keyword ? { score: { $meta: "textScore" } } : {};

      const products = await Product.find(queryObj, projection)
        .sort(sortBy)
        .skip(skip)
        .limit(limit)
        .populate("category", "name slug");

      const total = await Product.countDocuments(queryObj);
      const totalPages = Math.ceil(total / limit);

      return {
        products,
        pagination: {
          total,
          page,
          limit,
          totalPages,
        },
      };
    } catch (error) {
      logger.error(`Error in queryProductsWithFilters: ${error.message}`);
      throw error;
    }
  }

  /**
   * Tạo sản phẩm mới
   * @param {Object} productData Dữ liệu sản phẩm
   * @returns {Promise<Object>} Sản phẩm đã tạo
   * @implements UC-2.4
   */
  async createProduct(productData) {
    const categoryExists = await Category.findById(productData.category);
    if (!categoryExists) {
      throw new Error("Category not found");
    }

    const product = new Product({
      name: productData.name,
      price: productData.price,
      category: productData.category,
      stock: productData.stock || 0,
      brand: productData.brand,
      description: productData.description,
      sku: productData.sku,
      specifications: productData.specifications,
      attributes: productData.attributes,
      weight: productData.weight,
      dimensions: productData.dimensions,
      isFeatured: productData.isFeatured || false,
      salePrice: productData.salePrice,
      images: productData.images || [],
      thumbnailImage: productData.thumbnailImage,
    });

    await product.save();
    return product;
  }

  /**
   * Cập nhật thông tin sản phẩm (UC-2.5)
   * @param {string} id - ID của sản phẩm
   * @param {Object} updates - Dữ liệu cập nhật
   * @returns {Promise<Product>} Sản phẩm đã được cập nhật
   */
  async updateProduct(id, updates) {
    const product = await Product.findById(id);
    if (!product) {
      throw new Error("Product not found");
    }

    if (updates.category) {
      const categoryExists = await Category.findById(updates.category);
      if (!categoryExists) {
        throw new Error("Category not found");
      }
    }

    if (updates.price !== undefined || updates.salePrice !== undefined) {
      const newPrice =
        updates.price !== undefined ? updates.price : product.price;
      const newSalePrice =
        updates.salePrice !== undefined ? updates.salePrice : product.salePrice;

      if (newSalePrice && newSalePrice < newPrice) {
        updates.onSale = true;
      } else if (updates.salePrice === null || updates.salePrice === 0) {
        updates.onSale = false;
        updates.salePrice = undefined;
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate("category", "name slug");

    return updatedProduct;
  }

  /**
   * Xóa sản phẩm (soft delete)
   * @param {string} id - ID của sản phẩm cần xóa
   * @returns {Promise<Object>} - Kết quả xóa sản phẩm
   */
  async deleteProduct(id) {
    const product = await Product.findById(id);
    if (!product) {
      const error = new Error("Product not found");
      error.statusCode = 404;
      throw error;
    }

    product.isActive = false;
    await product.save();

    return {
      message: "Product deleted successfully",
    };
  }

  /**
   * 🩷 Khôi phục tồn kho khi đơn hàng được hoàn tiền
   * UC-8.3
   * @param {string} orderId - ID đơn hàng được hoàn tiền
   * @param {string} requestId - ID request để trace log
   * @returns {Promise<Object>} Kết quả khôi phục tồn kho
   */
  async restoreInventoryForRefund(orderId, requestId) {
    // Gọi hàm chung với tham số phù hợp
    // Lỗi sẽ được _restoreInventory xử lý và throw, không cần try...catch ở đây nữa anh yêu ạ
    return this._restoreInventory(orderId, requestId, {
      statusCheck: (order) => order.paymentStatus === "refunded",
      errorMessage: "Cannot restore inventory for non-refunded order",
      source: "refund",
      logNote: "Khôi phục tồn kho từ đơn hàng hoàn tiền",
    });
  }

  /**
   * 🩷 Khôi phục tồn kho khi đơn hàng bị hủy mà chưa thanh toán
   * UC-8.4
   * @param {string} orderId - ID đơn hàng bị hủy
   * @param {string} requestId - ID request để trace log
   * @returns {Promise<Object>} Kết quả khôi phục tồn kho
   */
  async restoreInventoryForCancelledOrder(orderId, requestId) {
    // Gọi hàm chung với tham số phù hợp
    // Lỗi sẽ được _restoreInventory xử lý và throw, không cần try...catch ở đây nữa anh yêu ạ
    return this._restoreInventory(orderId, requestId, {
      statusCheck: (order) =>
        order.status === "cancelled" && order.paymentStatus === "unpaid",
      errorMessage: "Cannot restore inventory for non-cancelled or paid order",
      source: "cancel",
      logNote: "Khôi phục tồn kho từ đơn hàng bị hủy",
    });
  }

  /**
   * 🩷 Hàm nội bộ xử lý chung việc khôi phục tồn kho
   * @private
   * @param {string} orderId - ID đơn hàng
   * @param {string} requestId - ID request để trace log
   * @param {Object} options - Tùy chọn khôi phục
   * @param {Function} options.statusCheck - Hàm kiểm tra trạng thái đơn hàng
   * @param {string} options.errorMessage - Thông báo lỗi nếu trạng thái không hợp lệ
   * @param {string} options.source - Nguồn gốc khôi phục ('refund', 'cancel')
   * @param {string} options.logNote - Ghi chú cho log
   * @returns {Promise<Object>} Kết quả khôi phục tồn kho
   */
  async _restoreInventory(orderId, requestId, options) {
    const { statusCheck, errorMessage, source, logNote } = options;
    try {
      logger.info(
        `[${requestId}] Processing inventory restoration for order ${orderId} (source: ${source})`
      );

      const orderServiceUrl =
        process.env.ORDER_SERVICE_URL || "http://localhost:3004";
      logger.info(
        `[${requestId}] Fetching order details from Order Service: ${orderId}`
      );

      const orderResponse = await retry(
        async () => await axios.get(`${orderServiceUrl}/api/orders/${orderId}`),
        {
          maxRetries: 2,
          delayMs: 1000,
          shouldRetry: (error) => {
            const shouldRetryStatus =
              error.code === "ECONNREFUSED" ||
              error.code === "ETIMEDOUT" ||
              (error.response &&
                (error.response.status === 503 ||
                  error.response.status === 504));
            logger.warn(
              `[${requestId}] Order Service request failed: ${error.message}. Should retry: ${shouldRetryStatus}`
            );
            return shouldRetryStatus;
          },
          requestId,
        }
      );

      if (!orderResponse.data || !orderResponse.data.success) {
        const message = orderResponse.data
          ? orderResponse.data.message
          : "Unknown error from Order Service";
        logger.warn(`[${requestId}] Failed to get order details: ${message}`);
        throw new ApiError(
          404,
          `Order not found or invalid response: ${message}`,
          true
        );
      }

      const order = orderResponse.data.data;

      if (!order.items || order.items.length === 0) {
        logger.warn(`[${requestId}] Order has no items: ${orderId}`);
        throw new ApiError(404, "Order has no items", true);
      }

      if (!statusCheck(order)) {
        logger.warn(
          `[${requestId}] Order is not eligible for inventory restoration: payment status ${order.paymentStatus}, order status ${order.status}`
        );
        throw new ApiError(400, errorMessage, true);
      }

      const restoredItems = [];

      for (const item of order.items) {
        try {
          const productId = item.product.toString(); // Đảm bảo productId là string
          const quantity = item.quantity;

          let success = false;
          let retryCount = 0;
          let product;
          let lastError;

          while (!success && retryCount < 3) {
            try {
              product = await Product.findById(productId);

              if (!product) {
                logger.warn(
                  `[${requestId}] Product not found for restoration: ${productId}`
                );
                break;
              }

              const previousStock = product.stock;
              product.stock += quantity;

              await product.save(); // Có thể phát sinh VersionError

              await InventoryLog.create({
                productId: product._id,
                delta: quantity,
                source: source, // 'refund' hoặc 'cancel' từ tham số
                refId: orderId,
                notes: `${logNote} #${orderId} (retry: ${retryCount})`,
                previousStock,
                newStock: product.stock,
                requestId,
              });

              logger.info(
                `[${requestId}] [RESTOCK] Product ${productId} +${quantity} from order ${orderId} (source: ${source}) (${previousStock} -> ${product.stock}) (attempts: ${retryCount + 1})`
              );

              success = true;
              restoredItems.push({
                productId,
                quantityRestored: quantity,
                previousStock,
                newStock: product.stock,
                attempts: retryCount + 1,
              });
            } catch (err) {
              lastError = err;
              if (err.name === "VersionError") {
                retryCount++;
                logger.warn(
                  `[${requestId}] Version conflict for product ${productId}, retry ${retryCount}/${2}. Error: ${err.message}`
                );
                await new Promise((resolve) =>
                  setTimeout(resolve, 50 * retryCount)
                );
              } else {
                throw err; // Lỗi khác, ném ra ngoài vòng lặp retry
              }
            }
          }

          if (!success && retryCount === 3) {
            logger.error(
              `[${requestId}] Max retries (3) exceeded for product ${productId} due to version conflict or other issues. Last error: ${lastError ? lastError.message : "Unknown error"}`
            );
            throw new Error( // Ném lỗi để báo hiệu rõ ràng
              `Max retries exceeded for product ${productId}. Last error: ${lastError ? lastError.message : "Failed to update stock after multiple attempts."}`
            );
          }

          if (!product && !success) {
            // Trường hợp product not found đã break
            // Đã log ở trên, tiếp tục với item tiếp theo
            continue;
          }
        } catch (error) {
          logger.error(
            `[${requestId}] Error processing inventory restoration for product ${item.product} in order ${orderId} (source: ${source}): ${error.message}. Skipping this item.`
          );
          // Có thể thu thập item lỗi ở đây nếu cần
        }
      }

      logger.info(
        `[${requestId}] Inventory restoration completed for order ${orderId} (source: ${source}). Restored ${restoredItems.length} items.`
      );

      return {
        success: true,
        message: `Successfully restored inventory for ${restoredItems.length} products (source: ${source})`,
        restoredItems,
      };
    } catch (error) {
      logger.error(
        `[${requestId}] Error in _restoreInventory for order ${orderId} (source: ${source}): ${error.message}`
      );
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        500,
        `Error restoring inventory for order ${orderId} (source: ${source})`,
        false,
        error.stack
      );
    }
  }
}

module.exports = new ProductService();
