/**
 * News Routes
 * This file handles all news-related API endpoints
 */

const express = require('express');
const axios = require('axios');
const router = express.Router();
require('dotenv').config();

// Get API key from environment variables
const FMP_API_KEY = process.env.FMP_API_KEY;

// Cache for API responses to reduce redundant calls
const cache = {
  data: {},
  timestamps: {},
  maxAge: 15 * 60 * 1000, // 15 minutes cache
};

// Helper function to check if cache is valid
const isCacheValid = (endpoint) => {
  if (!cache.timestamps[endpoint]) return false;
  const now = Date.now();
  return now - cache.timestamps[endpoint] < cache.maxAge;
};

/**
 * @route   GET /api/news
 * @desc    Get latest financial news
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const cacheKey = 'general-news';
    
    // Check cache first
    if (isCacheValid(cacheKey) && cache.data[cacheKey]) {
      console.log('Returning cached news data');
      return res.json({
        success: true,
        source: 'cache',
        data: cache.data[cacheKey]
      });
    }
    
    // Fetch from FMP API
    console.log('Fetching news from FMP API');
    const response = await axios.get(
      `https://financialmodelingprep.com/api/v3/stock_news?limit=50&apikey=${FMP_API_KEY}`,
      { timeout: 8000 } // 8 second timeout
    );
    
    if (response.data && Array.isArray(response.data)) {
      // Format the news data
      const formattedNews = response.data.map((item, index) => ({
        id: item.id || index,
        title: item.title,
        description: item.text,
        source: item.site,
        url: item.url,
        image: item.image || `https://source.unsplash.com/random/800x600?finance,${index}`,
        publishedAt: item.publishedDate,
        category: item.category || 'general',
        symbol: item.symbol
      }));
      
      // Update cache
      cache.data[cacheKey] = formattedNews;
      cache.timestamps[cacheKey] = Date.now();
      
      return res.json({
        success: true,
        source: 'fmp',
        data: formattedNews
      });
    } else {
      throw new Error('Invalid response format from FMP API');
    }
  } catch (error) {
    console.error('Error fetching news:', error.message);
    
    // Return mock data if API fails
    const mockNews = generateMockNews();
    
    return res.json({
      success: true,
      source: 'mock',
      data: mockNews,
      message: 'Using mock data due to API errors'
    });
  }
});

/**
 * @route   GET /api/news/category/:category
 * @desc    Get news by category
 * @access  Public
 */
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const cacheKey = `news-category-${category}`;
    
    // Check cache first
    if (isCacheValid(cacheKey) && cache.data[cacheKey]) {
      console.log(`Returning cached news data for category: ${category}`);
      return res.json({
        success: true,
        source: 'cache',
        data: cache.data[cacheKey]
      });
    }
    
    // Fetch from FMP API
    console.log(`Fetching news for category: ${category} from FMP API`);
    const response = await axios.get(
      `https://financialmodelingprep.com/api/v3/stock_news?category=${category}&limit=50&apikey=${FMP_API_KEY}`,
      { timeout: 8000 } // 8 second timeout
    );
    
    if (response.data && Array.isArray(response.data)) {
      // Format the news data
      const formattedNews = response.data.map((item, index) => ({
        id: item.id || index,
        title: item.title,
        description: item.text,
        source: item.site,
        url: item.url,
        image: item.image || `https://source.unsplash.com/random/800x600?${category},${index}`,
        publishedAt: item.publishedDate,
        category: item.category || category,
        symbol: item.symbol
      }));
      
      // Update cache
      cache.data[cacheKey] = formattedNews;
      cache.timestamps[cacheKey] = Date.now();
      
      return res.json({
        success: true,
        source: 'fmp',
        data: formattedNews
      });
    } else {
      throw new Error('Invalid response format from FMP API');
    }
  } catch (error) {
    console.error(`Error fetching news for category ${req.params.category}:`, error.message);
    
    // Return mock data if API fails
    const mockNews = generateMockNews(req.params.category);
    
    return res.json({
      success: true,
      source: 'mock',
      data: mockNews,
      message: 'Using mock data due to API errors'
    });
  }
});

