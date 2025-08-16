import { createSlice } from '@reduxjs/toolkit';

// Initial state
const initialState = {
  theme: localStorage.getItem('theme') || 'light',
  notifications: [],
  modals: {
    buyStock: { isOpen: false, data: null },
    sellStock: { isOpen: false, data: null },
    addToWatchlist: { isOpen: false, data: null },
    priceAlert: { isOpen: false, data: null },
    tradeConfirmation: { isOpen: false, data: null }
  },
  loading: {
    global: false,
    portfolio: false,
    trading: false,
    watchlist: false
  },
  toast: {
    isVisible: false,
    message: '',
    type: 'info', // 'success', 'error', 'warning', 'info'
    duration: 3000
  }
};

// UI slice
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Theme actions
    setTheme: (state, action) => {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload);
      document.documentElement.setAttribute('data-theme', action.payload);
    },
    toggleTheme: (state) => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      state.theme = newTheme;
      localStorage.setItem('theme', newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
    },
    

    
    // Modal actions
    openModal: (state, action) => {
      const { modalName, data } = action.payload;
      if (state.modals[modalName]) {
        state.modals[modalName].isOpen = true;
        state.modals[modalName].data = data || null;
      }
    },
    closeModal: (state, action) => {
      const modalName = action.payload;
      if (state.modals[modalName]) {
        state.modals[modalName].isOpen = false;
        state.modals[modalName].data = null;
      }
    },
    closeAllModals: (state) => {
      Object.keys(state.modals).forEach(modalName => {
        state.modals[modalName].isOpen = false;
        state.modals[modalName].data = null;
      });
    },
    
    // Loading actions
    setLoading: (state, action) => {
      const { key, value } = action.payload;
      if (state.loading.hasOwnProperty(key)) {
        state.loading[key] = value;
      }
    },
    setGlobalLoading: (state, action) => {
      state.loading.global = action.payload;
    },
    
    // Notification actions will be handled by new notification system
    
    // Toast actions
    showToast: (state, action) => {
      const { message, type = 'info', duration = 3000 } = action.payload;
      state.toast = {
        isVisible: true,
        message,
        type,
        duration
      };
    },
    hideToast: (state) => {
      state.toast.isVisible = false;
    },
    
    // Quick notification helpers
    showSuccessToast: (state, action) => {
      state.toast = {
        isVisible: true,
        message: action.payload,
        type: 'success',
        duration: 3000
      };
    },
    showErrorToast: (state, action) => {
      state.toast = {
        isVisible: true,
        message: action.payload,
        type: 'error',
        duration: 5000
      };
    },
    showWarningToast: (state, action) => {
      state.toast = {
        isVisible: true,
        message: action.payload,
        type: 'warning',
        duration: 4000
      };
    },
    showInfoToast: (state, action) => {
      state.toast = {
        isVisible: true,
        message: action.payload,
        type: 'info',
        duration: 3000
      };
    }
  },
});

export const {
  setTheme,
  toggleTheme,
  openModal,
  closeModal,
  closeAllModals,
  setLoading,
  setGlobalLoading,
  showToast,
  hideToast,
  showSuccessToast,
  showErrorToast,
  showWarningToast,
  showInfoToast
} = uiSlice.actions;

export default uiSlice.reducer;
