import api from './api';

const settingsService = {
  // Save user settings
  saveSettings: async (settings) => {
    try {
      const response = await api.put('/user/settings', settings);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error saving settings:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to save settings' 
      };
    }
  },

  // Get user settings
  getSettings: async () => {
    try {
      const response = await api.get('/user/settings');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error fetching settings:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to fetch settings' 
      };
    }
  },

  // Enable 2FA
  enable2FA: async () => {
    try {
      const response = await api.post('/auth/2fa/enable');
      return { 
        success: true, 
        qrCodeUrl: response.data.qrCodeUrl,
        secretKey: response.data.secretKey 
      };
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to enable 2FA' 
      };
    }
  },

  // Verify 2FA setup
  verify2FA: async (code) => {
    try {
      const response = await api.post('/auth/2fa/verify', { code });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Invalid verification code' 
      };
    }
  },

  // Disable 2FA
  disable2FA: async () => {
    try {
      const response = await api.post('/auth/2fa/disable');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to disable 2FA' 
      };
    }
  },

  // Update password
  updatePassword: async (currentPassword, newPassword) => {
    try {
      const response = await api.put('/user/password', {
        currentPassword,
        newPassword
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error updating password:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to update password' 
      };
    }
  },

  // Update notification preferences
  updateNotifications: async (notifications) => {
    try {
      const response = await api.put('/user/notifications', notifications);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error updating notifications:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to update notifications' 
      };
    }
  }
};

export default settingsService;