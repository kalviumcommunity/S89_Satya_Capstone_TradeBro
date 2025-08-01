const express = require('express');
const axios = require('axios');
const router = express.Router();

// In-memory cache for API responses
const cache = new Map();
const CACHE_DURATION = 60000; // 60 seconds cache
const API_THROTTLE_DURATION = 60000; // 60 seconds between API calls per symbol
const lastApiCalls = new Map(); // Track last API call time per symbol

// Clean up old cache entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_DURATION * 2) { // Keep cache for 2x duration
      cache.delete(key);
      console.log(`🧹 Cleaned up cache entry: ${key}`);
    }
  }

  // Clean up old API call tracking
  for (const [symbol, timestamp] of lastApiCalls.entries()) {
    if (now - timestamp > API_THROTTLE_DURATION * 2) {
      lastApiCalls.delete(symbol);
    }
  }
}, 300000); // 5 minutes

// FMP API Configuration - Keys from environment variables only
const FMP_API_KEYS = [
  process.env.FMP_API_KEY,
  process.env.FMP_API_KEY_2,
  process.env.FMP_API_KEY_3,
  process.env.FMP_API_KEY_4
].filter(key => key && key !== 'demo'); // Remove null/undefined/demo keys

let currentKeyIndex = 0;

// Validate that we have at least one API key
if (FMP_API_KEYS.length === 0) {
  console.error('❌ No valid FMP API keys found in environment variables');
  console.error('Please set FMP_API_KEY, FMP_API_KEY_2, or FMP_API_KEY_3 in your .env file');
}

// Market hours checker for different exchanges
const isMarketOpen = (exchange = 'NSE') => {
  const now = new Date();
  const istTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
  const day = istTime.getDay(); // 0 = Sunday, 6 = Saturday
  const hours = istTime.getHours();
  const minutes = istTime.getMinutes();
  const currentTime = hours * 60 + minutes;

  // Market closed on weekends
  if (day === 0 || day === 6) {
    return false;
  }

  switch (exchange.toUpperCase()) {
    case 'NSE':
    case 'BSE':
      // Indian markets: 9:15 AM to 3:30 PM IST
      return currentTime >= (9 * 60 + 15) && currentTime <= (15 * 60 + 30);
    case 'NASDAQ':
    case 'NYSE':
      // US markets: 9:30 AM to 4:00 PM EST (converted to IST: 8:00 PM to 2:30 AM next day)
      const usTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
      const usHours = usTime.getHours();
      const usMinutes = usTime.getMinutes();
      const usCurrentTime = usHours * 60 + usMinutes;
      const usDay = usTime.getDay();
      
      if (usDay === 0 || usDay === 6) return false;
      return usCurrentTime >= (9 * 60 + 30) && usCurrentTime <= (16 * 60);
    default:
      return true; // Default to open for unknown exchanges
  }
};

// Get next available API key
const getNextApiKey = () => {
  const key = FMP_API_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % FMP_API_KEYS.length;
  return key;
};

// Generate mock intraday data for fallback
const generateMockIntradayData = (symbol) => {
  const now = new Date();
  const data = [];

  // Set base price based on symbol
  let basePrice = 2500; // Default for Indian stocks

  // Adjust base price for different symbols
  if (symbol.includes('RELIANCE')) basePrice = 2800;
  if (symbol.includes('INFY')) basePrice = 1500;
  if (symbol.includes('TCS')) basePrice = 3500;
  if (symbol.includes('HDFC')) basePrice = 1700;
  if (symbol.includes('ICICI')) basePrice = 950;
  if (symbol.includes('AAPL')) basePrice = 180;
  if (symbol.includes('MSFT')) basePrice = 350;
  if (symbol.includes('GOOGL')) basePrice = 140;
  if (symbol.includes('AMZN')) basePrice = 170;

  // Generate last 100 minutes of data
  for (let i = 100; i >= 0; i--) {
    const time = new Date(now.getTime() - (i * 60 * 1000));
    const variation = (Math.random() - 0.5) * (basePrice * 0.02); // ±1% variation
    const open = basePrice + variation;
    const close = open + (Math.random() - 0.5) * (basePrice * 0.01);
    const high = Math.max(open, close) + Math.random() * (basePrice * 0.005);
    const low = Math.min(open, close) - Math.random() * (basePrice * 0.005);

    data.push({
      date: time.toISOString(),
      open: open.toFixed(2),
      high: high.toFixed(2),
      low: low.toFixed(2),
      close: close.toFixed(2),
      volume: Math.floor(Math.random() * 100000) + 10000
    });
  }

  return data;
};

