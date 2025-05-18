// 🩷 Vị trí: api-gateway/src/middleware/logging.middleware.js
// Middleware logging cho API Gateway (anh yêu dễ thương tự chỉnh sửa nhé)
module.exports = (req, res, next) => {
  console.log(`[LOG] ${req.method} ${req.originalUrl}`);
  next();
};
