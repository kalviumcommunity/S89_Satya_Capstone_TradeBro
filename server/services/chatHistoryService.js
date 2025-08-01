/**
 * Chat History Service
 * Handles all MongoDB operations for chat history management
 */

const ChatHistory = require('../models/ChatHistory');
const { v4: uuidv4 } = require('uuid');

/**
 * Generate a message object with consistent structure
 * @param {string} text - Message text
 * @param {string} sender - Message sender (user/assistant)
 * @param {object} options - Additional message options
 * @returns {object} Formatted message object
 */
const generateMessageObject = (text, sender, options = {}) => {
  const {
    messageType = 'text',
    stockData = null,
    additionalData = null,
    isVoiceInput = false,
    voiceConfidence = null,
    language = 'en-US'
  } = options;

  return {
    text,
    sender,
    messageType,
    stockData,
    additionalData,
    voiceMetadata: {
      isVoiceInput,
      confidence: voiceConfidence,
      language
    },
    timestamp: new Date(),
    messageId: uuidv4()
  };
};

/**
 * Save or update chat history in MongoDB
 * @param {string} userId - User ID
 * @param {string} sessionId - Session ID
 * @param {string} userEmail - User email
 * @param {object} userMessage - User message object
 * @param {object} assistantMessage - Assistant message object
 * @param {string} userAgent - User agent string
 * @returns {Promise<object>} Saved chat session
 */
const saveOrUpdateChat = async (userId, sessionId, userEmail, userMessage, assistantMessage, userAgent = 'Unknown') => {
  try {
    // Find existing chat session or create new one
    let chatSession = await ChatHistory.findOne({
      userId: userId,
      sessionId: sessionId
    });

    if (!chatSession) {
      // Create new chat session
      chatSession = new ChatHistory({
        userId: userId,
        userEmail: userEmail,
        sessionId: sessionId,
        messages: [],
        metadata: {
          startedAt: new Date(),
          lastActiveAt: new Date(),
          totalMessages: 0,
          platform: 'web',
          userAgent: userAgent,
          isActive: true
        }
      });
    }

    // Add both user and assistant messages
    chatSession.messages.push(userMessage, assistantMessage);
    chatSession.metadata.lastActiveAt = new Date();
    chatSession.metadata.totalMessages = chatSession.messages.length;

    // Save to database
    const savedSession = await chatSession.save();
    
    console.log(`✅ Chat history saved - Session: ${sessionId}, Messages: ${chatSession.messages.length}`);
    
    return {
      success: true,
      session: savedSession,
      messageCount: chatSession.messages.length
    };

  } catch (error) {
    console.error('❌ Error saving chat history:', error);
    throw new Error(`Failed to save chat history: ${error.message}`);
  }
};

/**
 * Get chat history for a user with pagination
 * @param {string} userId - User ID
 * @param {object} options - Query options
 * @returns {Promise<object>} Chat history with pagination
 */
const getChatHistory = async (userId, options = {}) => {
  try {
    const {
      sessionId = null,
      page = 1,
      limit = 10,
      sortBy = 'metadata.lastActiveAt',
      sortOrder = -1,
      includeMessages = true,
      messageLimit = 50
    } = options;

    // Build query
    let query = { userId: userId };
    if (sessionId) {
      query.sessionId = sessionId;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalCount = await ChatHistory.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    // Build aggregation pipeline
    const pipeline = [
      { $match: query },
      { $sort: { [sortBy]: sortOrder } },
      { $skip: skip },
      { $limit: limit }
    ];

    // Limit messages if requested
    if (includeMessages && messageLimit) {
      pipeline.push({
        $addFields: {
          messages: { $slice: ['$messages', -messageLimit] }
        }
      });
    } else if (!includeMessages) {
      pipeline.push({
        $project: {
          messages: 0
        }
      });
    }

    const chatHistory = await ChatHistory.aggregate(pipeline);

    return {
      success: true,
      data: chatHistory,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };

  } catch (error) {
    console.error('❌ Error fetching chat history:', error);
    throw new Error(`Failed to fetch chat history: ${error.message}`);
  }
};

/**
 * Get chat statistics for a user
 * @param {string} userId - User ID
 * @returns {Promise<object>} User chat statistics
 */
const getChatStatistics = async (userId) => {
  try {
    const stats = await ChatHistory.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          totalMessages: { $sum: { $size: '$messages' } },
          lastActiveAt: { $max: '$metadata.lastActiveAt' },
          firstSessionAt: { $min: '$metadata.startedAt' },
          activeSessions: {
            $sum: {
              $cond: [{ $eq: ['$metadata.isActive', true] }, 1, 0]
            }
          }
        }
      },
      {
        $addFields: {
          averageMessagesPerSession: {
            $cond: [
              { $gt: ['$totalSessions', 0] },
              { $divide: ['$totalMessages', '$totalSessions'] },
              0
            ]
          },
          activeDays: {
            $cond: [
              { $and: ['$firstSessionAt', '$lastActiveAt'] },
              {
                $divide: [
                  { $subtract: ['$lastActiveAt', '$firstSessionAt'] },
                  1000 * 60 * 60 * 24
                ]
              },
              0
            ]
          }
        }
      }
    ]);

    const userStats = stats[0] || {
      totalSessions: 0,
      totalMessages: 0,
      lastActiveAt: null,
      firstSessionAt: null,
      activeSessions: 0,
      averageMessagesPerSession: 0,
      activeDays: 0
    };

    return {
      success: true,
      statistics: userStats
    };

  } catch (error) {
    console.error('❌ Error fetching chat statistics:', error);
    throw new Error(`Failed to fetch chat statistics: ${error.message}`);
  }
};

