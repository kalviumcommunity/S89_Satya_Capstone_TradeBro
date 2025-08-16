/* ========================================
   🔗 API SERVICE - TRADEBRO
   Centralized API communication layer
   ======================================== */

import axios from 'axios'
import { fmpStockAPI, fmpChartAPI, fmpMarketAPI } from './fmpAPI'

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://s89-satya-capstone-tradebro.onrender.com'
const API_BASE_URL_WITH_API = `${API_BASE_URL}/api`

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL_WITH_API,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Track backend availability
let backendAvailable = true;
let lastCheckTime = 0;
const CHECK_INTERVAL = 30000; // 30 seconds

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // Backend is available
    backendAvailable = true;
    return response;
  },
  (error) => {
    // Check if it's a connection error
    if (error.code === 'ERR_NETWORK' || error.response?.status === 404) {
      backendAvailable = false;
      lastCheckTime = Date.now();
    }

    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Helper function to check if we should attempt API call
export const shouldAttemptAPICall = () => {
  if (backendAvailable) return true;

  // Retry every 30 seconds
  const now = Date.now();
  if (now - lastCheckTime > CHECK_INTERVAL) {
    backendAvailable = true; // Allow one retry
    return true;
  }

  return false;
}

/* ========================================
   🔐 AUTHENTICATION SERVICES
   ======================================== */

export const authAPI = {
  // Login user
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials)
    return response.data
  },

  // Register user
  register: async (userData) => {
    const response = await api.post('/auth/register', userData)
    return response.data
  },

  // Verify token
  verifyToken: async () => {
    const response = await api.get('/auth/verify')
    return response.data
  },

  // Google OAuth
  googleAuth: async (tokenId) => {
    const response = await api.post('/auth/google', { tokenId })
    return response.data
  },

  // Logout
  logout: async () => {
    const response = await api.post('/auth/logout')
    return response.data
  }
}

/* ========================================
   📊 STOCK DATA SERVICES
   ======================================== */

export const stockAPI = {
  // Get stock quote
  getQuote: async (symbol) => {
    const response = await api.get(`/proxy/fmp/quote/${symbol}`)
    return response.data
  },

  // Get batch stock quotes for multiple symbols
  getBatchQuotes: async (symbols) => {
    const symbolsParam = Array.isArray(symbols) ? symbols.join(',') : symbols;
    const response = await api.get(`/proxy/stock-batch?symbols=${symbolsParam}`)
    return response.data
  },

  // Search stocks - Enhanced with FMP API fallback
  searchStocks: async (query, limit = 10) => {
    try {
      // Try backend first (includes multiple sources)
      const response = await api.get(`/search/stocks?q=${encodeURIComponent(query)}&limit=${limit}`)
      return response.data
    } catch (error) {
      console.warn('Backend search failed, trying FMP API directly:', error)
      // Fallback to direct FMP API
      return await fmpStockAPI.searchStocks(query, limit)
    }
  },

  // Get stock suggestions for autocomplete
  getStockSuggestions: async (query, limit = 5) => {
    try {
      const response = await api.get(`/search/suggestions?q=${encodeURIComponent(query)}&limit=${limit}`)
      return response.data
    } catch (error) {
      console.warn('Backend suggestions failed, using FMP API:', error)
      // Fallback to FMP search for suggestions
      const fmpResult = await fmpStockAPI.searchStocks(query, limit)
      return {
        success: fmpResult.success,
        suggestions: fmpResult.results || []
      }
    }
  },

  // Get trending stocks
  getTrendingStocks: async (limit = 10) => {
    try {
      const response = await api.get(`/search/trending?limit=${limit}`)
      return response.data
    } catch (error) {
      console.warn('Backend trending failed, using FMP gainers:', error)
      // Fallback to FMP gainers as trending
      const gainers = await fmpMarketAPI.getGainers(limit)
      return {
        success: gainers.success,
        results: gainers.data || []
      }
    }
  },

  // Get real-time stock quote using FMP API
  getStockQuote: async (symbol) => {
    return await fmpStockAPI.getStockQuote(symbol)
  },

  // Get multiple stock quotes using FMP API
  getMultipleQuotes: async (symbols) => {
    return await fmpStockAPI.getMultipleQuotes(symbols)
  },

  // Get stock profile/company info using FMP API
  getStockProfile: async (symbol) => {
    return await fmpStockAPI.getStockProfile(symbol)
  },

  // Get market movers (Indian stocks)
  getMarketMovers: async () => {
    try {
      const [gainersResponse, losersResponse] = await Promise.all([
        api.get('/proxy/top-gainers'),
        api.get('/proxy/top-losers')
      ]);

      return {
        gainers: gainersResponse.data || [],
        losers: losersResponse.data || [],
        mostActive: [] // Can be added later if needed
      };
    } catch (error) {
      console.error('Error fetching market movers:', error);
      return {
        gainers: [],
        losers: [],
        mostActive: []
      };
    }
  },

  // Get Indian market indices
  getIndianIndices: async () => {
    const response = await api.get('/proxy/market-indices')
    return response.data
  },

  // Get NSE top gainers
  getNSEGainers: async (limit = 10) => {
    const response = await api.get(`/stocks/nse-gainers?limit=${limit}`)
    return response.data
  },

  // Get NSE top losers
  getNSELosers: async (limit = 10) => {
    const response = await api.get(`/stocks/nse-losers?limit=${limit}`)
    return response.data
  },

  // Get stock profile
  getProfile: async (symbol) => {
    const response = await api.get(`/stocks/profile/${symbol}`)
    return response.data
  },

  // Get historical data
  getHistoricalData: async (symbol, period = '1y') => {
    const response = await api.get(`/stocks/historical/${symbol}?period=${period}`)
    return response.data
  },

  // Get intraday data for charts
  getIntradayData: async (symbol, interval = '5min') => {
    const response = await api.get(`/stocks/intraday/${symbol}?interval=${interval}`)
    return response.data
  },

  // Get live portfolio data
  getLivePortfolio: async () => {
    const response = await api.get('/api/portfolio/live')
    return response.data
  },

  // Get Indian market status
  getMarketStatus: async () => {
    const response = await api.get('/api/stocks/market-status')
    return response.data
  },

  // Get real-time price
  getRealTimePrice: async (symbol) => {
    const response = await api.get(`/stocks/realtime/${symbol}`)
    return response.data
  }
}

