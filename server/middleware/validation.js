/**
 * Input Validation Middleware
 * Fallback validation without external dependencies
 */

// Try to use Joi if available, otherwise use built-in validation
let Joi;
try {
  Joi = require('joi');
} catch (error) {
  console.warn('Joi not available, using built-in validation');
  Joi = null;
}
const { VALIDATION_RULES, TRADING_EXPERIENCE_OPTIONS, MARKET_OPTIONS, ERROR_MESSAGES } = require('../config/constants');

// User registration validation schema
const signupSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(VALIDATION_RULES.USERNAME_MIN_LENGTH)
    .max(VALIDATION_RULES.USERNAME_MAX_LENGTH)
    .required()
    .messages({
      'string.alphanum': 'Username must contain only letters and numbers',
      'string.min': `Username must be at least ${VALIDATION_RULES.USERNAME_MIN_LENGTH} characters long`,
      'string.max': `Username must not exceed ${VALIDATION_RULES.USERNAME_MAX_LENGTH} characters`,
      'any.required': 'Username is required'
    }),
  
  email: Joi.string()
    .email()
    .max(VALIDATION_RULES.EMAIL_MAX_LENGTH)
    .required()
    .messages({
      'string.email': ERROR_MESSAGES.INVALID_EMAIL,
      'string.max': `Email must not exceed ${VALIDATION_RULES.EMAIL_MAX_LENGTH} characters`,
      'any.required': 'Email is required'
    }),
  
  password: Joi.string()
    .min(VALIDATION_RULES.PASSWORD_MIN_LENGTH)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
    .required()
    .messages({
      'string.min': ERROR_MESSAGES.PASSWORD_TOO_SHORT,
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'Password is required'
    }),
  
  fullName: Joi.string()
    .max(VALIDATION_RULES.FULLNAME_MAX_LENGTH)
    .optional()
    .messages({
      'string.max': `Full name must not exceed ${VALIDATION_RULES.FULLNAME_MAX_LENGTH} characters`
    })
});

// User login validation schema
const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': ERROR_MESSAGES.INVALID_EMAIL,
      'any.required': 'Email is required'
    }),
  
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    })
});

// Profile update validation schema
const profileUpdateSchema = Joi.object({
  fullName: Joi.string()
    .max(VALIDATION_RULES.FULLNAME_MAX_LENGTH)
    .optional()
    .allow('')
    .messages({
      'string.max': `Full name must not exceed ${VALIDATION_RULES.FULLNAME_MAX_LENGTH} characters`
    }),
  
  phoneNumber: Joi.string()
    .pattern(/^[\+]?[1-9][\d]{0,15}$/)
    .optional()
    .allow('')
    .messages({
      'string.pattern.base': 'Please provide a valid phone number'
    }),
  
  tradingExperience: Joi.string()
    .valid(...TRADING_EXPERIENCE_OPTIONS)
    .optional()
    .messages({
      'any.only': `Trading experience must be one of: ${TRADING_EXPERIENCE_OPTIONS.join(', ')}`
    }),
  
  preferredMarkets: Joi.array()
    .items(Joi.string().valid(...MARKET_OPTIONS))
    .optional()
    .messages({
      'array.includes': `Preferred markets must be from: ${MARKET_OPTIONS.join(', ')}`
    }),
  
  bio: Joi.string()
    .max(VALIDATION_RULES.BIO_MAX_LENGTH)
    .optional()
    .allow('')
    .messages({
      'string.max': `Bio must not exceed ${VALIDATION_RULES.BIO_MAX_LENGTH} characters`
    })
});

/**
 * Built-in validation functions (fallback when Joi is not available)
 */