// Check if we should use cache or make a new API call
const shouldUseCache = (symbol) => {
  const cacheKey = `intraday_${symbol}`;
  const cachedData = cache.get(cacheKey);
  const lastCallTime = lastApiCalls.get(symbol) || 0;
  const now = Date.now();

  // If we have cached data and it's still fresh
  if (cachedData && now - cachedData.timestamp < CACHE_DURATION) {
    console.log(`🔄 Using cached data for ${symbol} (${Math.round((now - cachedData.timestamp) / 1000)}s old)`);
    return true;
  }

  // If we've called the API recently for this symbol, use cache or mock
  if (now - lastCallTime < API_THROTTLE_DURATION) {
    const timeToWait = Math.round((API_THROTTLE_DURATION - (now - lastCallTime)) / 1000);
    console.log(`⏳ API throttled for ${symbol}, ${timeToWait}s remaining until next call`);
    return true;
  }

  return false;
};

// Fetch 1-minute intraday data from FMP API with caching and throttling
const fetchIntradayData = async (symbol, retryCount = 0) => {
  const cacheKey = `intraday_${symbol}`;

  // Check if we should use cache
  if (shouldUseCache(symbol)) {
    const cachedData = cache.get(cacheKey);

    // If we have cached data, use it
    if (cachedData) {
      return cachedData.data;
    }

    // Otherwise, use mock data
    console.log(`🎭 No cached data available, using mock data for ${symbol}`);
    return generateMockIntradayData(symbol);
  }

  // If no API keys available, return mock data immediately
  if (FMP_API_KEYS.length === 0) {
    console.log(`🎭 No API keys available, using mock data for ${symbol}`);
    return generateMockIntradayData(symbol);
  }

  const maxRetries = FMP_API_KEYS.length;

  if (retryCount >= maxRetries) {
    console.log(`🎭 All API keys exhausted, using mock data for ${symbol}`);
    return generateMockIntradayData(symbol);
  }

  const apiKey = getNextApiKey();

  try {
    console.log(`📊 Fetching 1-minute data for ${symbol} (Attempt ${retryCount + 1})`);

    // Update last API call time
    lastApiCalls.set(symbol, Date.now());

    const response = await axios.get(`https://financialmodelingprep.com/api/v3/historical-chart/1min/${symbol}`, {
      params: {
        apikey: apiKey
      },
      timeout: 10000
    });

    if (response.data && Array.isArray(response.data) && response.data.length > 0) {
      console.log(`✅ Received ${response.data.length} data points for ${symbol}`);

      // Cache the response
      cache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now()
      });

      return response.data;
    } else {
      console.log(`⚠️ No data received from API, using mock data for ${symbol}`);
      const mockData = generateMockIntradayData(symbol);

      // Cache the mock data too
      cache.set(cacheKey, {
        data: mockData,
        timestamp: Date.now(),
        isMock: true
      });

      return mockData;
    }
  } catch (error) {
    if (error.response?.status === 429) {
      console.warn(`⚠️ Rate limit hit for key ${currentKeyIndex}, trying next key...`);
      return fetchIntradayData(symbol, retryCount + 1);
    }

    console.warn(`⚠️ API error for ${symbol}:`, error.message);
    console.log(`🎭 Falling back to mock data for ${symbol}`);

    const mockData = generateMockIntradayData(symbol);

    // Cache the mock data too
    cache.set(cacheKey, {
      data: mockData,
      timestamp: Date.now(),
      isMock: true
    });

    return mockData;
  }
};

// Convert FMP data to Lightweight Charts format
const formatDataForLightweightCharts = (data) => {
  return data
    .map(item => {
      const timestamp = new Date(item.date).getTime() / 1000; // Convert to UNIX timestamp
      
      return {
        time: timestamp,
        open: parseFloat(item.open),
        high: parseFloat(item.high),
        low: parseFloat(item.low),
        close: parseFloat(item.close),
        volume: parseInt(item.volume) || 0
      };
    })
    .filter(item => !isNaN(item.time) && !isNaN(item.open))
    .sort((a, b) => a.time - b.time); // Sort by timestamp
};

// Route: Get live 1-minute chart data
router.get('/live/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { from } = req.query; // Optional: timestamp to get data from
    
    console.log(`🔄 Live chart request for ${symbol}`);
    
    // Determine exchange from symbol
    let exchange = 'NASDAQ';
    if (symbol.endsWith('.NS')) exchange = 'NSE';
    if (symbol.endsWith('.BO')) exchange = 'BSE';
    
    // Check if market is open
    const marketOpen = isMarketOpen(exchange);
    
    // Fetch intraday data - this will always return data (real or mock)
    const rawData = await fetchIntradayData(symbol);
    
    // Format data for Lightweight Charts
    const formattedData = formatDataForLightweightCharts(rawData);
    
    // If 'from' timestamp is provided, filter data
    let filteredData = formattedData;
    if (from) {
      const fromTimestamp = parseInt(from);
      filteredData = formattedData.filter(item => item.time > fromTimestamp);
    }
    
    // Get the latest candle
    const latestCandle = filteredData[filteredData.length - 1];
    
    res.json({
      success: true,
      data: filteredData,
      latest: latestCandle,
      marketOpen,
      exchange,
      symbol,
      timestamp: Date.now(),
      count: filteredData.length
    });
    
  } catch (error) {
    console.error(`❌ Error fetching live data for ${req.params.symbol}:`, error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch live chart data',
      error: error.message,
      marketOpen: false
    });
  }
});

