import { createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

// Check if token exists in localStorage
const token = localStorage.getItem('authToken');
const userDataString = localStorage.getItem('userData');
let userData = null;

try {
  if (userDataString) {
    userData = JSON.parse(userDataString);
  }
} catch (error) {
  console.error('Error parsing user data from localStorage:', error);
}

const initialState = {
  isAuthenticated: !!token,
  user: userData,
  token: token || null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.isAuthenticated = true;
      state.user = action.payload.userData;
      state.token = action.payload.token;
      state.loading = false;
      state.error = null;
    },
    loginFailure: (state, action) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.loading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.loading = false;
      state.error = null;
    },
    updateUserData: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
  },
});

// Export actions
export const { 
  loginStart, 
  loginSuccess, 
  loginFailure, 
  logout, 
  updateUserData 
} = authSlice.actions;

// Async action creators
export const login = (token, userData = null, rememberMe = true) => (dispatch) => {
  if (!token) {
    dispatch(loginFailure('No token provided'));
    return;
  }

  try {
    // Store token in localStorage
    localStorage.setItem('authToken', token);
    
    // If remember me is enabled, store expiration date (7 days from now)
    if (rememberMe) {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 7); // 7 days
      localStorage.setItem('authTokenExpiry', expirationDate.toISOString());
    }

    // Set axios default header
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // Also set token as a cookie for servers that might expect it there
    document.cookie = `authToken=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;

    // Store last login time
    localStorage.setItem('lastLogin', new Date().toISOString());

    // If userData is provided, store it
    if (userData) {
      localStorage.setItem('userData', JSON.stringify(userData));
    }

    // Dispatch success action
    dispatch(loginSuccess({ token, userData }));
  } catch (error) {
    console.error('Login error:', error);
    dispatch(loginFailure(error.message));
  }
};

export const logoutUser = () => (dispatch) => {
  try {
    // Remove token from localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('authTokenExpiry');
    localStorage.removeItem('userData');

    // Remove axios default header
    delete axios.defaults.headers.common['Authorization'];

    // Remove cookie
    document.cookie = 'authToken=; path=/; max-age=0; SameSite=Lax';

    // Dispatch logout action
    dispatch(logout());
  } catch (error) {
    console.error('Logout error:', error);
  }
};

export const checkAuth = () => (dispatch) => {
  const token = localStorage.getItem('authToken');
  const expiryString = localStorage.getItem('authTokenExpiry');
  
  if (!token) {
    dispatch(logout());
    return;
  }

  // Check if token has expired
  if (expiryString) {
    const expiryDate = new Date(expiryString);
    const now = new Date();
    
    if (now > expiryDate) {
      // Token has expired
      dispatch(logoutUser());
      return;
    }
  }

  // Token is valid, get user data
  const userDataString = localStorage.getItem('userData');
  let userData = null;

  try {
    if (userDataString) {
      userData = JSON.parse(userDataString);
    }
  } catch (error) {
    console.error('Error parsing user data:', error);
  }

  // Set axios default header
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

  // Dispatch login success
  dispatch(loginSuccess({ token, userData }));
};

export default authSlice.reducer;
