#!/bin/bash

# -------------------------------------------
# 🩷 Script khởi tạo cấu trúc cho api-gateway siêu dễ thương 🩷
# Tác giả: Anh yêu dễ thương nhất quả đất
# -------------------------------------------

SERVICE_NAME="api-gateway"

echo "🩷 Bắt đầu tạo cấu trúc cho $SERVICE_NAME siêu dễ thương 🩷"

# Tạo các thư mục chính
mkdir -p $SERVICE_NAME/src/routes
mkdir -p $SERVICE_NAME/src/middleware
mkdir -p $SERVICE_NAME/src/config
mkdir -p $SERVICE_NAME/src/controllers

# Tạo file controllers/healthController.js
cat <<EOL > $SERVICE_NAME/src/controllers/healthController.js
// 🩷 Vị trí: $SERVICE_NAME/src/controllers/healthController.js
exports.healthCheck = (req, res) => {
  res.status(200).json({ message: "API Gateway is healthy! 🩷" });
};
EOL

# Tạo file routes/healthRoutes.js
cat <<EOL > $SERVICE_NAME/src/routes/healthRoutes.js
// 🩷 Vị trí: $SERVICE_NAME/src/routes/healthRoutes.js
const express = require('express');
const router = express.Router();
const { healthCheck } = require('../controllers/healthController');

router.get('/health', healthCheck);

module.exports = router;
EOL

# Tạo các file middleware
cat <<EOL > $SERVICE_NAME/src/middleware/auth.middleware.js
// 🩷 Vị trí: $SERVICE_NAME/src/middleware/auth.middleware.js
// Middleware xác thực cho API Gateway (anh yêu dễ thương tự chỉnh sửa nhé)
module.exports = (req, res, next) => {
  // TODO: Xác thực request
  next();
};
EOL

cat <<EOL > $SERVICE_NAME/src/middleware/logging.middleware.js
// 🩷 Vị trí: $SERVICE_NAME/src/middleware/logging.middleware.js
// Middleware logging cho API Gateway (anh yêu dễ thương tự chỉnh sửa nhé)
module.exports = (req, res, next) => {
  console.log(\`[LOG] \${req.method} \${req.originalUrl}\`);
  next();
};
EOL

cat <<EOL > $SERVICE_NAME/src/middleware/error.middleware.js
// 🩷 Vị trí: $SERVICE_NAME/src/middleware/error.middleware.js
// Middleware xử lý lỗi cho API Gateway (anh yêu dễ thương tự chỉnh sửa nhé)
module.exports = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Có lỗi xảy ra! 🩷" });
};
EOL

cat <<EOL > $SERVICE_NAME/src/middleware/proxy.middleware.js
// 🩷 Vị trí: $SERVICE_NAME/src/middleware/proxy.middleware.js
// Middleware proxy cho API Gateway (anh yêu dễ thương tự chỉnh sửa nhé)
module.exports = (req, res, next) => {
  // TODO: Xử lý proxy request
  next();
};
EOL

# Tạo các file config
cat <<EOL > $SERVICE_NAME/src/config/cors.js
// 🩷 Vị trí: $SERVICE_NAME/src/config/cors.js
// Cấu hình CORS cho API Gateway (anh yêu dễ thương tự chỉnh sửa nhé)
module.exports = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
};
EOL

cat <<EOL > $SERVICE_NAME/src/config/jwt.js
// 🩷 Vị trí: $SERVICE_NAME/src/config/jwt.js
// Cấu hình JWT cho API Gateway (anh yêu dễ thương tự chỉnh sửa nhé)
module.exports = {
  secret: 'your-secret-key',
  expiresIn: '1h',
};
EOL

cat <<EOL > $SERVICE_NAME/src/config/proxy-config.js
// 🩷 Vị trí: $SERVICE_NAME/src/config/proxy-config.js
// Cấu hình proxy cho API Gateway (anh yêu dễ thương tự chỉnh sửa nhé)
module.exports = {
  // Ví dụ:
  // '/api/auth': 'http://localhost:4001',
};
EOL

# Tạo file app.js
cat <<EOL > $SERVICE_NAME/src/app.js
// 🩷 Vị trí: $SERVICE_NAME/src/app.js
const express = require('express');
const app = express();
const healthRoutes = require('./routes/healthRoutes');
const loggingMiddleware = require('./middleware/logging.middleware');
const errorMiddleware = require('./middleware/error.middleware');

app.use(express.json());
app.use(loggingMiddleware);
app.use('/api', healthRoutes);
app.use(errorMiddleware);

module.exports = app;
EOL

# Tạo file index.js
cat <<EOL > $SERVICE_NAME/src/index.js
// 🩷 Vị trí: $SERVICE_NAME/src/index.js
const app = require('./app');
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(\`🩷 API Gateway đang chạy trên cổng \${PORT} 🩷\`);
});
EOL

# Tạo file .env
cat <<EOL > $SERVICE_NAME/.env
# 🩷 Vị trí: $SERVICE_NAME/.env
PORT=3000
EOL

# Tạo file .env.example
cat <<EOL > $SERVICE_NAME/.env.example
# 🩷 Vị trí: $SERVICE_NAME/.env.example
PORT=3000
EOL

# Tạo file package.json
cat <<EOL > $SERVICE_NAME/package.json
{
  "name": "api-gateway",
  "version": "1.0.0",
  "description": "API Gateway siêu dễ thương cho anh yêu",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  }
}
EOL

# Tạo file Dockerfile
cat <<EOL > $SERVICE_NAME/Dockerfile
# 🩷 Vị trí: $SERVICE_NAME/Dockerfile
FROM node:18
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
EOL

echo "🩷 Đã tạo xong cấu trúc cho $SERVICE_NAME siêu dễ thương! 🩷"
echo "🩷 Các file và thư mục anh yêu dễ thương có thể sửa:"
echo "  - $SERVICE_NAME/src/controllers/healthController.js"
echo "  - $SERVICE_NAME/src/routes/healthRoutes.js"
echo "  - $SERVICE_NAME/src/middleware/auth.middleware.js"
echo "  - $SERVICE_NAME/src/middleware/logging.middleware.js"
echo "  - $SERVICE_NAME/src/middleware/error.middleware.js"
echo "  - $SERVICE_NAME/src/middleware/proxy.middleware.js"
echo "  - $SERVICE_NAME/src/config/cors.js"
echo "  - $SERVICE_NAME/src/config/jwt.js"
echo "  - $SERVICE_NAME/src/config/proxy-config.js"
echo "  - $SERVICE_NAME/src/app.js"
echo "  - $SERVICE_NAME/src/index.js"
echo "  - $SERVICE_NAME/.env"
echo "  - $SERVICE_NAME/.env.example"
echo "  - $SERVICE_NAME/package.json"
echo "  - $SERVICE_NAME/Dockerfile"
echo "🩷 Chúc anh yêu dễ thương code vui vẻ và thành công! 🩷"