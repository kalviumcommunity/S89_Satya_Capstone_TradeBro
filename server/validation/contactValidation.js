/**
 * Contact Form Validation Schemas
 * Using Joi for comprehensive input validation
 */

// Try to use Joi if available, otherwise use built-in validation
let Joi;
try {
  Joi = require('joi');
} catch (error) {
  console.warn('Joi not available, using built-in validation for contact forms');
  Joi = null;
}

/**
 * Contact form validation schema using Joi
 */
const contactSchema = Joi ? Joi.object({
  name: Joi.string()
    .min(2)
    .max(50)
    .trim()
    .required()
    .messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name must not exceed 50 characters',
      'string.empty': 'Name is required',
      'any.required': 'Name is required'
    }),
  
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .max(255)
    .trim()
    .lowercase()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.max': 'Email must not exceed 255 characters',
      'string.empty': 'Email is required',
      'any.required': 'Email is required'
    }),
  
  subject: Joi.string()
    .max(100)
    .trim()
    .optional()
    .allow('')
    .messages({
      'string.max': 'Subject must not exceed 100 characters'
    }),
  
  message: Joi.string()
    .min(10)
    .max(1000)
    .trim()
    .required()
    .messages({
      'string.min': 'Message must be at least 10 characters long',
      'string.max': 'Message must not exceed 1000 characters',
      'string.empty': 'Message is required',
      'any.required': 'Message is required'
    })
}) : null;

/**
 * Built-in validation functions (fallback when Joi is not available)
 */
const builtInValidation = {
  validateContact: (data) => {
    const errors = {};
    const { name, email, subject, message } = data;

    // Name validation
    if (!name || typeof name !== 'string') {
      errors.name = 'Name is required';
    } else {
      const trimmedName = name.trim();
      if (trimmedName.length < 2) {
        errors.name = 'Name must be at least 2 characters long';
      } else if (trimmedName.length > 50) {
        errors.name = 'Name must not exceed 50 characters';
      }
    }

    // Email validation
    if (!email || typeof email !== 'string') {
      errors.email = 'Email is required';
    } else {
      const trimmedEmail = email.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        errors.email = 'Please provide a valid email address';
      } else if (trimmedEmail.length > 255) {
        errors.email = 'Email must not exceed 255 characters';
      }
    }

    // Subject validation (optional)
    if (subject && typeof subject === 'string' && subject.trim().length > 100) {
      errors.subject = 'Subject must not exceed 100 characters';
    }

    // Message validation
    if (!message || typeof message !== 'string') {
      errors.message = 'Message is required';
    } else {
      const trimmedMessage = message.trim();
      if (trimmedMessage.length < 10) {
        errors.message = 'Message must be at least 10 characters long';
      } else if (trimmedMessage.length > 1000) {
        errors.message = 'Message must not exceed 1000 characters';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitizedData: Object.keys(errors).length === 0 ? {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        subject: subject ? subject.trim() : '',
        message: message.trim()
      } : null
    };
  }
};

/**
 * Validate contact form data
 * @param {Object} data - Contact form data
 * @returns {Object} Validation result
 */
function validateContactForm(data) {
  if (Joi && contactSchema) {
    // Use Joi validation
    const { error, value } = contactSchema.validate(data, {
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
    // Use built-in validation
    return builtInValidation.validateContact(data);
  }
}

/**
 * Validation middleware for contact routes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function validateContactMiddleware(req, res, next) {
  const validation = validateContactForm(req.body);
  
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: validation.errors
    });
  }

  // Replace req.body with sanitized data
  req.body = validation.sanitizedData;
  next();
}

/**
 * Check for suspicious content in contact form
 * @param {Object} data - Contact form data
 * @returns {Object} Security check result
 */
function checkSuspiciousContent(data) {
  const { name, email, subject, message } = data;
  const suspiciousPatterns = [
    // Common spam patterns
    /\b(viagra|cialis|casino|lottery|winner|congratulations)\b/gi,
    // HTML/Script injection attempts
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    // Excessive links
    /(https?:\/\/[^\s]+.*){3,}/gi,
    // Excessive special characters
    /[!@#$%^&*()]{5,}/g
  ];

  const allText = `${name} ${email} ${subject} ${message}`.toLowerCase();
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(allText)) {
      return {
        isSuspicious: true,
        reason: 'Content contains suspicious patterns'
      };
    }
  }

  return {
    isSuspicious: false,
    reason: null
  };
}

module.exports = {
  validateContactForm,
  validateContactMiddleware,
  checkSuspiciousContent
};
