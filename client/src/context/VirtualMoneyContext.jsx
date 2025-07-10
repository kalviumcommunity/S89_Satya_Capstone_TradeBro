import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import {
  getVirtualMoney,
  updateVirtualMoney as updateVirtualMoneyUtil,
  DEFAULT_VIRTUAL_MONEY
} from '../utils/virtualMoneyUtils';

// Create context
const VirtualMoneyContext = createContext();

// Create provider component
export const VirtualMoneyProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const { success, error, info } = useToast();
  const [virtualMoney, setVirtualMoney] = useState(DEFAULT_VIRTUAL_MONEY);
  const [loading, setLoading] = useState(true);
  const fetchInProgress = useRef(false);
  const lastFetchTime = useRef(0);

  // Minimum time between fetches to prevent excessive API calls
  const MIN_FETCH_INTERVAL = 10000; // 10 seconds

  // Function to fetch virtual money data
  const fetchVirtualMoney = React.useCallback(async (forceRefresh = false) => {
    // Don't fetch if not authenticated
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    // Prevent concurrent fetches and throttle requests
    const now = Date.now();
    if (
      fetchInProgress.current ||
      (!forceRefresh && now - lastFetchTime.current < MIN_FETCH_INTERVAL)
    ) {
      return;
    }

    fetchInProgress.current = true;
    setLoading(true);

    try {
      const data = await getVirtualMoney({
        forceRefresh,
        user,
        onSuccess: (data) => {
          lastFetchTime.current = now;
        },
        onError: (error) => {
          console.error("Error fetching virtual money:", error);
          error("Could not fetch virtual money data");
        }
      });

      setVirtualMoney(data);
    } finally {
      setLoading(false);
      fetchInProgress.current = false;
    }
  }, [isAuthenticated, user]);

  // Function to update virtual money after buy/sell operations
  const updateVirtualMoney = (newData) => {
    const updatedData = updateVirtualMoneyUtil(newData, user?.id);
    setVirtualMoney(updatedData);
  };

  // Fetch virtual money data on mount and when authentication status changes
  useEffect(() => {
    // Only fetch if authenticated to avoid unnecessary API calls
    if (isAuthenticated) {
      fetchVirtualMoney(true); // Force refresh when auth status changes
    }
  }, [isAuthenticated, user?.id]); // Only depend on user ID, not the entire user object

  // Refresh virtual money data every 2 minutes if the app is active
  useEffect(() => {
    if (!isAuthenticated) return;

    // Set up interval for periodic refresh
    const intervalId = setInterval(() => {
      // Only fetch if the document is visible (user is active)
      if (document.visibilityState === 'visible') {
        fetchVirtualMoney();
      }
    }, 2 * 60 * 1000); // 2 minutes

    // Set up visibility change listener to fetch when user returns to the app
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchVirtualMoney();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Clean up
    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated]);

  return (
    <VirtualMoneyContext.Provider
      value={{
        virtualMoney,
        updateVirtualMoney,
        fetchVirtualMoney,
        loading
      }}
    >
      {children}
    </VirtualMoneyContext.Provider>
  );
};

// Custom hook to use the virtual money context
export const useVirtualMoney = () => {
  const context = useContext(VirtualMoneyContext);
  if (!context) {
    throw new Error('useVirtualMoney must be used within a VirtualMoneyProvider');
  }
  return context;
};

export default VirtualMoneyContext;
