// API Configuration for TradeBro
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://s89-satya-capstone-tradebro.onrender.com';

const API_ENDPOINTS = {
  // Base URL
  BASE: API_BASE_URL,
  
  // Authentication endpoints
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    REGISTER: `${API_BASE_URL}/api/auth/register`,
    LOGOUT: `${API_BASE_URL}/api/auth/logout`,
    REFRESH: `${API_BASE_URL}/api/auth/refresh`,
    PROFILE: `${API_BASE_URL}/api/auth/profile`,
  },
  
  // User endpoints
  USER: {
    PROFILE: `${API_BASE_URL}/api/user/profile`,
    UPDATE: `${API_BASE_URL}/api/user/update`,
    UPLOAD_AVATAR: `${API_BASE_URL}/api/user/upload-avatar`,
  },
  
  // Stock endpoints
  STOCKS: {
    SEARCH: `${API_BASE_URL}/api/stocks/search`,
    QUOTE: `${API_BASE_URL}/api/stocks/quote`,
    CHART: `${API_BASE_URL}/api/stocks/chart`,
    NEWS: `${API_BASE_URL}/api/stocks/news`,
  },
  
  // Portfolio endpoints
  PORTFOLIO: {
    GET: `${API_BASE_URL}/api/portfolio`,
    BUY: `${API_BASE_URL}/api/portfolio/buy`,
    SELL: `${API_BASE_URL}/api/portfolio/sell`,
    HISTORY: `${API_BASE_URL}/api/portfolio/history`,
  },
  
  // Watchlist endpoints
  WATCHLIST: {
    GET: `${API_BASE_URL}/api/watchlist`,
    ADD: `${API_BASE_URL}/api/watchlist/add`,
    REMOVE: `${API_BASE_URL}/api/watchlist/remove`,
  },
  
  // Saytrix AI endpoints
  SAYTRIX: {
    CHAT: `${API_BASE_URL}/api/saytrix/chat`,
    START: `${API_BASE_URL}/api/saytrix/start`,
    CLEAR: `${API_BASE_URL}/api/saytrix/clear`,
  },
  
  // File upload endpoints
  UPLOADS: (filename) => `${API_BASE_URL}/uploads/${filename}`,
  PROFILE_IMAGES: (filename) => `${API_BASE_URL}/uploads/profiles/${filename}`,
};

export default API_ENDPOINTS;
