import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './responsive.css'
import './utils/axiosConfig'  // Import axios config
import { setupAllMockEndpoints } from './utils/mockEndpoints'
import App from './App.jsx'

// Check if we should use mock endpoints
const useMocks = localStorage.getItem('useMockEndpoints') === 'true';

// Initialize mock endpoints if needed
if (useMocks) {
  console.log('Using mock endpoints');
  setupAllMockEndpoints();
}

// Add a global event listener for offline mode
window.addEventListener('app:offline', (event) => {
  console.log('App is offline, setting up mock endpoints');
  setupAllMockEndpoints();
  localStorage.setItem('useMockEndpoints', 'true');
});

// Render the app
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
