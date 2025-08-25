import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { toast } from 'react-toastify';

const ORDERS_API_URL = '/api/orders';

const initialState = {
  orders: [],
  isLoading: false,
  error: null,
  filters: {
    status: 'all',
    type: 'all',
    symbol: ''
  },
  summary: {
    totalOrders: 0,
    filledOrders: 0,
    openOrders: 0,
    cancelledOrders: 0,
    rejectedOrders: 0,
  }
};

// Async thunks
export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async (filters, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${ORDERS_API_URL}/all`, { params: filters });
      if (response.data.success) {
        return { data: response.data.data, summary: response.data.summary };
      }
      return rejectWithValue(response.data.message);
    } catch (error) {
      toast.error('Failed to fetch orders from server.');
      return rejectWithValue('Failed to fetch orders');
    }
  }
);

export const placeOrder = createAsyncThunk(
  'orders/placeOrder',
  async (orderData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${ORDERS_API_URL}/place`, orderData);
      if (response.data.success) {
        toast.success(response.data.message);
        return response.data.data.order;
      }
      return rejectWithValue(response.data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to place order');
      return rejectWithValue(error.response?.data?.message || 'Failed to place order');
    }
  }
);

export const cancelOrder = createAsyncThunk(
  'orders/cancelOrder',
  async ({ orderId, reason }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${ORDERS_API_URL}/cancel/${orderId}`, { reason });
      if (response.data.success) {
        toast.success(response.data.message);
        return response.data.data;
      }
      return rejectWithValue(response.data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel order');
      return rejectWithValue(error.response?.data?.message || 'Failed to cancel order');
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
      const { _id, status, executedAt, executionPrice, fees, total } = action.payload;
      const order = state.orders.find(o => o._id === _id);
      if (order) {
        order.status = status;
        if (executedAt) order.executedAt = executedAt;
        if (executionPrice) order.executionPrice = executionPrice;
        if (fees) order.fees = fees;
        if (total) order.total = total;
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
        state.orders = action.payload.data;
        state.summary = action.payload.summary;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(placeOrder.fulfilled, (state, action) => {
        state.orders.unshift(action.payload);
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        const updatedOrder = action.payload;
        const index = state.orders.findIndex(o => o._id === updatedOrder._id);
        if (index > -1) {
          state.orders[index] = updatedOrder;
        }
      });
  },
});

export const { clearError, setFilters, updateOrderStatus } = ordersSlice.actions;
export default ordersSlice.reducer;