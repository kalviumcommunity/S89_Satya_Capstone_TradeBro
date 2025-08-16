import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { watchlistAPI } from '../../services/api';

// Initial state
const initialState = {
  stocks: [],
  isLoading: false,
  error: null,
  lastUpdated: null
};

// Mock watchlist data
const mockWatchlistStocks = [
  {
    id: 'watch_1',
    symbol: 'RELIANCE',
    name: 'Reliance Industries Ltd',
    price: 2520,
    change: 25,
    changePercent: 1.0,
    volume: 1250000,
    marketCap: 1705000000000,
    pe: 24.5,
    sector: 'Energy',
    isFavorite: true,
    alertPrice: 2600,
    hasAlert: true,
    addedAt: new Date('2024-01-10T10:00:00').toISOString()
  },
  {
    id: 'watch_2',
    symbol: 'TCS',
    name: 'Tata Consultancy Services',
    price: 3350,
    change: -15,
    changePercent: -0.45,
    volume: 890000,
    marketCap: 1220000000000,
    pe: 28.2,
    sector: 'IT',
    isFavorite: false,
    alertPrice: null,
    hasAlert: false,
    addedAt: new Date('2024-01-12T14:30:00').toISOString()
  },
  {
    id: 'watch_3',
    symbol: 'INFY',
    name: 'Infosys Limited',
    price: 1520,
    change: 12,
    changePercent: 0.79,
    volume: 1100000,
    marketCap: 645000000000,
    pe: 22.8,
    sector: 'IT',
    isFavorite: true,
    alertPrice: 1600,
    hasAlert: true,
    addedAt: new Date('2024-01-08T09:15:00').toISOString()
  }
];

// Async thunks
export const fetchWatchlist = createAsyncThunk(
  'watchlist/fetchWatchlist',
  async (_, { rejectWithValue }) => {
    try {
      const response = await watchlistAPI.getWatchlist();
      if (response.success) {
        return response.data;
      }
      return rejectWithValue(response.message);
    } catch (error) {
      // Return mock data if API fails
      return mockWatchlistStocks;
    }
  }
);

export const addToWatchlist = createAsyncThunk(
  'watchlist/addToWatchlist',
  async (stockData, { getState, rejectWithValue }) => {
    try {
      const { symbol, name, price, sector } = stockData;
      const state = getState();
      
      // Check if stock already exists
      const existingStock = state.watchlist.stocks.find(s => s.symbol === symbol);
      if (existingStock) {
        return rejectWithValue('Stock already in watchlist');
      }
      
      const newStock = {
        id: `watch_${Date.now()}`,
        symbol,
        name,
        price,
        change: 0,
        changePercent: 0,
        volume: 0,
        marketCap: 0,
        pe: 0,
        sector: sector || 'Unknown',
        isFavorite: false,
        alertPrice: null,
        hasAlert: false,
        addedAt: new Date().toISOString()
      };
      
      // Try to add to backend
      try {
        const response = await watchlistAPI.addStock(newStock);
        if (response.success) {
          return response.data;
        }
      } catch (error) {
        // Continue with local addition if API fails
        console.warn('API failed, adding to local watchlist');
      }
      
      return newStock;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to add to watchlist');
    }
  }
);

export const removeFromWatchlist = createAsyncThunk(
  'watchlist/removeFromWatchlist',
  async (stockId, { rejectWithValue }) => {
    try {
      // Try to remove from backend
      try {
        const response = await watchlistAPI.removeStock(stockId);
        if (response.success) {
          return stockId;
        }
      } catch (error) {
        // Continue with local removal if API fails
        console.warn('API failed, removing from local watchlist');
      }
      
      return stockId;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to remove from watchlist');
    }
  }
);

export const toggleFavorite = createAsyncThunk(
  'watchlist/toggleFavorite',
  async (stockId, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const stock = state.watchlist.stocks.find(s => s.id === stockId);
      
      if (!stock) {
        return rejectWithValue('Stock not found in watchlist');
      }
      
      const updatedStock = {
        ...stock,
        isFavorite: !stock.isFavorite
      };
      
      // Try to update backend
      try {
        const response = await watchlistAPI.updateStock(stockId, updatedStock);
        if (response.success) {
          return response.data;
        }
      } catch (error) {
        // Continue with local update if API fails
        console.warn('API failed, updating local watchlist');
      }
      
      return updatedStock;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to toggle favorite');
    }
  }
);

