/**
 * Chat Rate Limiting Middleware
 * Prevents abuse of chat endpoints with configurable rate limits
 */

const rateLimit = require('express-rate-limit');
const { handleRateLimitError } = require('../utils/errorHandler');

/**
 * Rate limiter for chat message endpoints
 * Allows 60 messages per minute per user
 */
const chatMessageRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // Limit each user to 60 messages per minute
  message: {
    success: false,
    error: 'Too many chat messages',
    message: 'Please slow down your messaging rate',
    code: 'CHAT_RATE_LIMIT_EXCEEDED',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID for authenticated requests, IP for others
    return req.user?.id || req.ip;
  },
  handler: (req, res) => {
    console.warn('🚫 Chat message rate limit exceeded:', {
      userId: req.user?.id || 'anonymous',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });

    handleRateLimitError(res, 'Too many chat messages. Please slow down your messaging rate.');
  },
  skip: (req) => {
    // Skip rate limiting for admin users (if implemented)
    return req.user?.role === 'admin';
  }
});

/**
 * Rate limiter for chat history requests
 * Allows 30 requests per 5 minutes per user
 */
const chatHistoryRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30, // Limit each user to 30 history requests per 5 minutes
  message: {
    success: false,
    error: 'Too many chat history requests',
    message: 'Please wait before requesting more chat history',
    code: 'CHAT_HISTORY_RATE_LIMIT_EXCEEDED',
    retryAfter: '5 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  },
  handler: (req, res) => {
    console.warn('🚫 Chat history rate limit exceeded:', {
      userId: req.user?.id || 'anonymous',
      ip: req.ip,
      query: req.query,
      timestamp: new Date().toISOString()
    });

    handleRateLimitError(res, 'Too many chat history requests. Please wait before requesting more.');
  }
});

/**
 * Rate limiter for session management
 * Allows 20 session operations per 10 minutes per user
 */
const sessionManagementRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20, // Limit each user to 20 session operations per 10 minutes
  message: {
    success: false,
    error: 'Too many session operations',
    message: 'Please wait before performing more session operations',
    code: 'SESSION_RATE_LIMIT_EXCEEDED',
    retryAfter: '10 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  },
  handler: (req, res) => {
    console.warn('🚫 Session management rate limit exceeded:', {
      userId: req.user?.id || 'anonymous',
      ip: req.ip,
      operation: req.method,
      path: req.path,
      timestamp: new Date().toISOString()
    });

    handleRateLimitError(res, 'Too many session operations. Please wait before trying again.');
  }
});

/**
 * Rate limiter for user data operations
 * Allows 100 requests per hour per user
 */
const userDataRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // Limit each user to 100 user data operations per hour
  message: {
    success: false,
    error: 'Too many user data requests',
    message: 'Please wait before making more user data requests',
    code: 'USER_DATA_RATE_LIMIT_EXCEEDED',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  },
  handler: (req, res) => {
    console.warn('🚫 User data rate limit exceeded:', {
      userId: req.user?.id || 'anonymous',
      ip: req.ip,
      operation: req.method,
      path: req.path,
      timestamp: new Date().toISOString()
    });

    handleRateLimitError(res, 'Too many user data requests. Please wait before trying again.');
  }
});

/**
 * Rate limiter for statistics requests
 * Allows 50 requests per hour per user
 */
const statisticsRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Limit each user to 50 statistics requests per hour
  message: {
    success: false,
    error: 'Too many statistics requests',
    message: 'Please wait before requesting more statistics',
    code: 'STATISTICS_RATE_LIMIT_EXCEEDED',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  },
  handler: (req, res) => {
    console.warn('🚫 Statistics rate limit exceeded:', {
      userId: req.user?.id || 'anonymous',
      ip: req.ip,
      timestamp: new Date().toISOString()
    });

    handleRateLimitError(res, 'Too many statistics requests. Please wait before trying again.');
  }
});

/**
 * Adaptive rate limiter that adjusts based on user behavior
 * @param {object} options - Rate limit options
 * @returns {function} Express middleware
 */
const createAdaptiveRateLimit = (options = {}) => {
  const {
    baseWindowMs = 60 * 1000,
    baseMax = 30,
    maxWindowMs = 10 * 60 * 1000,
    maxMax = 10
  } = options;

  return rateLimit({
    windowMs: baseWindowMs,
    max: (req) => {
      // Reduce limits for users with recent violations
      const userId = req.user?.id;
      if (userId && req.rateLimit?.violations > 3) {
        return Math.max(maxMax, Math.floor(baseMax / 2));
      }
      return baseMax;
    },
    keyGenerator: (req) => req.user?.id || req.ip,
    handler: (req, res) => {
      // Track violations for adaptive behavior
      const userId = req.user?.id;
      if (userId) {
        req.rateLimit = req.rateLimit || {};
        req.rateLimit.violations = (req.rateLimit.violations || 0) + 1;
      }

      console.warn('🚫 Adaptive rate limit exceeded:', {
        userId: userId || 'anonymous',
        violations: req.rateLimit?.violations || 0,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });

      handleRateLimitError(res, 'Rate limit exceeded. Continued violations may result in stricter limits.');
    }
  });
};

/**
 * Middleware to log rate limit usage
 */
const rateLimitLogger = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Log rate limit headers if present
    const remaining = res.get('RateLimit-Remaining');
    const limit = res.get('RateLimit-Limit');
    
    if (remaining !== undefined && limit !== undefined) {
      const usage = ((limit - remaining) / limit * 100).toFixed(1);
      
      if (usage > 80) { // Log when usage is high
        console.log(`⚠️ High rate limit usage: ${usage}% for user: ${req.user?.id || 'anonymous'}`, {
          endpoint: req.path,
          remaining: parseInt(remaining),
          limit: parseInt(limit),
          timestamp: new Date().toISOString()
        });
      }
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

module.exports = {
  chatMessageRateLimit,
  chatHistoryRateLimit,
  sessionManagementRateLimit,
  userDataRateLimit,
  statisticsRateLimit,
  createAdaptiveRateLimit,
  rateLimitLogger
};
