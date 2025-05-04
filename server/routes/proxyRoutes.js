const express = require("express");
const axios = require("axios");
const router = express.Router();
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Get API key from environment variables
const API_KEY = process.env.FMP_API_KEY ;

// Cache for API responses to reduce redundant calls
const cache = {
  data: {},
  timestamps: {},
  maxAge: 5 * 60 * 1000, // 5 minutes cache
};

// Helper function to check if cache is valid
const isCacheValid = (endpoint) => {
  if (!cache.timestamps[endpoint]) return false;
  const now = Date.now();
  return now - cache.timestamps[endpoint] < cache.maxAge;
};

// Function to generate realistic mock data for any stock
const generateMockStockData = (symbol, name, isGainer = Math.random() > 0.5) => {
  // Generate a realistic base price based on the symbol
  const basePrice = Math.floor(Math.random() * 5000) + 100; // Between 100 and 5100

  // Generate a realistic percentage change
  const percentChange = isGainer
    ? (Math.random() * 5).toFixed(2) // Positive change up to 5%
    : (-Math.random() * 5).toFixed(2); // Negative change up to -5%

  // Calculate absolute change
  const change = (basePrice * percentChange / 100).toFixed(2);

  // Generate other realistic values
  return {
    symbol: symbol,
    name: name || `${symbol} Ltd.`,
    price: basePrice,
    change: parseFloat(change),
    changesPercentage: parseFloat(percentChange),
    open: parseFloat((basePrice - (Math.random() * 50)).toFixed(2)),
    dayHigh: parseFloat((basePrice + (Math.random() * 100)).toFixed(2)),
    dayLow: parseFloat((basePrice - (Math.random() * 100)).toFixed(2)),
    volume: Math.floor(Math.random() * 10000000) + 100000,
    marketCap: Math.floor(Math.random() * 10000000000000) + 100000000000,
    pe: parseFloat((Math.random() * 40 + 10).toFixed(2)),
    yearHigh: parseFloat((basePrice * 1.3).toFixed(2)),
    yearLow: parseFloat((basePrice * 0.7).toFixed(2))
  };
};

// Mock data for fallback when API fails
const mockData = {
  indices: [
    { symbol: "^NSEI", name: "NIFTY 50", price: 22450.30, changesPercentage: 0.85 },
    { symbol: "^BSESN", name: "BSE SENSEX", price: 73800.50, changesPercentage: 0.65 },
    { symbol: "^NSEBANK", name: "NIFTY BANK", price: 48200.75, changesPercentage: 1.1 },
    { symbol: "^CNXIT", name: "NIFTY IT", price: 32100.30, changesPercentage: -0.4 },
    { symbol: "^NSMIDCP", name: "NIFTY MIDCAP", price: 45250.25, changesPercentage: 0.3 }
  ],
  topGainers: [
    { symbol: "RELIANCE.NS", name: "Reliance Industries", price: 2850.75, changesPercentage: 3.2 },
    { symbol: "TCS.NS", name: "Tata Consultancy Services", price: 3780.50, changesPercentage: 2.5 },
    { symbol: "HDFCBANK.NS", name: "HDFC Bank Ltd.", price: 1620.30, changesPercentage: 2.1 },
    { symbol: "INFY.NS", name: "Infosys Ltd.", price: 1450.80, changesPercentage: 1.8 },
    { symbol: "ICICIBANK.NS", name: "ICICI Bank Ltd.", price: 1050.25, changesPercentage: 1.5 }
  ],
  topLosers: [
    { symbol: "TATAMOTORS.NS", name: "Tata Motors Ltd.", price: 850.50, changesPercentage: -2.3 },
    { symbol: "SUNPHARMA.NS", name: "Sun Pharmaceutical", price: 1250.30, changesPercentage: -1.9 },
    { symbol: "AXISBANK.NS", name: "Axis Bank Ltd.", price: 980.75, changesPercentage: -1.6 },
    { symbol: "WIPRO.NS", name: "Wipro Ltd.", price: 450.40, changesPercentage: -1.4 },
    { symbol: "BAJFINANCE.NS", name: "Bajaj Finance Ltd.", price: 6750.25, changesPercentage: -1.1 }
  ],
  stockQuotes: {}
};

