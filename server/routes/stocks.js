/**
 * Stocks API Router - Refactored and Modularized
 * Integrates with Financial Modeling Prep (FMP) API with comprehensive error handling,
 * caching, validation, and mock data fallbacks
 */

const express = require('express');
const axios = require('axios');
const router = express.Router();

// Import utilities and middleware
const { cache } = require('../utils/cache');
const { applyLiveFluctuation } = require('../utils/randomizer');
const {
  generateMockStockData,
  generateMockChartData,
  generateMockHistoricalData,
  generateMockIndices,
  generateMockTopGainers,
  generateMockTopLosers,
  generateMockStockList,
  isIndianStock,
  formatStockName,
  PREDEFINED_STOCKS
} = require('../utils/mockData');
const {
  validateSymbolMiddleware,
  validateMultipleSymbolsMiddleware,
  validateChartInterval
} = require('../utils/validation');
const { compressionMiddleware } = require('../middleware/compression');

// Apply compression middleware to all routes
router.use(compressionMiddleware);

// Configuration
const API_KEY = process.env.FMP_API_KEY;
const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';

/**
 * Error handler for API responses
 * @param {Error} error - Error object
 * @param {string} endpoint - API endpoint
 * @param {object} res - Express response object
 * @param {function} fallbackFn - Fallback function for mock data
 */
const handleApiError = (error, endpoint, res, fallbackFn) => {
  console.error(`API Error for ${endpoint}:`, error.message);
  
  // Determine appropriate status code
  let statusCode = 500;
  if (error.response) {
    statusCode = error.response.status === 401 ? 502 : error.response.status;
  } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    statusCode = 502; // Bad Gateway for connection issues
  }

  // If fallback function provided, use mock data
  if (fallbackFn) {
    console.log(`Using mock data fallback for ${endpoint}`);
    try {
      const mockData = fallbackFn();
      return res.json(mockData);
    } catch (mockError) {
      console.error('Mock data generation failed:', mockError.message);
    }
  }

  // Return error response
  res.status(statusCode).json({
    success: false,
    error: 'Failed to fetch data from FMP API',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Service temporarily unavailable',
    endpoint,
    code: error.response?.status === 401 ? 'API_KEY_INVALID' : 'API_ERROR'
  });
};

/**
 * Make API request with error handling
 * @param {string} endpoint - API endpoint
 * @param {object} params - Query parameters
 * @returns {Promise} API response data
 */
const makeApiRequest = async (endpoint, params = {}) => {
  const response = await axios.get(`${FMP_BASE_URL}/${endpoint}`, {
    params: { ...params, apikey: API_KEY },
    timeout: 10000 // 10 second timeout
  });
  
  if (!response.data) {
    throw new Error('Empty response from API');
  }
  
  return response.data;
};

/**
 * Get stock quote with caching and fallback
 */
const getStockQuote = async (req, res) => {
  try {
    const { symbol } = req.params;
    const { userId } = req.query;
    const cacheKey = `quote/${symbol}${userId ? `/${userId}` : ''}`;

    // Check cache first
    const cachedData = cache.get(cacheKey, 'QUOTE');
    if (cachedData) {
      console.log(`Cache hit for: ${cacheKey}`);
      return res.json(cachedData);
    }

    let stockData;

    // Handle Indian stocks with mock data
    if (isIndianStock(symbol)) {
      console.log(`Using mock data for Indian stock: ${symbol}`);
      
      const stockInfo = PREDEFINED_STOCKS.find(s => s.symbol === symbol);
      const stockName = stockInfo?.name || formatStockName(symbol);
      
      stockData = [generateMockStockData(symbol, stockName)];
      
      // Apply live fluctuation
      stockData = applyLiveFluctuation(stockData, 'random', { userId });
    } else {
      // Try FMP API for non-Indian stocks
      try {
        stockData = await makeApiRequest(`quote/${symbol}`);
        
        if (Array.isArray(stockData) && stockData.length > 0) {
          // Apply live fluctuation to API data
          stockData = applyLiveFluctuation(stockData, 'random', { userId });
        } else {
          throw new Error('Empty response from API');
        }
      } catch (apiError) {
        // Fallback to mock data
        console.log(`API failed, using mock data for: ${symbol}`);
        stockData = [generateMockStockData(symbol, formatStockName(symbol))];
        stockData = applyLiveFluctuation(stockData, 'random', { userId });
      }
    }

    // Cache the result
    cache.set(cacheKey, stockData, 'QUOTE');
    res.json(stockData);

  } catch (error) {
    handleApiError(error, `quote/${req.params.symbol}`, res, () => {
      const mockData = [generateMockStockData(req.params.symbol, formatStockName(req.params.symbol))];
      return applyLiveFluctuation(mockData, 'random', { userId: req.query.userId });
    });
  }
};

