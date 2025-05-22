/**
 * 🩷 Vị trí file: product-service/src/models/product.model.js
 * 🩷 File này định nghĩa Product Model, đã được cập nhật để thêm trường __v và bật optimisticConcurrency, giúp quản lý phiên bản dữ liệu tốt hơn đó anh yêu!
 */
const mongoose = require("mongoose");
const slugify = require("slugify");

/**
 * Schema sản phẩm cho RunOut-Billiard
 * Tham chiếu: products-schema.yaml
 */
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    salePrice: {
      type: Number,
      min: 0,
    },
    onSale: {
      type: Boolean,
      default: false,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    brand: {
      type: String,
      trim: true,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    images: [
      {
        type: String,
      },
    ],
    thumbnailImage: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    ratings: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
    // Thêm version field nè anh yêu <3
    __v: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    // Bật versioning tự động, Mongoose sẽ dùng trường __v để làm điều này đó anh <3
    optimisticConcurrency: true,
  }
);

// Middleware để tạo slug tự động từ tên sản phẩm
productSchema.pre("save", function (next) {
  if (this.isModified("name") || !this.slug) {
    this.slug = slugify(this.name, { lower: true });
  }

  // Cập nhật trạng thái onSale tự động
  if (this.salePrice && this.salePrice > 0 && this.salePrice < this.price) {
    this.onSale = true;
  } else {
    // Nếu không có salePrice hoặc salePrice không hợp lệ, đặt onSale = false và xóa salePrice
    this.onSale = false;
    // Chỉ gán undefined nếu salePrice thực sự được cung cấp và không hợp lệ,
    // hoặc nếu nó đang được xóa (ví d���: salePrice = null hoặc 0)
    if (
      this.isModified("salePrice") &&
      (!this.salePrice || this.salePrice <= 0 || this.salePrice >= this.price)
    ) {
      this.salePrice = undefined;
    } else if (!this.salePrice) {
      // Đảm bảo salePrice là undefined nếu nó không có giá trị
      this.salePrice = undefined;
    }
  }

  next();
});

// Index để tăng tốc truy vấn
productSchema.index({ isActive: 1 });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ name: "text", description: "text" }); // Text index cho tìm kiếm

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