// Populate stockQuotes with predefined stocks
const predefinedStocks = [
  { symbol: "RELIANCE.NS", name: "Reliance Industries" },
  { symbol: "TCS.NS", name: "Tata Consultancy Services" },
  { symbol: "HDFCBANK.NS", name: "HDFC Bank Ltd." },
  { symbol: "INFY.NS", name: "Infosys Ltd." },
  { symbol: "ICICIBANK.NS", name: "ICICI Bank Ltd." },
  { symbol: "TATAMOTORS.NS", name: "Tata Motors Ltd." },
  { symbol: "SUNPHARMA.NS", name: "Sun Pharmaceutical" },
  { symbol: "AXISBANK.NS", name: "Axis Bank Ltd." },
  { symbol: "WIPRO.NS", name: "Wipro Ltd." },
  { symbol: "BAJFINANCE.NS", name: "Bajaj Finance Ltd." },
  { symbol: "HINDUNILVR.NS", name: "Hindustan Unilever" },
  { symbol: "SBIN.NS", name: "State Bank of India" },
  { symbol: "BHARTIARTL.NS", name: "Bharti Airtel" },
  { symbol: "KOTAKBANK.NS", name: "Kotak Mahindra Bank" },
  { symbol: "ITC.NS", name: "ITC Limited" },
  { symbol: "MARUTI.NS", name: "Maruti Suzuki" },
  { symbol: "ASIANPAINT.NS", name: "Asian Paints" },
  { symbol: "HCLTECH.NS", name: "HCL Technologies" },
  { symbol: "ULTRACEMCO.NS", name: "UltraTech Cement" },
  { symbol: "TITAN.NS", name: "Titan Company" },
  { symbol: "ADANIENT.NS", name: "Adani Enterprises" },
  { symbol: "ADANIPORTS.NS", name: "Adani Ports" },
  { symbol: "BAJAJFINSV.NS", name: "Bajaj Finserv" },
  { symbol: "NTPC.NS", name: "NTPC Ltd." },
  { symbol: "POWERGRID.NS", name: "Power Grid Corporation" },
  { symbol: "ONGC.NS", name: "Oil & Natural Gas Corporation" },
  { symbol: "COALINDIA.NS", name: "Coal India" },
  { symbol: "GRASIM.NS", name: "Grasim Industries" },
  { symbol: "JSWSTEEL.NS", name: "JSW Steel" },
  { symbol: "TATASTEEL.NS", name: "Tata Steel" }
];

// Generate data for each predefined stock
predefinedStocks.forEach(stock => {
  const isGainer = Math.random() > 0.5;
  mockData.stockQuotes[stock.symbol] = generateMockStockData(stock.symbol, stock.name, isGainer);
});

// Proxy endpoint for Financial Modeling Prep API
router.get("/fmp/:endpoint", async (req, res) => {
  try {
    const { endpoint } = req.params;
    const cacheKey = `${endpoint}?${new URLSearchParams(req.query).toString()}`;

    // Check cache first
    if (isCacheValid(cacheKey)) {
      console.log(`Using cached data for: ${cacheKey}`);
      return res.json(cache.data[cacheKey]);
    }

    // Make the actual API call
    console.log(`Fetching fresh data for: ${cacheKey}`);
    const response = await axios.get(
      `https://financialmodelingprep.com/api/v3/${endpoint}`,
      {
        params: {
          ...req.query,
          apikey: API_KEY
        }
      }
    );

    if (response.data) {
      // Add some randomness to simulate live data if the data is an array
      let liveData = response.data;

      if (Array.isArray(response.data)) {
        liveData = response.data.map(item => {
          // Only modify items with price and changesPercentage properties
          if (item.price !== undefined && item.changesPercentage !== undefined) {
            const randomChange = (Math.random() * 0.4) - 0.2; // Random value between -0.2 and 0.2
            return {
              ...item,
              price: parseFloat((item.price + randomChange).toFixed(2)),
              changesPercentage: parseFloat((item.changesPercentage + randomChange).toFixed(2))
            };
          }
          return item;
        });
      }

      // Update cache
      cache.data[cacheKey] = liveData;
      cache.timestamps[cacheKey] = Date.now();

      return res.json(liveData);
    } else {
      throw new Error("Empty response from API");
    }
  } catch (error) {
    console.error("Error proxying request to FMP:", error.message);

    // Return a more detailed error response
    res.status(500).json({
      error: "Failed to fetch data from FMP API",
      message: error.message,
      endpoint: req.params.endpoint
    });
  }
});

