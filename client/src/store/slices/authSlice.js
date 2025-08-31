import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../../services/api';

// Initial state
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  isLoading: false,
  error: null,
  virtualMoney: 0,
  registrationBonus: 10000, // ₹10,000 for new users
};

// Async thunks for authentication
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(credentials);
      if (response.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        return response.data;
      }
      return rejectWithValue(response.message);
    } catch (error) {
      return rejectWithValue(error.message || 'Login failed');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authAPI.register(userData);
      if (response.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Give new user ₹10,000 virtual money
        const userWithBonus = {
          ...response.data,
          virtualMoney: 10000
        };
        
        return userWithBonus;
      }
      return rejectWithValue(response.message);
    } catch (error) {
      return rejectWithValue(error.message || 'Registration failed');
    }
  }
);

export const googleAuth = createAsyncThunk(
  'auth/googleAuth',
  async (googleData, { rejectWithValue }) => {
    try {
      const response = await authAPI.googleAuth(googleData);
      if (response.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Check if this is a new user and give bonus
        const userWithBonus = {
          ...response.data,
          virtualMoney: response.data.isNewUser ? 10000 : response.data.virtualMoney || 0
        };
        
        return userWithBonus;
      }
      return rejectWithValue(response.message);
    } catch (error) {
      return rejectWithValue(error.message || 'Google authentication failed');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      await authAPI.logout();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return true;
    } catch (error) {
      // Even if API call fails, clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return true;
    }
  }
);

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authAPI.refreshToken();
      if (response.success) {
        localStorage.setItem('token', response.data.token);
        return response.data;
      }
      return rejectWithValue(response.message);
    } catch (error) {
      return rejectWithValue(error.message || 'Token refresh failed');
    }
  }
);

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    updateVirtualMoney: (state, action) => {
      state.virtualMoney = action.payload;
      if (state.user) {
        state.user.virtualMoney = action.payload;
      }
    },
    addVirtualMoney: (state, action) => {
      state.virtualMoney += action.payload;
      if (state.user) {
        state.user.virtualMoney = state.virtualMoney;
      }
    },
    subtractVirtualMoney: (state, action) => {
      state.virtualMoney = Math.max(0, state.virtualMoney - action.payload);
      if (state.user) {
        state.user.virtualMoney = state.virtualMoney;
      }
    },
    initializeAuth: (state) => {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      if (token && user) {
        try {
          const parsedUser = JSON.parse(user);
          state.token = token;
          state.user = parsedUser;
          state.isAuthenticated = true;
          state.virtualMoney = parsedUser.virtualMoney || 0;
        } catch (error) {
          // Clear invalid data
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.virtualMoney = action.payload.user.virtualMoney || 0;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      
      // Register cases
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.virtualMoney = 10000; // New user bonus
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      
      // Google Auth cases
      .addCase(googleAuth.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(googleAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.virtualMoney = action.payload.virtualMoney || 0;
        state.error = null;
      })
      .addCase(googleAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      
      // Logout cases
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.virtualMoney = 0;
        state.error = null;
        state.isLoading = false;
      })
      
      // Refresh token cases
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.virtualMoney = action.payload.user.virtualMoney || state.virtualMoney;
      });
  },
});

export const {
  clearError,
  setUser,
  updateVirtualMoney,
  addVirtualMoney,
  subtractVirtualMoney,
  initializeAuth
} = authSlice.actions;

export default authSlice.reducer;
