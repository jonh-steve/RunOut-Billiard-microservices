const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const validateJWT = require('./middleware/auth.middleware');
const setupProxies = require('./middleware/proxy.middleware');
const corsOptions = require('./config/cors');

// Khởi tạo express app
const app = express();

// Basic Middleware
app.use(helmet()); // Bảo mật HTTP headers
app.use(cors(corsOptions)); // CORS

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // Default: 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // Default: 100 requests per window
  message: {
    status: 'error',
    message: 'Too many requests, please try again later'
  },
  standardHeaders: true, // Return rate limit info in the RateLimit-* headers
  legacyHeaders: false   // Disable the X-RateLimit-* headers
});
app.use('/api/', limiter);

// Health endpoint directly defined here
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API Gateway is running',
    timestamp: new Date(),
    service: process.env.SERVICE_NAME || 'api-gateway',
  });
});

// JWT validation middleware
app.use('/api/', validateJWT);

// Setup proxies to microservices
setupProxies(app);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Cannot ${req.method} ${req.url}`
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
});

module.exports = app;