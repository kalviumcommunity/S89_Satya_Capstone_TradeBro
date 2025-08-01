const express = require('express');
const axios = require('axios');
const router = express.Router();

// Environment variables
const FMP_API_KEY = process.env.FMP_API_KEY;
const TWELVE_DATA_API_KEY = process.env.TWELVE_DATA_API_KEY;

/**
 * Enhanced stock search endpoint with multiple API fallbacks
 * Supports both symbol and company name searches
 */
router.get('/stocks', async (req, res) => {
  try {
    const { q: query, limit = 10 } = req.query;

    if (!query || query.trim().length < 2) {
      return res.json({
        success: true,
        results: [],
        message: 'Query too short'
      });
    }

    console.log(`🔍 Searching for stocks: "${query}"`);

    // Try multiple search strategies
    const searchResults = await performMultiSourceSearch(query, limit);

    res.json({
      success: true,
      results: searchResults,
      total: searchResults.length,
      query: query.trim()
    });

  } catch (error) {
    console.error('Stock search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search stocks',
      message: error.message
    });
  }
});

/**
 * Get trending/popular stocks
 */
router.get('/trending', async (req, res) => {
  try {
    const trendingStocks = [
      { symbol: 'RELIANCE.NS', name: 'Reliance Industries Ltd', sector: 'Energy', exchange: 'NSE' },
      { symbol: 'TCS.NS', name: 'Tata Consultancy Services', sector: 'IT', exchange: 'NSE' },
      { symbol: 'HDFCBANK.NS', name: 'HDFC Bank Ltd', sector: 'Banking', exchange: 'NSE' },
      { symbol: 'INFY.NS', name: 'Infosys Ltd', sector: 'IT', exchange: 'NSE' },
      { symbol: 'ICICIBANK.NS', name: 'ICICI Bank Ltd', sector: 'Banking', exchange: 'NSE' },
      { symbol: 'SBIN.NS', name: 'State Bank of India', sector: 'Banking', exchange: 'NSE' },
      { symbol: 'ITC.NS', name: 'ITC Ltd', sector: 'FMCG', exchange: 'NSE' },
      { symbol: 'LT.NS', name: 'Larsen & Toubro Ltd', sector: 'Infrastructure', exchange: 'NSE' },
      { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel Ltd', sector: 'Telecom', exchange: 'NSE' },
      { symbol: 'ASIANPAINT.NS', name: 'Asian Paints Ltd', sector: 'Paints', exchange: 'NSE' }
    ];

    res.json({
      success: true,
      results: trendingStocks
    });

  } catch (error) {
    console.error('Trending stocks error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get trending stocks'
    });
  }
});

/**
 * Get stock suggestions for autocomplete
 */
router.get('/suggestions', async (req, res) => {
  try {
    const { q: query } = req.query;

    if (!query || query.trim().length < 1) {
      return res.json({
        success: true,
        suggestions: []
      });
    }

    const suggestions = getStockSuggestions(query);

    res.json({
      success: true,
      suggestions
    });

  } catch (error) {
    console.error('Stock suggestions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get suggestions'
    });
  }
});

/**
 * Perform multi-source stock search
 */
async function performMultiSourceSearch(query, limit) {
  const results = [];
  const seenSymbols = new Set();

  try {
    // 1. Try FMP API search
    console.log('🔄 Trying FMP API search...');
    const fmpResults = await searchWithFMP(query);
    
    for (const stock of fmpResults) {
      if (!seenSymbols.has(stock.symbol) && results.length < limit) {
        results.push(stock);
        seenSymbols.add(stock.symbol);
      }
    }

    // 2. Try Twelve Data API if we need more results
    if (results.length < limit) {
      console.log('🔄 Trying Twelve Data API search...');
      const twelveDataResults = await searchWithTwelveData(query);
      
      for (const stock of twelveDataResults) {
        if (!seenSymbols.has(stock.symbol) && results.length < limit) {
          results.push(stock);
          seenSymbols.add(stock.symbol);
        }
      }
    }

    // 3. Add local suggestions if still need more results
    if (results.length < limit) {
      console.log('🔄 Adding local suggestions...');
      const localSuggestions = getStockSuggestions(query);
      
      for (const stock of localSuggestions) {
        if (!seenSymbols.has(stock.symbol) && results.length < limit) {
          results.push(stock);
          seenSymbols.add(stock.symbol);
        }
      }
    }

    console.log(`✅ Found ${results.length} search results`);
    return results;

  } catch (error) {
    console.error('Multi-source search error:', error);
    return results; // Return whatever we found
  }
}

/**
 * Search using FMP API
 */
