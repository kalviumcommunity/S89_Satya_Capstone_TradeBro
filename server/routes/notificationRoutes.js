const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const User = require('../models/User');
const { provideDefaultUser } = require('../middleware/defaultUser');
const { requireAdmin } = require('../middleware/adminAuth');
const { createRateLimit } = require('../middleware/rateLimiter');
const {
  validateNotification,
  validateAdminNotification,
  validatePagination
} = require('../middleware/validation');
const Pusher = require("pusher");

// Initialize Pusher with environment variables (secure configuration)
const pusherConfig = {
  appId: process.env.PUSHER_APP_ID || "1986015",
  key: process.env.PUSHER_KEY || "478146ed5eddba9a37cb",
  secret: process.env.PUSHER_SECRET || "86a0669490181a8e2de8",
  cluster: process.env.PUSHER_CLUSTER || "ap2",
  useTLS: true
};

// Validate Pusher configuration
const validatePusherConfig = () => {
  const required = ['appId', 'key', 'secret', 'cluster'];
  const missing = required.filter(field => !pusherConfig[field]);

  if (missing.length > 0) {
    console.error('Missing Pusher configuration:', missing);
    return false;
  }
  return true;
};

const pusher = validatePusherConfig() ? new Pusher(pusherConfig) : null;

// Rate limiting for notification creation
const notificationRateLimit = createRateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 10 notifications per minute per user
  message: {
    success: false,
    message: 'Too many notifications created. Please try again later.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Get all notifications for the current user with pagination
router.get('/', provideDefaultUser, validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = '-createdAt' } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = { userId: req.user.id };

    // Get total count for pagination metadata
    const totalCount = await Notification.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    // Get notifications with pagination
    const notifications = await Notification.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean(); // Use lean() for better performance

    // Check for duplicate notifications and group them
    const groupedNotifications = await groupDuplicateNotifications(notifications);

    res.status(200).json({
      success: true,
      data: groupedNotifications,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        limit: parseInt(limit),
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get unread notification count
router.get('/unread-count', provideDefaultUser, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.user.id,
      read: false
    });

    res.status(200).json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Helper function to group duplicate notifications
const groupDuplicateNotifications = async (notifications) => {
  if (!notifications || notifications.length === 0) return notifications;

  const grouped = [];
  const duplicateGroups = new Map();

  for (const notification of notifications) {
    if (notification.read) {
      // Don't group read notifications
      grouped.push(notification);
      continue;
    }

    const key = `${notification.type}-${notification.title}`;

    if (!duplicateGroups.has(key)) {
      duplicateGroups.set(key, []);
    }

    duplicateGroups.get(key).push(notification);
  }

  // Process duplicate groups
  for (const [key, duplicates] of duplicateGroups) {
    if (duplicates.length >= 3) {
      // Create a summary notification for 3+ duplicates
      const latest = duplicates[0]; // Most recent (already sorted)
      const summary = {
        ...latest,
        _id: `summary-${key}-${Date.now()}`,
        title: `${duplicates.length} ${latest.title}`,
        message: `You have ${duplicates.length} similar notifications: ${latest.message}`,
        isDuplicate: true,
        duplicateCount: duplicates.length,
        duplicateIds: duplicates.map(d => d._id)
      };
      grouped.push(summary);
    } else {
      // Add individual notifications if less than 3
      grouped.push(...duplicates);
    }
  }

  return grouped.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

// Enhanced Pusher event trigger with fallback handling
const triggerPusherEvent = async (channel, event, data, retries = 3) => {
  if (!pusher) {
    console.warn('Pusher not configured, skipping real-time notification');
    return false;
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await pusher.trigger(channel, event, data);
      return true;
    } catch (error) {
      console.error(`Pusher trigger attempt ${attempt} failed:`, {
        channel,
        event,
        error: error.message,
        attempt,
        retries
      });

      if (attempt === retries) {
        // Log final failure but don't crash the application
        console.error('Pusher trigger failed after all retries:', {
          channel,
          event,
          finalError: error.message
        });
        return false;
      }

      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
  return false;
};

// Create a new notification
router.post('/', provideDefaultUser, notificationRateLimit, validateNotification, async (req, res) => {
  try {
    const { type, title, message, link } = req.body;

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
      title: title.trim(),
      message: message.trim(),
      link: link || null,
      read: false
    });

    await notification.save();

    // Trigger Pusher event with fallback handling
    await triggerPusherEvent(`user-${req.user.id}`, 'notification', {
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
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
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

    // Only update if not already read
    if (!notification.read) {
      notification.read = true;
      notification.readAt = new Date();
      await notification.save();

      // Trigger Pusher event for notification update
      await triggerPusherEvent(`user-${req.user.id}`, 'notification-update', {
        id: notification._id,
        read: true,
        readAt: notification.readAt
      });
    }

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
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Mark all notifications as read
router.put('/read-all', provideDefaultUser, async (req, res) => {
  try {
    const now = new Date();
    const result = await Notification.updateMany(
      { userId: req.user.id, read: false },
      {
        $set: {
          read: true,
          readAt: now
        }
      }
    );

    // Trigger Pusher event for all notifications update
    await triggerPusherEvent(`user-${req.user.id}`, 'notifications-read-all', {
      userId: req.user.id,
      readAt: now,
      count: result.modifiedCount
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
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
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
    await triggerPusherEvent(`user-${req.user.id}`, 'notification-delete', {
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
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Create a notification for a specific user (admin only)
router.post('/admin/create', requireAdmin, validateAdminNotification, async (req, res) => {
  try {
    const { userId, userEmail, type, title, message, link } = req.body;

    // Verify target user exists
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Target user not found'
      });
    }

    // Check if target user has notifications enabled
    if (targetUser.notifications === false) {
      return res.status(200).json({
        success: true,
        message: 'Notification not created as target user has disabled notifications',
        data: null
      });
    }

    // Create notification
    const notification = new Notification({
      userId,
      userEmail: targetUser.email, // Use actual user email for security
      type: type || 'info',
      title: title.trim(),
      message: message.trim(),
      link: link || null,
      read: false
    });

    await notification.save();

    // Trigger Pusher event with fallback
    await triggerPusherEvent(`user-${userId}`, 'notification', {
      id: notification._id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      link: notification.link,
      read: notification.read,
      createdAt: notification.createdAt
    });

    // Log admin action for audit trail
    console.log('Admin notification created:', {
      adminId: req.user.id,
      adminEmail: req.user.email,
      targetUserId: userId,
      targetUserEmail: targetUser.email,
      notificationId: notification._id,
      type: notification.type,
      title: notification.title
    });

    res.status(201).json({
      success: true,
      message: 'Admin notification created successfully',
      data: notification
    });
  } catch (error) {
    console.error('Error creating admin notification:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Enhanced helper function to create system notifications
const createSystemNotification = async (userId, userEmail, type, title, message, link = null) => {
  try {
    // Input validation
    if (!userId || !userEmail || !title || !message) {
      console.error('createSystemNotification: Missing required parameters');
      return null;
    }

    // Validate type
    const validTypes = ['info', 'success', 'warning', 'error', 'alert'];
    if (!validTypes.includes(type)) {
      console.error('createSystemNotification: Invalid notification type:', type);
      return null;
    }

    // Check if user has notifications enabled
    const user = await User.findById(userId);
    if (!user || user.notifications === false) {
      return null;
    }

    // Create notification with input sanitization
    const notification = new Notification({
      userId,
      userEmail: user.email, // Use actual user email for security
      type,
      title: title.toString().trim().substring(0, 100), // Enforce limits
      message: message.toString().trim().substring(0, 500),
      link: link ? link.toString().trim() : null,
      read: false
    });

    await notification.save();

    // Trigger Pusher event with fallback handling
    await triggerPusherEvent(`user-${userId}`, 'notification', {
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
    console.error('Error creating system notification:', {
      userId,
      userEmail,
      type,
      title: title?.substring(0, 50) + '...',
      error: error.message
    });
    return null;
  }
};

// Export the router and helper function
module.exports = {
  router,
  createSystemNotification
};
