const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { createSystemNotification } = require('../routes/notificationRoutes');
const User = require('../models/User');

dotenv.config();

async function createTestNotification() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find default user
    const user = await User.findOne({ email: 'user@tradebro.com' });
    if (!user) {
      console.log('❌ Default user not found');
      return;
    }

    // Create test notification
    const notification = await createSystemNotification(
      user._id,
      user.email,
      'success',
      'Test Notification',
      'This is a test notification to verify the system is working!',
      '/notifications',
      { test: true }
    );

    if (notification) {
      console.log('✅ Test notification created:', notification.title);
    } else {
      console.log('❌ Failed to create test notification');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

createTestNotification();