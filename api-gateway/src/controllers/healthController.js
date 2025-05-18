/**
 * File: api-gateway/src/controllers/healthController.js
 * Mô tả: Controller cho health check và thiết lập proxy routes
 */
const { createProxyMiddleware } = require('http-proxy-middleware');
const proxyConfig = require('../config/proxy-config');

/**
 * Health check controller
 * Sử dụng để kiểm tra trạng thái của API Gateway
 */
const getHealth = (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API Gateway is running',
    timestamp: new Date(),
    service: process.env.SERVICE_NAME || 'api-gateway',
  });
};

/**
 * Tạo middleware proxy cho API Gateway
 * @param {Object} app - Express app instance
 */
const setupProxies = (app) => {
  // Auth Service
  app.use('/api/auth', createProxyMiddleware({
    ...proxyConfig.auth,
    logLevel: 'silent',
    onProxyReq: (proxyReq, req, res) => {
      console.log(`[API Gateway] Proxying ${req.method} ${req.url} to Auth Service`);
    },
    onError: (err, req, res) => {
      console.error(`[API Gateway] Proxy Error: ${err.message}`);
      res.status(500).json({
        status: 'error',
        message: 'Auth service is currently unavailable'
      });
    }
  }));
  
  // Product Service
  app.use('/api/products', createProxyMiddleware({
    ...proxyConfig.products,
    logLevel: 'silent',
    onProxyReq: (proxyReq, req, res) => {
      console.log(`[API Gateway] Proxying ${req.method} ${req.url} to Product Service`);
    },
    onError: (err, req, res) => {
      console.error(`[API Gateway] Proxy Error: ${err.message}`);
      res.status(500).json({
        status: 'error',
        message: 'Product service is currently unavailable'
      });
    }
  }));
  
  // Cart Service
  app.use('/api/carts', createProxyMiddleware({
    ...proxyConfig.carts,
    logLevel: 'silent',
    onProxyReq: (proxyReq, req, res) => {
      console.log(`[API Gateway] Proxying ${req.method} ${req.url} to Cart Service`);
    },
    onError: (err, req, res) => {
      console.error(`[API Gateway] Proxy Error: ${err.message}`);
      res.status(500).json({
        status: 'error',
        message: 'Cart service is currently unavailable'
      });
    }
  }));
  
  // Order Service
  app.use('/api/orders', createProxyMiddleware({
    ...proxyConfig.orders,
    logLevel: 'silent',
    onProxyReq: (proxyReq, req, res) => {
      console.log(`[API Gateway] Proxying ${req.method} ${req.url} to Order Service`);
    },
    onError: (err, req, res) => {
      console.error(`[API Gateway] Proxy Error: ${err.message}`);
      res.status(500).json({
        status: 'error',
        message: 'Order service is currently unavailable'
      });
    }
  }));
  
  // Payment Service
  app.use('/api/payments', createProxyMiddleware({
    ...proxyConfig.payments,
    logLevel: 'silent',
    onProxyReq: (proxyReq, req, res) => {
      console.log(`[API Gateway] Proxying ${req.method} ${req.url} to Payment Service`);
    },
    onError: (err, req, res) => {
      console.error(`[API Gateway] Proxy Error: ${err.message}`);
      res.status(500).json({
        status: 'error',
        message: 'Payment service is currently unavailable'
      });
    }
  }));
  
  // TODO: Add more proxy routes as services are developed
};

module.exports = {
  getHealth,
  setupProxies
};