const builtInValidation = {
  validateSignup: (req, res, next) => {
    const { username, email, password, fullName } = req.body;
    const errors = {};

    // Debug logging
    console.log('🔍 Validating signup data:', {
      username,
      email,
      fullName,
      passwordLength: password ? password.length : 0,
      hasPassword: !!password
    });

    // Username validation
    if (!username || typeof username !== 'string') {
      errors.username = 'Username is required';
    } else if (username.length < VALIDATION_RULES.USERNAME_MIN_LENGTH) {
      errors.username = `Username must be at least ${VALIDATION_RULES.USERNAME_MIN_LENGTH} characters long`;
    } else if (username.length > VALIDATION_RULES.USERNAME_MAX_LENGTH) {
      errors.username = `Username must not exceed ${VALIDATION_RULES.USERNAME_MAX_LENGTH} characters`;
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      errors.username = 'Username must contain only letters, numbers, and underscores';
    }

    // Email validation
    if (!email || typeof email !== 'string') {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = ERROR_MESSAGES.INVALID_EMAIL;
    } else if (email.length > VALIDATION_RULES.EMAIL_MAX_LENGTH) {
      errors.email = `Email must not exceed ${VALIDATION_RULES.EMAIL_MAX_LENGTH} characters`;
    }

    // Password validation
    if (!password || typeof password !== 'string') {
      errors.password = 'Password is required';
    } else if (password.length < VALIDATION_RULES.PASSWORD_MIN_LENGTH) {
      errors.password = ERROR_MESSAGES.PASSWORD_TOO_SHORT;
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(password)) {
      errors.password = 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character';
    }

    // Full name validation (optional)
    if (fullName && typeof fullName === 'string' && fullName.length > VALIDATION_RULES.FULLNAME_MAX_LENGTH) {
      errors.fullName = `Full name must not exceed ${VALIDATION_RULES.FULLNAME_MAX_LENGTH} characters`;
    }

    if (Object.keys(errors).length > 0) {
      console.log('❌ Signup validation failed:', errors);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    next();
  },

  validateLogin: (req, res, next) => {
    const { email, password } = req.body;
    const errors = {};

    if (!email || typeof email !== 'string') {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = ERROR_MESSAGES.INVALID_EMAIL;
    }

    if (!password || typeof password !== 'string') {
      errors.password = 'Password is required';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    next();
  },

  validateProfileUpdate: (req, res, next) => {
    const { fullName, phoneNumber, tradingExperience, preferredMarkets, bio } = req.body;
    const errors = {};

    if (fullName && typeof fullName === 'string' && fullName.length > VALIDATION_RULES.FULLNAME_MAX_LENGTH) {
      errors.fullName = `Full name must not exceed ${VALIDATION_RULES.FULLNAME_MAX_LENGTH} characters`;
    }

    if (phoneNumber && typeof phoneNumber === 'string' && !/^[\+]?[1-9][\d]{0,15}$/.test(phoneNumber)) {
      errors.phoneNumber = 'Please provide a valid phone number';
    }

    if (tradingExperience && !TRADING_EXPERIENCE_OPTIONS.includes(tradingExperience)) {
      errors.tradingExperience = `Trading experience must be one of: ${TRADING_EXPERIENCE_OPTIONS.join(', ')}`;
    }

    if (preferredMarkets && Array.isArray(preferredMarkets)) {
      const invalidMarkets = preferredMarkets.filter(market => !MARKET_OPTIONS.includes(market));
      if (invalidMarkets.length > 0) {
        errors.preferredMarkets = `Invalid markets: ${invalidMarkets.join(', ')}`;
      }
    }

    if (bio && typeof bio === 'string' && bio.length > VALIDATION_RULES.BIO_MAX_LENGTH) {
      errors.bio = `Bio must not exceed ${VALIDATION_RULES.BIO_MAX_LENGTH} characters`;
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    next();
  }
};

/**
 * Validation middleware factory
 * @param {Joi.Schema} schema - Joi validation schema
 * @returns {Function} Express middleware function
 */
const validate = (schema) => {
  if (!Joi) {
    throw new Error('Joi is required for schema validation');
  }

  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const validationErrors = error.details.reduce((acc, detail) => {
        acc[detail.path[0]] = detail.message;
        return acc;
      }, {});

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    req.body = value;
    next();
  };
};

// Original validation middlewares (keep these)
const validateSignup = Joi ? validate(signupSchema) : builtInValidation.validateSignup;
const validateLogin = Joi ? validate(loginSchema) : builtInValidation.validateLogin;
const validateProfileUpdate = Joi ? validate(profileUpdateSchema) : builtInValidation.validateProfileUpdate;

// Notification validation schema
const notificationSchema = Joi.object({
  type: Joi.string()
    .valid('info', 'success', 'warning', 'error', 'alert')
    .default('info')
    .messages({
      'any.only': 'Type must be one of: info, success, warning, error, alert'
    }),

  title: Joi.string()
    .required()
    .max(100)
    .trim()
    .messages({
      'string.empty': 'Title is required',
      'string.max': 'Title must not exceed 100 characters',
      'any.required': 'Title is required'
    }),

  message: Joi.string()
    .required()
    .max(500)
    .trim()
    .messages({
      'string.empty': 'Message is required',
      'string.max': 'Message must not exceed 500 characters',
      'any.required': 'Message is required'
    }),

  link: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .optional()
    .allow('')
    .messages({
      'string.uri': 'Link must be a valid URL'
    })
});

// Admin notification creation schema
const adminNotificationSchema = Joi.object({
  userId: Joi.string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'User ID must be a valid MongoDB ObjectId',
      'any.required': 'User ID is required'
    }),

  userEmail: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'User email is required'
    }),

  type: Joi.string()
    .valid('info', 'success', 'warning', 'error', 'alert')
    .default('info')
    .messages({
      'any.only': 'Type must be one of: info, success, warning, error, alert'
    }),

  title: Joi.string()
    .required()
    .max(100)
    .trim()
    .messages({
      'string.empty': 'Title is required',
      'string.max': 'Title must not exceed 100 characters',
      'any.required': 'Title is required'
    }),

  message: Joi.string()
    .required()
    .max(500)
    .trim()
    .messages({
      'string.empty': 'Message is required',
      'string.max': 'Message must not exceed 500 characters',
      'any.required': 'Message is required'
    }),

  link: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .optional()
    .allow('')
    .messages({
      'string.uri': 'Link must be a valid URL'
    })
});

