import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { toast } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid';

// --- WATCHLIST API URL (Use environment variable) ---
const WATCHLIST_API_URL = process.env.REACT_APP_WATCHLIST_API_URL || '/api/watchlist';

// Initial state
const initialState = {
  watchlists: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
};

// Async thunks
export const fetchWatchlists = createAsyncThunk(
  'watchlist/fetchWatchlists',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${WATCHLIST_API_URL}`);
      if (response.data.success) {
        return response.data.data;
      }
      return rejectWithValue(response.data.message);
    } catch (error) {
      console.error('API Error:', error);
      toast.error('Failed to fetch watchlists from server. Using mock data.');
      // Return a structured mock response on failure
      return [{
        _id: uuidv4(),
        name: 'My Watchlist',
        isDefault: true,
        stocks: [
          {
            symbol: 'RELIANCE',
            name: 'Reliance Industries Ltd',
            price: 2847.65,
            change: 23.45,
            changePercent: 0.83,
            volume: 2847392,
            marketCap: 1925000000000,
            sector: 'Energy',
            addedAt: new Date().toISOString()
          },
          {
            symbol: 'TCS',
            name: 'Tata Consultancy Services',
            price: 3567.80,
            change: -12.40,
            changePercent: -0.35,
            volume: 1234567,
            marketCap: 1300000000000,
            sector: 'IT',
            addedAt: new Date().toISOString()
          }
        ],
      }];
    }
  }
);

export const addToWatchlist = createAsyncThunk(
  'watchlist/addToWatchlist',
  async ({ stockData, watchlistId }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${WATCHLIST_API_URL}/add`, {
        symbol: stockData.symbol,
        name: stockData.name,
        watchlistId
      });
      if (response.data.success) {
        toast.success(`Added ${stockData.symbol} to watchlist`);
        return response.data.data;
      }
      return rejectWithValue(response.data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add stock');
      return rejectWithValue(error.response?.data?.message || 'Failed to add stock');
    }
  }
);

export const removeFromWatchlist = createAsyncThunk(
  'watchlist/removeFromWatchlist',
  async ({ symbol, watchlistId }, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`${WATCHLIST_API_URL}/remove/${symbol}/${watchlistId}`);
      if (response.data.success) {
        toast.success(`Removed ${symbol} from watchlist`);
        return { symbol, watchlistId };
      }
      return rejectWithValue(response.data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove stock');
      return rejectWithValue(error.response?.data?.message || 'Failed to remove stock');
    }
  }
);

export const createWatchlist = createAsyncThunk(
  'watchlist/createWatchlist',
  async (name, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${WATCHLIST_API_URL}/create`, { name });
      if (response.data.success) {
        toast.success(`Watchlist "${name}" created successfully!`);
        return response.data.data;
      }
      return rejectWithValue(response.data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create watchlist');
      return rejectWithValue(error.response?.data?.message || 'Failed to create watchlist');
    }
  }
);

export const deleteWatchlist = createAsyncThunk(
  'watchlist/deleteWatchlist',
  async (watchlistId, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`${WATCHLIST_API_URL}/${watchlistId}`);
      if (response.data.success) {
        toast.success('Watchlist deleted successfully.');
        return watchlistId;
      }
      return rejectWithValue(response.data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete watchlist');
      return rejectWithValue(error.response?.data?.message || 'Failed to delete watchlist');
    }
  }
);

// Watchlist slice
const watchlistSlice = createSlice({
  name: 'watchlist',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch watchlists
      .addCase(fetchWatchlists.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWatchlists.fulfilled, (state, action) => {
        state.isLoading = false;
        state.watchlists = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchWatchlists.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.watchlists = [];
      })
      // Add stock to watchlist
      .addCase(addToWatchlist.fulfilled, (state, action) => {
        const { _id, stocks } = action.payload;
        const targetWatchlist = state.watchlists.find(wl => wl._id === _id);
        if (targetWatchlist) {
          targetWatchlist.stocks = stocks;
        }
      })
      // Remove stock from watchlist
      .addCase(removeFromWatchlist.fulfilled, (state, action) => {
        const { symbol, watchlistId } = action.payload;
        const targetWatchlist = state.watchlists.find(wl => wl._id === watchlistId);
        if (targetWatchlist) {
          targetWatchlist.stocks = targetWatchlist.stocks.filter(stock => stock.symbol !== symbol);
        }
      })
      // Create watchlist
      .addCase(createWatchlist.fulfilled, (state, action) => {
        state.watchlists.push(action.payload);
      })
      // Delete watchlist
      .addCase(deleteWatchlist.fulfilled, (state, action) => {
        const watchlistId = action.payload;
        state.watchlists = state.watchlists.filter(wl => wl._id !== watchlistId);
      });
  },
});

export const { clearError } = watchlistSlice.actions;

export default watchlistSlice.reducer;