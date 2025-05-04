import axios from 'axios';
import { API_ENDPOINTS } from '../config/apiConfig';

/**
 * Makes an API call with fallback to dummy data if the call fails
 * @param {Object} options - API call options
 * @param {string} options.method - HTTP method (get, post, put, delete)
 * @param {string} options.url - API endpoint (can be a full URL or a path relative to the base URL)
 * @param {Object} options.data - Request data (for POST, PUT)
 * @param {Object} options.params - URL parameters (for GET)
 * @param {Function} options.fallbackData - Function to provide fallback data if API call fails
 * @param {number} options.timeout - Request timeout in milliseconds
 * @returns {Promise} - API response or fallback data
 */
export const safeApiCall = async ({
  method = 'get',
  url,
  data = {},
  params = {},
  fallbackData = () => null,
  timeout = 3000,
}) => {
  try {
    // Create a controller for the request
    const controller = new AbortController();

    // Set up a timeout that will abort the request
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeout);

    try {
      // Make the API call with a timeout and abort controller
      const response = await axios({
        method,
        url,
        data,
        params,
        timeout,
        signal: controller.signal
      });

      // Clear the timeout since the request completed successfully
      clearTimeout(timeoutId);

      return response.data;
    } catch (axiosError) {
      // Clear the timeout to prevent memory leaks
      clearTimeout(timeoutId);

      // Re-throw the error to be caught by the outer try-catch
      throw axiosError;
    }
  } catch (error) {
    // Log the specific error type for better debugging
    if (error.name === 'AbortError' || error.code === 'ECONNABORTED') {
      console.warn(`API call to ${url} timed out after ${timeout}ms`);
    } else if (error.response) {
      console.error(`API call to ${url} failed with status ${error.response.status}:`, error.message);
    } else if (error.request) {
      console.error(`API call to ${url} failed (no response):`, error.message);
    } else {
      console.error(`API call to ${url} failed:`, error.message);
    }

    // Special handling for reward-status endpoint
    if (url && url.includes('/api/virtual-money/reward-status')) {
      console.log('Special handling for reward-status endpoint');

      try {
        // Get user info
        const userEmail = localStorage.getItem('userEmail') || 'user@example.com';
        const userName = localStorage.getItem('userName') || 'User';
        const userFullName = localStorage.getItem('userFullName') || userName;

        // Check if user has already claimed reward today
        const lastReward = localStorage.getItem('lastRewardClaim');
        const today = new Date().setHours(0, 0, 0, 0);

        if (lastReward && new Date(parseInt(lastReward)).setHours(0, 0, 0, 0) === today) {
          // Already claimed today
          console.log('Reward already claimed today (apiUtils fallback)');

          // Calculate time remaining until next reward
          const now = new Date();
          const tomorrow = new Date(now);
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(0, 0, 0, 0);

          const minutesRemaining = Math.ceil((tomorrow - now) / (1000 * 60));
          const hoursRemaining = Math.floor(minutesRemaining / 60);
          const mins = minutesRemaining % 60;

          return {
            success: true,
            canClaim: false,
            message: `Hi ${userFullName}, you've already claimed your daily reward.`,
            timeRemaining: {
              hours: hoursRemaining,
              minutes: mins,
              totalMinutes: minutesRemaining
            },
            nextRewardTime: tomorrow.toISOString(),
            isFallbackData: true
          };
        } else {
          // Can claim reward
          return {
            success: true,
            canClaim: true,
            message: `Hi ${userFullName}, you can claim your daily reward!`,
            timeRemaining: {
              hours: 0,
              minutes: 0,
              totalMinutes: 0
            },
            isFallbackData: true
          };
        }
      } catch (fallbackError) {
        console.error('Error in reward status special handling:', fallbackError);
        // Continue to regular fallback handling
      }
    }

    // Use fallback data for any API error
    const dummyData = fallbackData();
    if (dummyData) {
      console.log('Using fallback data due to API error:', dummyData);

      // If dummyData is already in the expected format, return it directly
      if (dummyData.success !== undefined) {
        dummyData.isFallbackData = true;
        return dummyData;
      }

      // Otherwise, wrap it in a success response
      return {
        success: true,
        data: dummyData,
        isFallbackData: true
      };
    }
    return {
      success: false,
      message: 'API call failed and no fallback data available',
      isFallbackData: true
    };
  }
};

/**
 * Creates dummy data for API fallback
 * @param {Object} dummyData - Dummy data to return
 * @returns {Function} - Function that returns the dummy data
 */
export const createDummyData = (dummyData) => {
  return () => {
    console.log('Using dummy data as API fallback:', dummyData);
    return {
      success: true,
      data: dummyData,
      isFallbackData: true,
    };
  };
};

/**
 * Alias for createDummyData for backward compatibility
 * @param {Object} mockData - Mock data to return
 * @returns {Function} - Function that returns the mock data
 */
export const createMockResponse = createDummyData;
