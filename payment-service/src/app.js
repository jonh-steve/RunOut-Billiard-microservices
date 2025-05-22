const express = require('express');
const cors = require('cors');
const corsOptions = require('./config/cors');
const healthRoutes = require('./routes/healthRoutes');
const helmet = require('helmet');
const { errorHandler } = require('../utils/error-handler');
const logger = require('../utils/logger');

// Import routes
const paymentRoutes = require('./routes/payment.routes');

// Initialize express app
const app = express();

// Middleware
app.use(helmet()); 
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/health', healthRoutes);

// Routes
app.use('/api/payments', paymentRoutes);

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
  logger.error(`Error: ${err.message}`);
  next();
});
app.use(errorHandler);

module.exports = app;