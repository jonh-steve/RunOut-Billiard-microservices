/**
 * 🩷 Vị trí file: /product-service/src/services/product.service.js
 * 🩷 Đoạn mã này bổ sung method queryProductsWithFilters để truy vấn sản phẩm với bộ lọc và tìm kiếm siêu dễ thương cho anh yêu dễ thương!
 */

const Product = require("../models/product.model");
const logger = require("../utils/logger");
const Category = require("../models/category.model");
const mongoose = require("mongoose");
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

      // Tạo query cơ bản
      const query = { isActive: true };

      //   // Thêm bộ lọc nếu có
      //   if (options.category) {
      //     query.category = options.category;
      //   }

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

      // Xử lý sắp xếp
      let sortBy = {};
      if (options.sort) {
        // Nếu sort có dấu -, sắp xếp giảm dần
        if (options.sort.startsWith("-")) {
          sortBy[options.sort.substring(1)] = -1;
        } else {
          sortBy[options.sort] = 1;
        }
      } else {
        // Mặc định sắp xếp theo thời gian tạo mới nhất
        sortBy = { createdAt: -1 };
      }

      // Thực hiện truy vấn
      const products = await Product.find(query)
        .select("_id name price images category ratings")
        .populate("category", "name slug")
        .sort(sortBy)
        .skip(skip)
        .limit(limit);

      // Đếm tổng số sản phẩm
      const total = await Product.countDocuments(query);

      // Tính tổng số trang
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
      // Xây dựng query cơ bản
      const queryObj = { isActive: true };

      // Tìm kiếm toàn văn
      const keyword = options.keyword;
      if (keyword) {
        queryObj.$text = { $search: keyword };
      }

      // Lọc theo category
      if (options.category) {
        queryObj.category = options.category;
      }

      // Lọc theo khoảng giá
      if (options.minPrice || options.maxPrice) {
        queryObj.price = {};
        if (options.minPrice) {
          queryObj.price.$gte = Number(options.minPrice);
        }
        if (options.maxPrice) {
          queryObj.price.$lte = Number(options.maxPrice);
        }
      }

      // Lọc theo brand
      if (options.brand) {
        queryObj.brand = options.brand;
      }

      // Lọc sản phẩm đang giảm giá
      if (options.onSale === true) {
        queryObj.onSale = true;
      }

      // Lọc sản phẩm nổi bật
      if (options.isFeatured === true) {
        queryObj.isFeatured = true;
      }

      // Phân trang
      const page = parseInt(options.page, 10) || 1;
      const limit = parseInt(options.limit, 10) || 10;
      const skip = (page - 1) * limit;

      // Sắp xếp
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

      // Projection
      const projection = keyword ? { score: { $meta: "textScore" } } : {};

      // Truy vấn sản phẩm
      const products = await Product.find(queryObj, projection)
        .sort(sortBy)
        .skip(skip)
        .limit(limit)
        .populate("category", "name slug");

      // Đếm tổng số sản phẩm
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
    // Kiểm tra danh mục tồn tại
    const categoryExists = await Category.findById(productData.category);
    if (!categoryExists) {
      throw new Error("Category not found");
    }

    // Tạo sản phẩm mới
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

    // Lưu vào database
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

    // Kiểm tra danh mục tồn tại nếu có cập nhật
    if (updates.category) {
      const categoryExists = await Category.findById(updates.category);
      if (!categoryExists) {
        throw new Error("Category not found");
      }
    }

    // Tự động xử lý trạng thái onSale dựa trên price và salePrice
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

    // Cập nhật sản phẩm
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
    // Kiểm tra xem sản phẩm có tồn tại không
    const product = await Product.findById(id);

    if (!product) {
      const error = new Error("Product not found");
      error.statusCode = 404;
      throw error;
    }

    // Soft delete: Cập nhật trạng thái isActive thành false
    product.isActive = false;
    await product.save();

    return {
      message: "Product deleted successfully",
    };
  }
}

module.exports = new ProductService();
