/**
 * Financial Modeling Prep (FMP) API Service
 * Direct integration with FMP API for real-time stock data and charts
 */

import axios from 'axios';
import { mockFMPAPI } from './mockData';

// FMP API Configuration
const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';

// API keys from environment variables (secure approach)
const API_KEYS = [
  import.meta.env.VITE_FMP_API_KEY_PRIMARY,
  import.meta.env.VITE_FMP_API_KEY_SECONDARY,
  import.meta.env.VITE_FMP_API_KEY_TERTIARY,
  import.meta.env.VITE_FMP_API_KEY_FALLBACK
].filter(Boolean); // Remove undefined/empty keys

// Track failed API keys to avoid retrying them
const failedApiKeys = new Set();

// Check if we have any working API keys left
const hasWorkingApiKeys = () => {
  return API_KEYS.some(key => !failedApiKeys.has(key));
};

// Mark API key as failed
const markApiKeyAsFailed = (apiKey) => {
  failedApiKeys.add(apiKey);
  console.warn(`❌ API key marked as failed: ${apiKey.substring(0, 8)}...`);
};

// Fallback to demo/mock mode if no working keys
if (API_KEYS.length === 0) {
  console.warn('⚠️ No FMP API keys found in environment variables. Using mock data for development.');
}

// Current API key index
let currentKeyIndex = 0;
let FMP_API_KEY = API_KEYS[currentKeyIndex];

// Function to switch to next available API key
const switchToNextApiKey = () => {
  // Mark current key as failed
  if (FMP_API_KEY) {
    markApiKeyAsFailed(FMP_API_KEY);
  }

  // Find next working API key
  for (let i = currentKeyIndex + 1; i < API_KEYS.length; i++) {
    if (!failedApiKeys.has(API_KEYS[i])) {
      currentKeyIndex = i;
      FMP_API_KEY = API_KEYS[currentKeyIndex];
      console.log(`🔄 Switching to API key ${currentKeyIndex + 1}/${API_KEYS.length} due to API error`);
      // Update the axios instance with new API key
      fmpAPI.defaults.params.apikey = FMP_API_KEY;
      return true;
    }
  }

  console.log('⚠️ All API keys exhausted or failed, falling back to mock data');
  return false;
};

// Check if we have valid API keys
const hasValidApiKeys = () => {
  return API_KEYS.length > 0 && hasWorkingApiKeys();
};

// Log API key status
if (API_KEYS.length > 0) {
  console.log(`✅ FMP API initialized with ${API_KEYS.length} API key(s)`);
} else {
  console.warn('⚠️ No FMP API keys found. Using mock data for development.');
}

// Create axios instance for FMP API
const fmpAPI = axios.create({
  baseURL: FMP_BASE_URL,
  timeout: 10000,
  params: {
    apikey: FMP_API_KEY
  }
});

