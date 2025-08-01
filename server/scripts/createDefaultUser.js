// Script to create a default user for the application
const mongoose = require('mongoose');
const User = require('../models/User');
const VirtualMoney = require('../models/VirtualMoney');
require('dotenv').config();

const createDefaultUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tradebro');
    console.log('Connected to MongoDB');

    // Check if default user already exists
    const existingUser = await User.findOne({ email: 'user@tradebro.com' });
    
    if (existingUser) {
      console.log('Default user already exists');
      return existingUser;
    }

    // Create default user
    const defaultUser = new User({
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
    console.log('Default user created successfully');

    // Create default virtual money account
    const virtualMoney = new VirtualMoney({
      userId: defaultUser._id,
      userEmail: defaultUser.email,
      balance: 100000, // Start with ₹1,00,000
      totalDeposited: 100000,
      totalWithdrawn: 0,
      totalProfitLoss: 0,
      portfolio: [],
      transactions: [{
        type: 'deposit',
        amount: 100000,
        description: 'Initial deposit for default user',
        date: new Date(),
        balanceAfter: 100000
      }],
      lastLoginReward: null,
      loginStreak: 0,
      totalRewardsClaimed: 0
    });

    await virtualMoney.save();
    console.log('Default virtual money account created successfully');

    return defaultUser;
  } catch (error) {
    console.error('Error creating default user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the script if called directly
if (require.main === module) {
  createDefaultUser();
}

module.exports = createDefaultUser;
