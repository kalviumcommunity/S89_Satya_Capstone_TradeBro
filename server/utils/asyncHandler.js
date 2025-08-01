/**
 * Enhanced Async Handler Utility
 * Wraps async route handlers to catch errors automatically with enhanced logging
 */

/**
 * Wraps async route handlers to automatically catch and forward errors
 * @param {Function} fn - Async route handler function
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    const startTime = Date.now();

    Promise.resolve(fn(req, res, next))
      .then(() => {
        // Log successful requests in development
        if (process.env.NODE_ENV === 'development') {
          const duration = Date.now() - startTime;
          console.log(`✅ ${req.method} ${req.path} completed in ${duration}ms`);
        }
      })
      .catch((error) => {
        const duration = Date.now() - startTime;

        // Enhanced error logging
        console.error(`❌ ${req.method} ${req.path} failed in ${duration}ms:`, {
          message: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
          params: req.params,
          query: req.query,
          body: req.method !== 'GET' ? req.body : undefined
        });

        // Add duration to error for potential use in error handler
        error.duration = duration;
        next(error);
      });
  };
};

module.exports = asyncHandler;