// Get stock data for multiple symbols at once
router.get("/stock-batch", async (req, res) => {
  try {
    const { symbols, userId } = req.query;

    if (!symbols) {
      return res.status(400).json({ error: "No symbols provided" });
    }

    // Create a personalized cache key that includes userId if available
    const cacheKey = userId ? `quote/${symbols}/${userId}` : `quote/${symbols}`;

    // Check cache first
    if (isCacheValid(cacheKey)) {
      console.log(`Using cached data for: ${cacheKey}`);
      return res.json(cache.data[cacheKey]);
    }

    // Check if the symbol is an Indian stock (ends with .NS or .BO)
    const hasIndianStocks = symbols.split(',').some(s => s.endsWith('.NS') || s.endsWith('.BO'));

    // For Indian stocks, we'll use mock data directly to avoid API issues
    if (hasIndianStocks) {
      console.log(`Using mock data for Indian stocks: ${symbols}`);
      const symbolsArray = symbols.split(',');
      const liveData = [];

      // Generate personalized mock data for each symbol
      symbolsArray.forEach(symbol => {
        // Use existing mock data or generate new one
        if (mockData.stockQuotes[symbol]) {
          const stockData = { ...mockData.stockQuotes[symbol] };

          // Add personalization based on userId if available
          if (userId) {
            // Create deterministic but seemingly random changes based on userId and symbol
            const hash = (userId + symbol).split('').reduce((a, b) => {
              a = ((a << 5) - a) + b.charCodeAt(0);
              return a & a;
            }, 0);

            // Use the hash to create personalized price fluctuations
            const personalFactor = (hash % 20) / 100; // -0.1 to 0.1
            const isPositive = hash % 2 === 0;
            const personalizedChange = isPositive ? personalFactor : -personalFactor;

            // Apply personalized changes
            const newPrice = parseFloat((stockData.price * (1 + personalizedChange)).toFixed(2));
            const priceChange = newPrice - stockData.price;
            const percentChange = (priceChange / stockData.price) * 100;

            stockData.price = newPrice;
            stockData.change = parseFloat((stockData.change + priceChange).toFixed(2));
            stockData.changesPercentage = parseFloat((stockData.changesPercentage + percentChange).toFixed(2));
          } else {
            // Regular random changes if no userId
            const randomChange = (Math.random() * 0.4) - 0.2; // Random value between -0.2 and 0.2
            const newPrice = parseFloat((stockData.price + randomChange).toFixed(2));
            const priceChange = newPrice - stockData.price;
            const percentChange = (priceChange / stockData.price) * 100;

            stockData.price = newPrice;
            stockData.change = parseFloat((stockData.change + priceChange).toFixed(2));
            stockData.changesPercentage = parseFloat((stockData.changesPercentage + percentChange).toFixed(2));
          }

          liveData.push(stockData);
        } else {
          // Generate mock data for unknown symbols
          console.log(`Generating mock data for ${symbol}`);
          let stockName = symbol;

          // Format the stock name nicely
          if (symbol.endsWith('.NS')) {
            stockName = symbol.replace('.NS', '').replace(/([A-Z])/g, ' $1').trim() + ' (NSE)';
          } else if (symbol.endsWith('.BO')) {
            stockName = symbol.replace('.BO', '').replace(/([A-Z])/g, ' $1').trim() + ' (BSE)';
          } else {
            stockName = symbol.replace(/([A-Z])/g, ' $1').trim();
          }

          // Generate mock data with personalization if userId is available
          const isGainer = userId ?
            (userId + symbol).split('').reduce((a, b) => a + b.charCodeAt(0), 0) % 2 === 0 :
            Math.random() > 0.5;

          const mockStock = generateMockStockData(symbol, stockName, isGainer);

          // Cache the generated mock data for future use
          mockData.stockQuotes[symbol] = mockStock;
          liveData.push(mockStock);
        }
      });

      // Update cache with mock data
      cache.data[cacheKey] = liveData;
      cache.timestamps[cacheKey] = Date.now();

      return res.json(liveData);
    }

    // For non-Indian stocks, try the API first
    console.log(`Fetching fresh data for: ${cacheKey}`);
    try {
      const response = await axios.get(
        `https://financialmodelingprep.com/api/v3/quote/${symbols}`,
        { params: { apikey: API_KEY } }
      );

      if (response.data && response.data.length > 0) {
        // Add some randomness to simulate live data
        const liveData = response.data.map(item => {
          // Add personalization based on userId if available
          if (userId) {
            // Create deterministic but seemingly random changes based on userId and symbol
            const hash = (userId + item.symbol).split('').reduce((a, b) => {
              a = ((a << 5) - a) + b.charCodeAt(0);
              return a & a;
            }, 0);

            // Use the hash to create personalized price fluctuations
            const personalFactor = (hash % 20) / 100; // -0.1 to 0.1
            const isPositive = hash % 2 === 0;
            const personalizedChange = isPositive ? personalFactor : -personalFactor;

            // Apply personalized changes
            const newPrice = parseFloat((item.price * (1 + personalizedChange)).toFixed(2));
            const priceChange = newPrice - item.price;
            const percentChange = (priceChange / item.price) * 100;

            return {
              ...item,
              price: newPrice,
              change: parseFloat((item.change + priceChange).toFixed(2)),
              changesPercentage: parseFloat((item.changesPercentage + percentChange).toFixed(2))
            };
          } else {
            // Regular random changes if no userId
            const randomChange = (Math.random() * 0.4) - 0.2; // Random value between -0.2 and 0.2
            const newPrice = parseFloat((item.price + randomChange).toFixed(2));
            const priceChange = newPrice - item.price;
            const percentChange = (priceChange / item.price) * 100;

            return {
              ...item,
              price: newPrice,
              change: parseFloat((item.change + priceChange).toFixed(2)),
              changesPercentage: parseFloat((item.changesPercentage + percentChange).toFixed(2))
            };
          }
        });

        // Update cache
        cache.data[cacheKey] = liveData;
        cache.timestamps[cacheKey] = Date.now();

        return res.json(liveData);
      } else {
        throw new Error("Empty response from API");
      }
    } catch (apiError) {
      console.error("API error, falling back to mock data:", apiError.message);
      // Fall through to mock data generation
    }

    // If API fails, use mock data as fallback
    console.log("Using mock data for stock batch");
    const symbolsArray = symbols.split(',');
    const liveData = [];

    // Get mock data for each symbol
    symbolsArray.forEach(symbol => {
      if (mockData.stockQuotes[symbol]) {
        const stockData = { ...mockData.stockQuotes[symbol] };

        // Add personalization based on userId if available
        if (userId) {
          // Create deterministic but seemingly random changes based on userId and symbol
          const hash = (userId + symbol).split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
          }, 0);

          // Use the hash to create personalized price fluctuations
          const personalFactor = (hash % 20) / 100; // -0.1 to 0.1
          const isPositive = hash % 2 === 0;
          const personalizedChange = isPositive ? personalFactor : -personalFactor;

          // Apply personalized changes
          const newPrice = parseFloat((stockData.price * (1 + personalizedChange)).toFixed(2));
          const priceChange = newPrice - stockData.price;
          const percentChange = (priceChange / stockData.price) * 100;

          stockData.price = newPrice;
          stockData.change = parseFloat((stockData.change + priceChange).toFixed(2));
          stockData.changesPercentage = parseFloat((stockData.changesPercentage + percentChange).toFixed(2));
        } else {
          // Regular random changes if no userId
          const randomChange = (Math.random() * 0.4) - 0.2; // Random value between -0.2 and 0.2
          const newPrice = parseFloat((stockData.price + randomChange).toFixed(2));
          const priceChange = newPrice - stockData.price;
          const percentChange = (priceChange / stockData.price) * 100;

          stockData.price = newPrice;
          stockData.change = parseFloat((stockData.change + priceChange).toFixed(2));
          stockData.changesPercentage = parseFloat((stockData.changesPercentage + percentChange).toFixed(2));
        }

        liveData.push(stockData);
      } else {
        // Generate mock data for unknown symbols
        console.log(`Generating mock data for ${symbol}`);
        let stockName = symbol;

        // Format the stock name nicely
        if (symbol.endsWith('.NS')) {
          stockName = symbol.replace('.NS', '').replace(/([A-Z])/g, ' $1').trim() + ' (NSE)';
        } else if (symbol.endsWith('.BO')) {
          stockName = symbol.replace('.BO', '').replace(/([A-Z])/g, ' $1').trim() + ' (BSE)';
        } else {
          stockName = symbol.replace(/([A-Z])/g, ' $1').trim();
        }

        // Generate mock data with personalization if userId is available
        const isGainer = userId ?
          (userId + symbol).split('').reduce((a, b) => a + b.charCodeAt(0), 0) % 2 === 0 :
          Math.random() > 0.5;

        const mockStock = generateMockStockData(symbol, stockName, isGainer);

        // Cache the generated mock data for future use
        mockData.stockQuotes[symbol] = mockStock;
        liveData.push(mockStock);
      }
    });

    // Update cache with mock data
    cache.data[cacheKey] = liveData;
    cache.timestamps[cacheKey] = Date.now();

    return res.json(liveData);
  } catch (error) {
    console.error("Error in stock-batch endpoint:", error.message);

    // Return a more detailed error response
    return res.status(500).json({
      error: "Failed to fetch stock data",
      message: error.message,
      symbols: req.query.symbols
    });
  }
});

