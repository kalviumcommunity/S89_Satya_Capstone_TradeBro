/* ========================================
   🔗 API SERVICE - TRADEBRO
   Centralized API communication layer
   ======================================== */

import axios from 'axios';
// Assuming fmpAPI.js is a separate file with direct FMP API calls
import { fmpStockAPI, fmpChartAPI, fmpMarketAPI } from './fmpAPI';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://s89-satya-capstone-tradebro.onrender.com';
const API_BASE_URL_WITH_API = `${API_BASE_URL}/api`;

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL_WITH_API,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Track backend availability for the fallback mechanism
let backendAvailable = true;
let lastCheckTime = 0;
const CHECK_INTERVAL = 30000; // 30 seconds

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    backendAvailable = true;
    return response;
  },
  (error) => {
    if (error.code === 'ERR_NETWORK' || error.response?.status === 404) {
      backendAvailable = false;
      lastCheckTime = Date.now();
      console.warn('🚫 Network error detected, backend marked as unavailable');
    }

    if (error.response?.status === 401) {
      const errorCode = error.response?.data?.code;
      
      if (errorCode === 'TOKEN_EXPIRED') {
        console.log('🕑 Token expired, redirecting to login');
      } else {
        console.log('🔒 Authentication failed, redirecting to login');
      }
      
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('redirectAfterLogin');
      
      if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
        window.location.href = '/login?reason=session_expired';
      }
    }

    // Handle 500 errors gracefully in production
    if (error.response?.status >= 500 && import.meta.env.PROD) {
      console.error('🚨 Server error:', error.response.status);
      return Promise.resolve({
        data: {
          success: false,
          message: 'Service temporarily unavailable. Please try again later.',
          fallback: true,
          code: 'SERVICE_UNAVAILABLE'
        },
      });
    }
    return Promise.reject(error);
  }
);

// Helper function to check if we should attempt an API call
export const shouldAttemptAPICall = () => {
  if (backendAvailable) return true;
  const now = Date.now();
  if (now - lastCheckTime > CHECK_INTERVAL) {
    backendAvailable = true;
    return true;
  }
  return false;
};

/* ========================================
   🔐 AUTHENTICATION SERVICES
   ======================================== */

export const authAPI = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  verifyToken: async () => {
    const response = await api.get('/auth/verify');
    return response.data;
  },
  googleAuth: async (tokenId) => {
    const response = await api.post('/auth/google', { tokenId });
    return response.data;
  },
  logout: async () => {
    // Correcting the path to match standard REST API conventions if applicable
    const response = await api.post('/auth/logout');
    return response.data;
  },
};

/* ========================================
   📊 STOCK DATA SERVICES
   ======================================== */