/**
 * @route   GET /api/news/search
 * @desc    Search news by query
 * @access  Public
 */
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    const cacheKey = `news-search-${q}`;
    
    // Check cache first
    if (isCacheValid(cacheKey) && cache.data[cacheKey]) {
      console.log(`Returning cached news search results for: ${q}`);
      return res.json({
        success: true,
        source: 'cache',
        data: cache.data[cacheKey]
      });
    }
    
    // Fetch from FMP API
    console.log(`Searching news for: ${q} from FMP API`);
    const response = await axios.get(
      `https://financialmodelingprep.com/api/v3/stock_news?tickers=${q}&limit=50&apikey=${FMP_API_KEY}`,
      { timeout: 8000 } // 8 second timeout
    );
    
    if (response.data && Array.isArray(response.data)) {
      // Format the news data
      const formattedNews = response.data.map((item, index) => ({
        id: item.id || index,
        title: item.title,
        description: item.text,
        source: item.site,
        url: item.url,
        image: item.image || `https://source.unsplash.com/random/800x600?finance,${index}`,
        publishedAt: item.publishedDate,
        category: item.category || 'general',
        symbol: item.symbol
      }));
      
      // Update cache
      cache.data[cacheKey] = formattedNews;
      cache.timestamps[cacheKey] = Date.now();
      
      return res.json({
        success: true,
        source: 'fmp',
        data: formattedNews
      });
    } else {
      throw new Error('Invalid response format from FMP API');
    }
  } catch (error) {
    console.error(`Error searching news for ${req.query.q}:`, error.message);
    
    // Return mock data if API fails
    const mockNews = generateMockNews('general', req.query.q);
    
    return res.json({
      success: true,
      source: 'mock',
      data: mockNews,
      message: 'Using mock data due to API errors'
    });
  }
});

// Helper function to generate mock news data
function generateMockNews(category = 'general', query = null) {
  const categories = {
    general: 'General Market News',
    markets: 'Market Updates',
    economy: 'Economic News',
    technology: 'Technology Sector',
    commodities: 'Commodities Market',
    finance: 'Financial News',
    crypto: 'Cryptocurrency News'
  };
  
  const mockNews = [
    {
      id: 1,
      title: "Stock Market Reaches All-Time High",
      description: "Major indices hit record levels as tech stocks surge on positive earnings reports.",
      source: "Financial Times",
      url: "https://example.com/news/1",
      image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80",
      publishedAt: new Date(Date.now() - 3600000).toISOString(),
      category: "markets",
      symbol: "SPY"
    },
    {
      id: 2,
      title: "Central Bank Announces Interest Rate Decision",
      description: "The central bank has decided to maintain current interest rates, citing stable inflation and employment figures.",
      source: "Bloomberg",
      url: "https://example.com/news/2",
      image: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80",
      publishedAt: new Date(Date.now() - 7200000).toISOString(),
      category: "economy",
      symbol: "DJI"
    },
    {
      id: 3,
      title: "Tech Giant Announces New Product Line",
      description: "Leading technology company unveils innovative products expected to disrupt the market.",
      source: "TechCrunch",
      url: "https://example.com/news/3",
      image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80",
      publishedAt: new Date(Date.now() - 10800000).toISOString(),
      category: "technology",
      symbol: "AAPL"
    }
  ];
  
  // Filter by category if provided
  let filteredNews = mockNews;
  if (category && category !== 'general') {
    filteredNews = mockNews.filter(item => item.category === category);
  }
  
  // Filter by query if provided
  if (query) {
    const lowerQuery = query.toLowerCase();
    filteredNews = filteredNews.filter(item => 
      item.title.toLowerCase().includes(lowerQuery) || 
      item.description.toLowerCase().includes(lowerQuery) ||
      (item.symbol && item.symbol.toLowerCase().includes(lowerQuery))
    );
  }
  
  return filteredNews.length > 0 ? filteredNews : mockNews;
}

module.exports = router;
