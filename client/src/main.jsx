import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './utils/axiosConfig'  // Import axios config
import { setupAllMockEndpoints } from './utils/mockEndpoints'
import App from './App.jsx'

// Import animation libraries
import { AnimatePresence } from 'framer-motion'

// Import animation helpers
import { safeAnimate } from './utils/animationHelpers'

// Initialize animation utilities
import './utils/initAnimations'

// Store cleanup function reference
let cleanupMockEndpoints = null;

// Check if we should use mock endpoints
const useMocks = localStorage.getItem('useMockEndpoints') === 'true';

// Log the API URL being used
console.log('API URL:', import.meta.env.VITE_API_BASE_URL || 'https://s89-satya-capstone-tradebro.onrender.com');

// Initialize mock endpoints if needed
if (useMocks) {
  if (process.env.NODE_ENV === 'development') {
    console.log('Using mock endpoints');
  }
  cleanupMockEndpoints = setupAllMockEndpoints();
}

// Add a global event listener for offline mode
window.addEventListener('app:offline', () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('App is offline, setting up mock endpoints');
  }

  // Clean up existing mock endpoints if any
  if (cleanupMockEndpoints) {
    cleanupMockEndpoints();
  }

  // Set up new mock endpoints
  cleanupMockEndpoints = setupAllMockEndpoints();
  localStorage.setItem('useMockEndpoints', 'true');
});

// Clean up mock endpoints when the app is unloaded
window.addEventListener('beforeunload', () => {
  if (cleanupMockEndpoints) {
    cleanupMockEndpoints();
  }
});

// Render the app
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AnimatePresence mode="wait">
      <App />
    </AnimatePresence>
  </StrictMode>,
)
