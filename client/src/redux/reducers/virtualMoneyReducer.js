import { createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import API_ENDPOINTS from '../../config/apiConfig';

const initialState = {
  balance: 0,
  portfolio: [],
  transactions: [],
  lastRewardClaimed: null,
  loading: false,
  error: null,
};

const virtualMoneySlice = createSlice({
  name: 'virtualMoney',
  initialState,
  reducers: {
    fetchVirtualMoneyStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchVirtualMoneySuccess: (state, action) => {
      state.balance = action.payload.balance;
      state.portfolio = action.payload.portfolio || [];
      state.transactions = action.payload.transactions || [];
      state.lastRewardClaimed = action.payload.lastRewardClaimed;
      state.loading = false;
      state.error = null;
    },
    fetchVirtualMoneyFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    updateBalance: (state, action) => {
      state.balance = action.payload;
    },
    updatePortfolio: (state, action) => {
      state.portfolio = action.payload;
    },
    addTransaction: (state, action) => {
      state.transactions = [action.payload, ...state.transactions];
    },
    setLastRewardClaimed: (state, action) => {
      state.lastRewardClaimed = action.payload;
    },
  },
});

// Export actions
export const {
  fetchVirtualMoneyStart,
  fetchVirtualMoneySuccess,
  fetchVirtualMoneyFailure,
  updateBalance,
  updatePortfolio,
  addTransaction,
  setLastRewardClaimed,
} = virtualMoneySlice.actions;

// Async action creators
export const fetchVirtualMoney = (forceRefresh = false) => async (dispatch, getState) => {
  try {
    const { auth } = getState();
    
    if (!auth.isAuthenticated) {
      return;
    }
    
    dispatch(fetchVirtualMoneyStart());
    
    const response = await axios.get(API_ENDPOINTS.VIRTUAL_MONEY.GET, {
      params: { forceRefresh },
    });
    
    if (response.data && response.data.success) {
      dispatch(fetchVirtualMoneySuccess(response.data.data));
    } else {
      dispatch(fetchVirtualMoneyFailure(response.data?.message || 'Failed to fetch virtual money data'));
    }
  } catch (error) {
    console.error('Error fetching virtual money:', error);
    dispatch(fetchVirtualMoneyFailure(error.message));
    
    // Use fallback data if API fails
    const fallbackData = {
      balance: 10000,
      portfolio: [],
      transactions: [],
      lastRewardClaimed: null,
    };
    
    dispatch(fetchVirtualMoneySuccess(fallbackData));
  }
};

export const claimDailyReward = () => async (dispatch, getState) => {
  try {
    const { auth } = getState();
    
    if (!auth.isAuthenticated) {
      return { success: false, message: 'User not authenticated' };
    }
    
    const response = await axios.post(API_ENDPOINTS.VIRTUAL_MONEY.CLAIM_REWARD);
    
    if (response.data && response.data.success) {
      // Update virtual money state
      dispatch(updateBalance(response.data.data.balance));
      dispatch(setLastRewardClaimed(response.data.data.lastRewardClaimed));
      
      // Add transaction if provided
      if (response.data.data.transaction) {
        dispatch(addTransaction(response.data.data.transaction));
      }
      
      return { success: true, data: response.data.data };
    } else {
      return { success: false, message: response.data?.message || 'Failed to claim reward' };
    }
  } catch (error) {
    console.error('Error claiming daily reward:', error);
    return { success: false, message: error.message };
  }
};

export const buyStock = (stockData, quantity) => async (dispatch, getState) => {
  try {
    const { auth } = getState();
    
    if (!auth.isAuthenticated) {
      return { success: false, message: 'User not authenticated' };
    }
    
    const response = await axios.post(API_ENDPOINTS.ORDERS.BUY, {
      symbol: stockData.symbol,
      price: stockData.price,
      quantity,
    });
    
    if (response.data && response.data.success) {
      // Update virtual money state
      dispatch(fetchVirtualMoney(true));
      
      return { success: true, data: response.data.data };
    } else {
      return { success: false, message: response.data?.message || 'Failed to buy stock' };
    }
  } catch (error) {
    console.error('Error buying stock:', error);
    return { success: false, message: error.message };
  }
};

export const sellStock = (stockData, quantity) => async (dispatch, getState) => {
  try {
    const { auth } = getState();
    
    if (!auth.isAuthenticated) {
      return { success: false, message: 'User not authenticated' };
    }
    
    const response = await axios.post(API_ENDPOINTS.ORDERS.SELL, {
      symbol: stockData.symbol,
      price: stockData.price,
      quantity,
    });
    
    if (response.data && response.data.success) {
      // Update virtual money state
      dispatch(fetchVirtualMoney(true));
      
      return { success: true, data: response.data.data };
    } else {
      return { success: false, message: response.data?.message || 'Failed to sell stock' };
    }
  } catch (error) {
    console.error('Error selling stock:', error);
    return { success: false, message: error.message };
  }
};

export default virtualMoneySlice.reducer;