/**
 * Get stock chart data
 */
const getStockChart = async (req, res) => {
  try {
    const { symbol } = req.params;
    const { interval = '5min' } = req.query;
    
    // Validate interval
    const intervalValidation = validateChartInterval(interval);
    if (!intervalValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: intervalValidation.error,
        code: intervalValidation.code
      });
    }

    const cacheKey = `chart/${intervalValidation.interval}/${symbol}`;

    // Check cache first
    const cachedData = cache.get(cacheKey, 'CHART');
    if (cachedData) {
      console.log(`Cache hit for: ${cacheKey}`);
      return res.json(cachedData);
    }

    let chartData;

    // Handle Indian stocks with mock data
    if (isIndianStock(symbol)) {
      console.log(`Using mock chart data for Indian stock: ${symbol}`);
      chartData = generateMockChartData(symbol, 100, intervalValidation.interval);
    } else {
      // Try FMP API for non-Indian stocks
      try {
        const apiEndpoint = `historical-chart/${intervalValidation.interval}/${symbol}`;
        const apiData = await makeApiRequest(apiEndpoint);
        
        if (Array.isArray(apiData) && apiData.length > 0) {
          // Format the data for chart library
          chartData = apiData.map(candle => ({
            time: new Date(candle.date).getTime(),
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
            volume: candle.volume
          }));
        } else {
          throw new Error('Empty response from API');
        }
      } catch (apiError) {
        // Fallback to mock data
        console.log(`API failed, using mock chart data for: ${symbol}`);
        chartData = generateMockChartData(symbol, 100, intervalValidation.interval);
      }
    }

    // Cache the result
    cache.set(cacheKey, chartData, 'CHART');
    res.json(chartData);

  } catch (error) {
    handleApiError(error, `chart/${req.params.symbol}`, res, () => {
      return generateMockChartData(req.params.symbol, 100, req.query.interval || '5min');
    });
  }
};

/**
 * Get historical price data
 */
const getHistoricalData = async (req, res) => {
  try {
    const { symbol } = req.params;
    const cacheKey = `historical/${symbol}`;

    // Check cache first
    const cachedData = cache.get(cacheKey, 'HISTORICAL');
    if (cachedData) {
      console.log(`Cache hit for: ${cacheKey}`);
      return res.json(cachedData);
    }

    let historicalData;

    // Handle Indian stocks with mock data
    if (isIndianStock(symbol)) {
      console.log(`Using mock historical data for Indian stock: ${symbol}`);
      historicalData = generateMockHistoricalData(symbol, 30);
    } else {
      // Try FMP API for non-Indian stocks
      try {
        historicalData = await makeApiRequest(`historical-price-full/${symbol}`);
        
        if (!historicalData.historical || historicalData.historical.length === 0) {
          throw new Error('Empty historical data from API');
        }
      } catch (apiError) {
        // Fallback to mock data
        console.log(`API failed, using mock historical data for: ${symbol}`);
        historicalData = generateMockHistoricalData(symbol, 30);
      }
    }

    // Cache the result
    cache.set(cacheKey, historicalData, 'HISTORICAL');
    res.json(historicalData);

  } catch (error) {
    handleApiError(error, `historical/${req.params.symbol}`, res, () => {
      return generateMockHistoricalData(req.params.symbol, 30);
    });
  }
};

/**
 * Get batch stock quotes
 */
