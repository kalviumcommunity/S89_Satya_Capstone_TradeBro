import axios from 'axios';
import { API_ENDPOINTS } from '../config/apiConfig';

/**
 * Fetch 5-minute chart data for a given symbol
 * @param {string} symbol - Stock symbol
 * @returns {Promise<Object>} - Chart data
 */
export const fetch5MinChartData = async (symbol) => {
  try {
    const response = await axios.get(API_ENDPOINTS.CHARTS.FIVE_MIN(symbol));
    
    if (response.data && response.data.success) {
      return {
        success: true,
        source: response.data.source,
        data: response.data.data,
        message: response.data.message
      };
    } else {
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error(`Error fetching 5-minute chart data for ${symbol}:`, error);
    
    // Return empty data
    return {
      success: false,
      source: 'error',
      data: [],
      message: error.message
    };
  }
};

/**
 * Format chart data for different time periods
 * @param {Array} data - Raw chart data
 * @param {string} period - Time period ('1d', '1w', '1m', '1y')
 * @returns {Array} - Filtered chart data
 */
export const filterChartDataByPeriod = (data, period) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return [];
  }
  
  const now = new Date().getTime();
  let cutoffTime;
  
  switch (period) {
    case '1d':
      // Last 24 hours
      cutoffTime = now - (24 * 60 * 60 * 1000);
      break;
    case '1w':
      // Last 7 days
      cutoffTime = now - (7 * 24 * 60 * 60 * 1000);
      break;
    case '1m':
      // Last 30 days
      cutoffTime = now - (30 * 24 * 60 * 60 * 1000);
      break;
    case '1y':
      // Last 365 days
      cutoffTime = now - (365 * 24 * 60 * 60 * 1000);
      break;
    default:
      // Return all data
      return data;
  }
  
  return data.filter(candle => candle.time >= cutoffTime);
};

/**
 * Calculate chart statistics
 * @param {Array} data - Chart data
 * @returns {Object} - Statistics
 */
export const calculateChartStatistics = (data) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return {
      open: 0,
      close: 0,
      high: 0,
      low: 0,
      change: 0,
      changePercent: 0
    };
  }
  
  // Sort data by time
  const sortedData = [...data].sort((a, b) => a.time - b.time);
  
  // Get first and last candles
  const firstCandle = sortedData[0];
  const lastCandle = sortedData[sortedData.length - 1];
  
  // Calculate high and low
  const high = Math.max(...sortedData.map(candle => candle.high));
  const low = Math.min(...sortedData.map(candle => candle.low));
  
  // Calculate change and change percent
  const change = lastCandle.close - firstCandle.open;
  const changePercent = (change / firstCandle.open) * 100;
  
  return {
    open: firstCandle.open,
    close: lastCandle.close,
    high,
    low,
    change,
    changePercent
  };
};

export default {
  fetch5MinChartData,
  filterChartDataByPeriod,
  calculateChartStatistics
};
