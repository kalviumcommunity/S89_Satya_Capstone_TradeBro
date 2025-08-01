/**
 * User Settings Controller
 * Handles all user settings business logic
 */

const User = require('../models/User');
const {
  handleError,
  validateUserSettings,
  validateNotificationPreferences,
  parsePreferredMarkets,
  formatUserSettings,
  formatNotificationSettings,
  logUserSettingsOperation,
  validateUserId
} = require('../utils/userSettingsUtils');
const {
  validateUploadedFile,
  deleteUploadedFile,
  cleanupOldProfileImages
} = require('../middleware/uploadMiddleware');

class UserSettingsController {
  /**
   * Get user by ID with error handling
   * @param {string} userId - User ID
   * @returns {Promise<object|null>} User document or null
   */
  async getUserById(userId) {
    try {
      const validation = validateUserId(userId);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      const user = await User.findById(validation.userId);
      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      console.error('❌ Error fetching user:', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get user settings
   * GET /settings
   */
  async getUserSettings(req, res) {
    try {
      const userId = req.user.id;
      logUserSettingsOperation('fetch', userId);

      const user = await this.getUserById(userId);
      const userSettings = formatUserSettings(user);

      console.log('✅ User settings fetched successfully:', {
        userId,
        hasProfileImage: !!userSettings.profileImage
      });

      res.status(200).json({
        success: true,
        userSettings,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      handleError(res, error, 'fetch settings', req.user?.id);
    }
  }

  /**
   * Update user settings
   * PUT /settings
   */
  async updateUserSettings(req, res) {
    try {
      const userId = req.user.id;
      const user = await this.getUserById(userId);

      // Validate input data
      const validation = validateUserSettings(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          errors: validation.errors,
          code: 'VALIDATION_ERROR'
        });
      }

      const changes = { ...validation.sanitized };

      // Handle file upload
      if (req.file) {
        const fileValidation = validateUploadedFile(req.file);
        if (!fileValidation.isValid) {
          return res.status(400).json({
            success: false,
            error: fileValidation.error,
            code: 'INVALID_FILE'
          });
        }

        // Delete old profile image
        if (user.profileImage) {
          await deleteUploadedFile(user.profileImage);
        }

        changes.profileImage = req.file.filename;
        
        // Cleanup old images
        await cleanupOldProfileImages(userId, req.file.filename);

        console.log('📤 Profile image uploaded:', {
          userId,
          filename: req.file.filename,
          size: req.file.size
        });
      }

      // Handle preferred markets
      if (req.body.preferredMarkets) {
        const marketsResult = parsePreferredMarkets(req.body.preferredMarkets);
        changes.preferredMarkets = marketsResult.markets;
        
        if (!marketsResult.isValid) {
          console.warn('⚠️ Invalid preferred markets provided:', {
            userId,
            invalid: marketsResult.invalidMarkets,
            using: marketsResult.markets
          });
        }
      }

      // Update user document
      Object.assign(user, changes);
      await user.save();

      const userSettings = formatUserSettings(user);
      
      logUserSettingsOperation('update', userId, changes);

      console.log('✅ User settings updated successfully:', {
        userId,
        updatedFields: Object.keys(changes)
      });

      res.status(200).json({
        success: true,
        message: 'Settings updated successfully!',
        userSettings,
        updatedFields: Object.keys(changes),
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      handleError(res, error, 'update settings', req.user?.id);
    }
  }

  /**
   * Delete user settings (reset to defaults)
   * DELETE /settings
   */
  async deleteUserSettings(req, res) {
    try {
      const userId = req.user.id;
      const user = await this.getUserById(userId);

      // Store old profile image for deletion
      const oldProfileImage = user.profileImage;

      // Reset user settings to defaults
      const resetFields = {
        fullName: '',
        phoneNumber: '',
        language: 'English',
        profileImage: null,
        bio: 'No bio provided yet.',
        tradingExperience: 'Beginner',
        preferredMarkets: ['Stocks']
      };

      Object.assign(user, resetFields);
      await user.save();

      // Delete old profile image
      if (oldProfileImage) {
        await deleteUploadedFile(oldProfileImage);
      }

      logUserSettingsOperation('delete', userId, resetFields);

      console.log('✅ User settings deleted successfully:', { userId });

      res.status(200).json({
        success: true,
        message: 'User settings deleted successfully!',
        userSettings: formatUserSettings(user),
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      handleError(res, error, 'delete settings', req.user?.id);
    }
  }

  /**
   * Delete profile image
   * DELETE /profile-image
   */
  async deleteProfileImage(req, res) {
    try {
      const userId = req.user.id;
      const user = await this.getUserById(userId);

      if (!user.profileImage) {
        return res.status(404).json({
          success: false,
          error: 'No profile image found',
          code: 'NO_PROFILE_IMAGE'
        });
      }

      const oldProfileImage = user.profileImage;
      user.profileImage = null;
      await user.save();

      // Delete the file
      const deleted = await deleteUploadedFile(oldProfileImage);

      logUserSettingsOperation('delete profile image', userId);

      console.log('✅ Profile image deleted successfully:', {
        userId,
        filename: oldProfileImage,
        fileDeleted: deleted
      });

      res.status(200).json({
        success: true,
        message: 'Profile image deleted successfully!',
        userSettings: formatUserSettings(user),
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      handleError(res, error, 'delete profile image', req.user?.id);
    }
  }

  /**
   * Get notification settings
   * GET /notifications
   */
  async getNotificationSettings(req, res) {
    try {
      const userId = req.user.id;
      const user = await this.getUserById(userId);

      const notificationSettings = formatNotificationSettings(user);

      console.log('✅ Notification settings fetched:', { userId });

      res.status(200).json({
        success: true,
        ...notificationSettings,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      handleError(res, error, 'fetch notification settings', req.user?.id);
    }
  }

  /**
   * Update notification settings
   * PUT /notifications
   */
  async updateNotificationSettings(req, res) {
    try {
      const userId = req.user.id;
      const user = await this.getUserById(userId);

      const changes = {};

      // Update main notifications toggle
      if (req.body.notifications !== undefined) {
        if (typeof req.body.notifications === 'boolean') {
          changes.notifications = req.body.notifications;
        } else if (req.body.notifications === 'true') {
          changes.notifications = true;
        } else if (req.body.notifications === 'false') {
          changes.notifications = false;
        } else {
          return res.status(400).json({
            success: false,
            error: 'Notifications must be a boolean value',
            code: 'INVALID_NOTIFICATIONS_VALUE'
          });
        }
      }

      // Update notification preferences
      if (req.body.notificationPreferences) {
        const preferencesValidation = validateNotificationPreferences(req.body.notificationPreferences);
        
        if (!preferencesValidation.isValid) {
          return res.status(400).json({
            success: false,
            error: 'Invalid notification preferences',
            errors: preferencesValidation.errors,
            code: 'INVALID_NOTIFICATION_PREFERENCES'
          });
        }

        changes.notificationPreferences = {
          ...user.notificationPreferences || {},
          ...preferencesValidation.sanitized
        };
      }

      // Apply changes
      Object.assign(user, changes);
      await user.save();

      const notificationSettings = formatNotificationSettings(user);

      logUserSettingsOperation('update notifications', userId, changes);

      console.log('✅ Notification settings updated:', {
        userId,
        updatedFields: Object.keys(changes)
      });

      res.status(200).json({
        success: true,
        message: 'Notification settings updated successfully!',
        ...notificationSettings,
        updatedFields: Object.keys(changes),
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      handleError(res, error, 'update notification settings', req.user?.id);
    }
  }

  /**
   * Get user profile summary (for testing)
   * GET /profile-summary
   */
  async getProfileSummary(req, res) {
    try {
      const userId = req.user.id;
      const user = await this.getUserById(userId);

      const summary = {
        id: user._id,
        fullName: user.fullName || 'Not set',
        email: user.email,
        hasProfileImage: !!user.profileImage,
        notificationsEnabled: user.notifications !== false,
        tradingExperience: user.tradingExperience || 'Beginner',
        preferredMarketsCount: user.preferredMarkets?.length || 0,
        accountAge: user.createdAt ? Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)) : 0
      };

      res.status(200).json({
        success: true,
        profileSummary: summary,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      handleError(res, error, 'fetch profile summary', req.user?.id);
    }
  }
}

module.exports = new UserSettingsController();
