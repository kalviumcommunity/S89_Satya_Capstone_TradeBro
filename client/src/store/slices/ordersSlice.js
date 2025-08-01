import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { tradingAPI } from '../../services/api';

// Initial state
const initialState = {
  orders: [],
  orderHistory: [],
  isLoading: false,
  error: null,
  filters: {
    status: 'all',
    type: 'all',
    symbol: ''
  }
};

// Mock orders data
const mockOrders = [
  {
    id: 'ORD001',
    symbol: 'RELIANCE',
    name: 'Reliance Industries Ltd',
    type: 'BUY',
    quantity: 50,
    price: 2520,
    orderPrice: 2500,
    status: 'executed',
    timestamp: new Date('2024-01-15T10:30:00').toISOString(),
    executedAt: new Date('2024-01-15T10:31:00').toISOString(),
    totalAmount: 126000
  },
  {
    id: 'ORD002',
    symbol: 'TCS',
    name: 'Tata Consultancy Services',
    type: 'SELL',
    quantity: 20,
    price: 3350,
    orderPrice: 3400,
    status: 'pending',
    timestamp: new Date('2024-01-15T11:15:00').toISOString(),
    executedAt: null,
    totalAmount: 67000
  }
];

// Async thunks
export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async (_, { rejectWithValue }) => {
    try {
      const response = await tradingAPI.getOrders();
      if (response.success) {
        return response.data;
      }
      return rejectWithValue(response.message);
    } catch (error) {
      return mockOrders;
    }
  }
);

export const placeOrder = createAsyncThunk(
  'orders/placeOrder',
  async (orderData, { rejectWithValue }) => {
    try {
      const order = {
        id: `ORD${Date.now()}`,
        ...orderData,
        status: 'pending',
        timestamp: new Date().toISOString(),
        executedAt: null
      };
      
      try {
        const response = await tradingAPI.placeOrder(order);
        if (response.success) {
          return response.data;
        }
      } catch (error) {
        console.warn('API failed, creating local order');
      }
      
      return order;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to place order');
    }
  }
);

export const cancelOrder = createAsyncThunk(
  'orders/cancelOrder',
  async (orderId, { rejectWithValue }) => {
    try {
      try {
        const response = await tradingAPI.cancelOrder(orderId);
        if (response.success) {
          return orderId;
        }
      } catch (error) {
        console.warn('API failed, cancelling local order');
      }
      
      return orderId;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to cancel order');
    }
  }
);

// Orders slice
const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    updateOrderStatus: (state, action) => {
      const { orderId, status, executedAt, executedPrice } = action.payload;
      const order = state.orders.find(o => o.id === orderId);
      if (order) {
        order.status = status;
        if (executedAt) order.executedAt = executedAt;
        if (executedPrice) order.price = executedPrice;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders = action.payload;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(placeOrder.fulfilled, (state, action) => {
        state.orders.unshift(action.payload);
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        const orderId = action.payload;
        const order = state.orders.find(o => o.id === orderId);
        if (order) {
          order.status = 'cancelled';
        }
      });
  },
});

export const { clearError, setFilters, updateOrderStatus } = ordersSlice.actions;
export default ordersSlice.reducer;
