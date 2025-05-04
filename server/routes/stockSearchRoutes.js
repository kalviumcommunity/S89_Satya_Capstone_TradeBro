const express = require('express');
const axios = require('axios');
const router = express.Router();
require('dotenv').config();

// Get API keys from environment variables
const FMP_API_KEY = process.env.FMP_API_KEY;
const TWELVE_DATA_API_KEY = process.env.TWELVE_DATA_API_KEY;

/**
 * @route   GET /api/stock-search
 * @desc    Search for stocks using Twelve Data API
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.length < 1) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    try {
      // Search for stocks using Twelve Data API
      const response = await axios.get(
        `https://api.twelvedata.com/symbol_search?symbol=${query}&outputsize=20&apikey=${TWELVE_DATA_API_KEY}`
      );

      if (response.data && response.data.data) {
        // Map the response to a consistent format
        let searchResults = response.data.data
          .filter(item => item.instrument_type === 'Common Stock' ||
                          item.instrument_type === 'ETF' ||
                          item.instrument_type === 'Index')
          .map(stock => ({
            symbol: stock.symbol,
            name: stock.instrument_name || stock.symbol,
            exchange: stock.exchange || 'Unknown',
            type: stock.instrument_type === 'Common Stock' ? 'stock' :
                  stock.instrument_type === 'ETF' ? 'etf' : 'index',
            country: stock.country || 'Unknown',
            currency: stock.currency || 'Unknown'
          }));

        // Sort results: exact symbol matches first, then by symbol length (shorter first)
        searchResults.sort((a, b) => {
          // Exact symbol match gets highest priority
          if (a.symbol.toLowerCase() === query.toLowerCase()) return -1;
          if (b.symbol.toLowerCase() === query.toLowerCase()) return 1;

          // Starts with the query gets second priority
          const aStartsWith = a.symbol.toLowerCase().startsWith(query.toLowerCase());
          const bStartsWith = b.symbol.toLowerCase().startsWith(query.toLowerCase());
          if (aStartsWith && !bStartsWith) return -1;
          if (!aStartsWith && bStartsWith) return 1;

          // Prioritize Indian stocks (BSE/NSE) if available
          const aIsIndian = a.exchange.includes('BSE') || a.exchange.includes('NSE');
          const bIsIndian = b.exchange.includes('BSE') || b.exchange.includes('NSE');
          if (aIsIndian && !bIsIndian) return -1;
          if (!aIsIndian && bIsIndian) return 1;

          // Shorter symbols get fourth priority
          return a.symbol.length - b.symbol.length;
        });

        res.status(200).json({
          success: true,
          data: searchResults,
          query
        });
      } else {
        throw new Error('Invalid response format from Twelve Data API');
      }
    } catch (apiError) {
      console.error('Error searching for stocks:', apiError);

      // Fallback to a basic search if API fails
      // Create mock results based on the query
      const mockResults = [
        {
          symbol: `${query.toUpperCase()}.BSE`,
          name: `${query.toUpperCase()} BSE`,
          exchange: 'BSE',
          type: 'stock',
          country: 'India',
          currency: 'INR'
        },
        {
          symbol: `${query.toUpperCase()}.NSE`,
          name: `${query.toUpperCase()} NSE`,
          exchange: 'NSE',
          type: 'stock',
          country: 'India',
          currency: 'INR'
        },
        {
          symbol: query.toUpperCase(),
          name: `${query.toUpperCase()} Corporation`,
          exchange: 'NASDAQ',
          type: 'stock',
          country: 'United States',
          currency: 'USD'
        }
      ];

      res.status(200).json({
        success: true,
        data: mockResults,
        query,
        note: 'Using fallback data due to API limitations'
      });
    }
  } catch (error) {
    console.error('Error in stock search:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/stock-search/list
 * @desc    Get a list of popular stocks using Twelve Data API
 * @access  Public
 */
