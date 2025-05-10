import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Modal states
  showModal: false,
  showBuyModal: false,
  showSellModal: false,
  
  // Loading states
  loading: false,
  refreshing: false,
  isTyping: false,
  
  // Animation states
  showRewardAnimation: false,
  
  // Filter states
  filter: 'all',
  isFiltered: false,
  searchTerm: '',
  
  // Form states
  isEditing: false,
  
  // Detail view states
  showFullScreenDetail: false,
  selectedStock: null,
  
  // Time range for charts
  timeRange: '1day',
  chartType: 'line',
  
  // Error state
  error: null,
  
  // Date range for filtering
  dateRange: {
    from: '',
    to: ''
  }
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setRefreshing: (state, action) => {
      state.refreshing = action.payload;
    },
    setShowModal: (state, action) => {
      state.showModal = action.payload;
    },
    setShowBuyModal: (state, action) => {
      state.showBuyModal = action.payload;
    },
    setShowSellModal: (state, action) => {
      state.showSellModal = action.payload;
    },
    setShowRewardAnimation: (state, action) => {
      state.showRewardAnimation = action.payload;
    },
    setFilter: (state, action) => {
      state.filter = action.payload;
    },
    setIsFiltered: (state, action) => {
      state.isFiltered = action.payload;
    },
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
    },
    setIsEditing: (state, action) => {
      state.isEditing = action.payload;
    },
    setShowFullScreenDetail: (state, action) => {
      state.showFullScreenDetail = action.payload;
    },
    setSelectedStock: (state, action) => {
      state.selectedStock = action.payload;
    },
    setTimeRange: (state, action) => {
      state.timeRange = action.payload;
    },
    setChartType: (state, action) => {
      state.chartType = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setDateRange: (state, action) => {
      state.dateRange = action.payload;
    },
    setIsTyping: (state, action) => {
      state.isTyping = action.payload;
    },
    resetUI: (state) => {
      return initialState;
    }
  }
});

export const {
  setLoading,
  setRefreshing,
  setShowModal,
  setShowBuyModal,
  setShowSellModal,
  setShowRewardAnimation,
  setFilter,
  setIsFiltered,
  setSearchTerm,
  setIsEditing,
  setShowFullScreenDetail,
  setSelectedStock,
  setTimeRange,
  setChartType,
  setError,
  setDateRange,
  setIsTyping,
  resetUI
} = uiSlice.actions;

export default uiSlice.reducer;
