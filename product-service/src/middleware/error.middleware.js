// 🩷 Vị trí: api-gateway/src/middleware/error.middleware.js
// Middleware xử lý lỗi cho API Gateway (anh yêu dễ thương tự chỉnh sửa nhé)
module.exports = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Có lỗi xảy ra! 🩷" });
};