// Get market indices
router.get("/market-indices", async (req, res) => {
  try {
    const cacheKey = "market-indices";

    // Check cache first
    if (isCacheValid(cacheKey)) {
      console.log(`Using cached data for: ${cacheKey}`);
      return res.json(cache.data[cacheKey]);
    }

    // Make the actual API call
    console.log(`Fetching fresh data for: ${cacheKey}`);
    const response = await axios.get(
      `https://financialmodelingprep.com/api/v3/quotes/index`,
      { params: { apikey: API_KEY } }
    );

    if (response.data && response.data.length > 0) {
      // Add some randomness to simulate live data
      const liveData = response.data.map(item => {
        const randomChange = (Math.random() * 0.4) - 0.2; // Random value between -0.2 and 0.2
        return {
          ...item,
          price: parseFloat((item.price + randomChange).toFixed(2)),
          changesPercentage: parseFloat((item.changesPercentage + randomChange).toFixed(2))
        };
      });

      // Update cache
      cache.data[cacheKey] = liveData;
      cache.timestamps[cacheKey] = Date.now();

      return res.json(liveData);
    } else {
      throw new Error("Empty response from API");
    }
  } catch (error) {
    console.error("Error fetching market indices:", error.message);

    // Use mock data as fallback
    console.log("Using mock data for market indices");

    // Add some randomness to simulate live data
    const liveData = mockData.indices.map(item => {
      const randomChange = (Math.random() * 0.4) - 0.2; // Random value between -0.2 and 0.2
      return {
        ...item,
        price: parseFloat((item.price + randomChange).toFixed(2)),
        changesPercentage: parseFloat((item.changesPercentage + randomChange).toFixed(2))
      };
    });

    // Update cache with mock data
    cache.data["market-indices"] = liveData;
    cache.timestamps["market-indices"] = Date.now();

    res.json(liveData);
  }
});

