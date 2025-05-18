const { body, validationResult } = require('express-validator');

// Validation rules cho đăng ký người dùng
const validateRegister = [
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
  
  // Middleware xử lý kết quả validation
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu đầu vào không hợp lệ',
        errors: errors.array()
      });
    }
    next();
  }
];

module.exports = {
  validateRegister
};