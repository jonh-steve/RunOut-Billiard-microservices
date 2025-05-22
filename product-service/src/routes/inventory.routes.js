const express = require("express");
const { authenticate, requireAdmin } = require("../middleware/auth.middleware");
const inventoryController = require("../controllers/inventory.controller");

const router = express.Router();

/**
 * @route GET /api/inventory/product/:productId
 * @desc Lấy lịch sử thay đổi tồn kho theo sản phẩm
 * @access Private (Admin only)
 */
router.get(
  "/product/:productId",
  authenticate,
  requireAdmin,
  inventoryController.getInventoryHistory
);

/**
 * @route GET /api/inventory/stats
 * @desc Lấy thống kê thay đổi tồn kho theo thời gian
 * @access Private (Admin only)
 */
router.get(
  "/stats",
  authenticate,
  requireAdmin,
  inventoryController.getInventoryStats
);

module.exports = router;
