const axios = require("axios");
const logger = require("./logger");

/**
 * Tạo client để gọi các service khác
 * @param {string} baseURL - URL cơ sở của service
 * @returns {Object} Client với các phương thức HTTP
 */
const createServiceClient = (baseURL) => {
  const client = axios.create({
    baseURL,
    timeout: 5000,
  });

  // Thêm interceptor cho request
  client.interceptors.request.use(
    (config) => {
      const requestId =
        config.headers.requestId ||
        `req-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      config.headers.requestId = requestId;
      logger.info(
        `[${requestId}] Request to ${config.method.toUpperCase()} ${config.url}`
      );
      return config;
    },
    (error) => {
      logger.error(`Request error: ${error.message}`);
      return Promise.reject(error);
    }
  );

  // Thêm interceptor cho response
  client.interceptors.response.use(
    (response) => {
      const requestId = response.config.headers.requestId;
      logger.info(
        `[${requestId}] Response from ${response.config.method.toUpperCase()} ${response.config.url}: ${response.status}`
      );
      return response;
    },
    (error) => {
      const requestId = error.config?.headers?.requestId || "unknown";
      if (error.response) {
        logger.error(
          `[${requestId}] Service error: ${error.response.status} - ${error.response.data?.message || error.message}`
        );
      } else {
        logger.error(`[${requestId}] Service error: ${error.message}`);
      }
      return Promise.reject(error);
    }
  );

  return client;
};

/**
 * Retry utility cho service calls
 * @param {Function} fn - Async function cần retry
 * @param {Object} options - Tùy chọn retry
 * @returns {Promise} Promise kết quả
 */
const retry = async (fn, options = {}) => {
  const {
    retries = 3,
    delay = 300,
    factor = 2,
    shouldRetry = (err) => true,
  } = options;

  let lastError;
  let currentDelay = delay;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      // Nếu đã hết số lần retry hoặc không nên retry
      if (attempt === retries || !shouldRetry(err)) {
        throw lastError;
      }

      // Tăng delay theo exponential backoff
      currentDelay = delay * Math.pow(factor, attempt);

      // Wait
      await new Promise((resolve) => setTimeout(resolve, currentDelay));
    }
  }
};

module.exports = {
  createServiceClient,
  retry,
};
