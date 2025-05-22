const logger = require("./logger");

/**
 * Hàm retry khi gọi API thất bại
 * @param {Function} fn - Hàm async cần retry
 * @param {Object} options - Tùy chọn retry
 * @param {number} options.maxRetries - Số lần retry tối đa (mặc định: 3)
 * @param {number} options.delayMs - Thời gian delay giữa các lần retry (mặc định: 1000ms)
 * @param {Function} options.shouldRetry - Hàm kiểm tra có nên retry không
 * @param {string} options.requestId - ID request để trace log
 * @returns {Promise<any>} - Kết quả từ hàm gốc
 */
const retry = async (
  fn,
  {
    maxRetries = 3,
    delayMs = 1000,
    shouldRetry = (error) => {
      // Mặc định retry cho lỗi mạng hoặc server timeout (503, 504)
      return (
        error.code === "ECONNREFUSED" ||
        error.code === "ETIMEDOUT" ||
        (error.response &&
          (error.response.status === 503 || error.response.status === 504))
      );
    },
    requestId = "unknown",
  } = {}
) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      // Thử thực hiện hàm
      return await fn();
    } catch (error) {
      lastError = error;

      // Kiểm tra xem có nên retry không
      if (attempt <= maxRetries && shouldRetry(error)) {
        const nextDelayMs = delayMs * Math.pow(2, attempt - 1); // Exponential backoff

        logger.warn(
          `[${requestId}] Attempt ${attempt}/${maxRetries + 1} failed. Retrying in ${nextDelayMs}ms. Error: ${error.message}`
        );

        // Delay trước khi retry
        await new Promise((resolve) => setTimeout(resolve, nextDelayMs));
        continue;
      }

      // Nếu không retry hoặc đã hết số lần retry, throw lại error
      throw error;
    }
  }
};

module.exports = { retry };
