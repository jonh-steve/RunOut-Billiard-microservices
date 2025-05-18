/**
 * Health check controller
 * Sử dụng để kiểm tra trạng thái của service
 */
const getHealth = (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Service is running',
    timestamp: new Date(),
    service: process.env.SERVICE_NAME || 'payment-service',
  });
};

module.exports = {
  getHealth,
};