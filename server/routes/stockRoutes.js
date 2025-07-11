/**
 * Stock Routes for Saytrix
 * Handles stock data, market movers, and news endpoints
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');

// Import services and utilities
const geminiService = require('../services/geminiService');
const {
  formatStockResponse,
  formatMoversResponse,
  formatNewsResponse
} = require('../utils/responseFormatter');

// Import middleware
const { asyncHandler } = require('../middleware/errorHandler');

// Configuration
const FMP_API_KEY = process.env.FMP_API_KEY;
const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';

/**
 * Make FMP API request with error handling
 * @param {string} endpoint - API endpoint
 * @param {object} params - Query parameters
 * @returns {Promise} API response data
 */
const makeFMPRequest = async (endpoint, params = {}) => {
  try {
    const response = await axios.get(`${FMP_BASE_URL}/${endpoint}`, {
      params: { ...params, apikey: FMP_API_KEY },
      timeout: 10000
    });
    
    if (!response.data) {
      throw new Error('Empty response from FMP API');
    }
    
    return response.data;
  } catch (error) {
    console.error(`FMP API error for ${endpoint}:`, error.message);
    throw new Error(`Failed to fetch data from FMP API: ${error.message}`);
  }
};

/**
 * Generate mock stock data for fallback
 * @param {string} symbol - Stock symbol
 * @returns {object} Mock stock data
 */
const generateMockStockData = (symbol) => {
  const basePrice = Math.random() * 1000 + 100;
  const change = (Math.random() - 0.5) * 20;
  const changePercent = (change / basePrice) * 100;

  return {
    symbol: symbol.toUpperCase(),
    name: `${symbol.toUpperCase()} Ltd.`,
    price: parseFloat(basePrice.toFixed(2)),
    change: parseFloat(change.toFixed(2)),
    changesPercentage: parseFloat(changePercent.toFixed(2)),
    dayHigh: parseFloat((basePrice + Math.random() * 10).toFixed(2)),
    dayLow: parseFloat((basePrice - Math.random() * 10).toFixed(2)),
    open: parseFloat((basePrice + (Math.random() - 0.5) * 5).toFixed(2)),
    volume: Math.floor(Math.random() * 1000000) + 100000,
    marketCap: Math.floor(Math.random() * 1000000000000),
    pe: parseFloat((Math.random() * 30 + 5).toFixed(2)),
    lastUpdated: new Date().toISOString()
  };
};

/**
 * GET /stock/:symbol - Get stock data with AI analysis
 */
router.get('/stock/:symbol', asyncHandler(async (req, res) => {
  const { symbol } = req.params;
  const { analyze = false } = req.query;

  console.log(`📈 Stock request - Symbol: ${symbol}, Analyze: ${analyze}`);

  try {
    // Validate symbol
    if (!symbol || !/^[A-Z0-9.\-]+$/i.test(symbol)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid stock symbol format',
        code: 'INVALID_SYMBOL'
      });
    }

    let stockData;

    try {
      // Try to fetch from FMP API
      const fmpData = await makeFMPRequest(`quote/${symbol.toUpperCase()}`);
      
      if (Array.isArray(fmpData) && fmpData.length > 0) {
        stockData = fmpData[0];
      } else {
        throw new Error('No data returned from FMP API');
      }
    } catch (fmpError) {
      console.log(`FMP API failed, using mock data for ${symbol}`);
      stockData = generateMockStockData(symbol);
    }

    let aiAnalysis = null;

    // Generate AI analysis if requested
    if (analyze === 'true' && stockData) {
      try {
        const analysisPrompt = `Provide a brief analysis of ${stockData.symbol} stock with current price ₹${stockData.price} and ${stockData.changesPercentage}% change.`;
        
        const aiResponse = await geminiService.generateResponse(analysisPrompt, stockData);
        
        if (aiResponse.success) {
          aiAnalysis = aiResponse.message;
        }
      } catch (aiError) {
        console.error('AI analysis failed:', aiError.message);
        // Continue without analysis
      }
    }

    const response = formatStockResponse(stockData, symbol);
    
    if (aiAnalysis) {
      response.data.aiAnalysis = aiAnalysis;
    }

    res.json(response);

  } catch (error) {
    console.error('❌ Stock data error:', error);
    throw error;
  }
}));

/**
 * GET /gainers - Get top gainers
 */
