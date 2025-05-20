/**
 * Custom API Error class
 */
class ApiError extends Error {
  constructor(statusCode, message, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Error handler middleware for Express
 */
const errorHandler = (err, req, res, next) => {
  const { statusCode = 500, message, isOperational = false, stack } = err;
  
  // Không ghi log validation errors và operational errors
  if (!isOperational) {
    console.error('ERROR 💥', err);
  }
  
  const response = {
    status: 'error',
    message: statusCode === 500 ? 'Internal server error' : message
  };
  
  // Thêm stack trace trong development
  if (process.env.NODE_ENV === 'development') {
    response.stack = stack;
  }
  
  res.status(statusCode).json(response);
};

module.exports = {
  ApiError,
  errorHandler
};