// Route: Get latest candle only (for live updates)
router.get('/latest/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;

    console.log(`📈 Latest candle request for ${symbol}`);

    // Determine exchange
    let exchange = 'NASDAQ';
    if (symbol.endsWith('.NS')) exchange = 'NSE';
    if (symbol.endsWith('.BO')) exchange = 'BSE';

    const marketOpen = isMarketOpen(exchange);

    // Fetch recent data - this will always return data (real or mock)
    const rawData = await fetchIntradayData(symbol);

    // Format data for Lightweight Charts
    const formattedData = formatDataForLightweightCharts(rawData);

    if (formattedData.length === 0) {
      // Generate a single mock candle if formatting failed
      const now = Math.floor(Date.now() / 1000);
      const mockCandle = {
        time: now,
        open: 2500,
        high: 2520,
        low: 2480,
        close: 2510,
        volume: 50000
      };

      return res.json({
        success: true,
        latest: mockCandle,
        marketOpen,
        exchange,
        symbol,
        timestamp: Date.now(),
        source: 'mock'
      });
    }

    // Get the latest candle
    const latestCandle = formattedData[formattedData.length - 1];

    res.json({
      success: true,
      latest: latestCandle,
      marketOpen,
      exchange,
      symbol,
      timestamp: Date.now(),
      source: FMP_API_KEYS.length > 0 ? 'api' : 'mock'
    });

  } catch (error) {
    console.error(`❌ Error fetching latest candle for ${req.params.symbol}:`, error.message);

    // Return mock data even on error
    const now = Math.floor(Date.now() / 1000);
    const mockCandle = {
      time: now,
      open: 2500,
      high: 2520,
      low: 2480,
      close: 2510,
      volume: 50000
    };

    res.json({
      success: true,
      latest: mockCandle,
      marketOpen: false,
      exchange: 'NSE',
      symbol: req.params.symbol,
      timestamp: Date.now(),
      source: 'mock',
      error: error.message
    });
  }
});

// Route: Check market status
router.get('/market-status/:exchange?', (req, res) => {
  const { exchange = 'NSE' } = req.params;
  const marketOpen = isMarketOpen(exchange);

  res.json({
    success: true,
    marketOpen,
    exchange: exchange.toUpperCase(),
    timestamp: Date.now(),
    localTime: new Date().toLocaleString("en-US", {
      timeZone: exchange.toUpperCase() === 'NSE' || exchange.toUpperCase() === 'BSE'
        ? "Asia/Kolkata"
        : "America/New_York"
    })
  });
});

// Route: Batch fetch latest candles for multiple symbols
router.post('/batch', async (req, res) => {
  try {
    const { symbols } = req.body;

    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing symbols array'
      });
    }

    console.log(`📊 Batch request for ${symbols.length} symbols`);

    // Limit to max 10 symbols per request
    const limitedSymbols = symbols.slice(0, 10);

    // Process all symbols in parallel
    const results = await Promise.all(
      limitedSymbols.map(async (symbol) => {
        try {
          // Determine exchange
          let exchange = 'NASDAQ';
          if (symbol.endsWith('.NS')) exchange = 'NSE';
          if (symbol.endsWith('.BO')) exchange = 'BSE';

          const marketOpen = isMarketOpen(exchange);

          // Fetch data - this will use cache/throttling
          const rawData = await fetchIntradayData(symbol);
          const formattedData = formatDataForLightweightCharts(rawData);

          if (formattedData.length === 0) {
            return {
              symbol,
              success: false,
              message: 'No data available',
              marketOpen,
              exchange
            };
          }

          // Get latest candle only
          const latestCandle = formattedData[formattedData.length - 1];

          return {
            symbol,
            success: true,
            latest: latestCandle,
            marketOpen,
            exchange,
            timestamp: Date.now(),
            source: cache.get(`intraday_${symbol}`)?.isMock ? 'mock' : 'api'
          };
        } catch (error) {
          console.error(`❌ Error in batch processing for ${symbol}:`, error.message);
          return {
            symbol,
            success: false,
            error: error.message,
            marketOpen: false
          };
        }
      })
    );

    res.json({
      success: true,
      results,
      timestamp: Date.now(),
      count: results.length
    });

  } catch (error) {
    console.error('❌ Error processing batch request:', error.message);

    res.status(500).json({
      success: false,
      message: 'Failed to process batch request',
      error: error.message
    });
  }
});

module.exports = router;
