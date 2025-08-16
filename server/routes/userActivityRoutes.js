const express = require('express');
const router = express.Router();
const UserActivity = require('../models/UserActivity');
const { verifyToken } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const rateLimit = require('express-rate-limit');

// Rate limiting for activity routes
const activityRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many activity requests, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});

// Apply rate limiting and authentication to all routes
router.use(activityRateLimit);
router.use(verifyToken);

/**
 * GET /api/user-activity
 * Get user activity data
 */
router.get('/', asyncHandler(async (req, res) => {
  const { id: userId } = req.user;
  
  const activity = await UserActivity.getUserActivity(userId);
  
  if (!activity) {
    return res.status(404).json({
      success: false,
      error: 'User activity not found',
      code: 'ACTIVITY_NOT_FOUND'
    });
  }
  
  res.json({
    success: true,
    data: activity,
    timestamp: new Date().toISOString()
  });
}));

/**
 * GET /api/user-activity/summary
 * Get user activity summary for specified days
 */
router.get('/summary', asyncHandler(async (req, res) => {
  const { id: userId } = req.user;
  const { days = 30 } = req.query;
  
  const summary = await UserActivity.getActivitySummary(userId, parseInt(days));
  
  if (!summary) {
    return res.status(404).json({
      success: false,
      error: 'Activity summary not found',
      code: 'SUMMARY_NOT_FOUND'
    });
  }
  
  res.json({
    success: true,
    data: summary,
    period: `${days} days`,
    timestamp: new Date().toISOString()
  });
}));

/**
 * POST /api/user-activity/track
 * Track a new user activity
 */
router.post('/track', asyncHandler(async (req, res) => {
  const { id: userId, email: userEmail } = req.user;
  const { type, description, metadata = {} } = req.body;
  
  // Validate required fields
  if (!type || !description) {
    return res.status(400).json({
      success: false,
      error: 'Activity type and description are required',
      code: 'MISSING_REQUIRED_FIELDS'
    });
  }
  
  // Find or create user activity document
  let activity = await UserActivity.findOne({ userId });
  
  if (!activity) {
    activity = new UserActivity({
      userId,
      userEmail,
      activities: [],
      sessions: [],
      dailyStats: [],
      trackingPreferences: {},
      summary: {}
    });
  }
  
  // Add client metadata
  const enhancedMetadata = {
    ...metadata,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    deviceType: req.get('User-Agent')?.includes('Mobile') ? 'mobile' : 'desktop'
  };
  
  // Add the activity
  await activity.addActivity(type, description, enhancedMetadata);
  
  // Update daily stats
  await activity.updateDailyStats();
  
  res.status(201).json({
    success: true,
    message: 'Activity tracked successfully',
    data: {
      type,
      description,
      timestamp: new Date().toISOString()
    }
  });
}));

/**
 * POST /api/user-activity/session/start
 * Start a new user session
 */
router.post('/session/start', asyncHandler(async (req, res) => {
  const { id: userId, email: userEmail } = req.user;
  const { sessionId } = req.body;
  
  if (!sessionId) {
    return res.status(400).json({
      success: false,
      error: 'Session ID is required',
      code: 'MISSING_SESSION_ID'
    });
  }
  
  // Find or create user activity document
  let activity = await UserActivity.findOne({ userId });
  
  if (!activity) {
    activity = new UserActivity({
      userId,
      userEmail,
      activities: [],
      sessions: [],
      dailyStats: [],
      trackingPreferences: {},
      summary: {}
    });
  }
  
  // Start the session
  await activity.startSession(
    sessionId,
    req.ip,
    req.get('User-Agent'),
    req.get('User-Agent')?.includes('Mobile') ? 'mobile' : 'desktop'
  );
  
  res.status(201).json({
    success: true,
    message: 'Session started successfully',
    data: {
      sessionId,
      startTime: new Date().toISOString()
    }
  });
}));

/**
 * POST /api/user-activity/session/end
 * End a user session
 */