async function searchWithFMP(query) {
  try {
    const searchUrl = `https://financialmodelingprep.com/api/v3/search?query=${encodeURIComponent(query)}&limit=10&apikey=${FMP_API_KEY}`;
    const response = await axios.get(searchUrl, { timeout: 5000 });
    
    if (response.data && Array.isArray(response.data)) {
      return response.data.map(stock => ({
        symbol: stock.symbol,
        name: stock.name,
        exchange: stock.exchangeShortName || 'Unknown',
        currency: stock.currency || 'USD',
        source: 'FMP'
      }));
    }

    return [];
  } catch (error) {
    console.warn('FMP search failed:', error.message);
    return [];
  }
}

/**
 * Search using Twelve Data API
 */
async function searchWithTwelveData(query) {
  try {
    const searchUrl = `https://api.twelvedata.com/symbol_search?symbol=${encodeURIComponent(query)}&apikey=${TWELVE_DATA_API_KEY}`;
    const response = await axios.get(searchUrl, { timeout: 5000 });
    
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      return response.data.data.map(stock => ({
        symbol: stock.symbol,
        name: stock.instrument_name,
        exchange: stock.exchange,
        currency: stock.currency || 'USD',
        country: stock.country,
        source: 'TwelveData'
      }));
    }

    return [];
  } catch (error) {
    console.warn('Twelve Data search failed:', error.message);
    return [];
  }
}

/**
 * Get local stock suggestions
 */
function getStockSuggestions(query) {
  const indianStocks = [
    { symbol: 'RELIANCE.NS', name: 'Reliance Industries Ltd', sector: 'Energy', exchange: 'NSE' },
    { symbol: 'TCS.NS', name: 'Tata Consultancy Services', sector: 'IT', exchange: 'NSE' },
    { symbol: 'HDFCBANK.NS', name: 'HDFC Bank Ltd', sector: 'Banking', exchange: 'NSE' },
    { symbol: 'INFY.NS', name: 'Infosys Ltd', sector: 'IT', exchange: 'NSE' },
    { symbol: 'ICICIBANK.NS', name: 'ICICI Bank Ltd', sector: 'Banking', exchange: 'NSE' },
    { symbol: 'SBIN.NS', name: 'State Bank of India', sector: 'Banking', exchange: 'NSE' },
    { symbol: 'ITC.NS', name: 'ITC Ltd', sector: 'FMCG', exchange: 'NSE' },
    { symbol: 'LT.NS', name: 'Larsen & Toubro Ltd', sector: 'Infrastructure', exchange: 'NSE' },
    { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel Ltd', sector: 'Telecom', exchange: 'NSE' },
    { symbol: 'ASIANPAINT.NS', name: 'Asian Paints Ltd', sector: 'Paints', exchange: 'NSE' },
    { symbol: 'WIPRO.NS', name: 'Wipro Ltd', sector: 'IT', exchange: 'NSE' },
    { symbol: 'MARUTI.NS', name: 'Maruti Suzuki India Ltd', sector: 'Auto', exchange: 'NSE' },
    { symbol: 'BAJFINANCE.NS', name: 'Bajaj Finance Ltd', sector: 'NBFC', exchange: 'NSE' },
    { symbol: 'KOTAKBANK.NS', name: 'Kotak Mahindra Bank Ltd', sector: 'Banking', exchange: 'NSE' },
    { symbol: 'HINDUNILVR.NS', name: 'Hindustan Unilever Ltd', sector: 'FMCG', exchange: 'NSE' },
    { symbol: 'AXISBANK.NS', name: 'Axis Bank Ltd', sector: 'Banking', exchange: 'NSE' },
    { symbol: 'ULTRACEMCO.NS', name: 'UltraTech Cement Ltd', sector: 'Cement', exchange: 'NSE' },
    { symbol: 'NESTLEIND.NS', name: 'Nestle India Ltd', sector: 'FMCG', exchange: 'NSE' },
    { symbol: 'POWERGRID.NS', name: 'Power Grid Corporation', sector: 'Power', exchange: 'NSE' },
    { symbol: 'NTPC.NS', name: 'NTPC Ltd', sector: 'Power', exchange: 'NSE' },
    { symbol: 'TECHM.NS', name: 'Tech Mahindra Ltd', sector: 'IT', exchange: 'NSE' },
    { symbol: 'SUNPHARMA.NS', name: 'Sun Pharmaceutical Industries', sector: 'Pharma', exchange: 'NSE' },
    { symbol: 'TITAN.NS', name: 'Titan Company Ltd', sector: 'Jewellery', exchange: 'NSE' },
    { symbol: 'DRREDDY.NS', name: 'Dr. Reddys Laboratories', sector: 'Pharma', exchange: 'NSE' }
  ];

  const lowerQuery = query.toLowerCase();
  
  return indianStocks.filter(stock => 
    stock.symbol.toLowerCase().includes(lowerQuery) ||
    stock.name.toLowerCase().includes(lowerQuery) ||
    stock.sector.toLowerCase().includes(lowerQuery)
  ).slice(0, 10);
}

module.exports = router;
