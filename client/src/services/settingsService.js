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

  // Send 2FA code via email
  send2FACode: async (email) => {
    try {
      const response = await api.post('/auth/send-2fa-code', { email });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error sending 2FA code:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to send verification code' 
      };
    }
  },

  // Verify 2FA code from email
  verify2FACode: async (code) => {
    try {
      const response = await api.post('/auth/verify-2fa-code', { code });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error verifying 2FA code:', error);
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