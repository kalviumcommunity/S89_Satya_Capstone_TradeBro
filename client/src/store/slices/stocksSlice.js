import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { stockAPI } from '../../services/api';

// Async thunks for Indian stock data
export const fetchIndianStockQuote = createAsyncThunk(
  'stocks/fetchIndianStockQuote',
  async (symbol, { rejectWithValue }) => {
    try {
      const response = await stockAPI.getQuote(symbol);
      return { symbol, data: response };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch stock quote');
    }
  }
);

export const fetchIndianMarketMovers = createAsyncThunk(
  'stocks/fetchIndianMarketMovers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await stockAPI.getMarketMovers();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch market movers');
    }
  }
);

export const fetchNiftyData = createAsyncThunk(
  'stocks/fetchNiftyData',
  async (_, { rejectWithValue }) => {
    try {
      const response = await stockAPI.getQuote('^NSEI');
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch Nifty data');
    }
  }
);

export const fetchSensexData = createAsyncThunk(
  'stocks/fetchSensexData',
  async (_, { rejectWithValue }) => {
    try {
      const response = await stockAPI.getQuote('^BSESN');
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch Sensex data');
    }
  }
);

export const fetchBatchStockQuotes = createAsyncThunk(
  'stocks/fetchBatchStockQuotes',
  async (symbols, { rejectWithValue }) => {
    try {
      const response = await stockAPI.getBatchQuotes(symbols);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch batch quotes');
    }
  }
);

const initialState = {
  // Indian market indices
  nifty: {
    data: null,
    loading: false,
    error: null,
    lastUpdated: null
  },
  sensex: {
    data: null,
    loading: false,
    error: null,
    lastUpdated: null
  },
  
  // Individual stock quotes
  quotes: {},
  
  // Market movers
  topGainers: [],
  topLosers: [],
  mostActive: [],
  
  // Real-time data management
  realTimeUpdates: true,
  updateInterval: 30000, // 30 seconds
  lastGlobalUpdate: null,
  
  // UI state
  isLoading: false,
  error: null,
  
  // Price change tracking for animations
  priceChanges: {},
  
  // Market status
  marketStatus: {
    isOpen: false,
    nextOpen: null,
    nextClose: null,
    timezone: 'Asia/Kolkata'
  }
};

const stocksSlice = createSlice({
  name: 'stocks',
  initialState,
  reducers: {
    // Real-time price updates
    updateStockPrice: (state, action) => {
      const { symbol, price, change, changePercent, volume, timestamp } = action.payload;
      
      // Track price changes for animations
      if (state.quotes[symbol] && state.quotes[symbol].price !== price) {
        state.priceChanges[symbol] = {
          oldPrice: state.quotes[symbol].price,
          newPrice: price,
          direction: price > state.quotes[symbol].price ? 'up' : 'down',
          timestamp: Date.now()
        };
      }
      
      // Update quote data
      state.quotes[symbol] = {
        ...state.quotes[symbol],
        price,
        change,
        changePercent,
        volume,
        lastUpdated: timestamp || Date.now()
      };
    },
    
    // Batch update multiple stocks
    updateBatchPrices: (state, action) => {
      const updates = action.payload;
      const timestamp = Date.now();
      
      updates.forEach(update => {
        const { symbol, price, change, changePercent, volume } = update;
        
        // Track price changes
        if (state.quotes[symbol] && state.quotes[symbol].price !== price) {
          state.priceChanges[symbol] = {
            oldPrice: state.quotes[symbol].price,
            newPrice: price,
            direction: price > state.quotes[symbol].price ? 'up' : 'down',
            timestamp
          };
        }
        
        // Update quote
        state.quotes[symbol] = {
          ...state.quotes[symbol],
          price,
          change,
          changePercent,
          volume,
          lastUpdated: timestamp
        };
      });
      
      state.lastGlobalUpdate = timestamp;
    },
    
    // Clear price change animations
    clearPriceChanges: (state) => {
      state.priceChanges = {};
    },
    
    // Toggle real-time updates
    toggleRealTimeUpdates: (state) => {
      state.realTimeUpdates = !state.realTimeUpdates;
    },
    
    // Set update interval
    setUpdateInterval: (state, action) => {
      state.updateInterval = action.payload;
    },
    
    // Update market status
    updateMarketStatus: (state, action) => {
      state.marketStatus = { ...state.marketStatus, ...action.payload };
    },
    
    // Clear errors
    clearError: (state) => {
      state.error = null;
      state.nifty.error = null;
      state.sensex.error = null;
    }
  },
  
  extraReducers: (builder) => {
    // Indian stock quote
    builder
      .addCase(fetchIndianStockQuote.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchIndianStockQuote.fulfilled, (state, action) => {
        state.isLoading = false;
        const { symbol, data } = action.payload;
        state.quotes[symbol] = {
          ...data,
          lastUpdated: Date.now()
        };
      })
      .addCase(fetchIndianStockQuote.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
    
    // Market movers
    builder
      .addCase(fetchIndianMarketMovers.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchIndianMarketMovers.fulfilled, (state, action) => {
        state.isLoading = false;
        const { gainers, losers, mostActive } = action.payload;
        state.topGainers = gainers || [];
        state.topLosers = losers || [];
        state.mostActive = mostActive || [];
        state.lastGlobalUpdate = Date.now();
      })
      .addCase(fetchIndianMarketMovers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
    
    // Nifty data
    builder
      .addCase(fetchNiftyData.pending, (state) => {
        state.nifty.loading = true;
        state.nifty.error = null;
      })
      .addCase(fetchNiftyData.fulfilled, (state, action) => {
        state.nifty.loading = false;
        state.nifty.data = action.payload;
        state.nifty.lastUpdated = Date.now();
      })
      .addCase(fetchNiftyData.rejected, (state, action) => {
        state.nifty.loading = false;
        state.nifty.error = action.payload;
      });
    
    // Sensex data
    builder
      .addCase(fetchSensexData.pending, (state) => {
        state.sensex.loading = true;
        state.sensex.error = null;
      })
      .addCase(fetchSensexData.fulfilled, (state, action) => {
        state.sensex.loading = false;
        state.sensex.data = action.payload;
        state.sensex.lastUpdated = Date.now();
      })
      .addCase(fetchSensexData.rejected, (state, action) => {
        state.sensex.loading = false;
        state.sensex.error = action.payload;
      });
    
    // Batch quotes
    builder
      .addCase(fetchBatchStockQuotes.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchBatchStockQuotes.fulfilled, (state, action) => {
        state.isLoading = false;
        const quotes = action.payload;
        quotes.forEach(quote => {
          state.quotes[quote.symbol] = {
            ...quote,
            lastUpdated: Date.now()
          };
        });
        state.lastGlobalUpdate = Date.now();
      })
      .addCase(fetchBatchStockQuotes.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

export const {
  updateStockPrice,
  updateBatchPrices,
  clearPriceChanges,
  toggleRealTimeUpdates,
  setUpdateInterval,
  updateMarketStatus,
  clearError
} = stocksSlice.actions;

export default stocksSlice.reducer;
