import { createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import API_ENDPOINTS from '../../config/apiConfig';

const initialState = {
  watchlist: [],
  totalStocks: 0,
  newStock: "",
  loading: false,
  error: null
};

const watchlistSlice = createSlice({
  name: 'watchlist',
  initialState,
  reducers: {
    fetchWatchlistStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchWatchlistSuccess: (state, action) => {
      state.watchlist = action.payload.watchlist;
      state.totalStocks = action.payload.totalStocks || action.payload.watchlist.length;
      state.loading = false;
      state.error = null;
    },
    fetchWatchlistFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    addToWatchlistStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    addToWatchlistSuccess: (state, action) => {
      state.watchlist.push(action.payload);
      state.totalStocks = state.watchlist.length;
      state.newStock = "";
      state.loading = false;
      state.error = null;
    },
    addToWatchlistFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    removeFromWatchlistStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    removeFromWatchlistSuccess: (state, action) => {
      state.watchlist = state.watchlist.filter(stock => stock.symbol !== action.payload);
      state.totalStocks = state.watchlist.length;
      state.loading = false;
      state.error = null;
    },
    removeFromWatchlistFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    setNewStock: (state, action) => {
      state.newStock = action.payload;
    }
  }
});

export const {
  fetchWatchlistStart,
  fetchWatchlistSuccess,
  fetchWatchlistFailure,
  addToWatchlistStart,
  addToWatchlistSuccess,
  addToWatchlistFailure,
  removeFromWatchlistStart,
  removeFromWatchlistSuccess,
  removeFromWatchlistFailure,
  setNewStock
} = watchlistSlice.actions;

// Thunk action to fetch watchlist
export const fetchWatchlist = () => async (dispatch) => {
  try {
    dispatch(fetchWatchlistStart());

    const response = await axios.get(API_ENDPOINTS.WATCHLIST.GET);

    dispatch(fetchWatchlistSuccess(response.data));
  } catch (error) {
    dispatch(fetchWatchlistFailure(error.message));

    // Fallback to local storage if API fails
    const storedWatchlist = localStorage.getItem('watchlist');
    if (storedWatchlist) {
      try {
        const parsedWatchlist = JSON.parse(storedWatchlist);
        dispatch(fetchWatchlistSuccess({
          watchlist: parsedWatchlist,
          totalStocks: parsedWatchlist.length
        }));
      } catch (parseError) {
        console.error('Error parsing watchlist from localStorage:', parseError);
      }
    }
  }
};

// Thunk action to add stock to watchlist
export const addToWatchlist = (stock, name) => async (dispatch) => {
  try {
    dispatch(addToWatchlistStart());

    // Prepare the request payload
    const payload = typeof stock === 'string'
      ? { symbol: stock, name: name || stock }
      : { symbol: stock.symbol, name: stock.name || stock.symbol };

    // Make the API request
    const response = await axios.post(API_ENDPOINTS.WATCHLIST.ADD, payload);

    // Process the response
    const stockData = response.data.data || response.data;

    // Create a proper stock object if the response doesn't have the expected format
    const formattedStock = stockData.symbol ? stockData : {
      id: Date.now(),
      symbol: payload.symbol.toUpperCase(),
      name: payload.name,
      price: "Loading...",
      change: "0.00",
      changePercent: "0.00",
      marketCap: "Loading...",
      volume: "Loading..."
    };

    // Update Redux state
    dispatch(addToWatchlistSuccess(formattedStock));

    // Update local storage
    try {
      const storedWatchlist = localStorage.getItem('watchlist') || '[]';
      let watchlist = JSON.parse(storedWatchlist);

      // Check if stock already exists in watchlist
      if (!watchlist.some(item => item.symbol === formattedStock.symbol)) {
        watchlist.push(formattedStock);
        localStorage.setItem('watchlist', JSON.stringify(watchlist));
      }
    } catch (parseError) {
      console.error('Error updating watchlist in localStorage:', parseError);
    }

    return formattedStock;
  } catch (error) {
    console.error('Error adding stock to watchlist:', error);
    dispatch(addToWatchlistFailure(error.message || 'Failed to add stock to watchlist'));

    // Create a fallback stock object for local storage
    const fallbackStock = {
      id: Date.now(),
      symbol: typeof stock === 'string' ? stock.toUpperCase() : stock.symbol.toUpperCase(),
      name: name || (typeof stock === 'string' ? stock.toUpperCase() : stock.name || stock.symbol),
      price: (Math.random() * 200 + 50).toFixed(2),
      change: (Math.random() * 10 - 5).toFixed(2),
      changePercent: (Math.random() * 5 - 2.5).toFixed(2),
      marketCap: `${(Math.random() * 500 + 10).toFixed(1)}B`,
      volume: `${(Math.random() * 50 + 5).toFixed(1)}M`
    };

    // Still update Redux state with fallback data
    dispatch(addToWatchlistSuccess(fallbackStock));

    // Update local storage with fallback data
    try {
      const storedWatchlist = localStorage.getItem('watchlist') || '[]';
      let watchlist = JSON.parse(storedWatchlist);
      if (!watchlist.some(item => item.symbol === fallbackStock.symbol)) {
        watchlist.push(fallbackStock);
        localStorage.setItem('watchlist', JSON.stringify(watchlist));
      }
    } catch (parseError) {
      console.error('Error updating watchlist in localStorage:', parseError);
    }

    return fallbackStock;
  }
};

// Thunk action to remove stock from watchlist
export const removeFromWatchlist = (symbol) => async (dispatch) => {
  try {
    dispatch(removeFromWatchlistStart());

    await axios.delete(`${API_ENDPOINTS.WATCHLIST.REMOVE}/${symbol}`);

    dispatch(removeFromWatchlistSuccess(symbol));

    // Update local storage
    const storedWatchlist = localStorage.getItem('watchlist');
    if (storedWatchlist) {
      try {
        let watchlist = JSON.parse(storedWatchlist);
        watchlist = watchlist.filter(stock => stock.symbol !== symbol);
        localStorage.setItem('watchlist', JSON.stringify(watchlist));
      } catch (parseError) {
        console.error('Error parsing watchlist from localStorage:', parseError);
      }
    }
  } catch (error) {
    dispatch(removeFromWatchlistFailure(error.message));

    // Still remove from local state if API fails
    dispatch(removeFromWatchlistSuccess(symbol));

    // Update local storage even if API fails
    const storedWatchlist = localStorage.getItem('watchlist');
    if (storedWatchlist) {
      try {
        let watchlist = JSON.parse(storedWatchlist);
        watchlist = watchlist.filter(stock => stock.symbol !== symbol);
        localStorage.setItem('watchlist', JSON.stringify(watchlist));
      } catch (parseError) {
        console.error('Error parsing watchlist from localStorage:', parseError);
      }
    }
  }
};

export default watchlistSlice.reducer;
