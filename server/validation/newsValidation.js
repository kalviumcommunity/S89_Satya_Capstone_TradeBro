/**
 * News Route Validation
 * Input validation for news endpoints using Joi with fallbacks
 */

// Try to use Joi if available, otherwise use built-in validation
let Joi;
try {
  Joi = require('joi');
} catch (error) {
  console.warn('Joi not available, using built-in validation for news routes');
  Joi = null;
}

/**
 * Valid news categories
 */
const VALID_CATEGORIES = [
  'general', 'markets', 'economy', 'technology', 'crypto', 
  'energy', 'healthcare', 'earnings', 'ipo', 'merger'
];

/**
 * Joi validation schemas
 */
const newsSchemas = Joi ? {
  searchQuery: Joi.object({
    q: Joi.string()
      .min(1)
      .max(50)
      .trim()
      .pattern(/^[a-zA-Z0-9\s\-_.]+$/)
      .required()
      .messages({
        'string.min': 'Search query must be at least 1 character',
        'string.max': 'Search query must not exceed 50 characters',
        'string.pattern.base': 'Search query contains invalid characters',
        'any.required': 'Search query is required'
      }),
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(20)
      .messages({
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit must not exceed 100'
      })
  }),

  categoryParams: Joi.object({
    category: Joi.string()
      .valid(...VALID_CATEGORIES)
      .required()
      .messages({
        'any.only': `Category must be one of: ${VALID_CATEGORIES.join(', ')}`,
        'any.required': 'Category is required'
      })
  }),

  generalQuery: Joi.object({
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(20)
      .messages({
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit must not exceed 100'
      })
  })
} : null;

/**
 * Built-in validation functions (fallback when Joi is not available)
 */
const builtInValidation = {
  validateSearchQuery: (data) => {
    const errors = {};
    const { q, limit } = data;

    // Query validation
    if (!q || typeof q !== 'string') {
      errors.q = 'Search query is required';
    } else {
      const trimmedQuery = q.trim();
      if (trimmedQuery.length < 1) {
        errors.q = 'Search query must be at least 1 character';
      } else if (trimmedQuery.length > 50) {
        errors.q = 'Search query must not exceed 50 characters';
      } else if (!/^[a-zA-Z0-9\s\-_.]+$/.test(trimmedQuery)) {
        errors.q = 'Search query contains invalid characters';
      }
    }

    // Limit validation
    if (limit !== undefined) {
      const numLimit = parseInt(limit);
      if (isNaN(numLimit) || numLimit < 1 || numLimit > 100) {
        errors.limit = 'Limit must be a number between 1 and 100';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitizedData: Object.keys(errors).length === 0 ? {
        q: q.trim(),
        limit: limit ? parseInt(limit) : 20
      } : null
    };
  },

  validateCategory: (data) => {
    const errors = {};
    const { category } = data;

    if (!category || typeof category !== 'string') {
      errors.category = 'Category is required';
    } else if (!VALID_CATEGORIES.includes(category.toLowerCase())) {
      errors.category = `Category must be one of: ${VALID_CATEGORIES.join(', ')}`;
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitizedData: Object.keys(errors).length === 0 ? {
        category: category.toLowerCase()
      } : null
    };
  },

  validateGeneralQuery: (data) => {
    const errors = {};
    const { limit } = data;

    if (limit !== undefined) {
      const numLimit = parseInt(limit);
      if (isNaN(numLimit) || numLimit < 1 || numLimit > 100) {
        errors.limit = 'Limit must be a number between 1 and 100';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitizedData: Object.keys(errors).length === 0 ? {
        limit: limit ? parseInt(limit) : 20
      } : null
    };
  }
};

/**
 * Validate search query parameters
 * @param {Object} data - Query parameters
 * @returns {Object} Validation result
 */
function validateSearchQuery(data) {
  if (Joi && newsSchemas) {
    const { error, value } = newsSchemas.searchQuery.validate(data, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const validationErrors = error.details.reduce((acc, detail) => {
        acc[detail.path[0]] = detail.message;
        return acc;
      }, {});

      return {
        isValid: false,
        errors: validationErrors,
        sanitizedData: null
      };
    }

    return {
      isValid: true,
      errors: {},
      sanitizedData: value
    };
  } else {
    return builtInValidation.validateSearchQuery(data);
  }
}

/**
 * Validate category parameters
 * @param {Object} data - Route parameters
 * @returns {Object} Validation result
 */
function validateCategory(data) {
  if (Joi && newsSchemas) {
    const { error, value } = newsSchemas.categoryParams.validate(data, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const validationErrors = error.details.reduce((acc, detail) => {
        acc[detail.path[0]] = detail.message;
        return acc;
      }, {});

      return {
        isValid: false,
        errors: validationErrors,
        sanitizedData: null
      };
    }

    return {
      isValid: true,
      errors: {},
      sanitizedData: value
    };
  } else {
    return builtInValidation.validateCategory(data);
  }
}

/**
 * Validate general query parameters
 * @param {Object} data - Query parameters
 * @returns {Object} Validation result
 */
function validateGeneralQuery(data) {
  if (Joi && newsSchemas) {
    const { error, value } = newsSchemas.generalQuery.validate(data, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const validationErrors = error.details.reduce((acc, detail) => {
        acc[detail.path[0]] = detail.message;
        return acc;
      }, {});

      return {
        isValid: false,
        errors: validationErrors,
        sanitizedData: null
      };
    }

    return {
      isValid: true,
      errors: {},
      sanitizedData: value
    };
  } else {
    return builtInValidation.validateGeneralQuery(data);
  }
}

/**
 * Validation middleware factory
 * @param {Function} validator - Validation function
 * @param {string} source - Source of data ('query', 'params', 'body')
 * @returns {Function} Express middleware
 */
function createValidationMiddleware(validator, source = 'query') {
  return (req, res, next) => {
    const data = req[source];
    const validation = validator(data);
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }

    // Replace the source data with sanitized data
    req[source] = { ...req[source], ...validation.sanitizedData };
    next();
  };
}

// Export validation middlewares
const validateSearchMiddleware = createValidationMiddleware(validateSearchQuery, 'query');
const validateCategoryMiddleware = createValidationMiddleware(validateCategory, 'params');
const validateGeneralMiddleware = createValidationMiddleware(validateGeneralQuery, 'query');

module.exports = {
  validateSearchQuery,
  validateCategory,
  validateGeneralQuery,
  validateSearchMiddleware,
  validateCategoryMiddleware,
  validateGeneralMiddleware,
  VALID_CATEGORIES
};