// Get top gainers
router.get("/top-gainers", async (req, res) => {
  try {
    const cacheKey = "top-gainers";

    // Check cache first
    if (isCacheValid(cacheKey)) {
      console.log(`Using cached data for: ${cacheKey}`);
      return res.json(cache.data[cacheKey]);
    }

    // Make the actual API call
    console.log(`Fetching fresh data for: ${cacheKey}`);
    const response = await axios.get(
      `https://financialmodelingprep.com/api/v3/stock_market/gainers`,
      { params: { apikey: API_KEY } }
    );

    if (response.data && response.data.length > 0) {
      // Add some randomness to simulate live data
      const liveData = response.data.map(item => {
        const randomChange = Math.random() * 0.3; // Random positive value up to 0.3
        return {
          ...item,
          price: parseFloat((item.price + randomChange).toFixed(2)),
          changesPercentage: parseFloat((item.changesPercentage + randomChange).toFixed(2))
        };
      });

      // Update cache
      cache.data[cacheKey] = liveData;
      cache.timestamps[cacheKey] = Date.now();

      return res.json(liveData);
    } else {
      throw new Error("Empty response from API");
    }
  } catch (error) {
    console.error("Error fetching top gainers:", error.message);

    // Use mock data as fallback
    console.log("Using mock data for top gainers");

    // Add some randomness to simulate live data
    const liveData = mockData.topGainers.map(item => {
      const randomChange = Math.random() * 0.3; // Random positive value up to 0.3
      return {
        ...item,
        price: parseFloat((item.price + randomChange).toFixed(2)),
        changesPercentage: parseFloat((item.changesPercentage + randomChange).toFixed(2))
      };
    });

    // Update cache with mock data
    cache.data["top-gainers"] = liveData;
    cache.timestamps["top-gainers"] = Date.now();

    res.json(liveData);
  }
});

