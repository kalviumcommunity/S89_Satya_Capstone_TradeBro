// routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const User = require('../models/User');
const { provideDefaultUser } = require('../middleware/defaultUser');
const { requireAdmin } = require('../middleware/adminAuth');
const { createRateLimit } = require('../middleware/rateLimiter');
const { validateNotification, validateAdminNotification, validatePagination } = require('../middleware/validation');
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
  windowMs: 1 * 60 * 1000, // 1 min
  max: 10,
  message: { success: false, message: 'Too many notifications. Try later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// ------------------ Helper: Pusher Trigger ------------------
const triggerPusherEvent = async (channel, event, data, retries = 3) => {
  if (!pusher) return false;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await pusher.trigger(channel, event, data);
      return true;
    } catch (err) {
      console.error(`Pusher attempt ${attempt} failed:`, err.message);
      if (attempt === retries) return false;
      await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
    }
  }
  return false;
};

// ------------------ Routes ------------------

// GET notifications with pagination
router.get('/', provideDefaultUser, validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = '-createdAt' } = req.query;
    const skip = (page - 1) * limit;
    const query = { userId: req.user.id };

    const totalCount = await Notification.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    const notifications = await Notification.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    res.status(200).json({
      success: true,
      data: notifications,
      pagination: { 
        page: parseInt(page), 
        total: totalCount, 
        hasMore: page < totalPages,
        totalPages,
        limit: parseInt(limit)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// GET unread count
router.get('/unread-count', provideDefaultUser, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ userId: req.user.id, read: false });
    res.status(200).json({ success: true, count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// Mark a notification as read
router.put('/:id/read', provideDefaultUser, async (req, res) => {
  try {
    const notification = await Notification.findOne({ _id: req.params.id, userId: req.user.id });
    if (!notification) return res.status(404).json({ success: false, message: 'Not found' });

    if (!notification.read) {
      notification.read = true;
      notification.readAt = new Date();
      await notification.save();
      await triggerPusherEvent(`user-${req.user.id}`, 'notification-update', { id: notification._id, read: true, readAt: notification.readAt });
    }

    res.status(200).json({ success: true, message: 'Marked as read', data: notification });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// Mark all notifications as read
router.put('/read-all', provideDefaultUser, async (req, res) => {
  try {
    const now = new Date();
    const result = await Notification.updateMany(
      { userId: req.user.id, read: false },
      { $set: { read: true, readAt: now } }
    );
    await triggerPusherEvent(`user-${req.user.id}`, 'notifications-read-all', { userId: req.user.id, readAt: now, count: result.modifiedCount });

    res.status(200).json({ success: true, message: 'All marked as read', count: result.modifiedCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// Create a notification
router.post('/', provideDefaultUser, notificationRateLimit, validateNotification, async (req, res) => {
  try {
    const { type, title, message, link } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.notifications === false) return res.status(200).json({ success: true, message: 'Notifications disabled', data: null });

    const notification = new Notification({ userId: req.user.id, userEmail: user.email, type, title, message, link, read: false });
    await notification.save();

    await triggerPusherEvent(`user-${req.user.id}`, 'notification', notification);

    res.status(201).json({ success: true, message: 'Created', data: notification });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// Delete a notification
router.delete('/:id', provideDefaultUser, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!notification) return res.status(404).json({ success: false, message: 'Not found' });
    await triggerPusherEvent(`user-${req.user.id}`, 'notification-delete', { id: req.params.id });
    res.status(200).json({ success: true, message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// Admin create notification
router.post('/admin/create', requireAdmin, validateAdminNotification, async (req, res) => {
  try {
    const { userId, type, title, message, link } = req.body;
    const targetUser = await User.findById(userId);
    if (!targetUser) return res.status(404).json({ success: false, message: 'Target user not found' });
    if (targetUser.notifications === false) return res.status(200).json({ success: true, message: 'Notifications disabled', data: null });

    const notification = new Notification({ userId, userEmail: targetUser.email, type, title, message, link, read: false });
    await notification.save();
    await triggerPusherEvent(`user-${userId}`, 'notification', notification);

    res.status(201).json({ success: true, message: 'Admin notification created', data: notification });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// ------------------ System Notification Helper ------------------
const createSystemNotification = async (userId, userEmail, type, title, message, link = null) => {
  try {
    if (!userId || !userEmail || !title || !message) return null;
    const user = await User.findById(userId);
    if (!user || user.notifications === false) return null;

    const notification = new Notification({
      userId,
      userEmail,
      type,
      title: title.toString().trim().substring(0, 100),
      message: message.toString().trim().substring(0, 500),
      link,
      read: false
    });
    await notification.save();
    await triggerPusherEvent(`user-${userId}`, 'notification', notification);
    return notification;
  } catch (err) {
    console.error('Error creating system notification:', err.message);
    return null;
  }
};

// ------------------ Export Router Only ------------------
router.createSystemNotification = createSystemNotification; // optional helper
module.exports = router;
