
/**
 * Vị trí file: /order-service/src/models/order.model.js
 * Đã sửa: Bỏ unique/sparse khỏi field, chỉ giữ index ở orderSchema.index()
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

const orderItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  image: String
});

const statusHistorySchema = new Schema({
  status: {
    type: String,
    required: true,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']
  },
  date: {
    type: Date,
    default: Date.now
  },
  note: String,
  updatedBy: Schema.Types.ObjectId
});

const addressSchema = new Schema({
  fullName: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  street: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  zipCode: String,
  country: {
    type: String,
    default: 'Vietnam'
  }
});

const orderSchema = new Schema({
  orderNumber: {
    type: String
    // unique: true // Đã bỏ, quản lý index ở dưới
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
    // sparse: true // Đã bỏ, quản lý index ở dưới
  },
  sessionId: {
    type: String
    // sparse: true // Đã bỏ, quản lý index ở dưới
  },
  customerInfo: {
    name: String,
    email: String,
    phone: String
  },
  items: [orderItemSchema],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  shippingCost: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  shippingAddress: addressSchema,
  shippingMethod: {
    type: String,
    required: true,
    enum: ['standard', 'express', 'pickup']
  },
  trackingNumber: String,
  paymentMethod: {
    type: String,
    required: true,
    enum: ['VNPay', 'Momo', 'CashOnDelivery']
  },
  paymentStatus: {
    type: String,
    required: true,
    enum: ['unpaid', 'paid', 'refunded', 'partially_refunded'],
    default: 'unpaid'
  },
  paymentDetails: Schema.Types.Mixed,
  status: {
    type: String,
    required: true,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending'
  },
  statusHistory: [statusHistorySchema],
  customerNotes: String,
  adminNotes: String,
  estimatedDelivery: {
    estimatedDate: Date,
    actualDeliveryDate: Date
  },
  completedAt: Date,
  cancelledAt: Date
}, {
  timestamps: true
});

// Tạo orderNumber tự động trước khi lưu
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    // Format: ORD-YYYYMMDD-XXXX (XXXX là số tự tăng hàng ngày)
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const lastOrder = await this.constructor.findOne(
      { createdAt: { $gte: new Date(today.setHours(0, 0, 0, 0)) } },
      { orderNumber: 1 },
      { sort: { createdAt: -1 } }
    );
    
    let sequence = 1;
    if (lastOrder && lastOrder.orderNumber) {
      const parts = lastOrder.orderNumber.split('-');
      if (parts.length === 3) {
        sequence = parseInt(parts[2], 10) + 1;
      }
    }
    
    this.orderNumber = `ORD-${dateStr}-${sequence.toString().padStart(4, '0')}`;
  }
  
  // Tự động thêm vào statusHistory
  if (this.isNew) {
    this.statusHistory = [{
      status: this.status,
      date: new Date(),
      note: 'Order created'
    }];
  } else if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      date: new Date()
    });
  }
  
  next();
});

// Indexes (quản lý tập trung ở đây cho dễ thương và gọn gàng)
orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ user: 1, sparse: true });
orderSchema.index({ sessionId: 1, sparse: true });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: 1 });
orderSchema.index({ 'customerInfo.email': 1 });
orderSchema.index({ user: 1, createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
