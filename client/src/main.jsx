import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './responsive.css'
import './utils/axiosConfig'  // Import axios config
import { setupAllMockEndpoints, setupMockHealthEndpoint } from './utils/mockEndpoints'
import App from './App.jsx'

// Import animation libraries
import { AnimatePresence } from 'framer-motion'

// Store cleanup function references
let cleanupMockEndpoints = null;
let cleanupHealthEndpoint = null;

// Check if we should use mock endpoints
const useMocks = localStorage.getItem('useMockEndpoints') === 'true';

// Define NODE_ENV for development/production mode
const NODE_ENV = window.location.hostname === 'localhost' ? 'development' : 'production';

// Initialize mock endpoints if needed
if (useMocks) {
  if (NODE_ENV === 'development') {
    console.log('Using mock endpoints');
  }
  cleanupMockEndpoints = setupAllMockEndpoints();
} else {
  // Set up health endpoint mock for offline detection
  cleanupHealthEndpoint = setupMockHealthEndpoint();
}

// Add a global event listener for offline mode
window.addEventListener('app:offline', (event) => {
  const errorDetails = event?.detail?.error;

  if (NODE_ENV === 'development') {
    console.log('App is offline, setting up mock endpoints', errorDetails ? `Error: ${errorDetails.message}` : '');
  }

  // Clean up existing mock endpoints if any
  if (cleanupMockEndpoints) {
    cleanupMockEndpoints();
  }

  // Clean up health endpoint mock if active
  if (cleanupHealthEndpoint) {
    cleanupHealthEndpoint();
    cleanupHealthEndpoint = null;
  }

  // Set up new mock endpoints with user data if available
  const userData = localStorage.getItem('userData') ?
    JSON.parse(localStorage.getItem('userData')) : null;

  cleanupMockEndpoints = setupAllMockEndpoints(userData);
  localStorage.setItem('useMockEndpoints', 'true');
});

// Clean up mock endpoints when the app is unloaded
window.addEventListener('beforeunload', () => {
  if (cleanupMockEndpoints) {
    cleanupMockEndpoints();
    cleanupMockEndpoints = null;
  }

  if (cleanupHealthEndpoint) {
    cleanupHealthEndpoint();
    cleanupHealthEndpoint = null;
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
