import { createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import API_ENDPOINTS from '../../config/apiConfig';

const initialState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    fetchNotificationsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchNotificationsSuccess: (state, action) => {
      state.notifications = action.payload;
      state.unreadCount = action.payload.filter(notification => !notification.read).length;
      state.loading = false;
      state.error = null;
    },
    fetchNotificationsFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.read) {
        state.unreadCount += 1;
      }
    },
    markAsRead: (state, action) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification && !notification.read) {
        notification.read = true;
        state.unreadCount -= 1;
      }
    },
    markAllAsRead: (state) => {
      state.notifications.forEach(notification => {
        notification.read = true;
      });
      state.unreadCount = 0;
    },
    deleteNotification: (state, action) => {
      const index = state.notifications.findIndex(n => n.id === action.payload);
      if (index !== -1) {
        const notification = state.notifications[index];
        if (!notification.read) {
          state.unreadCount -= 1;
        }
        state.notifications.splice(index, 1);
      }
    },
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },
  },
});

// Export actions
export const {
  fetchNotificationsStart,
  fetchNotificationsSuccess,
  fetchNotificationsFailure,
  addNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearNotifications,
} = notificationSlice.actions;

// Async action creators
export const fetchNotifications = () => async (dispatch, getState) => {
  try {
    const { auth } = getState();
    
    if (!auth.isAuthenticated) {
      return;
    }
    
    dispatch(fetchNotificationsStart());
    
    const response = await axios.get(API_ENDPOINTS.NOTIFICATIONS.GET);
    
    if (response.data && response.data.success) {
      dispatch(fetchNotificationsSuccess(response.data.data));
    } else {
      dispatch(fetchNotificationsFailure(response.data?.message || 'Failed to fetch notifications'));
    }
  } catch (error) {
    console.error('Error fetching notifications:', error);
    dispatch(fetchNotificationsFailure(error.message));
  }
};

export const markNotificationAsRead = (id) => async (dispatch) => {
  try {
    const response = await axios.put(`${API_ENDPOINTS.NOTIFICATIONS.MARK_READ}/${id}`);
    
    if (response.data && response.data.success) {
      dispatch(markAsRead(id));
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
    // Mark as read anyway to improve user experience
    dispatch(markAsRead(id));
  }
};

export const markAllNotificationsAsRead = () => async (dispatch) => {
  try {
    const response = await axios.put(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
    
    if (response.data && response.data.success) {
      dispatch(markAllAsRead());
    }
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    // Mark all as read anyway to improve user experience
    dispatch(markAllAsRead());
  }
};

export const deleteNotificationById = (id) => async (dispatch) => {
  try {
    const response = await axios.delete(`${API_ENDPOINTS.NOTIFICATIONS.DELETE}/${id}`);
    
    if (response.data && response.data.success) {
      dispatch(deleteNotification(id));
    }
  } catch (error) {
    console.error('Error deleting notification:', error);
    // Delete anyway to improve user experience
    dispatch(deleteNotification(id));
  }
};

export default notificationSlice.reducer;
