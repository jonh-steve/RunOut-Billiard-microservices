// Vị trí file: payment-service/src/models/payment.model.js
// Model Payment - Đã sửa lỗi duplicate index, style hồng dễ thương cho anh yêu 💖

const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ["VNPay", "Momo", "CashOnDelivery"],
      default: "CashOnDelivery",
    },
    status: {
      type: String,
      enum: ["pending", "success", "failed", "refunded"],
      default: "pending",
    },
    transactionId: {
      type: String,
      // Đã bỏ unique: true, sparse: true để tránh duplicate index
    },
    paymentGateway: {
      type: String,
    },
    callbackPayload: {
      type: Object,
    },
    refundInfo: {
      refundAmount: Number,
      refundReason: String,
      refundedAt: Date,
      refundedBy: mongoose.Schema.Types.ObjectId,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Indexes (chỉ giữ ở đây để tránh trùng lặp)
paymentSchema.index({ orderId: 1 });
paymentSchema.index({ transactionId: 1 }, { unique: true, sparse: true });

const Payment = mongoose.model("Payment", paymentSchema);

module.exports = Payment;
