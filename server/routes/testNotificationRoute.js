const express = require('express');
const router = express.Router();
const Pusher = require("pusher");
const { verifyToken } = require('../middleware/auth');
const Notification = require('../models/Notification');

// Initialize Pusher
const pusher = new Pusher({
  appId: "1986015",
  key: "478146ed5eddba9a37cb",
  secret: "86a0669490181a8e2de8",
  cluster: "ap2",
  useTLS: true
});

// Test route to send a notification
router.post('/test-notification', verifyToken, async (req, res) => {
  try {
    const { type = 'info', title, message, link } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required'
      });
    }
    
    // Create notification in database
    const notification = new Notification({
      userId: req.user.id,
      userEmail: req.user.email,
      type,
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
      message: 'Test notification sent successfully',
      data: notification
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
