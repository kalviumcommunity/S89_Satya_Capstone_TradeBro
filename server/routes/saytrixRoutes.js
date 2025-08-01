const express = require('express');
const geminiService = require('../services/geminiService');
const router = express.Router();

// Store chat sessions in memory (in production, use Redis or database)
const saytrixSessions = new Map();

// Generate session ID
function generateSessionId() {
  return 'saytrix_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Get or create chat session
function getOrCreateSession(sessionId) {
  if (!sessionId) {
    sessionId = generateSessionId();
  }
  
  if (!saytrixSessions.has(sessionId)) {
    saytrixSessions.set(sessionId, {
      id: sessionId,
      messages: [],
      createdAt: new Date(),
      lastActivity: new Date()
    });
  }
  
  return saytrixSessions.get(sessionId);
}

// Clean up old sessions (older than 24 hours)
function cleanupOldSessions() {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  for (const [sessionId, session] of saytrixSessions.entries()) {
    if (session.lastActivity < oneDayAgo) {
      saytrixSessions.delete(sessionId);
    }
  }
}

// Run cleanup every hour
setInterval(cleanupOldSessions, 60 * 60 * 1000);

// POST /api/saytrix/start - Start a new chat session
router.post('/start', async (req, res) => {
  try {
    const sessionId = generateSessionId();
    const session = getOrCreateSession(sessionId);
    
    // Add welcome message
    const welcomeMessage = {
      id: 'welcome_' + Date.now(),
      role: 'assistant',
      content: 'Hello! I\'m Saytrix, your AI-powered stock market assistant. I can help you with:\n\n• Real-time stock prices and data\n• Market analysis and trends\n• Company information and fundamentals\n• Top gainers and losers\n• Latest market news\n• Stock market education\n\nWhat would you like to know about the stock market today?',
      timestamp: new Date().toISOString(),
      suggestions: [
        'Show me NIFTY performance',
        'What are today\'s top gainers?',
        'Tell me about RELIANCE stock',
        'Latest market news'
      ]
    };
    
    session.messages.push(welcomeMessage);
    session.lastActivity = new Date();
    
    res.json({
      success: true,
      sessionId: sessionId,
      message: welcomeMessage
    });
  } catch (error) {
    console.error('Error starting Saytrix session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start Saytrix session'
    });
  }
});

// POST /api/saytrix/message - Send a message and get response
router.post('/message', async (req, res) => {
  try {
    const { sessionId, message, messageId } = req.body;
    
    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }
    
    const session = getOrCreateSession(sessionId);
    
    // Add user message to session
    const userMessage = {
      id: messageId || 'user_' + Date.now(),
      role: 'user',
      content: message.trim(),
      timestamp: new Date().toISOString()
    };
    
    session.messages.push(userMessage);
    session.lastActivity = new Date();
    
    // Get chat history for context (last 10 messages)
    const chatHistory = session.messages
      .slice(-10)
      .map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        content: msg.content
      }));
    
    // Process message with Gemini
    const aiResponse = await geminiService.processMessage(message, chatHistory);
    
    // Create assistant message
    const assistantMessage = {
      id: 'assistant_' + Date.now(),
      role: 'assistant',
      content: aiResponse.message,
      timestamp: aiResponse.timestamp,
      stockData: aiResponse.stockData || null,
      suggestions: geminiService.getQuickSuggestions(message)
    };
    
    // Add assistant message to session
    session.messages.push(assistantMessage);
    session.lastActivity = new Date();
    
    res.json({
      success: true,
      sessionId: session.id,
      userMessage: userMessage,
      assistantMessage: assistantMessage
    });
    
  } catch (error) {
    console.error('Error processing Saytrix message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process message'
    });
  }
});

// GET /api/saytrix/session/:sessionId - Get chat session
router.get('/session/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = saytrixSessions.get(sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    session.lastActivity = new Date();
    
    res.json({
      success: true,
      session: {
        id: session.id,
        messages: session.messages,
        createdAt: session.createdAt,
        lastActivity: session.lastActivity
      }
    });
  } catch (error) {
    console.error('Error getting Saytrix session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get session'
    });
  }
});

// DELETE /api/saytrix/session/:sessionId - Clear chat session
router.delete('/session/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (saytrixSessions.has(sessionId)) {
      saytrixSessions.delete(sessionId);
    }
    
    res.json({
      success: true,
      message: 'Saytrix session cleared'
    });
  } catch (error) {
    console.error('Error clearing Saytrix session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear session'
    });
  }
});

// GET /api/saytrix/suggestions - Get quick suggestions
router.get('/suggestions', (req, res) => {
  try {
    const { input } = req.query;
    const suggestions = geminiService.getQuickSuggestions(input);
    
    res.json({
      success: true,
      suggestions: suggestions
    });
  } catch (error) {
    console.error('Error getting Saytrix suggestions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get suggestions'
    });
  }
});

// GET /api/saytrix/health - Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    activeSessions: saytrixSessions.size,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