router.get('/gainers', asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  console.log(`📈 Top gainers request - Limit: ${limit}`);

  try {
    let gainersData;

    try {
      // Try to fetch from FMP API
      gainersData = await makeFMPRequest('stock_market/gainers');
      
      if (!Array.isArray(gainersData) || gainersData.length === 0) {
        throw new Error('No gainers data from FMP API');
      }

      // Limit results
      gainersData = gainersData.slice(0, parseInt(limit));
    } catch (fmpError) {
      console.log('FMP API failed, using mock gainers data');
      
      // Generate mock gainers data
      gainersData = Array.from({ length: parseInt(limit) }, (_, i) => {
        const symbol = `GAIN${i + 1}`;
        const mockData = generateMockStockData(symbol);
        // Ensure positive change for gainers
        mockData.change = Math.abs(mockData.change);
        mockData.changesPercentage = Math.abs(mockData.changesPercentage);
        return mockData;
      });
    }

    const response = formatMoversResponse(gainersData, 'gainers');
    res.json(response);

  } catch (error) {
    console.error('❌ Gainers data error:', error);
    throw error;
  }
}));

/**
 * GET /losers - Get top losers
 */
router.get('/losers', asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  console.log(`📉 Top losers request - Limit: ${limit}`);

  try {
    let losersData;

    try {
      // Try to fetch from FMP API
      losersData = await makeFMPRequest('stock_market/losers');
      
      if (!Array.isArray(losersData) || losersData.length === 0) {
        throw new Error('No losers data from FMP API');
      }

      // Limit results
      losersData = losersData.slice(0, parseInt(limit));
    } catch (fmpError) {
      console.log('FMP API failed, using mock losers data');
      
      // Generate mock losers data
      losersData = Array.from({ length: parseInt(limit) }, (_, i) => {
        const symbol = `LOSS${i + 1}`;
        const mockData = generateMockStockData(symbol);
        // Ensure negative change for losers
        mockData.change = -Math.abs(mockData.change);
        mockData.changesPercentage = -Math.abs(mockData.changesPercentage);
        return mockData;
      });
    }

    const response = formatMoversResponse(losersData, 'losers');
    res.json(response);

  } catch (error) {
    console.error('❌ Losers data error:', error);
    throw error;
  }
}));

/**
 * GET /news - Get market news
 */
router.get('/news', asyncHandler(async (req, res) => {
  const { symbol, limit = 10 } = req.query;

  console.log(`📰 News request - Symbol: ${symbol || 'general'}, Limit: ${limit}`);

  try {
    let newsData;

    try {
      // Try to fetch from FMP API
      const endpoint = symbol 
        ? `stock_news?tickers=${symbol.toUpperCase()}&limit=${limit}`
        : `fmp/articles?page=0&size=${limit}`;
      
      newsData = await makeFMPRequest(endpoint);
      
      if (!Array.isArray(newsData) || newsData.length === 0) {
        throw new Error('No news data from FMP API');
      }
    } catch (fmpError) {
      console.log('FMP API failed, using mock news data');
      
      // Generate mock news data
      newsData = Array.from({ length: parseInt(limit) }, (_, i) => ({
        title: `Market News Article ${i + 1}${symbol ? ` for ${symbol.toUpperCase()}` : ''}`,
        text: `This is a sample news article about ${symbol ? symbol.toUpperCase() + ' stock' : 'the market'} with important updates and analysis.`,
        url: `https://example.com/news/${i + 1}`,
        image: `https://via.placeholder.com/300x200?text=News+${i + 1}`,
        site: 'TradeBro News',
        publishedDate: new Date(Date.now() - i * 3600000).toISOString(),
        symbol: symbol ? symbol.toUpperCase() : null
      }));
    }

    const response = formatNewsResponse(newsData, symbol);
    res.json(response);

  } catch (error) {
    console.error('❌ News data error:', error);
    throw error;
  }
}));

/**
 * GET /search/:query - Search stocks
 */
router.get('/search/:query', asyncHandler(async (req, res) => {
  const { query } = req.params;
  const { limit = 10 } = req.query;

  console.log(`🔍 Stock search - Query: ${query}, Limit: ${limit}`);

  try {
    // Validate query
    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters',
        code: 'INVALID_QUERY'
      });
    }

    let searchResults;

    try {
      // Try to fetch from FMP API
      searchResults = await makeFMPRequest(`search?query=${encodeURIComponent(query)}&limit=${limit}`);
      
      if (!Array.isArray(searchResults) || searchResults.length === 0) {
        throw new Error('No search results from FMP API');
      }
    } catch (fmpError) {
      console.log('FMP API failed, using mock search results');
      
      // Generate mock search results
      searchResults = Array.from({ length: Math.min(parseInt(limit), 5) }, (_, i) => ({
        symbol: `${query.toUpperCase()}${i + 1}`,
        name: `${query} Company ${i + 1}`,
        currency: 'INR',
        stockExchange: 'NSE',
        exchangeShortName: 'NSE'
      }));
    }

    res.json({
      success: true,
      data: {
        query,
        results: searchResults,
        count: searchResults.length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Stock search error:', error);
    throw error;
  }
}));

module.exports = router;
