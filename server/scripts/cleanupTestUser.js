/**
 * Cleanup Test User Script
 * Removes test user and associated data for testing signup
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../models/User');
const VirtualMoney = require('../models/VirtualMoney');
const UserData = require('../models/UserData');
const Order = require('../models/Order');
const Watchlist = require('../models/Watchlist');

const cleanupTestUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tradebro');
    console.log('📦 Connected to MongoDB');

    const testEmail = 'kakihari03@gmail.com';
    
    // Find the test user
    const testUser = await User.findOne({ email: testEmail });
    
    if (!testUser) {
      console.log('❌ Test user not found:', testEmail);
      return;
    }

    console.log('🔍 Found test user:', {
      id: testUser._id,
      email: testUser.email,
      username: testUser.username,
      fullName: testUser.fullName
    });

    // Remove associated data
    console.log('🧹 Cleaning up associated data...');

    // Remove virtual money account
    const virtualMoneyResult = await VirtualMoney.deleteMany({ 
      $or: [
        { userId: testUser._id },
        { userEmail: testEmail }
      ]
    });
    console.log(`✅ Removed ${virtualMoneyResult.deletedCount} virtual money records`);

    // Remove user data
    const userDataResult = await UserData.deleteMany({ 
      $or: [
        { userId: testUser._id },
        { userEmail: testEmail }
      ]
    });
    console.log(`✅ Removed ${userDataResult.deletedCount} user data records`);

    // Remove orders
    const ordersResult = await Order.deleteMany({ userId: testUser._id });
    console.log(`✅ Removed ${ordersResult.deletedCount} order records`);

    // Remove watchlist
    const watchlistResult = await Watchlist.deleteMany({ userId: testUser._id });
    console.log(`✅ Removed ${watchlistResult.deletedCount} watchlist records`);

    // Finally, remove the user
    await User.deleteOne({ _id: testUser._id });
    console.log('✅ Removed test user');

    console.log('🎉 Cleanup completed successfully!');
    console.log('You can now test signup with:', testEmail);

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📦 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run the cleanup
if (require.main === module) {
  cleanupTestUser();
}

module.exports = cleanupTestUser;
