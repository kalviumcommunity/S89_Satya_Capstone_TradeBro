/**
 * Compression Middleware
 * Handles JSON response compression for better performance
 */

const compression = require('compression');

/**
 * Custom compression filter
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {boolean} Whether to compress the response
 */
const shouldCompress = (req, res) => {
  // Don't compress if client doesn't support it
  if (req.headers['x-no-compression']) {
    return false;
  }

  // Don't compress small responses (less than 1KB)
  const contentLength = res.getHeader('content-length');
  if (contentLength && parseInt(contentLength) < 1024) {
    return false;
  }

  // Use compression's default filter for other cases
  return compression.filter(req, res);
};

/**
 * Compression configuration
 */
const compressionConfig = {
  // Compression level (1-9, 6 is default)
  level: 6,
  
  // Compression threshold (minimum size to compress)
  threshold: 1024, // 1KB
  
  // Custom filter function
  filter: shouldCompress,
  
  // Memory level (1-9, 8 is default)
  memLevel: 8,
  
  // Window bits (9-15, 15 is default)
  windowBits: 15,
  
  // Chunk size (default 16384)
  chunkSize: 16384
};

/**
 * Create compression middleware with custom configuration
 * @param {object} options - Custom compression options
 * @returns {function} Express middleware
 */
const createCompressionMiddleware = (options = {}) => {
  const config = { ...compressionConfig, ...options };
  return compression(config);
};

/**
 * Default compression middleware
 */
const compressionMiddleware = createCompressionMiddleware();

/**
 * High compression middleware for large responses
 */
const highCompressionMiddleware = createCompressionMiddleware({
  level: 9,
  threshold: 512 // Compress smaller responses
});

/**
 * Fast compression middleware for real-time data
 */
const fastCompressionMiddleware = createCompressionMiddleware({
  level: 1,
  threshold: 2048 // Only compress larger responses
});

module.exports = {
  compressionMiddleware,
  highCompressionMiddleware,
  fastCompressionMiddleware,
  createCompressionMiddleware,
  shouldCompress
};
