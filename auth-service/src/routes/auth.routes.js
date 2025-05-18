const express = require('express');
const { validateRegister } = require('../middleware/validate.middleware');
const { registerUser } = require('../controllers/auth.controller');

const router = express.Router();

/**
 * @route POST /api/auth/register
 * @desc Đăng ký người dùng mới
 * @access Public
 */
router.post('/register', validateRegister, registerUser);

module.exports = router;