import { createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import API_ENDPOINTS from '../../config/apiConfig';
import { getCachedStockSymbols, cacheStockSymbols } from '../../utils/stockCache';
import { safeApiCall, createDummyData } from '../../utils/apiUtils';

const initialState = {
  stockSymbols: [],
  searchResults: [],
  selectedStock: null,
  stockData: null,
  chartData: [],
  watchlist: [],
  recentSearches: [],
  loading: false,
  error: null,
  timeRange: '1day',
};

const stockSlice = createSlice({
  name: 'stock',
  initialState,
  reducers: {
    fetchStockSymbolsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchStockSymbolsSuccess: (state, action) => {
      state.stockSymbols = action.payload;
      state.loading = false;
      state.error = null;
    },
    fetchStockSymbolsFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    setSearchResults: (state, action) => {
      state.searchResults = action.payload;
    },
    setSelectedStock: (state, action) => {
      state.selectedStock = action.payload;
    },
    fetchStockDataStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchStockDataSuccess: (state, action) => {
      state.stockData = action.payload;
      state.loading = false;
      state.error = null;
    },
    fetchStockDataFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    fetchChartDataStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchChartDataSuccess: (state, action) => {
      state.chartData = action.payload;
      state.loading = false;
      state.error = null;
    },
    fetchChartDataFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    setTimeRange: (state, action) => {
      state.timeRange = action.payload;
    },
    fetchWatchlistStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchWatchlistSuccess: (state, action) => {
      state.watchlist = action.payload;
      state.loading = false;
      state.error = null;
    },
    fetchWatchlistFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    addToWatchlist: (state, action) => {
      state.watchlist.push(action.payload);
    },
    removeFromWatchlist: (state, action) => {
      state.watchlist = state.watchlist.filter(item => item.symbol !== action.payload);
    },
    addToRecentSearches: (state, action) => {
      // Check if already exists
      const existingIndex = state.recentSearches.findIndex(
        item => item.symbol === action.payload.symbol
      );
      
      // If exists, remove it
      if (existingIndex !== -1) {
        state.recentSearches.splice(existingIndex, 1);
      }
      
      // Add to beginning
      state.recentSearches.unshift({
        ...action.payload,
        timestamp: new Date().toISOString(),
      });
      
      // Keep only the 10 most recent
      if (state.recentSearches.length > 10) {
        state.recentSearches = state.recentSearches.slice(0, 10);
      }
    },
    clearRecentSearches: (state) => {
      state.recentSearches = [];
    },
  },
});

// Export actions
export const {
  fetchStockSymbolsStart,
  fetchStockSymbolsSuccess,
  fetchStockSymbolsFailure,
  setSearchResults,
  setSelectedStock,
  fetchStockDataStart,
  fetchStockDataSuccess,
  fetchStockDataFailure,
  fetchChartDataStart,
  fetchChartDataSuccess,
  fetchChartDataFailure,
  setTimeRange,
  fetchWatchlistStart,
  fetchWatchlistSuccess,
  fetchWatchlistFailure,
  addToWatchlist,
  removeFromWatchlist,
  addToRecentSearches,
  clearRecentSearches,
} = stockSlice.actions;

// Async action creators
export const fetchStockSymbols = () => async (dispatch) => {
  try {
    dispatch(fetchStockSymbolsStart());
    
    // First, try to get cached stock symbols
    const cachedSymbols = getCachedStockSymbols();
    
    // Set the cached symbols immediately to improve user experience
    if (cachedSymbols && cachedSymbols.length > 0) {
      dispatch(fetchStockSymbolsSuccess(cachedSymbols));
    }
    
    // Then try to fetch fresh data in the background
    const result = await safeApiCall({
      method: 'get',
      url: API_ENDPOINTS.PROXY.STOCK_LIST,
      fallbackData: () => ({ success: true, data: cachedSymbols }),
      timeout: 8000,
    });
    
    if (result && result.data && result.data.length > 0) {
      // Filter to get major stocks for better performance
      const majorStocks = result.data
        .filter(stock => stock.type === "stock")
        .slice(0, 1000); // Limit to 1000 stocks for performance
      
      // Update state with fresh data
      dispatch(fetchStockSymbolsSuccess(majorStocks));
      
      // Cache the fresh data for future use
      cacheStockSymbols(majorStocks);
    }
  } catch (error) {
    console.error('Error fetching stock symbols:', error);
    dispatch(fetchStockSymbolsFailure(error.message));
  }
};



export const fetchStockData = (symbol) => async (dispatch) => {
  try {
    dispatch(fetchStockDataStart());
    
    const response = await axios.get(API_ENDPOINTS.PROXY.STOCK_QUOTE(symbol));
    
    if (response.data && response.data.success) {
      dispatch(fetchStockDataSuccess(response.data.data));
    } else {
      dispatch(fetchStockDataFailure(response.data?.message || 'Failed to fetch stock data'));
    }
  } catch (error) {
    console.error('Error fetching stock data:', error);
    dispatch(fetchStockDataFailure(error.message));
    
    // Use fallback data
    const fallbackData = {
      symbol,
      price: 100 + Math.random() * 100,
      change: Math.random() * 10 - 5,
      changesPercentage: Math.random() * 5 - 2.5,
      name: symbol,
    };
    
    dispatch(fetchStockDataSuccess(fallbackData));
  }
};

export const fetchChartData = (symbol, timeRange) => async (dispatch) => {
  try {
    dispatch(fetchChartDataStart());
    dispatch(setTimeRange(timeRange));
    
    const response = await axios.get(API_ENDPOINTS.PROXY.STOCK_CHART(symbol, timeRange));
    
    if (response.data && response.data.success) {
      dispatch(fetchChartDataSuccess(response.data.data));
    } else {
      dispatch(fetchChartDataFailure(response.data?.message || 'Failed to fetch chart data'));
    }
  } catch (error) {
    console.error('Error fetching chart data:', error);
    dispatch(fetchChartDataFailure(error.message));
    
    // Use fallback data
    const fallbackData = createDummyData(() => {
      // Generate dummy chart data based on time range
      const now = new Date();
      const data = [];
      
      let points = 20;
      let startPrice = 100 + Math.random() * 100;
      let volatility = 2;
      
      switch (timeRange) {
        case '5min':
          points = 60;
          volatility = 0.5;
          break;
        case '1day':
          points = 24;
          volatility = 1;
          break;
        case '1week':
          points = 7;
          volatility = 2;
          break;
        case '1month':
          points = 30;
          volatility = 3;
          break;
        case '3months':
          points = 90;
          volatility = 5;
          break;
        case '1year':
          points = 365;
          volatility = 10;
          break;
        default:
          points = 30;
          volatility = 3;
      }
      
      for (let i = 0; i < points; i++) {
        const change = (Math.random() - 0.5) * volatility;
        startPrice += change;
        
        if (startPrice < 10) startPrice = 10;
        
        const date = new Date(now);
        date.setDate(date.getDate() - (points - i));
        
        data.push({
          date: date.toISOString().split('T')[0],
          time: `${date.getHours()}:${date.getMinutes()}`,
          price: startPrice,
          open: startPrice - Math.random() * 2,
          high: startPrice + Math.random() * 2,
          low: startPrice - Math.random() * 2,
          close: startPrice,
          volume: Math.floor(Math.random() * 1000000),
        });
      }
      
      return data;
    });
    
    dispatch(fetchChartDataSuccess(fallbackData));
  }
};

export const fetchWatchlist = () => async (dispatch, getState) => {
  try {
    const { auth } = getState();
    
    if (!auth.isAuthenticated) {
      return;
    }
    
    dispatch(fetchWatchlistStart());
    
    const response = await axios.get(API_ENDPOINTS.WATCHLIST.GET);
    
    if (response.data && response.data.success) {
      dispatch(fetchWatchlistSuccess(response.data.data));
    } else {
      dispatch(fetchWatchlistFailure(response.data?.message || 'Failed to fetch watchlist'));
    }
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    dispatch(fetchWatchlistFailure(error.message));
  }
};

export const addStockToWatchlist = (symbol) => async (dispatch, getState) => {
  try {
    const { auth } = getState();
    
    if (!auth.isAuthenticated) {
      return { success: false, message: 'User not authenticated' };
    }
    
    const response = await axios.post(API_ENDPOINTS.WATCHLIST.ADD, { symbol });
    
    if (response.data && response.data.success) {
      dispatch(addToWatchlist(response.data.data));
      return { success: true };
    } else {
      return { success: false, message: response.data?.message || 'Failed to add to watchlist' };
    }
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    return { success: false, message: error.message };
  }
};

export const removeStockFromWatchlist = (symbol) => async (dispatch, getState) => {
  try {
    const { auth } = getState();
    
    if (!auth.isAuthenticated) {
      return { success: false, message: 'User not authenticated' };
    }
    
    const response = await axios.delete(`${API_ENDPOINTS.WATCHLIST.REMOVE}/${symbol}`);
    
    if (response.data && response.data.success) {
      dispatch(removeFromWatchlist(symbol));
      return { success: true };
    } else {
      return { success: false, message: response.data?.message || 'Failed to remove from watchlist' };
    }
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    return { success: false, message: error.message };
  }
};

export default stockSlice.reducer;
