// routes/authRoutes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const User = require('../models/User'); // Adjust path if necessary
const VirtualMoney = require('../models/VirtualMoney'); // Adjust path if necessary
const asyncHandler = require('../utils/asyncHandler'); // Adjust path if necessary
const { generateToken } = require('../utils/tokenUtils'); // Adjust path if necessary
const { createOrUpdateUserData, createUserResponse } = require('../utils/userDataUtils'); // Adjust path if necessary
const { validateSignup, validateLogin } = require('../middleware/validation'); // Adjust path if necessary
const { createRateLimit } = require('../middleware/rateLimiter'); // Adjust path if necessary
const { USER_DEFAULTS, SECURITY_CONFIG, ERROR_MESSAGES, SUCCESS_MESSAGES } = require('../config/constants'); // Adjust path if necessary

const router = express.Router();

// Debug middleware
router.use((req, res, next) => {
    console.log('Auth route accessed:', req.method, req.path);
    next();
});

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

    // Generate 2FA code
    const twoFactorCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.twoFactorCode = twoFactorCode;
    user.twoFactorExpires = Date.now() + 300000; // 5 minutes
    await user.save();

    console.log(`2FA code for ${email}: ${twoFactorCode}`);

    res.json({ success: true, message: 'Please enter the 2FA code sent to your email', requiresTwoFactor: true, email });
}));

// ============================
// ✅ 2FA VERIFICATION
// ============================
router.post('/verify-2fa', authRateLimit, asyncHandler(async (req, res) => {
    const { email, code } = req.body;

    const user = await User.findOne({ 
        email,
        twoFactorCode: code,
        twoFactorExpires: { $gt: Date.now() }
    });

    if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid or expired code' });
    }

    user.twoFactorCode = undefined;
    user.twoFactorExpires = undefined;
    await user.save();

    const token = generateToken(user);
    const userResponse = createUserResponse(user);

    res.json({ success: true, message: SUCCESS_MESSAGES.LOGIN_SUCCESS, token, user: userResponse });
}));

// ============================
// ✅ GOOGLE OAUTH ROUTES
// ============================
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

router.get('/google/callback', 
    passport.authenticate('google', { session: false }), // session: false because we generate a JWT
    asyncHandler(async (req, res) => {
        try {
            if (!req.user) {
                console.error('OAuth callback: req.user is undefined');
                const redirectUrl = process.env.CLIENT_URL || 'https://tradebro.netlify.app';
                return res.redirect(`${redirectUrl}/login?error=oauth_failed`);
            }

            const token = generateToken(req.user);
            const userResponse = createUserResponse(req.user);
            
            // Redirect directly to dashboard with token and user data
            const redirectUrl = process.env.CLIENT_URL || 'https://tradebro.netlify.app';
            // Encode user object for URL safety
            const callbackUrl = `${redirectUrl}/dashboard?token=${token}&user=${encodeURIComponent(JSON.stringify(userResponse))}`;
            
            console.log('OAuth successful, redirecting to:', callbackUrl);
            res.redirect(callbackUrl);
        } catch (error) {
            console.error('OAuth callback error:', error);
            const redirectUrl = process.env.CLIENT_URL || 'https://tradebro.netlify.app';
            res.redirect(`${redirectUrl}/login?error=oauth_failed&details=${encodeURIComponent(error.message)}`);
        }
    })
);

// ============================
// ✅ FORGOT PASSWORD
// ============================
router.post('/forgot-password', authRateLimit, asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
        // Don't reveal if email exists or not for security
        return res.json({ success: true, message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    // Generate reset token (in production, you'd send an email)
    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // In production, send email with reset link
    console.log(`Password reset token for ${email}: ${resetToken}`);

    res.json({ 
        success: true, 
        message: 'If an account with that email exists, a password reset link has been sent.',
        // For demo purposes only - remove in production
        resetToken: resetToken
    });
}));

router.post('/reset-password', authRateLimit, asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ success: false, message: 'Token and new password are required' });
    }

    const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
        return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, SECURITY_CONFIG.BCRYPT_SALT_ROUNDS);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Password has been reset successfully' });
}));

// ============================
// ✅ LOGOUT
// ============================
router.post('/logout', asyncHandler(async (req, res) => {
    // Clear any server-side session data if needed
    if (req.session) {
        req.session.destroy((err) => {
            if (err) console.error("Error destroying session:", err);
        });
    }
    // Clear the cookie client-side if using httpOnly cookies, or rely on client to clear token
    res.clearCookie('connect.sid', { path: '/' }); // Clear default session cookie
    
    res.json({ 
        success: true, 
        message: 'Logged out successfully',
        redirect: '/login'
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

console.log('Auth routes loaded successfully');
module.exports = router;
