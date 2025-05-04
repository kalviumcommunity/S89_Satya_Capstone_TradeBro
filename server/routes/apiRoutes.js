const express = require("express");
const axios = require("axios");
require("dotenv").config();

const router = express.Router();
const FMP_API = process.env.FMP_API_KEY;
const TWELVE_DATA_API_KEY = process.env.TWELVE_DATA_API_KEY || "7ac5c1c1a2d247e797d2f8af686efcd1";

// 1. Get stock price and volume
router.get("/stocks/price/:symbol", async (req, res) => {
  const { symbol } = req.params;
  try {
    const response = await axios.get(
      `https://financialmodelingprep.com/stable/historical-price-eod/full?symbol=${symbol}&apikey=${FMP_API}`
    );
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stock price",err });
  }
});

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

// 3. Company name search
router.get("/search/name/:query", async (req, res) => {
  const { query } = req.params;
  try {
    const response = await axios.get(
      `https://financialmodelingprep.com/stable/search-name?query=${query}&apikey=${FMP_API}`
    );
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "Failed to search by name", err });
  }
});

// 4. Symbol search
router.get("/search/symbol/:query", async (req, res) => {
  const { query } = req.params;
  try {
    const response = await axios.get(
      `https://financialmodelingprep.com/stable/search-symbol?query=${query}&apikey=${FMP_API}`
    );
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "Failed to search by symbol",err });
  }
});

// 5. Screener API
router.get("/screener", async (req, res) => {
  try {
    const response = await axios.get(
      `https://financialmodelingprep.com/stable/company-screener?apikey=${FMP_API}`
    );
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch screener data",err });
  }
});

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

// 8. News API
router.get("/news", async (req, res) => {
  try {
    const response = await axios.get(
      `https://financialmodelingprep.com/stable/grades-latest-news?apikey=${FMP_API}`
    );
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch news",err });
  }
});

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

// 11. 5-minute chart data
router.get("/chart/5min/:symbol", async (req, res) => {
  const { symbol } = req.params;

  try {
    // Try FMP API first
    try {
      console.log(`Fetching 5-minute chart data for ${symbol} from FMP API`);
      const response = await axios.get(
        `https://financialmodelingprep.com/api/v3/historical-chart/5min/${symbol}?apikey=${FMP_API}`,
        { timeout: 5000 } // 5 second timeout
      );

      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        // Format the data for chart library
        const formattedData = response.data.map(candle => ({
          time: new Date(candle.date).getTime(),
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume
        }));

        return res.json({
          success: true,
          source: 'fmp',
          data: formattedData
        });
      } else {
        throw new Error('Empty or invalid response from FMP API');
      }
    } catch (fmpError) {
      console.error(`FMP API error for ${symbol}:`, fmpError.message);

      // Fallback to Twelve Data API
      console.log(`Falling back to Twelve Data API for ${symbol}`);
      const twelveDataResponse = await axios.get(
        `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=5min&outputsize=100&apikey=${TWELVE_DATA_API_KEY}`,
        { timeout: 5000 } // 5 second timeout
      );

      if (twelveDataResponse.data && twelveDataResponse.data.values && Array.isArray(twelveDataResponse.data.values)) {
        // Format the data for chart library
        const formattedData = twelveDataResponse.data.values.map(candle => ({
          time: new Date(candle.datetime).getTime(),
          open: parseFloat(candle.open),
          high: parseFloat(candle.high),
          low: parseFloat(candle.low),
          close: parseFloat(candle.close),
          volume: parseFloat(candle.volume || 0)
        }));

        return res.json({
          success: true,
          source: 'twelvedata',
          data: formattedData
        });
      } else {
        throw new Error('Empty or invalid response from Twelve Data API');
      }
    }
  } catch (err) {
    console.error(`Failed to fetch 5-minute chart data for ${symbol}:`, err.message);

    // Generate mock data as a last resort
    const mockData = generateMockChartData(symbol);

    res.json({
      success: true,
      source: 'mock',
      data: mockData,
      message: 'Using mock data due to API errors'
    });
  }
});

// Helper function to generate mock 5-minute chart data
function generateMockChartData(symbol) {
  const data = [];
  const now = new Date();
  now.setHours(16, 0, 0, 0); // Set to 4 PM (market close)

  // Generate a random starting price between 100 and 1000
  const basePrice = Math.floor(Math.random() * 900) + 100;

  // Generate 100 candles (approximately one trading day of 5-minute candles)
  for (let i = 0; i < 100; i++) {
    const time = new Date(now.getTime() - (i * 5 * 60 * 1000)); // 5 minutes per candle, going backward

    // Generate random price movements
    const volatility = basePrice * 0.002; // 0.2% volatility per candle
    const change = (Math.random() - 0.5) * volatility * 2;

    const open = basePrice + (Math.random() - 0.5) * volatility * 10;
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * volatility;
    const low = Math.min(open, close) - Math.random() * volatility;
    const volume = Math.floor(Math.random() * 10000) + 1000;

    data.push({
      time: time.getTime(),
      open,
      high,
      low,
      close,
      volume
    });
  }

  // Sort by time ascending
  return data.sort((a, b) => a.time - b.time);
}

module.exports = router;
