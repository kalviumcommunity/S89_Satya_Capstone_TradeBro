const express = require('express');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const VirtualMoney = require('../models/VirtualMoney');
const asyncHandler = require('../utils/asyncHandler');
const { generateToken } = require('../utils/tokenUtils');
const { createOrUpdateUserData, createUserResponse } = require('../utils/userDataUtils');
const { validateSignup, validateLogin } = require('../middleware/validation');
const { createRateLimit } = require('../middleware/rateLimiter');
const { USER_DEFAULTS, SECURITY_CONFIG, ERROR_MESSAGES, SUCCESS_MESSAGES } = require('../config/constants');

const router = express.Router();

// Rate limiting
const authRateLimit = createRateLimit({
  windowMs: SECURITY_CONFIG.RATE_LIMIT_WINDOW_MS,
  max: SECURITY_CONFIG.RATE_LIMIT_MAX_REQUESTS,
  message: { success: false, message: 'Too many authentication attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// ============================
// ✅ SIGNUP
// ============================
router.post('/signup', authRateLimit, validateSignup, asyncHandler(async (req, res) => {
  const { username, email, password, fullName } = req.body;

  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existingUser) {
    const message = existingUser.email === email
      ? ERROR_MESSAGES.EMAIL_ALREADY_EXISTS
      : ERROR_MESSAGES.USERNAME_ALREADY_EXISTS;
    return res.status(400).json({ success: false, message });
  }

  const hashedPassword = await bcrypt.hash(password, SECURITY_CONFIG.BCRYPT_SALT_ROUNDS);
  const newUser = new User({ username, email, password: hashedPassword, fullName: fullName || username, ...USER_DEFAULTS });
  await newUser.save();

  const virtualMoney = new VirtualMoney({
    userId: newUser._id,
    userEmail: newUser.email,
    balance: 10000,
    totalValue: 10000,
    availableCash: 10000,
    totalInvested: 0,
    totalGainLoss: 0,
    totalGainLossPercentage: 0,
    holdings: [],
    transactions: [{ type: 'DEPOSIT', amount: 10000, description: 'Initial deposit', timestamp: new Date() }]
  });
  await virtualMoney.save();

  const token = generateToken(newUser);
  const userResponse = createUserResponse(newUser);

  res.status(201).json({ success: true, message: SUCCESS_MESSAGES.REGISTRATION_SUCCESS, token, user: userResponse });
}));

// ============================
// ✅ LOGIN
// ============================
router.post('/login', authRateLimit, validateLogin, asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ success: false, message: ERROR_MESSAGES.INVALID_CREDENTIALS });

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) return res.status(401).json({ success: false, message: ERROR_MESSAGES.INVALID_CREDENTIALS });

  const token = generateToken(user);
  const userResponse = createUserResponse(user);

  res.json({ success: true, message: SUCCESS_MESSAGES.LOGIN_SUCCESS, token, user: userResponse });
}));

// ============================
// ✅ GOOGLE OAUTH LOGIN
// ============================
router.post('/google', authRateLimit, asyncHandler(async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ success: false, message: 'Google credential is required' });
  }

  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(500).json({ success: false, message: 'Google authentication not configured' });
  }

  let payload;
  try {
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (error) {
    console.error('Google token verification failed:', error);
    return res.status(401).json({ success: false, message: 'Invalid Google credential' });
  }

  const { sub: googleId, email: googleEmail, name, given_name, family_name, picture: googlePicture } = payload;
  
  if (!googleEmail) {
    return res.status(400).json({ success: false, message: 'Email not provided by Google' });
  }

  let user = await User.findOne({ $or: [{ email: googleEmail }, { googleId }] });
  let isNewUser = false;

  if (!user) {
    isNewUser = true;
    let username = googleEmail.split('@')[0];
    let counter = 1;
    
    while (await User.findOne({ username })) {
      username = `${googleEmail.split('@')[0]}${counter}`;
      counter++;
    }

    const hashedPassword = await bcrypt.hash('google_oauth_' + googleId, SECURITY_CONFIG.BCRYPT_SALT_ROUNDS);
    
    user = new User({
      username,
      email: googleEmail,
      fullName: name || `${given_name || ''} ${family_name || ''}`.trim() || username,
      firstName: given_name || username,
      lastName: family_name || '',
      password: hashedPassword,
      authProvider: 'google',
      googleId,
      profileImage: googlePicture || null,
      emailVerified: true,
      ...USER_DEFAULTS
    });
    await user.save();

    const virtualMoney = new VirtualMoney({
      userId: user._id,
      userEmail: googleEmail,
      balance: 10000,
      totalValue: 10000,
      availableCash: 10000,
      totalInvested: 0,
      totalGainLoss: 0,
      totalGainLossPercentage: 0,
      holdings: [],
      transactions: [{ type: 'DEPOSIT', amount: 10000, description: 'Initial deposit', timestamp: new Date() }]
    });
    await virtualMoney.save();
  } else if (!user.googleId) {
    // Link existing account with Google
    user.googleId = googleId;
    user.authProvider = 'google';
    user.profileImage = user.profileImage || googlePicture;
    user.emailVerified = true;
    await user.save();
  }

  const token = generateToken(user);
  const userResponse = createUserResponse(user);

  res.json({
    success: true,
    message: isNewUser ? SUCCESS_MESSAGES.REGISTRATION_SUCCESS : SUCCESS_MESSAGES.LOGIN_SUCCESS,
    token,
    user: userResponse,
    isNewUser
  });
}));

// ============================
// ✅ TOKEN VALIDATION
// ============================
router.get('/validate', asyncHandler(async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    
    res.json({ success: true, user: createUserResponse(user) });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
}));

module.exports = router;