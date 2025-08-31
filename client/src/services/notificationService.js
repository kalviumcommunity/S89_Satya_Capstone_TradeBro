/**
 * Notification Service
 * Handles all notification-related API calls
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://s89-satya-capstone-tradebro.onrender.com';

class NotificationService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/api/notifications`;
  }

  /**
   * Get authorization headers
   */
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Get paginated notifications
   */
  async getNotifications(page = 1, limit = 10, sort = '-createdAt') {
    try {
      const response = await axios.get(`${this.baseURL}`, {
        params: { page, limit, sort },
        headers: this.getAuthHeaders()
      });

      return {
        success: true,
        notifications: response.data.data || [],
        pagination: response.data.pagination || {
          page: 1,
          total: 0,
          hasMore: false,
          totalPages: 0,
          limit: 10
        }
      };
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        notifications: [],
        pagination: { page: 1, total: 0, hasMore: false }
      };
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount() {
    try {
      const response = await axios.get(`${this.baseURL}/unread-count`, {
        headers: this.getAuthHeaders()
      });

      return {
        success: true,
        count: response.data.count || 0
      };
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
      return {
        success: false,
        count: 0,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId) {
    try {
      const response = await axios.put(`${this.baseURL}/${notificationId}/read`, {}, {
        headers: this.getAuthHeaders()
      });

      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    try {
      const response = await axios.put(`${this.baseURL}/read-all`, {}, {
        headers: this.getAuthHeaders()
      });

      return {
        success: true,
        count: response.data.count,
        message: response.data.message
      };
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId) {
    try {
      const response = await axios.delete(`${this.baseURL}/${notificationId}`, {
        headers: this.getAuthHeaders()
      });

      return {
        success: true,
        message: response.data.message
      };
    } catch (error) {
      console.error('Failed to delete notification:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Create a new notification (for testing or user-generated notifications)
   */
  async createNotification(notificationData) {
    try {
      const response = await axios.post(`${this.baseURL}`, notificationData, {
        headers: this.getAuthHeaders()
      });

      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Failed to create notification:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Get notification by ID
   */
  async getNotificationById(notificationId) {
    try {
      const response = await axios.get(`${this.baseURL}/${notificationId}`, {
        headers: this.getAuthHeaders()
      });

      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Failed to fetch notification:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Filter notifications by type, read status, etc.
   */
  async getFilteredNotifications(filters = {}, page = 1, limit = 10) {
    try {
      const params = {
        page,
        limit,
        sort: '-createdAt',
        ...filters
      };

      const response = await axios.get(`${this.baseURL}`, {
        params,
        headers: this.getAuthHeaders()
      });

      return {
        success: true,
        notifications: response.data.data || [],
        pagination: response.data.pagination || {
          page: 1,
          total: 0,
          hasMore: false
        }
      };
    } catch (error) {
      console.error('Failed to fetch filtered notifications:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        notifications: [],
        pagination: { page: 1, total: 0, hasMore: false }
      };
    }
  }

  /**
   * Batch operations
   */
  async batchMarkAsRead(notificationIds) {
    try {
      const promises = notificationIds.map(id => this.markAsRead(id));
      const results = await Promise.allSettled(promises);
      
      const successful = results.filter(result => result.status === 'fulfilled' && result.value.success);
      const failed = results.filter(result => result.status === 'rejected' || !result.value.success);

      return {
        success: failed.length === 0,
        successCount: successful.length,
        failedCount: failed.length,
        message: `${successful.length} notifications marked as read${failed.length > 0 ? `, ${failed.length} failed` : ''}`
      };
    } catch (error) {
      console.error('Failed to batch mark as read:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async batchDelete(notificationIds) {
    try {
      const promises = notificationIds.map(id => this.deleteNotification(id));
      const results = await Promise.allSettled(promises);
      
      const successful = results.filter(result => result.status === 'fulfilled' && result.value.success);
      const failed = results.filter(result => result.status === 'rejected' || !result.value.success);

      return {
        success: failed.length === 0,
        successCount: successful.length,
        failedCount: failed.length,
        message: `${successful.length} notifications deleted${failed.length > 0 ? `, ${failed.length} failed` : ''}`
      };
    } catch (error) {
      console.error('Failed to batch delete:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Utility methods
   */
  formatNotificationTime(timestamp) {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return notificationTime.toLocaleDateString();
  }

  getNotificationIcon(type) {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
      alert: '🚨'
    };
    return icons[type] || icons.info;
  }

  getNotificationColor(type) {
    const colors = {
      success: '#10B981',
      error: '#EF4444',
      warning: '#F59E0B',
      info: '#3B82F6',
      alert: '#F97316'
    };
    return colors[type] || colors.info;
  }
}

// Create and export a singleton instance
const notificationService = new NotificationService();
export default notificationService;