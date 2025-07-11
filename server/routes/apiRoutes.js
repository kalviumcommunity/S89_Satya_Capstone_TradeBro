const express = require("express");
const rateLimit = require('express-rate-limit');
require("dotenv").config();

const router = express.Router();

// Import utilities
const {
  validateAPIKeys,
  validateStockSymbol,
  fetchFromFMP,
  fetchFromTwelveData,
  createErrorResponse,
  createSuccessResponse
} = require('../utils/apiHelpers');
const {
  generateMockChartData,
  validateChartParams,
  formatChartResponse,
  getDataCountForRange
} = require('../utils/chartHelpers');
const asyncHandler = require('../utils/asyncHandler');

// Validate API keys at startup
try {
  validateAPIKeys();
} catch (error) {
  console.error('❌ API Keys validation failed:', error.message);
  // Don't exit process, but log the error
}

// Rate limiting for API routes
const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many API requests, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiting for chart and screener routes
const heavyApiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per windowMs for heavy endpoints
  message: {
    success: false,
    message: 'Too many requests to data-intensive endpoints, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all routes
router.use(apiRateLimit);

// 1. Get stock price and volume (FIXED: Using correct quote-short endpoint)
router.get("/stocks/price/:symbol", asyncHandler(async (req, res) => {
  const { symbol } = req.params;

  // Validate stock symbol
  const validation = validateStockSymbol(symbol);
  if (!validation.isValid) {
    return res.status(400).json(createErrorResponse(
      new Error(validation.error),
      'stock_price_validation'
    ));
  }

  try {
    // Use correct FMP endpoint for current stock price
    const result = await fetchFromFMP(`quote-short/${validation.normalizedSymbol}`);

    if (!result.data || result.data.length === 0) {
      throw new Error('No price data available for this symbol');
    }

    return res.json(createSuccessResponse(result.data, {
      source: result.source,
      duration: result.duration,
      symbol: validation.normalizedSymbol
    }));

  } catch (error) {
    console.error(`Stock price fetch failed for ${symbol}:`, error.message);
    return res.status(500).json(createErrorResponse(error, 'stock_price_fetch'));
  }
}));

// 2. Dividend-adjusted price chart
router.get("/stocks/history/:symbol", async (req, res) => {
  const { symbol } = req.params;
  try {
    const response = await axios.get(
      `https://financialmodelingprep.com/stable/historical-price-eod/dividend-adjusted?symbol=${symbol}&apikey=${FMP_API}`
    );
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch history",err });
  }
});



// 5. Screener API
router.get("/screener", heavyApiRateLimit, asyncHandler(async (req, res) => {
  const {
    marketCapMoreThan,
    marketCapLowerThan,
    priceMoreThan,
    priceLowerThan,
    betaMoreThan,
    betaLowerThan,
    volumeMoreThan,
    volumeLowerThan,
    sector,
    industry,
    country = 'US',
    exchange,
    limit = 100
  } = req.query;

  try {
    // Build screener endpoint with parameters
    let endpoint = `stock-screener?limit=${limit}&country=${country}`;

    if (marketCapMoreThan) endpoint += `&marketCapMoreThan=${marketCapMoreThan}`;
    if (marketCapLowerThan) endpoint += `&marketCapLowerThan=${marketCapLowerThan}`;
    if (priceMoreThan) endpoint += `&priceMoreThan=${priceMoreThan}`;
    if (priceLowerThan) endpoint += `&priceLowerThan=${priceLowerThan}`;
    if (betaMoreThan) endpoint += `&betaMoreThan=${betaMoreThan}`;
    if (betaLowerThan) endpoint += `&betaLowerThan=${betaLowerThan}`;
    if (volumeMoreThan) endpoint += `&volumeMoreThan=${volumeMoreThan}`;
    if (volumeLowerThan) endpoint += `&volumeLowerThan=${volumeLowerThan}`;
    if (sector) endpoint += `&sector=${encodeURIComponent(sector)}`;
    if (industry) endpoint += `&industry=${encodeURIComponent(industry)}`;
    if (exchange) endpoint += `&exchange=${exchange}`;

    const result = await fetchFromFMP(endpoint);

    return res.json(createSuccessResponse(result.data, {
      source: result.source,
      duration: result.duration,
      count: result.data?.length || 0,
      filters: {
        marketCapMoreThan,
        marketCapLowerThan,
        priceMoreThan,
        priceLowerThan,
        sector,
        industry,
        country,
        exchange
      }
    }));

  } catch (error) {
    console.error('Screener fetch failed:', error.message);
    return res.status(500).json(createErrorResponse(error, 'screener_fetch'));
  }
}));

// 6. Ratings snapshot
router.get("/ratings/:symbol", async (req, res) => {
  const { symbol } = req.params;
  try {
    const response = await axios.get(
      `https://financialmodelingprep.com/stable/ratings-snapshot?symbol=${symbol}&apikey=${FMP_API}`
    );
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch ratings",err });
  }
});

// 7. Historical rating
router.get("/ratings-history/:symbol", async (req, res) => {
  const { symbol } = req.params;
  try {
    const response = await axios.get(
      `https://financialmodelingprep.com/stable/ratings-historical?symbol=${symbol}&apikey=${FMP_API}`
    );
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch historical ratings",err });
  }
});

// 8. News API (FIXED: Using correct stock_news endpoint)
router.get("/news", asyncHandler(async (req, res) => {
  const { limit = 50 } = req.query;

  try {
    // Use correct FMP endpoint for stock news
    const result = await fetchFromFMP(`stock_news?limit=${limit}`);

    return res.json(createSuccessResponse(result.data, {
      source: result.source,
      duration: result.duration,
      count: result.data?.length || 0
    }));

  } catch (error) {
    console.error('News fetch failed:', error.message);
    return res.status(500).json(createErrorResponse(error, 'news_fetch'));
  }
}));

// 9. IPO Calendar
router.get("/ipos", async (req, res) => {
  try {
    const response = await axios.get(
      `https://financialmodelingprep.com/stable/ipos-calendar?apikey=${FMP_API}`
    );
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch IPOs",err });
  }
});

// 10. Exchange variants
router.get("/exchange/:symbol", async (req, res) => {
  const { symbol } = req.params;
  try {
    const response = await axios.get(
      `https://financialmodelingprep.com/stable/search-exchange-variants?symbol=${symbol}&apikey=${FMP_API}`
    );
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch exchange variants",err });
  }
});

// 11. Enhanced 5-minute chart data with range support
router.get("/chart/5min/:symbol", heavyApiRateLimit, asyncHandler(async (req, res) => {
  const { symbol } = req.params;
  const { range = '1D' } = req.query; // Default to 1 day
  const interval = '5min';

  // Validate chart parameters
  const validation = validateChartParams(symbol, range, interval);
  if (!validation.isValid) {
    return res.status(400).json(createErrorResponse(
      new Error(`Validation failed: ${validation.errors.join(', ')}`),
      'chart_validation'
    ));
  }

  const { normalizedSymbol, dataCount } = validation;
  console.log(`📊 Fetching ${interval} chart data for ${normalizedSymbol} (range: ${range}, count: ${dataCount})`);

  try {
    // Try FMP API first
    try {
      const endpoint = `historical-chart/${interval}/${normalizedSymbol}`;
      const result = await fetchFromFMP(endpoint);

      if (result.data && Array.isArray(result.data) && result.data.length > 0) {
        // Format the data for chart library
        const formattedData = result.data
          .slice(0, dataCount) // Limit to requested range
          .map(candle => ({
            time: new Date(candle.date).getTime(),
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
            volume: candle.volume
          }))
          .sort((a, b) => a.time - b.time); // Ensure chronological order

        return res.json(formatChartResponse(formattedData, result.source, {
          symbol: normalizedSymbol,
          interval,
          range,
          duration: result.duration
        }));
      } else {
        throw new Error('Empty or invalid response from FMP API');
      }
    } catch (fmpError) {
      console.warn(`FMP API failed for ${normalizedSymbol}:`, fmpError.message);

      // Try Twelve Data API as fallback
      try {
        const endpoint = `time_series?symbol=${normalizedSymbol}&interval=${interval}&outputsize=${dataCount}`;
        const result = await fetchFromTwelveData(endpoint);

        if (result.data && result.data.values && Array.isArray(result.data.values)) {
          const formattedData = result.data.values.map(candle => ({
            time: new Date(candle.datetime).getTime(),
            open: parseFloat(candle.open),
            high: parseFloat(candle.high),
            low: parseFloat(candle.low),
            close: parseFloat(candle.close),
            volume: parseInt(candle.volume || 0)
          })).sort((a, b) => a.time - b.time);

          return res.json(formatChartResponse(formattedData, result.source, {
            symbol: normalizedSymbol,
            interval,
            range,
            duration: result.duration
          }));
        } else {
          throw new Error('Empty or invalid response from Twelve Data API');
        }
      } catch (twelveDataError) {
        console.warn(`Twelve Data API also failed for ${normalizedSymbol}:`, twelveDataError.message);
        throw new Error('Both FMP and Twelve Data APIs failed');
      }
    }
  } catch (error) {
    console.error(`Failed to fetch chart data for ${normalizedSymbol}:`, error.message);

    // Generate mock data as a last resort
    const mockData = generateMockChartData(normalizedSymbol, {
      interval,
      count: dataCount
    });

    return res.json(formatChartResponse(mockData, 'mock', {
      symbol: normalizedSymbol,
      interval,
      range,
      message: 'Using mock data due to API errors'
    }));
  }
}));

// BONUS: Symbols route for frontend autocomplete
router.get("/symbols", asyncHandler(async (req, res) => {
  const { search, exchange = 'NASDAQ,NYSE', limit = 50 } = req.query;

  try {
    let endpoint = `search?query=${search || 'A'}&limit=${limit}&exchange=${exchange}`;

    const result = await fetchFromFMP(endpoint);

    if (!result.data || !Array.isArray(result.data)) {
      throw new Error('Invalid response from symbols API');
    }

    // Format symbols for autocomplete
    const formattedSymbols = result.data.map(item => ({
      symbol: item.symbol,
      name: item.name,
      exchange: item.exchangeShortName,
      type: item.type || 'stock',
      currency: item.currency || 'USD'
    }));

    return res.json(createSuccessResponse(formattedSymbols, {
      source: result.source,
      duration: result.duration,
      count: formattedSymbols.length,
      search: search || 'A',
      exchange
    }));

  } catch (error) {
    console.error('Symbols fetch failed:', error.message);

    // Return mock symbols as fallback
    const mockSymbols = [
      { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', type: 'stock', currency: 'USD' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ', type: 'stock', currency: 'USD' },
      { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ', type: 'stock', currency: 'USD' },
      { symbol: 'TSLA', name: 'Tesla, Inc.', exchange: 'NASDAQ', type: 'stock', currency: 'USD' },
      { symbol: 'AMZN', name: 'Amazon.com, Inc.', exchange: 'NASDAQ', type: 'stock', currency: 'USD' }
    ].filter(s => !search || s.symbol.includes(search.toUpperCase()) || s.name.toLowerCase().includes(search.toLowerCase()));

    return res.json(createSuccessResponse(mockSymbols, {
      source: 'mock',
      duration: 0,
      count: mockSymbols.length,
      search: search || 'A',
      exchange,
      message: 'Using mock symbols due to API error'
    }));
  }
}));

module.exports = router;
