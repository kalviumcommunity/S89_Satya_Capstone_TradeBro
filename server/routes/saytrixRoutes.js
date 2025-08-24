/**
 * Saytrix AI In-Memory Session Router
 * This file contains the complete Express.js router for handling chat sessions,
 * powered by Gemini and a temporary in-memory session store.
 * * NOTE: For production environments, the 'saytrixSessions' Map should be replaced
 * with a persistent storage solution like Redis or a database.
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// --- Mock/External Dependencies (Replace with your actual implementations) ---
// This is a placeholder. You should have a real geminiService.js file.
const geminiService = {
  processMessage: async (message, history) => {
    console.log(`Processing message with Gemini: "${message}"`);
    // Mocking a successful response from Gemini
    return {
      message: `I'm an AI assistant. You asked about: "${message}".`,
      stockData: null,
      additionalData: null,
      timestamp: new Date().toISOString(),
      suggestions: ['Tell me a joke', 'What is AI?'],
    };
  },
  getQuickSuggestions: (input) => {
    // Mocking quick suggestions based on input
    if (input && input.toLowerCase().includes('stock')) {
      return ['AAPL', 'GOOGL', 'MSFT'];
    }
    return ['Show me top news', 'Explain inflation'];
  },
};

// --- Middleware (Common for Express applications) ---
/**
 * Wrapper to handle asynchronous route functions and catch errors.
 * This prevents the need for repetitive try/catch blocks in every async route.
 * @param {Function} fn The async function to wrap.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// --- In-Memory Session Management ---
const saytrixSessions = new Map();

/**
 * Generates a unique session ID using uuidv4.
 * @returns {string} A unique session ID.
 */
function generateSessionId() {
  return `saytrix_${uuidv4()}`;
}

/**
 * Retrieves an existing chat session or creates a new one if it doesn't exist.
 * Updates the last activity timestamp.
 * @param {string} sessionId - The ID of the session to retrieve or create.
 * @returns {object} The chat session object.
 */
function getOrCreateSession(sessionId) {
  let session = saytrixSessions.get(sessionId);
  if (!session) {
    session = {
      id: sessionId,
      messages: [],
      createdAt: new Date(),
    };
    saytrixSessions.set(sessionId, session);
    console.log(`🆕 New session created: ${sessionId}`);
  }
  session.lastActivity = new Date(); // Update activity on every access
  return session;
}

/**
 * Cleans up old chat sessions from memory.
 * Removes sessions that haven't been active for more than 24 hours.
 */
function cleanupOldSessions() {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  for (const [sessionId, session] of saytrixSessions.entries()) {
    if (session.lastActivity < oneDayAgo) {
      saytrixSessions.delete(sessionId);
      console.log(`🧹 Cleaned up old session: ${sessionId}`);
    }
  }
}

// Run cleanup every hour (3600000 milliseconds)
setInterval(cleanupOldSessions, 60 * 60 * 1000);

// --- API Endpoints ---

/**
 * POST /api/saytrix/start
 * Starts a new chat session and returns a welcome message.
 */
router.post('/start', asyncHandler(async (req, res) => {
  const sessionId = generateSessionId();
  const session = getOrCreateSession(sessionId);

  // Add a welcome message to the session
  const welcomeMessage = {
    id: `welcome_${Date.now()}`,
    role: 'assistant',
    content: 'Hello! I\'m Saytrix, your AI-powered stock market assistant. I can help you with:\n\n• Real-time stock prices and data\n• Market analysis and trends\n• Company information and fundamentals\n• Top gainers and losers\n• Latest market news\n• Stock market education\n\nWhat would you like to know about the stock market today?',
    timestamp: new Date().toISOString(),
    suggestions: [
      'Show me NIFTY performance',
      "What are today's top gainers?",
      'Tell me about RELIANCE stock',
      'Latest market news',
    ],
  };

  session.messages.push(welcomeMessage);

  res.json({
    success: true,
    sessionId: sessionId,
    message: welcomeMessage,
  });
}));

/**
 * POST /api/saytrix/message
 * Sends a user message, processes it with Gemini, and returns the AI's response.
 */
router.post('/message', asyncHandler(async (req, res) => {
  const { sessionId, message, messageId } = req.body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Message is required and must be a non-empty string.',
    });
  }

  const session = getOrCreateSession(sessionId);

  // Add user message to session
  const userMessage = {
    id: messageId || `user_${Date.now()}`,
    role: 'user',
    content: message.trim(),
    timestamp: new Date().toISOString(),
  };

  session.messages.push(userMessage);

  // Get chat history for context (last 10 messages) for Gemini.
  const chatHistoryForGemini = session.messages
    .slice(-10) // Limit context to last 10 messages
    .map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }], // Gemini API typically expects 'parts' array
    }));
  
  // Call Gemini service
  const aiResponse = await geminiService.processMessage(message, chatHistoryForGemini);

  // Create assistant message for session storage
  const assistantMessage = {
    id: `assistant_${Date.now()}`,
    role: 'assistant',
    content: aiResponse.message,
    timestamp: aiResponse.timestamp || new Date().toISOString(),
    stockData: aiResponse.stockData || null,
    suggestions: aiResponse.suggestions || geminiService.getQuickSuggestions(message),
  };

  // Add assistant message to session
  session.messages.push(assistantMessage);

  res.json({
    success: true,
    sessionId: session.id,
    userMessage: userMessage,
    assistantMessage: assistantMessage,
  });
}));

/**
 * GET /api/saytrix/session/:sessionId
 * Retrieves a specific chat session by its ID.
 */
router.get('/session/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = saytrixSessions.get(sessionId);

  if (!session) {
    return res.status(404).json({
      success: false,
      error: 'Session not found.',
    });
  }

  // Update last activity timestamp on read
  session.lastActivity = new Date(); 
  
  res.json({
    success: true,
    session: {
      id: session.id,
      messages: session.messages,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity,
    },
  });
});

/**
 * DELETE /api/saytrix/session/:sessionId
 * Clears (deletes) a specific chat session by its ID.
 */
router.delete('/session/:sessionId', (req, res) => {
  const { sessionId } = req.params;

  if (saytrixSessions.has(sessionId)) {
    saytrixSessions.delete(sessionId);
    res.json({
      success: true,
      message: `Saytrix session ${sessionId} cleared.`,
    });
  } else {
    res.status(404).json({
      success: false,
      error: 'Session not found.',
      message: `Session ${sessionId} not found or already cleared.`,
    });
  }
});

/**
 * GET /api/saytrix/suggestions
 * Provides quick chat suggestions based on optional user input.
 */
router.get('/suggestions', (req, res) => {
  const { input } = req.query;
  const suggestions = geminiService.getQuickSuggestions(input);

  res.json({
    success: true,
    suggestions: suggestions,
  });
});

/**
 * GET /api/saytrix/health
 * Performs a basic health check for the Saytrix service.
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    activeSessions: saytrixSessions.size,
    timestamp: new Date().toISOString(),
  });
});

// Export the router
module.exports = router;