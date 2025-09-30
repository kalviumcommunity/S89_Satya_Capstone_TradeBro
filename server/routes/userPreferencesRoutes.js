const express = require('express');
const router = express.Router();
const UserPreferences = require('../models/UserPreferences');
const { verifyToken } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const rateLimit = require('express-rate-limit');

// Rate limiting for preferences routes
const preferencesRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  message: {
    success: false,
    error: 'Too many preference requests, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});

// Apply rate limiting and authentication to all routes
router.use(preferencesRateLimit);
router.use(verifyToken);

/**
 * GET /api/user-preferences
 * Get all user preferences
 */
router.get('/', asyncHandler(async (req, res) => {
  const { id: userId } = req.user;
  
  const preferences = await UserPreferences.getUserPreferences(userId);
  
  res.json({
    success: true,
    data: preferences,
    timestamp: new Date().toISOString()
  });
}));

/**
 * GET /api/user-preferences/:category
 * Get preferences for a specific category
 */
router.get('/:category', asyncHandler(async (req, res) => {
  const { id: userId } = req.user;
  const { category } = req.params;
  
  const preferences = await UserPreferences.getUserPreferences(userId);
  
  if (!preferences || !preferences[category]) {
    return res.status(404).json({
      success: false,
      error: `Preferences category '${category}' not found`,
      code: 'CATEGORY_NOT_FOUND'
    });
  }
  
  res.json({
    success: true,
    data: preferences[category],
    category,
    timestamp: new Date().toISOString()
  });
}));

/**
 * PUT /api/user-preferences
 * Update multiple preference categories
 */
router.put('/', asyncHandler(async (req, res) => {
  const { id: userId } = req.user;
  const updates = req.body;
  
  const preferences = await UserPreferences.updateUserPreferences(userId, updates);
  
  res.json({
    success: true,
    message: 'Preferences updated successfully',
    data: preferences,
    timestamp: new Date().toISOString()
  });
}));

/**
 * PUT /api/user-preferences/:category
 * Update preferences for a specific category
 */
router.put('/:category', asyncHandler(async (req, res) => {
  const { id: userId } = req.user;
  const { category } = req.params;
  const updates = req.body;
  
  const preferences = await UserPreferences.getUserPreferences(userId);
  
  if (!preferences) {
    return res.status(404).json({
      success: false,
      error: 'User preferences not found',
      code: 'PREFERENCES_NOT_FOUND'
    });
  }
  
  if (!preferences[category]) {
    return res.status(404).json({
      success: false,
      error: `Preferences category '${category}' not found`,
      code: 'CATEGORY_NOT_FOUND'
    });
  }
  
  // Update the specific category
  Object.keys(updates).forEach(key => {
    if (preferences[category][key] !== undefined) {
      preferences[category][key] = updates[key];
    }
  });
  
  await preferences.save();
  
  res.json({
    success: true,
    message: `${category} preferences updated successfully`,
    data: preferences[category],
    category,
    timestamp: new Date().toISOString()
  });
}));

/**
 * PATCH /api/user-preferences/:category/:key
 * Update a specific preference key
 */
router.patch('/:category/:key', asyncHandler(async (req, res) => {
  const { id: userId } = req.user;
  const { category, key } = req.params;
  const { value } = req.body;
  
  if (value === undefined) {
    return res.status(400).json({
      success: false,
      error: 'Value is required',
      code: 'MISSING_VALUE'
    });
  }
  
  const preferences = await UserPreferences.getUserPreferences(userId);
  
  if (!preferences) {
    return res.status(404).json({
      success: false,
      error: 'User preferences not found',
      code: 'PREFERENCES_NOT_FOUND'
    });
  }
  
  try {
    await preferences.updatePreference(category, key, value);
    
    res.json({
      success: true,
      message: `Preference ${category}.${key} updated successfully`,
      data: {
        category,
        key,
        value,
        updated: preferences[category][key]
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
      code: 'INVALID_PREFERENCE'
    });
  }
}));

/**
 * POST /api/user-preferences/reset
 * Reset preferences to defaults
 */
router.post('/reset', asyncHandler(async (req, res) => {
  const { id: userId } = req.user;
  const { category, confirm } = req.body;
  
  if (!confirm) {
    return res.status(400).json({
      success: false,
      error: 'Confirmation required to reset preferences',
      code: 'CONFIRMATION_REQUIRED'
    });
  }
  
  const preferences = await UserPreferences.getUserPreferences(userId);
  
  if (!preferences) {
    return res.status(404).json({
      success: false,
      error: 'User preferences not found',
      code: 'PREFERENCES_NOT_FOUND'
    });
  }
  
  await preferences.resetToDefaults(category);
  
  res.json({
    success: true,
    message: category ? 
      `${category} preferences reset to defaults` : 
      'All preferences reset to defaults',
    data: category ? preferences[category] : preferences,
    timestamp: new Date().toISOString()
  });
}));

/**
 * GET /api/user-preferences/interface/theme
 * Get current theme preference
 */
router.get('/interface/theme', asyncHandler(async (req, res) => {
  const { id: userId } = req.user;
  
  const preferences = await UserPreferences.getUserPreferences(userId);
  
  res.json({
    success: true,
    data: {
      theme: preferences?.interface?.theme || 'light'
    },
    timestamp: new Date().toISOString()
  });
}));

/**
 * PUT /api/user-preferences/interface/theme
 * Update theme preference
 */
router.put('/interface/theme', asyncHandler(async (req, res) => {
  const { id: userId } = req.user;
  const { theme } = req.body;
  
  if (!['light', 'dark', 'auto'].includes(theme)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid theme. Must be light, dark, or auto',
      code: 'INVALID_THEME'
    });
  }
  
  const preferences = await UserPreferences.getUserPreferences(userId);
  preferences.interface.theme = theme;
  await preferences.save();
  
  res.json({
    success: true,
    message: 'Theme updated successfully',
    data: {
      theme: preferences.interface.theme
    },
    timestamp: new Date().toISOString()
  });
}));

