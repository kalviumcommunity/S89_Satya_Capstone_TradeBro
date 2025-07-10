const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const User = require('../models/User');
const UserData = require('../models/UserData');
const router = express.Router();

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token.'
    });
  }
};

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      username: user.username,
      fullName: user.fullName
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Create or update user data
const createOrUpdateUserData = async (userId, userEmail) => {
  try {
    let userData = await UserData.findOne({ userId });
    
    if (!userData) {
      userData = new UserData({
        userId,
        userEmail,
        statistics: {
          loginCount: 1,
          lastLogin: new Date()
        }
      });
    } else {
      userData.statistics.loginCount += 1;
      userData.statistics.lastLogin = new Date();
    }
    
    await userData.save();
    return userData;
  } catch (error) {
    console.error('Error creating/updating user data:', error);
  }
};

// POST /api/auth/signup - Register new user
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password, fullName } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, and password are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.email === email ? 'Email already registered' : 'Username already taken'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      fullName: fullName || username,
      tradingExperience: 'Beginner',
      preferredMarkets: ['Stocks'],
      bio: 'Welcome to TradeBro!'
    });

    await newUser.save();

    // Create user data
    await createOrUpdateUserData(newUser._id, newUser.email);

    // Generate token
    const token = generateToken(newUser);

    // Return user data (without password)
    const userResponse = {
      id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      fullName: newUser.fullName,
      profileImage: newUser.profileImage,
      tradingExperience: newUser.tradingExperience,
      preferredMarkets: newUser.preferredMarkets,
      bio: newUser.bio,
      createdAt: newUser.createdAt
    };

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// POST /api/auth/login - Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update user data
    await createOrUpdateUserData(user._id, user.email);

    // Generate token
    const token = generateToken(user);

    // Return user data (without password)
    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      profileImage: user.profileImage,
      tradingExperience: user.tradingExperience,
      preferredMarkets: user.preferredMarkets,
      bio: user.bio,
      createdAt: user.createdAt
    };

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// GET /api/auth/verify - Verify JWT token
router.get('/verify', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      profileImage: user.profileImage,
      tradingExperience: user.tradingExperience,
      preferredMarkets: user.preferredMarkets,
      bio: user.bio,
      createdAt: user.createdAt
    };

    res.json({
      success: true,
      user: userResponse
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during token verification'
    });
  }
});

// PUT /api/auth/profile - Update user profile
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { fullName, phoneNumber, tradingExperience, preferredMarkets, bio } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user fields
    if (fullName !== undefined) user.fullName = fullName;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    if (tradingExperience !== undefined) user.tradingExperience = tradingExperience;
    if (preferredMarkets !== undefined) user.preferredMarkets = preferredMarkets;
    if (bio !== undefined) user.bio = bio;

    await user.save();

    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      profileImage: user.profileImage,
      tradingExperience: user.tradingExperience,
      preferredMarkets: user.preferredMarkets,
      bio: user.bio,
      createdAt: user.createdAt
    };

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: userResponse
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during profile update'
    });
  }
});

// Google OAuth routes
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    try {
      const token = req.user.token;
      const isNewUser = req.user.isNewUser;
      
      // Redirect to frontend with token
      const redirectUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard?token=${token}&success=true&google=true${isNewUser ? '&new=true' : ''}`;
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Google callback error:', error);
      res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=auth_failed`);
    }
  }
);

module.exports = router;