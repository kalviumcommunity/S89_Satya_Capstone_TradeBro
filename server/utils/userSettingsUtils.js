/**
 * User Settings Utilities
 * Validation, sanitization, and error handling utilities
 */

const validator = require('validator');

/**
 * Centralized error handler for user settings
 * @param {object} res - Express response object
 * @param {Error} error - Error object
 * @param {string} operation - Operation being performed
 * @param {string} userId - User ID for logging
 */
const handleError = (res, error, operation = 'operation', userId = 'unknown') => {
  console.error(`❌ User settings ${operation} error:`, {
    userId,
    error: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    timestamp: new Date().toISOString()
  });

  // Determine status code based on error type
  let statusCode = 500;
  let errorCode = 'INTERNAL_ERROR';
  let message = `Failed to ${operation}`;

  if (error.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = 'Validation failed';
  } else if (error.name === 'CastError') {
    statusCode = 400;
    errorCode = 'INVALID_ID';
    message = 'Invalid user ID format';
  } else if (error.code === 11000) {
    statusCode = 409;
    errorCode = 'DUPLICATE_ENTRY';
    message = 'Duplicate entry detected';
  } else if (error.message.includes('not found')) {
    statusCode = 404;
    errorCode = 'USER_NOT_FOUND';
    message = 'User not found';
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    message: process.env.NODE_ENV === 'development' ? error.message : message,
    code: errorCode,
    timestamp: new Date().toISOString()
  });
};

/**
 * Validate and sanitize user settings input
 * @param {object} input - Raw input data
 * @returns {object} Validation result with sanitized data
 */