/**
 * GET /api/user-preferences/trading/settings
 * Get trading-specific preferences
 */
router.get('/trading/settings', asyncHandler(async (req, res) => {
  const { id: userId } = req.user;
  
  const preferences = await UserPreferences.getUserPreferences(userId);
  
  res.json({
    success: true,
    data: preferences?.trading || {},
    timestamp: new Date().toISOString()
  });
}));

/**
 * GET /api/user-preferences/dashboard/layout
 * Get dashboard layout preferences
 */
router.get('/dashboard/layout', asyncHandler(async (req, res) => {
  const { id: userId } = req.user;
  
  const preferences = await UserPreferences.getUserPreferences(userId);
  
  res.json({
    success: true,
    data: preferences?.dashboard || {},
    timestamp: new Date().toISOString()
  });
}));

/**
 * PUT /api/user-preferences/dashboard/widgets
 * Update dashboard widget configuration
 */
router.put('/dashboard/widgets', asyncHandler(async (req, res) => {
  const { id: userId } = req.user;
  const { widgets } = req.body;
  
  if (!Array.isArray(widgets)) {
    return res.status(400).json({
      success: false,
      error: 'Widgets must be an array',
      code: 'INVALID_WIDGETS'
    });
  }
  
  const preferences = await UserPreferences.getUserPreferences(userId);
  preferences.dashboard.widgets = widgets;
  await preferences.save();
  
  res.json({
    success: true,
    message: 'Dashboard widgets updated successfully',
    data: preferences.dashboard.widgets,
    timestamp: new Date().toISOString()
  });
}));

/**
 * GET /api/user-preferences/notifications/settings
 * Get notification preferences
 */
router.get('/notifications/settings', asyncHandler(async (req, res) => {
  const { id: userId } = req.user;
  
  const preferences = await UserPreferences.getUserPreferences(userId);
  
  res.json({
    success: true,
    data: preferences?.notifications || {},
    timestamp: new Date().toISOString()
  });
}));

/**
 * GET /api/user-preferences/export
 * Export user preferences
 */
router.get('/export', asyncHandler(async (req, res) => {
  const { id: userId } = req.user;
  const { format = 'json' } = req.query;
  
  const preferences = await UserPreferences.findOne({ userId }).populate('userId', 'fullName email');
  
  if (!preferences) {
    return res.status(404).json({
      success: false,
      error: 'User preferences not found',
      code: 'PREFERENCES_NOT_FOUND'
    });
  }
  
  if (format === 'json') {
    res.json({
      success: true,
      data: preferences,
      exportedAt: new Date().toISOString()
    });
  } else {
    res.status(400).json({
      success: false,
      error: 'Unsupported export format',
      code: 'UNSUPPORTED_FORMAT'
    });
  }
}));

module.exports = router;
