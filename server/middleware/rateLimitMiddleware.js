/**
 * Rate Limiting Middleware
 * Prevents abuse of user settings endpoints
 */

const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for user settings updates
 * Allows 10 requests per 15 minutes per user
 */
const userSettingsRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each user to 10 requests per windowMs
  message: {
    success: false,
    error: 'Too many settings update requests',
    message: 'Please wait before making more changes to your settings',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: (req) => {
    // Use user ID if available, otherwise fall back to IP
    return req.user?.id || req.ip;
  },
  handler: (req, res) => {
    console.warn('🚫 Rate limit exceeded for user settings:', {
      userId: req.user?.id || 'anonymous',
      ip: req.ip,
      path: req.path,
      timestamp: new Date().toISOString()
    });

    res.status(429).json({
      success: false,
      error: 'Too many settings update requests',
      message: 'Please wait before making more changes to your settings',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: '15 minutes',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Rate limiter for notification settings updates
 * Allows 20 requests per 15 minutes per user (more lenient)
 */
const notificationSettingsRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each user to 20 requests per windowMs
  message: {
    success: false,
    error: 'Too many notification update requests',
    message: 'Please wait before making more changes to your notification settings',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  },
  handler: (req, res) => {
    console.warn('🚫 Rate limit exceeded for notification settings:', {
      userId: req.user?.id || 'anonymous',
      ip: req.ip,
      path: req.path,
      timestamp: new Date().toISOString()
    });

    res.status(429).json({
      success: false,
      error: 'Too many notification update requests',
      message: 'Please wait before making more changes to your notification settings',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: '15 minutes',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Rate limiter for file uploads
 * Allows 5 uploads per 10 minutes per user
 */
const fileUploadRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // Limit each user to 5 uploads per windowMs
  message: {
    success: false,
    error: 'Too many file upload requests',
    message: 'Please wait before uploading more files',
    code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
    retryAfter: '10 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  },
  handler: (req, res) => {
    console.warn('🚫 Rate limit exceeded for file uploads:', {
      userId: req.user?.id || 'anonymous',
      ip: req.ip,
      path: req.path,
      timestamp: new Date().toISOString()
    });

    res.status(429).json({
      success: false,
      error: 'Too many file upload requests',
      message: 'Please wait before uploading more files',
      code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
      retryAfter: '10 minutes',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * General rate limiter for user settings endpoints
 * Allows 50 requests per hour per user
 */
const generalUserSettingsRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Limit each user to 50 requests per hour
  message: {
    success: false,
    error: 'Too many requests',
    message: 'Please wait before making more requests',
    code: 'GENERAL_RATE_LIMIT_EXCEEDED',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  },
  handler: (req, res) => {
    console.warn('🚫 General rate limit exceeded:', {
      userId: req.user?.id || 'anonymous',
      ip: req.ip,
      path: req.path,
      timestamp: new Date().toISOString()
    });

    res.status(429).json({
      success: false,
      error: 'Too many requests',
      message: 'Please wait before making more requests',
      code: 'GENERAL_RATE_LIMIT_EXCEEDED',
      retryAfter: '1 hour',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = {
  userSettingsRateLimit,
  notificationSettingsRateLimit,
  fileUploadRateLimit,
  generalUserSettingsRateLimit
};
