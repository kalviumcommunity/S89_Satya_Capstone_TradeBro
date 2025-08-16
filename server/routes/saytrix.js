/**
 * Main Saytrix Router - Refactored and Modularized
 * AI-powered chatbot system using Gemini, MongoDB, and FMP API
 */

const express = require('express');
const router = express.Router();

// Import services and utilities
const geminiService = require('../services/geminiService');
const { formatHealthResponse } = require('../utils/responseFormatter');

// Import middleware
const {
  asyncHandler,
  saytrixErrorHandler,
  notFoundHandler,
  requestLogger
} = require('../middleware/errorHandler');

// Legacy imports for backward compatibility
const ChatHistory = require('../models/ChatHistory');
const { v4: uuidv4 } = require('uuid');

// Chat endpoint with MongoDB storage
router.post('/chat', async (req, res) => {
  try {
    const { message, chatHistory = [], sessionId, userId, userEmail, isVoiceInput = false, voiceConfidence = null } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Message is required and must be a string'
      });
    }

    // Generate session ID if not provided
    const currentSessionId = sessionId || uuidv4();

    // Process message with Enhanced Gemini Service
    const response = await geminiService.processMessage(message, userId);

    // Prepare chat data for MongoDB storage
    const userMessage = {
      text: message,
      sender: 'user',
      messageType: isVoiceInput ? 'voice_input' : 'text',
      voiceMetadata: {
        isVoiceInput: isVoiceInput,
        confidence: voiceConfidence,
        language: 'en-US'
      },
      timestamp: new Date(),
      messageId: uuidv4()
    };

    const assistantMessage = {
      text: response.message,
      sender: 'assistant',
      messageType: response.stockData ? 'stock_query' : 'text',
      stockData: response.stockData || null,
      additionalData: response.additionalData || null,
      timestamp: new Date(),
      messageId: uuidv4()
    };

    // Save to MongoDB if user information is available
    if (userId && userEmail) {
      try {
        // Find existing chat session or create new one
        let chatSession = await ChatHistory.findOne({
          userId: userId,
          sessionId: currentSessionId
        });

        if (!chatSession) {
          // Create new chat session
          chatSession = new ChatHistory({
            userId: userId,
            userEmail: userEmail,
            sessionId: currentSessionId,
            messages: [],
            metadata: {
              startedAt: new Date(),
              lastActiveAt: new Date(),
              totalMessages: 0,
              platform: 'web',
              userAgent: req.headers['user-agent'] || 'Unknown'
            }
          });
        }

        // Add both user and assistant messages
        chatSession.messages.push(userMessage, assistantMessage);
        chatSession.metadata.lastActiveAt = new Date();
        chatSession.metadata.totalMessages = chatSession.messages.length;

        // Save to database
        await chatSession.save();
        console.log('✅ Chat history saved to MongoDB');

      } catch (dbError) {
        console.error('❌ Error saving chat history to MongoDB:', dbError);
        // Continue without failing the request
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
        sessionId: currentSessionId
      }
    });

  } catch (error) {
    console.error('Saytrix chat endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Sorry, I encountered an error processing your request. Please try again.'
    });
  }
});

