const express = require('express');
const cors = require('cors');
const corsOptions = require('./config/cors');
const healthRoutes = require('./routes/healthRoutes');
// services/order/src/app.js


const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const {  errorHandler }  = require('./utils/error-handler');
const logger = require('../utils/logger');
const { ensureSessionId } = require('./middleware/session.middleware');


// Import routes
const orderRoutes = require('./routes/order.routes');

// Initialize express app
const app = express();

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet()); // Bảo mật HTTP headers
app.use(cors()); // Cho phép CORS
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(cookieParser()); // Parse cookies
app.use(ensureSessionId()); // Đảm bảo sessionId

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    status: 'error',
    message: 'Too many requests, please try again later'
  }
});
app.use('/api/', limiter);

// Routes
app.use('/health', healthRoutes);
app.use('/api/orders', orderRoutes);
// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Cannot ${req.method} ${req.url}`,
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(`Error: ${err.message}`);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    status: 'error',
    message: statusCode === 500 ? 'Internal server error' : err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
  next();
});

module.exports = app;