const getBatchQuotes = async (req, res) => {
  try {
    const { symbols, userId } = req.query;
    const validation = req.validated; // From middleware
    const cacheKey = `batch/${symbols}${userId ? `/${userId}` : ''}`;

    // Check cache first
    const cachedData = cache.get(cacheKey, 'BATCH_QUOTES');
    if (cachedData) {
      console.log(`Cache hit for: ${cacheKey}`);
      return res.json(cachedData);
    }

    const symbolArray = validation.validSymbols;
    const hasIndianStocks = symbolArray.some(isIndianStock);
    let stockData = [];

    // Handle Indian stocks with mock data
    if (hasIndianStocks) {
      console.log(`Processing batch request with Indian stocks: ${symbols}`);

      for (const symbol of symbolArray) {
        if (isIndianStock(symbol)) {
          const stockInfo = PREDEFINED_STOCKS.find(s => s.symbol === symbol);
          const stockName = stockInfo?.name || formatStockName(symbol);
          const mockStock = generateMockStockData(symbol, stockName);
          stockData.push(mockStock);
        } else {
          // Try API for non-Indian stocks
          try {
            const apiData = await makeApiRequest(`quote/${symbol}`);
            if (apiData && apiData.length > 0) {
              stockData.push(...apiData);
            }
          } catch (apiError) {
            // Fallback to mock data
            const mockStock = generateMockStockData(symbol, formatStockName(symbol));
            stockData.push(mockStock);
          }
        }
      }
    } else {
      // Try API for all non-Indian stocks
      try {
        stockData = await makeApiRequest(`quote/${symbols}`);
        if (!Array.isArray(stockData) || stockData.length === 0) {
          throw new Error('Empty response from API');
        }
      } catch (apiError) {
        // Fallback to mock data for all symbols
        console.log(`API failed, using mock data for batch: ${symbols}`);
        stockData = symbolArray.map(symbol =>
          generateMockStockData(symbol, formatStockName(symbol))
        );
      }
    }

    // Apply live fluctuation
    stockData = applyLiveFluctuation(stockData, 'random', { userId });

    // Cache the result
    cache.set(cacheKey, stockData, 'BATCH_QUOTES');
    res.json(stockData);

  } catch (error) {
    handleApiError(error, `batch/${req.query.symbols}`, res, () => {
      const symbols = req.query.symbols.split(',');
      const mockData = symbols.map(symbol =>
        generateMockStockData(symbol.trim(), formatStockName(symbol.trim()))
      );
      return applyLiveFluctuation(mockData, 'random', { userId: req.query.userId });
    });
  }
};

/**
 * Get market indices
 */
const getMarketIndices = async (req, res) => {
  try {
    const cacheKey = 'market-indices';

    // Check cache first
    const cachedData = cache.get(cacheKey, 'MARKET_INDICES');
    if (cachedData) {
      console.log(`Cache hit for: ${cacheKey}`);
      return res.json(cachedData);
    }

    let indicesData;

    try {
      // Try FMP API
      indicesData = await makeApiRequest('quotes/index');

      if (!Array.isArray(indicesData) || indicesData.length === 0) {
        throw new Error('Empty response from API');
      }

      // Apply live fluctuation
      indicesData = applyLiveFluctuation(indicesData, 'random');
    } catch (apiError) {
      // Fallback to mock data
      console.log('API failed, using mock data for market indices');
      indicesData = generateMockIndices();
      indicesData = applyLiveFluctuation(indicesData, 'random');
    }

    // Cache the result
    cache.set(cacheKey, indicesData, 'MARKET_INDICES');
    res.json(indicesData);

  } catch (error) {
    handleApiError(error, 'market-indices', res, () => {
      const mockData = generateMockIndices();
      return applyLiveFluctuation(mockData, 'random');
    });
  }
};

/**
 * Get top gainers
 */
