import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  toasts: [],
  nextId: 1,
};

const toastSlice = createSlice({
  name: 'toast',
  initialState,
  reducers: {
    addToast: (state, action) => {
      const { type, message, duration } = action.payload;
      const id = state.nextId;
      
      state.toasts.push({
        id,
        type: type || 'info',
        message,
        duration: duration || 3000,
      });
      
      state.nextId += 1;
    },
    removeToast: (state, action) => {
      state.toasts = state.toasts.filter(toast => toast.id !== action.payload);
    },
    clearToasts: (state) => {
      state.toasts = [];
    },
  },
});

// Export actions
export const { addToast, removeToast, clearToasts } = toastSlice.actions;

// Helper functions for different toast types
export const showSuccessToast = (message, duration) => (dispatch) => {
  dispatch(addToast({ type: 'success', message, duration }));
};

export const showErrorToast = (message, duration) => (dispatch) => {
  dispatch(addToast({ type: 'error', message, duration }));
};

export const showInfoToast = (message, duration) => (dispatch) => {
  dispatch(addToast({ type: 'info', message, duration }));
};

export const showWarningToast = (message, duration) => (dispatch) => {
  dispatch(addToast({ type: 'warning', message, duration }));
};

export default toastSlice.reducer;
