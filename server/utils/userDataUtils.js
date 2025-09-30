/**
 * User Data Utilities
 * Helper functions for user data management
 */

const UserData = require('../models/UserData');

/**
 * Creates or updates user data with proper error handling
 * @param {string} userId - User ID
 * @param {string} userEmail - User email
 * @returns {Object|null} UserData object or null if failed
 */
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
    console.error('Error creating/updating user data:', {
      message: error.message,
      userId,
      userEmail,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    return null;
  }
};

/**
 * Creates a sanitized user response object
 * @param {Object} user - User document
 * @returns {Object} Sanitized user object
 */
const createUserResponse = (user) => {
  return {
    id: user._id,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    firstName: user.firstName,
    lastName: user.lastName,
    phoneNumber: user.phoneNumber,
    profileImage: user.profileImage,
    tradingExperience: user.tradingExperience || 'Beginner',
    preferredMarkets: user.preferredMarkets || ['Stocks'],
    bio: user.bio,
    authProvider: user.authProvider || 'local',
    emailVerified: user.emailVerified || false,
    createdAt: user.createdAt,
    lastLogin: user.lastLogin
  };
};

module.exports = {
  createOrUpdateUserData,
  createUserResponse
};
