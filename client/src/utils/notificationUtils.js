import axios from 'axios';
import { API_ENDPOINTS } from '../config/apiConfig';

/**
 * Create a new notification
 * @param {Object} notification - Notification object
 * @param {string} notification.type - Notification type (alert, info, success, error)
 * @param {string} notification.title - Notification title
 * @param {string} notification.message - Notification message
 * @param {string} [notification.link] - Optional link to include in the notification
 * @returns {Promise<Object>} - Response from the server
 */
export const createNotification = async (notification) => {
  try {
    const response = await axios.post(API_ENDPOINTS.NOTIFICATIONS.CREATE, notification);
    return response.data;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Mark a notification as read
 * @param {string} id - Notification ID
 * @returns {Promise<Object>} - Response from the server
 */
export const markNotificationAsRead = async (id) => {
  try {
    const response = await axios.put(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id));
    return response.data;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read
 * @returns {Promise<Object>} - Response from the server
 */
export const markAllNotificationsAsRead = async () => {
  try {
    const response = await axios.put(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
    return response.data;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

/**
 * Delete a notification
 * @param {string} id - Notification ID
 * @returns {Promise<Object>} - Response from the server
 */
export const deleteNotification = async (id) => {
  try {
    const response = await axios.delete(API_ENDPOINTS.NOTIFICATIONS.DELETE(id));
    return response.data;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

/**
 * Get all notifications
 * @returns {Promise<Array>} - Array of notifications
 */
export const getNotifications = async () => {
  try {
    const response = await axios.get(API_ENDPOINTS.NOTIFICATIONS.ALL);
    return response.data.success ? response.data.data : [];
  } catch (error) {
    console.error('Error getting notifications:', error);
    return [];
  }
};

/**
 * Create a price alert notification
 * @param {string} symbol - Stock symbol
 * @param {number} price - Current price
 * @param {number} targetPrice - Target price
 * @param {string} [link] - Optional link to stock details
 * @returns {Promise<Object>} - Response from the server
 */
export const createPriceAlertNotification = async (symbol, price, targetPrice, link) => {
  const notification = {
    type: 'alert',
    title: `Price Alert: ${symbol}`,
    message: `${symbol} has ${price > targetPrice ? 'exceeded' : 'reached'} your target price of ₹${targetPrice.toFixed(2)}. Current price: ₹${price.toFixed(2)}.`,
    link
  };
  
  return createNotification(notification);
};

/**
 * Create an order execution notification
 * @param {string} type - Order type (BUY or SELL)
 * @param {number} quantity - Quantity of shares
 * @param {string} symbol - Stock symbol
 * @param {number} price - Execution price
 * @param {string} [link] - Optional link to order details
 * @returns {Promise<Object>} - Response from the server
 */
export const createOrderExecutionNotification = async (type, quantity, symbol, price, link) => {
  const notification = {
    type: 'success',
    title: `Order Executed: ${symbol}`,
    message: `Your ${type.toLowerCase()} order for ${quantity} shares of ${symbol} has been executed at ₹${price.toFixed(2)}.`,
    link
  };
  
  return createNotification(notification);
};

/**
 * Create a market update notification
 * @param {string} title - Update title
 * @param {string} message - Update message
 * @param {string} [link] - Optional link to more details
 * @returns {Promise<Object>} - Response from the server
 */
export const createMarketUpdateNotification = async (title, message, link) => {
  const notification = {
    type: 'info',
    title,
    message,
    link
  };
  
  return createNotification(notification);
};

export default {
  createNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getNotifications,
  createPriceAlertNotification,
  createOrderExecutionNotification,
  createMarketUpdateNotification
};
