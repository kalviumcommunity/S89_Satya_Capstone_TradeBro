const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const User = require('../models/User'); // Assuming User model exists
const { provideDefaultUser } = require('../middleware/defaultUser'); // Auth middleware
const { requireAdmin } = require('../middleware/adminAuth'); // Admin auth middleware
const { createRateLimit } = require('../middleware/rateLimiter'); // Rate limiting middleware
const { validateNotification, validateAdminNotification, validatePagination } = require('../middleware/validation'); // Validation middleware
const Pusher = require("pusher");

// ------------------ Pusher Config ------------------
const pusherConfig = {
  appId: process.env.PUSHER_APP_ID || "1986015",
  key: process.env.PUSHER_KEY || "478146ed5eddba9a37cb",
  secret: process.env.PUSHER_SECRET || "86a0669490181a8e2de8",
  cluster: process.env.PUSHER_CLUSTER || "ap2",
  useTLS: true
};

const pusher = new Pusher(pusherConfig);

// ------------------ Rate Limiting ------------------
const notificationRateLimit = createRateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Max 10 notifications per minute per IP
  message: { success: false, message: 'Too many notification creation requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// ------------------ Helper: Async Handler (for consistent error handling) ------------------
// This should ideally be imported from a central error handling middleware file
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ------------------ Helper: Pusher Trigger with Exponential Backoff ------------------
const triggerPusherEvent = async (channel, event, data, retries = 3) => {
  if (!pusher) {
    console.warn('Pusher instance not initialized. Cannot trigger event.');
    return false;
  }
  // Ensure private channels are prefixed correctly for Pusher
  const formattedChannel = channel.startsWith('private-') ? channel : `private-${channel}`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await pusher.trigger(formattedChannel, event, data);
      console.log(`Pusher event triggered: Channel=${formattedChannel}, Event=${event}, Attempt=${attempt}`);
      return true;
    } catch (err) {
      console.error(`❌ Pusher attempt ${attempt} for channel ${formattedChannel}, event ${event} failed:`, err.message);
      if (attempt === retries) return false;
      await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000)); // Exponential backoff
    }
  }
  return false;
};

// ------------------ Routes ------------------

/**
 * GET /api/notifications - Get paginated notifications for the authenticated user.
 * Middleware: provideDefaultUser, validatePagination
 */
router.get('/', provideDefaultUser, validatePagination, asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, sort = '-createdAt' } = req.query;
  const skip = (page - 1) * limit;
  const query = { userId: req.user.id };

  const totalCount = await Notification.countDocuments(query);
  const totalPages = Math.ceil(totalCount / limit);

  const notifications = await Notification.find(query)
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .lean(); // Use .lean() for faster query execution if not modifying documents

  res.status(200).json({
    success: true,
    data: notifications,
    pagination: {
      page: parseInt(page),
      total: totalCount,
      hasMore: parseInt(page) < totalPages, // Corrected comparison
      totalPages,
      limit: parseInt(limit)
    }
  });
}));

/**
 * GET /api/notifications/unread-count - Get the count of unread notifications for the authenticated user.
 * Middleware: provideDefaultUser
 */
router.get('/unread-count', provideDefaultUser, asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ userId: req.user.id, read: false });
  res.status(200).json({ success: true, count });
}));

/**
 * PUT /api/notifications/:id/read - Mark a specific notification as read.
 * Middleware: provideDefaultUser
 */
router.put('/:id/read', provideDefaultUser, asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id, read: false }, // Only update if not already read
    { $set: { read: true, readAt: new Date() } },
    { new: true } // Return the updated document
  );

  if (!notification) {
    // If not found or already read, return 200 with a message, or 404 if strictly not found
    return res.status(404).json({ success: false, message: 'Notification not found or already read.' });
  }

  await triggerPusherEvent(`private-user-${req.user.id}`, 'notification-update', { id: notification._id, read: true, readAt: notification.readAt });

  res.status(200).json({ success: true, message: 'Notification marked as read', data: notification });
}));

/**
 * PUT /api/notifications/read-all - Mark all unread notifications for the authenticated user as read.
 * Middleware: provideDefaultUser
 */
