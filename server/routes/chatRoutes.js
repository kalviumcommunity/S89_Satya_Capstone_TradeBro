/**
 * Chat Routes for Saytrix
 * Handles chat, voice, and conversation management endpoints
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// Import services and utilities
const geminiService = require('../services/geminiService');
const {
  generateMessageObject,
  saveOrUpdateChat,
  getChatHistory,
  getChatStatistics,
  getChatSession,
  markSessionInactive,
  getRecentSessions
} = require('../services/chatHistoryService');
const { parseVoiceIntent, getIntentSuggestions } = require('../utils/voiceParser');
const {
  formatChatResponse,
  formatHistoryResponse,
  formatStatsResponse,
  formatSessionResponse
} = require('../utils/responseFormatter');

// Import middleware
const { asyncHandler } = require('../middleware/errorHandler');
const {
  validateSaytrixChatRequest,
  validateSaytrixVoiceRequest,
  validateSaytrixHistoryRequest
} = require('../middleware/validation');

/**
 * POST /chat - Handle regular chat messages
 */
router.post('/chat', validateSaytrixChatRequest, asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const { message, userId, sessionId, userEmail = 'unknown@example.com' } = req.body;
  const userAgent = req.get('User-Agent') || 'Unknown';

  console.log(`💬 Chat request - User: ${userId}, Session: ${sessionId}`);

  try {
    // Validate message with Gemini service
    const messageValidation = geminiService.validateMessage(message);
    if (!messageValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: messageValidation.error,
        code: 'INVALID_MESSAGE'
      });
    }

    // Get chat history for context
    const historyResult = await getChatHistory(userId, {
      sessionId,
      limit: 1,
      includeMessages: true,
      messageLimit: 10
    });

    const chatHistory = historyResult.success && historyResult.data.length > 0
      ? historyResult.data[0].messages || []
      : [];

    // Generate AI response
    const aiResponse = await geminiService.generateResponse(
      messageValidation.cleanMessage,
      null,
      chatHistory
    );

    if (!aiResponse.success) {
      throw new Error('Failed to generate AI response');
    }

    // Create message objects
    const userMessage = generateMessageObject(message, 'user', {
      messageType: 'text',
      isVoiceInput: false
    });

    const assistantMessage = generateMessageObject(aiResponse.message, 'assistant', {
      messageType: 'text',
      stockData: aiResponse.stockData,
      additionalData: aiResponse.additionalData
    });

    // Save chat history
    await saveOrUpdateChat(
      userId,
      sessionId,
      userEmail,
      userMessage,
      assistantMessage,
      userAgent
    );

    // Get intent suggestions
    const suggestions = getIntentSuggestions(message);

    const responseTime = Date.now() - startTime;
    console.log(`✅ Chat response generated in ${responseTime}ms`);

    // Format and send response
    const response = formatChatResponse({
      response: aiResponse.message,
      stockData: aiResponse.stockData,
      additionalData: aiResponse.additionalData,
      suggestions,
      sessionId,
      userMessage: userMessage.text,
      assistantMessage: assistantMessage.text,
      isVoiceResponse: false
    });

    res.json(response);

  } catch (error) {
    console.error('❌ Chat error:', error);
    throw error;
  }
}));

/**
 * POST /voice - Handle voice chat messages
 */
