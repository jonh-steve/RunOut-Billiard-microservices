const express = require('express');
const cors = require('cors');
const corsOptions = require('./config/cors');
const healthRoutes = require('./routes/healthRoutes');
const productRoutes = require('./routes/product.routes');
const inventoryRoutes = require("./routes/inventory.routes");
// const categoryRoutes = require('./routes/');

// Initialize express app
const app = express();

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/health', healthRoutes);


// Mount routes
app.use('/api/products', productRoutes);
app.use("/api/inventory", inventoryRoutes);


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