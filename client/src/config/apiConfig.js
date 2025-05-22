/**
 * API Configuration
 *
 * This file contains the configuration for the API endpoints.
 * It provides a centralized place to manage the API base URL.
 */

// Base URL for API requests - use relative URLs in development for proxy support
const isDevelopment = import.meta.env.DEV;
export const API_BASE_URL = isDevelopment ? '' : 'https://s89-satya-capstone-tradebro.onrender.com';

// API endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    SIGNUP: `${API_BASE_URL}/api/auth/signup`,
    GOOGLE: `${API_BASE_URL}/api/auth/auth/google`,
    FORGOT_PASSWORD: `${API_BASE_URL}/api/auth/forgotpassword`,
    RESET_PASSWORD: `${API_BASE_URL}/api/auth/resetpassword`,
  },

  // Settings endpoints
  SETTINGS: {
    BASE: `${API_BASE_URL}/api/settings`,
    NOTIFICATIONS: `${API_BASE_URL}/api/settings/notifications`,
  },

  // Chatbot endpoints
  CHATBOT: {
    START: `${API_BASE_URL}/api/chatbot/start`,
    END: `${API_BASE_URL}/api/chatbot/end`,
    MESSAGE: `${API_BASE_URL}/api/chatbot/message`,
  },

  // Virtual money endpoints
  VIRTUAL_MONEY: {
    ACCOUNT: `${API_BASE_URL}/api/virtual-money/account`,
    PUBLIC: `${API_BASE_URL}/api/virtual-money/public`,
    BUY: `${API_BASE_URL}/api/virtual-money/buy`,
    SELL: `${API_BASE_URL}/api/virtual-money/sell`,
    CLAIM_REWARD: `${API_BASE_URL}/api/virtual-money/claim-reward`,
    REWARD_STATUS: `${API_BASE_URL}/api/virtual-money/reward-status`,
    REWARD_STATUS_PUBLIC: `${API_BASE_URL}/api/virtual-money/reward-status-public`,
    TRANSACTIONS: `${API_BASE_URL}/api/virtual-money/transactions`,
    PORTFOLIO: `${API_BASE_URL}/api/virtual-money/portfolio`,
  },

  // Orders endpoints
  ORDERS: {
    ALL: `${API_BASE_URL}/api/orders/all`,
    PLACE: `${API_BASE_URL}/api/orders/place`,
    CANCEL: (id) => `${API_BASE_URL}/api/orders/cancel/${id}`,
  },

  // Watchlist endpoints
  WATCHLIST: {
    STOCKS: `${API_BASE_URL}/api/watchlist/stocks`,
    ADD: `${API_BASE_URL}/api/watchlist/add`,
    REMOVE: (symbol) => `${API_BASE_URL}/api/watchlist/remove/${symbol}`,
    SEARCH: `${API_BASE_URL}/api/watchlist/search`,
  },

  // Proxy endpoints
  PROXY: {
    STOCK_BATCH: (symbol) => `${API_BASE_URL}/api/proxy/stock-batch?symbols=${symbol}`,
    STOCK_LIST: `${API_BASE_URL}/api/proxy/fmp/stock/list`,
    HISTORICAL_PRICE: (symbol) => `${API_BASE_URL}/api/proxy/fmp/historical-price-full/${symbol}`,
    MARKET_INDICES: `${API_BASE_URL}/api/proxy/market-indices`,
    TOP_GAINERS: `${API_BASE_URL}/api/proxy/top-gainers`,
    TOP_LOSERS: `${API_BASE_URL}/api/proxy/top-losers`,
  },

  // Stock Search endpoints
  STOCK_SEARCH: {
    SEARCH: `${API_BASE_URL}/api/stock-search`,
    SEARCH_DIRECT: `${API_BASE_URL}/api/stocks/search`,
    LIST: `${API_BASE_URL}/api/stock-search/list`,
  },

  // Contact endpoint
  CONTACT: {
    SEND: `${API_BASE_URL}/api/contact/send`,
  },

  // Notifications endpoints
  NOTIFICATIONS: {
    ALL: `${API_BASE_URL}/api/notifications`,
    CREATE: `${API_BASE_URL}/api/notifications`,
    MARK_READ: (id) => `${API_BASE_URL}/api/notifications/${id}/read`,
    MARK_ALL_READ: `${API_BASE_URL}/api/notifications/read-all`,
    DELETE: (id) => `${API_BASE_URL}/api/notifications/${id}`,
  },

  // Chart data endpoints
  CHARTS: {
    FIVE_MIN: (symbol) => `${API_BASE_URL}/api/data/chart/5min/${symbol}`,
  },

  // Health check endpoint
  HEALTH: `${API_BASE_URL}/api/health`,

  // Uploads path
  UPLOADS: (filename) => `${API_BASE_URL}/uploads/${filename}`,
};

export default API_ENDPOINTS;
