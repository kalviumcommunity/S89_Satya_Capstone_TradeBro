const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;


const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) {
    return res.status(401).send({ message: "Access Denied. No token provided" });
  }
  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    return res.status(403).send({ message: "Invalid token", error });
  }
};

// Register Route
router.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const exists = await User.findOne({ username });
    if (exists) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const existsEmail = await User.findOne({ email });
    if (existsEmail) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      email,
      password: hashedPassword,
      fullName: username // Default fullName to username
    });
    const savedUser = await user.save();

    // Include more user data in the token
    const token = jwt.sign({
      id: savedUser._id,
      email: savedUser.email,
      username: savedUser.username,
      fullName: savedUser.fullName || savedUser.username
    }, JWT_SECRET, { expiresIn: '30d' });

    res.cookie('authToken', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    // Create a user object with only the necessary data for the client
    const userData = {
      id: savedUser._id,
      email: savedUser.email,
      username: savedUser.username,
      fullName: savedUser.fullName || savedUser.username,
      profileImage: savedUser.profileImage
    };

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: userData
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("Login request body:", req.body);

    if (!email || !password) {
      console.log("Missing email or password");
      return res.status(400).json({ message: 'Please fill all fields' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found for email:", email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user.password) {
      console.error("Password not set for user:", user.email);
      return res.status(400).json({ message: 'Password not set for this user' });
    }

    console.log("User found:", user);

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      console.log("Incorrect password for user:", email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log("Password is correct for user:", email);

    const token = jwt.sign({
      id: user._id,
      email: user.email,
      username: user.username,
      fullName: user.fullName || user.username
    }, JWT_SECRET, { expiresIn: '30d' });

    res.cookie('authToken', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    // Create a user object with only the necessary data for the client
    const userData = {
      id: user._id,
      email: user.email,
      username: user.username,
      fullName: user.fullName || user.username,
      profileImage: user.profileImage,
      phoneNumber: user.phoneNumber,
      language: user.language,
      notifications: user.notifications,
      tradingExperience: user.tradingExperience || 'Beginner',
      bio: user.bio || 'No bio provided yet.',
      preferredMarkets: user.preferredMarkets || ['Stocks'],
      createdAt: user.createdAt
    };

    res.status(200).json({
      message: 'Login successful',
      token,
      user: userData
    });
  } catch (error) {
    console.error("Error in login route:", error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Forgot Password Route
router.post('/forgotpassword', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).send({ msg: "User not found, try another email" });
    }

    const code = Math.floor(100000 + Math.random() * 900000);
    const hashedCode = await bcrypt.hash(code.toString(), 10);

    user.code = hashedCode;
    user.codeExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    // Log environment variables for debugging
    console.log('Email config:', {
      emailUser: process.env.email_nodemailer || process.env.EMAIL_USER,
      emailPass: process.env.password_nodemailer ? 'Password exists' : 'No password',
      emailService: process.env.EMAIL_SERVICE
    });

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      auth: {
        user: process.env.email_nodemailer || process.env.EMAIL_USER,
        pass: process.env.password_nodemailer || process.env.EMAIL_PASSWORD
      }
    });

    try {
      await transporter.sendMail({
        from: "tradebro2025@gmail.com",
        to: user.email,
        subject: "Your Password Reset Code",
        text: `Your code is: ${code}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
            <h2 style="color: #22b8b0;">TradeBro Password Reset</h2>
            <p>Hello ${user.fullName || user.username},</p>
            <p>You requested a password reset. Please use the following code to reset your password:</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold;">
              ${code}
            </div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you did not request a password reset, please ignore this email.</p>
            <p>Best regards,<br>The TradeBro Team</p>
          </div>
        `
      });

      console.log('Password reset email sent successfully to:', user.email);
      return res.status(200).send({ msg: "Verification code sent successfully, check spam mails" });
    } catch (emailError) {
      console.error('Error sending email:', emailError);

      // Check if it's an authentication error
      if (emailError.code === 'EAUTH') {
        return res.status(500).send({
          msg: "Email authentication failed. Please check email credentials.",
          error: emailError.message
        });
      }

      return res.status(500).send({
        msg: "Failed to send verification email",
        error: emailError.message
      });
    }
  } catch (error) {
    console.error('Error in forgotpassword route:', error);
    res.status(500).send({ msg: "Something went wrong", error: error.message });
  }
});

