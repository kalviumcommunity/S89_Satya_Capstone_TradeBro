/**
 * Main Saytrix Router - Refactored and Modularized
 * AI-powered chatbot system using Gemini, MongoDB, and FMP API
 */

const express = require('express');
const router = express.Router();

// Import services and utilities
const geminiService = require('../services/geminiService');
const { formatHealthResponse } = require('../utils/responseFormatter');
const { v4: uuidv4 } = require('uuid');
const ChatHistory = require('../models/ChatHistory');

// Import middleware
const { asyncHandler, saytrixErrorHandler, notFoundHandler, requestLogger } = require('../middleware/errorHandler');



router.post('/chat', asyncHandler(async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Message is required'
    });
  }

  const response = await geminiService.processMessage(message);

  res.json({
    success: true,
    data: {
      response: response.message,
      suggestions: response.suggestions || ['Market overview', 'Top stocks', 'Investment tips', 'Latest news'],
      action: response.action || null
    }
  });
}));

router.post('/voice', asyncHandler(async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Message is required'
    });
  }

  const response = await geminiService.processMessage(message);

  res.json({
    success: true,
    data: {
      response: response.message,
      isVoiceResponse: true
    }
  });
}));

/**
 * Route Handlers for stock, news, and history.
 * Consolidated into a more readable structure using router.route().
 */
router.route('/stock/:symbol')
  .get(asyncHandler(async (req, res) => {
    const { symbol } = req.params;
    if (!symbol) {
      return res.status(400).json({ success: false, error: 'Stock symbol is required' });
    }
    const stockData = await geminiService.fetchStockData(symbol.toUpperCase());
    if (!stockData) {
      return res.status(404).json({ success: false, error: 'Stock not found or data unavailable' });
    }
    res.json({ success: true, data: stockData });
  }));

router.route('/movers/:type')
  .get(asyncHandler(async (req, res) => {
    const { type } = req.params;
    let data = [];
    if (type === 'gainers') {
      data = await geminiService.fetchTopGainers();
    } else if (type === 'losers') {
      data = await geminiService.fetchTopLosers();
    } else {
      return res.status(400).json({ success: false, error: 'Invalid type. Use "gainers" or "losers"' });
    }
    res.json({ success: true, data });
  }));

router.route('/news/:symbol?')
  .get(asyncHandler(async (req, res) => {
    const { symbol } = req.params;
    const news = await geminiService.fetchMarketNews(symbol);
    res.json({ success: true, data: news });
  }));

router.route('/history/:userId')
  .get(asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { sessionId, limit = 10 } = req.query;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }
    let query = { userId };
    if (sessionId) {
      query.sessionId = sessionId;
    }
    const chatHistory = await ChatHistory.find(query)
      .sort({ 'metadata.lastActiveAt': -1 })
      .limit(parseInt(limit))
      .select('sessionId messages metadata');
    res.json({
      success: true,
      data: { chatHistory, totalSessions: chatHistory.length },
    });
  }));

router.route('/stats/:userId')
  .get(asyncHandler(async (req, res) => {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }
    const stats = await ChatHistory.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          totalMessages: { $sum: { $size: '$messages' } },
          lastActiveAt: { $max: '$metadata.lastActiveAt' },
          firstSessionAt: { $min: '$metadata.startedAt' },
        },
      },
    ]);
    const userStats = stats[0] || {
      totalSessions: 0,
      totalMessages: 0,
      lastActiveAt: null,
      firstSessionAt: null,
    };
    res.json({ success: true, data: userStats });
  }));

/**
 * GET /suggestions - Get quick suggestions
 */
router.get('/suggestions', (req, res) => {
  const suggestions = [
    { text: '📈 Show me top gainers today', command: '/gainers' },
    { text: '📉 Show me top losers today', command: '/losers' },
    { text: '💰 Get RELIANCE stock quote', command: '/quote RELIANCE' },
    { text: '📰 Latest market news', command: '/news' },
    { text: '🔍 Compare TCS vs INFY', command: '/compare TCS INFY' },
    { text: '❓ What is stock market?', command: 'What is stock market?' },
    { text: '📊 Explain PE ratio', command: 'What is PE ratio?' },
    { text: '🏢 Tell me about Nifty 50', command: 'What is Nifty 50?' },
  ];
  res.json({ success: true, data: suggestions });
});

/**
 * GET /health - Enhanced health check endpoint
 */
router.get('/health', asyncHandler(async (req, res) => {
  console.log('🏥 Saytrix health check request');
  const geminiHealth = await geminiService.testConnection();
  const healthData = {
    gemini: geminiHealth.success ? 'healthy' : 'unhealthy',
    database: 'healthy', // A more robust check could be added here
    activeSessions: 0,
  };
  const response = formatHealthResponse(healthData);
  res.json(response);
}));

/**
 * GET /status - Enhanced service status endpoint
 */
router.get('/status', asyncHandler(async (req, res) => {
  console.log('📊 Saytrix status check request');
  const modelInfo = geminiService.getModelInfo();
  res.json({
    success: true,
    service: 'saytrix',
    version: '2.0.0',
    status: 'active',
    features: { chat: true, voice: true, stockData: true, news: true, history: true },
    ai: modelInfo,
    timestamp: new Date().toISOString(),
  });
}));

// Apply error handling middleware at the end of the router
router.use(notFoundHandler);
router.use(saytrixErrorHandler);

module.exports = router;