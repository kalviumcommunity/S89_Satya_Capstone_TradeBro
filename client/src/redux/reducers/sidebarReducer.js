import { createSlice } from '@reduxjs/toolkit';

// Get sidebar state from localStorage or default to open
const getInitialSidebarState = () => {
  const savedState = localStorage.getItem('sidebarOpen');
  if (savedState !== null) {
    return savedState === 'true';
  }
  
  // Default to open on larger screens, closed on mobile
  return window.innerWidth > 768;
};

const initialState = {
  isOpen: getInitialSidebarState(),
};

const sidebarSlice = createSlice({
  name: 'sidebar',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.isOpen = !state.isOpen;
      localStorage.setItem('sidebarOpen', state.isOpen.toString());
    },
    setSidebar: (state, action) => {
      state.isOpen = action.payload;
      localStorage.setItem('sidebarOpen', action.payload.toString());
    },
  },
});

// Export actions
export const { toggleSidebar, setSidebar } = sidebarSlice.actions;

export default sidebarSlice.reducer;
