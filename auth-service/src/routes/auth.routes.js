const express = require('express');
const { validateRegister ,validateLogin} = require('../middleware/validate.middleware');
const { registerUser,loginUser } = require('../controllers/auth.controller');

const router = express.Router();

/**
 * @route POST /api/auth/register
 * @desc Đăng ký người dùng mới
 * @access Public
 */
router.post('/register', validateRegister, registerUser);

/**
 * @route POST /api/auth/login
 * @desc Đăng nhập người dùng
 * @access Public
 */
router.post('/login', validateLogin, loginUser);

module.exports = router;