const InventoryLog = require("../models/inventory-log.model");
const logger = require("../utils/logger");
const { ApiError } = require("../utils/error-handler");

/**
 * Lấy lịch sử thay đổi tồn kho theo sản phẩm
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getInventoryHistory = async (req, res, next) => {
  const requestId = `REQ-INVHIST-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  try {
    const { productId } = req.params;
    const { source, startDate, endDate, page = 1, limit = 20 } = req.query;

    logger.info(
      `[${requestId}] Fetching inventory history for product ${productId}`
    );

    // Xây dựng query
    const query = { productId };

    // Lọc theo source nếu có
    if (source) {
      query.source = source;
    }

    // Lọc theo khoảng thời gian nếu có
    if (startDate || endDate) {
      query.createdAt = {};

      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }

      if (endDate) {
        // Thêm 1 ngày để bao gồm cả ngày endDate
        const endDateObj = new Date(endDate);
        endDateObj.setDate(endDateObj.getDate() + 1);
        query.createdAt.$lt = endDateObj;
      }
    }

    // Tính skip và limit cho phân trang
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Thực hiện truy vấn
    const [logs, total] = await Promise.all([
      InventoryLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      InventoryLog.countDocuments(query),
    ]);

    // Tính tổng số trang
    const totalPages = Math.ceil(total / parseInt(limit));

    // Trả về kết quả
    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
      },
    });
  } catch (error) {
    logger.error(
      `[${requestId}] Error fetching inventory history: ${error.message}`
    );
    next(error);
  }
};

/**
 * Lấy thống kê thay đổi tồn kho theo thời gian
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getInventoryStats = async (req, res, next) => {
  const requestId = `REQ-INVSTATS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  try {
    const { startDate, endDate, groupBy = "day" } = req.query;

    logger.info(
      `[${requestId}] Fetching inventory statistics from ${startDate} to ${endDate}, groupBy: ${groupBy}`
    );

    // Kiểm tra tham số bắt buộc
    if (!startDate || !endDate) {
      throw new ApiError(400, "startDate and endDate are required", true);
    }

    // Xác định format time group
    let timeGroup;
    if (groupBy === "hour") {
      timeGroup = {
        $dateToString: { format: "%Y-%m-%d %H:00", date: "$createdAt" },
      };
    } else if (groupBy === "day") {
      timeGroup = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
    } else if (groupBy === "month") {
      timeGroup = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
    } else {
      throw new ApiError(
        400,
        "Invalid groupBy parameter. Must be hour, day, or month",
        true
      );
    }

    // Xây dựng query
    const query = {
      createdAt: {
        $gte: new Date(startDate),
        $lt: (() => {
          const endDateObj = new Date(endDate);
          endDateObj.setDate(endDateObj.getDate() + 1);
          return endDateObj;
        })(),
      },
    };

    // Aggregation để lấy thống kê
    const stats = await InventoryLog.aggregate([
      // Match theo khoảng thời gian
      { $match: query },

      // Group theo thời gian và source
      {
        $group: {
          _id: {
            timeGroup: timeGroup,
            source: "$source",
          },
          totalDelta: { $sum: "$delta" },
          count: { $sum: 1 },
        },
      },

      // Group lại để có cấu trúc thích hợp cho biểu đồ
      {
        $group: {
          _id: "$_id.timeGroup",
          sources: {
            $push: {
              source: "$_id.source",
              totalDelta: "$totalDelta",
              count: "$count",
            },
          },
          totalDelta: { $sum: "$totalDelta" },
          totalCount: { $sum: "$count" },
        },
      },

      // Sort theo thời gian
      { $sort: { _id: 1 } },

      // Project để định dạng kết quả
      {
        $project: {
          date: "$_id",
          sources: 1,
          totalDelta: 1,
          totalCount: 1,
          _id: 0,
        },
      },
    ]);

    // Trả về kết quả
    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error(
      `[${requestId}] Error fetching inventory statistics: ${error.message}`
    );
    next(error);
  }
};

module.exports = {
  getInventoryHistory,
  getInventoryStats,
};
