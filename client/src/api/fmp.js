import axios from 'axios';
import { API_BASE_URL } from '../config/apiConfig';

// FMP API configuration
const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';
const FMP_API_KEY = import.meta.env.VITE_FMP_API_KEY || 'VCMjfaz3k5CjRqbLvtpMALKTks5YVLxx';

// Create axios instance for FMP API
const fmpApi = axios.create({
  baseURL: FMP_BASE_URL,
  timeout: 10000,
});

// Add API key to all requests
fmpApi.interceptors.request.use((config) => {
  config.params = {
    ...config.params,
    apikey: FMP_API_KEY,
  };
  return config;
});

// Error handling interceptor
fmpApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('FMP API Error:', error.message);
    throw error;
  }
);

/**
 * Fetch real-time stock quote
 * @param {string} symbol - Stock symbol (e.g., 'AAPL')
 * @returns {Promise<Object>} Stock quote data
 */
export const fetchStockQuote = async (symbol) => {
  try {
    // Try proxy endpoint first for better caching and error handling
    const proxyResponse = await axios.get(`${API_BASE_URL}/api/proxy/fmp/quote/${symbol}`);
    if (proxyResponse.data && proxyResponse.data.length > 0) {
      return proxyResponse.data[0];
    }
  } catch (proxyError) {
    console.warn('Proxy endpoint failed, trying direct FMP API:', proxyError.message);
  }

  // Fallback to direct FMP API
  try {
    const response = await fmpApi.get(`/quote/${symbol}`);
    return response.data[0];
  } catch (error) {
    console.error('Failed to fetch stock quote:', error);
    throw new Error(`Failed to fetch quote for ${symbol}`);
  }
};

/**
 * Fetch historical chart data for different time intervals
 * @param {string} symbol - Stock symbol
 * @param {string} interval - Time interval ('1min', '5min', '15min', '30min', '1hour', '4hour')
 * @param {number} limit - Number of data points to fetch (default: 100)
 * @returns {Promise<Array>} Array of OHLCV data
 */
export const fetchHistoricalChart = async (symbol, interval = '1min', limit = 100) => {
  try {
    console.log(`Fetching chart data for ${symbol} with interval ${interval}`);

    // Validate symbol
    if (!symbol || typeof symbol !== 'string' || symbol.trim().length === 0) {
      console.warn('Invalid symbol provided, generating mock data');
      return generateMockChartData('UNKNOWN', limit);
    }

    const cleanSymbol = symbol.trim().toUpperCase();

    // Try proxy endpoint first
    const proxyResponse = await axios.get(`${API_BASE_URL}/api/proxy/fmp/stock/chart/${interval}/${cleanSymbol}`, {
      timeout: 8000 // 8 second timeout
    });

    if (proxyResponse.data && Array.isArray(proxyResponse.data) && proxyResponse.data.length > 0) {
      console.log(`Successfully fetched ${proxyResponse.data.length} data points from proxy for ${cleanSymbol}`);
      return proxyResponse.data.slice(0, limit);
    }
  } catch (proxyError) {
    console.warn(`Proxy endpoint failed for ${symbol}:`, proxyError.message);

    // For 404 errors or any proxy errors, immediately fall back to mock data
    console.log(`Generating mock data for ${symbol} due to proxy failure`);
    return generateMockChartData(symbol, limit);
  }

  // If proxy didn't return data but didn't error, try direct API
  try {
    console.log(`Trying direct FMP API for ${symbol}`);
    const response = await fmpApi.get(`/historical-chart/${interval}/${symbol}`, {
      timeout: 8000
    });
    const data = response.data || [];

    if (data.length > 0) {
      console.log(`Successfully fetched ${data.length} data points from direct API for ${symbol}`);
      // Format data for charts
      return data.slice(0, limit).map(item => ({
        time: new Date(item.date).getTime() / 1000, // Convert to UNIX timestamp in seconds
        open: parseFloat(item.open),
        high: parseFloat(item.high),
        low: parseFloat(item.low),
        close: parseFloat(item.close),
        volume: parseInt(item.volume || 0),
      })).sort((a, b) => a.time - b.time); // Sort by time ascending
    }
  } catch (error) {
    console.warn(`Direct FMP API also failed for ${symbol}:`, error.message);
  }

  // Final fallback to mock data
  console.log(`All endpoints failed for ${symbol}, generating mock data`);
  return generateMockChartData(symbol, limit);
};

