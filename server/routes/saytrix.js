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

/**
 * Helper function to parse voice intents (moved outside of the router)
 */
const parseVoiceIntent = (response, originalMessage) => {
  const message = originalMessage.toLowerCase();
  const aiResponse = (response.message || '').toLowerCase();

  // Navigation intents
  if (message.includes('dashboard') || message.includes('home') || aiResponse.includes('dashboard') || aiResponse.includes('home')) {
    return { type: 'navigate', data: '/dashboard' };
  }
  if (message.includes('portfolio') || aiResponse.includes('portfolio')) {
    return { type: 'navigate', data: '/portfolio' };
  }
  if (message.includes('watchlist') || aiResponse.includes('watchlist')) {
    return { type: 'navigate', data: '/watchlist' };
  }
  if (message.includes('market') || message.includes('stocks') || aiResponse.includes('market') || aiResponse.includes('stocks')) {
    return { type: 'navigate', data: '/market' };
  }
  if (message.includes('news') || aiResponse.includes('news')) {
    return { type: 'navigate', data: '/news' };
  }

  // Stock data intents
  if (response.stockData) {
    return { type: 'stock_data', data: response.stockData };
  }

  // Action intents
  if (message.includes('buy') || message.includes('purchase')) {
    return { type: 'action', data: 'buy_stock' };
  }
  if (message.includes('sell')) {
    return { type: 'action', data: 'sell_stock' };
  }

  // Default to answer intent
  return { type: 'answer', data: response.message };
};

/**
 * POST /chat - Main chat endpoint with Gemini integration and MongoDB storage.
 * - Handles both text and voice input.
 * - Saves chat history to MongoDB atomically.
 */
router.post('/chat', asyncHandler(async (req, res) => {
  const { message, sessionId, userId, userEmail, isVoiceInput = false, voiceConfidence = null } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Message is required and must be a string',
    });
  }

  const currentSessionId = sessionId || uuidv4();

  // Process message with Enhanced Gemini Service
  const response = await geminiService.processMessage(message, userId);

  // Prepare messages for MongoDB storage
  const userMessage = {
    text: message,
    sender: 'user',
    messageType: isVoiceInput ? 'voice_input' : 'text',
    voiceMetadata: {
      isVoiceInput: isVoiceInput,
      confidence: voiceConfidence,
      language: 'en-US',
    },
    timestamp: new Date(),
    messageId: uuidv4(),
  };

  const assistantMessage = {
    text: response.message,
    sender: 'assistant',
    messageType: response.stockData ? 'stock_query' : 'text',
    stockData: response.stockData || null,
    additionalData: response.additionalData || null,
    timestamp: new Date(),
    messageId: uuidv4(),
  };

  // Save to MongoDB if user information is available
  if (userId && userEmail) {
    try {
      // Use findOneAndUpdate with upsert to create or update atomically
      const chatSession = await ChatHistory.findOneAndUpdate(
        { userId, sessionId: currentSessionId },
        {
          $push: { messages: { $each: [userMessage, assistantMessage] } },
          $set: { userEmail, 'metadata.lastActiveAt': new Date(), 'metadata.userAgent': req.headers['user-agent'] || 'Unknown' },
          $inc: { 'metadata.totalMessages': 2 },
          $setOnInsert: {
            'metadata.startedAt': new Date(),
            'metadata.platform': 'web',
          },
        },
        { new: true, upsert: true, runValidators: true }
      );
      console.log('✅ Chat history saved/updated to MongoDB');
    } catch (dbError) {
      console.error('❌ Error saving chat history to MongoDB:', dbError);
      // The request should still succeed even if history fails to save
    }
  }

  res.json({
    success: true,
    data: {
      response: response.message,
      stockData: response.data,
      additionalData: response.additionalData,
      timestamp: new Date().toISOString(),
      suggestions: response.suggestions || geminiService.getQuickSuggestions(message),
      sessionId: currentSessionId,
    },
  });
}));

/**
 * POST /voice - Voice command processing endpoint.
 * - Leverages the same processing logic as the /chat endpoint.
 */
router.post('/voice', asyncHandler(async (req, res) => {
  const { message, sessionId, userId, userEmail } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Message is required and must be a string',
    });
  }

  const currentSessionId = sessionId || uuidv4();
  const isVoiceInput = true;
  const voiceConfidence = req.body.voiceConfidence || null;

  // Re-use the main chat processing logic
  const response = await geminiService.processMessage(message, userId);

  // Parse intent for voice commands
  const intent = parseVoiceIntent(response, message);

  // Prepare messages for MongoDB storage
  const userMessage = {
    text: message,
    sender: 'user',
    messageType: isVoiceInput ? 'voice_input' : 'text',
    voiceMetadata: {
      isVoiceInput: isVoiceInput,
      confidence: voiceConfidence,
      language: 'en-US',
    },
    timestamp: new Date(),
    messageId: uuidv4(),
  };

  const assistantMessage = {
    text: response.message,
    sender: 'assistant',
    messageType: response.stockData ? 'stock_query' : 'text',
    stockData: response.stockData || null,
    additionalData: response.additionalData || null,
    timestamp: new Date(),
    messageId: uuidv4(),
  };

  // Save to MongoDB if user information is available
  if (userId && userEmail) {
    try {
      const chatSession = await ChatHistory.findOneAndUpdate(
        { userId, sessionId: currentSessionId },
        {
          $push: { messages: { $each: [userMessage, assistantMessage] } },
          $set: { userEmail, 'metadata.lastActiveAt': new Date(), 'metadata.userAgent': req.headers['user-agent'] || 'Unknown' },
          $inc: { 'metadata.totalMessages': 2 },
          $setOnInsert: {
            'metadata.startedAt': new Date(),
            'metadata.platform': 'web',
          },
        },
        { new: true, upsert: true, runValidators: true }
      );
      console.log('✅ Voice chat history saved/updated to MongoDB');
    } catch (dbError) {
      console.error('❌ Error saving voice chat history to MongoDB:', dbError);
    }
  }

  res.json({
    success: true,
    data: {
      response: response.message,
      intent: intent.type,
      intentData: intent.data,
      stockData: response.data,
      additionalData: response.additionalData,
      timestamp: new Date().toISOString(),
      suggestions: response.suggestions || geminiService.getQuickSuggestions(message),
      sessionId: currentSessionId,
      isVoiceResponse: true,
    },
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