router.post('/session/end', asyncHandler(async (req, res) => {
  const { id: userId } = req.user;
  const { sessionId } = req.body;
  
  if (!sessionId) {
    return res.status(400).json({
      success: false,
      error: 'Session ID is required',
      code: 'MISSING_SESSION_ID'
    });
  }
  
  const activity = await UserActivity.findOne({ userId });
  
  if (!activity) {
    return res.status(404).json({
      success: false,
      error: 'User activity not found',
      code: 'ACTIVITY_NOT_FOUND'
    });
  }
  
  // End the session
  await activity.endSession(sessionId);
  
  res.json({
    success: true,
    message: 'Session ended successfully',
    data: {
      sessionId,
      endTime: new Date().toISOString()
    }
  });
}));

/**
 * GET /api/user-activity/stats/daily
 * Get daily activity statistics
 */
router.get('/stats/daily', asyncHandler(async (req, res) => {
  const { id: userId } = req.user;
  const { days = 7 } = req.query;
  
  const activity = await UserActivity.findOne({ userId });
  
  if (!activity) {
    return res.status(404).json({
      success: false,
      error: 'User activity not found',
      code: 'ACTIVITY_NOT_FOUND'
    });
  }
  
  // Get recent daily stats
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));
  
  const dailyStats = activity.dailyStats
    .filter(stat => stat.date >= cutoffDate)
    .sort((a, b) => b.date - a.date);
  
  res.json({
    success: true,
    data: dailyStats,
    period: `${days} days`,
    timestamp: new Date().toISOString()
  });
}));

/**
 * PUT /api/user-activity/preferences
 * Update activity tracking preferences
 */
router.put('/preferences', asyncHandler(async (req, res) => {
  const { id: userId, email: userEmail } = req.user;
  const preferences = req.body;
  
  // Find or create user activity document
  let activity = await UserActivity.findOne({ userId });
  
  if (!activity) {
    activity = new UserActivity({
      userId,
      userEmail,
      activities: [],
      sessions: [],
      dailyStats: [],
      trackingPreferences: {},
      summary: {}
    });
  }
  
  // Update preferences
  activity.trackingPreferences = {
    ...activity.trackingPreferences,
    ...preferences
  };
  
  await activity.save();
  
  res.json({
    success: true,
    message: 'Tracking preferences updated successfully',
    data: activity.trackingPreferences
  });
}));

/**
 * DELETE /api/user-activity/data
 * Delete user activity data (GDPR compliance)
 */
router.delete('/data', asyncHandler(async (req, res) => {
  const { id: userId } = req.user;
  const { confirm } = req.body;
  
  if (!confirm) {
    return res.status(400).json({
      success: false,
      error: 'Confirmation required to delete activity data',
      code: 'CONFIRMATION_REQUIRED'
    });
  }
  
  const result = await UserActivity.deleteOne({ userId });
  
  if (result.deletedCount === 0) {
    return res.status(404).json({
      success: false,
      error: 'No activity data found to delete',
      code: 'NO_DATA_FOUND'
    });
  }
  
  res.json({
    success: true,
    message: 'Activity data deleted successfully',
    timestamp: new Date().toISOString()
  });
}));

/**
 * GET /api/user-activity/export
 * Export user activity data
 */
router.get('/export', asyncHandler(async (req, res) => {
  const { id: userId } = req.user;
  const { format = 'json' } = req.query;
  
  const activity = await UserActivity.findOne({ userId }).populate('userId', 'fullName email');
  
  if (!activity) {
    return res.status(404).json({
      success: false,
      error: 'User activity not found',
      code: 'ACTIVITY_NOT_FOUND'
    });
  }
  
  if (format === 'json') {
    res.json({
      success: true,
      data: activity,
      exportedAt: new Date().toISOString()
    });
  } else {
    // Could add CSV export here
    res.status(400).json({
      success: false,
      error: 'Unsupported export format',
      code: 'UNSUPPORTED_FORMAT'
    });
  }
}));

module.exports = router;
