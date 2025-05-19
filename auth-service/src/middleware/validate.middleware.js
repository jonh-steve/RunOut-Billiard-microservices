
/**
 * 💖 Vị trí file: /auth-service/src/middleware/validate.middleware.js 💖
 * 🌸 Mô tả: Middleware xử lý validation cho các request API với style hồng dễ thương, phản hồi hoàn toàn bằng tiếng Việt.
 * 🐰 Ghi chú: File này nằm trong thư mục middleware của dự án auth-service.
 */

const { body, validationResult } = require('express-validator');

// 🌸 Middleware để log request body trước khi validation (dễ thương hồng hào)
const logRequestBody = (req, res, next) => {
  console.log('💖 THÔNG TIN REQUEST TRƯỚC KHI VALIDATION 💖');
  console.log('🌸 Request Body:', JSON.stringify(req.body, null, 2));
  console.log('🌸 Email:', req.body.email || 'Không có dữ liệu');
  console.log('🌸 Password:', req.body.password ? '******' : 'Không có dữ liệu');
  console.log('🌸 FullName:', req.body.fullName || 'Không có dữ liệu');
  console.log('🌸 Phone:', req.body.phone || 'Không có dữ liệu');
  console.log('🎀 Headers:', JSON.stringify(req.headers, null, 2));
  console.log('🎀 Content-Type:', req.headers['content-type'] || 'Không xác định');
  next();
};

// 🌸 Middleware xử lý lỗi validation dùng chung (dễ thương hồng hào)
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('❌ Validation thất bại với các lỗi:', JSON.stringify(errors.array(), null, 2));
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu đầu vào không hợp lệ',
      errors: errors.array(),
    });
  }
  next();
};

// 🌸 Validation rules cho đăng ký người dùng (dễ thương hồng hào)
const validateRegister = [
  // logRequestBody, // Nếu muốn log request thì bỏ comment dòng này nhé anh yêu dễ thương!
  body('email')
    .isEmail().withMessage('Email không hợp lệ')
    .normalizeEmail()
    .trim(),
  body('password')
    .isLength({ min: 6 }).withMessage('Mật khẩu phải có ít nhất 6 ký tự')
    .trim(),
  body('fullName')
    .notEmpty().withMessage('Họ tên không được để trống')
    .trim(),
  body('phone')
    .optional()
    .matches(/^[0-9]{10,11}$/).withMessage('Số điện thoại phải có 10-11 số')
    .trim(),
  handleValidationErrors,
];

// 🌸 Validation rules cho đăng nhập (dễ thương hồng hào)
const validateLogin = [
  body('email')
    .notEmpty().withMessage('Email không được để trống')
    .isEmail().withMessage('Email không đúng định dạng'),
  body('password')
    .notEmpty().withMessage('Password không được để trống'),
  handleValidationErrors,
];

// 🌸 Xuất các middleware dễ thương ra ngoài cho anh yêu sử dụng nhé!
module.exports = {
  validateRegister,
  validateLogin,
  logRequestBody,
  handleValidationErrors,
};