router.post('/voice', validateSaytrixVoiceRequest, asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const {
    message,
    userId,
    sessionId,
    userEmail = 'unknown@example.com',
    voiceData = {}
  } = req.body;
  const userAgent = req.get('User-Agent') || 'Unknown';

  console.log(`🎤 Voice request - User: ${userId}, Session: ${sessionId}`);

  try {
    // Validate message
    const messageValidation = geminiService.validateMessage(message);
    if (!messageValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: messageValidation.error,
        code: 'INVALID_MESSAGE'
      });
    }

    // Get chat history for context
    const historyResult = await getChatHistory(userId, {
      sessionId,
      limit: 1,
      includeMessages: true,
      messageLimit: 10
    });

    const chatHistory = historyResult.success && historyResult.data.length > 0
      ? historyResult.data[0].messages || []
      : [];

    // Generate AI response
    const aiResponse = await geminiService.generateResponse(
      messageValidation.cleanMessage,
      null,
      chatHistory
    );

    if (!aiResponse.success) {
      throw new Error('Failed to generate AI response');
    }

    // Parse voice intent
    const intent = parseVoiceIntent(message, aiResponse);

    // Create message objects with voice metadata
    const userMessage = generateMessageObject(message, 'user', {
      messageType: 'voice',
      isVoiceInput: true,
      voiceConfidence: voiceData.confidence,
      language: voiceData.language || 'en-US'
    });

    const assistantMessage = generateMessageObject(aiResponse.message, 'assistant', {
      messageType: 'voice_response',
      stockData: aiResponse.stockData,
      additionalData: aiResponse.additionalData,
      intent
    });

    // Save chat history
    await saveOrUpdateChat(
      userId,
      sessionId,
      userEmail,
      userMessage,
      assistantMessage,
      userAgent
    );

    // Get intent-based suggestions
    const suggestions = getIntentSuggestions(message);

    const responseTime = Date.now() - startTime;
    console.log(`✅ Voice response generated in ${responseTime}ms`);

    // Format and send response
    const response = formatChatResponse({
      response: aiResponse.message,
      stockData: aiResponse.stockData,
      additionalData: aiResponse.additionalData,
      suggestions,
      sessionId,
      userMessage: userMessage.text,
      assistantMessage: assistantMessage.text,
      intent,
      isVoiceResponse: true
    });

    res.json(response);

  } catch (error) {
    console.error('❌ Voice chat error:', error);
    throw error;
  }
}));

/**
 * GET /history/:userId - Get chat history with pagination
 */
router.get('/history/:userId', validateSaytrixHistoryRequest, asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page, limit, sessionId } = req.query;

  console.log(`📚 History request - User: ${userId}, Page: ${page}, Limit: ${limit}`);

  try {
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sessionId: sessionId || null,
      includeMessages: true,
      messageLimit: 50
    };

    const result = await getChatHistory(userId, options);

    if (!result.success) {
      throw new Error('Failed to fetch chat history');
    }

    const response = formatHistoryResponse(result.data, result.pagination);
    res.json(response);

  } catch (error) {
    console.error('❌ History fetch error:', error);
    throw error;
  }
}));

/**
 * GET /session/:userId/:sessionId - Get specific chat session
 */
router.get('/session/:userId/:sessionId', asyncHandler(async (req, res) => {
  const { userId, sessionId } = req.params;

  console.log(`📋 Session request - User: ${userId}, Session: ${sessionId}`);

  try {
    const result = await getChatSession(userId, sessionId);

    if (!result.success) {
      throw new Error('Failed to fetch chat session');
    }

    const response = formatSessionResponse(result.session);
    res.json(response);

  } catch (error) {
    console.error('❌ Session fetch error:', error);
    throw error;
  }
}));

/**
 * GET /stats/:userId - Get user chat statistics
 */
router.get('/stats/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;

  console.log(`📊 Stats request - User: ${userId}`);

  try {
    const result = await getChatStatistics(userId);

    if (!result.success) {
      throw new Error('Failed to fetch chat statistics');
    }

    const response = formatStatsResponse(result.statistics);
    res.json(response);

  } catch (error) {
    console.error('❌ Stats fetch error:', error);
    throw error;
  }
}));

/**
 * GET /recent/:userId - Get recent chat sessions
 */
router.get('/recent/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { limit = 5 } = req.query;

  console.log(`🕒 Recent sessions request - User: ${userId}`);

  try {
    const result = await getRecentSessions(userId, parseInt(limit));

    if (!result.success) {
      throw new Error('Failed to fetch recent sessions');
    }

    res.json({
      success: true,
      data: result.sessions,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Recent sessions fetch error:', error);
    throw error;
  }
}));

/**
 * POST /session/:userId/:sessionId/end - End a chat session
 */
router.post('/session/:userId/:sessionId/end', asyncHandler(async (req, res) => {
  const { userId, sessionId } = req.params;

  console.log(`🔚 End session request - User: ${userId}, Session: ${sessionId}`);

  try {
    const result = await markSessionInactive(userId, sessionId);

    if (!result.success) {
      throw new Error('Failed to end chat session');
    }

    res.json({
      success: true,
      message: 'Session ended successfully',
      sessionId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ End session error:', error);
    throw error;
  }
}));

module.exports = router;
