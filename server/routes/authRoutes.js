const express = require('express');
const bcrypt = require('bcryptjs');
const passport = require('passport');

// Import models
const User = require('../models/User');

// Import utilities and middleware
const { generateToken, verifyToken, generateOAuthToken } = require('../utils/tokenUtils');
const { createOrUpdateUserData, createUserResponse } = require('../utils/userDataUtils');
const { validateSignup, validateLogin, validateProfileUpdate } = require('../middleware/validation');
const { createRateLimit } = require('../middleware/rateLimiter');
const asyncHandler = require('../utils/asyncHandler');

// Import constants
const {
  USER_DEFAULTS,
  SECURITY_CONFIG,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES
} = require('../config/constants');

const router = express.Router();

// Rate limiting for auth routes
const authRateLimit = createRateLimit({
  windowMs: SECURITY_CONFIG.RATE_LIMIT_WINDOW_MS,
  max: SECURITY_CONFIG.RATE_LIMIT_MAX_REQUESTS,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again later.',
    retryAfter: Math.ceil(SECURITY_CONFIG.RATE_LIMIT_WINDOW_MS / 1000 / 60) + ' minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

// Enhanced JWT verification middleware
const verifyTokenMiddleware = asyncHandler(async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      message: ERROR_MESSAGES.ACCESS_DENIED
    });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification failed:', {
      message: error.message,
      token: token.substring(0, 20) + '...' // Log partial token for debugging
    });

    return res.status(401).json({
      success: false,
      message: ERROR_MESSAGES.INVALID_TOKEN
    });
  }
});

// POST /api/auth/signup - Register new user
router.post('/signup', authRateLimit, validateSignup, asyncHandler(async (req, res) => {
  const { username, email, password, fullName } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ email }, { username }]
  });

  if (existingUser) {
    const message = existingUser.email === email
      ? ERROR_MESSAGES.EMAIL_ALREADY_EXISTS
      : ERROR_MESSAGES.USERNAME_ALREADY_EXISTS;

    return res.status(400).json({
      success: false,
      message
    });
  }

  // Hash password with secure salt rounds
  const hashedPassword = await bcrypt.hash(password, SECURITY_CONFIG.BCRYPT_SALT_ROUNDS);

  // Create new user with default values from constants
  const newUser = new User({
    username,
    email,
    password: hashedPassword,
    fullName: fullName || username,
    tradingExperience: USER_DEFAULTS.TRADING_EXPERIENCE,
    preferredMarkets: USER_DEFAULTS.PREFERRED_MARKETS,
    bio: USER_DEFAULTS.BIO,
    profileImage: USER_DEFAULTS.PROFILE_IMAGE
  });

  await newUser.save();

  // Create user data with error handling
  const userData = await createOrUpdateUserData(newUser._id, newUser.email);
  if (!userData) {
    console.warn('Failed to create user data for user:', newUser._id);
  }

  // Generate token
  const token = generateToken(newUser);

  // Return sanitized user data
  const userResponse = createUserResponse(newUser);

  res.status(201).json({
    success: true,
    message: SUCCESS_MESSAGES.REGISTRATION_SUCCESS,
    token,
    user: userResponse
  });
}));

// POST /api/auth/login - Login user
router.post('/login', authRateLimit, validateLogin, asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({
      success: false,
      message: ERROR_MESSAGES.INVALID_CREDENTIALS
    });
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: ERROR_MESSAGES.INVALID_CREDENTIALS
    });
  }

  // Update user data with error handling
  const userData = await createOrUpdateUserData(user._id, user.email);
  if (!userData) {
    console.warn('Failed to update user data for user:', user._id);
  }

  // Generate token
  const token = generateToken(user);

  // Return sanitized user data
  const userResponse = createUserResponse(user);

  res.json({
    success: true,
    message: SUCCESS_MESSAGES.LOGIN_SUCCESS,
    token,
    user: userResponse
  });
}));

// GET /api/auth/verify - Verify JWT token
router.get('/verify', verifyTokenMiddleware, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: ERROR_MESSAGES.USER_NOT_FOUND
    });
  }

  // Return sanitized user data
  const userResponse = createUserResponse(user);

  res.json({
    success: true,
    message: SUCCESS_MESSAGES.TOKEN_VALID,
    user: userResponse
  });
}));

// PUT /api/auth/profile - Update user profile
router.put('/profile', verifyTokenMiddleware, validateProfileUpdate, asyncHandler(async (req, res) => {
  const { fullName, phoneNumber, tradingExperience, preferredMarkets, bio } = req.body;

  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: ERROR_MESSAGES.USER_NOT_FOUND
    });
  }

  // Update user fields (validation already handled by middleware)
  if (fullName !== undefined) user.fullName = fullName;
  if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
  if (tradingExperience !== undefined) user.tradingExperience = tradingExperience;
  if (preferredMarkets !== undefined) user.preferredMarkets = preferredMarkets;
  if (bio !== undefined) user.bio = bio;

  await user.save();

  // Return sanitized user data
  const userResponse = createUserResponse(user);

  res.json({
    success: true,
    message: SUCCESS_MESSAGES.PROFILE_UPDATE_SUCCESS,
    user: userResponse
  });
}));

// Google OAuth routes
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

// Secure OAuth callback - uses HTTP-only cookies instead of URL tokens
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  asyncHandler(async (req, res) => {
    const user = req.user;
    const isNewUser = user.isNewUser;

    // Generate a secure, short-lived token for OAuth callback
    const oauthToken = generateOAuthToken(user, isNewUser);

    // Set secure HTTP-only cookie
    res.cookie('oauth_token', oauthToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 10 * 60 * 1000, // 10 minutes
      path: '/'
    });

    // Redirect without token in URL
    const clientUrl = process.env.NODE_ENV === 'production'
      ? process.env.CLIENT_URL
      : 'http://localhost:5173';

    const redirectUrl = `${clientUrl}/auth/oauth-callback?success=true&google=true${isNewUser ? '&new=true' : ''}`;
    res.redirect(redirectUrl);
  })
);

// OAuth token exchange endpoint - exchanges cookie for JWT
router.post('/oauth/exchange', asyncHandler(async (req, res) => {
  const oauthToken = req.cookies.oauth_token;

  if (!oauthToken) {
    return res.status(401).json({
      success: false,
      message: 'OAuth token not found'
    });
  }

  try {
    const decoded = verifyToken(oauthToken);

    // Verify this is an OAuth callback token
    if (decoded.type !== 'oauth_callback') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type'
      });
    }

    // Find user to get latest data
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: ERROR_MESSAGES.USER_NOT_FOUND
      });
    }

    // Generate regular JWT token
    const token = generateToken(user);

    // Clear the OAuth cookie
    res.clearCookie('oauth_token');

    // Update user data
    const userData = await createOrUpdateUserData(user._id, user.email);
    if (!userData) {
      console.warn('Failed to update user data for OAuth user:', user._id);
    }

    // Return user data and token
    const userResponse = createUserResponse(user);

    res.json({
      success: true,
      message: SUCCESS_MESSAGES.LOGIN_SUCCESS,
      token,
      user: userResponse,
      isNewUser: decoded.isNewUser
    });

  } catch (error) {
    console.error('OAuth token exchange error:', {
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });

    res.clearCookie('oauth_token');
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired OAuth token'
    });
  }
}));

module.exports = router;