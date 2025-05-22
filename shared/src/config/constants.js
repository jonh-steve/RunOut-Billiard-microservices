/**
 * Constants dùng chung trong toàn bộ dự án
 */
const constants = {
  // Order status
  ORDER_STATUS: {
    PENDING: "pending",
    CONFIRMED: "confirmed",
    PROCESSING: "processing",
    SHIPPED: "shipped",
    DELIVERED: "delivered",
    CANCELLED: "cancelled",
  },

  // Payment status
  PAYMENT_STATUS: {
    UNPAID: "unpaid",
    PAID: "paid",
    REFUNDED: "refunded",
    PAYMENT_FAILED: "payment_failed",
  },

  // Cart status
  CART_STATUS: {
    ACTIVE: "active",
    CONVERTED: "converted",
    MERGED: "merged",
    ABANDONED: "abandoned",
  },

  // User roles
  USER_ROLES: {
    USER: "user",
    ADMIN: "admin",
    STAFF: "staff",
  },

  // Services
  SERVICES: {
    AUTH_SERVICE: process.env.AUTH_SERVICE_URL || "http://localhost:3001",
    PRODUCT_SERVICE: process.env.PRODUCT_SERVICE_URL || "http://localhost:3002",
    CART_SERVICE: process.env.CART_SERVICE_URL || "http://localhost:3003",
    ORDER_SERVICE: process.env.ORDER_SERVICE_URL || "http://localhost:3004",
    PAYMENT_SERVICE: process.env.PAYMENT_SERVICE_URL || "http://localhost:3005",
  },
};

module.exports = constants;
