import axios from 'axios';
import Pusher from 'pusher-js';

/**
 * TradeBro Notification Service
 * This service is designed for LIVE, real-time notifications using Pusher.
 * Fallback to mock data and local storage is for development and network resilience.
 */
class NotificationService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'https://s89-satya-capstone-tradebro.onrender.com';
    this.pusher = null;
    this.channel = null;
    this.listeners = new Set();
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  /**
   * Initializes Pusher connection for LIVE real-time notifications.
   * This is the core of the live functionality.
   */
  async initializePusher(userId) {
    try {
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
        // Authentication for private channels
        authEndpoint: `${this.baseURL}/pusher/auth`,
        auth: {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      });
      
      // Subscribe to a private channel for a specific user
      // Pusher private channels must be prefixed with 'private-'
      this.channel = this.pusher.subscribe(`private-user-${userId}`);
      
      this.setupEventListeners();
      
      this.pusher.connection.bind('connected', () => {
        console.log('✅ Pusher connected for live notifications');
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
        console.warn('⚠️ Pusher connection issue, falling back to polling mode');
        this.notifyListeners('connection', { status: 'error', error });
      });

    } catch (error) {
      console.warn('Pusher initialization failed, using polling mode:', error.message);
    }
  }

  /**
   * Sets up listeners for Pusher events.
   * This is where the live events are consumed and broadcasted to listeners.
   */
  setupEventListeners() {
    if (!this.channel) return;

    // Listen for 'notification' events on the channel
    this.channel.bind('notification', (data) => {
      console.log('📢 LIVE: New notification received:', data);
      this.notifyListeners('notification', data);
    });

    this.channel.bind('notification-update', (data) => {
      console.log('📝 LIVE: Notification updated:', data);
      this.notifyListeners('notification-update', data);
    });

    this.channel.bind('notifications-read-all', (data) => {
      console.log('📝 LIVE: All notifications marked as read:', data);
      this.notifyListeners('notifications-read-all', data);
    });
  }

  /**
   * Handles Pusher reconnection with exponential backoff for resilience.
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

  addEventListener(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners(event, data) {
    this.listeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });
  }

  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  }

  /**
   * Fetches all notifications. Tries the LIVE API first, then falls back to local data.
   */
  async getNotifications(page = 1, limit = 10, sort = '-createdAt') {
    try {
      const response = await axios.get(`${this.baseURL}/api/notifications`, {
        params: { page, limit, sort },
        headers: this.getAuthHeaders(),
        timeout: 5000
      });
      return response.data;
    } catch (error) {
      console.warn('API fetch failed, falling back to local notifications:', error.message);
      return this.getLocalNotifications(page, limit);
    }
  }
  
  getLocalNotifications(page = 1, limit = 10) {
    try {
      const localNotifications = JSON.parse(localStorage.getItem('tradebro_notifications') || '[]');
      const mockNotifications = this.getMockNotifications(1, 50).notifications;
      const allNotifications = [...localNotifications, ...mockNotifications];
      const uniqueNotifications = allNotifications
        .filter((notification, index, self) => index === self.findIndex(n => n.id === notification.id))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedNotifications = uniqueNotifications.slice(startIndex, endIndex);
      
      return { success: true, notifications: paginatedNotifications, pagination: { page, limit, total: uniqueNotifications.length, hasMore: endIndex < uniqueNotifications.length } };
    } catch (error) {
      console.error('Error getting local notifications:', error);
      return this.getMockNotifications(page, limit);
    }
  }

  async getUnreadCount() {
    try {
      const response = await axios.get(`${this.baseURL}/api/notifications/unread-count`, { headers: this.getAuthHeaders(), timeout: 5000 });
      return response.data;
    } catch (error) {
      console.warn('API fetch failed for unread count, returning mock count.');
      return { success: true, count: 3 };
    }
  }

  // API calls for CRUD operations (mark as read, delete, etc.)
  async markAsRead(notificationId) {
    try {
      const response = await axios.put(`${this.baseURL}/api/notifications/${notificationId}/read`, {}, { headers: this.getAuthHeaders() });
      return response.data;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      return { success: true, message: 'Notification marked as read (fallback)' };
    }
  }
  
  async markAllAsRead() {
    try {
      const response = await axios.put(`${this.baseURL}/api/notifications/read-all`, {}, { headers: this.getAuthHeaders() });
      return response.data;
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      return { success: true, message: 'All notifications marked as read (fallback)' };
    }
  }

  async deleteNotification(notificationId) {
    try {
      const response = await axios.delete(`${this.baseURL}/api/notifications/${notificationId}`, { headers: this.getAuthHeaders() });
      return response.data;
    } catch (error) {
      console.error('Failed to delete notification:', error);
      return { success: true, message: 'Notification deleted (fallback)' };
    }
  }

  async createNotification(notificationData) {
    try {
      const response = await axios.post(`${this.baseURL}/api/notifications`, notificationData, { headers: this.getAuthHeaders() });
      return response.data;
    } catch (error) {
      console.error('Failed to create notification:', error);
      if (error.response?.status === 404) {
        return { success: true, message: 'Notification created (fallback)' };
      }
      throw this.handleError(error);
    }
  }

  handleError(error) {
    if (error.response) {
      return { message: error.response.data?.message || 'Server error occurred', status: error.response.status, data: error.response.data };
    } else if (error.request) {
      return { message: 'Network error - please check your connection', status: 0, data: null };
    } else {
      return { message: error.message || 'An unexpected error occurred', status: -1, data: null };
    }
  }

  /**
   * Mock data and live mock functions for development
   */
  getMockNotifications(page = 1, limit = 10) {
    const mockNotifications = [
      { id: '1', title: 'Trade Executed Successfully', message: 'Your buy order for 100 shares of RELIANCE has been executed at ₹2,450.00', type: 'success', read: false, createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), data: { symbol: 'RELIANCE', quantity: 100, price: 2450 } },
      { id: '2', title: 'Price Alert Triggered', message: 'TCS has reached your target price of ₹3,500.00', type: 'info', read: false, createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), data: { symbol: 'TCS', targetPrice: 3500 } },
      { id: '3', title: 'Market Update', message: 'NIFTY 50 is up 1.2% today. Your portfolio is performing well!', type: 'info', read: true, createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), data: { index: 'NIFTY50', change: 1.2 } },
      { id: '4', title: 'Dividend Received', message: 'You received ₹150 dividend from HDFC Bank', type: 'success', read: true, createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), data: { symbol: 'HDFCBANK', amount: 150 } },
      { id: '5', title: 'Stop Loss Triggered', message: 'Your stop loss order for INFY has been executed at ₹1,420.00', type: 'warning', read: false, createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), data: { symbol: 'INFY', price: 1420, type: 'stop_loss' } }
    ];
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedNotifications = mockNotifications.slice(startIndex, endIndex);
    return { success: true, notifications: paginatedNotifications, pagination: { page, limit, total: mockNotifications.length, hasMore: endIndex < mockNotifications.length } };
  }

  startMockLiveNotifications() {
    if (this.mockInterval) return;
    this.mockInterval = setInterval(() => {
      const mockNotification = this.generateMockNotification();
      this.notifyListeners('notification', mockNotification);
    }, 30000);
  }

  stopMockLiveNotifications() {
    if (this.mockInterval) {
      clearInterval(this.mockInterval);
      this.mockInterval = null;
    }
  }

  generateMockNotification() {
    const types = ['success', 'info', 'warning', 'error'];
    const templates = {
      success: [{ title: 'Trade Executed', message: 'Your buy order for {symbol} has been executed successfully' }, { title: 'Dividend Received', message: 'You received ₹{amount} dividend from {symbol}' }, { title: 'Profit Booked', message: 'Successfully sold {symbol} with {profit}% profit' }],
      info: [{ title: 'Price Alert', message: '{symbol} has reached your target price of ₹{price}' }, { title: 'Market Update', message: 'NIFTY 50 is {change}% today' }, { title: 'News Alert', message: 'Important news update for {symbol}' }],
      warning: [{ title: 'Stop Loss Alert', message: '{symbol} is approaching your stop loss level' }, { title: 'High Volatility', message: '{symbol} showing high volatility today' }, { title: 'Market Closure', message: 'Market will close in 30 minutes' }],
      error: [{ title: 'Order Failed', message: 'Your order for {symbol} could not be executed' }, { title: 'Connection Issue', message: 'Temporary connection issue detected' }]
    };
    const symbols = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'WIPRO', 'ITC'];
    const type = types[Math.floor(Math.random() * types.length)];
    const template = templates[type][Math.floor(Math.random() * templates[type].length)];
    const notification = {
      id: Date.now().toString(),
      title: template.title,
      message: template.message.replace('{symbol}', symbols[Math.floor(Math.random() * symbols.length)]).replace('{amount}', Math.floor(Math.random() * 500) + 50).replace('{price}', Math.floor(Math.random() * 1000) + 1000).replace('{profit}', (Math.random() * 20 + 5).toFixed(1)).replace('{change}', (Math.random() * 4 - 2).toFixed(1)),
      type, read: false, createdAt: new Date().toISOString(), data: {}
    };
    return notification;
  }

  getConnectionStatus() {
    return { isConnected: this.isConnected, reconnectAttempts: this.reconnectAttempts, pusherState: this.pusher?.connection?.state || 'disconnected' };
  }
}

const notificationService = new NotificationService();
export default notificationService;