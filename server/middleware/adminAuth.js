/**
 * Admin Authentication Middleware
 * Provides role-based access control for admin endpoints
 */

const User = require('../models/User');
const { verifyToken } = require('../utils/tokenUtils');

/**
 * Admin emails - In production, this should be stored in environment variables
 * or a dedicated admin management system
 */
const ADMIN_EMAILS = [
  'admin@tradebro.com',
  'support@tradebro.com',
  process.env.ADMIN_EMAIL // Allow environment variable override
].filter(Boolean); // Remove undefined values

/**
 * Middleware to verify admin access
 * Checks if the user has admin privileges
 */
const requireAdmin = async (req, res, next) => {
  try {
    // First verify the JWT token
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Admin authentication required.'
      });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Admin authentication required.'
      });
    }

    // Get user from database to verify admin status
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    // Check if user is admin (by email for now)
    const isAdmin = ADMIN_EMAILS.includes(user.email.toLowerCase());
    
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    // Add user to request object
    req.user = {
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      isAdmin: true
    };

    next();
  } catch (error) {
    console.error('Admin authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during admin authentication'
    });
  }
};

/**
 * Middleware to check if current user is admin (optional check)
 * Doesn't block request if user is not admin, just adds isAdmin flag
 */
const checkAdminStatus = async (req, res, next) => {
  try {
    if (!req.user || !req.user.email) {
      req.user = req.user || {};
      req.user.isAdmin = false;
      return next();
    }

    const isAdmin = ADMIN_EMAILS.includes(req.user.email.toLowerCase());
    req.user.isAdmin = isAdmin;
    
    next();
  } catch (error) {
    console.error('Admin status check error:', error);
    req.user = req.user || {};
    req.user.isAdmin = false;
    next();
  }
};

/**
 * Utility function to check if email is admin
 */
const isAdminEmail = (email) => {
  return ADMIN_EMAILS.includes(email.toLowerCase());
};

module.exports = {
  requireAdmin,
  checkAdminStatus,
  isAdminEmail,
  ADMIN_EMAILS
};