const getTopGainers = async (req, res) => {
  try {
    const cacheKey = 'top-gainers';

    // Check cache first
    const cachedData = cache.get(cacheKey, 'TOP_MOVERS');
    if (cachedData) {
      console.log(`Cache hit for: ${cacheKey}`);
      return res.json(cachedData);
    }

    let gainersData;

    try {
      // Try FMP API
      gainersData = await makeApiRequest('stock_market/gainers');

      if (!Array.isArray(gainersData) || gainersData.length === 0) {
        throw new Error('Empty response from API');
      }

      // Apply gain-focused fluctuation
      gainersData = applyLiveFluctuation(gainersData, 'gain', { intensity: 0.3 });
    } catch (apiError) {
      // Fallback to mock data
      console.log('API failed, using mock data for top gainers');
      gainersData = generateMockTopGainers(10);
      gainersData = applyLiveFluctuation(gainersData, 'gain', { intensity: 0.3 });
    }

    // Cache the result
    cache.set(cacheKey, gainersData, 'TOP_MOVERS');
    res.json(gainersData);

  } catch (error) {
    handleApiError(error, 'top-gainers', res, () => {
      const mockData = generateMockTopGainers(10);
      return applyLiveFluctuation(mockData, 'gain', { intensity: 0.3 });
    });
  }
};

/**
 * Get top losers
 */
const getTopLosers = async (req, res) => {
  try {
    const cacheKey = 'top-losers';

    // Check cache first
    const cachedData = cache.get(cacheKey, 'TOP_MOVERS');
    if (cachedData) {
      console.log(`Cache hit for: ${cacheKey}`);
      return res.json(cachedData);
    }

    let losersData;

    try {
      // Try FMP API
      losersData = await makeApiRequest('stock_market/losers');

      if (!Array.isArray(losersData) || losersData.length === 0) {
        throw new Error('Empty response from API');
      }

      // Apply loss-focused fluctuation
      losersData = applyLiveFluctuation(losersData, 'loss', { intensity: 0.3 });
    } catch (apiError) {
      // Fallback to mock data
      console.log('API failed, using mock data for top losers');
      losersData = generateMockTopLosers(10);
      losersData = applyLiveFluctuation(losersData, 'loss', { intensity: 0.3 });
    }

    // Cache the result
    cache.set(cacheKey, losersData, 'TOP_MOVERS');
    res.json(losersData);

  } catch (error) {
    handleApiError(error, 'top-losers', res, () => {
      const mockData = generateMockTopLosers(10);
      return applyLiveFluctuation(mockData, 'loss', { intensity: 0.3 });
    });
  }
};

/**
 * Get stock list
 */
const getStockList = async (req, res) => {
  try {
    const cacheKey = 'stock-list';

    // Check cache first
    const cachedData = cache.get(cacheKey, 'STOCK_LIST');
    if (cachedData) {
      console.log(`Cache hit for: ${cacheKey}`);
      return res.json(cachedData);
    }

    // Return mock data immediately for better performance
    const mockStockList = generateMockStockList();
    res.json(mockStockList);

    // Try to update cache in background
    try {
      const apiData = await makeApiRequest('stock/list');

      if (Array.isArray(apiData) && apiData.length > 0) {
        // Filter to include only relevant stocks
        const filteredData = apiData.filter(stock =>
          stock.symbol.endsWith('.NS') ||
          stock.symbol.endsWith('.BO') ||
          ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA'].includes(stock.symbol)
        );

        // Update cache with fresh data
        cache.set(cacheKey, filteredData, 'STOCK_LIST');
        console.log(`Updated stock list cache with ${filteredData.length} stocks`);
      }
    } catch (backgroundError) {
      console.error('Background stock list update failed:', backgroundError.message);
      // Cache mock data to prevent repeated API calls
      cache.set(cacheKey, mockStockList, 'STOCK_LIST');
    }

  } catch (error) {
    handleApiError(error, 'stock-list', res, generateMockStockList);
  }
};

/**
 * Get cache information (debugging endpoint)
 */
const getCacheInfo = (req, res) => {
  try {
    const cacheInfo = cache.getInfo();
    res.json({
      success: true,
      cache: cacheInfo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve cache information',
      message: error.message
    });
  }
};

// Route definitions
router.get('/quote/:symbol', validateSymbolMiddleware, getStockQuote);
router.get('/chart/:symbol', validateSymbolMiddleware, getStockChart);
router.get('/historical/:symbol', validateSymbolMiddleware, getHistoricalData);
router.get('/batch', validateMultipleSymbolsMiddleware, getBatchQuotes);
router.get('/indices', getMarketIndices);
router.get('/gainers', getTopGainers);
router.get('/losers', getTopLosers);
router.get('/list', getStockList);
router.get('/cache-info', getCacheInfo);

module.exports = router;
