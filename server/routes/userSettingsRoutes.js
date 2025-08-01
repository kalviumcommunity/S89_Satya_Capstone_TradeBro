/**
 * User Settings Routes
 * Clean, modular routes for user settings functionality
 */

const express = require('express');
const router = express.Router();

// Import middleware
const { provideDefaultUser } = require('../middleware/defaultUser');
const { profileImageUpload, handleUploadError } = require('../middleware/uploadMiddleware');
const {
  userSettingsRateLimit,
  notificationSettingsRateLimit,
  fileUploadRateLimit,
  generalUserSettingsRateLimit
} = require('../middleware/rateLimitMiddleware');

// Import controller
const userSettingsController = require('../controllers/userSettingsController');

// Apply general rate limiting to all routes
router.use(generalUserSettingsRateLimit);

// Apply authentication middleware to all routes
router.use(provideDefaultUser);

/**
 * GET /api/settings
 * Get user settings
 * 
 * Response:
 * {
 *   "success": true,
 *   "userSettings": {
 *     "fullName": "John Doe",
 *     "email": "john@example.com",
 *     "phoneNumber": "+1234567890",
 *     "language": "English",
 *     "profileImage": "profile_123456.jpg",
 *     "notifications": true,
 *     "tradingExperience": "Intermediate",
 *     "bio": "Experienced trader",
 *     "preferredMarkets": ["Stocks", "Crypto"],
 *     "createdAt": "2024-01-01T00:00:00.000Z",
 *     "updatedAt": "2024-01-01T00:00:00.000Z"
 *   },
 *   "timestamp": "2024-01-01T00:00:00.000Z"
 * }
 */
router.get('/', userSettingsController.getUserSettings.bind(userSettingsController));

/**
 * PUT /api/settings
 * Update user settings with optional file upload
 * Rate limited: 10 requests per 15 minutes
 * 
 * Body (multipart/form-data):
 * - fullName (string, optional): User's full name
 * - phoneNumber (string, optional): Phone number
 * - language (string, optional): Preferred language
 * - bio (string, optional): User bio
 * - tradingExperience (string, optional): Trading experience level
 * - notifications (boolean, optional): Notifications enabled
 * - preferredMarkets (array|string, optional): Preferred markets
 * - profileImage (file, optional): Profile image file
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Settings updated successfully!",
 *   "userSettings": {...},
 *   "updatedFields": ["fullName", "bio"],
 *   "timestamp": "2024-01-01T00:00:00.000Z"
 * }
 */
router.put('/', 
  userSettingsRateLimit,
  fileUploadRateLimit,
  profileImageUpload.single('profileImage'),
  handleUploadError,
  userSettingsController.updateUserSettings.bind(userSettingsController)
);

/**
 * DELETE /api/settings
 * Reset user settings to defaults
 * Rate limited: 10 requests per 15 minutes
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "User settings deleted successfully!",
 *   "userSettings": {...},
 *   "timestamp": "2024-01-01T00:00:00.000Z"
 * }
 */
router.delete('/', 
  userSettingsRateLimit,
  userSettingsController.deleteUserSettings.bind(userSettingsController)
);

/**
 * DELETE /api/settings/profile-image
 * Delete user's profile image
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Profile image deleted successfully!",
 *   "userSettings": {...},
 *   "timestamp": "2024-01-01T00:00:00.000Z"
 * }
 */
router.delete('/profile-image', 
  userSettingsController.deleteProfileImage.bind(userSettingsController)
);

/**
 * GET /api/settings/notifications
 * Get notification settings
 * 
 * Response:
 * {
 *   "success": true,
 *   "notifications": true,
 *   "notificationPreferences": {
 *     "email": true,
 *     "push": true,
 *     "priceAlerts": true,
 *     "newsAlerts": true,
 *     "orderUpdates": true,
 *     "marketUpdates": false
 *   },
 *   "timestamp": "2024-01-01T00:00:00.000Z"
 * }
 */
router.get('/notifications', 
  userSettingsController.getNotificationSettings.bind(userSettingsController)
);

/**
 * PUT /api/settings/notifications
 * Update notification settings
 * Rate limited: 20 requests per 15 minutes
 * 
 * Body (JSON):
 * {
 *   "notifications": true,
 *   "notificationPreferences": {
 *     "email": true,
 *     "push": false,
 *     "priceAlerts": true,
 *     "newsAlerts": false,
 *     "orderUpdates": true,
 *     "marketUpdates": true
 *   }
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Notification settings updated successfully!",
 *   "notifications": true,
 *   "notificationPreferences": {...},
 *   "updatedFields": ["notifications", "notificationPreferences"],
 *   "timestamp": "2024-01-01T00:00:00.000Z"
 * }
 */
router.put('/notifications', 
  notificationSettingsRateLimit,
  userSettingsController.updateNotificationSettings.bind(userSettingsController)
);

/**
 * GET /api/settings/profile-summary
 * Get user profile summary (for testing and dashboard)
 * 
 * Response:
 * {
 *   "success": true,
 *   "profileSummary": {
 *     "id": "user_id",
 *     "fullName": "John Doe",
 *     "email": "john@example.com",
 *     "hasProfileImage": true,
 *     "notificationsEnabled": true,
 *     "tradingExperience": "Intermediate",
 *     "preferredMarketsCount": 2,
 *     "accountAge": 30
 *   },
 *   "timestamp": "2024-01-01T00:00:00.000Z"
 * }
 */
router.get('/profile-summary', 
  userSettingsController.getProfileSummary.bind(userSettingsController)
);

/**
 * Error handling middleware for user settings routes
 */
router.use((error, req, res, next) => {
  console.error('❌ User settings route error:', {
    error: error.message,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    timestamp: new Date().toISOString()
  });

  res.status(500).json({
    success: false,
    error: 'User settings service error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Service temporarily unavailable',
    code: 'ROUTE_ERROR',
    timestamp: new Date().toISOString()
  });
});

/**
 * 404 handler for unknown user settings endpoints
 */
router.use('*', (req, res) => {
  console.warn(`⚠️ Unknown user settings endpoint: ${req.method} ${req.originalUrl}`);
  
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `The endpoint ${req.method} ${req.path} does not exist`,
    code: 'ENDPOINT_NOT_FOUND',
    availableEndpoints: [
      'GET /api/settings',
      'PUT /api/settings',
      'DELETE /api/settings',
      'DELETE /api/settings/profile-image',
      'GET /api/settings/notifications',
      'PUT /api/settings/notifications',
      'GET /api/settings/profile-summary'
    ],
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
