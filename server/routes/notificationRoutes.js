const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const User = require('../models/User');
const { provideDefaultUser } = require('../middleware/defaultUser');
const { requireAdmin } = require('../middleware/adminAuth');
const { createRateLimit } = require('../middleware/rateLimiter');
const { validateNotification, validateAdminNotification, validatePagination } = require('../middleware/validation');
const Pusher = require("pusher");

// Pusher Config
const pusherConfig = {
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true
};

const pusher = new Pusher(pusherConfig);

// Rate Limiting
const notificationRateLimit = createRateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many notification requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Async Handler
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Pusher Trigger Helper
const triggerPusherEvent = async (channel, event, data, retries = 3) => {
  if (!pusher) {
    console.warn('Pusher instance not initialized. Cannot trigger event.');
    return false;
  }
  const formattedChannel = channel.startsWith('private-') ? channel : `private-${channel}`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await pusher.trigger(formattedChannel, event, data);
      console.log(`Pusher event triggered: Channel=${formattedChannel}, Event=${event}`);
      return true;
    } catch (err) {
      console.error(`❌ Pusher attempt ${attempt} failed:`, err.message);
      if (attempt === retries) return false;
      await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
    }
  }
  return false;
};

// Get paginated notifications
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
    .lean();

  res.status(200).json({
    success: true,
    data: notifications,
    pagination: {
      page: parseInt(page),
      total: totalCount,
      hasMore: parseInt(page) < totalPages,
      totalPages,
      limit: parseInt(limit)
    }
  });
}));

// Get unread count
router.get('/unread-count', provideDefaultUser, asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ userId: req.user.id, read: false });
  res.status(200).json({ success: true, count });
}));

// Mark notification as read
router.put('/:id/read', provideDefaultUser, asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({ _id: req.params.id, userId: req.user.id }).lean();

  if (!notification) {
    return res.status(404).json({ success: false, message: 'Notification not found.' });
  }

  if (notification.read) {
    return res.status(200).json({ success: true, message: 'Notification was already marked as read.', data: notification });
  }

  const updatedNotification = await Notification.findByIdAndUpdate(
    notification._id,
    { $set: { read: true, readAt: new Date() } },
    { new: true }
  );

  await triggerPusherEvent(`private-user-${req.user.id}`, 'notification-update', { id: updatedNotification._id, read: true, readAt: updatedNotification.readAt });
  res.status(200).json({ success: true, message: 'Notification marked as read', data: updatedNotification });
}));

// Mark all notifications as read
router.put('/read-all', provideDefaultUser, asyncHandler(async (req, res) => {
  const now = new Date();
  const result = await Notification.updateMany(
    { userId: req.user.id, read: false },
    { $set: { read: true, readAt: now } }
  );
  
  await triggerPusherEvent(`private-user-${req.user.id}`, 'notifications-read-all', { userId: req.user.id, readAt: now, count: result.modifiedCount });
  res.status(200).json({ success: true, message: 'All unread notifications marked as read', count: result.modifiedCount });
}));

// Create notification
router.post('/', provideDefaultUser, notificationRateLimit, validateNotification, asyncHandler(async (req, res) => {
  const { type, title, message, link, data } = req.body;
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  
  if (user.notifications === false) {
    return res.status(200).json({ success: true, message: 'Notifications disabled for this user.', data: null });
  }

  const notification = new Notification({
    userId: req.user.id,
    userEmail: user.email,
    type,
    title,
    message,
    link,
    data,
    read: false
  });
  await notification.save();

  await triggerPusherEvent(`private-user-${req.user.id}`, 'notification', notification);
  res.status(201).json({ success: true, message: 'Notification created', data: notification });
}));

// Delete notification
router.delete('/:id', provideDefaultUser, asyncHandler(async (req, res) => {
  const result = await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  if (!result) return res.status(404).json({ success: false, message: 'Notification not found' });
  
  await triggerPusherEvent(`private-user-${req.user.id}`, 'notification-delete', { id: req.params.id });
  res.status(200).json({ success: true, message: 'Notification deleted successfully' });
}));

// Admin create notification
router.post('/admin/create', requireAdmin, validateAdminNotification, asyncHandler(async (req, res) => {
  const { userId, type, title, message, link, data } = req.body;
  const targetUser = await User.findById(userId);
  if (!targetUser) return res.status(404).json({ success: false, message: 'Target user not found' });
  
  if (targetUser.notifications === false) {
    return res.status(200).json({ success: true, message: 'Notifications disabled for this user.', data: null });
  }

  const notification = new Notification({
    userId,
    userEmail: targetUser.email,
    type,
    title,
    message,
    link,
    data,
    read: false
  });
  await notification.save();
  await triggerPusherEvent(`private-user-${userId}`, 'notification', notification);

  res.status(201).json({ success: true, message: 'Admin notification created', data: notification });
}));

// System Notification Helper
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
      data,
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

module.exports = router;
module.exports.createSystemNotification = createSystemNotification;