import axios from 'axios';
import Pusher from 'pusher-js';

/**
 * TradeBro Notification Service
 * Handles all notification-related API calls, real-time updates, and state management
 */

class NotificationService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
    this.pusher = null;
    this.channel = null;
    this.listeners = new Set();
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  /**
   * Initialize Pusher connection for real-time notifications
   */
  async initializePusher(userId) {
    try {
      // Check if Pusher key is available
      const pusherKey = import.meta.env.VITE_PUSHER_KEY;
      if (!pusherKey) {
        console.warn('Pusher key not configured, notifications will work in polling mode');
        return;
      }

      if (this.pusher) {
        this.disconnectPusher();
      }

      this.pusher = new Pusher(pusherKey, {
        cluster: import.meta.env.VITE_PUSHER_CLUSTER || 'ap2',
        encrypted: true,
        authEndpoint: `${this.baseURL}/pusher/auth`,
        auth: {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      });

      // Subscribe to user-specific channel
      this.channel = this.pusher.subscribe(`user-${userId}`);
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Handle connection events
      this.pusher.connection.bind('connected', () => {
        console.log('✅ Pusher connected for notifications');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.notifyListeners('connection', { status: 'connected' });
      });

      this.pusher.connection.bind('disconnected', () => {
        console.log('❌ Pusher disconnected');
        this.isConnected = false;
        this.notifyListeners('connection', { status: 'disconnected' });
        this.handleReconnection(userId);
      });

      this.pusher.connection.bind('error', (error) => {
        console.error('❌ Pusher connection error:', error);
        this.notifyListeners('connection', { status: 'error', error });
      });

    } catch (error) {
      console.error('Failed to initialize Pusher:', error);
      throw error;
    }
  }

  /**
   * Set up Pusher event listeners for notifications
   */
  setupEventListeners() {
    if (!this.channel) return;

    // New notification received
    this.channel.bind('notification', (data) => {
      console.log('📢 New notification received:', data);
      this.notifyListeners('notification', data);
    });

    // Notification marked as read
    this.channel.bind('notification-update', (data) => {
      console.log('📝 Notification updated:', data);
      this.notifyListeners('notification-update', data);
    });

    // All notifications marked as read
    this.channel.bind('notifications-read-all', (data) => {
      console.log('📝 All notifications marked as read:', data);
      this.notifyListeners('notifications-read-all', data);
    });
  }

  /**
   * Handle Pusher reconnection with exponential backoff
   */
  async handleReconnection(userId) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.initializePusher(userId);
    }, delay);
  }

  /**
   * Disconnect Pusher
   */
  disconnectPusher() {
    if (this.channel) {
      this.channel.unbind_all();
      this.pusher.unsubscribe(this.channel.name);
    }
    
    if (this.pusher) {
      this.pusher.disconnect();
    }
    
    this.pusher = null;
    this.channel = null;
    this.isConnected = false;
  }

  /**
   * Add event listener for notification events
   */
  addEventListener(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of events
   */
  notifyListeners(event, data) {
    this.listeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });
  }

  /**
   * Get authentication headers
   */
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Fetch all notifications with pagination
   */
  async getNotifications(page = 1, limit = 10, sort = '-createdAt') {
    try {
      const response = await axios.get(`${this.baseURL}/notifications`, {
        params: { page, limit, sort },
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount() {
    try {
      const response = await axios.get(`${this.baseURL}/notifications/unread-count`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId) {
    try {
      const response = await axios.put(
        `${this.baseURL}/notifications/${notificationId}/read`,
        {},
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    try {
      const response = await axios.put(
        `${this.baseURL}/notifications/read-all`,
        {},
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId) {
    try {
      const response = await axios.delete(
        `${this.baseURL}/notifications/${notificationId}`,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to delete notification:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Create a new notification (for testing purposes)
   */
  async createNotification(notificationData) {
    try {
      const response = await axios.post(
        `${this.baseURL}/notifications`,
        notificationData,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to create notification:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Handle API errors consistently
   */
  handleError(error) {
    if (error.response) {
      // Server responded with error status
      return {
        message: error.response.data?.message || 'Server error occurred',
        status: error.response.status,
        data: error.response.data
      };
    } else if (error.request) {
      // Request made but no response received
      return {
        message: 'Network error - please check your connection',
        status: 0,
        data: null
      };
    } else {
      // Something else happened
      return {
        message: error.message || 'An unexpected error occurred',
        status: -1,
        data: null
      };
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      pusherState: this.pusher?.connection?.state || 'disconnected'
    };
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;
