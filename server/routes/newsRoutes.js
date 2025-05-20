
const express = require('express');
const axios = require('axios');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');

// Get all news
router.get('/', async (req, res) => {
  try {
    const apiKey = process.env.REACT_APP_NEWS_API_KEY;
    const category = req.query.category || 'business';
    const query = req.query.q || 'stocks';
    const language = req.query.language || 'en';
    
    const url = `https://newsdata.io/api/1/news?apikey=${apiKey}&q=${query}&language=${language}&category=${category}`;
    
    const response = await axios.get(url);
    
    if (response.data && response.data.results) {
      // Transform the data to match our application's format
      const transformedData = response.data.results.map((article, index) => ({
        id: article.article_id || `news-${index}`,
        title: article.title,
        description: article.description || article.content || 'No description available',
        image: article.image_url || 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
        source: article.source_id || article.source || 'Unknown',
        publishedAt: article.pubDate || new Date().toISOString(),
        url: article.link || '#',
        category: article.category || ['business']
      }));
      
      res.status(200).json({
        success: true,
        data: transformedData,
        totalResults: response.data.totalResults || transformedData.length,
        nextPage: response.data.nextPage
      });
    } else {
      throw new Error('Invalid response from news API');
    }
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch news',
      error: error.message
    });
  }
});

// Get news by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const apiKey = process.env.REACT_APP_NEWS_API_KEY;
    const query = req.query.q || 'stocks';
    const language = req.query.language || 'en';
    
    const url = `https://newsdata.io/api/1/news?apikey=${apiKey}&q=${query}&language=${language}&category=${category}`;
    
    const response = await axios.get(url);
    
    if (response.data && response.data.results) {
      // Transform the data to match our application's format
      const transformedData = response.data.results.map((article, index) => ({
        id: article.article_id || `news-${index}`,
        title: article.title,
        description: article.description || article.content || 'No description available',
        image: article.image_url || 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
        source: article.source_id || article.source || 'Unknown',
        publishedAt: article.pubDate || new Date().toISOString(),
        url: article.link || '#',
        category: article.category || [category]
      }));
      
      res.status(200).json({
        success: true,
        data: transformedData,
        totalResults: response.data.totalResults || transformedData.length,
        nextPage: response.data.nextPage
      });
    } else {
      throw new Error('Invalid response from news API');
    }
  } catch (error) {
    console.error('Error fetching news by category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch news by category',
      error: error.message
    });
  }
});

// Search news
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
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

