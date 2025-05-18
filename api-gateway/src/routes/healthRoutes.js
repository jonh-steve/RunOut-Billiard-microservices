const express = require('express');
const healthController = require('../controllers/healthController');

const router = express.Router();

/**
 * @route   GET /health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/', healthController.getHealth);

module.exports = router;

/*
# Chỉ rebuild và restart API Gateway
docker compose stop api-gateway
docker compose rm -f api-gateway
docker compose build api-gateway
docker compose up -d api-gateway

# Kiểm tra logs
docker compose logs -f api-gateway
*/ 