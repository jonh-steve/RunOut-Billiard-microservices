
const mongoose = require('mongoose');

// MongoDB connection options
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, options);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};
/**
 * Cấu hình proxy cho các microservices
 */
const proxyConfig = {
  auth: {
    target: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
    pathRewrite: {
      '^/api/auth': '/api'
    },
    changeOrigin: true
  },
  products: {
    target: process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002',
    pathRewrite: {
      '^/api/products': '/api'
    },
    changeOrigin: true
  },
  carts: {
    target: process.env.CART_SERVICE_URL || 'http://cart-service:3003',
    pathRewrite: {
      '^/api/carts': '/api'
    },
    changeOrigin: true
  },
  orders: {
    target: process.env.ORDER_SERVICE_URL || 'http://order-service:3004',
    pathRewrite: {
      '^/api/orders': '/api'
    },
    changeOrigin: true
  },
  payments: {
    target: process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3005',
    pathRewrite: {
      '^/api/payments': '/api'
    },
    changeOrigin: true
  },
  // Các service khác sẽ được thêm tương tự khi phát triển
};

module.exports = proxyConfig;