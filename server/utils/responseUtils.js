/**
 * Response Utilities for standardizing API responses
 * This module provides utility functions for creating consistent API responses
 */

/**
 * Creates a success response object
 * @param {string} message - Success message
 * @param {*} data - Response data
 * @param {number} statusCode - HTTP status code (default: 200)
 * @returns {Object} Standardized success response object
 */
const successResponse = (message = 'Operation successful', data = null, statusCode = 200) => {
  return {
    success: true,
    message,
    data,
    statusCode
  };
};

/**
 * Creates an error response object
 * @param {string} message - Error message
 * @param {*} error - Error details (optional)
 * @param {number} statusCode - HTTP status code (default: 500)
 * @returns {Object} Standardized error response object
 */
const errorResponse = (message = 'An error occurred', error = null, statusCode = 500) => {
  // In production, we might want to sanitize error details
  const errorDetails = process.env.NODE_ENV === 'production' && error 
    ? { message: error.message } 
    : error;

  return {
    success: false,
    message,
    error: errorDetails,
    statusCode
  };
};

/**
 * Sends a standardized success response
 * @param {Object} res - Express response object
 * @param {string} message - Success message
 * @param {*} data - Response data
 * @param {number} statusCode - HTTP status code (default: 200)
 */
const sendSuccess = (res, message = 'Operation successful', data = null, statusCode = 200) => {
  const response = successResponse(message, data, statusCode);
  return res.status(statusCode).json(response);
};

/**
 * Sends a standardized error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {*} error - Error details (optional)
 * @param {number} statusCode - HTTP status code (default: 500)
 */
const sendError = (res, message = 'An error occurred', error = null, statusCode = 500) => {
  const response = errorResponse(message, error, statusCode);
  
  // Log the error for server-side debugging
  console.error(`API Error (${statusCode}): ${message}`, error);
  
  return res.status(statusCode).json(response);
};

/**
 * Creates a validation error response
 * @param {Object} res - Express response object
 * @param {string} message - Validation error message
 * @param {Object} errors - Validation errors object
 */
const sendValidationError = (res, message = 'Validation failed', errors = {}) => {
  return sendError(res, message, { validationErrors: errors }, 400);
};

/**
 * Creates a not found response
 * @param {Object} res - Express response object
 * @param {string} message - Not found message
 */
const sendNotFound = (res, message = 'Resource not found') => {
  return sendError(res, message, null, 404);
};

/**
 * Creates an unauthorized response
 * @param {Object} res - Express response object
 * @param {string} message - Unauthorized message
 */
const sendUnauthorized = (res, message = 'Unauthorized access') => {
  return sendError(res, message, null, 401);
};

/**
 * Creates a forbidden response
 * @param {Object} res - Express response object
 * @param {string} message - Forbidden message
 */
const sendForbidden = (res, message = 'Access forbidden') => {
  return sendError(res, message, null, 403);
};

module.exports = {
  successResponse,
  errorResponse,
  sendSuccess,
  sendError,
  sendValidationError,
  sendNotFound,
  sendUnauthorized,
  sendForbidden
};
