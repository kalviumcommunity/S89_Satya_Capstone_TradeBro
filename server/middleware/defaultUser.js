// Default user middleware - provides a default user for all requests
// This replaces the authentication system

const User = require('../models/User');

let cachedDefaultUser = null;

// Get or create default user
const getDefaultUser = async () => {
  if (cachedDefaultUser) {
    return cachedDefaultUser;
  }

  try {
    let defaultUser = await User.findOne({ email: 'user@tradebro.com' });

    if (!defaultUser) {
      // Create default user if it doesn't exist
      defaultUser = new User({
        username: 'TradeBroUser',
        email: 'user@tradebro.com',
        fullName: 'TradeBro User',
        phoneNumber: '',
        language: 'English',
        profileImage: null,
        notifications: true,
        tradingExperience: 'Beginner',
        preferredMarkets: ['Stocks'],
        bio: 'Welcome to TradeBro! This is your default trading account.'
      });

      await defaultUser.save();
      console.log('Default user created');
    }

    // Cache the user for future requests
    cachedDefaultUser = {
      id: defaultUser._id.toString(),
      email: defaultUser.email,
      username: defaultUser.username,
      fullName: defaultUser.fullName
    };

    return cachedDefaultUser;
  } catch (error) {
    console.error('Error getting default user:', error);
    // Fallback to hardcoded default user
    return {
      id: 'default-user-id',
      email: 'user@tradebro.com',
      username: 'TradeBroUser',
      fullName: 'TradeBro User'
    };
  }
};

// Middleware that provides a default user for all requests
const provideDefaultUser = async (req, res, next) => {
  try {
    req.user = await getDefaultUser();
    next();
  } catch (error) {
    console.error('Error in provideDefaultUser middleware:', error);
    // Fallback to hardcoded default user
    req.user = {
      id: 'default-user-id',
      email: 'user@tradebro.com',
      username: 'TradeBroUser',
      fullName: 'TradeBro User'
    };
    next();
  }
};

module.exports = { provideDefaultUser, getDefaultUser };