// Pagination validation schema
const paginationSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.min': 'Page must be at least 1'
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .messages({
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit must not exceed 100'
    }),

  sort: Joi.string()
    .valid('createdAt', '-createdAt', 'read', '-read')
    .default('-createdAt')
    .messages({
      'any.only': 'Sort must be one of: createdAt, -createdAt, read, -read'
    })
});

// Notification validation middlewares
const validateNotification = Joi ? validate(notificationSchema) : null;
const validateAdminNotification = Joi ? validate(adminNotificationSchema) : null;
const validatePagination = Joi ? validate(paginationSchema) : null;

// Order validation schemas
const orderPlacementSchema = Joi.object({
  type: Joi.string()
    .valid('BUY', 'SELL')
    .required()
    .messages({
      'any.only': 'Order type must be either BUY or SELL',
      'any.required': 'Order type is required'
    }),

  stockSymbol: Joi.string()
    .required()
    .uppercase()
    .pattern(/^[A-Z0-9]{1,10}$/)
    .messages({
      'string.pattern.base': 'Stock symbol must contain only uppercase letters and numbers (max 10 characters)',
      'any.required': 'Stock symbol is required'
    }),

  stockName: Joi.string()
    .required()
    .max(100)
    .trim()
    .messages({
      'string.max': 'Stock name must not exceed 100 characters',
      'any.required': 'Stock name is required'
    }),

  quantity: Joi.number()
    .integer()
    .min(1)
    .max(10000)
    .required()
    .messages({
      'number.min': 'Quantity must be at least 1',
      'number.max': 'Quantity cannot exceed 10,000 shares',
      'number.integer': 'Quantity must be a whole number',
      'any.required': 'Quantity is required'
    }),

  price: Joi.number()
    .positive()
    .precision(2)
    .min(0.01)
    .max(1000000)
    .required()
    .messages({
      'number.positive': 'Price must be a positive number',
      'number.min': 'Price must be at least ₹0.01',
      'number.max': 'Price cannot exceed ₹10,00,000',
      'any.required': 'Price is required'
    }),

  orderType: Joi.string()
    .valid('MARKET', 'LIMIT')
    .required()
    .messages({
      'any.only': 'Order type must be either MARKET or LIMIT',
      'any.required': 'Order type is required'
    }),

  limitPrice: Joi.when('orderType', {
    is: 'LIMIT',
    then: Joi.number()
      .positive()
      .precision(2)
      .min(0.01)
      .max(1000000)
      .required()
      .messages({
        'number.positive': 'Limit price must be a positive number',
        'number.min': 'Limit price must be at least ₹0.01',
        'number.max': 'Limit price cannot exceed ₹10,00,000',
        'any.required': 'Limit price is required for LIMIT orders'
      }),
    otherwise: Joi.forbidden().messages({
      'any.unknown': 'Limit price should not be provided for MARKET orders'
    })
  }),

  idempotencyKey: Joi.string()
    .optional()
    .uuid()
    .messages({
      'string.uuid': 'Idempotency key must be a valid UUID'
    })
});