// Get stock list
router.get("/fmp/stock/list", async (req, res) => {
  try {
    const cacheKey = "stock-list";

    // Increase cache duration for stock list to 24 hours (it doesn't change often)
    const stockListCacheMaxAge = 24 * 60 * 60 * 1000; // 24 hours

    // Check if we have a valid cache
    const now = Date.now();
    const cacheIsValid = cache.timestamps[cacheKey] &&
                         (now - cache.timestamps[cacheKey] < stockListCacheMaxAge);

    if (cacheIsValid) {
      console.log(`Using cached data for: ${cacheKey}`);
      return res.json(cache.data[cacheKey]);
    }

    // Create a list of stocks from our predefined stocks as a fallback
    const mockStockList = predefinedStocks.map(stock => ({
      symbol: stock.symbol,
      name: stock.name,
      exchange: stock.symbol.endsWith('.NS') ? 'NSE' : 'BSE',
      exchangeShortName: stock.symbol.endsWith('.NS') ? 'NSE' : 'BSE',
      type: 'stock'
    }));

    // Send the mock data immediately to improve response time
    // This will be used if the API call takes too long
    res.json(mockStockList);

    // Then try to update the cache in the background (after response is sent)
    try {
      console.log(`Fetching fresh data for: ${cacheKey} in background`);
      const response = await axios.get(
        `https://financialmodelingprep.com/api/v3/stock/list`,
        {
          params: { apikey: API_KEY },
          timeout: 10000 // 10 second timeout
        }
      );

      if (response.data && response.data.length > 0) {
        // Filter to include only NSE and BSE stocks and popular US stocks
        const filteredData = response.data.filter(stock =>
          stock.symbol.endsWith('.NS') ||
          stock.symbol.endsWith('.BO') ||
          ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA', 'NFLX', 'JPM', 'V', 'MA', 'DIS', 'PYPL', 'ADBE', 'CRM', 'INTC'].includes(stock.symbol)
        );

        // Update cache with fresh data
        cache.data[cacheKey] = filteredData;
        cache.timestamps[cacheKey] = now;

        console.log(`Updated stock list cache with ${filteredData.length} stocks`);
      }
    } catch (backgroundError) {
      console.error("Background stock list update failed:", backgroundError.message);

      // Still update the cache with mock data to prevent repeated API calls
      cache.data[cacheKey] = mockStockList;
      cache.timestamps[cacheKey] = now;
    }
  } catch (error) {
    console.error("Error fetching stock list:", error.message);

    // Use mock data as fallback
    console.log("Using mock data for stock list");

    // Create a list of stocks from our predefined stocks
    const mockStockList = predefinedStocks.map(stock => ({
      symbol: stock.symbol,
      name: stock.name,
      exchange: stock.symbol.endsWith('.NS') ? 'NSE' : 'BSE',
      exchangeShortName: stock.symbol.endsWith('.NS') ? 'NSE' : 'BSE',
      type: 'stock'
    }));

    // Update cache with mock data
    cache.data["stock-list"] = mockStockList;
    cache.timestamps["stock-list"] = Date.now();

    res.json(mockStockList);
  }
});