router.get('/list', async (req, res) => {
  try {
    // Since Twelve Data doesn't have a direct endpoint for listing all stocks,
    // we'll use a predefined list of popular Indian and US stocks

    // First try to get some Indian stocks from BSE
    try {
      const bseResponse = await axios.get(
        `https://api.twelvedata.com/stocks?exchange=BSE&source=docs&apikey=${TWELVE_DATA_API_KEY}`
      );

      if (bseResponse.data && bseResponse.data.data && bseResponse.data.data.length > 0) {
        // Map the response to a consistent format
        const stockList = bseResponse.data.data
          .slice(0, 50) // Limit to 50 stocks
          .map(stock => ({
            symbol: stock.symbol,
            name: stock.name || stock.symbol,
            exchange: stock.exchange || 'BSE',
            type: 'stock',
            country: 'India',
            currency: 'INR'
          }));

        // Add some popular US stocks
        const popularUSStocks = [
          { symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ", type: "stock", country: "United States", currency: "USD" },
          { symbol: "MSFT", name: "Microsoft Corporation", exchange: "NASDAQ", type: "stock", country: "United States", currency: "USD" },
          { symbol: "GOOGL", name: "Alphabet Inc.", exchange: "NASDAQ", type: "stock", country: "United States", currency: "USD" },
          { symbol: "AMZN", name: "Amazon.com Inc.", exchange: "NASDAQ", type: "stock", country: "United States", currency: "USD" },
          { symbol: "META", name: "Meta Platforms Inc.", exchange: "NASDAQ", type: "stock", country: "United States", currency: "USD" },
          { symbol: "TSLA", name: "Tesla Inc.", exchange: "NASDAQ", type: "stock", country: "United States", currency: "USD" },
          { symbol: "NVDA", name: "NVIDIA Corporation", exchange: "NASDAQ", type: "stock", country: "United States", currency: "USD" }
        ];

        // Add some popular Indian stocks (in case they weren't in the BSE response)
        const popularIndianStocks = [
          { symbol: "RELIANCE.BSE", name: "Reliance Industries", exchange: "BSE", type: "stock", country: "India", currency: "INR" },
          { symbol: "TCS.BSE", name: "Tata Consultancy Services", exchange: "BSE", type: "stock", country: "India", currency: "INR" },
          { symbol: "HDFCBANK.BSE", name: "HDFC Bank", exchange: "BSE", type: "stock", country: "India", currency: "INR" },
          { symbol: "INFY.BSE", name: "Infosys", exchange: "BSE", type: "stock", country: "India", currency: "INR" },
          { symbol: "ICICIBANK.BSE", name: "ICICI Bank", exchange: "BSE", type: "stock", country: "India", currency: "INR" },
          { symbol: "HINDUNILVR.BSE", name: "Hindustan Unilever", exchange: "BSE", type: "stock", country: "India", currency: "INR" },
          { symbol: "SBIN.BSE", name: "State Bank of India", exchange: "BSE", type: "stock", country: "India", currency: "INR" }
        ];

        // Combine all stocks
        const combinedStocks = [...stockList, ...popularUSStocks, ...popularIndianStocks];

        // Remove duplicates based on symbol
        const uniqueStocks = Array.from(new Map(combinedStocks.map(stock => [stock.symbol, stock])).values());

        res.status(200).json({
          success: true,
          data: uniqueStocks
        });
        return;
      }
    } catch (bseError) {
      console.error('Error fetching BSE stocks:', bseError);
      // Continue to fallback
    }

    // If BSE API call fails, use fallback data
    const fallbackStocks = [
      // Popular Indian stocks
      { symbol: "RELIANCE.BSE", name: "Reliance Industries", exchange: "BSE", type: "stock", country: "India", currency: "INR" },
      { symbol: "TCS.BSE", name: "Tata Consultancy Services", exchange: "BSE", type: "stock", country: "India", currency: "INR" },
      { symbol: "HDFCBANK.BSE", name: "HDFC Bank", exchange: "BSE", type: "stock", country: "India", currency: "INR" },
      { symbol: "INFY.BSE", name: "Infosys", exchange: "BSE", type: "stock", country: "India", currency: "INR" },
      { symbol: "ICICIBANK.BSE", name: "ICICI Bank", exchange: "BSE", type: "stock", country: "India", currency: "INR" },
      { symbol: "HINDUNILVR.BSE", name: "Hindustan Unilever", exchange: "BSE", type: "stock", country: "India", currency: "INR" },
      { symbol: "SBIN.BSE", name: "State Bank of India", exchange: "BSE", type: "stock", country: "India", currency: "INR" },
      { symbol: "BHARTIARTL.BSE", name: "Bharti Airtel", exchange: "BSE", type: "stock", country: "India", currency: "INR" },
      { symbol: "KOTAKBANK.BSE", name: "Kotak Mahindra Bank", exchange: "BSE", type: "stock", country: "India", currency: "INR" },
      { symbol: "ITC.BSE", name: "ITC Limited", exchange: "BSE", type: "stock", country: "India", currency: "INR" },
      { symbol: "TATAMOTORS.BSE", name: "Tata Motors", exchange: "BSE", type: "stock", country: "India", currency: "INR" },
      { symbol: "MARUTI.BSE", name: "Maruti Suzuki", exchange: "BSE", type: "stock", country: "India", currency: "INR" },
      { symbol: "AXISBANK.BSE", name: "Axis Bank", exchange: "BSE", type: "stock", country: "India", currency: "INR" },
      { symbol: "SUNPHARMA.BSE", name: "Sun Pharmaceutical", exchange: "BSE", type: "stock", country: "India", currency: "INR" },
      { symbol: "BAJFINANCE.BSE", name: "Bajaj Finance", exchange: "BSE", type: "stock", country: "India", currency: "INR" },
      { symbol: "WIPRO.BSE", name: "Wipro", exchange: "BSE", type: "stock", country: "India", currency: "INR" },

      // Popular US stocks
      { symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ", type: "stock", country: "United States", currency: "USD" },
      { symbol: "MSFT", name: "Microsoft Corporation", exchange: "NASDAQ", type: "stock", country: "United States", currency: "USD" },
      { symbol: "GOOGL", name: "Alphabet Inc.", exchange: "NASDAQ", type: "stock", country: "United States", currency: "USD" },
      { symbol: "AMZN", name: "Amazon.com Inc.", exchange: "NASDAQ", type: "stock", country: "United States", currency: "USD" },
      { symbol: "META", name: "Meta Platforms Inc.", exchange: "NASDAQ", type: "stock", country: "United States", currency: "USD" },
      { symbol: "TSLA", name: "Tesla Inc.", exchange: "NASDAQ", type: "stock", country: "United States", currency: "USD" },
      { symbol: "NVDA", name: "NVIDIA Corporation", exchange: "NASDAQ", type: "stock", country: "United States", currency: "USD" },
      { symbol: "JPM", name: "JPMorgan Chase & Co.", exchange: "NYSE", type: "stock", country: "United States", currency: "USD" },
      { symbol: "V", name: "Visa Inc.", exchange: "NYSE", type: "stock", country: "United States", currency: "USD" },
      { symbol: "JNJ", name: "Johnson & Johnson", exchange: "NYSE", type: "stock", country: "United States", currency: "USD" }
    ];

    res.status(200).json({
      success: true,
      data: fallbackStocks,
      note: 'Using fallback data due to API limitations'
    });
  } catch (error) {
    console.error('Error fetching stock list:', error);

    // Return a small set of popular stocks as fallback
    const fallbackStocks = [
      { symbol: "RELIANCE.BSE", name: "Reliance Industries", exchange: "BSE", type: "stock", country: "India", currency: "INR" },
      { symbol: "TCS.BSE", name: "Tata Consultancy Services", exchange: "BSE", type: "stock", country: "India", currency: "INR" },
      { symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ", type: "stock", country: "United States", currency: "USD" },
      { symbol: "MSFT", name: "Microsoft Corporation", exchange: "NASDAQ", type: "stock", country: "United States", currency: "USD" },
      { symbol: "GOOGL", name: "Alphabet Inc.", exchange: "NASDAQ", type: "stock", country: "United States", currency: "USD" }
    ];

    res.status(200).json({
      success: true,
      data: fallbackStocks,
      note: 'Using emergency fallback data due to API limitations'
    });
  }
});

module.exports = router;
