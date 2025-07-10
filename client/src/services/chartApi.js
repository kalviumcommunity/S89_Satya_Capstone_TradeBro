/**
 * Chart API Service for Financial Modeling Prep (FMP) Integration
 * Handles all chart-related API calls with error handling and caching
 */

import axios from 'axios';

class ChartApiService {
  constructor() {
    this.baseURL = 'https://financialmodelingprep.com/api/v3';
    this.apiKey = import.meta.env.VITE_FMP_API_KEY || 'demo';
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache

    if (this.apiKey === 'demo' || !this.apiKey) {
      console.warn('⚠️ Using demo API key. Get a free key from https://financialmodelingprep.com/developer/docs');
    } else {
      console.log('📊 Chart API Service initialized with FMP API');
    }
  }

  /**
   * Create axios instance with default config
   */
  createApiInstance() {
    return axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      params: {
        apikey: this.apiKey
      }
    });
  }

  /**
   * Get cache key for request
   */
  getCacheKey(endpoint, params = {}) {
    return `${endpoint}_${JSON.stringify(params)}`;
  }

  /**
   * Check if cached data is still valid
   */
  isCacheValid(cacheEntry) {
    return Date.now() - cacheEntry.timestamp < this.cacheTimeout;
  }

  /**
   * Generic API call with caching
   */
  async makeApiCall(endpoint, params = {}, useCache = true) {
    const cacheKey = this.getCacheKey(endpoint, params);
    
    // Check cache first
    if (useCache && this.cache.has(cacheKey)) {
      const cacheEntry = this.cache.get(cacheKey);
      if (this.isCacheValid(cacheEntry)) {
        console.log(`📦 Cache hit for ${endpoint}`);
        return cacheEntry.data;
      }
    }

    try {
      const api = this.createApiInstance();
      console.log(`🌐 API call: ${endpoint}`, params);
      
      const response = await api.get(endpoint, { params });
      
      if (response.data && response.data.length === 0) {
        throw new Error('No data available for this symbol');
      }

      // Cache the response
      if (useCache) {
        this.cache.set(cacheKey, {
          data: response.data,
          timestamp: Date.now()
        });
      }

      return response.data;
    } catch (error) {
      console.error(`❌ API Error for ${endpoint}:`, error);
      
      if (error.response?.status === 429) {
        throw new Error('API rate limit exceeded. Please try again later.');
      } else if (error.response?.status === 401) {
        throw new Error('Invalid API key. Please check your FMP API configuration.');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout. Please check your internet connection.');
      } else if (error.message.includes('No data available')) {
        throw error;
      } else {
        throw new Error('Failed to fetch data. Please try again.');
      }
    }
  }

  /**
   * Get current stock quote
   */
  async getStockQuote(symbol) {
    try {
      const data = await this.makeApiCall(`/quote/${symbol.toUpperCase()}`);

      if (!data || data.length === 0) {
        throw new Error(`No quote data found for ${symbol}`);
      }

      const quote = data[0];
      return {
        symbol: quote.symbol,
        name: quote.name,
        price: quote.price,
        change: quote.change,
        changesPercentage: quote.changesPercentage,
        dayLow: quote.dayLow,
        dayHigh: quote.dayHigh,
        yearHigh: quote.yearHigh,
        yearLow: quote.yearLow,
        marketCap: quote.marketCap,
        volume: quote.volume,
        avgVolume: quote.avgVolume,
        open: quote.open,
        previousClose: quote.previousClose,
        timestamp: quote.timestamp || Date.now()
      };
    } catch (error) {
      console.error('Error fetching stock quote:', error);
      // Return fallback data for demo purposes
      return this.getFallbackQuoteData(symbol);
    }
  }

  /**
   * Get historical price data
   */
  async getHistoricalData(symbol, period = '1Y') {
    try {
      let endpoint;
      let params = {};

      // Determine endpoint based on period
      switch (period) {
        case '1D':
          endpoint = `/historical-chart/1min/${symbol.toUpperCase()}`;
          break;
        case '5D':
          endpoint = `/historical-chart/5min/${symbol.toUpperCase()}`;
          break;
        case '1M':
          endpoint = `/historical-chart/1hour/${symbol.toUpperCase()}`;
          break;
        case '3M':
        case '6M':
          endpoint = `/historical-chart/4hour/${symbol.toUpperCase()}`;
          break;
        case '1Y':
        case 'MAX':
        default:
          endpoint = `/historical-price-full/${symbol.toUpperCase()}`;
          params.serietype = 'line';
          break;
      }

      const data = await this.makeApiCall(endpoint, params);

      if (!data || (Array.isArray(data) && data.length === 0)) {
        throw new Error(`No historical data found for ${symbol}`);
      }

      // Handle different response formats
      let historicalData;
      if (data.historical) {
        // Full historical data response
        historicalData = data.historical;
      } else if (Array.isArray(data)) {
        // Chart data response
        historicalData = data;
      } else {
        throw new Error('Unexpected data format');
      }

      // Transform data for chart consumption
      return this.transformHistoricalData(historicalData, period);
    } catch (error) {
      console.error('Error fetching historical data:', error);
      // Return fallback data for demo purposes
      return this.getFallbackHistoricalData(symbol, period);
    }
  }

  /**
   * Transform historical data for chart consumption
   */
  transformHistoricalData(data, period) {
    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }

    // Sort by date (oldest first)
    const sortedData = data.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Apply period-specific filtering
    const filteredData = this.filterDataByPeriod(sortedData, period);

    // Transform to chart format
    return filteredData.map(item => ({
      time: this.formatTimeForChart(item.date),
      open: parseFloat(item.open) || 0,
      high: parseFloat(item.high) || 0,
      low: parseFloat(item.low) || 0,
      close: parseFloat(item.close) || 0,
      volume: parseInt(item.volume) || 0,
      date: item.date
    }));
  }

  /**
   * Filter data based on selected period
   */
  filterDataByPeriod(data, period) {
    const now = new Date();
    let cutoffDate;

    switch (period) {
      case '1D':
        cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '5D':
        cutoffDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
        break;
      case '1M':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '3M':
        cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '6M':
        cutoffDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        break;
      case '1Y':
        cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case 'MAX':
      default:
        return data; // Return all data
    }

    return data.filter(item => new Date(item.date) >= cutoffDate);
  }

  /**
   * Format time for chart library
   */
  formatTimeForChart(dateString) {
    const date = new Date(dateString);
    return Math.floor(date.getTime() / 1000); // Unix timestamp in seconds
  }

  /**
   * Search for stocks
   */
  async searchStocks(query) {
    try {
      if (!query || query.length < 2) {
        return [];
      }

      const data = await this.makeApiCall(`/search`, { query: query.toUpperCase(), limit: 10 });

      if (!Array.isArray(data)) {
        return [];
      }

      return data.map(item => ({
        symbol: item.symbol,
        name: item.name,
        currency: item.currency,
        stockExchange: item.stockExchange,
        exchangeShortName: item.exchangeShortName
      }));
    } catch (error) {
      console.error('Error searching stocks:', error);
      return [];
    }
  }

  /**
   * Get market movers (gainers/losers)
   */
  async getMarketMovers(type = 'gainers') {
    try {
      const endpoint = type === 'gainers' ? '/stock_market/gainers' : '/stock_market/losers';
      const data = await this.makeApiCall(endpoint);

      return data.slice(0, 10).map(item => ({
        symbol: item.symbol,
        name: item.name,
        change: item.change,
        changesPercentage: item.changesPercentage,
        price: item.price
      }));
    } catch (error) {
      console.error('Error fetching market movers:', error);
      return [];
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    console.log('📦 Cache cleared');
  }

  /**
   * Get cache stats
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Fallback data methods for when API is not available
   */
  getFallbackQuoteData(symbol) {
    const basePrice = this.getBasePriceForSymbol(symbol);
    const change = (Math.random() - 0.5) * 100;
    const changesPercentage = (change / basePrice) * 100;

    return {
      symbol: symbol.toUpperCase(),
      name: this.getCompanyName(symbol),
      price: parseFloat(basePrice.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changesPercentage: parseFloat(changesPercentage.toFixed(2)),
      dayLow: parseFloat((basePrice * 0.98).toFixed(2)),
      dayHigh: parseFloat((basePrice * 1.02).toFixed(2)),
      yearHigh: parseFloat((basePrice * 1.3).toFixed(2)),
      yearLow: parseFloat((basePrice * 0.7).toFixed(2)),
      marketCap: Math.floor(Math.random() * 500000000000) + 50000000000,
      volume: Math.floor(Math.random() * 10000000) + 1000000,
      avgVolume: Math.floor(Math.random() * 8000000) + 800000,
      open: parseFloat((basePrice * (1 + (Math.random() - 0.5) * 0.02)).toFixed(2)),
      previousClose: parseFloat((basePrice - change).toFixed(2)),
      timestamp: Date.now()
    };
  }

  getBasePriceForSymbol(symbol) {
    const basePrices = {
      'TCS': 3500,
      'INFY': 1800,
      'RELIANCE': 2800,
      'HDFCBANK': 1600,
      'ICICIBANK': 1200,
      'SBIN': 800,
      'BHARTIARTL': 1100,
      'ITC': 450,
      'KOTAKBANK': 1700,
      'LT': 3200
    };

    return basePrices[symbol.toUpperCase()] || 1000 + Math.random() * 2000;
  }

  getCompanyName(symbol) {
    const companyNames = {
      'TCS': 'Tata Consultancy Services Limited',
      'INFY': 'Infosys Limited',
      'RELIANCE': 'Reliance Industries Limited',
      'HDFCBANK': 'HDFC Bank Limited',
      'ICICIBANK': 'ICICI Bank Limited',
      'SBIN': 'State Bank of India',
      'BHARTIARTL': 'Bharti Airtel Limited',
      'ITC': 'ITC Limited',
      'KOTAKBANK': 'Kotak Mahindra Bank Limited',
      'LT': 'Larsen & Toubro Limited'
    };

    return companyNames[symbol.toUpperCase()] || `${symbol.toUpperCase()} Limited`;
  }

  getFallbackHistoricalData(symbol, period) {
    const days = this.getPeriodDays(period);
    const data = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let basePrice = this.getBasePriceForSymbol(symbol);
    let currentPrice = basePrice;

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);

      const volatility = 0.02;
      const trend = 0.0002;
      const randomChange = (Math.random() - 0.5) * volatility;

      currentPrice = currentPrice * (1 + trend + randomChange);

      const open = currentPrice * (1 + (Math.random() - 0.5) * 0.01);
      const close = currentPrice;
      const high = Math.max(open, close) * (1 + Math.random() * 0.02);
      const low = Math.min(open, close) * (1 - Math.random() * 0.02);
      const volume = Math.floor(Math.random() * 1000000) + 100000;

      data.push({
        time: Math.floor(date.getTime() / 1000),
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        volume: volume,
        date: date.toISOString().split('T')[0]
      });
    }

    return data;
  }

  getPeriodDays(period) {
    const periodMap = {
      '1D': 1,
      '5D': 5,
      '1M': 30,
      '3M': 90,
      '6M': 180,
      '1Y': 365,
      'MAX': 1095
    };

    return periodMap[period] || 365;
  }
}

// Export singleton instance
export default new ChartApiService();
