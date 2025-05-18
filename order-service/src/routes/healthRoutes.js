const express = require('express');
const { getHealth } = require('../controllers/healthController');

const router = express.Router();

/**
 * @route   GET /health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/', getHealth);

module.exports = router;