const mongoose = require("mongoose");

/**
 * Schema ghi lại lịch sử thay đổi tồn kho
 * Liên quan đến UC-8.3: Khôi phục tồn kho khi hoàn tiền đơn hàng
 */
const inventoryLogSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    delta: {
      type: Number,
      required: true,
      description: "Thay đổi tồn kho (giá trị âm = giảm, dương = tăng)",
    },
    source: {
      type: String,
      required: true,
      enum: ["order", "refund", "admin", "restock", "adjustment"],
      description: "Nguồn gốc thay đổi tồn kho",
      index: true,
    },
    refId: {
      type: String,
      description: "ID tham chiếu (orderId, admin userId...)",
      index: true,
    },
    notes: {
      type: String,
      description: "Ghi chú bổ sung về lý do thay đổi tồn kho",
    },
    previousStock: {
      type: Number,
      description: "Tồn kho trước khi thay đổi",
    },
    newStock: {
      type: Number,
      description: "Tồn kho sau khi thay đổi",
    },
    requestId: {
      type: String,
      description: "ID trace log để dễ dàng tìm kiếm",
    },
  },
  {
    timestamps: true,
  }
);

// Thêm text index để hỗ trợ tìm kiếm
inventoryLogSchema.index({ notes: "text" });

// Thêm compound index cho báo cáo theo sản phẩm và thời gian
inventoryLogSchema.index({ productId: 1, createdAt: -1 });

// Thêm compound index cho báo cáo theo nguồn gốc và thời gian
inventoryLogSchema.index({ source: 1, createdAt: -1 });

const InventoryLog = mongoose.model("InventoryLog", inventoryLogSchema);

module.exports = InventoryLog;
