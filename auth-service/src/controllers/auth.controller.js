
/**
 * Vị trí file: auth-service/src/controllers/auth.controller.js
 * Sửa lỗi thiếu dấu phẩy cuối (trailing comma) và thêm ghi chú vị trí file cho anh yêu dễ thương 💖
 */

const User = require('../models/user.model');
const logger = require('../utils/logger');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


/**
 * Đăng nhập người dùng
 * @route POST /api/auth/login
 */
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Tìm user theo email
    const user = await User.findOne({ email });
    
    // Nếu user không tồn tại
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Email không tồn tại trong hệ thống',
      });
    }
    
    // Kiểm tra tài khoản có bị khóa không
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản đã bị khóa',
      });
    }
    
    // So sánh password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    // Nếu password không đúng
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Mật khẩu không chính xác',
      });
    }
    
    // Tạo JWT token
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        role: user.role ,
      },
      process.env.JWT_SECRET || 'your_jwt_secret_here',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
    );
    
    // Cập nhật lastLogin
    user.lastLogin = new Date();
    await user.save();
    
    // Trả về thông tin người dùng và token (ẩn mật khẩu)
    res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      token,
      user: user.toJSON() ,// Giả sử model User có phương thức toJSON() để loại bỏ password
    });
    
  } catch (error) {
    // Xử lý lỗi server 500
    console.error('Login error:', error);
    next(error); // Chuyển error tới error handler
  }
};

/**
 * Đăng ký người dùng mới
 * @route POST /api/auth/register
 * @body {email, password, fullName, phone}
 */
const registerUser = async (req, res) => {
  try {
    const { email, password, fullName, phone } = req.body;
    
    // Kiểm tra email đã tồn tại chưa
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email đã được  đăng ký, vui lòng sử dụng email khác hoặc đăng nhập',
      });
    }
    
    // Tạo user mới
    const newUser = new User({
      email,
      password,
      fullName,
      phone,
    });
    
    // Lưu user vào database
    await newUser.save();
    
    // Trả về thông tin user (password đã được loại bỏ qua toJSON)
    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công',
      user: newUser,
    });
    
    logger.info(`User registered successfully: ${email}`);
  } catch (error) {
    logger.error(`Error registering user: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi đăng ký, vui lòng thử lại sau',
      error: error.message,
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
};