export const setPriceAlert = createAsyncThunk(
  'watchlist/setPriceAlert',
  async ({ stockId, alertPrice }, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const stock = state.watchlist.stocks.find(s => s.id === stockId);
      
      if (!stock) {
        return rejectWithValue('Stock not found in watchlist');
      }
      
      const updatedStock = {
        ...stock,
        alertPrice,
        hasAlert: alertPrice !== null
      };
      
      // Try to update backend
      try {
        const response = await watchlistAPI.updateStock(stockId, updatedStock);
        if (response.success) {
          return response.data;
        }
      } catch (error) {
        // Continue with local update if API fails
        console.warn('API failed, updating local watchlist');
      }
      
      return updatedStock;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to set price alert');
    }
  }
);

export const updateWatchlistPrices = createAsyncThunk(
  'watchlist/updatePrices',
  async (priceUpdates, { rejectWithValue }) => {
    try {
      // priceUpdates is an array of { symbol, price, change, changePercent, volume }
      return priceUpdates;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update prices');
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
    updateStockPrices: (state, action) => {
      const priceUpdates = action.payload;
      state.stocks = state.stocks.map(stock => {
        const update = priceUpdates.find(u => u.symbol === stock.symbol);
        if (update) {
          return {
            ...stock,
            price: update.price,
            change: update.change,
            changePercent: update.changePercent,
            volume: update.volume || stock.volume,
            dayHigh: update.dayHigh || stock.dayHigh,
            dayLow: update.dayLow || stock.dayLow,
            lastUpdated: Date.now()
          };
        }
        return stock;
      });
      state.lastUpdated = new Date().toISOString();
    },

    // Sync with stocks slice updates
    syncWithStocksData: (state, action) => {
      const stocksData = action.payload;
      state.stocks = state.stocks.map(stock => {
        const stockData = stocksData[stock.symbol];
        if (stockData) {
          return {
            ...stock,
            ...stockData,
            lastUpdated: Date.now()
          };
        }
        return stock;
      });
      state.lastUpdated = new Date().toISOString();
    },
    sortWatchlist: (state, action) => {
      const { sortBy, sortOrder } = action.payload;
      
      state.stocks.sort((a, b) => {
        let aValue, bValue;
        
        switch (sortBy) {
          case 'symbol':
            aValue = a.symbol;
            bValue = b.symbol;
            break;
          case 'price':
            aValue = a.price;
            bValue = b.price;
            break;
          case 'change':
            aValue = a.changePercent;
            bValue = b.changePercent;
            break;
          case 'volume':
            aValue = a.volume;
            bValue = b.volume;
            break;
          case 'addedAt':
            aValue = new Date(a.addedAt);
            bValue = new Date(b.addedAt);
            break;
          default:
            return 0;
        }
        
        if (sortOrder === 'desc') {
          return bValue > aValue ? 1 : -1;
        } else {
          return aValue > bValue ? 1 : -1;
        }
      });
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch watchlist cases
      .addCase(fetchWatchlist.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWatchlist.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stocks = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchWatchlist.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Add to watchlist cases
      .addCase(addToWatchlist.fulfilled, (state, action) => {
        state.stocks.push(action.payload);
      })
      .addCase(addToWatchlist.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      // Remove from watchlist cases
      .addCase(removeFromWatchlist.fulfilled, (state, action) => {
        const stockId = action.payload;
        state.stocks = state.stocks.filter(stock => stock.id !== stockId);
      })
      .addCase(removeFromWatchlist.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      // Toggle favorite cases
      .addCase(toggleFavorite.fulfilled, (state, action) => {
        const updatedStock = action.payload;
        const index = state.stocks.findIndex(s => s.id === updatedStock.id);
        if (index >= 0) {
          state.stocks[index] = updatedStock;
        }
      })
      
      // Set price alert cases
      .addCase(setPriceAlert.fulfilled, (state, action) => {
        const updatedStock = action.payload;
        const index = state.stocks.findIndex(s => s.id === updatedStock.id);
        if (index >= 0) {
          state.stocks[index] = updatedStock;
        }
      })
      
      // Update prices cases
      .addCase(updateWatchlistPrices.fulfilled, (state, action) => {
        const priceUpdates = action.payload;
        state.stocks = state.stocks.map(stock => {
          const update = priceUpdates.find(u => u.symbol === stock.symbol);
          if (update) {
            return {
              ...stock,
              price: update.price,
              change: update.change,
              changePercent: update.changePercent,
              volume: update.volume || stock.volume
            };
          }
          return stock;
        });
        state.lastUpdated = new Date().toISOString();
      });
  },
});

export const {
  clearError,
  updateStockPrices,
  syncWithStocksData,
  sortWatchlist
} = watchlistSlice.actions;

export default watchlistSlice.reducer;
