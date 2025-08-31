/**
 * Application Constants
 * Centralized configuration values
 */

// User default values
const USER_DEFAULTS = {
  TRADING_EXPERIENCE: 'Beginner',
  PREFERRED_MARKETS: ['Stocks'],
  BIO: 'Welcome to TradeBro! Start your trading journey today.',
  PROFILE_IMAGE: null
};

// Validation constants
const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 8,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 30,
  EMAIL_MAX_LENGTH: 255,
  FULLNAME_MAX_LENGTH: 100,
  BIO_MAX_LENGTH: 500
};

// Security constants
const SECURITY_CONFIG = {
  BCRYPT_SALT_ROUNDS: 12,
  JWT_EXPIRES_IN: '7d',
  OAUTH_TOKEN_EXPIRES_IN: '10m',
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: 10, // Increased for better UX
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000 // 24 hours
};

// Trading experience options
const TRADING_EXPERIENCE_OPTIONS = [
  'Beginner',
  'Intermediate', 
  'Advanced',
  'Professional'
];

// Market options
const MARKET_OPTIONS = [
  'Stocks',
  'Forex',
  'Crypto',
  'Commodities',
  'Options',
  'Futures'
];

// Error messages
const ERROR_MESSAGES = {
  // Authentication
  INVALID_CREDENTIALS: 'Invalid email or password',
  ACCESS_DENIED: 'Access denied. No token provided.',
  INVALID_TOKEN: 'Invalid or expired token',
  USER_NOT_FOUND: 'User not found',
  
  // Validation
  REQUIRED_FIELDS: 'All required fields must be provided',
  EMAIL_ALREADY_EXISTS: 'Email already registered',
  USERNAME_ALREADY_EXISTS: 'Username already taken',
  PASSWORD_TOO_SHORT: `Password must be at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters long`,
  INVALID_EMAIL: 'Please provide a valid email address',
  INVALID_USERNAME: 'Username must be 3-30 characters long and contain only letters, numbers, and underscores',
  
  // Server errors
  SERVER_ERROR: 'Internal server error. Please try again later.',
  REGISTRATION_ERROR: 'Error occurred during registration',
  LOGIN_ERROR: 'Error occurred during login',
  PROFILE_UPDATE_ERROR: 'Error occurred while updating profile',
  TOKEN_VERIFICATION_ERROR: 'Error occurred during token verification'
};

// Success messages
const SUCCESS_MESSAGES = {
  REGISTRATION_SUCCESS: 'User registered successfully',
  LOGIN_SUCCESS: 'Login successful',
  PROFILE_UPDATE_SUCCESS: 'Profile updated successfully',
  TOKEN_VALID: 'Token is valid'
};

module.exports = {
  USER_DEFAULTS,
  VALIDATION_RULES,
  SECURITY_CONFIG,
  TRADING_EXPERIENCE_OPTIONS,
  MARKET_OPTIONS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES
};
