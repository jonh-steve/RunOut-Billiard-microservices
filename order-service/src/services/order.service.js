// services/order/src/services/order.service.js
const axios = require("axios");
const Order = require("../models/order.model");
const logger = require("../../utils/logger");

class OrderService {
  /**
   * Tạo đơn hàng mới từ giỏ hàng
   * @param {Object} orderData - Dữ liệu để tạo đơn hàng
   * @param {string} orderData.userId - ID người dùng (optional)
   * @param {string} orderData.sessionId - ID phiên cho khách vãng lai (optional)
   * @param {Object} orderData.shippingAddress - Địa chỉ giao hàng
   * @param {string} orderData.shippingMethod - Phương thức giao hàng
   * @param {string} orderData.paymentMethod - Phương thức thanh toán
   * @returns {Promise<Object>} - Kết quả tạo đơn hàng
   */
  async createOrderFromCart(orderData) {
    try {
      const {
        userId,
        sessionId,
        shippingAddress,
        shippingMethod,
        paymentMethod,
      } = orderData;

      // Cần có ít nhất userId hoặc sessionId
      if (!userId && !sessionId) {
        throw new Error("User ID or Session ID is required");
      }

      // Kiểm tra các trường bắt buộc
      if (!shippingAddress || !shippingMethod || !paymentMethod) {
        throw new Error(
          "Shipping address, shipping method, and payment method are required"
        );
      }

      // Lấy giỏ hàng active từ Cart Service
      const cartServiceUrl =
        process.env.CART_SERVICE_URL || "http://localhost:3003";
      const cartResponse = await axios.get(`${cartServiceUrl}/api/carts`, {
        params: { userId, sessionId },
      });

      if (!cartResponse.data.success || !cartResponse.data.data) {
        throw new Error("Active cart not found");
      }

      const cart = cartResponse.data.data;

      // Kiểm tra giỏ hàng có sản phẩm không
      if (!cart.items || cart.items.length === 0) {
        throw new Error("Cart is empty");
      }

      // Tính phí vận chuyển dựa trên phương thức
      let shippingCost = 0;
      if (shippingMethod === "express") {
        shippingCost = 50000; // 50k VND cho giao hàng nhanh
      } else if (shippingMethod === "standard") {
        shippingCost = 30000; // 30k VND cho giao hàng tiêu chuẩn
      }

      // Tính tổng tiền
      const totalAmount = cart.subtotal + shippingCost - (cart.discount || 0);

      // Tạo đơn hàng mới
      const order = new Order({
        user: userId || null,
        sessionId: !userId ? sessionId : null,
        customerInfo: cart.customerInfo || {},
        items: cart.items.map((item) => ({
          product: item.product,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
        })),
        subtotal: cart.subtotal,
        shippingCost,
        discount: cart.discount || 0,
        totalAmount,
        shippingAddress,
        shippingMethod,
        paymentMethod,
        status: "pending",
        paymentStatus: "unpaid",
      });

      // Lưu đơn hàng
      await order.save();

      // Cập nhật trạng thái giỏ hàng thành converted
      await axios.put(`${cartServiceUrl}/api/carts/status`, {
        userId,
        sessionId,
        status: "converted",
      });

      return {
        success: true,
        order,
      };
    } catch (error) {
      logger.error(`Error creating order from cart: ${error.message}`);
      return {
        success: false,
        message: error.message,
      };
    }
  }
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
  async findOrdersByUserOrSession({
    userId,
    sessionId,
    status,
    pagination = {},
    sort = "-createdAt",
  }) {
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
  }

