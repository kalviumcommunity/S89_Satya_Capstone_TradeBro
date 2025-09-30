import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { tradingAPI } from '../../services/api';
import { updateHolding } from './portfolioSlice';
import { subtractVirtualMoney, addVirtualMoney } from './authSlice';

// Initial state
const initialState = {
  recentTrades: [],
  activeOrders: [],
  tradeHistory: [],
  isLoading: false,
  error: null,
  tradingFees: {
    brokerage: 0.03, // 0.03% brokerage
    stt: 0.1, // 0.1% STT
    gst: 18 // 18% GST on brokerage
  }
};

// Mock recent trades
const mockRecentTrades = [
  {
    id: 'trade_1',
    symbol: 'WIPRO',
    name: 'Wipro Limited',
    type: 'BUY',
    quantity: 50,
    price: 420,
    totalAmount: 21000,
    timestamp: new Date('2024-01-15T10:30:00'),
    status: 'completed'
  },
  {
    id: 'trade_2',
    symbol: 'BAJFINANCE',
    name: 'Bajaj Finance Limited',
    type: 'SELL',
    quantity: 25,
    price: 6800,
    totalAmount: 170000,
    timestamp: new Date('2024-01-15T09:15:00'),
    status: 'completed'
  }
];

// Calculate trading fees
const calculateTradingFees = (amount, fees) => {
  const brokerage = amount * (fees.brokerage / 100);
  const stt = amount * (fees.stt / 100);
  const gst = brokerage * (fees.gst / 100);
  const totalFees = brokerage + stt + gst;
  
  return {
    brokerage: Math.round(brokerage * 100) / 100,
    stt: Math.round(stt * 100) / 100,
    gst: Math.round(gst * 100) / 100,
    totalFees: Math.round(totalFees * 100) / 100
  };
};

// Async thunks
export const executeTrade = createAsyncThunk(
  'trading/executeTrade',
  async (tradeData, { dispatch, getState, rejectWithValue }) => {
    try {
      const { symbol, quantity, price, type } = tradeData;
      const state = getState();
      const { auth, trading } = state;
      
      // Calculate total amount and fees
      const grossAmount = quantity * price;
      const fees = calculateTradingFees(grossAmount, trading.tradingFees);
      const netAmount = type === 'BUY' ? grossAmount + fees.totalFees : grossAmount - fees.totalFees;
      
      // Check if user has sufficient virtual money for buying
      if (type === 'BUY' && auth.virtualMoney < netAmount) {
        return rejectWithValue('Insufficient virtual money balance');
      }
      
      // Check if user has sufficient shares for selling
      if (type === 'SELL') {
        const holding = state.portfolio.holdings.find(h => h.symbol === symbol);
        if (!holding || holding.quantity < quantity) {
          return rejectWithValue('Insufficient shares to sell');
        }
      }
      
      // Create trade record
      const trade = {
        id: `trade_${Date.now()}`,
        symbol,
        name: tradeData.name || symbol,
        type,
        quantity,
        price,
        grossAmount,
        fees,
        netAmount,
        timestamp: new Date().toISOString(),
        status: 'completed'
      };
      
      // Update virtual money
      if (type === 'BUY') {
        dispatch(subtractVirtualMoney(netAmount));
      } else {
        dispatch(addVirtualMoney(netAmount));
      }
      
      // Update portfolio holding
      dispatch(updateHolding({ symbol, quantity, price, type }));
      
      return trade;
    } catch (error) {
      return rejectWithValue(error.message || 'Trade execution failed');
    }
  }
);

export const fetchRecentTrades = createAsyncThunk(
  'trading/fetchRecentTrades',
  async (limit = 10, { rejectWithValue }) => {
    try {
      const response = await tradingAPI.getRecentTrades(limit);
      if (response.success) {
        return response.data;
      }
      return rejectWithValue(response.message);
    } catch (error) {
      // Return mock data if API fails
      return mockRecentTrades;
    }
  }
);

export const fetchTradeHistory = createAsyncThunk(
  'trading/fetchTradeHistory',
  async ({ startDate, endDate, symbol }, { rejectWithValue }) => {
    try {
      const response = await tradingAPI.getTradeHistory({ startDate, endDate, symbol });
      if (response.success) {
        return response.data;
      }
      return rejectWithValue(response.message);
    } catch (error) {
      // Return mock data if API fails
      return mockRecentTrades;
    }
  }
);

export const placeOrder = createAsyncThunk(
  'trading/placeOrder',
  async (orderData, { getState, rejectWithValue }) => {
    try {
      const { symbol, quantity, price, type, orderType } = orderData;
      const state = getState();
      const { auth } = state;
      
      // Calculate total amount for limit orders
      if (orderType === 'LIMIT') {
        const grossAmount = quantity * price;
        const fees = calculateTradingFees(grossAmount, state.trading.tradingFees);
        const netAmount = type === 'BUY' ? grossAmount + fees.totalFees : grossAmount - fees.totalFees;
        
        // Check virtual money for buy orders
        if (type === 'BUY' && auth.virtualMoney < netAmount) {
          return rejectWithValue('Insufficient virtual money balance');
        }
      }
      
      const order = {
        id: `order_${Date.now()}`,
        symbol,
        name: orderData.name || symbol,
        type,
        orderType,
        quantity,
        price: orderType === 'MARKET' ? null : price,
        status: 'pending',
        timestamp: new Date().toISOString(),
        expiryDate: orderData.expiryDate || null
      };
      
      return order;
    } catch (error) {
      return rejectWithValue(error.message || 'Order placement failed');
    }
  }
);

export const cancelOrder = createAsyncThunk(
  'trading/cancelOrder',
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await tradingAPI.cancelOrder(orderId);
      if (response.success) {
        return orderId;
      }
      return rejectWithValue(response.message);
    } catch (error) {
      // Allow cancellation even if API fails
      return orderId;
    }
  }
);

// Trading slice
const tradingSlice = createSlice({
  name: 'trading',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateTradingFees: (state, action) => {
      state.tradingFees = { ...state.tradingFees, ...action.payload };
    },
    addTradeToHistory: (state, action) => {
      state.tradeHistory.unshift(action.payload);
      state.recentTrades.unshift(action.payload);
      
      // Keep only last 50 recent trades
      if (state.recentTrades.length > 50) {
        state.recentTrades = state.recentTrades.slice(0, 50);
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Execute trade cases
      .addCase(executeTrade.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(executeTrade.fulfilled, (state, action) => {
        state.isLoading = false;
        state.recentTrades.unshift(action.payload);
        state.tradeHistory.unshift(action.payload);
        
        // Keep only last 50 recent trades
        if (state.recentTrades.length > 50) {
          state.recentTrades = state.recentTrades.slice(0, 50);
        }
      })
      .addCase(executeTrade.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch recent trades cases
      .addCase(fetchRecentTrades.fulfilled, (state, action) => {
        state.recentTrades = action.payload;
      })
      
      // Fetch trade history cases
      .addCase(fetchTradeHistory.fulfilled, (state, action) => {
        state.tradeHistory = action.payload;
      })
      
      // Place order cases
      .addCase(placeOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(placeOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeOrders.push(action.payload);
      })
      .addCase(placeOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Cancel order cases
      .addCase(cancelOrder.fulfilled, (state, action) => {
        const orderId = action.payload;
        state.activeOrders = state.activeOrders.filter(order => order.id !== orderId);
      });
  },
});

export const {
  clearError,
  updateTradingFees,
  addTradeToHistory
} = tradingSlice.actions;

export default tradingSlice.reducer;