/**
 * Fetch daily historical data
 * @param {string} symbol - Stock symbol
 * @param {number} days - Number of days to fetch (default: 30)
 * @returns {Promise<Array>} Array of daily OHLCV data
 */
export const fetchDailyChart = async (symbol, days = 30) => {
  try {
    const response = await fmpApi.get(`/historical-price-full/${symbol}`, {
      params: { timeseries: days }
    });
    
    const historical = response.data?.historical || [];
    
    // Format data for TradingView Lightweight Charts
    return historical.map(item => ({
      time: new Date(item.date).getTime() / 1000, // Convert to UNIX timestamp in seconds
      open: parseFloat(item.open),
      high: parseFloat(item.high),
      low: parseFloat(item.low),
      close: parseFloat(item.close),
      volume: parseInt(item.volume || 0),
    })).sort((a, b) => a.time - b.time); // Sort by time ascending
  } catch (error) {
    console.error('Failed to fetch daily chart data:', error);
    throw new Error(`Failed to fetch daily chart data for ${symbol}`);
  }
};

/**
 * Generate mock data for testing when API is unavailable
 * @param {string} symbol - Stock symbol
 * @param {number} points - Number of data points
 * @returns {Array} Mock OHLCV data
 */
export const generateMockChartData = (symbol, points = 100) => {
  console.log(`Generating mock chart data for ${symbol} with ${points} points`);

  const data = [];
  const now = Date.now();

  // Generate symbol-specific base price for consistency
  let basePrice = 100;
  if (symbol && typeof symbol === 'string') {
    const symbolHash = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    basePrice = 50 + (symbolHash % 950); // Price between 50-1000 based on symbol
  } else {
    basePrice = 100 + Math.random() * 400; // Random base price between 100-500
  }

  let currentPrice = basePrice;
  const volatility = 0.02 + Math.random() * 0.03; // Volatility between 2%-5%

  for (let i = points - 1; i >= 0; i--) {
    const time = Math.floor((now - (i * 60 * 1000)) / 1000); // 1-minute intervals

    // Generate realistic price movement with trend
    const trendFactor = Math.sin(i / 20) * 0.001; // Small trend component
    const change = (Math.random() - 0.5) * volatility * currentPrice + trendFactor * currentPrice;
    currentPrice = Math.max(1, currentPrice + change);

    const open = currentPrice;
    const close = currentPrice + (Math.random() - 0.5) * volatility * currentPrice * 0.5;
    const high = Math.max(open, close) + Math.random() * volatility * currentPrice * 0.3;
    const low = Math.min(open, close) - Math.random() * volatility * currentPrice * 0.3;
    const volume = Math.floor(Math.random() * 2000000) + 100000;
    
    data.push({
      time,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume,
    });
  }
  
  const sortedData = data.sort((a, b) => a.time - b.time);
  console.log(`Generated ${sortedData.length} mock data points for ${symbol}`);
  return sortedData;
};

/**
 * Calculate Simple Moving Average
 * @param {Array} data - OHLCV data array
 * @param {number} period - SMA period (default: 14)
 * @returns {Array} SMA data points
 */
export const calculateSMA = (data, period = 14) => {
  const smaData = [];
  
  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const average = slice.reduce((sum, item) => sum + item.close, 0) / period;
    
    smaData.push({
      time: data[i].time,
      value: parseFloat(average.toFixed(2)),
    });
  }
  
  return smaData;
};

export default {
  fetchStockQuote,
  fetchHistoricalChart,
  fetchDailyChart,
  generateMockChartData,
  calculateSMA,
};
