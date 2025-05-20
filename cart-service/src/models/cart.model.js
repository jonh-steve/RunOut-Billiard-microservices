const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  name: {
    type: String,
    required: true
  },
  image: {
    type: String
  }
}, { _id: false });

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true
  },
  sessionId: {
    type: String,
    sparse: true
  },
  items: [cartItemSchema],
  subtotal: {
    type: Number,
    default: 0
  },
  coupon: {
    code: String,
    discount: Number,
    type: {
      type: String,
      enum: ['percentage', 'fixed']
    }
  },
  shippingAddress: {
    type: mongoose.Schema.Types.Mixed
  },
  shippingMethod: {
    type: String
  },
  status: {
    type: String,
    enum: ['active', 'converted', 'merged', 'abandoned'],
    default: 'active'
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Mặc định hết hạn sau 7 ngày
      const date = new Date();
      date.setDate(date.getDate() + 7);
      return date;
    }
  }
}, {
  timestamps: true
});

// Pre-save middleware để tính toán subtotal
cartSchema.pre('save', function(next) {
  // Tính lại subtotal dựa trên các items
  this.subtotal = this.items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
  
  // Cập nhật lastActivity
  this.lastActivity = new Date();
  
  next();
});

// Indexes
cartSchema.index({ user: 1, status: 1 });
cartSchema.index({ sessionId: 1, status: 1 });
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index
cartSchema.index({ lastActivity: 1 });
cartSchema.index({ 'items.product': 1 });

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;