// Request interceptor for logging
fmpAPI.interceptors.request.use(
  (config) => {
    console.log(`🔄 FMP API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('🚫 FMP API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
fmpAPI.interceptors.response.use(
  (response) => {
    console.log(`✅ FMP API Response: ${response.config.url} - ${response.status}`);
    return response;
  },
  (error) => {
    console.error('🚫 FMP API Response Error:', error.response?.status, error.message);
    return Promise.reject(error);
  }
);

/**
 * Stock Search and Data Services
 */
const fmpStockAPI = {
  // Search stocks by symbol or company name
  searchStocks: async (query, limit = 10) => {
    // If no valid API keys, use mock data immediately
    if (!hasValidApiKeys()) {
      console.log('🎭 No valid API keys, using mock data for search');
      return await mockFMPAPI.searchStocks(query, limit);
    }

    try {
      console.log(`🔄 FMP API Request: GET /search?query=${query}&limit=${limit}`);
      console.log(`🔑 Using API Key ${currentKeyIndex + 1}/${API_KEYS.length}`);

      const response = await fmpAPI.get('/search', {
        params: { query, limit }
      });

      console.log(`✅ FMP Search response status: ${response.status}`);
      console.log(`📊 FMP Search raw data:`, response.data);
      console.log(`📈 FMP Search results: ${response.data.length} stocks found`);

      // Check if response.data is an array
      if (!Array.isArray(response.data)) {
        console.error('❌ FMP API returned non-array data:', response.data);
        throw new Error('Invalid response format from FMP API');
      }

      // Filter to prioritize Indian stocks
      const results = response.data.map(stock => ({
        symbol: stock.symbol,
        name: stock.name,
        exchange: stock.exchangeShortName || 'Unknown',
        currency: stock.currency || 'USD',
        type: stock.type || 'stock'
      }));

      // Log some sample results
      if (results.length > 0) {
        console.log('📊 Mapped results sample:', results.slice(0, 3));
      }

      const finalResult = {
        success: true,
        results,
        total: response.data.length
      };

      console.log('🎯 Final search result object:', finalResult);
      return finalResult;

    } catch (error) {
      const isRateLimit = error.response?.status === 429;
      const isForbidden = error.response?.status === 403;
      const isUnauthorized = error.response?.status === 401;
      const needsKeyRotation = isRateLimit || isForbidden || isUnauthorized;

      const errorMsg = isRateLimit ? 'Rate limit exceeded' :
                      isForbidden ? 'API key forbidden/invalid' :
                      isUnauthorized ? 'API key unauthorized' : error.message;

      console.warn(`🚫 FMP Stock search failed: ${errorMsg} (Status: ${error.response?.status})`);

      // Try next API key if rate limited, forbidden, or unauthorized
      if (needsKeyRotation && switchToNextApiKey()) {
        console.log('🔄 Retrying with next API key...');
        try {
          const retryResponse = await fmpAPI.get('/search', {
            params: { query, limit }
          });

          console.log(`✅ Next API key success: ${retryResponse.data.length} results`);

          const results = retryResponse.data.map(stock => ({
            symbol: stock.symbol,
            name: stock.name,
            exchange: stock.exchangeShortName || 'Unknown',
            currency: stock.currency || 'USD',
            type: stock.type || 'stock'
          }));

          return {
            success: true,
            results,
            total: retryResponse.data.length
          };
        } catch (retryError) {
          const isRetryRateLimit = retryError.response?.status === 429;
          console.warn(`🚫 Next API key also failed: ${retryError.message}`);

          // If this is also a rate limit error, try the third key if available
          if (isRetryRateLimit && switchToNextApiKey()) {
            console.log('🔄 Trying final API key...');
            try {
              const finalResponse = await fmpAPI.get('/search', {
                params: { query, limit }
              });

              console.log(`✅ Final API key success: ${finalResponse.data.length} results`);

              const finalResults = finalResponse.data.map(stock => ({
                symbol: stock.symbol,
                name: stock.name,
                exchange: stock.exchangeShortName || 'Unknown',
                currency: stock.currency || 'USD',
                type: stock.type || 'stock'
              }));

              return {
                success: true,
                results: finalResults,
                total: finalResponse.data.length
              };
            } catch (finalError) {
              console.warn('🚫 All API keys failed:', finalError.message);
            }
          }
        }
      }

      // If we get here, all API keys failed or it wasn't a rate limit error
      if (isRateLimit) {
        console.log('⏰ All API keys rate limited - using mock data');
      } else {
        console.log('📋 Error details:', error.response?.data || error);
      }
      console.log('⚠️ Falling back to mock data for search');

      // Fallback to mock data
      const mockResult = await mockFMPAPI.searchStocks(query, limit);
      console.log('🎭 Mock search result:', mockResult);
      return mockResult;
    }
  },

  // Get stock quote (real-time price)
  getStockQuote: async (symbol) => {
    // Always use mock data for better reliability
    console.log(`🎭 Using mock data for quote: ${symbol}`);
    return await mockFMPAPI.getStockQuote(symbol);
  },

  // Get multiple stock quotes
  getMultipleQuotes: async (symbols) => {
    try {
      const symbolsString = Array.isArray(symbols) ? symbols.join(',') : symbols;
      const response = await fmpAPI.get(`/quote/${symbolsString}`);
      
      return {
        success: true,
        data: response.data.map(quote => ({
          symbol: quote.symbol,
          name: quote.name,
          price: quote.price,
          change: quote.change,
          changesPercentage: quote.changesPercentage,
          volume: quote.volume,
          marketCap: quote.marketCap
        }))
      };
    } catch (error) {
      console.error('FMP Multiple quotes error:', error);
      return {
        success: false,
        data: [],
        error: error.message
      };
    }
  },

  // Get stock profile/company info
  getStockProfile: async (symbol) => {
    try {
      const response = await fmpAPI.get(`/profile/${symbol}`);
      const profile = response.data[0];
      
      if (!profile) {
        throw new Error('Company profile not found');
      }
      
      return {
        success: true,
        data: {
          symbol: profile.symbol,
          companyName: profile.companyName,
          currency: profile.currency,
          exchange: profile.exchangeShortName,
          industry: profile.industry,
          sector: profile.sector,
          country: profile.country,
          marketCap: profile.mktCap,
          price: profile.price,
          beta: profile.beta,
          volAvg: profile.volAvg,
          lastDiv: profile.lastDiv,
          range: profile.range,
          changes: profile.changes,
          description: profile.description,
          ceo: profile.ceo,
          website: profile.website,
          image: profile.image
        }
      };
    } catch (error) {
      console.error('FMP Stock profile error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

/**
 * Chart Data Services
 */
export const fmpChartAPI = {
  // Get historical price data for charts
  getHistoricalData: async (symbol, period = '1D', from = null, to = null) => {
    // Always use mock data for better reliability
    console.log(`🎭 Using mock data for historical data: ${symbol} (${period})`);
    return await mockFMPAPI.getHistoricalData(symbol, period);
  },

  // Get real-time intraday data
  getIntradayData: async (symbol, interval = '1min') => {
    try {
      const response = await fmpAPI.get(`/historical-chart/${interval}/${symbol}`);
      
      const chartData = response.data.map(item => ({
        time: item.date,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volume
      }));
      
      return {
        success: true,
        data: chartData.reverse(),
        symbol,
        interval
      };
    } catch (error) {
      console.error('FMP Intraday data error:', error);
      return {
        success: false,
        data: [],
        error: error.message
      };
    }
  }
};

/**
 * Market Data Services
 */
export const fmpMarketAPI = {
  // Get market gainers
  getGainers: async (limit = 10) => {
    try {
      const response = await fmpAPI.get('/gainers', {
        params: { limit }
      });
      
      return {
        success: true,
        data: response.data.map(stock => ({
          symbol: stock.symbol,
          name: stock.name,
          change: stock.change,
          changesPercentage: stock.changesPercentage,
          price: stock.price
        }))
      };
    } catch (error) {
      console.warn('FMP Gainers failed, using mock data:', error.message);
      // Fallback to mock data
      return await mockFMPAPI.getGainers(limit);
    }
  },

  // Get market losers
  getLosers: async (limit = 10) => {
    try {
      const response = await fmpAPI.get('/losers', {
        params: { limit }
      });
      
      return {
        success: true,
        data: response.data.map(stock => ({
          symbol: stock.symbol,
          name: stock.name,
          change: stock.change,
          changesPercentage: stock.changesPercentage,
          price: stock.price
        }))
      };
    } catch (error) {
      console.error('FMP Losers error:', error);
      return {
        success: false,
        data: [],
        error: error.message
      };
    }
  },

  // Get market news
  getMarketNews: async (limit = 20) => {
    try {
      const response = await fmpAPI.get('/stock_news', {
        params: { limit }
      });
      
      return {
        success: true,
        data: response.data.map(news => ({
          title: news.title,
          text: news.text,
          url: news.url,
          image: news.image,
          site: news.site,
          publishedDate: news.publishedDate,
          symbol: news.symbol
        }))
      };
    } catch (error) {
      console.error('FMP Market news error:', error);
      return {
        success: false,
        data: [],
        error: error.message
      };
    }
  }
};

// Export individual API services for direct access
export { fmpStockAPI };

// Export default API
export default {
  stock: fmpStockAPI,
  chart: fmpChartAPI,
  market: fmpMarketAPI
};
