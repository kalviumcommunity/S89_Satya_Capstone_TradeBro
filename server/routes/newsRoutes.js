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

module.exports = router;