export const stockAPI = {
  getQuote: async (symbol) => {
    const response = await api.get(`/proxy/fmp/quote/${symbol}`);
    return response.data;
  },
  getBatchQuotes: async (symbols) => {
    const symbolsParam = Array.isArray(symbols) ? symbols.join(',') : symbols;
    const response = await api.get(`/proxy/stock-batch?symbols=${symbolsParam}`);
    return response.data;
  },
  searchStocks: async (query, limit = 10) => {
    try {
      const response = await api.get(`/search/stocks?q=${encodeURIComponent(query)}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.warn('Backend search failed, trying FMP API directly:', error);
      const fmpResult = await fmpStockAPI.searchStocks(query, limit);
      return { success: fmpResult.success, results: fmpResult.results || [] };
    }
  },
  getStockSuggestions: async (query, limit = 5) => {
    try {
      const response = await api.get(`/search/suggestions?q=${encodeURIComponent(query)}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.warn('Backend suggestions failed, using FMP API:', error);
      const fmpResult = await fmpStockAPI.searchStocks(query, limit);
      return { success: fmpResult.success, suggestions: fmpResult.results || [] };
    }
  },
  getTrendingStocks: async (limit = 10) => {
    try {
      const response = await api.get(`/search/trending?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.warn('Backend trending failed, using FMP gainers:', error);
      const gainers = await fmpMarketAPI.getGainers(limit);
      return { success: gainers.success, results: gainers.data || [] };
    }
  },
  getMarketMovers: async () => {
    try {
      const [gainersResponse, losersResponse] = await Promise.all([
        api.get('/proxy/top-gainers'),
        api.get('/proxy/top-losers')
      ]);
      return {
        gainers: gainersResponse.data || [],
        losers: losersResponse.data || [],
        mostActive: []
      };
    } catch (error) {
      console.error('Error fetching market movers:', error);
      return { gainers: [], losers: [], mostActive: [] };
    }
  },
  getIndianIndices: async () => {
    const response = await api.get('/proxy/market-indices');
    return response.data;
  },
  getNSEGainers: async (limit = 10) => {
    const response = await api.get(`/stocks/nse-gainers?limit=${limit}`);
    return response.data;
  },
  getNSELosers: async (limit = 10) => {
    const response = await api.get(`/stocks/nse-losers?limit=${limit}`);
    return response.data;
  },
  getProfile: async (symbol) => {
    const response = await api.get(`/stocks/profile/${symbol}`);
    return response.data;
  },
  getHistoricalData: async (symbol, period = '1y') => {
    const response = await api.get(`/stocks/historical/${symbol}?period=${period}`);
    return response.data;
  },
  getIntradayData: async (symbol, interval = '5min') => {
    const response = await api.get(`/stocks/intraday/${symbol}?interval=${interval}`);
    return response.data;
  },
  getMarketStatus: async () => {
    const response = await api.get('/stocks/market-status');
    return response.data;
  },
  getRealTimePrice: async (symbol) => {
    const response = await api.get(`/stocks/realtime/${symbol}`);
    return response.data;
  }
};

/* ========================================
   💼 PORTFOLIO SERVICES
   ======================================== */

export const portfolioAPI = {
  getSummary: async () => {
    try {
      const response = await api.get('/portfolio/summary');
      return response.data;
    } catch (error) {
      console.error('Portfolio summary error:', error);
      return {
        success: false,
        data: {
          totalValue: 10000,
          availableCash: 10000,
          totalInvested: 0,
          totalGainLoss: 0,
          totalGainLossPercentage: 0,
          holdings: [],
          transactions: [],
          watchlist: []
        }
      };
    }
  },
  getHoldings: async () => {
    try {
      const response = await api.get('/portfolio/holdings');
      return response.data;
    } catch (error) {
      console.error('Portfolio holdings error:', error);
      return { success: true, data: [] };
    }
  },
  createPortfolio: async (userId) => {
    try {
      const response = await api.post('/portfolio/create', { userId });
      return response.data;
    } catch (error) {
      console.error('Portfolio creation error:', error);
      return {
        success: false,
        data: {
          totalValue: 10000,
          availableCash: 10000,
          totalInvested: 0,
          totalGainLoss: 0,
          totalGainLossPercentage: 0,
          holdings: [],
          transactions: [],
          watchlist: []
        }
      };
    }
  },
  getPerformance: async (period = '1m') => {
    const response = await api.get(`/portfolio/performance?period=${period}`);
    return response.data;
  },
  getAnalytics: async () => {
    const response = await api.get('/portfolio/analytics');
    return response.data;
  },
  // Moved from stockAPI for better organization
  getLivePortfolio: async () => {
    const response = await api.get('/portfolio/live');
    return response.data;
  },
};

/* ========================================
   📈 TRADING SERVICES
   ======================================== */

export const tradingAPI = {
  placeOrder: async (orderData) => {
    const response = await api.post('/orders/place', orderData);
    return response.data;
  },
  getOrders: async ({
    status = 'all', page = 1, limit = 20, stockSymbol = null, type = null, orderType = null, sort = '-createdAt'
  } = {}) => {
    let url = `/orders/all?page=${page}&limit=${limit}&sort=${sort}`;
    if (status !== 'all') url += `&status=${status}`;
    if (stockSymbol) url += `&stockSymbol=${stockSymbol.toUpperCase()}`;
    if (type) url += `&type=${type}`;
    if (orderType) url += `&orderType=${orderType}`;
    const response = await api.get(url);
    return response.data;
  },
  searchOrders: async (query, filters = {}) => {
    const { status, type, orderType, limit = 20 } = filters;
    let url = `/orders/all?stockSymbol=${query.toUpperCase()}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    if (type) url += `&type=${type}`;
    if (orderType) url += `&orderType=${orderType}`;
    const response = await api.get(url);
    return response.data;
  },
  cancelOrder: async (orderId) => {
    const response = await api.delete(`/orders/${orderId}`);
    return response.data;
  },
  getOrderHistory: async (limit = 50) => {
    const response = await api.get(`/orders/history?limit=${limit}`);
    return response.data;
  },
  getRecentTrades: async (limit = 10) => {
    const response = await api.get(`/trades/recent?limit=${limit}`);
    return response.data;
  }
};

/* ========================================
   👁️ WATCHLIST SERVICES
   ======================================== */

export const watchlistAPI = {
  getWatchlists: async () => {
    const response = await api.get('/watchlist');
    return response.data;
  },
  createWatchlist: async (name, description = '') => {
    const response = await api.post('/watchlist', { name, description });
    return response.data;
  },
  addStock: async (watchlistId, symbol) => {
    const response = await api.post(`/watchlist/${watchlistId}/add`, { symbol });
    return response.data;
  },
  removeStock: async (watchlistId, symbol) => {
    const response = await api.delete(`/watchlist/${watchlistId}/remove/${symbol}`);
    return response.data;
  },
  deleteWatchlist: async (watchlistId) => {
    const response = await api.delete(`/watchlist/${watchlistId}`);
    return response.data;
  },
  searchStocks: async (query, limit = 10) => {
    const response = await api.get(`/watchlist/search?query=${encodeURIComponent(query)}&limit=${limit}`);
    return response.data;
  }
};

/* ========================================
   🤖 SAYTRIX AI SERVICES
   ======================================== */

export const saytrixAPI = {
  // Corrected to match backend. Sends an empty message to get a welcome response.
  startSession: async () => {
    const response = await api.post('/saytrix/chat', {
      message: 'start_session_message',
      sessionId: null
    });
    return response.data;
  },
  sendMessage: async (message, sessionId = null) => {
    try {
      const response = await api.post('/saytrix/chat', { message, sessionId });
      return response.data;
    } catch (error) {
      console.error('Saytrix API error:', error);
      return { success: false, message: 'AI service temporarily unavailable.', error: error.message };
    }
  },
  // Corrected to match backend: Uses userId to get history, not sessionId
  getChatHistory: async (userId) => {
    const response = await api.get(`/saytrix/history/${userId}`);
    return response.data;
  },
  voiceCommand: async (audioData) => {
    const formData = new FormData();
    formData.append('audio', audioData);
    const response = await api.post('/saytrix/voice', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  getStockAnalysis: async (symbol) => {
    const response = await api.get(`/saytrix/analysis/${symbol}`);
    return response.data;
  },
  // Corrected to match backend: Use DELETE method and correct URL path
  clearSession: async (sessionId) => {
    const response = await api.delete(`/saytrix/session/${sessionId}`);
    return response.data;
  },
  getSuggestions: async (input) => {
    const response = await api.get(`/saytrix/suggestions?input=${encodeURIComponent(input)}`);
    return response.data;
  }
};

/* ========================================
   📈 CHART DATA SERVICES
   ======================================== */

export const chartAPI = {
  getHistoricalData: async (symbol, period = '1D', from = null, to = null) => {
    return await fmpChartAPI.getHistoricalData(symbol, period, from, to);
  },
  getIntradayData: async (symbol, interval = '1min') => {
    return await fmpChartAPI.getIntradayData(symbol, interval);
  },
  getChartData: async (symbol, timeframe = '1D') => {
    try {
      const fmpData = await fmpChartAPI.getHistoricalData(symbol, timeframe);
      if (fmpData.success && fmpData.data.length > 0) {
        return fmpData;
      }
      const response = await api.get(`/proxy/chart/${symbol}?timeframe=${timeframe}`);
      return response.data;
    } catch (error) {
      console.error('Chart data error:', error);
      return { success: false, data: [], error: error.message };
    }
  }
};

/* ========================================
   📰 NEWS SERVICES
   ======================================== */

export const newsAPI = {
  getMarketNews: async (limit = 20) => {
    const response = await api.get(`/news/market?limit=${limit}`);
    return response.data;
  },
  getNews: async ({ category = 'all', limit = 20, q = null } = {}) => {
    let url = `/news?limit=${limit}`;
    if (q) url += `&q=${encodeURIComponent(q)}`;
    const response = await api.get(url);
    return response.data;
  },
  searchNews: async (query, limit = 20) => {
    const response = await api.get(`/news/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    return response.data;
  },
  getStockNews: async (symbol, limit = 10) => {
    const response = await api.get(`/news/stock/${symbol}?limit=${limit}`);
    return response.data;
  },
  getTrendingNews: async () => {
    const response = await api.get('/news/trending');
    return response.data;
  }
};

/* ========================================
   👤 USER SERVICES
   ======================================== */

export const userAPI = {
  getProfile: async () => {
    const response = await api.get('/user/profile');
    return response.data;
  },
  updateProfile: async (profileData) => {
    const response = await api.put('/user/profile', profileData);
    return response.data;
  },
  getSettings: async () => {
    const response = await api.get('/user/settings');
    return response.data;
  },
  updateSettings: async (settings) => {
    const response = await api.put('/user/settings', settings);
    return response.data;
  },
  getVirtualMoney: async () => {
    const response = await api.get('/user/virtual-money');
    return response.data;
  }
};

/* ========================================
   📊 ANALYTICS SERVICES
   ======================================== */

export const analyticsAPI = {
  getDashboardAnalytics: async () => {
    try {
      const response = await api.get('/analytics/dashboard');
      return response.data;
    } catch (error) {
      console.error('Dashboard analytics error:', error);
      return {
        success: true,
        data: {
          totalValue: 10000,
          dayChange: 0,
          dayChangePercent: 0,
          totalStocks: 0,
          marketStatus: 'closed'
        }
      };
    }
  },
  getPerformanceMetrics: async (period = '1m') => {
    const response = await api.get(`/analytics/performance?period=${period}`);
    return response.data;
  },
  getMarketSentiment: async () => {
    const response = await api.get('/analytics/sentiment');
    return response.data;
  }
};

// Export the base axios instance
export default api;
