import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './responsive.css'
import './utils/axiosConfig'  // Import axios config
import { setupAllMockEndpoints } from './utils/mockEndpoints'
import App from './App.jsx'

// Import animation libraries
import { AnimatePresence } from 'framer-motion'

// Import animation helpers
import { validateCubicBezier, parseCubicBezier } from './utils/animationHelpers'

// Fix Web Animations API cubic-bezier issues
if (typeof Element !== 'undefined' && Element.prototype.animate) {
  // Store the original animate method
  const originalAnimate = Element.prototype.animate;

  // Override the animate method with our safe version
  Element.prototype.animate = function(keyframes, options) {
    // Clone options to avoid modifying the original
    if (options && typeof options === 'object') {
      const safeOptions = { ...options };

      // Fix easing if it's a cubic-bezier
      if (safeOptions.easing && typeof safeOptions.easing === 'string' &&
          safeOptions.easing.includes('cubic-bezier')) {
        const params = parseCubicBezier(safeOptions.easing);
        if (params) {
          const validParams = validateCubicBezier(params);
          safeOptions.easing = `cubic-bezier(${validParams.join(', ')})`;
        } else {
          // Fallback to a safe easing if parsing fails
          safeOptions.easing = 'ease';
        }
      }

      // Call the original method with safe options
      return originalAnimate.call(this, keyframes, safeOptions);
    }

    // Call the original method if no options or not an object
    return originalAnimate.apply(this, arguments);
  };
}

// Store cleanup function reference
let cleanupMockEndpoints = null;

// Check if we should use mock endpoints
const useMocks = localStorage.getItem('useMockEndpoints') === 'true';

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
