import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import NotificationPopup from '../components/NotificationPopup';
import axios from 'axios';
import { useAuth } from './AuthContext';
import API_ENDPOINTS from '../config/apiConfig';

// Utility function to handle API errors gracefully
const safeApiCall = async (apiCall) => {
  try {
    return await apiCall();
  } catch (error) {
    // Log the error for debugging
    console.error('API call failed:', error);

    // Check if it's a 404 error
    if (error.response && error.response.status === 404) {
      console.warn('API endpoint not found (404)');
    }

    // Rethrow the error for the caller to handle
    throw error;
  }
};

// Create the notification context
const NotificationContext = createContext();

// Custom hook to use the notification context
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

// Notification provider component
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [popupNotifications, setPopupNotifications] = useState([]);
  const { isAuthenticated, user } = useAuth();

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const response = await safeApiCall(() =>
        axios.get(API_ENDPOINTS.NOTIFICATIONS.ALL, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`
          }
        })
      );

      if (response.data && response.data.success) {
        setNotifications(response.data.data.map(notification => ({
          ...notification,
          id: notification._id || notification.id
        })));
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);

      // Show a more specific error message for 404 errors
      if (error.response && error.response.status === 404) {
        console.warn('Notifications API endpoint not found. Using mock data instead.');
      }

      // Use mock data if API fails
      setNotifications([
        {
          id: '1',
          title: 'Welcome to TradeBro',
          message: 'Thank you for joining TradeBro. Start exploring the platform!',
          type: 'info',
          read: false,
          timestamp: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: '2',
          title: 'Market Update',
          message: 'The market has opened. Check the latest trends!',
          type: 'success',
          read: true,
          timestamp: new Date(Date.now() - 86400000).toISOString()
        }
      ]);
    }
  }, [isAuthenticated]);

  // Fetch notifications on mount and when auth state changes
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications, isAuthenticated]);

  // Add a new notification
  const addNotification = useCallback(async (notification) => {
    const newNotification = {
      id: notification.id || uuidv4(),
      title: notification.title || 'Notification',
      message: notification.message,
      type: notification.type || 'info',
      read: false,
      timestamp: notification.timestamp || new Date().toISOString()
    };

    // Add to state
    setNotifications(prev => [newNotification, ...prev]);

    // Show popup
    if (notification.showPopup !== false) {
      setPopupNotifications(prev => [...prev, newNotification]);
    }

    // Save to API if authenticated
    if (isAuthenticated) {
      try {
        await safeApiCall(() =>
          axios.post(API_ENDPOINTS.NOTIFICATIONS.CREATE, {
            title: newNotification.title,
            message: newNotification.message,
            type: newNotification.type
          }, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('authToken')}`
            }
          })
        );
      } catch (error) {
        console.error('Error saving notification:', error);
        // Notification is already added to UI, so no need to handle error further
      }
    }

    return newNotification.id;
  }, [isAuthenticated]);

  // Mark a notification as read
  const markAsRead = useCallback(async (id) => {
    // Update locally first for immediate UI feedback
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );

    // Update in API if authenticated
    if (isAuthenticated) {
      try {
        await safeApiCall(() =>
          axios.put(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id), {}, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('authToken')}`
            }
          })
        );
      } catch (error) {
        console.error('Error marking notification as read:', error);
        // Error is already handled by updating the UI first
      }
    }
  }, [isAuthenticated]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );

    // Update in API if authenticated
    if (isAuthenticated) {
      try {
        await safeApiCall(() =>
          axios.put(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ, {}, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('authToken')}`
            }
          })
        );
      } catch (error) {
        console.error('Error marking all notifications as read:', error);
        // UI is already updated, so user won't notice the error
      }
    }
  }, [isAuthenticated]);

  // Delete a notification
  const deleteNotification = useCallback(async (id) => {
    // Update UI immediately for better user experience
    setNotifications(prev =>
      prev.filter(notification => notification.id !== id)
    );

    // Delete from API if authenticated
    if (isAuthenticated) {
      try {
        await safeApiCall(() =>
          axios.delete(API_ENDPOINTS.NOTIFICATIONS.DELETE(id), {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('authToken')}`
            }
          })
        );
      } catch (error) {
        console.error('Error deleting notification:', error);
        // Show error in console but don't revert UI change to avoid confusion
        // The notification is already removed from the UI
      }
    }
  }, [isAuthenticated]);

  // Clear all notifications
  const clearAllNotifications = useCallback(async () => {
    // Get IDs of all notifications before clearing
    const notificationIds = notifications.map(notification => notification.id);

    // Update UI immediately
    setNotifications([]);

    // Clear in API if authenticated - delete each notification individually
    if (isAuthenticated && notificationIds.length > 0) {
      try {
        // Mark all as read first (this endpoint exists)
        await safeApiCall(() =>
          axios.put(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ, {}, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('authToken')}`
            }
          })
        );

        // Then delete each notification individually
        const deletePromises = notificationIds.map(id =>
          safeApiCall(() =>
            axios.delete(API_ENDPOINTS.NOTIFICATIONS.DELETE(id), {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('authToken')}`
              }
            })
          ).catch(err => {
            console.error(`Error deleting notification ${id}:`, err);
            // Continue with other deletions even if one fails
            return null;
          })
        );

        await Promise.all(deletePromises);
      } catch (error) {
        console.error('Error clearing all notifications:', error);
        // UI is already updated, so user won't notice the error
      }
    }
  }, [isAuthenticated, notifications]);

  // Remove popup notification
  const removePopupNotification = useCallback((id) => {
    setPopupNotifications(prev =>
      prev.filter(notification => notification.id !== id)
    );
  }, []);

  // Create convenience methods for different notification types
  const showInfo = useCallback((message, title = 'Information', showPopup = true) => {
    return addNotification({ title, message, type: 'info', showPopup });
  }, [addNotification]);

  const showSuccess = useCallback((message, title = 'Success', showPopup = true) => {
    return addNotification({ title, message, type: 'success', showPopup });
  }, [addNotification]);

  const showWarning = useCallback((message, title = 'Warning', showPopup = true) => {
    return addNotification({ title, message, type: 'warning', showPopup });
  }, [addNotification]);

  const showError = useCallback((message, title = 'Error', showPopup = true) => {
    return addNotification({ title, message, type: 'error', showPopup });
  }, [addNotification]);

  // Legacy method for backward compatibility
  const showNotification = useCallback((message, type = 'info') => {
    return addNotification({ message, type, showPopup: true });
  }, [addNotification]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications,
        showInfo,
        showSuccess,
        showWarning,
        showError,
        showNotification, // Legacy method
        fetchNotifications
      }}
    >
      {children}

      {/* Render popup notifications */}
      <div className="notification-popups-container">
        {popupNotifications.map((notification, index) => (
          <NotificationPopup
            key={notification.id}
            type={notification.type}
            title={notification.title}
            message={notification.message}
            duration={5000}
            onClose={() => removePopupNotification(notification.id)}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
