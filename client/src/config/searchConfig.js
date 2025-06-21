/**
 * Search Configuration
 * Centralized configuration for stock search functionality
 */

// API Endpoints
export const SEARCH_ENDPOINTS = {
  STOCKS: '/api/search/stocks',
  TRENDING: '/api/search/trending',
  SUGGESTIONS: '/api/search/suggestions'
};

// Search Settings
export const SEARCH_SETTINGS = {
  MIN_QUERY_LENGTH: 2,
  DEBOUNCE_DELAY: 300,
  MAX_RESULTS: 10,
  MAX_HISTORY: 10,
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
};

// Popular Indian Stock Symbols
export const POPULAR_STOCKS = [
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries Ltd', sector: 'Energy' },
  { symbol: 'TCS.NS', name: 'Tata Consultancy Services', sector: 'IT' },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank Ltd', sector: 'Banking' },
  { symbol: 'INFY.NS', name: 'Infosys Ltd', sector: 'IT' },
  { symbol: 'ICICIBANK.NS', name: 'ICICI Bank Ltd', sector: 'Banking' },
  { symbol: 'SBIN.NS', name: 'State Bank of India', sector: 'Banking' },
  { symbol: 'ITC.NS', name: 'ITC Ltd', sector: 'FMCG' },
  { symbol: 'LT.NS', name: 'Larsen & Toubro Ltd', sector: 'Infrastructure' },
  { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel Ltd', sector: 'Telecom' },
  { symbol: 'ASIANPAINT.NS', name: 'Asian Paints Ltd', sector: 'Paints' }
];

// Search Placeholders
export const SEARCH_PLACEHOLDERS = {
  DEFAULT: "Search stocks...",
  DASHBOARD: "Search stocks to add to watchlist...",
  CHARTS: "Search for Indian stocks to view charts (e.g., RELIANCE.NS, TCS.NS)...",
  WATCHLIST: "Search and add stocks to watchlist...",
  PORTFOLIO: "Search for stocks to view details..."
};

// Search Result Categories
export const SEARCH_CATEGORIES = {
  RECENT: 'recent',
  TRENDING: 'trending',
  RESULTS: 'results'
};

// Exchange Information
export const EXCHANGES = {
  NSE: { name: 'National Stock Exchange', country: 'India', suffix: '.NS' },
  BSE: { name: 'Bombay Stock Exchange', country: 'India', suffix: '.BO' },
  NYSE: { name: 'New York Stock Exchange', country: 'USA', suffix: '' },
  NASDAQ: { name: 'NASDAQ', country: 'USA', suffix: '' }
};

// Sector Colors for UI
export const SECTOR_COLORS = {
  'IT': '#3b82f6',
  'Banking': '#10b981',
  'Energy': '#f59e0b',
  'FMCG': '#8b5cf6',
  'Auto': '#ef4444',
  'Pharma': '#06b6d4',
  'Infrastructure': '#84cc16',
  'Telecom': '#f97316',
  'Paints': '#ec4899',
  'Jewellery': '#fbbf24',
  'Power': '#6366f1',
  'Cement': '#64748b',
  'NBFC': '#14b8a6'
};

// Search Animation Settings
export const ANIMATION_CONFIG = {
  DROPDOWN: {
    initial: { opacity: 0, y: -10, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -10, scale: 0.95 },
    transition: { duration: 0.2, ease: "easeOut" }
  },
  ITEM_HOVER: {
    backgroundColor: "rgba(59, 130, 246, 0.05)",
    transition: { duration: 0.15 }
  },
  BUTTON_HOVER: {
    scale: 1.05,
    transition: { duration: 0.2 }
  }
};

// Keyboard Navigation
export const KEYBOARD_KEYS = {
  ARROW_DOWN: 'ArrowDown',
  ARROW_UP: 'ArrowUp',
  ENTER: 'Enter',
  ESCAPE: 'Escape',
  TAB: 'Tab'
};

// Error Messages
export const ERROR_MESSAGES = {
  SEARCH_FAILED: 'Search failed. Please try again.',
  NO_RESULTS: 'No stocks found for your search.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  INVALID_SYMBOL: 'Invalid stock symbol format.',
  API_LIMIT: 'API rate limit exceeded. Please try again later.'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  STOCK_SELECTED: 'Stock selected successfully',
  ADDED_TO_WATCHLIST: 'Added to watchlist',
  CHART_OPENED: 'Chart opened',
  HISTORY_CLEARED: 'Search history cleared'
};

export default {
  SEARCH_ENDPOINTS,
  SEARCH_SETTINGS,
  POPULAR_STOCKS,
  SEARCH_PLACEHOLDERS,
  SEARCH_CATEGORIES,
  EXCHANGES,
  SECTOR_COLORS,
  ANIMATION_CONFIG,
  KEYBOARD_KEYS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES
};
