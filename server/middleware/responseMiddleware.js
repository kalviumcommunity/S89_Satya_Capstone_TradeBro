/**
 * Response Middleware
 * Extends Express response object with standardized response methods
 */

const {
  sendSuccess,
  sendError,
  sendValidationError,
  sendNotFound,
  sendUnauthorized,
  sendForbidden
} = require('../utils/responseUtils');

/**
 * Middleware that extends the Express response object with standardized response methods
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const responseMiddleware = (req, res, next) => {
  // Add success response method
  res.success = function(message, data, statusCode) {
    return sendSuccess(this, message, data, statusCode);
  };

  // Add error response method
  res.error = function(message, error, statusCode) {
    return sendError(this, message, error, statusCode);
  };

  // Add validation error response method
  res.validationError = function(message, errors) {
    return sendValidationError(this, message, errors);
  };

  // Add not found response method
  res.notFound = function(message) {
    return sendNotFound(this, message);
  };

  // Add unauthorized response method
  res.unauthorized = function(message) {
    return sendUnauthorized(this, message);
  };

  // Add forbidden response method
  res.forbidden = function(message) {
    return sendForbidden(this, message);
  };

  next();
};

module.exports = responseMiddleware;
