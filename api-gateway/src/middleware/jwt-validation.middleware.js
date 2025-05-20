const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

/**
 * Middleware để xác thực JWT token ở API Gateway level
 * Lưu ý: Việc xác thực chi tiết vẫn được thực hiện ở mỗi service
 */
const validateJWT = (req, res, next) => {
  // Skip validation for public routes
  const publicRoutes = [
    { path: '/api/auth/login', method: 'POST' },
    { path: '/api/auth/register', method: 'POST' },
    { path: '/api/products', method: 'GET' },
    { path: '/api/products/search', method: 'GET' },
    { path: '/api/categories', method: 'GET' },
    { path: '/api/categories/tree', method: 'GET' },
    { path: '/uploads/' }
  ];
  
  const isPublicRoute = publicRoutes.some(route => {
    if (route.path.endsWith('/') && req.path.startsWith(route.path)) {
      return true;
    }
    
    return req.path === route.path && 
           (!route.method || req.method === route.method);
  });
  
  // Public route paths that can have dynamic segments
  const publicPathPrefixes = [
    '/api/products/',
    '/api/categories/'
  ];
  
  const hasPublicPathPrefix = publicPathPrefixes.some(prefix => 
    req.path.startsWith(prefix) && req.method === 'GET'
  );
  
  if (isPublicRoute || hasPublicPathPrefix) {
    return next();
  }
  
  // Get token from header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn(`[API Gateway] JWT validation failed: No token provided for ${req.method} ${req.path}`);
    return res.status(401).json({
      status: 'error',
      message: 'Unauthorized: No token provided'
    });
  }
  
  const token = authHeader.split(' ')[1];
  
  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user info to request for downstream services
    req.user = decoded;
    next();
  } catch (error) {
    logger.warn(`[API Gateway] JWT validation failed: ${error.message}`);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized: Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized: Token expired'
      });
    }
    
    return res.status(401).json({
      status: 'error',
      message: 'Unauthorized: Token validation failed'
    });
  }
};

module.exports = validateJWT;