router.put('/read-all', provideDefaultUser, asyncHandler(async (req, res) => {
  const now = new Date();
  const result = await Notification.updateMany(
    { userId: req.user.id, read: false },
    { $set: { read: true, readAt: now } }
  );
  // Trigger event for all notifications being read
  await triggerPusherEvent(`private-user-${req.user.id}`, 'notifications-read-all', { userId: req.user.id, readAt: now, count: result.modifiedCount });

  res.status(200).json({ success: true, message: 'All unread notifications marked as read', count: result.modifiedCount });
}));

/**
 * POST /api/notifications - Create a new notification for the authenticated user.
 * Middleware: provideDefaultUser, notificationRateLimit, validateNotification
 */
router.post('/', provideDefaultUser, notificationRateLimit, validateNotification, asyncHandler(async (req, res) => {
  const { type, title, message, link, data } = req.body; // Added 'data' field
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  if (user.notifications === false) return res.status(200).json({ success: true, message: 'Notifications disabled for this user.', data: null });

  const notification = new Notification({
    userId: req.user.id,
    userEmail: user.email,
    type,
    title,
    message,
    link,
    data, // Save the data payload
    read: false
  });
  await notification.save();

  await triggerPusherEvent(`private-user-${req.user.id}`, 'notification', notification);

  res.status(201).json({ success: true, message: 'Notification created', data: notification });
}));

/**
 * DELETE /api/notifications/:id - Delete a specific notification.
 * Middleware: provideDefaultUser
 */
router.delete('/:id', provideDefaultUser, asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
  
  await triggerPusherEvent(`private-user-${req.user.id}`, 'notification-delete', { id: req.params.id });
  res.status(200).json({ success: true, message: 'Notification deleted successfully' });
}));

/**
 * POST /api/notifications/admin/create - Admin-only endpoint to create a notification for any user.
 * Middleware: requireAdmin, validateAdminNotification
 */
router.post('/admin/create', requireAdmin, validateAdminNotification, asyncHandler(async (req, res) => {
  const { userId, type, title, message, link, data } = req.body; // Added 'data' field
  const targetUser = await User.findById(userId);
  if (!targetUser) return res.status(404).json({ success: false, message: 'Target user not found' });
  if (targetUser.notifications === false) return res.status(200).json({ success: true, message: 'Notifications disabled for this user.', data: null });

  const notification = new Notification({
    userId,
    userEmail: targetUser.email,
    type,
    title,
    message,
    link,
    data, // Save the data payload
    read: false
  });
  await notification.save();
  await triggerPusherEvent(`private-user-${userId}`, 'notification', notification);

  res.status(201).json({ success: true, message: 'Admin notification created', data: notification });
}));

// ------------------ System Notification Helper (for internal use by other services) ------------------
/**
 * createSystemNotification - A helper function to create and send a notification from backend services.
 * This function is designed to be called internally by other parts of your backend (e.g., a trading engine).
 * @param {string} userId - The ID of the user to send the notification to.
 * @param {string} userEmail - The email of the user.
 * @param {string} type - 'alert' | 'info' | 'success' | 'error' | 'warning'
 * @param {string} title - The notification title (max 100 chars).
 * @param {string} message - The notification message (max 500 chars).
 * @param {string} [link=null] - Optional link for the notification.
 * @param {object} [data={}] - Optional arbitrary data payload.
 * @returns {Promise<Notification|null>} The created notification document or null if failed/disabled.
 */
const createSystemNotification = async (userId, userEmail, type, title, message, link = null, data = {}) => {
  try {
    if (!userId || !userEmail || !title || !message) {
      console.warn('Skipping system notification due to missing required fields.');
      return null;
    }
    const user = await User.findById(userId);
    if (!user || user.notifications === false) {
      console.log(`System notification skipped for user ${userId}: notifications disabled or user not found.`);
      return null;
    }

    const notification = new Notification({
      userId,
      userEmail,
      type,
      title: title.toString().trim().substring(0, 100),
      message: message.toString().trim().substring(0, 500),
      link,
      data, // Include the data payload
      read: false
    });
    await notification.save();
    await triggerPusherEvent(`private-user-${userId}`, 'notification', notification);
    return notification;
  } catch (err) {
    console.error('Error creating system notification:', err.message);
    return null;
  }
};

// ------------------ Export Router and Helper ------------------
// Export the router for use in your main Express app
module.exports = router;
// Optionally export the helper function for other backend modules to use
module.exports.createSystemNotification = createSystemNotification;