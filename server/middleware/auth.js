const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  // Check for token in various places
  const authHeader = req.headers.authorization;
  const tokenFromHeader = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : null;
  const tokenFromQuery = req.query.token;
  const tokenFromCookie = req.cookies?.authToken;

  // Use token from any available source
  const token = tokenFromHeader || tokenFromQuery || tokenFromCookie;

  if (!token) {
    console.log('No token provided in request');
    return res.status(401).json({
      success: false,
      message: "Access Denied. No token provided"
    });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    console.log('Token verification failed:', error.message);
    return res.status(403).json({
      success: false,
      message: "Invalid token",
      error: error.message
    });
  }
};

// Middleware that attempts to verify token but continues even if no token
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : null;

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
  } catch (error) {
    req.user = null;
  }

  next();
};

module.exports = { verifyToken, optionalAuth };