// Check if API key is available
if (!FMP_API_KEY) {
  console.warn('WARNING: FMP_API_KEY environment variable is not set. News API will use mock data.');
}

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
    // Get query parameter if provided
    const { q } = req.query;

    // Create a unique cache key that includes the search query
    const cacheKey = q ? `general-news-${q}` : 'general-news';

    // Check cache first
    if (isCacheValid(cacheKey) && cache.data[cacheKey]) {
      console.log(`Returning cached news data for query: ${q || 'general'}`);
      return res.json({
        success: true,
        source: 'cache',
        data: cache.data[cacheKey]
      });
    }

    // Fetch from FMP API
    console.log(`Fetching news from FMP API with query: ${q || 'general'}`);

    // If we have a search query, use it to filter news
    const apiUrl = q
      ? `https://financialmodelingprep.com/api/v3/stock_news?tickers=${q}&limit=50&apikey=${FMP_API_KEY}`
      : `https://financialmodelingprep.com/api/v3/stock_news?limit=50&apikey=${FMP_API_KEY}`;

    const response = await axios.get(apiUrl, { timeout: 8000 }); // 8 second timeout

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

    // Get query parameter for mock data filtering
    const { q } = req.query;

    try {
      // Return mock data if API fails, filtered by query if provided
      const mockNews = generateMockNews('general', q);

      return res.json({
        success: true,
        source: 'mock',
        data: mockNews,
        message: 'Using mock data due to API errors'
      });
    } catch (mockError) {
      console.error('Error generating mock news:', mockError.message);

      // Fallback to a minimal set of news data if even mock generation fails
      return res.json({
        success: true,
        source: 'fallback',
        data: [
          {
            id: 1,
            title: "Market Update",
            description: "Latest market news and updates.",
            source: "TradeBro",
            url: "#",
            image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1470&q=80",
            publishedAt: new Date().toISOString(),
            category: "general",
            symbol: "MARKET"
          }
        ],
        message: 'Using fallback data due to API errors'
      });
    }
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
    const { q } = req.query;

    // Create a unique cache key that includes both category and query
    const cacheKey = q
      ? `news-category-${category}-query-${q}`
      : `news-category-${category}`;

    // Check cache first
    if (isCacheValid(cacheKey) && cache.data[cacheKey]) {
      console.log(`Returning cached news data for category: ${category}, query: ${q || 'none'}`);
      return res.json({
        success: true,
        source: 'cache',
        data: cache.data[cacheKey]
      });
    }

    // Fetch from FMP API
    console.log(`Fetching news for category: ${category}, query: ${q || 'none'} from FMP API`);

    // Build the API URL based on whether we have a search query
    let apiUrl = `https://financialmodelingprep.com/api/v3/stock_news?category=${category}&limit=50&apikey=${FMP_API_KEY}`;

    // If we have a search query, add it to the URL
    if (q) {
      apiUrl = `https://financialmodelingprep.com/api/v3/stock_news?category=${category}&tickers=${q}&limit=50&apikey=${FMP_API_KEY}`;
    }

    const response = await axios.get(apiUrl, { timeout: 8000 }); // 8 second timeout

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

    // Get query parameter for mock data filtering
    const { q } = req.query;
    const { category } = req.params;

    try {
      // Return mock data if API fails, filtered by category and query if provided
      const mockNews = generateMockNews(category, q);

      return res.json({
        success: true,
        source: 'mock',
        data: mockNews,
        message: 'Using mock data due to API errors'
      });
    } catch (mockError) {
      console.error('Error generating mock news:', mockError.message);

      // Fallback to a minimal set of news data if even mock generation fails
      return res.json({
        success: true,
        source: 'fallback',
        data: [
          {
            id: 1,
            title: `${category.charAt(0).toUpperCase() + category.slice(1)} News`,
            description: `Latest news from the ${category} category.`,
            source: "TradeBro",
            url: "#",
            image: `https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1470&q=80`,
            publishedAt: new Date().toISOString(),
            category: category,
            symbol: category.toUpperCase().substring(0, 4)
          }
        ],
        message: 'Using fallback data due to API errors'
      });
    }
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
    
    const apiKey = process.env.REACT_APP_NEWS_API_KEY;
    const language = req.query.language || 'en';
    
    const url = `https://newsdata.io/api/1/news?apikey=${apiKey}&q=${q}&language=${language}`;
    
    const response = await axios.get(url);
    
    if (response.data && response.data.results) {
      // Transform the data to match our application's format
      const transformedData = response.data.results.map((article, index) => ({
        id: article.article_id || `news-${index}`,
        title: article.title,
        description: article.description || article.content || 'No description available',
        image: article.image_url || 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
        source: article.source_id || article.source || 'Unknown',
        publishedAt: article.pubDate || new Date().toISOString(),
        url: article.link || '#',
        category: article.category || ['business']
      }));
      
      res.status(200).json({
        success: true,
        data: transformedData,
        totalResults: response.data.totalResults || transformedData.length,
        nextPage: response.data.nextPage
      });
    } else {
      throw new Error('Invalid response from news API');
    }
  } catch (error) {
    console.error('Error searching news:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search news',
      error: error.message
    });
  }
});

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

    const { q } = req.query;

    try {
      // Return mock data if API fails
      const mockNews = generateMockNews('general', q);

      return res.json({
        success: true,
        source: 'mock',
        data: mockNews,
        message: 'Using mock data due to API errors'
      });
    } catch (mockError) {
      console.error('Error generating mock news:', mockError.message);

      // Fallback to a minimal set of news data if even mock generation fails
      return res.json({
        success: true,
        source: 'fallback',
        data: [
          {
            id: 1,
            title: `Search Results for "${q}"`,
            description: `News related to your search for "${q}".`,
            source: "TradeBro",
            url: "#",
            image: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1470&q=80",
            publishedAt: new Date().toISOString(),
            category: "search",
            symbol: q ? q.toUpperCase().substring(0, 4) : "SRCH"
          }
        ],
        message: 'Using fallback data due to API errors'
      });
    }
  }
});

// Helper function to generate mock news data
function generateMockNews(category = 'general', query = null) {
  // Define mock news data with different categories

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
