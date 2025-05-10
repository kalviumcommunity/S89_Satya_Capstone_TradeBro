/**
 * Stock Cache Utility
 * 
 * This utility provides caching for stock data to improve performance
 * and handle API timeouts gracefully.
 */

// Default stock symbols for fallback
const DEFAULT_STOCKS = [
  { symbol: "RELIANCE.NS", name: "Reliance Industries", type: "stock" },
  { symbol: "TCS.NS", name: "Tata Consultancy Services", type: "stock" },
  { symbol: "HDFCBANK.NS", name: "HDFC Bank Ltd.", type: "stock" },
  { symbol: "INFY.NS", name: "Infosys Ltd.", type: "stock" },
  { symbol: "ICICIBANK.NS", name: "ICICI Bank Ltd.", type: "stock" },
  { symbol: "TATAMOTORS.NS", name: "Tata Motors Ltd.", type: "stock" },
  { symbol: "SUNPHARMA.NS", name: "Sun Pharmaceutical", type: "stock" },
  { symbol: "AXISBANK.NS", name: "Axis Bank Ltd.", type: "stock" },
  { symbol: "WIPRO.NS", name: "Wipro Ltd.", type: "stock" },
  { symbol: "BAJFINANCE.NS", name: "Bajaj Finance Ltd.", type: "stock" },
  { symbol: "HINDUNILVR.NS", name: "Hindustan Unilever", type: "stock" },
  { symbol: "SBIN.NS", name: "State Bank of India", type: "stock" },
  { symbol: "BHARTIARTL.NS", name: "Bharti Airtel", type: "stock" },
  { symbol: "KOTAKBANK.NS", name: "Kotak Mahindra Bank", type: "stock" },
  { symbol: "ITC.NS", name: "ITC Limited", type: "stock" },
  { symbol: "MARUTI.NS", name: "Maruti Suzuki", type: "stock" },
  { symbol: "ASIANPAINT.NS", name: "Asian Paints", type: "stock" },
  { symbol: "HCLTECH.NS", name: "HCL Technologies", type: "stock" },
  { symbol: "ULTRACEMCO.NS", name: "UltraTech Cement", type: "stock" },
  { symbol: "TITAN.NS", name: "Titan Company", type: "stock" },
  // US stocks
  { symbol: "AAPL", name: "Apple Inc.", type: "stock" },
  { symbol: "MSFT", name: "Microsoft Corporation", type: "stock" },
  { symbol: "GOOGL", name: "Alphabet Inc.", type: "stock" },
  { symbol: "AMZN", name: "Amazon.com Inc.", type: "stock" },
  { symbol: "META", name: "Meta Platforms Inc.", type: "stock" },
  { symbol: "TSLA", name: "Tesla, Inc.", type: "stock" },
  { symbol: "NVDA", name: "NVIDIA Corporation", type: "stock" },
  { symbol: "NFLX", name: "Netflix, Inc.", type: "stock" }
];

// Cache configuration
const CACHE_KEY = 'stockSymbolsCache';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Get stock symbols from cache or fallback to default
 * @returns {Array} Array of stock symbols
 */
export const getCachedStockSymbols = () => {
  try {
    const cachedData = localStorage.getItem(CACHE_KEY);
    
    if (cachedData) {
      const { data, timestamp } = JSON.parse(cachedData);
      const now = Date.now();
      
      // Check if cache is still valid
      if (now - timestamp < CACHE_EXPIRY && Array.isArray(data) && data.length > 0) {
        console.log('Using cached stock symbols');
        return data;
      }
    }
  } catch (error) {
    console.error('Error reading from stock cache:', error);
  }
  
  // Return default stocks if cache is invalid or missing
  return DEFAULT_STOCKS;
};

/**
 * Save stock symbols to cache
 * @param {Array} symbols Array of stock symbols to cache
 */
export const cacheStockSymbols = (symbols) => {
  if (!Array.isArray(symbols) || symbols.length === 0) {
    console.warn('Invalid data provided to stock cache');
    return;
  }
  
  try {
    const cacheData = {
      data: symbols,
      timestamp: Date.now()
    };
    
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    console.log('Stock symbols cached successfully');
  } catch (error) {
    console.error('Error saving to stock cache:', error);
  }
};

export default {
  getCachedStockSymbols,
  cacheStockSymbols,
  DEFAULT_STOCKS
};
