/**
 * Error Handler Middleware
 * Centralized error handling for Saytrix routes
 */

const { formatError } = require('../utils/responseFormatter');

/**
 * Async wrapper to catch errors in async route handlers
 * @param {function} fn - Async route handler function
 * @returns {function} Wrapped function with error handling
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Saytrix-specific error handler middleware
 * @param {Error} err - Error object
 * @param {object} req - Express request
 * @param {object} res - Express response
 * @param {function} next - Express next function
 */
const saytrixErrorHandler = (err, req, res, next) => {
  console.error('🚨 Saytrix Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
    userId: req.body?.userId || req.params?.userId || 'unknown',
    sessionId: req.body?.sessionId || req.params?.sessionId || 'unknown',
    timestamp: new Date().toISOString()
  });

  // Determine status code and error type
  let statusCode = err.statusCode || err.status || 500;
  let errorCode = err.code || 'INTERNAL_ERROR';
  let message = err.message || 'Internal server error';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = 'Validation failed';
  } else if (err.name === 'CastError') {
    statusCode = 400;
    errorCode = 'INVALID_ID';
    message = 'Invalid ID format';
  } else if (err.code === 11000) {
    statusCode = 409;
    errorCode = 'DUPLICATE_ENTRY';
    message = 'Duplicate entry';
  } else if (err.message.includes('Gemini')) {
    statusCode = 502;
    errorCode = 'AI_SERVICE_ERROR';
    message = 'AI service temporarily unavailable';
  } else if (err.message.includes('MongoDB') || err.message.includes('database')) {
    statusCode = 503;
    errorCode = 'DATABASE_ERROR';
    message = 'Database service temporarily unavailable';
  } else if (err.message.includes('API key') || err.message.includes('authentication')) {
    statusCode = 401;
    errorCode = 'AUTHENTICATION_ERROR';
    message = 'Authentication failed';
  } else if (err.message.includes('quota') || err.message.includes('rate limit')) {
    statusCode = 429;
    errorCode = 'RATE_LIMIT_ERROR';
    message = 'Rate limit exceeded';
  }

  // Create error response
  const errorResponse = formatError(
    message,
    statusCode,
    errorCode,
    {
      ...(process.env.NODE_ENV === 'development' && { 
        stack: err.stack,
        originalMessage: err.message 
      }),
      path: req.path,
      method: req.method,
      service: 'saytrix'
    }
  );

  res.status(statusCode).json(errorResponse);
};

/**
 * 404 Not Found handler for Saytrix routes
 * @param {object} req - Express request
 * @param {object} res - Express response
 * @param {function} next - Express next function
 */
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  error.code = 'ROUTE_NOT_FOUND';
  next(error);
};

/**
 * Request logger middleware for Saytrix
 * @param {object} req - Express request
 * @param {object} res - Express response
 * @param {function} next - Express next function
 */
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request
  console.log(`📥 ${req.method} ${req.path}`, {
    userId: req.body?.userId || req.params?.userId || 'anonymous',
    sessionId: req.body?.sessionId || req.params?.sessionId || 'none',
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 400 ? '❌' : '✅';
    
    console.log(`${logLevel} ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });

  next();
};

/**
 * Validation error creator
 * @param {string|array} errors - Validation errors
 * @param {number} statusCode - HTTP status code
 * @returns {Error} Validation error
 */
const createValidationError = (errors, statusCode = 400) => {
  const error = new Error(Array.isArray(errors) ? errors.join(', ') : errors);
  error.statusCode = statusCode;
  error.code = 'VALIDATION_ERROR';
  error.name = 'ValidationError';
  return error;
};

/**
 * Service error creator
 * @param {string} service - Service name
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @returns {Error} Service error
 */
const createServiceError = (service, message, statusCode = 502) => {
  const error = new Error(`${service} service error: ${message}`);
  error.statusCode = statusCode;
  error.code = `${service.toUpperCase()}_SERVICE_ERROR`;
  error.service = service;
  return error;
};

/**
 * Database error creator
 * @param {string} operation - Database operation
 * @param {string} message - Error message
 * @returns {Error} Database error
 */
const createDatabaseError = (operation, message) => {
  const error = new Error(`Database ${operation} failed: ${message}`);
  error.statusCode = 503;
  error.code = 'DATABASE_ERROR';
  error.operation = operation;
  return error;
};

/**
 * Rate limit error creator
 * @param {string} resource - Limited resource
 * @param {number} retryAfter - Retry after seconds
 * @returns {Error} Rate limit error
 */
const createRateLimitError = (resource, retryAfter = 60) => {
  const error = new Error(`Rate limit exceeded for ${resource}`);
  error.statusCode = 429;
  error.code = 'RATE_LIMIT_ERROR';
  error.retryAfter = retryAfter;
  return error;
};

/**
 * Health check for error handling system
 * @returns {object} Health status
 */
const getErrorHandlerHealth = () => {
  return {
    status: 'healthy',
    middleware: 'active',
    logging: 'enabled',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  };
};

module.exports = {
  asyncHandler,
  saytrixErrorHandler,
  notFoundHandler,
  requestLogger,
  createValidationError,
  createServiceError,
  createDatabaseError,
  createRateLimitError,
  getErrorHandlerHealth
};
