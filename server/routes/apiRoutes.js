const express = require("express");
const axios = require("axios");
require("dotenv").config();

const router = express.Router();
const FMP_API = process.env.FMP_API_KEY;

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





module.exports = router;