// Get quick suggestions
router.get('/suggestions', (req, res) => {
  try {
    const suggestions = [
      { text: '📈 Show me top gainers today', command: '/gainers' },
      { text: '📉 Show me top losers today', command: '/losers' },
      { text: '💰 Get RELIANCE stock quote', command: '/quote RELIANCE' },
      { text: '📰 Latest market news', command: '/news' },
      { text: '🔍 Compare TCS vs INFY', command: '/compare TCS INFY' },
      { text: '❓ What is stock market?', command: 'What is stock market?' },
      { text: '📊 Explain PE ratio', command: 'What is PE ratio?' },
      { text: '🏢 Tell me about Nifty 50', command: 'What is Nifty 50?' }
    ];

    res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    console.error('Saytrix suggestions endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get stock data for a specific symbol
router.get('/stock/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    if (!symbol) {
      return res.status(400).json({
        success: false,
        error: 'Stock symbol is required'
      });
    }

    const stockData = await geminiService.fetchStockData(symbol.toUpperCase());
    
    if (!stockData) {
      return res.status(404).json({
        success: false,
        error: 'Stock not found or data unavailable'
      });
    }

    res.json({
      success: true,
      data: stockData
    });

  } catch (error) {
    console.error('Saytrix stock data endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get market movers (gainers/losers)
router.get('/movers/:type', async (req, res) => {
  try {
    const { type } = req.params;
    
    let data = [];
    
    if (type === 'gainers') {
      data = await geminiService.fetchTopGainers();
    } else if (type === 'losers') {
      data = await geminiService.fetchTopLosers();
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid type. Use "gainers" or "losers"'
      });
    }

    res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Saytrix market movers endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get market news (general)
router.get('/news', async (req, res) => {
  try {
    const news = await geminiService.fetchMarketNews();

    res.json({
      success: true,
      data: news
    });

  } catch (error) {
    console.error('Saytrix news endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get market news for specific symbol
router.get('/news/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const news = await geminiService.fetchMarketNews(symbol);

    res.json({
      success: true,
      data: news
    });

  } catch (error) {
    console.error('Saytrix news endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Voice command processing endpoint
router.post('/voice', async (req, res) => {
  try {
    const { message, chatHistory = [], isVoiceCommand = true } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Message is required and must be a string'
      });
    }

    // Process message with Gemini (enhanced for voice)
    const response = await geminiService.processMessage(message, chatHistory);

    // Parse intent for voice commands
    const intent = parseVoiceIntent(response, message);

    res.json({
      success: true,
      data: {
        response: response.message,
        intent: intent.type,
        intentData: intent.data,
        stockData: response.stockData,
        additionalData: response.additionalData,
        timestamp: response.timestamp,
        suggestions: geminiService.getQuickSuggestions(message),
        isVoiceResponse: true
      }
    });

  } catch (error) {
    console.error('Saytrix voice endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Sorry, I encountered an error processing your voice command. Please try again.',
      intent: 'error'
    });
  }
});

// Helper function to parse voice intents
function parseVoiceIntent(response, originalMessage) {
  const message = originalMessage.toLowerCase();
  const aiResponse = response.message.toLowerCase();

  // Navigation intents
  if (message.includes('dashboard') || message.includes('home') ||
      aiResponse.includes('dashboard') || aiResponse.includes('home')) {
    return { type: 'navigate', data: '/dashboard' };
  }

  if (message.includes('portfolio') || aiResponse.includes('portfolio')) {
    return { type: 'navigate', data: '/portfolio' };
  }

  if (message.includes('watchlist') || aiResponse.includes('watchlist')) {
    return { type: 'navigate', data: '/watchlist' };
  }

  if (message.includes('market') || message.includes('stocks') ||
      aiResponse.includes('market') || aiResponse.includes('stocks')) {
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
}

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Saytrix is running',
    timestamp: new Date().toISOString()
  });
});

// Get chat history for a user
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { sessionId, limit = 10 } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    let query = { userId: userId };
    if (sessionId) {
      query.sessionId = sessionId;
    }

    const chatHistory = await ChatHistory.find(query)
      .sort({ 'metadata.lastActiveAt': -1 })
      .limit(parseInt(limit))
      .select('sessionId messages metadata');

    res.json({
      success: true,
      data: {
        chatHistory: chatHistory,
        totalSessions: chatHistory.length
      }
    });

  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch chat history'
    });
  }
});

// Get chat statistics for a user
router.get('/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const stats = await ChatHistory.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          totalMessages: { $sum: { $size: '$messages' } },
          lastActiveAt: { $max: '$metadata.lastActiveAt' },
          firstSessionAt: { $min: '$metadata.startedAt' }
        }
      }
    ]);

    const userStats = stats[0] || {
      totalSessions: 0,
      totalMessages: 0,
      lastActiveAt: null,
      firstSessionAt: null
    };

    res.json({
      success: true,
      data: userStats
    });

  } catch (error) {
    console.error('Error fetching chat stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch chat statistics'
    });
  }
});

/**
 * GET /health - Enhanced health check endpoint
 */
router.get('/health', asyncHandler(async (req, res) => {
  console.log('🏥 Saytrix health check request');

  try {
    // Test Gemini service
    const geminiHealth = await geminiService.testConnection();

    const healthData = {
      gemini: geminiHealth.success ? 'healthy' : 'unhealthy',
      database: 'healthy', // Assume healthy if we reach this point
      activeSessions: 0 // Could be enhanced to get actual count
    };

    const response = formatHealthResponse(healthData);
    res.json(response);

  } catch (error) {
    console.error('❌ Saytrix health check error:', error);
    res.status(503).json({
      success: false,
      error: 'Service unhealthy',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}));

/**
 * GET /status - Enhanced service status endpoint
 */
router.get('/status', asyncHandler(async (req, res) => {
  console.log('📊 Saytrix status check request');

  try {
    const modelInfo = geminiService.getModelInfo();

    res.json({
      success: true,
      service: 'saytrix',
      version: '2.0.0',
      status: 'active',
      features: {
        chat: true,
        voice: true,
        stockData: true,
        news: true,
        history: true
      },
      ai: modelInfo,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Saytrix status check error:', error);
    throw error;
  }
}));

// Apply error handling middleware
router.use(notFoundHandler);
router.use(saytrixErrorHandler);

module.exports = router;
