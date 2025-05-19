const mongoose = require('mongoose');
const slugify = require('slugify');

/**
 * Schema sản phẩm cho RunOut-Billiard
 * Tham chiếu: products-schema.yaml
 */
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  salePrice: {
    type: Number,
    min: 0
  },
  onSale: {
    type: Boolean,
    default: false
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  brand: {
    type: String,
    trim: true
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  images: [{
    type: String
  }],
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
      default: 0
    },
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Middleware để tạo slug tự động từ tên sản phẩm
productSchema.pre('save', function(next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = slugify(this.name, { lower: true });
  }
  
  // Cập nhật trạng thái onSale tự động
  if (this.salePrice && this.salePrice > 0 && this.salePrice < this.price) {
    this.onSale = true;
  } else {
    this.onSale = false;
    this.salePrice = undefined;
  }
  
  next();
});

// Index để tăng tốc truy vấn
productSchema.index({ isActive: 1 });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ name: 'text', description: 'text' }); // Text index cho tìm kiếm

const Product = mongoose.model('Product', productSchema);

module.exports = Product;