/**
 * Get a specific chat session
 * @param {string} userId - User ID
 * @param {string} sessionId - Session ID
 * @returns {Promise<object>} Chat session
 */
const getChatSession = async (userId, sessionId) => {
  try {
    const session = await ChatHistory.findOne({
      userId: userId,
      sessionId: sessionId
    });

    if (!session) {
      throw new Error('Chat session not found');
    }

    return {
      success: true,
      session
    };

  } catch (error) {
    console.error('❌ Error fetching chat session:', error);
    throw new Error(`Failed to fetch chat session: ${error.message}`);
  }
};

/**
 * Update session metadata
 * @param {string} userId - User ID
 * @param {string} sessionId - Session ID
 * @param {object} metadata - Metadata to update
 * @returns {Promise<object>} Updated session
 */
const updateSessionMetadata = async (userId, sessionId, metadata) => {
  try {
    const session = await ChatHistory.findOneAndUpdate(
      { userId: userId, sessionId: sessionId },
      { 
        $set: { 
          'metadata.lastActiveAt': new Date(),
          ...Object.keys(metadata).reduce((acc, key) => {
            acc[`metadata.${key}`] = metadata[key];
            return acc;
          }, {})
        }
      },
      { new: true }
    );

    if (!session) {
      throw new Error('Chat session not found');
    }

    return {
      success: true,
      session
    };

  } catch (error) {
    console.error('❌ Error updating session metadata:', error);
    throw new Error(`Failed to update session metadata: ${error.message}`);
  }
};

/**
 * Delete a chat session
 * @param {string} userId - User ID
 * @param {string} sessionId - Session ID
 * @returns {Promise<object>} Deletion result
 */
const deleteChatSession = async (userId, sessionId) => {
  try {
    const result = await ChatHistory.deleteOne({
      userId: userId,
      sessionId: sessionId
    });

    if (result.deletedCount === 0) {
      throw new Error('Chat session not found');
    }

    return {
      success: true,
      deletedCount: result.deletedCount
    };

  } catch (error) {
    console.error('❌ Error deleting chat session:', error);
    throw new Error(`Failed to delete chat session: ${error.message}`);
  }
};

/**
 * Mark session as inactive
 * @param {string} userId - User ID
 * @param {string} sessionId - Session ID
 * @returns {Promise<object>} Updated session
 */
const markSessionInactive = async (userId, sessionId) => {
  try {
    return await updateSessionMetadata(userId, sessionId, {
      isActive: false,
      endedAt: new Date()
    });
  } catch (error) {
    console.error('❌ Error marking session inactive:', error);
    throw new Error(`Failed to mark session inactive: ${error.message}`);
  }
};

/**
 * Get recent active sessions
 * @param {string} userId - User ID
 * @param {number} limit - Number of sessions to return
 * @returns {Promise<object>} Recent sessions
 */
const getRecentSessions = async (userId, limit = 5) => {
  try {
    const sessions = await ChatHistory.find({ userId: userId })
      .sort({ 'metadata.lastActiveAt': -1 })
      .limit(limit)
      .select('sessionId metadata messages')
      .lean();

    // Add summary information
    const sessionsWithSummary = sessions.map(session => ({
      ...session,
      messageCount: session.messages ? session.messages.length : 0,
      lastMessage: session.messages && session.messages.length > 0 
        ? session.messages[session.messages.length - 1].text.substring(0, 100) + '...'
        : null
    }));

    return {
      success: true,
      sessions: sessionsWithSummary
    };

  } catch (error) {
    console.error('❌ Error fetching recent sessions:', error);
    throw new Error(`Failed to fetch recent sessions: ${error.message}`);
  }
};

module.exports = {
  generateMessageObject,
  saveOrUpdateChat,
  getChatHistory,
  getChatStatistics,
  getChatSession,
  updateSessionMetadata,
  deleteChatSession,
  markSessionInactive,
  getRecentSessions
};
