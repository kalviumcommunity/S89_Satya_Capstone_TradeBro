const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const User = require('../models/User');
const { provideDefaultUser } = require('../middleware/defaultUser');
const Pusher = require("pusher");

// Initialize Pusher
const pusher = new Pusher({
  appId: "1986015",
  key: "478146ed5eddba9a37cb",
  secret: "86a0669490181a8e2de8",
  cluster: "ap2",
  useTLS: true
});

// Get all notifications for the current user
router.get('/', provideDefaultUser, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Create a new notification
router.post('/', provideDefaultUser, async (req, res) => {
  try {
    const { type, title, message, link } = req.body;

    // Validate input
    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required'
      });
    }

    // Get user details
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has notifications enabled
    if (user.notifications === false) {
      return res.status(200).json({
        success: true,
        message: 'Notification not created as user has disabled notifications',
        data: null
      });
    }

    // Create notification
    const notification = new Notification({
      userId: req.user.id,
      userEmail: user.email,
      type: type || 'info',
      title,
      message,
      link,
      read: false
    });

    await notification.save();

    // Trigger Pusher event
    pusher.trigger(`user-${req.user.id}`, 'notification', {
      id: notification._id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      link: notification.link,
      read: notification.read,
      createdAt: notification.createdAt
    });

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: notification
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Mark a notification as read
router.put('/:id/read', provideDefaultUser, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    notification.read = true;
    await notification.save();

    // Trigger Pusher event for notification update
    pusher.trigger(`user-${req.user.id}`, 'notification-update', {
      id: notification._id,
      read: true
    });

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Mark all notifications as read
router.put('/read-all', provideDefaultUser, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.user.id, read: false },
      { $set: { read: true } }
    );

    // Trigger Pusher event for all notifications update
    pusher.trigger(`user-${req.user.id}`, 'notifications-read-all', {
      userId: req.user.id
    });

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      count: result.modifiedCount
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Delete a notification
router.delete('/:id', provideDefaultUser, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Trigger Pusher event for notification deletion
    pusher.trigger(`user-${req.user.id}`, 'notification-delete', {
      id: req.params.id
    });

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Create a notification for a specific user (admin only)
router.post('/admin/create', provideDefaultUser, async (req, res) => {
  try {
    const { userId, userEmail, type, title, message, link } = req.body;

    // Validate input
    if (!userId || !userEmail || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'User ID, email, title, and message are required'
      });
    }

    // Create notification
    const notification = new Notification({
      userId,
      userEmail,
      type: type || 'info',
      title,
      message,
      link,
      read: false
    });

    await notification.save();

    // Trigger Pusher event
    pusher.trigger(`user-${userId}`, 'notification', {
      id: notification._id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      link: notification.link,
      read: notification.read,
      createdAt: notification.createdAt
    });

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: notification
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Helper function to create system notifications
const createSystemNotification = async (userId, userEmail, type, title, message, link = null) => {
  try {
    // Check if user has notifications enabled
    const user = await User.findById(userId);
    if (!user || user.notifications === false) {
      return null;
    }

    const notification = new Notification({
      userId,
      userEmail,
      type,
      title,
      message,
      link,
      read: false
    });

    await notification.save();

    // Trigger Pusher event
    pusher.trigger(`user-${userId}`, 'notification', {
      id: notification._id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      link: notification.link,
      read: notification.read,
      createdAt: notification.createdAt
    });

    return notification;
  } catch (error) {
    console.error('Error creating system notification:', error);
    return null;
  }
};

// Export the router and helper function
module.exports = {
  router,
  createSystemNotification
};