/* ========================================
   💼 PORTFOLIO SERVICES
   ======================================== */

export const portfolioAPI = {
  // Get portfolio summary
  getSummary: async () => {
    const response = await api.get('/portfolio/summary')
    return response.data
  },

  // Get holdings
  getHoldings: async () => {
    const response = await api.get('/portfolio/holdings')
    return response.data
  },

  // Get portfolio performance
  getPerformance: async (period = '1m') => {
    const response = await api.get(`/portfolio/performance?period=${period}`)
    return response.data
  },

  // Get portfolio analytics
  getAnalytics: async () => {
    const response = await api.get('/portfolio/analytics')
    return response.data
  }
}

/* ========================================
   📈 TRADING SERVICES
   ======================================== */

export const tradingAPI = {
  // Place order
  placeOrder: async (orderData) => {
    const response = await api.post('/orders/place', orderData)
    return response.data
  },

  // Get orders with search and filters
  getOrders: async ({
    status = 'all',
    page = 1,
    limit = 20,
    stockSymbol = null,
    type = null,
    orderType = null,
    sort = '-createdAt'
  } = {}) => {
    let url = `/orders/all?page=${page}&limit=${limit}&sort=${sort}`;
    if (status !== 'all') url += `&status=${status}`;
    if (stockSymbol) url += `&stockSymbol=${stockSymbol.toUpperCase()}`;
    if (type) url += `&type=${type}`;
    if (orderType) url += `&orderType=${orderType}`;

    const response = await api.get(url);
    return response.data;
  },

  // Search orders
  searchOrders: async (query, filters = {}) => {
    const { status, type, orderType, limit = 20 } = filters;
    let url = `/orders/all?stockSymbol=${query.toUpperCase()}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    if (type) url += `&type=${type}`;
    if (orderType) url += `&orderType=${orderType}`;

    const response = await api.get(url);
    return response.data;
  },

  // Cancel order
  cancelOrder: async (orderId) => {
    const response = await api.delete(`/orders/${orderId}`)
    return response.data
  },

  // Get order history
  getOrderHistory: async (limit = 50) => {
    const response = await api.get(`/orders/history?limit=${limit}`)
    return response.data
  },

  // Get recent trades
  getRecentTrades: async (limit = 10) => {
    const response = await api.get(`/trades/recent?limit=${limit}`)
    return response.data
  }
}

/* ========================================
   👁️ WATCHLIST SERVICES
   ======================================== */

export const watchlistAPI = {
  // Get watchlists
  getWatchlists: async () => {
    const response = await api.get('/watchlist')
    return response.data
  },

  // Create watchlist
  createWatchlist: async (name, description = '') => {
    const response = await api.post('/watchlist', { name, description })
    return response.data
  },

  // Add stock to watchlist
  addStock: async (watchlistId, symbol) => {
    const response = await api.post(`/watchlist/${watchlistId}/add`, { symbol })
    return response.data
  },

  // Remove stock from watchlist
  removeStock: async (watchlistId, symbol) => {
    const response = await api.delete(`/watchlist/${watchlistId}/remove/${symbol}`)
    return response.data
  },

  // Delete watchlist
  deleteWatchlist: async (watchlistId) => {
    const response = await api.delete(`/watchlist/${watchlistId}`)
    return response.data
  },

  // Search stocks for watchlist
  searchStocks: async (query, limit = 10) => {
    const response = await api.get(`/watchlist/search?query=${encodeURIComponent(query)}&limit=${limit}`)
    return response.data
  }
}

/* ========================================
   🤖 SAYTRIX AI SERVICES
   ======================================== */

export const saytrixAPI = {
  // Start new session (using chat endpoint with welcome message)
  startSession: async () => {
    const response = await api.post('/saytrix/chat', {
      message: 'Hello',
      sessionId: null
    })
    return {
      success: true,
      sessionId: response.sessionId || 'new-session',
      message: {
        id: 'welcome_' + Date.now(),
        content: 'Hello! I\'m Saytrix, your AI-powered stock market assistant. I can help you with:\n\n• Real-time stock prices and data\n• Market analysis and trends\n• Company information and fundamentals\n• Top gainers and losers\n• Latest market news\n• Stock market education\n\nWhat would you like to know about the stock market today?',
        timestamp: new Date().toISOString(),
        suggestions: [
          'Show me NIFTY performance',
          'What are today\'s top gainers?',
          'Tell me about RELIANCE stock',
          'Latest market news'
        ]
      }
    }
  },

  // Send chat message
  sendMessage: async (message, sessionId = null) => {
    const response = await api.post('/saytrix/chat', { message, sessionId })
    return response.data
  },

  // Get chat history
  getChatHistory: async (sessionId) => {
    const response = await api.get(`/saytrix/history/${sessionId}`)
    return response.data
  },

  // Voice command
  voiceCommand: async (audioData) => {
    const formData = new FormData()
    formData.append('audio', audioData)
    const response = await api.post('/saytrix/voice', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  },

  // Get stock analysis
  getStockAnalysis: async (symbol) => {
    const response = await api.get(`/saytrix/analysis/${symbol}`)
    return response.data
  },

  // Clear chat session
  clearSession: async (sessionId) => {
    const response = await api.post('/saytrix/clear', { sessionId })
    return response.data
  },

  // Get suggestions
  getSuggestions: async (input) => {
    const response = await api.get(`/saytrix/suggestions?input=${encodeURIComponent(input)}`)
    return response.data
  }
}

/* ========================================
   📈 CHART DATA SERVICES
   ======================================== */

export const chartAPI = {
  // Get historical chart data
  getHistoricalData: async (symbol, period = '1D', from = null, to = null) => {
    return await fmpChartAPI.getHistoricalData(symbol, period, from, to)
  },

  // Get real-time intraday data
  getIntradayData: async (symbol, interval = '1min') => {
    return await fmpChartAPI.getIntradayData(symbol, interval)
  },

  // Get chart data with fallback to backend
  getChartData: async (symbol, timeframe = '1D') => {
    try {
      // Try FMP API first for better performance
      const fmpData = await fmpChartAPI.getHistoricalData(symbol, timeframe)
      if (fmpData.success && fmpData.data.length > 0) {
        return fmpData
      }

      // Fallback to backend proxy
      const response = await api.get(`/proxy/chart/${symbol}?timeframe=${timeframe}`)
      return response.data
    } catch (error) {
      console.error('Chart data error:', error)
      return {
        success: false,
        data: [],
        error: error.message
      }
    }
  }
}

/* ========================================
   📰 NEWS SERVICES
   ======================================== */

export const newsAPI = {
  // Get market news
  getMarketNews: async (limit = 20) => {
    const response = await api.get(`/news/market?limit=${limit}`)
    return response.data
  },

  // Get general news with optional search query
  getNews: async ({ category = 'all', limit = 20, q = null } = {}) => {
    let url = `/news?limit=${limit}`;
    if (q) {
      url += `&q=${encodeURIComponent(q)}`;
    }
    const response = await api.get(url);
    return response.data;
  },

  // Search news
  searchNews: async (query, limit = 20) => {
    const response = await api.get(`/news/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    return response.data;
  },

  // Get stock-specific news
  getStockNews: async (symbol, limit = 10) => {
    const response = await api.get(`/news/stock/${symbol}?limit=${limit}`)
    return response.data
  },

  // Get trending news
  getTrendingNews: async () => {
    const response = await api.get('/news/trending')
    return response.data
  }
}

