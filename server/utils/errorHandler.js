/**
 * Error Handler Utility
 * Centralized error handling for consistent API responses
 */

/**
 * Standard error response format
 * @param {object} res - Express response object
 * @param {Error|string} error - Error object or message
 * @param {number} statusCode - HTTP status code
 * @param {string} code - Error code for client handling
 * @param {object} details - Additional error details
 */
const sendErrorResponse = (res, error, statusCode = 500, code = 'INTERNAL_ERROR', details = {}) => {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const timestamp = new Date().toISOString();

  // Log error for debugging
  console.error(`❌ API Error [${code}]:`, {
    message: errorMessage,
    statusCode,
    code,
    details,
    stack: process.env.NODE_ENV === 'development' && error.stack ? error.stack : undefined,
    timestamp
  });

  // Send standardized error response
  res.status(statusCode).json({
    success: false,
    error: errorMessage,
    code,
    timestamp,
    ...(process.env.NODE_ENV === 'development' && { details })
  });
};

/**
 * Standard success response format
 * @param {object} res - Express response object
 * @param {any} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code
 * @param {object} meta - Additional metadata
 */
const sendSuccessResponse = (res, data, message = 'Success', statusCode = 200, meta = {}) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
    ...meta
  });
};

/**
 * Handle validation errors
 * @param {object} res - Express response object
 * @param {object} validationError - Validation error object
 */
const handleValidationError = (res, validationError) => {
  const errors = validationError.details?.map(detail => ({
    field: detail.path.join('.'),
    message: detail.message,
    value: detail.context?.value
  })) || [];

  sendErrorResponse(
    res,
    'Validation failed',
    400,
    'VALIDATION_ERROR',
    { errors }
  );
};

/**
 * Handle MongoDB errors
 * @param {object} res - Express response object
 * @param {Error} error - MongoDB error
 */
const handleDatabaseError = (res, error) => {
  let statusCode = 500;
  let code = 'DATABASE_ERROR';
  let message = 'Database operation failed';

  // Handle specific MongoDB errors
  if (error.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Data validation failed';
  } else if (error.name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_ID';
    message = 'Invalid ID format';
  } else if (error.code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE_ENTRY';
    message = 'Duplicate entry detected';
  } else if (error.name === 'DocumentNotFoundError') {
    statusCode = 404;
    code = 'NOT_FOUND';
    message = 'Document not found';
  }

  sendErrorResponse(res, message, statusCode, code, {
    mongoError: error.name,
    mongoCode: error.code
  });
};

/**
 * Handle authentication errors
 * @param {object} res - Express response object
 * @param {string} message - Error message
 */
const handleAuthError = (res, message = 'Authentication failed') => {
  sendErrorResponse(res, message, 401, 'AUTH_ERROR');
};

/**
 * Handle authorization errors
 * @param {object} res - Express response object
 * @param {string} message - Error message
 */
const handleAuthorizationError = (res, message = 'Access denied') => {
  sendErrorResponse(res, message, 403, 'AUTHORIZATION_ERROR');
};

/**
 * Handle not found errors
 * @param {object} res - Express response object
 * @param {string} resource - Resource that was not found
 */
const handleNotFoundError = (res, resource = 'Resource') => {
  sendErrorResponse(res, `${resource} not found`, 404, 'NOT_FOUND');
};

/**
 * Handle rate limit errors
 * @param {object} res - Express response object
 * @param {string} message - Rate limit message
 */
const handleRateLimitError = (res, message = 'Too many requests') => {
  sendErrorResponse(res, message, 429, 'RATE_LIMIT_EXCEEDED');
};

/**
 * Express error handling middleware
 * @param {Error} err - Error object
 * @param {object} req - Express request
 * @param {object} res - Express response
 * @param {function} next - Express next function
 */
const errorMiddleware = (err, req, res, next) => {
  // If response already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(err);
  }

  // Handle different types of errors
  if (err.name === 'ValidationError' || err.isJoi) {
    return handleValidationError(res, err);
  }

  if (err.name === 'MongoError' || err.name === 'MongooseError') {
    return handleDatabaseError(res, err);
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return handleAuthError(res, 'Invalid or expired token');
  }

  // Default error handling
  sendErrorResponse(res, err.message || 'Internal server error', err.statusCode || 500, err.code || 'INTERNAL_ERROR');
};

/**
 * Async wrapper to catch errors in async route handlers
 * @param {function} fn - Async function to wrap
 * @returns {function} Wrapped function
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Create custom error with status code
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {string} code - Error code
 * @returns {Error} Custom error object
 */
const createError = (message, statusCode = 500, code = 'CUSTOM_ERROR') => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
};

module.exports = {
  sendErrorResponse,
  sendSuccessResponse,
  handleValidationError,
  handleDatabaseError,
  handleAuthError,
  handleAuthorizationError,
  handleNotFoundError,
  handleRateLimitError,
  errorMiddleware,
  asyncHandler,
  createError
};
