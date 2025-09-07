/**
 * Financial Modeling Prep (FMP) API Service
 * Direct integration with FMP API for real-time stock data and charts
 */

import axios from 'axios';
import { mockFMPAPI } from './mockData'; // Assuming mockData.js exists

const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';
const API_KEYS = [
  import.meta.env.VITE_FMP_API_KEY_PRIMARY,
  import.meta.env.VITE_FMP_API_KEY_SECONDARY,
  import.meta.env.VITE_FMP_API_KEY_TERTIARY,
  import.meta.env.VITE_FMP_API_KEY_FALLBACK
].filter(Boolean);

// State for API key management
let currentKeyIndex = 0;
const failedApiKeys = new Set();
let FMP_API_KEY = API_KEYS[currentKeyIndex];

if (API_KEYS.length === 0) {
  console.warn('⚠️ No FMP API keys found. Using mock data for all requests.');
} else {
  console.log(`✅ FMP API initialized with ${API_KEYS.length} API key(s)`);
}

// Create axios instance for FMP API
const fmpAPI = axios.create({
  baseURL: FMP_BASE_URL,
  timeout: 10000,
});

// Generic FMP request handler with key rotation and fallback
const makeFmpRequest = async (path, params = {}) => {
  if (!API_KEYS.length || failedApiKeys.size === API_KEYS.length) {
    console.warn(`⚠️ All API keys failed or missing. Falling back to mock data for ${path}`);
    throw new Error('All API keys failed'); // Throw error to trigger mock fallback
  }

  for (let i = 0; i < API_KEYS.length; i++) {
    FMP_API_KEY = API_KEYS[currentKeyIndex];
    if (failedApiKeys.has(FMP_API_KEY)) {
      currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
      FMP_API_KEY = API_KEYS[currentKeyIndex];
      continue;
    }

    try {
      console.log(`🔄 FMP API Request: GET ${path} (Key ${currentKeyIndex + 1}/${API_KEYS.length})`);
      const response = await fmpAPI.get(path, { params: { ...params, apikey: FMP_API_KEY } });
      console.log(`✅ FMP API Response: ${path} - ${response.status}`);
      return response.data;
    } catch (error) {
      const status = error.response?.status;
      const isRateLimitOrInvalid = status === 429 || status === 403 || status === 401;

      console.warn(`🚫 FMP API Error for path ${path}: Status ${status}, Message: ${error.message}`);

      if (isRateLimitOrInvalid) {
        failedApiKeys.add(FMP_API_KEY);
        console.warn(`❌ API key marked as failed: ${FMP_API_KEY.substring(0, 8)}...`);
      }

      currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
      if (failedApiKeys.size === API_KEYS.length) {
        console.warn('⚠️ All API keys exhausted. Initiating mock fallback.');
        break; // Exit loop and proceed to mock fallback
      }
    }
  }
  throw new Error('All API keys failed or exhausted.');
};

/**
 * Stock Search and Data Services
 * All functions now use the makeFmpRequest helper
 */
const fmpStockAPI = {
  searchStocks: async (query, limit = 10) => {
    try {
      const data = await makeFmpRequest('/search', { query, limit });
      if (!Array.isArray(data)) throw new Error('Invalid response format');
      return { success: true, results: data, total: data.length };
    } catch (error) {
      console.log('⚠️ Falling back to mock data for search.');
      return await mockFMPAPI.searchStocks(query, limit);
    }
  },

  getStockQuote: async (symbol) => {
    try {
      const data = await makeFmpRequest(`/quote/${symbol}`);
      return { success: true, data: data[0] };
    } catch (error) {
      console.log(`⚠️ Falling back to mock data for quote: ${symbol}`);
      return await mockFMPAPI.getStockQuote(symbol);
    }
  },

  getMultipleQuotes: async (symbols) => {
    const symbolsString = Array.isArray(symbols) ? symbols.join(',') : symbols;
    try {
      const data = await makeFmpRequest(`/quote/${symbolsString}`);
      return { success: true, data };
    } catch (error) {
      console.log('⚠️ Falling back to mock data for multiple quotes.');
      return { success: false, data: [] };
    }
  },

  getStockProfile: async (symbol) => {
    try {
      const data = await makeFmpRequest(`/profile/${symbol}`);
      if (!data[0]) throw new Error('Company profile not found');
      return { success: true, data: data[0] };
    } catch (error) {
      console.log(`⚠️ Falling back to mock data for profile: ${symbol}`);
      return await mockFMPAPI.getStockProfile(symbol);
    }
  },
};

/**
 * Chart Data Services
 */
export const fmpChartAPI = {
  getHistoricalData: async (symbol, period = '1D') => {
    // Note: FMP's API often requires a different endpoint for different periods.
    // This is a simplified example; a real implementation would handle different paths.
    try {
      const data = await makeFmpRequest(`/historical-price-full/${symbol}`, { serietype: 'line' });
      return { success: true, data: data.historical, symbol };
    } catch (error) {
      console.log(`⚠️ Falling back to mock data for historical data: ${symbol} (${period})`);
      return await mockFMPAPI.getHistoricalData(symbol, period);
    }
  },

  getIntradayData: async (symbol, interval = '1min') => {
    try {
      const data = await makeFmpRequest(`/historical-chart/${interval}/${symbol}`);
      return { success: true, data: data.reverse(), symbol, interval };
    } catch (error) {
      console.error('FMP Intraday data error:', error);
      return { success: false, data: [] };
    }
  }
};

/**
 * Market Data Services
 */
export const fmpMarketAPI = {
  getGainers: async (limit = 10) => {
    try {
      const data = await makeFmpRequest('/gainers', { limit });
      return { success: true, data };
    } catch (error) {
      console.warn('FMP Gainers failed, using mock data:', error.message);
      return await mockFMPAPI.getGainers(limit);
    }
  },

  getLosers: async (limit = 10) => {
    try {
      const data = await makeFmpRequest('/losers', { limit });
      return { success: true, data };
    } catch (error) {
      console.error('FMP Losers error:', error);
      return { success: false, data: [] };
    }
  },

  getMarketNews: async (limit = 20) => {
    try {
      const data = await makeFmpRequest('/stock_news', { limit });
      return { success: true, data };
    } catch (error) {
      console.error('FMP Market news error:', error);
      return { success: false, data: [] };
    }
  }
};

export { fmpStockAPI };

export default {
  stock: fmpStockAPI,
  chart: fmpChartAPI,
  market: fmpMarketAPI
};