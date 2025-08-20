/**
 * Enhanced Contact Routes
 * Features: OAuth2 support, Joi validation, rate limiting, unified endpoint, comprehensive logging
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

// Import utilities and services
const { sendContactEmail, validateEmailCredentials } = require('../services/emailService');
const { getUserInfoFromToken } = require('../utils/emailUtils');
const { validateContactMiddleware, checkSuspiciousContent } = require('../validation/contactValidation');
const asyncHandler = require('../utils/asyncHandler');

// Email service configured for mock responses

// Rate limiting for contact form (5 requests per hour per IP)
const contactRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many contact form submissions. Please try again in an hour.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Custom key generator to include user info if available
  keyGenerator: (req) => {
    // Use IP + user ID if authenticated, otherwise just IP
    const baseKey = req.ip || req.connection.remoteAddress || 'unknown';
    if (req.headers.authorization) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return `${baseKey}_user_${decoded.id}`;
      } catch (error) {
        // If token is invalid, just use IP
      }
    }
    return baseKey;
  },
  // Skip rate limiting for successful requests to be more lenient
  skipSuccessfulRequests: false
});

/**
 * Unified Contact Route
 * Handles both public and authenticated contact form submissions
 * POST /api/contact/send
 */
router.post('/send', contactRateLimit, validateContactMiddleware, asyncHandler(async (req, res) => {
  const { name, email, subject, message } = req.body;
  const authHeader = req.headers.authorization;

  // Check for suspicious content
  const suspiciousCheck = checkSuspiciousContent({ name, email, subject, message });
  if (suspiciousCheck.isSuspicious) {
    console.warn('🚨 Suspicious contact form submission blocked:', {
      email,
      name,
      reason: suspiciousCheck.reason,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });

    return res.status(400).json({
      success: false,
      message: 'Your submission contains content that cannot be processed. Please review and try again.'
    });
  }

  // Try to get user information from token (if provided)
  const userInfo = await getUserInfoFromToken(authHeader);
  const isAuthenticated = !!userInfo;

  // Log the contact attempt
  console.log('📧 Contact form submission:', {
    from: email,
    name,
    subject: subject || 'No subject',
    isAuthenticated,
    userId: userInfo?.id || null,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  try {
    // Mock email sending when service not configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      // Mock contact form submission logged
      
      return res.json({
        success: true,
        message: 'Your message has been received successfully. We\'ll get back to you soon!',
        messageId: `mock_${Date.now()}`,
        timestamp: new Date().toISOString()
      });
    }

    // Send email using the enhanced email service
    const result = await sendContactEmail({
      name,
      email,
      subject,
      message,
      userInfo,
      isAuthenticated
    });

    if (result.success) {
      return res.json({
        success: true,
        message: 'Your message has been sent successfully. We\'ll get back to you soon!',
        messageId: result.messageId,
        timestamp: result.timestamp
      });
    } else {
      // Email service returned an error
      return res.status(500).json({
        success: false,
        message: result.error.message,
        errorType: result.error.type
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error in contact route:', {
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      from: email,
      name,
      timestamp: new Date().toISOString()
    });

    return res.status(500).json({
      success: false,
      message: 'An unexpected error occurred. Please try again later.'
    });
  }
}));

// Legacy route for backward compatibility (redirects to unified endpoint)
router.post('/send-auth', (req, res) => {
  console.log('📍 Legacy /send-auth route accessed, redirecting to unified /send endpoint');

  // Forward the request to the unified endpoint
  req.url = '/send';
  router.handle(req, res);
});

module.exports = router;
