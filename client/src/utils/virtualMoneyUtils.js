/**
 * Virtual Money Utilities
 *
 * This file contains utility functions for handling virtual money operations.
 * It provides a centralized place to manage virtual money data and operations.
 */

import axios from 'axios';
import API_ENDPOINTS from '../config/apiConfig';

// Default virtual money data structure
export const DEFAULT_VIRTUAL_MONEY = {
  balance: 10000,
  balanceFormatted: '₹10,000',
  lastLoginReward: null,
  portfolio: [],
  transactions: [],
  currency: 'INR',
  dayStreak: 1
};

// Cache control
let lastFetchTime = 0;
const CACHE_DURATION = 30000; // 30 seconds cache

/**
 * Get virtual money data from API or localStorage
 * @param {Object} options - Options for fetching virtual money
 * @param {boolean} options.forceRefresh - Force refresh from API
 * @param {Object} options.user - User object with id and email
 * @param {Function} options.onSuccess - Callback on successful fetch
 * @param {Function} options.onError - Callback on error
 * @returns {Promise<Object>} Virtual money data
 */
export const getVirtualMoney = async ({
  forceRefresh = false,
  user = null,
  onSuccess = null,
  onError = null
} = {}) => {
  try {
    const now = Date.now();
    const userId = user?.id;
    const shouldFetchFromApi = forceRefresh || (now - lastFetchTime > CACHE_DURATION);

    // Try to get from API if we should refresh
    if (shouldFetchFromApi) {
      try {
        const response = await axios.get(API_ENDPOINTS.VIRTUAL_MONEY.ACCOUNT, { timeout: 8000 });

        if (response.data && response.data.success) {
          const data = response.data.data;

          // Format and standardize the data
          const formattedData = formatVirtualMoneyData(data);

          // Save to localStorage
          saveVirtualMoneyToStorage(formattedData, userId);

          // Update cache timestamp
          lastFetchTime = now;

          // Call success callback if provided
          if (onSuccess) onSuccess(formattedData);

          return formattedData;
        }
      } catch (apiError) {
        console.log('Error fetching virtual money from API:', apiError.message);
        // Continue to fallback
      }
    }

    // Fallback to localStorage
    const storedData = getVirtualMoneyFromStorage(userId);
    if (storedData) {
      return storedData;
    }

    // If all else fails, return default data
    const defaultData = { ...DEFAULT_VIRTUAL_MONEY };
    saveVirtualMoneyToStorage(defaultData, userId);
    return defaultData;
  } catch (error) {
    console.error('Error in getVirtualMoney:', error);
    if (onError) onError(error);

    // Return default data in case of error
    return { ...DEFAULT_VIRTUAL_MONEY };
  }
};

/**
 * Format virtual money data to ensure consistent structure
 * @param {Object} data - Raw virtual money data
 * @returns {Object} Formatted virtual money data
 */
export const formatVirtualMoneyData = (data) => {
  // Ensure all required fields exist
  const formattedData = {
    ...DEFAULT_VIRTUAL_MONEY,
    ...data
  };

  // Ensure balance is a number
  formattedData.balance = Number(formattedData.balance) || DEFAULT_VIRTUAL_MONEY.balance;

  // Format balance for display
  formattedData.balanceFormatted = `₹${formattedData.balance.toLocaleString('en-IN')}`;

  // Ensure portfolio is an array
  formattedData.portfolio = Array.isArray(formattedData.portfolio) ? formattedData.portfolio : [];

  // Ensure transactions is an array
  formattedData.transactions = Array.isArray(formattedData.transactions) ? formattedData.transactions : [];

  return formattedData;
};

/**
 * Save virtual money data to localStorage
 * @param {Object} data - Virtual money data to save
 * @param {string} userId - Optional user ID for user-specific storage
 */
export const saveVirtualMoneyToStorage = (data, userId = null) => {
  try {
    // Save to general storage
    localStorage.setItem('virtualMoney', JSON.stringify(data));

    // If userId is provided, also save to user-specific storage
    if (userId) {
      localStorage.setItem(`virtualMoney_${userId}`, JSON.stringify(data));
    }
  } catch (error) {
    console.error('Error saving virtual money to localStorage:', error);
  }
};

/**
 * Get virtual money data from localStorage
 * @param {string} userId - Optional user ID for user-specific storage
 * @returns {Object|null} Virtual money data or null if not found
 */
export const getVirtualMoneyFromStorage = (userId = null) => {
  try {
    let storedData = null;

    // Try user-specific storage first if userId is provided
    if (userId) {
      storedData = localStorage.getItem(`virtualMoney_${userId}`);
      if (storedData) {
        return formatVirtualMoneyData(JSON.parse(storedData));
      }
    }

    // Fall back to general storage
    storedData = localStorage.getItem('virtualMoney');
    if (storedData) {
      return formatVirtualMoneyData(JSON.parse(storedData));
    }

    return null;
  } catch (error) {
    console.error('Error getting virtual money from localStorage:', error);
    return null;
  }
};

/**
 * Update virtual money data (after buy/sell operations)
 * @param {Object} newData - New virtual money data
 * @param {string} userId - Optional user ID for user-specific storage
 * @returns {Object} Updated virtual money data
 */
export const updateVirtualMoney = (newData, userId = null) => {
  const formattedData = formatVirtualMoneyData(newData);
  saveVirtualMoneyToStorage(formattedData, userId);
  return formattedData;
};

export default {
  getVirtualMoney,
  updateVirtualMoney,
  formatVirtualMoneyData,
  saveVirtualMoneyToStorage,
  getVirtualMoneyFromStorage,
  DEFAULT_VIRTUAL_MONEY
};
