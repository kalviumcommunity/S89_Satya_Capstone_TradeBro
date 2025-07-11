/**
 * Input Validation Middleware
 * Schema-based validation using Joi
 */

const Joi = require('joi');
const { handleValidationError } = require('../utils/errorHandler');

/**
 * User data creation/update schema
 */
const userDataSchema = Joi.object({
  preferences: Joi.object({
    theme: Joi.string().valid('light', 'dark', 'auto').default('light'),
    language: Joi.string().valid('en', 'es', 'fr', 'de', 'zh', 'ja', 'hi').default('en'),
    notifications: Joi.object({
      email: Joi.boolean().default(true),
      push: Joi.boolean().default(true),
      sms: Joi.boolean().default(false)
    }).default({}),
    privacy: Joi.object({
      profileVisibility: Joi.string().valid('public', 'private', 'friends').default('public'),
      showOnlineStatus: Joi.boolean().default(true),
      allowMessages: Joi.boolean().default(true)
    }).default({})
  }).default({}),
  profile: Joi.object({
    bio: Joi.string().max(500).allow('').default(''),
    location: Joi.string().max(100).allow('').default(''),
    website: Joi.string().uri().allow('').default(''),
    socialLinks: Joi.object({
      twitter: Joi.string().allow('').default(''),
      linkedin: Joi.string().allow('').default(''),
      github: Joi.string().allow('').default('')
    }).default({})
  }).default({})
});

/**
 * Chat message schema
 */
const chatMessageSchema = Joi.object({
  message: Joi.string().required().min(1).max(2000).trim(),
  sessionId: Joi.string().required().min(1).max(100),
  metadata: Joi.object({
    type: Joi.string().valid('text', 'image', 'file', 'system').default('text'),
    timestamp: Joi.date().default(Date.now),
    clientId: Joi.string().allow('').default(''),
    platform: Joi.string().valid('web', 'mobile', 'desktop').default('web')
  }).default({})
});

/**
 * Chat history query schema
 */
const chatHistorySchema = Joi.object({
  sessionId: Joi.string().optional().min(1).max(100),
  limit: Joi.number().integer().min(1).max(100).default(20),
  offset: Joi.number().integer().min(0).default(0),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional().when('startDate', {
    is: Joi.exist(),
    then: Joi.date().min(Joi.ref('startDate'))
  })
});

/**
 * Session end schema
 */
const endSessionSchema = Joi.object({
  sessionId: Joi.string().required().min(1).max(100),
  reason: Joi.string().valid('user_ended', 'timeout', 'error', 'system').default('user_ended'),
  metadata: Joi.object({
    duration: Joi.number().integer().min(0).optional(),
    messageCount: Joi.number().integer().min(0).optional(),
    rating: Joi.number().integer().min(1).max(5).optional()
  }).default({})
});

/**
 * Statistics update schema
 */
const statisticsUpdateSchema = Joi.object({
  customStats: Joi.object({
    loginCount: Joi.number().integer().min(0).optional(),
    sessionDuration: Joi.number().integer().min(0).optional(),
    featuresUsed: Joi.array().items(Joi.string()).optional(),
    lastActiveFeature: Joi.string().optional()
  }).optional()
});

/**
 * Pagination schema
 */
const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string().valid('createdAt', 'updatedAt', 'timestamp').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

/**
 * Generic validation middleware factory
 * @param {object} schema - Joi schema to validate against
 * @param {string} source - Source of data to validate ('body', 'query', 'params')
 * @returns {function} Express middleware function
 */
const validateInput = (schema, source = 'body') => {
  return (req, res, next) => {
    const dataToValidate = req[source];
    
    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false, // Return all validation errors
      allowUnknown: false, // Don't allow unknown fields
      stripUnknown: true // Remove unknown fields
    });

    if (error) {
      return handleValidationError(res, error);
    }

    // Replace the original data with validated and sanitized data
    req[source] = value;
    next();
  };
};

/**
 * Validate user data input
 */
const validateUserData = validateInput(userDataSchema, 'body');

/**
 * Validate chat message input
 */
const validateChatMessage = validateInput(chatMessageSchema, 'body');

/**
 * Validate chat history query parameters
 */
const validateChatHistoryQuery = validateInput(chatHistorySchema, 'query');

/**
 * Validate session end input
 */
const validateEndSession = validateInput(endSessionSchema, 'body');

/**
 * Validate statistics update input
 */
const validateStatisticsUpdate = validateInput(statisticsUpdateSchema, 'body');

/**
 * Validate pagination parameters
 */
const validatePagination = validateInput(paginationSchema, 'query');

/**
 * Validate MongoDB ObjectId
 * @param {string} paramName - Parameter name to validate
 * @returns {function} Express middleware function
 */
const validateObjectId = (paramName = 'id') => {
  const objectIdSchema = Joi.object({
    [paramName]: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
  });

  return validateInput(objectIdSchema, 'params');
};

/**
 * Sanitize string input to prevent XSS
 * @param {string} input - Input string to sanitize
 * @returns {string} Sanitized string
 */
const sanitizeString = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .trim();
};

/**
 * Sanitize object recursively
 * @param {any} obj - Object to sanitize
 * @returns {any} Sanitized object
 */
const sanitizeObject = (obj) => {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
};

/**
 * Sanitization middleware
 * @param {string} source - Source of data to sanitize ('body', 'query', 'params')
 * @returns {function} Express middleware function
 */
const sanitizeInput = (source = 'body') => {
  return (req, res, next) => {
    if (req[source]) {
      req[source] = sanitizeObject(req[source]);
    }
    next();
  };
};

module.exports = {
  validateUserData,
  validateChatMessage,
  validateChatHistoryQuery,
  validateEndSession,
  validateStatisticsUpdate,
  validatePagination,
  validateObjectId,
  validateInput,
  sanitizeInput,
  sanitizeString,
  sanitizeObject,
  // Export schemas for testing
  schemas: {
    userDataSchema,
    chatMessageSchema,
    chatHistorySchema,
    endSessionSchema,
    statisticsUpdateSchema,
    paginationSchema
  }
};
