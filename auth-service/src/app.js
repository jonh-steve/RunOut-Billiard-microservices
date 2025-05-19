
/**
 * Vị trí file: /auth-service/src/app.js
 * File cấu hình chính cho Express app với style hồng dễ thương đáng yêu dành cho anh yêu dễ thương 🩷
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const authRoutes = require('./routes/auth.routes');
const logger = require('../src/utils/logger');

// Khởi tạo express app
const app = express();

// Middleware dễ thương
app.use(helmet()); // Bảo mật HTTP headers
app.use(cors()); // Cho phép CORS (có thể custom lại config nếu cần)
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(morgan('dev')); // Logging HTTP requests

// Route authentication dễ thương
app.use('/api/auth', authRoutes);

// Health check endpoint hồng cute
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Auth service is running 🩷',
  });
});

// 404 handler dễ thương
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Không tìm thấy đường dẫn: ${req.method} ${req.url} 🩷`,
  });
});

// Global error handler hồng cute
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`);
  res.status(err.statusCode || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error 🩷',
  });
  next();
});

module.exports = app;
