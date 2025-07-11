/**
 * Response Formatter Utility
 * Provides consistent response structure across all Saytrix endpoints
 */

/**
 * Format successful response
 * @param {any} data - Response data
 * @param {string} message - Optional success message
 * @param {object} meta - Optional metadata
 * @returns {object} Formatted success response
 */
const formatSuccess = (data, message = null, meta = {}) => {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
    ...meta
  };
};

/**
 * Format error response
 * @param {string} error - Error message
 * @param {number} statusCode - HTTP status code
 * @param {string} code - Error code for client handling
 * @param {object} details - Additional error details
 * @returns {object} Formatted error response
 */
const formatError = (error, statusCode = 500, code = 'INTERNAL_ERROR', details = {}) => {
  return {
    success: false,
    error,
    code,
    statusCode,
    timestamp: new Date().toISOString(),
    ...details
  };
};

/**
 * Format validation error response
 * @param {string|array} errors - Validation error(s)
 * @param {object} details - Additional validation details
 * @returns {object} Formatted validation error response
 */
const formatValidationError = (errors, details = {}) => {
  return formatError(
    Array.isArray(errors) ? errors : [errors],
    400,
    'VALIDATION_ERROR',
    { validationErrors: errors, ...details }
  );
};

/**
 * Format chat response with enhanced structure
 * @param {object} params - Chat response parameters
 * @returns {object} Formatted chat response
 */
const formatChatResponse = ({
  response,
  stockData = null,
  additionalData = null,
  suggestions = [],
  sessionId,
  userMessage = null,
  assistantMessage = null,
  intent = null,
  isVoiceResponse = false
}) => {
  return formatSuccess({
    response,
    stockData,
    additionalData,
    suggestions,
    sessionId,
    userMessage,
    assistantMessage,
    intent,
    isVoiceResponse,
    responseTime: new Date().toISOString()
  });
};

/**
 * Format session response
 * @param {object} session - Session data
 * @returns {object} Formatted session response
 */
const formatSessionResponse = (session) => {
  return formatSuccess({
    session: {
      id: session.id || session.sessionId,
      messages: session.messages || [],
      createdAt: session.createdAt || session.metadata?.startedAt,
      lastActivity: session.lastActivity || session.metadata?.lastActiveAt,
      totalMessages: session.messages?.length || 0,
      isActive: session.isActive !== false
    }
  });
};

/**
 * Format history response with pagination
 * @param {array} chatHistory - Chat history data
 * @param {object} pagination - Pagination metadata
 * @returns {object} Formatted history response
 */
const formatHistoryResponse = (chatHistory, pagination = {}) => {
  return formatSuccess({
    chatHistory,
    pagination: {
      page: pagination.page || 1,
      limit: pagination.limit || 10,
      total: pagination.total || chatHistory.length,
      totalPages: pagination.totalPages || Math.ceil((pagination.total || chatHistory.length) / (pagination.limit || 10)),
      hasNext: pagination.hasNext || false,
      hasPrev: pagination.hasPrev || false
    }
  });
};

/**
 * Format statistics response
 * @param {object} stats - Statistics data
 * @returns {object} Formatted statistics response
 */
const formatStatsResponse = (stats) => {
  return formatSuccess({
    statistics: {
      totalSessions: stats.totalSessions || 0,
      totalMessages: stats.totalMessages || 0,
      lastActiveAt: stats.lastActiveAt,
      firstSessionAt: stats.firstSessionAt,
      averageMessagesPerSession: stats.totalSessions > 0 
        ? Math.round((stats.totalMessages || 0) / stats.totalSessions) 
        : 0,
      activeDays: stats.activeDays || 0
    }
  });
};

/**
 * Format health check response
 * @param {object} healthData - Health check data
 * @returns {object} Formatted health response
 */
const formatHealthResponse = (healthData = {}) => {
  return formatSuccess({
    status: 'healthy',
    service: 'saytrix',
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    activeSessions: healthData.activeSessions || 0,
    memoryUsage: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  });
};

/**
 * Format stock data response
 * @param {object} stockData - Stock data
 * @param {string} symbol - Stock symbol
 * @returns {object} Formatted stock response
 */
const formatStockResponse = (stockData, symbol) => {
  if (!stockData) {
    return formatError(
      `Stock data not found for symbol: ${symbol}`,
      404,
      'STOCK_NOT_FOUND',
      { symbol }
    );
  }

  return formatSuccess({
    stock: stockData,
    symbol: symbol.toUpperCase(),
    lastUpdated: stockData.lastUpdated || new Date().toISOString()
  });
};

/**
 * Format market movers response
 * @param {array} movers - Market movers data
 * @param {string} type - Type of movers (gainers/losers)
 * @returns {object} Formatted movers response
 */
const formatMoversResponse = (movers, type) => {
  return formatSuccess({
    movers,
    type,
    count: movers.length,
    lastUpdated: new Date().toISOString()
  });
};

/**
 * Format news response
 * @param {array} news - News articles
 * @param {string} symbol - Optional stock symbol for filtered news
 * @returns {object} Formatted news response
 */
const formatNewsResponse = (news, symbol = null) => {
  return formatSuccess({
    news,
    symbol,
    count: news.length,
    lastUpdated: new Date().toISOString()
  });
};

/**
 * Format suggestions response
 * @param {array} suggestions - Suggestion items
 * @returns {object} Formatted suggestions response
 */
const formatSuggestionsResponse = (suggestions) => {
  return formatSuccess({
    suggestions,
    count: suggestions.length
  });
};

/**
 * Express middleware for consistent error responses
 * @param {Error} err - Error object
 * @param {object} req - Express request
 * @param {object} res - Express response
 * @param {function} next - Express next function
 */
const errorResponseMiddleware = (err, req, res, next) => {
  console.error('Saytrix Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Determine status code
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
  }

  const errorResponse = formatError(
    message,
    statusCode,
    errorCode,
    {
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
      path: req.path,
      method: req.method
    }
  );

  res.status(statusCode).json(errorResponse);
};

module.exports = {
  formatSuccess,
  formatError,
  formatValidationError,
  formatChatResponse,
  formatSessionResponse,
  formatHistoryResponse,
  formatStatsResponse,
  formatHealthResponse,
  formatStockResponse,
  formatMoversResponse,
  formatNewsResponse,
  formatSuggestionsResponse,
  errorResponseMiddleware
};
