/**
 * API Configuration
 *
 * This file contains the configuration for the API endpoints.
 * It provides a centralized place to manage the API base URL.
 */

// Import the URL utility
import { getApiBaseUrl } from '../utils/urlUtils';

// Base URL for API requests - use environment variable or fallback to localhost
// Always ensure HTTP for localhost to avoid SSL issues
export const API_BASE_URL = getApiBaseUrl();

// API endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    SIGNUP: `${API_BASE_URL}/api/auth/signup`,
    GOOGLE: `${API_BASE_URL}/api/auth/google`,
    FORGOT_PASSWORD: `${API_BASE_URL}/api/auth/forgotpassword`,
    RESET_PASSWORD: `${API_BASE_URL}/api/auth/resetpassword`,
    USER: `${API_BASE_URL}/api/auth/user`,
  },

  // Settings endpoints
  SETTINGS: {
    BASE: `${API_BASE_URL}/api/settings`,
    NOTIFICATIONS: `${API_BASE_URL}/api/settings/notifications`,
  },

  // Saytrix endpoints
  SAYTRIX: {
    START: `${API_BASE_URL}/api/saytrix/start`,
    END: `${API_BASE_URL}/api/saytrix/end`,
    MESSAGE: `${API_BASE_URL}/api/saytrix/message`,
    VOICE: `${API_BASE_URL}/api/saytrix/voice`,
    CHAT: `${API_BASE_URL}/api/saytrix/chat`,
    SUGGESTIONS: `${API_BASE_URL}/api/saytrix/suggestions`,
    HEALTH: `${API_BASE_URL}/api/saytrix/health`,
  },

  // Legacy chatbot endpoints (for backward compatibility)
  CHATBOT: {
    START: `${API_BASE_URL}/api/saytrix/start`,
    END: `${API_BASE_URL}/api/saytrix/end`,
    MESSAGE: `${API_BASE_URL}/api/saytrix/message`,
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

  },

  // Proxy endpoints
  PROXY: {
    STOCK_BATCH: (symbol) => `${API_BASE_URL}/api/proxy/stock-batch?symbols=${symbol}`,
    STOCK_LIST: `${API_BASE_URL}/api/proxy/fmp/stock/list`,
    HISTORICAL_PRICE: (symbol) => `${API_BASE_URL}/api/proxy/fmp/historical-price-full/${symbol}`,
    MARKET_INDICES: `${API_BASE_URL}/api/proxy/market-indices`,
    TOP_GAINERS: `${API_BASE_URL}/api/proxy/top-gainers`,
    TOP_LOSERS: `${API_BASE_URL}/api/proxy/top-losers`,
    FMP: `${API_BASE_URL}/api/proxy/fmp`,
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

  // News endpoints
  NEWS: {
    GET_ALL: `${API_BASE_URL}/api/news`,
    GET_BY_CATEGORY: (category) => `${API_BASE_URL}/api/news/category/${category}`,
    SEARCH: `${API_BASE_URL}/api/news/search`,
  },

  // Health check endpoint
  HEALTH: `${API_BASE_URL}/api/health`,

  // Uploads path
  UPLOADS: (filename) => `${API_BASE_URL}/uploads/${filename}`,
};

export default API_ENDPOINTS;