/* ========================================
   👤 USER SERVICES
   ======================================== */

export const userAPI = {
  // Get user profile
  getProfile: async () => {
    const response = await api.get('/user/profile')
    return response.data
  },

  // Update profile
  updateProfile: async (profileData) => {
    const response = await api.put('/user/profile', profileData)
    return response.data
  },

  // Get user settings
  getSettings: async () => {
    const response = await api.get('/user/settings')
    return response.data
  },

  // Update settings
  updateSettings: async (settings) => {
    const response = await api.put('/user/settings', settings)
    return response.data
  },

  // Get virtual money balance
  getVirtualMoney: async () => {
    const response = await api.get('/user/virtual-money')
    return response.data
  }
}

/* ========================================
   📊 ANALYTICS SERVICES
   ======================================== */

export const analyticsAPI = {
  // Get dashboard analytics
  getDashboardAnalytics: async () => {
    const response = await api.get('/analytics/dashboard')
    return response.data
  },

  // Get performance metrics
  getPerformanceMetrics: async (period = '1m') => {
    const response = await api.get(`/analytics/performance?period=${period}`)
    return response.data
  },

  // Get market sentiment
  getMarketSentiment: async () => {
    const response = await api.get('/analytics/sentiment')
    return response.data
  }
}

export default api
