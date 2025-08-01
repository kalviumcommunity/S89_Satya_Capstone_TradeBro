/**
 * Simple Rate Limiter Middleware
 * Fallback implementation when express-rate-limit is not available
 */

// Try to use express-rate-limit if available
let rateLimit;
try {
  rateLimit = require('express-rate-limit');
} catch (error) {
  console.warn('express-rate-limit not available, using built-in rate limiter');
  rateLimit = null;
}

// Simple in-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map();

/**
 * Simple rate limiter implementation
 * @param {Object} options - Rate limit options
 * @returns {Function} Express middleware function
 */
const simpleRateLimit = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 5, // Max requests per window
    message = 'Too many requests, please try again later.',
    skipSuccessfulRequests = false
  } = options;

  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    
    // Clean up old entries
    for (const [storeKey, data] of rateLimitStore.entries()) {
      if (now - data.resetTime > windowMs) {
        rateLimitStore.delete(storeKey);
      }
    }
    
    // Get or create rate limit data for this IP
    let rateLimitData = rateLimitStore.get(key);
    if (!rateLimitData || now - rateLimitData.resetTime > windowMs) {
      rateLimitData = {
        count: 0,
        resetTime: now
      };
      rateLimitStore.set(key, rateLimitData);
    }
    
    // Check if limit exceeded
    if (rateLimitData.count >= max) {
      const retryAfter = Math.ceil((windowMs - (now - rateLimitData.resetTime)) / 1000);
      
      res.set({
        'X-RateLimit-Limit': max,
        'X-RateLimit-Remaining': 0,
        'X-RateLimit-Reset': new Date(rateLimitData.resetTime + windowMs).toISOString(),
        'Retry-After': retryAfter
      });
      
      return res.status(429).json(
        typeof message === 'object' ? message : { 
          success: false, 
          message,
          retryAfter: `${Math.ceil(retryAfter / 60)} minutes`
        }
      );
    }
    
    // Increment counter
    rateLimitData.count++;
    
    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': max,
      'X-RateLimit-Remaining': Math.max(0, max - rateLimitData.count),
      'X-RateLimit-Reset': new Date(rateLimitData.resetTime + windowMs).toISOString()
    });
    
    // Handle successful requests
    if (skipSuccessfulRequests) {
      const originalSend = res.send;
      res.send = function(data) {
        if (res.statusCode < 400) {
          // Decrement counter for successful requests
          rateLimitData.count = Math.max(0, rateLimitData.count - 1);
        }
        return originalSend.call(this, data);
      };
    }
    
    next();
  };
};

/**
 * Create rate limiter with fallback
 * @param {Object} options - Rate limit options
 * @returns {Function} Express middleware function
 */
const createRateLimit = (options = {}) => {
  if (rateLimit) {
    return rateLimit(options);
  } else {
    return simpleRateLimit(options);
  }
};

module.exports = {
  createRateLimit,
  simpleRateLimit
};
