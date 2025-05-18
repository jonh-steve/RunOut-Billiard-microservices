#!/bin/bash

# -------------------------------------------
# 🩷 Script khởi tạo cấu trúc cho service siêu dễ thương 🩷
# Tác giả: Anh yêu dễ thương nhất quả đất
# -------------------------------------------

if [ -z "$1" ]; then
  echo "🩷 Anh yêu dễ thương ơi, hãy truyền tên service vào nhé! (ví dụ: ./scripts/setup-service-structure.sh auth-service)"
  exit 1
fi

SERVICE_NAME=$1

echo "🩷 Bắt đầu tạo cấu trúc cho $SERVICE_NAME siêu dễ thương 🩷"

# Tạo các thư mục chính
mkdir -p $SERVICE_NAME/src/controllers
mkdir -p $SERVICE_NAME/src/middleware
mkdir -p $SERVICE_NAME/src/models
mkdir -p $SERVICE_NAME/src/routes
mkdir -p $SERVICE_NAME/src/config

# Tạo file controllers/healthController.js
cat <<EOL > $SERVICE_NAME/src/controllers/healthController.js
// 🩷 File: $SERVICE_NAME/src/controllers/healthController.js
exports.healthCheck = (req, res) => {
  res.status(200).json({ message: "Service $SERVICE_NAME is healthy! 🩷" });
};
EOL

# Tạo file routes/healthRoutes.js
cat <<EOL > $SERVICE_NAME/src/routes/healthRoutes.js
// 🩷 File: $SERVICE_NAME/src/routes/healthRoutes.js
const express = require('express');
const router = express.Router();
const { healthCheck } = require('../controllers/healthController');

router.get('/health', healthCheck);

module.exports = router;
EOL

# Tạo file config/db.js
cat <<EOL > $SERVICE_NAME/src/config/db.js
// 🩷 File: $SERVICE_NAME/src/config/db.js
// Kết nối database cho $SERVICE_NAME (anh yêu dễ thương tự chỉnh sửa nhé)
EOL

# Tạo file config/jwt.js
cat <<EOL > $SERVICE_NAME/src/config/jwt.js
// 🩷 File: $SERVICE_NAME/src/config/jwt.js
// Cấu hình JWT cho $SERVICE_NAME (anh yêu dễ thương tự chỉnh sửa nhé)
EOL

# Tạo file config/cors.js
cat <<EOL > $SERVICE_NAME/src/config/cors.js
// 🩷 File: $SERVICE_NAME/src/config/cors.js
// Cấu hình CORS cho $SERVICE_NAME (anh yêu dễ thương tự chỉnh sửa nhé)
EOL

# Tạo file app.js
cat <<EOL > $SERVICE_NAME/src/app.js
// 🩷 File: $SERVICE_NAME/src/app.js
const express = require('express');
const app = express();
const healthRoutes = require('./routes/healthRoutes');

app.use(express.json());
app.use('/api', healthRoutes);

module.exports = app;
EOL

# Tạo file index.js
cat <<EOL > $SERVICE_NAME/src/index.js
// 🩷 File: $SERVICE_NAME/src/index.js
const app = require('./app');
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(\`🩷 $SERVICE_NAME đang chạy trên cổng \${PORT} 🩷\`);
});
EOL

# Tạo file .env
cat <<EOL > $SERVICE_NAME/.env
# 🩷 File: $SERVICE_NAME/.env
PORT=3000
EOL

# Tạo file .env.example
cat <<EOL > $SERVICE_NAME/.env.example
# 🩷 File: $SERVICE_NAME/.env.example
PORT=3000
EOL

# Tạo file package.json
cat <<EOL > $SERVICE_NAME/package.json
{
  "name": "$SERVICE_NAME",
  "version": "1.0.0",
  "description": "Service $SERVICE_NAME siêu dễ thương cho anh yêu",
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
# 🩷 File: $SERVICE_NAME/Dockerfile
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
echo "  - $SERVICE_NAME/src/config/db.js"
echo "  - $SERVICE_NAME/src/config/jwt.js"
echo "  - $SERVICE_NAME/src/config/cors.js"
echo "  - $SERVICE_NAME/src/app.js"
echo "  - $SERVICE_NAME/src/index.js"
echo "  - $SERVICE_NAME/.env"
echo "  - $SERVICE_NAME/.env.example"
echo "  - $SERVICE_NAME/package.json"
echo "  - $SERVICE_NAME/Dockerfile"
echo "🩷 Chúc anh yêu dễ thương code vui vẻ và thành công! 🩷"