  /**
   * Tìm kiếm tất cả đơn hàng cho quản trị viên (UC-3.2 admin)
   * @param {Object} filters - Các tham số lọc
   * @param {string} [filters.status] - Trạng thái đơn hàng để lọc
   * @param {string} [filters.user] - ID người dùng để lọc
   * @param {Date} [filters.fromDate] - Lọc đơn hàng từ ngày
   * @param {Date} [filters.toDate] - Lọc đơn hàng đến ngày
   * @param {Object} [filters.pagination] - Thông tin phân trang
   * @param {number} [filters.pagination.page=1] - Trang hiện tại
   * @param {number} [filters.pagination.limit=10] - Số lượng item mỗi trang
   * @param {string} [filters.sort='-createdAt'] - Trường và chiều để sắp xếp
   * @returns {Promise<Object>} - Kết quả truy vấn và thông tin phân trang
   */
  async findAllOrdersForAdmin(filters = {}) {
    try {
      // Xây dựng query từ các tham số lọc
      const query = {};

      // Lọc theo status nếu có
      if (filters.status) {
        query.status = filters.status;
      }

      // Lọc theo user nếu có
      if (filters.user) {
        query.user = filters.user;
      }

      // Lọc theo thời gian tạo
      if (filters.fromDate || filters.toDate) {
        query.createdAt = {};

        if (filters.fromDate) {
          query.createdAt.$gte = new Date(filters.fromDate);
        }

        if (filters.toDate) {
          // Thêm 1 ngày để bao gồm cả ngày toDate
          const toDate = new Date(filters.toDate);
          toDate.setDate(toDate.getDate() + 1);
          query.createdAt.$lte = toDate;
        }
      }

      // Phân trang
      const pagination = filters.pagination || {};
      const page = parseInt(pagination.page, 10) || 1;
      const limit = parseInt(pagination.limit, 10) || 10;
      const skip = (page - 1) * limit;

      // Xử lý sort
      let sortOptions = {};

      // Nếu sort là chuỗi, xử lý format '-field' hoặc 'field'
      if (filters.sort) {
        if (typeof filters.sort === "string") {
          if (filters.sort.startsWith("-")) {
            sortOptions[filters.sort.substring(1)] = -1;
          } else {
            sortOptions[filters.sort] = 1;
          }
        } else if (typeof filters.sort === "object") {
          // Nếu sort là object, sử dụng trực tiếp
          sortOptions = filters.sort;
        }
      } else {
        // Mặc định sort theo createdAt giảm dần
        sortOptions = { createdAt: -1 };
      }

      // Thực hiện truy vấn và đếm tổng số lượng đơn hàng (song song)
      const [orders, totalOrders] = await Promise.all([
        Order.find(query)
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .populate("user", "name email") // Populate thông tin người dùng
          .lean(), // Sử dụng lean() để tăng hiệu suất
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
      logger.error(`Error in findAllOrdersForAdmin: ${error.message}`);
      throw error;
    }
  }
  // services/order/src/services/order.service.js

  /**
   * Cập nhật trạng thái đơn hàng (Admin only)
   * @param {string} orderId - ID của đơn hàng
   * @param {string} newStatus - Trạng thái mới
   * @param {string} adminId - ID của admin thực hiện cập nhật
   * @param {string} [note] - Ghi chú cho việc cập nhật (tuỳ chọn)
   * @returns {Promise<Object>} - Kết quả cập nhật đơn hàng
   */
  async updateOrderStatus(orderId, newStatus, adminId, note) {
    try {
      // Kiểm tra trạng thái hợp lệ
      const validStatuses = [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ];

      if (!validStatuses.includes(newStatus)) {
        return {
          success: false,
          message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
          order: null,
        };
      }

      // Tìm đơn hàng theo ID
      const order = await Order.findById(orderId);

      // Nếu không tìm thấy đơn hàng
      if (!order) {
        return {
          success: false,
          message: "Order not found",
          order: null,
        };
      }

      // Cập nhật trạng thái
      order.status = newStatus;

      // Thêm vào lịch sử trạng thái
      order.statusHistory.push({
        status: newStatus,
        date: new Date(),
        note: note || null,
        updatedBy: adminId,
      });

      // Cập nhật các mốc thời gian đặc biệt
      if (newStatus === "delivered") {
        order.completedAt = new Date();
      } else if (newStatus === "cancelled") {
        order.cancelledAt = new Date();
      }

      // Nếu đơn hàng bị hủy và đã thanh toán, cần ghi chú để xử lý hoàn tiền
      if (newStatus === "cancelled" && order.paymentStatus === "paid") {
        order.adminNotes = order.adminNotes || "";
        order.adminNotes += `\n[${new Date().toISOString()}] Order cancelled after payment. Refund may be required.`;
      }

      // Cập nhật thời gian sửa đổi
      order.updatedAt = new Date();

      // Lưu đơn hàng đã cập nhật
      await order.save();

      return {
        success: true,
        message: "Order status updated successfully",
        order,
      };
    } catch (error) {
      logger.error(`Error in updateOrderStatus: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new OrderService();