// Order query validation schema
const orderQuerySchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.min': 'Page must be at least 1'
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
    .messages({
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit must not exceed 100'
    }),

  status: Joi.string()
    .valid('OPEN', 'FILLED', 'CANCELLED')
    .optional()
    .messages({
      'any.only': 'Status must be one of: OPEN, FILLED, CANCELLED'
    }),

  type: Joi.string()
    .valid('BUY', 'SELL')
    .optional()
    .messages({
      'any.only': 'Type must be either BUY or SELL'
    }),

  orderType: Joi.string()
    .valid('MARKET', 'LIMIT')
    .optional()
    .messages({
      'any.only': 'Order type must be either MARKET or LIMIT'
    }),

  stockSymbol: Joi.string()
    .optional()
    .uppercase()
    .pattern(/^[A-Z0-9]{1,10}$/)
    .messages({
      'string.pattern.base': 'Stock symbol must contain only uppercase letters and numbers'
    }),

  sort: Joi.string()
    .valid('createdAt', '-createdAt', 'price', '-price', 'quantity', '-quantity')
    .default('-createdAt')
    .messages({
      'any.only': 'Sort must be one of: createdAt, -createdAt, price, -price, quantity, -quantity'
    })
});

// Order validation middlewares
const validateOrderPlacement = Joi ? validate(orderPlacementSchema) : null;
const validateOrderQuery = Joi ? validate(orderQuerySchema) : null;

// All validation middlewares are now defined above

// Saytrix-specific validation functions
const { createValidationError } = require('./errorHandler');

/**
 * Validate chat request for Saytrix
 */
const validateSaytrixChatRequest = (req, res, next) => {
  const { message, userId, sessionId } = req.body;
  const errors = [];

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    errors.push('Valid message is required');
  } else if (message.length > 4000) {
    errors.push('Message too long (max 4000 characters)');
  }

  if (!userId || typeof userId !== 'string') {
    errors.push('Valid user ID is required');
  }

  if (!sessionId || typeof sessionId !== 'string') {
    errors.push('Valid session ID is required');
  }

  if (errors.length > 0) {
    return next(createValidationError(errors));
  }

  req.body.message = message.trim();
  req.body.userId = userId.trim();
  req.body.sessionId = sessionId.trim();
  next();
};

/**
 * Validate voice request for Saytrix
 */
const validateSaytrixVoiceRequest = (req, res, next) => {
  const { message, userId, sessionId, voiceData } = req.body;
  const errors = [];

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    errors.push('Valid message is required');
  }

  if (!userId || typeof userId !== 'string') {
    errors.push('Valid user ID is required');
  }

  if (!sessionId || typeof sessionId !== 'string') {
    errors.push('Valid session ID is required');
  }

  if (voiceData && typeof voiceData !== 'object') {
    errors.push('Voice data must be an object');
  }

  if (errors.length > 0) {
    return next(createValidationError(errors));
  }

  req.body.message = message.trim();
  req.body.userId = userId.trim();
  req.body.sessionId = sessionId.trim();
  next();
};

/**
 * Validate history request for Saytrix
 */
const validateSaytrixHistoryRequest = (req, res, next) => {
  const { userId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const errors = [];

  if (!userId || typeof userId !== 'string') {
    errors.push('Valid user ID is required');
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  if (isNaN(pageNum) || pageNum < 1) {
    errors.push('Page must be a positive integer');
  }

  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    errors.push('Limit must be between 1 and 100');
  }

  if (errors.length > 0) {
    return next(createValidationError(errors));
  }

  req.params.userId = userId.trim();
  req.query.page = pageNum;
  req.query.limit = limitNum;
  next();
};

module.exports = {
  validateSignup,
  validateLogin,
  validateProfileUpdate,
  validateNotification,
  validateAdminNotification,
  validatePagination,
  validateOrderPlacement,
  validateOrderQuery,
  validate,
  // Saytrix validations
  validateSaytrixChatRequest,
  validateSaytrixVoiceRequest,
  validateSaytrixHistoryRequest
};
