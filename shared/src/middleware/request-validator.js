const { ApiError } = require("../utils/error-handler");

/**
 * Factory function tạo middleware validator
 * @param {Function} validationFunction - Hàm validation
 * @returns {Function} Middleware validator
 */
const validate = (validationFunction) => {
  return (req, res, next) => {
    try {
      const { error } = validationFunction(req.body);

      if (error) {
        const errorMessage = error.details
          .map((detail) => detail.message)
          .join(", ");
        throw new ApiError(400, `Validation error: ${errorMessage}`, true);
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = {
  validate,
};
