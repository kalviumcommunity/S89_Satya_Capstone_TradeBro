import { createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

const initialState = {
  transactions: [],
  orders: [],
  loading: false,
  error: null
};

const transactionSlice = createSlice({
  name: 'transaction',
  initialState,
  reducers: {
    fetchTransactionsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchTransactionsSuccess: (state, action) => {
      state.transactions = action.payload;
      state.loading = false;
      state.error = null;
    },
    fetchTransactionsFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    fetchOrdersStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchOrdersSuccess: (state, action) => {
      state.orders = action.payload;
      state.loading = false;
      state.error = null;
    },
    fetchOrdersFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    addTransaction: (state, action) => {
      state.transactions.unshift(action.payload);
    },
    addOrder: (state, action) => {
      state.orders.unshift(action.payload);
    },
    updateOrder: (state, action) => {
      const index = state.orders.findIndex(order => order.id === action.payload.id);
      if (index !== -1) {
        state.orders[index] = { ...state.orders[index], ...action.payload };
      }
    }
  }
});

export const {
  fetchTransactionsStart,
  fetchTransactionsSuccess,
  fetchTransactionsFailure,
  fetchOrdersStart,
  fetchOrdersSuccess,
  fetchOrdersFailure,
  addTransaction,
  addOrder,
  updateOrder
} = transactionSlice.actions;

// Thunk action to fetch transaction history
export const fetchTransactions = (filter = 'all', dateRange = {}) => async (dispatch) => {
  try {
    dispatch(fetchTransactionsStart());
    
    // Build query parameters
    let url = '/api/transactions';
    const params = new URLSearchParams();
    
    if (filter !== 'all') {
      params.append('type', filter);
    }
    
    if (dateRange.from) {
      params.append('from', dateRange.from);
    }
    
    if (dateRange.to) {
      params.append('to', dateRange.to);
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await axios.get(url);
    
    dispatch(fetchTransactionsSuccess(response.data));
  } catch (error) {
    dispatch(fetchTransactionsFailure(error.message));
    
    // Fallback to local storage if API fails
    const storedTransactions = localStorage.getItem('transactions');
    if (storedTransactions) {
      try {
        const parsedTransactions = JSON.parse(storedTransactions);
        dispatch(fetchTransactionsSuccess(parsedTransactions));
      } catch (parseError) {
        console.error('Error parsing transactions from localStorage:', parseError);
      }
    }
  }
};

// Thunk action to fetch orders
export const fetchOrders = (filter = 'all') => async (dispatch) => {
  try {
    dispatch(fetchOrdersStart());
    
    let url = '/api/orders';
    if (filter !== 'all') {
      url += `?status=${filter}`;
    }
    
    const response = await axios.get(url);
    
    dispatch(fetchOrdersSuccess(response.data));
  } catch (error) {
    dispatch(fetchOrdersFailure(error.message));
    
    // Fallback to local storage if API fails
    const storedOrders = localStorage.getItem('orders');
    if (storedOrders) {
      try {
        const parsedOrders = JSON.parse(storedOrders);
        dispatch(fetchOrdersSuccess(parsedOrders));
      } catch (parseError) {
        console.error('Error parsing orders from localStorage:', parseError);
      }
    }
  }
};

export default transactionSlice.reducer;
