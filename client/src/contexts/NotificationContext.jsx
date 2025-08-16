import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import notificationService from '../services/notificationService';
import { useAuth } from './AuthContext';

/**
 * TradeBro Notification Context
 * Manages notification state, real-time updates, and user interactions
 */

// Initial state
const initialState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  connectionStatus: 'disconnected',
  filters: {
    type: 'all', // all, info, success, warning, error, alert
    read: 'all', // all, read, unread
    dateRange: 'all' // all, today, week, month
  },
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    hasMore: false
  }
};

// Action types
const ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_NOTIFICATIONS: 'SET_NOTIFICATIONS',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  UPDATE_NOTIFICATION: 'UPDATE_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  SET_UNREAD_COUNT: 'SET_UNREAD_COUNT',
  MARK_AS_READ: 'MARK_AS_READ',
  MARK_ALL_AS_READ: 'MARK_ALL_AS_READ',
  SET_CONNECTION_STATUS: 'SET_CONNECTION_STATUS',
  SET_FILTERS: 'SET_FILTERS',
  SET_PAGINATION: 'SET_PAGINATION',
  CLEAR_ALL: 'CLEAR_ALL'
};

// Reducer function
function notificationReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };

    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false };

    case ACTIONS.SET_NOTIFICATIONS:
      return {
        ...state,
        notifications: action.payload.notifications || [],
        pagination: {
          ...state.pagination,
          ...action.payload.pagination
        },
        loading: false,
        error: null
      };

    case ACTIONS.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: state.unreadCount + (action.payload.read ? 0 : 1)
      };

    case ACTIONS.UPDATE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification.id === action.payload.id
            ? { ...notification, ...action.payload }
            : notification
        )
      };

    case ACTIONS.REMOVE_NOTIFICATION:
      const removedNotification = state.notifications.find(n => n.id === action.payload);
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
        unreadCount: removedNotification && !removedNotification.read 
          ? state.unreadCount - 1 
          : state.unreadCount
      };

    case ACTIONS.SET_UNREAD_COUNT:
      return { ...state, unreadCount: action.payload };

    case ACTIONS.MARK_AS_READ:
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification.id === action.payload
            ? { ...notification, read: true, readAt: new Date().toISOString() }
            : notification
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      };

    case ACTIONS.MARK_ALL_AS_READ:
      return {
        ...state,
        notifications: state.notifications.map(notification => ({
          ...notification,
          read: true,
          readAt: new Date().toISOString()
        })),
        unreadCount: 0
      };

    case ACTIONS.SET_CONNECTION_STATUS:
      return { ...state, connectionStatus: action.payload };

    case ACTIONS.SET_FILTERS:
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
        pagination: { ...state.pagination, page: 1 } // Reset to first page when filtering
      };

    case ACTIONS.SET_PAGINATION:
      return {
        ...state,
        pagination: { ...state.pagination, ...action.payload }
      };

    case ACTIONS.CLEAR_ALL:
      return {
        ...state,
        notifications: [],
        unreadCount: 0
      };

    default:
      return state;
  }
}

// Create context
const NotificationContext = createContext();

// Provider component
export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const { user, isAuthenticated } = useAuth();

  // Initialize notification service when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      initializeNotifications();
    } else {
      cleanupNotifications();
    }

    return () => cleanupNotifications();
  }, [isAuthenticated, user?.id]);

  // Initialize notifications and real-time connection
  const initializeNotifications = useCallback(async () => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });

      // Try to initialize Pusher connection (graceful fallback if not available)
      try {
        await notificationService.initializePusher(user.id);

        // Set up event listeners only if Pusher is available
        const removeListener = notificationService.addEventListener(handleNotificationEvent);

        dispatch({ type: ACTIONS.SET_CONNECTION_STATUS, payload: 'connected' });
      } catch (pusherError) {
        console.warn('Pusher initialization failed, using polling mode:', pusherError.message);
        dispatch({ type: ACTIONS.SET_CONNECTION_STATUS, payload: 'polling' });
      }

      // Fetch initial notifications (works regardless of Pusher)
      await fetchNotifications();

      // Fetch unread count (works regardless of Pusher)
      await fetchUnreadCount();

      // Start mock live notifications for development
      notificationService.startMockLiveNotifications();

      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  }, [user?.id]);

  // Handle notification events from service
  const handleNotificationEvent = useCallback((event, data) => {
    switch (event) {
      case 'notification':
        dispatch({ type: ACTIONS.ADD_NOTIFICATION, payload: data });
        showToastNotification(data);
        break;

      case 'notification-update':
        dispatch({ type: ACTIONS.UPDATE_NOTIFICATION, payload: data });
        break;

      case 'notifications-read-all':
        dispatch({ type: ACTIONS.MARK_ALL_AS_READ });
        break;

      case 'connection':
        dispatch({ type: ACTIONS.SET_CONNECTION_STATUS, payload: data.status });
        break;

      default:
        console.log('Unknown notification event:', event, data);
    }
  }, []);

  // Show toast notification for new notifications
  const showToastNotification = useCallback((notification) => {
    const toastOptions = {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    };

    switch (notification.type) {
      case 'success':
        toast.success(notification.message, toastOptions);
        break;
      case 'error':
        toast.error(notification.message, toastOptions);
        break;
      case 'warning':
        toast.warning(notification.message, toastOptions);
        break;
      case 'info':
      case 'alert':
      default:
        toast.info(notification.message, toastOptions);
        break;
    }
  }, []);

  // Cleanup notifications
  const cleanupNotifications = useCallback(() => {
    notificationService.stopMockLiveNotifications();
    notificationService.disconnectPusher();
    dispatch({ type: ACTIONS.CLEAR_ALL });
    dispatch({ type: ACTIONS.SET_CONNECTION_STATUS, payload: 'disconnected' });
  }, []);

  // Fetch notifications with current filters and pagination
  const fetchNotifications = useCallback(async (page = 1) => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      
      const response = await notificationService.getNotifications(
        page,
        state.pagination.limit,
        '-createdAt'
      );

      if (response.success) {
        dispatch({
          type: ACTIONS.SET_NOTIFICATIONS,
          payload: {
            notifications: page === 1 ? response.data : [...state.notifications, ...response.data],
            pagination: {
              page: response.pagination.page,
              total: response.pagination.total,
              hasMore: response.pagination.hasMore
            }
          }
        });
      }
    } catch (error) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
    }
  }, [state.pagination.limit, state.notifications]);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await notificationService.getUnreadCount();
      if (response.success) {
        dispatch({ type: ACTIONS.SET_UNREAD_COUNT, payload: response.count });
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      dispatch({ type: ACTIONS.MARK_AS_READ, payload: notificationId });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      dispatch({ type: ACTIONS.MARK_ALL_AS_READ });
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      dispatch({ type: ACTIONS.REMOVE_NOTIFICATION, payload: notificationId });
    } catch (error) {
      console.error('Failed to delete notification:', error);
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
    }
  }, []);

  // Set filters
  const setFilters = useCallback((filters) => {
    dispatch({ type: ACTIONS.SET_FILTERS, payload: filters });
  }, []);

  // Load more notifications
  const loadMore = useCallback(() => {
    if (state.pagination.hasMore && !state.loading) {
      fetchNotifications(state.pagination.page + 1);
    }
  }, [state.pagination.hasMore, state.loading, state.pagination.page, fetchNotifications]);

  // Context value
  const value = {
    // State
    ...state,
    
    // Actions
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    setFilters,
    loadMore,
    
    // Utilities
    connectionStatus: notificationService.getConnectionStatus()
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use notification context
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
