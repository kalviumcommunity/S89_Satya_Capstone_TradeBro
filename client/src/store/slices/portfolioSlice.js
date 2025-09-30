import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { portfolioAPI } from '../../services/api';

// Initial state
const initialState = {
  holdings: [],
  summary: {
    totalValue: 0,
    totalInvested: 0,
    totalGains: 0,
    totalGainsPercent: 0,
    dayChange: 0,
    dayChangePercent: 0,
    totalStocks: 0
  },
  performance: {
    chartData: [],
    timeframe: '1D'
  },
  isLoading: false,
  error: null,
  lastUpdated: null
};

// Mock data for when backend is not available
const mockHoldings = [
  {
    id: 'holding_1',
    symbol: 'RELIANCE',
    name: 'Reliance Industries Ltd',
    quantity: 0,
    avgPrice: 0,
    currentPrice: 2520,
    totalValue: 0,
    totalGains: 0,
    gainsPercent: 0,
    dayChange: 25,
    dayChangePercent: 1.0,
    sector: 'Energy'
  },
  {
    id: 'holding_2',
    symbol: 'TCS',
    name: 'Tata Consultancy Services',
    quantity: 0,
    avgPrice: 0,
    currentPrice: 3350,
    totalValue: 0,
    totalGains: 0,
    gainsPercent: 0,
    dayChange: -15,
    dayChangePercent: -0.45,
    sector: 'IT'
  },
  {
    id: 'holding_3',
    symbol: 'INFY',
    name: 'Infosys Limited',
    quantity: 0,
    avgPrice: 0,
    currentPrice: 1520,
    totalValue: 0,
    totalGains: 0,
    gainsPercent: 0,
    dayChange: 12,
    dayChangePercent: 0.79,
    sector: 'IT'
  }
];

// Async thunks
export const fetchPortfolioSummary = createAsyncThunk(
  'portfolio/fetchSummary',
  async (_, { rejectWithValue, getState }) => {
    try {
      const response = await portfolioAPI.getSummary();
      if (response.success) {
        return response.data;
      }
      return rejectWithValue(response.message);
    } catch (error) {
      // Return calculated summary from holdings if API fails
      const { portfolio } = getState();
      return calculatePortfolioSummary(portfolio.holdings);
    }
  }
);

export const fetchHoldings = createAsyncThunk(
  'portfolio/fetchHoldings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await portfolioAPI.getHoldings();
      if (response.success) {
        return response.data;
      }
      return rejectWithValue(response.message);
    } catch (error) {
      // Return mock holdings if API fails
      return mockHoldings;
    }
  }
);

export const updateHolding = createAsyncThunk(
  'portfolio/updateHolding',
  async ({ symbol, quantity, price, type }, { rejectWithValue, getState }) => {
    try {
      const { portfolio } = getState();
      const existingHolding = portfolio.holdings.find(h => h.symbol === symbol);
      
      let updatedHolding;
      
      if (type === 'BUY') {
        if (existingHolding) {
          // Update existing holding
          const newQuantity = existingHolding.quantity + quantity;
          const newTotalCost = (existingHolding.avgPrice * existingHolding.quantity) + (price * quantity);
          const newAvgPrice = newTotalCost / newQuantity;
          
          updatedHolding = {
            ...existingHolding,
            quantity: newQuantity,
            avgPrice: newAvgPrice,
            totalValue: newQuantity * existingHolding.currentPrice,
            totalGains: (existingHolding.currentPrice - newAvgPrice) * newQuantity,
            gainsPercent: ((existingHolding.currentPrice - newAvgPrice) / newAvgPrice) * 100
          };
        } else {
          // Create new holding
          const stockData = mockHoldings.find(s => s.symbol === symbol);
          if (!stockData) {
            return rejectWithValue('Stock not found');
          }
          
          updatedHolding = {
            ...stockData,
            id: `holding_${Date.now()}`,
            quantity,
            avgPrice: price,
            totalValue: quantity * stockData.currentPrice,
            totalGains: (stockData.currentPrice - price) * quantity,
            gainsPercent: ((stockData.currentPrice - price) / price) * 100
          };
        }
      } else if (type === 'SELL') {
        if (!existingHolding || existingHolding.quantity < quantity) {
          return rejectWithValue('Insufficient shares to sell');
        }
        
        const newQuantity = existingHolding.quantity - quantity;
        
        if (newQuantity === 0) {
          // Remove holding completely
          updatedHolding = null;
        } else {
          // Update holding
          updatedHolding = {
            ...existingHolding,
            quantity: newQuantity,
            totalValue: newQuantity * existingHolding.currentPrice,
            totalGains: (existingHolding.currentPrice - existingHolding.avgPrice) * newQuantity,
            gainsPercent: ((existingHolding.currentPrice - existingHolding.avgPrice) / existingHolding.avgPrice) * 100
          };
        }
      }
      
      return { symbol, updatedHolding, type, quantity, price };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update holding');
    }
  }
);

