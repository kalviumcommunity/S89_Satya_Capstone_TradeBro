const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET; // Ensure JWT_SECRET is defined

// Middleware to verify JWT token
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
    }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('authToken', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
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
    }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('authToken', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
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
      notifications: user.notifications
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

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      auth: {
        user: process.env.email_nodemailer,
        pass: process.env.password_nodemailer
      }
    });

    await transporter.sendMail({
      from: "tradebro2025@gmail.com",
      to: user.email,
      subject: "Your Password Reset Code",
      text: `Your code is: ${code}`
    });

    return res.status(200).send({ msg: "Verification code sent successfully, check spam mails" });
  } catch (error) {
    res.status(500).send({ msg: "Something went wrong", error });
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

// No longer needed - user data is sent during login/signup

// Google OAuth Login Route
router.get('/auth/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'], // Ensure this is included
    prompt: 'select_account' // Optional: Forces account selection
  })
);

// Google OAuth Callback Route
router.get('/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/login',
    failureMessage: true
  }),
  (req, res) => {
    try {
      // Generate JWT Token for Google OAuth
      const token = jwt.sign({
        id: req.user._id,
        email: req.user.email,
        username: req.user.username,
        fullName: req.user.fullName || req.user.username
      }, JWT_SECRET, { expiresIn: '7d' });

      // Set the token in a cookie
      res.cookie('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // Redirect to frontend with success message and user data
      res.redirect(`http://localhost:5173/portfolio?success=true&token=${token}`);
    } catch (error) {
      console.error('Error in Google callback:', error);
      res.redirect(`http://localhost:5173/login?error=authentication_failed`);
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