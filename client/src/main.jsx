import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './utils/axiosConfig'  // Import axios config

import App from './App.jsx'

// Import animation libraries (removed AnimatePresence from root level)

// Import animation helpers
import { safeAnimate } from './utils/animationHelpers'

// Initialize animation utilities
import './utils/initAnimations'

// React 19 compatibility patch
if (typeof window !== 'undefined') {
  // Suppress React 19 static flag warnings in development
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;

  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Expected static flag was missing') ||
       args[0].includes('Cannot set property __REACT_DEVTOOLS_GLOBAL_HOOK__') ||
       args[0].includes('Speech synthesis error: not-allowed') ||
       args[0].includes('Speech synthesis error: interrupted') ||
       args[0].includes('Speech synthesis error: canceled'))
    ) {
      // Suppress React 19 internal errors and speech synthesis permission errors
      return;
    }
    originalConsoleError.apply(console, args);
  };

  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('__REACT_DEVTOOLS_GLOBAL_HOOK__') ||
       args[0].includes('No voice services available') ||
       args[0].includes('Voice commands disabled') ||
       args[0].includes('Picovoice initialization failed') ||
       args[0].includes('Speech synthesis not allowed - user interaction required') ||
       args[0].includes('Speech synthesis requires user interaction first'))
    ) {
      // Suppress devtools hook warnings, voice service warnings, and speech synthesis permission warnings
      return;
    }
    originalConsoleWarn.apply(console, args);
  };
}



// Import React 19 compatibility
import { React19ErrorBoundary } from './utils/react19Compat'

// Render the app with React 19 compatibility
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <React19ErrorBoundary>
      <App />
    </React19ErrorBoundary>
  </StrictMode>,
)
