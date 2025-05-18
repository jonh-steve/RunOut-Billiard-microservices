
<!--
📍 Vị trí file: /README.md
README.md phong cách hồng dễ thương, sinh động dành cho anh yêu dễ thương 💖
-->

# 🎱✨ RunOut-Biliard ✨🎱

![Billiard Ball](https://img.icons8.com/color/96/000000/billiard-ball.png)

![UX/UI Pink Cute Style](https://img.shields.io/badge/UX/UI-Pink%20Cute%20Style-ffb6c1?style=for-the-badge&logo=react)
![Microservices Node.js](https://img.shields.io/badge/Microservices-Node.js-green?style=for-the-badge&logo=node.js)
![Database MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?style=for-the-badge&logo=mongodb)
![License MIT](https://img.shields.io/badge/License-MIT-pink?style=for-the-badge)

---

## 🩷 Giới thiệu siêu dễ thương

**RunOut-Biliard** là nền tảng thương mại điện tử chuyên về sản phẩm bida, được xây dựng với kiến trúc microservices hiện đại.  
Dự án mang đến trải nghiệm người dùng mượt mà, giao diện hồng cute dễ thương, dễ mở rộng và cực kỳ an toàn cho mọi giao dịch!  

> 🥰 Dành riêng cho anh yêu dễ thương và những ai yêu thích bida & sự đáng yêu!

---

## 🌸 Tính Năng Chính

- 💖 **Giao diện hồng cute:** Thân thiện, dễ thương, trải nghiệm mua sắm vui vẻ.
- 🛒 **Mua sắm bida:** Duyệt & mua sản phẩm bida siêu xịn.
- 🧑‍💻 **Bảng điều khiển admin:** Quản lý sản phẩm, đơn hàng, người dùng.
- 🔒 **Xác thực an toàn:** Đăng ký, đăng nhập bảo mật.
- 🏗️ **Kiến trúc microservices:** Dễ mở rộng, bảo trì.
- 🚚 **Theo dõi đơn hàng:** Cập nhật trạng thái real-time.
- ⭐ **Đánh giá sản phẩm:** Người dùng đánh giá sản phẩm đã mua.

---

## 🏗️ Kiến Trúc Dễ Thương

- **API Gateway:** Định tuyến, xác thực JWT, giới hạn tốc độ, ghi log.
- **Dịch vụ Backend:** Auth, product, cart, order, review, payment, shipping, report, user.
- **Ứng dụng Client:** React SPA cho user (user-app) & admin (admin-dashboard).
- **Cơ sở dữ liệu:** MongoDB lưu trữ dữ liệu.
- **Cơ sở hạ tầng chung:** Tiện ích, xác thực, xử lý lỗi.

> 🐳 Dự án đóng gói bằng Docker, sắp tới sẽ triển khai Kubernetes.  
> 📈 Giám sát hiệu suất bằng New Relic & ELK Stack.

---

## 🛠️ Hướng Dẫn Cài Đặt

### 🎀 Yêu Cầu Hệ Thống

| Thành phần         | Phiên bản      |
|--------------------|---------------|
| Node.js            | v16+          |
| MongoDB            | v6+           |
| Redis              | latest        |
| RabbitMQ           | latest        |
| Docker & Compose   | latest        |

### 🌷 Cài Đặt Nhanh

1. **Clone repo:**

   ```bash
   git clone https://github.com/your-repo/RunOut-Biliard.git
   cd RunOut-Biliard
   ```

2. **Cài đặt thư viện dùng chung:**

   ```bash
   cd shared
   npm install
   cd ..
   ```

3. **Thiết lập biến môi trường:**
   - Copy `.env.example` thành `.env` trong các thư mục liên quan (`api-gateway`, `services/*`, v.v.)
   - Điền các giá trị như: `MONGODB_URI`, `JWT_SECRET`, v.v.

4. **Chạy bằng Docker Compose:**

   ```bash
   docker-compose up --build
   ```

5. **Chạy từng dịch vụ riêng lẻ (không dùng Docker):**

   ```bash
   cd services/auth
   npm install
   npm start
   ```

   Lặp lại cho các dịch vụ khác nếu cần.

> 🩷 **Lưu ý:** Hãy đảm bảo tất cả backend & API Gateway đều chạy để frontend hoạt động đầy đủ nha anh yêu dễ thương!

---

## 🤝 Đóng Góp

Chúng em luôn chào đón mọi đóng góp dễ thương từ anh yêu dễ thương và mọi người!  
**Các bước:**

1. Fork repository.
2. Tạo branch mới cho tính năng/sửa lỗi.
3. Commit thay đổi.
4. Push lên fork và gửi pull request.

> 🐞 Nếu có lỗi hoặc ý tưởng mới, hãy mở issue trên GitHub nhé!

---

## 📜 Giấy Phép

Dự án này được cấp phép dưới **MIT License**.

---

![Cute Heart](https://img.icons8.com/color/96/000000/heart-with-arrow.png)

**Cảm ơn anh yêu dễ thương đã ghé thăm! Chúc anh một ngày tràn ngập niềm vui và sự dễ thương! 💖**
