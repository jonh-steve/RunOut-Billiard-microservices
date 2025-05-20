// services/order/src/controllers/order.controller.js
const orderService = require("../services/order.service");
const logger = require("../../utils/logger");
const Order = require("../models/order.model");
/**
 * Tạo đơn hàng mới từ giỏ hàng hiện tại
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
const createOrder = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    const sessionId = req.sessionId;
    const { shippingAddress, shippingMethod, paymentMethod } = req.body;

    // Kiểm tra thông tin bắt buộc
    if (!shippingAddress || !shippingMethod || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message:
          "Shipping address, shipping method, and payment method are required",
      });
    }

    // Kiểm tra người dùng hoặc session
    if (!userId && !sessionId) {
      return res.status(400).json({
        success: false,
        message: "User authentication or session is required",
      });
    }

    // Gọi service tạo đơn hàng
    const result = await orderService.createOrderFromCart({
      userId,
      sessionId,
      shippingAddress,
      shippingMethod,
      paymentMethod,
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    // Trả về kết quả thành công
    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: result.order,
    });
  } catch (error) {
    logger.error(`Error in createOrder controller: ${error.message}`);
    next(error);
  }
};
/**
 * Tìm kiếm đơn hàng theo user ID hoặc session ID
 * @param {Object} params - Các tham số truy vấn
 * @param {string} [params.userId] - ID người dùng đã đăng nhập
 * @param {string} [params.sessionId] - ID phiên của khách vãng lai
 * @param {string} [params.status] - Trạng thái đơn hàng để lọc
 * @param {Object} [params.pagination] - Thông tin phân trang
 * @param {number} [params.pagination.page=1] - Trang hiện tại
 * @param {number} [params.pagination.limit=10] - Số lượng item mỗi trang
 * @param {string} [params.sort='-createdAt'] - Trường và chiều để sắp xếp
 * @returns {Promise<Object>} - Kết quả truy vấn và thông tin phân trang
 */
const findOrdersByUserOrSession = async ({
  userId,
  sessionId,
  status,
  pagination = {},
  sort = "-createdAt",
}) => {
  try {
    // Đảm bảo có userId hoặc sessionId
    if (!userId && !sessionId) {
      return {
        success: false,
        message: "User ID or Session ID is required",
        orders: [],
        pagination: {
          page: 1,
          limit: 0,
          totalPages: 0,
          totalOrders: 0,
        },
      };
    }

    // Xây dựng query
    const query = {};

    // Lọc theo userId hoặc sessionId
    if (userId) {
      query.user = userId;
    } else if (sessionId) {
      query.sessionId = sessionId;
    }

    // Lọc theo status nếu có
    if (status) {
      query.status = status;
    }

    // Phân trang
    const page = parseInt(pagination.page, 10) || 1;
    const limit = parseInt(pagination.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Xử lý sort
    let sortOptions = {};

    // Nếu sort là chuỗi, xử lý format '-field' hoặc 'field'
    if (typeof sort === "string") {
      if (sort.startsWith("-")) {
        sortOptions[sort.substring(1)] = -1;
      } else {
        sortOptions[sort] = 1;
      }
    } else if (typeof sort === "object") {
      // Nếu sort là object, sử dụng trực tiếp
      sortOptions = sort;
    } else {
      // Mặc định sort theo createdAt giảm dần
      sortOptions = { createdAt: -1 };
    }

    // Thực hiện truy vấn và đếm tổng số lượng đơn hàng
    const [orders, totalOrders] = await Promise.all([
      Order.find(query).sort(sortOptions).skip(skip).limit(limit).lean(), // Sử dụng lean() để tăng hiệu suất
      Order.countDocuments(query),
    ]);

    // Tính toán tổng số trang
    const totalPages = Math.ceil(totalOrders / limit);

    return {
      success: true,
      message: orders.length > 0 ? "Orders found" : "No orders found",
      orders,
      pagination: {
        page,
        limit,
        totalPages,
        totalOrders,
      },
    };
  } catch (error) {
    logger.error(`Error in findOrdersByUserOrSession: ${error.message}`);
    throw error;
  }
};
/**
 * Lấy danh sách đơn hàng của người dùng (đã đăng nhập hoặc khách)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
const getOrdersByUser = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    const sessionId = req.sessionId; // Giả sử middleware đã gán sessionId vào req

    // Lấy các tham số từ query string cho việc lọc, phân trang, sắp xếp
    const { status, page, limit, sort } = req.query;

    // Gọi hàm helper đã có để tìm kiếm đơn hàng
    const result = await findOrdersByUserOrSession({
      userId,
      sessionId,
      status,
      pagination: { page, limit },
      sort,
    });

    if (!result.success) {
      // Nếu hàm helper trả về lỗi (ví dụ không có userId và sessionId)
      // Hoặc có thể là một lỗi logic khác mà helper đã xử lý
      return res.status(400).json({
        success: false,
        message: result.message || "Could not retrieve orders.",
      });
    }

    // Trả về kết quả thành công
    res.status(200).json({
      success: true,
      message: result.message,
      data: result.orders,
      pagination: result.pagination,
    });
  } catch (error) {
    // Bắt các lỗi không mong muốn từ findOrdersByUserOrSession hoặc các lỗi khác
    logger.error(`Error in getOrdersByUser controller: ${error.message}`);
    next(error); // Chuyển cho middleware xử lý lỗi tập trung
  }
};
// services/order/src/controllers/order.controller.js

/**
 * Lấy tất cả đơn hàng cho quản trị viên (UC-3.2 admin)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
const getOrdersForAdmin = async (req, res, next) => {
  try {
    // Lấy các tham số lọc từ query params
    const { 
      status, 
      user,
      fromDate, 
      toDate, 
      page, 
      limit, 
      sort 
    } = req.query;
    
    // Gọi service để lấy danh sách đơn hàng
    const result = await orderService.findAllOrdersForAdmin({
      status,
      user,
      fromDate,
      toDate,
      pagination: { page, limit },
      sort
    });
    
    // Trả về kết quả
    res.status(200).json({
      success: true,
      message: 'All orders fetched successfully',
      data: {
        orders: result.orders,
        pagination: result.pagination
      }
    });
  } catch (error) {
    logger.error(`Error in getOrdersForAdmin: ${error.message}`);
    next(error);
  }
};
// services/order/src/controllers/order.controller.js

/**
 * Cập nhật trạng thái đơn hàng (Admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
const updateOrderStatus = async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const { status, note } = req.body;
    const adminId = req.user.id;
    
    // Validate input
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }
    
    // Gọi service để cập nhật trạng thái đơn hàng
    const result = await orderService.updateOrderStatus(orderId, status, adminId, note);
    
    // Xử lý kết quả từ service
    if (!result.success) {
      // Nếu không tìm thấy đơn hàng
      if (result.message === 'Order not found') {
        return res.status(404).json({
          success: false,
          message: result.message
        });
      }
      
      // Các lỗi khác
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }
    
    // Trả về kết quả thành công
    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: result.order
    });
  } catch (error) {
    logger.error(`Error in updateOrderStatus controller: ${error.message}`);
    next(error);
  }
};



module.exports = {
  createOrder,
  findOrdersByUserOrSession,
  getOrdersByUser,
  getOrdersForAdmin,
  updateOrderStatus,
};