const validateUserSettings = (input) => {
  const errors = [];
  const sanitized = {};

  // Validate and sanitize fullName
  if (input.fullName !== undefined) {
    if (typeof input.fullName !== 'string') {
      errors.push('Full name must be a string');
    } else if (input.fullName.length > 100) {
      errors.push('Full name must be less than 100 characters');
    } else {
      sanitized.fullName = validator.escape(input.fullName.trim());
    }
  }

  // Validate and sanitize phoneNumber
  if (input.phoneNumber !== undefined) {
    if (typeof input.phoneNumber !== 'string') {
      errors.push('Phone number must be a string');
    } else {
      const cleanPhone = input.phoneNumber.replace(/\s+/g, '');
      if (cleanPhone && !validator.isMobilePhone(cleanPhone, 'any', { strictMode: false })) {
        errors.push('Invalid phone number format');
      } else {
        sanitized.phoneNumber = validator.escape(cleanPhone);
      }
    }
  }

  // Validate and sanitize language
  if (input.language !== undefined) {
    const allowedLanguages = ['English', 'Hindi', 'Spanish', 'French', 'German', 'Chinese', 'Japanese'];
    if (typeof input.language !== 'string') {
      errors.push('Language must be a string');
    } else if (!allowedLanguages.includes(input.language)) {
      errors.push(`Language must be one of: ${allowedLanguages.join(', ')}`);
    } else {
      sanitized.language = validator.escape(input.language);
    }
  }

  // Validate and sanitize bio
  if (input.bio !== undefined) {
    if (typeof input.bio !== 'string') {
      errors.push('Bio must be a string');
    } else if (input.bio.length > 500) {
      errors.push('Bio must be less than 500 characters');
    } else {
      sanitized.bio = validator.escape(input.bio.trim());
    }
  }

  // Validate and sanitize tradingExperience
  if (input.tradingExperience !== undefined) {
    const allowedExperience = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
    if (typeof input.tradingExperience !== 'string') {
      errors.push('Trading experience must be a string');
    } else if (!allowedExperience.includes(input.tradingExperience)) {
      errors.push(`Trading experience must be one of: ${allowedExperience.join(', ')}`);
    } else {
      sanitized.tradingExperience = validator.escape(input.tradingExperience);
    }
  }

  // Validate notifications
  if (input.notifications !== undefined) {
    if (typeof input.notifications !== 'boolean') {
      // Try to convert string to boolean
      if (input.notifications === 'true') {
        sanitized.notifications = true;
      } else if (input.notifications === 'false') {
        sanitized.notifications = false;
      } else {
        errors.push('Notifications must be a boolean value');
      }
    } else {
      sanitized.notifications = input.notifications;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized
  };
};

/**
 * Validate and sanitize notification preferences
 * @param {object} preferences - Notification preferences object
 * @returns {object} Validation result
 */
const validateNotificationPreferences = (preferences) => {
  const errors = [];
  const sanitized = {};

  if (!preferences || typeof preferences !== 'object') {
    return {
      isValid: false,
      errors: ['Notification preferences must be an object'],
      sanitized: {}
    };
  }

  const allowedPreferences = ['email', 'push', 'priceAlerts', 'newsAlerts', 'orderUpdates', 'marketUpdates'];

  for (const [key, value] of Object.entries(preferences)) {
    if (!allowedPreferences.includes(key)) {
      errors.push(`Invalid notification preference: ${key}`);
      continue;
    }

    if (typeof value !== 'boolean') {
      // Try to convert string to boolean
      if (value === 'true') {
        sanitized[key] = true;
      } else if (value === 'false') {
        sanitized[key] = false;
      } else {
        errors.push(`Notification preference '${key}' must be a boolean value`);
      }
    } else {
      sanitized[key] = value;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized
  };
};

/**
 * Parse and validate preferred markets
 * @param {string|array} markets - Markets input (array or comma-separated string)
 * @returns {object} Validation result
 */
const parsePreferredMarkets = (markets) => {
  const allowedMarkets = ['Stocks', 'Crypto', 'Forex', 'Commodities', 'Bonds', 'ETFs', 'Mutual Funds'];
  let parsedMarkets = [];

  try {
    if (typeof markets === 'string') {
      // Handle comma-separated string
      if (markets.includes(',')) {
        parsedMarkets = markets.split(',').map(market => market.trim());
      } else {
        // Handle JSON string
        try {
          const jsonParsed = JSON.parse(markets);
          if (Array.isArray(jsonParsed)) {
            parsedMarkets = jsonParsed;
          } else {
            throw new Error('Parsed JSON is not an array');
          }
        } catch (jsonError) {
          // Treat as single market
          parsedMarkets = [markets.trim()];
        }
      }
    } else if (Array.isArray(markets)) {
      parsedMarkets = markets;
    } else {
      return {
        isValid: false,
        error: 'Preferred markets must be an array or comma-separated string',
        markets: ['Stocks'] // Default fallback
      };
    }

    // Validate and sanitize each market
    const validMarkets = [];
    const invalidMarkets = [];

    for (const market of parsedMarkets) {
      if (typeof market !== 'string') {
        invalidMarkets.push(market);
        continue;
      }

      const sanitizedMarket = validator.escape(market.trim());
      if (allowedMarkets.includes(sanitizedMarket)) {
        if (!validMarkets.includes(sanitizedMarket)) {
          validMarkets.push(sanitizedMarket);
        }
      } else {
        invalidMarkets.push(market);
      }
    }

    // Return default if no valid markets
    if (validMarkets.length === 0) {
      validMarkets.push('Stocks');
    }

    return {
      isValid: invalidMarkets.length === 0,
      markets: validMarkets,
      invalidMarkets,
      error: invalidMarkets.length > 0 
        ? `Invalid markets: ${invalidMarkets.join(', ')}. Allowed: ${allowedMarkets.join(', ')}`
        : null
    };

  } catch (error) {
    console.error('Error parsing preferred markets:', error.message);
    return {
      isValid: false,
      error: 'Failed to parse preferred markets',
      markets: ['Stocks'] // Default fallback
    };
  }
};

/**
 * Format user settings response
 * @param {object} user - User document from MongoDB
 * @returns {object} Formatted user settings
 */
const formatUserSettings = (user) => {
  if (!user) {
    return null;
  }

  return {
    fullName: user.fullName || '',
    email: user.email || '',
    phoneNumber: user.phoneNumber || '',
    language: user.language || 'English',
    profileImage: user.profileImage || null,
    notifications: user.notifications !== undefined ? user.notifications : true,
    tradingExperience: user.tradingExperience || 'Beginner',
    bio: user.bio || 'No bio provided yet.',
    preferredMarkets: user.preferredMarkets || ['Stocks'],
    createdAt: user.createdAt,
    updatedAt: user.updatedAt || new Date()
  };
};

/**
 * Format notification settings response
 * @param {object} user - User document from MongoDB
 * @returns {object} Formatted notification settings
 */
const formatNotificationSettings = (user) => {
  if (!user) {
    return null;
  }

  const defaultPreferences = {
    email: true,
    push: true,
    priceAlerts: true,
    newsAlerts: true,
    orderUpdates: true,
    marketUpdates: false
  };

  return {
    notifications: user.notifications !== undefined ? user.notifications : true,
    notificationPreferences: {
      ...defaultPreferences,
      ...user.notificationPreferences
    }
  };
};

/**
 * Log user settings operation
 * @param {string} operation - Operation type
 * @param {string} userId - User ID
 * @param {object} changes - Changes made (optional)
 */
const logUserSettingsOperation = (operation, userId, changes = {}) => {
  console.log(`👤 User settings ${operation}:`, {
    userId,
    operation,
    changes: Object.keys(changes),
    timestamp: new Date().toISOString()
  });
};

/**
 * Validate user ID format
 * @param {string} userId - User ID to validate
 * @returns {object} Validation result
 */
const validateUserId = (userId) => {
  if (!userId) {
    return {
      isValid: false,
      error: 'User ID is required'
    };
  }

  if (typeof userId !== 'string') {
    return {
      isValid: false,
      error: 'User ID must be a string'
    };
  }

  // Check if it's a valid MongoDB ObjectId
  if (!validator.isMongoId(userId)) {
    return {
      isValid: false,
      error: 'Invalid user ID format'
    };
  }

  return {
    isValid: true,
    userId: userId.trim()
  };
};

module.exports = {
  handleError,
  validateUserSettings,
  validateNotificationPreferences,
  parsePreferredMarkets,
  formatUserSettings,
  formatNotificationSettings,
  logUserSettingsOperation,
  validateUserId
};