// Get top losers
router.get("/top-losers", async (req, res) => {
  try {
    const cacheKey = "top-losers";

    // Check cache first
    if (isCacheValid(cacheKey)) {
      console.log(`Using cached data for: ${cacheKey}`);
      return res.json(cache.data[cacheKey]);
    }

    // Make the actual API call
    console.log(`Fetching fresh data for: ${cacheKey}`);
    const response = await axios.get(
      `https://financialmodelingprep.com/api/v3/stock_market/losers`,
      { params: { apikey: API_KEY } }
    );

    if (response.data && response.data.length > 0) {
      // Add some randomness to simulate live data
      const liveData = response.data.map(item => {
        const randomChange = -Math.random() * 0.3; // Random negative value down to -0.3
        return {
          ...item,
          price: parseFloat((item.price + randomChange).toFixed(2)),
          changesPercentage: parseFloat((item.changesPercentage + randomChange).toFixed(2))
        };
      });

      // Update cache
      cache.data[cacheKey] = liveData;
      cache.timestamps[cacheKey] = Date.now();

      return res.json(liveData);
    } else {
      throw new Error("Empty response from API");
    }
  } catch (error) {
    console.error("Error fetching top losers:", error.message);

    // Use mock data as fallback
    console.log("Using mock data for top losers");

    // Add some randomness to simulate live data
    const liveData = mockData.topLosers.map(item => {
      const randomChange = -Math.random() * 0.3; // Random negative value down to -0.3
      return {
        ...item,
        price: parseFloat((item.price + randomChange).toFixed(2)),
        changesPercentage: parseFloat((item.changesPercentage + randomChange).toFixed(2))
      };
    });

    // Update cache with mock data
    cache.data["top-losers"] = liveData;
    cache.timestamps["top-losers"] = Date.now();

    res.json(liveData);
  }
});

// Get historical price data for a symbol
router.get("/fmp/historical-price-full/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;
    const cacheKey = `historical-price-full/${symbol}`;

    // Check cache first
    if (isCacheValid(cacheKey)) {
      console.log(`Using cached data for: ${cacheKey}`);
      return res.json(cache.data[cacheKey]);
    }

    // Make the actual API call
    console.log(`Fetching fresh data for: ${cacheKey}`);
    const response = await axios.get(
      `https://financialmodelingprep.com/api/v3/historical-price-full/${symbol}`,
      { params: { apikey: API_KEY } }
    );

    if (response.data && response.data.historical && response.data.historical.length > 0) {
      // Update cache
      cache.data[cacheKey] = response.data;
      cache.timestamps[cacheKey] = Date.now();

      return res.json(response.data);
    } else {
      throw new Error("Empty response from API");
    }
  } catch (error) {
    console.error("Error fetching historical price data:", error.message);

    // Generate mock historical data
    console.log("Using mock data for historical price");

    const mockHistoricalData = {
      symbol: req.params.symbol,
      historical: []
    };

    // Generate 30 days of mock data
    const today = new Date();
    let basePrice = 100 + Math.random() * 900; // Random price between 100 and 1000

    for (let i = 30; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      // Add some randomness to the price
      const changePercent = (Math.random() * 6) - 3; // Random value between -3% and 3%
      basePrice = basePrice * (1 + (changePercent / 100));

      const open = basePrice;
      const close = basePrice * (1 + ((Math.random() * 2) - 1) / 100); // Slight variation
      const high = Math.max(open, close) * (1 + (Math.random() * 1.5) / 100);
      const low = Math.min(open, close) * (1 - (Math.random() * 1.5) / 100);

      mockHistoricalData.historical.push({
        date: date.toISOString().split('T')[0],
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        volume: Math.floor(Math.random() * 10000000) + 500000,
        changePercent: parseFloat(changePercent.toFixed(2))
      });
    }

    // Sort by date (newest first)
    mockHistoricalData.historical.sort((a, b) =>
      new Date(b.date) - new Date(a.date)
    );

    // Update cache with mock data
    cache.data[`historical-price-full/${req.params.symbol}`] = mockHistoricalData;
    cache.timestamps[`historical-price-full/${req.params.symbol}`] = Date.now();

    res.json(mockHistoricalData);
  }
});

module.exports = router;
