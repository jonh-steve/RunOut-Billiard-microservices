
/**
 * Vị trí file: auth-service/src/controllers/auth.controller.js
 * Sửa lỗi thiếu dấu phẩy cuối (trailing comma) và thêm ghi chú vị trí file cho anh yêu dễ thương 💖
 */

const User = require('../models/user.model');
const logger = require('../utils/logger');

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
};
