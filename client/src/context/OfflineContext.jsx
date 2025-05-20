import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { getApiBaseUrl } from '../utils/urlUtils';

// Create a custom axios instance for health checks
const healthCheckAxios = axios.create();

// Create context
export const OfflineContext = createContext({
  isOffline: false, // Default to online mode
  setOfflineMode: () => {},
});

// Custom hook to use the offline context
export const useOfflineMode = () => useContext(OfflineContext);

export const OfflineProvider = ({ children }) => {
  const [isOffline, setIsOffline] = useState(false); // Default to online mode
  const [lastOnlineCheck, setLastOnlineCheck] = useState(0);

  // Function to check if the backend is available
  const checkBackendAvailability = async () => {
    try {
      // Only check every 30 seconds to avoid too many requests
      const now = Date.now();
      if (now - lastOnlineCheck < 30000 && lastOnlineCheck !== 0) {
        return;
      }

      setLastOnlineCheck(now);

      // Try to ping the backend with a timeout
      // Use the healthCheckAxios instance to avoid interceptor loop
      // Get the API URL, ensuring HTTP for localhost
      const apiUrl = getApiBaseUrl();

      const response = await healthCheckAxios.get(`${apiUrl}/api/health`, {
        timeout: 2000
      });

      if (response.status === 200) {
        if (isOffline) {
          console.log('Backend is available, switching to online mode');
          setIsOffline(false);
        }
        return;
      }
    } catch (error) {
      // Don't automatically switch to offline mode
      // Only log the error
      console.log('Backend health check failed:', error.message);

      // Only switch to offline mode if explicitly requested by the user
      // This ensures we stay in online mode by default
    }
  };

  // Set up axios interceptor to handle requests based on offline mode
  useEffect(() => {
    // Add request interceptor
    const interceptorId = axios.interceptors.request.use(
      (config) => {
        // Skip interceptor for health check requests
        if (config.url && config.url.includes('/api/health')) {
          return config;
        }

        // If we're in offline mode, reject the request
        if (isOffline) {
          // Create a custom error
          const error = new Error('Application is in offline mode');
          error.isOfflineError = true;

          // Log the skipped request
          console.log(`Axios interceptor: Blocking request to ${config.url} in offline mode`);

          // Reject the request
          return Promise.reject(error);
        }

        // Otherwise proceed with the request
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Clean up interceptor on unmount
    return () => {
      axios.interceptors.request.eject(interceptorId);
    };
  }, [isOffline]);

  // Listen for offline events from axios interceptors
  useEffect(() => {
    const handleOfflineEvent = (event) => {
      // Log the event but don't automatically switch to offline mode
      console.log('Received offline event:', event.detail?.error?.message || 'Network error');

      // We could show a toast notification here to inform the user
      // that there might be connectivity issues

      // Dispatch a custom event that components can listen for to show a notification
      // but don't automatically switch to offline mode
      const networkErrorEvent = new CustomEvent('app:network-error', {
        detail: { error: event.detail?.error, message: 'Server connection issue detected. Switch to offline mode?' }
      });
      window.dispatchEvent(networkErrorEvent);
    };

    // Add event listener
    window.addEventListener('app:offline', handleOfflineEvent);

    // Clean up
    return () => {
      window.removeEventListener('app:offline', handleOfflineEvent);
    };
  }, [isOffline]);

  // Check backend availability on mount and periodically
  useEffect(() => {
    // Initial check
    checkBackendAvailability();

    // Set up interval to check periodically
    const intervalId = setInterval(checkBackendAvailability, 30000);

    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [isOffline]);

  // Function to manually set offline mode
  const setOfflineMode = (offline) => {
    setIsOffline(offline);

    // If switching to online mode, check if backend is actually available
    if (!offline) {
      checkBackendAvailability();
    }
  };

  return (
    <OfflineContext.Provider value={{ isOffline, setOfflineMode }}>
      {children}
    </OfflineContext.Provider>
  );
};