// Reset Password Route
router.put('/resetpassword', async (req, res) => {
  const { otp, newPassword } = req.body;

  if (!otp || !newPassword) {
    return res.status(400).json({ message: 'OTP and new password are required' });
  }

  try {
    const user = await User.findOne({ codeExpires: { $gt: Date.now() } }); // Ensure OTP is not expired
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const isOtpValid = await bcrypt.compare(otp, user.code);
    if (!isOtpValid) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.code = null;
    user.codeExpires = null;
    await user.save();

    res.status(200).json({ message: 'Password reset successfully. Redirecting to login page...' });
  } catch (error) {
    console.error('Error in resetpassword route:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user data by token
router.get('/user', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -code -codeExpires');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create a user object with only the necessary data for the client
    const userData = {
      id: user._id,
      email: user.email,
      username: user.username,
      fullName: user.fullName || user.username,
      profileImage: user.profileImage,
      phoneNumber: user.phoneNumber,
      language: user.language,
      notifications: user.notifications,
      tradingExperience: user.tradingExperience || 'Beginner',
      bio: user.bio || 'No bio provided yet.',
      preferredMarkets: user.preferredMarkets || ['Stocks'],
      createdAt: user.createdAt
    };

    res.status(200).json({
      success: true,
      user: userData
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Google OAuth Login Route
router.get('/google', (req, res, next) => {
  console.log('Google OAuth login route hit');
  console.log('Request URL:', req.originalUrl);

  // Force HTTPS protocol regardless of what req.protocol reports
  const protocol = 'https';
  console.log('Protocol from request:', req.protocol);
  console.log('X-Forwarded-Proto header:', req.headers['x-forwarded-proto']);
  console.log('Using protocol:', protocol);

  console.log('Full URL:', `${protocol}://${req.get('host')}${req.originalUrl}`);
  console.log('Headers:', req.headers);

  // Define the callback URL using environment variables
  const callbackURL = process.env.API_BASE_URL + "/api/auth/google/callback";
  console.log('Using callback URL:', callbackURL);

  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account',
    callbackURL: callbackURL // Pass the callback URL explicitly
  })(req, res, next);
});

// Google OAuth Callback Route
router.get('/google/callback', (req, res, next) => {
  console.log('Google OAuth callback route hit');
  console.log('Request URL:', req.originalUrl);

  // Force HTTPS protocol regardless of what req.protocol reports
  const protocol = 'https';
  console.log('Protocol from request:', req.protocol);
  console.log('X-Forwarded-Proto header:', req.headers['x-forwarded-proto']);
  console.log('Using protocol:', protocol);

  console.log('Full URL:', `${protocol}://${req.get('host')}${req.originalUrl}`);
  console.log('Query params:', req.query);
  console.log('Headers:', req.headers);

  // Define the callback URL using environment variables
  const callbackURL = process.env.API_BASE_URL + "/api/auth/google/callback";
  console.log('Using callback URL:', callbackURL);

  passport.authenticate('google', {
    callbackURL: callbackURL, // Pass the callback URL explicitly
    failureRedirect: '/login',
    failureMessage: true
  })(req, res, next);
},
  (req, res) => {
    try {
      console.log('Google OAuth callback received, user:', req.user.email);

      // Make sure we have a valid user object
      if (!req.user || !req.user._id) {
        console.error('Invalid user object in Google callback');

        // Determine the correct protocol based on the client URL
        let clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

        // If it's localhost, force HTTP protocol
        if (clientUrl.includes('localhost')) {
          clientUrl = clientUrl.replace('https://', 'http://');
        }

        console.log(`Redirecting to: ${clientUrl}/login?error=invalid_user`);

        return res.redirect(`${clientUrl}/login?error=invalid_user`);
      }

      // Generate JWT Token for Google OAuth with more user data (30 days expiration)
      const token = jwt.sign({
        id: req.user._id,
        email: req.user.email,
        username: req.user.username || req.user.email.split('@')[0],
        fullName: req.user.fullName || req.user.displayName || req.user.username || req.user.email.split('@')[0]
      }, JWT_SECRET, { expiresIn: '30d' });

      // Set the token in a cookie
      res.cookie('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });

      // Determine the correct protocol based on the client URL
      let clientUrl = process.env.CLIENT_URL;

      // If it's localhost, force HTTP protocol
      if (clientUrl.includes('localhost')) {
        clientUrl = clientUrl.replace('https://', 'http://');
      }

      console.log(`Redirecting to: ${clientUrl}/dashboard?token=${token}&google=true`);

      // Redirect directly to dashboard with token
      res.redirect(`${clientUrl}/dashboard?token=${token}&google=true`);
    } catch (error) {
      console.error('Error in Google callback:', error);

      // Determine the correct protocol based on the client URL
      let clientUrl = process.env.CLIENT_URL;

      // If it's localhost, force HTTP protocol
      if (clientUrl.includes('localhost')) {
        clientUrl = clientUrl.replace('https://', 'http://');
      }

      console.log(`Redirecting to: ${clientUrl}/login?error=authentication_failed`);

      res.redirect(`${clientUrl}/login?error=authentication_failed`);
    }
  }
);

// Logout Route
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ message: "Logout failed" });
    }
    req.session.destroy(); // Destroy the session
    res.clearCookie("connect.sid"); // Clear the session cookie
    res.status(200).json({ message: "Logout successful" });
  });
});


module.exports = router;