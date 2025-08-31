import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import notificationService from '../services/notificationService';
import { useAuth } from './AuthContext';
import Pusher from 'pusher-js';
import { PUSHER_ENABLED, pusherConfig } from '../utils/pusherConfig';

const initialState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  connectionStatus: 'disconnected',
  filters: {
    type: 'all',
    read: 'all',
    dateRange: 'all'
  },
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    hasMore: false
  }
};

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

function notificationReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };

    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false };

    case ACTIONS.SET_NOTIFICATIONS:
      const newNotifications = action.payload.page === 1
        ? action.payload.notifications
        : [...state.notifications, ...action.payload.notifications];

      return {
        ...state,
        notifications: newNotifications || [],
        pagination: { ...state.pagination, ...action.payload.pagination },
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
          (notification._id || notification.id) === (action.payload._id || action.payload.id)
            ? { ...notification, ...action.payload }
            : notification
        )
      };

    case ACTIONS.REMOVE_NOTIFICATION:
      const removedNotification = state.notifications.find(n => (n._id || n.id) === action.payload);
      return {
        ...state,
        notifications: state.notifications.filter(n => (n._id || n.id) !== action.payload),
        unreadCount: removedNotification && !removedNotification.read
          ? Math.max(0, state.unreadCount - 1)
          : state.unreadCount
      };

    case ACTIONS.SET_UNREAD_COUNT:
      return { ...state, unreadCount: action.payload };

    case ACTIONS.MARK_AS_READ:
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          (notification._id || notification.id) === action.payload
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
        pagination: { ...state.pagination, page: 1 }
      };

    case ACTIONS.SET_PAGINATION:
      return {
        ...state,
        pagination: { ...state.pagination, ...action.payload }
      };

    case ACTIONS.CLEAR_ALL:
      return { ...initialState };

    default:
      return state;
  }
}

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const { user, isAuthenticated } = useAuth();

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

  const fetchNotifications = useCallback(async (page = 1) => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      const response = await notificationService.getNotifications(page, state.pagination.limit, '-createdAt');
      if (response.success) {
        dispatch({
          type: ACTIONS.SET_NOTIFICATIONS,
          payload: {
            page,
            notifications: response.notifications,
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
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  }, [state.pagination.limit]);

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

  const markAsRead = useCallback(async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      dispatch({ type: ACTIONS.MARK_AS_READ, payload: notificationId });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      dispatch({ type: ACTIONS.MARK_ALL_AS_READ });
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      dispatch({ type: ACTIONS.REMOVE_NOTIFICATION, payload: notificationId });
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }, []);

  const setFilters = useCallback((filters) => {
    dispatch({ type: ACTIONS.SET_FILTERS, payload: filters });
  }, []);

  const loadMore = useCallback(() => {
    if (state.pagination.hasMore && !state.loading) {
      fetchNotifications(state.pagination.page + 1);
    }
  }, [state.pagination.hasMore, state.loading, state.pagination.page, fetchNotifications]);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchUnreadCount();
      fetchNotifications();
      
      // Setup Pusher connection for real-time notifications
      if (PUSHER_ENABLED && pusherConfig.key) {
        const pusher = new Pusher(pusherConfig.key, {
          cluster: pusherConfig.cluster,
          encrypted: pusherConfig.encrypted,
          authEndpoint: `${import.meta.env.VITE_API_URL}/pusher/auth`,
          auth: {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        });
        
        const channel = pusher.subscribe(`private-user-${user.id}`);
        
        channel.bind('pusher:subscription_succeeded', () => {
          dispatch({ type: ACTIONS.SET_CONNECTION_STATUS, payload: 'connected' });
        });
        
        channel.bind('pusher:subscription_error', () => {
          dispatch({ type: ACTIONS.SET_CONNECTION_STATUS, payload: 'error' });
        });
        
        channel.bind('notification', (data) => {
          handleNotificationEvent('notification', data);
        });
        
        channel.bind('notification-update', (data) => {
          handleNotificationEvent('notification-update', data);
        });
        
        channel.bind('notifications-read-all', (data) => {
          handleNotificationEvent('notifications-read-all', data);
        });
        
        pusher.connection.bind('connected', () => {
          dispatch({ type: ACTIONS.SET_CONNECTION_STATUS, payload: 'connected' });
        });
        
        pusher.connection.bind('disconnected', () => {
          dispatch({ type: ACTIONS.SET_CONNECTION_STATUS, payload: 'disconnected' });
        });
        
        return () => {
          channel.unbind_all();
          pusher.unsubscribe(`private-user-${user.id}`);
          pusher.disconnect();
        };
      }
    }
  }, [isAuthenticated, user?.id, fetchNotifications, fetchUnreadCount, handleNotificationEvent]);

  const value = {
    ...state,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    setFilters,
    loadMore,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;