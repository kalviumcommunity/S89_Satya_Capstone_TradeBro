/**
 * API Tester Utility
 * 
 * This utility can be used to test API endpoints and verify connectivity.
 * It provides functions to test various API endpoints and report their status.
 */

import axios from './axiosConfig';
import API_ENDPOINTS from '../config/apiConfig';

// Test the health endpoint
export const testHealthEndpoint = async () => {
  try {
    const response = await axios.get(API_ENDPOINTS.HEALTH);
    console.log('Health endpoint response:', response.data);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Health endpoint error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

// Test the settings endpoint
export const testSettingsEndpoint = async () => {
  try {
    const response = await axios.get(API_ENDPOINTS.SETTINGS.BASE);
    console.log('Settings endpoint response:', response.data);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Settings endpoint error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

// Test the watchlist endpoint
export const testWatchlistEndpoint = async () => {
  try {
    const response = await axios.get(API_ENDPOINTS.WATCHLIST.STOCKS);
    console.log('Watchlist endpoint response:', response.data);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Watchlist endpoint error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

// Test the virtual money endpoint
export const testVirtualMoneyEndpoint = async () => {
  try {
    const response = await axios.get(API_ENDPOINTS.VIRTUAL_MONEY.ACCOUNT);
    console.log('Virtual money endpoint response:', response.data);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Virtual money endpoint error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

// Test the orders endpoint
export const testOrdersEndpoint = async () => {
  try {
    const response = await axios.get(API_ENDPOINTS.ORDERS.ALL);
    console.log('Orders endpoint response:', response.data);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Orders endpoint error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

// Test all endpoints
export const testAllEndpoints = async () => {
  const results = {
    health: await testHealthEndpoint(),
    settings: await testSettingsEndpoint(),
    watchlist: await testWatchlistEndpoint(),
    virtualMoney: await testVirtualMoneyEndpoint(),
    orders: await testOrdersEndpoint()
  };

  console.log('API Test Results:', results);
  
  // Calculate overall status
  const overallSuccess = Object.values(results).every(result => result.success);
  
  return {
    success: overallSuccess,
    results
  };
};

export default {
  testHealthEndpoint,
  testSettingsEndpoint,
  testWatchlistEndpoint,
  testVirtualMoneyEndpoint,
  testOrdersEndpoint,
  testAllEndpoints
};
