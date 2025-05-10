import { createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

const initialState = {
  userData: {
    fullName: "",
    email: "",
    phoneNumber: "",
    joinDate: new Date().toISOString(),
    profileImage: null,
    tradingExperience: "Beginner",
    preferredMarkets: ["Stocks", "ETFs", "Crypto"],
    bio: ""
  },
  stats: {
    totalTrades: 0,
    successRate: 0,
    avgReturn: 0,
    portfolioValue: 0,
    activeWatchlists: 0
  },
  recentActivity: [],
  editedUser: null,
  loading: false,
  error: null
};

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    fetchProfileStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchProfileSuccess: (state, action) => {
      state.userData = action.payload.userData;
      state.stats = action.payload.stats;
      state.recentActivity = action.payload.recentActivity;
      state.loading = false;
      state.error = null;
    },
    fetchProfileFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    setEditedUser: (state, action) => {
      state.editedUser = action.payload;
    },
    updateProfileStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    updateProfileSuccess: (state, action) => {
      state.userData = { ...state.userData, ...action.payload };
      state.loading = false;
      state.error = null;
    },
    updateProfileFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    addActivity: (state, action) => {
      state.recentActivity.unshift(action.payload);
      // Keep only the most recent 10 activities
      if (state.recentActivity.length > 10) {
        state.recentActivity = state.recentActivity.slice(0, 10);
      }
    }
  }
});

export const {
  fetchProfileStart,
  fetchProfileSuccess,
  fetchProfileFailure,
  setEditedUser,
  updateProfileStart,
  updateProfileSuccess,
  updateProfileFailure,
  addActivity
} = profileSlice.actions;

// Thunk action to fetch profile data
export const fetchProfile = () => async (dispatch) => {
  try {
    dispatch(fetchProfileStart());
    
    // Replace with your actual API endpoint
    const response = await axios.get('/api/profile');
    
    dispatch(fetchProfileSuccess(response.data));
  } catch (error) {
    dispatch(fetchProfileFailure(error.message));
  }
};

// Thunk action to update profile
export const updateProfile = (profileData) => async (dispatch) => {
  try {
    dispatch(updateProfileStart());
    
    // Replace with your actual API endpoint
    const response = await axios.put('/api/profile', profileData);
    
    dispatch(updateProfileSuccess(response.data));
    return response.data;
  } catch (error) {
    dispatch(updateProfileFailure(error.message));
    throw error;
  }
};

export default profileSlice.reducer;
