/**
 * JWT Token Utilities
 * Centralized token generation and verification
 */
const jwt = require('jsonwebtoken');

/**
 * Validates that JWT_SECRET is available
 * @throws {Error} If JWT_SECRET is not defined
 */
const validateJWTSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not defined');
  }
};

/**
 * Generates a JWT token for a user
 * @param {Object} user - User object
 * @param {string} expiresIn - Token expiration time (default: '7d')
 * @returns {string} JWT token
 * @throws {Error} If JWT_SECRET is not defined
 */
const generateToken = (user, expiresIn = '7d') => {
  validateJWTSecret();
  
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      authProvider: user.authProvider || 'local',
      iat: Math.floor(Date.now() / 1000)
    },
    process.env.JWT_SECRET,
    { expiresIn, issuer: 'tradebro-api' }
  );
};

/**
 * Verifies a JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or JWT_SECRET is not defined
 */
const verifyToken = (token) => {
  validateJWTSecret();
  
  return jwt.verify(token, process.env.JWT_SECRET);
};

/**
 * Generates a secure token for OAuth callback
 * @param {Object} user - User object
 * @param {boolean} isNewUser - Whether user is new
 * @returns {string} Secure token
 */
const generateOAuthToken = (user, isNewUser = false) => {
  validateJWTSecret();
  
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      isNewUser,
      type: 'oauth_callback'
    },
    process.env.JWT_SECRET,
    { expiresIn: '10m' } // Short-lived for security
  );
};

module.exports = {
  generateToken,
  verifyToken,
  generateOAuthToken,
  validateJWTSecret
};