// Helper function to calculate portfolio summary
const calculatePortfolioSummary = (holdings) => {
  const totalValue = holdings.reduce((sum, holding) => sum + holding.totalValue, 0);
  const totalInvested = holdings.reduce((sum, holding) => sum + (holding.avgPrice * holding.quantity), 0);
  const totalGains = totalValue - totalInvested;
  const totalGainsPercent = totalInvested > 0 ? (totalGains / totalInvested) * 100 : 0;
  const dayChange = holdings.reduce((sum, holding) => sum + (holding.dayChange * holding.quantity), 0);
  const dayChangePercent = totalValue > 0 ? (dayChange / (totalValue - dayChange)) * 100 : 0;
  
  return {
    totalValue,
    totalInvested,
    totalGains,
    totalGainsPercent,
    dayChange,
    dayChangePercent,
    totalStocks: holdings.filter(h => h.quantity > 0).length
  };
};

// Portfolio slice
const portfolioSlice = createSlice({
  name: 'portfolio',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateCurrentPrices: (state, action) => {
      const priceUpdates = action.payload;
      state.holdings = state.holdings.map(holding => {
        const priceUpdate = priceUpdates.find(p => p.symbol === holding.symbol);
        if (priceUpdate) {
          const newCurrentPrice = priceUpdate.price;
          const newTotalValue = holding.quantity * newCurrentPrice;
          const newTotalGains = (newCurrentPrice - holding.avgPrice) * holding.quantity;
          const newGainsPercent = holding.avgPrice > 0 ? ((newCurrentPrice - holding.avgPrice) / holding.avgPrice) * 100 : 0;
          
          return {
            ...holding,
            currentPrice: newCurrentPrice,
            totalValue: newTotalValue,
            totalGains: newTotalGains,
            gainsPercent: newGainsPercent,
            dayChange: priceUpdate.dayChange || holding.dayChange,
            dayChangePercent: priceUpdate.dayChangePercent || holding.dayChangePercent
          };
        }
        return holding;
      });
      
      // Recalculate summary
      state.summary = calculatePortfolioSummary(state.holdings);
      state.lastUpdated = new Date().toISOString();
    },
    setTimeframe: (state, action) => {
      state.performance.timeframe = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch summary cases
      .addCase(fetchPortfolioSummary.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPortfolioSummary.fulfilled, (state, action) => {
        state.isLoading = false;
        state.summary = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchPortfolioSummary.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch holdings cases
      .addCase(fetchHoldings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchHoldings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.holdings = action.payload;
        state.summary = calculatePortfolioSummary(action.payload);
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchHoldings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Update holding cases
      .addCase(updateHolding.fulfilled, (state, action) => {
        const { symbol, updatedHolding } = action.payload;
        
        if (updatedHolding === null) {
          // Remove holding
          state.holdings = state.holdings.filter(h => h.symbol !== symbol);
        } else {
          const existingIndex = state.holdings.findIndex(h => h.symbol === symbol);
          if (existingIndex >= 0) {
            state.holdings[existingIndex] = updatedHolding;
          } else {
            state.holdings.push(updatedHolding);
          }
        }
        
        // Recalculate summary
        state.summary = calculatePortfolioSummary(state.holdings);
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(updateHolding.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const {
  clearError,
  updateCurrentPrices,
  setTimeframe
} = portfolioSlice.actions;

export default portfolioSlice.reducer;
