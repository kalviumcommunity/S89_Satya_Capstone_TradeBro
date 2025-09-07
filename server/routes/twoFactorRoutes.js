const express = require('express');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const User = require('../models/User');
const { verifyToken } = require('../utils/tokenUtils');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = asyncHandler(async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied' });
  }

  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

// Enable 2FA - Generate secret and QR code
router.post('/enable', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const user = req.user;

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `TradeBro (${user.email})`,
      issuer: 'TradeBro',
      length: 32
    });

    // Store temporary secret (not yet verified)
    user.twoFactorTempSecret = secret.base32;
    await user.save();

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    res.json({
      success: true,
      qrCodeUrl,
      secret: secret.base32
    });
  } catch (error) {
    console.error('2FA enable error:', error);
    res.status(500).json({ success: false, message: 'Failed to enable 2FA' });
  }
}));

// Verify 2FA code and complete setup
router.post('/verify', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { code } = req.body;
    const user = req.user;

    if (!user.twoFactorTempSecret) {
      return res.status(400).json({ success: false, message: '2FA setup not initiated' });
    }

    // Verify the code
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorTempSecret,
      encoding: 'base32',
      token: code,
      window: 2
    });

    if (verified) {
      // Move temp secret to permanent and enable 2FA
      user.twoFactorSecret = user.twoFactorTempSecret;
      user.twoFactorEnabled = true;
      user.twoFactorTempSecret = undefined;
      await user.save();

      res.json({ success: true, message: '2FA enabled successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Invalid verification code' });
    }
  } catch (error) {
    console.error('2FA verify error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify 2FA' });
  }
}));

// Disable 2FA
router.post('/disable', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const user = req.user;

    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    user.twoFactorTempSecret = undefined;
    await user.save();

    res.json({ success: true, message: '2FA disabled successfully' });
  } catch (error) {
    console.error('2FA disable error:', error);
    res.status(500).json({ success: false, message: 'Failed to disable 2FA' });
  }
}));

// Verify 2FA code during login
router.post('/verify-login', asyncHandler(async (req, res) => {
  try {
    const { email, code } = req.body;

    const user = await User.findOne({ email });
    if (!user || !user.twoFactorEnabled) {
      return res.status(400).json({ success: false, message: 'Invalid request' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 2
    });

    if (verified) {
      res.json({ success: true, message: '2FA verification successful' });
    } else {
      res.status(400).json({ success: false, message: 'Invalid verification code' });
    }
  } catch (error) {
    console.error('2FA login verify error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify 2FA' });
  }
}));

module.exports = router;