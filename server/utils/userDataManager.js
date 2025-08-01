const User = require('../models/User');
const VirtualMoney = require('../models/VirtualMoney');
const UserData = require('../models/UserData');
const ChatHistory = require('../models/ChatHistory');
const mongoose = require('mongoose');
const { createError } = require('./errorHandler');

/**
 * Utility class for managing user data across different models
 */
class UserDataManager {
  /**
   * Create or update UserData document for a user
   * @param {string} userId - User ID
   * @param {string} userEmail - User email
   * @param {Object} data - Data to update
   * @returns {Promise<Object>} - Updated UserData document
   */
  static async createOrUpdateUserData(userId, userEmail, data = {}) {
    try {
      console.log(`📝 Creating/updating user data for user: ${userId}`);

      // Find existing user data or create new one
      let userData = await UserData.findOne({ userId });

      if (!userData) {
        // Create new user data document with defaults
        const defaultData = {
          preferences: {
            theme: 'light',
            language: 'en',
            notifications: { email: true, push: true, sms: false },
            privacy: { profileVisibility: 'public', showOnlineStatus: true, allowMessages: true }
          },
          profile: {
            bio: '', location: '', website: '',
            socialLinks: { twitter: '', linkedin: '', github: '' }
          },
          statistics: {
            totalChats: 0, totalMessages: 0, averageMessageLength: 0,
            lastActivity: new Date(), sessionsCount: 0, totalSessionDuration: 0
          }
        };

        userData = new UserData({
          userId,
          userEmail,
          ...defaultData,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        console.log(`✅ New user data created for user: ${userId}`);
      } else {
        // Update existing user data
        // Use a deep merge approach for nested objects
        if (data.preferences) {
          userData.preferences = {
            ...userData.preferences,
            ...data.preferences
          };
        }

        if (data.statistics) {
          // Initialize statistics object if it doesn't exist
          if (!userData.statistics) {
            userData.statistics = {};
          }

          // Handle nested objects within statistics
          if (data.statistics.chatAssistantUsage) {
            userData.statistics.chatAssistantUsage = {
              ...(userData.statistics.chatAssistantUsage || {}),
              ...data.statistics.chatAssistantUsage
            };
          }

          // Ensure tradingStats exists and is preserved
          if (!userData.statistics.tradingStats) {
            userData.statistics.tradingStats = {
              totalTrades: 0,
              successfulTrades: 0,
              totalProfitLoss: 0
            };
          }

          // Update other top-level properties of statistics
          Object.keys(data.statistics).forEach(key => {
            if (key !== 'chatAssistantUsage' && key !== 'tradingStats') {
              userData.statistics[key] = data.statistics[key];
            }
          });

          // Handle tradingStats if it's being updated
          if (data.statistics.tradingStats) {
            userData.statistics.tradingStats = {
              ...userData.statistics.tradingStats,
              ...data.statistics.tradingStats
            };
          }
        }

        if (data.virtualMoney) {
          userData.virtualMoney = {
            ...userData.virtualMoney,
            ...data.virtualMoney
          };
        }
      }

      // Save and return the updated document
      userData.updatedAt = new Date();
      await userData.save();

      console.log(`✅ User data saved for user: ${userId}`, {
        updatedFields: Object.keys(data),
        timestamp: new Date().toISOString()
      });

      return userData;
    } catch (error) {
      console.error(`❌ Failed to create/update user data for user: ${userId}`, {
        error: error.message,
        timestamp: new Date().toISOString()
      });
      throw createError(`Failed to create or update user data: ${error.message}`, 500, 'USER_DATA_ERROR');
    }
  }

  /**
   * Add a message to chat history
   * @param {string} userId - User ID
   * @param {string} userEmail - User email
   * @param {string} sessionId - Chat session ID
   * @param {string} text - Message text
   * @param {string} sender - Message sender ('user' or 'bot')
   * @returns {Promise<Object>} - Updated ChatHistory document
   */
  static async addChatMessage(userId, userEmail, sessionId, text, sender) {
    try {
      // Find existing chat history or create new one
      let chatHistory = await ChatHistory.findOne({ userId, sessionId });

      if (!chatHistory) {
        // Create new chat history document
        chatHistory = new ChatHistory({
          userId,
          userEmail,
          sessionId,
          messages: []
        });
      }

      // Add new message
      chatHistory.messages.push({
        text,
        sender,
        timestamp: new Date()
      });

      // Update metadata
      chatHistory.metadata.lastActiveAt = new Date();
      chatHistory.metadata.isActive = true;

      // Save and return the updated document
      await chatHistory.save();

      // Update user statistics
      await this.updateChatStatistics(userId, userEmail);

      return chatHistory;
    } catch (error) {
      console.error('Error in addChatMessage:', error);
      throw error;
    }
  }

  /**
   * Update chat statistics for a user
   * @param {string} userId - User ID
   * @param {string} userEmail - User email
   * @returns {Promise<void>}
   */
  static async updateChatStatistics(userId, userEmail) {
    try {
      // Convert userId to ObjectId if it's not already
      const userObjectId = typeof userId === 'string' ? mongoose.Types.ObjectId(userId) : userId;

      // Get total messages count
      const totalMessages = await ChatHistory.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        { $match: { userId: userObjectId } },
        { $unwind: '$messages' },
        { $count: 'total' }
      ]);


      // Get total sessions count
      const totalSessions = await ChatHistory.aggregate([
        { $match: { userId: userObjectId } },
        { $count: 'total' }
      ]);

      // Get last interaction time
      const lastChat = await ChatHistory.findOne(
        { userId: userObjectId },
        {},
        { sort: { 'metadata.lastActiveAt': -1 } }
      );

      // Get existing user data to preserve other statistics
      let userData = await UserData.findOne({ userId });

      // Prepare statistics object with preserved tradingStats if it exists
      const statisticsUpdate = {
        chatAssistantUsage: {
          totalMessages: totalMessages[0]?.total || 0,
          totalSessions: totalSessions[0]?.total || 0,
          lastInteraction: lastChat?.metadata.lastActiveAt || null
        }
      };

      // Update user data with the prepared statistics
      await this.createOrUpdateUserData(userId, userEmail, {
        statistics: statisticsUpdate
      });
    } catch (error) {
      console.error('Error in updateChatStatistics:', error);
      throw error;
    }
  }

  /**
   * Get chat history for a user
   * @param {string} userId - User ID
   * @param {string} sessionId - Optional session ID
   * @param {number} limit - Maximum number of sessions to return
   * @returns {Promise<Array>} - Chat history
   */
  static async getChatHistory(userId, sessionId = null, limit = 10) {
    try {
      let query = { userId };

      // If session ID is provided, get only that session
      if (sessionId) {
        query.sessionId = sessionId;
      }

      // Get chat history
      const chatHistory = await ChatHistory.find(
        query,
        {},
        { sort: { 'metadata.lastActiveAt': -1 }, limit }
      );

      return chatHistory;
    } catch (error) {
      console.error('Error in getChatHistory:', error);
      throw error;
    }
  }

  /**
   * End a chat session
   * @param {string} userId - User ID
   * @param {string} sessionId - Chat session ID
   * @returns {Promise<Object>} - Updated ChatHistory document or null if not found
   */
  static async endChatSession(userId, sessionId) {
    try {
      // Find chat history
      const chatHistory = await ChatHistory.findOne({ userId, sessionId });

      // If no chat history found, return null instead of throwing an error
      if (!chatHistory) {
        console.log(`No chat session found for userId: ${userId}, sessionId: ${sessionId}`);
        return null;
      }

      // Update metadata
      chatHistory.metadata.isActive = false;

      // Save and return the updated document
      await chatHistory.save();

      console.log(`✅ Chat session ended for user: ${userId}, session: ${sessionId}`);
      return chatHistory;
    } catch (error) {
      console.error(`❌ Error ending chat session for user: ${userId}`, {
        sessionId,
        error: error.message
      });
      throw createError(`Failed to end chat session: ${error.message}`, 500, 'CHAT_SESSION_ERROR');
    }
  }

  /**
   * Get paginated chat history with enhanced filtering
   * @param {string} userId - User ID
   * @param {object} options - Query options
   * @returns {Promise<object>} - Paginated chat history with metadata
   */
  static async getPaginatedChatHistory(userId, options = {}) {
    try {
      const {
        sessionId = null,
        limit = 20,
        offset = 0,
        startDate = null,
        endDate = null,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;

      console.log(`📚 Getting paginated chat history for user: ${userId}`, {
        limit, offset, sessionId, startDate, endDate
      });

      // Build query
      let query = { userId: new mongoose.Types.ObjectId(userId) };

      if (sessionId) {
        query.sessionId = sessionId;
      }

      // Add date range filter
      if (startDate || endDate) {
        query['metadata.lastActiveAt'] = {};
        if (startDate) query['metadata.lastActiveAt'].$gte = new Date(startDate);
        if (endDate) query['metadata.lastActiveAt'].$lte = new Date(endDate);
      }

      // Get total count for pagination
      const totalCount = await ChatHistory.countDocuments(query);

      // Get paginated results
      const sortDirection = sortOrder === 'desc' ? -1 : 1;
      const chatHistory = await ChatHistory.find(query)
        .sort({ [sortBy]: sortDirection })
        .skip(offset)
        .limit(limit)
        .lean();

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalCount / limit);
      const currentPage = Math.floor(offset / limit) + 1;
      const hasNext = offset + limit < totalCount;
      const hasPrev = offset > 0;

      const result = {
        data: chatHistory,
        pagination: {
          totalCount,
          totalPages,
          currentPage,
          limit,
          offset,
          hasNext,
          hasPrev
        }
      };

      console.log(`✅ Retrieved ${chatHistory.length} chat sessions for user: ${userId}`);
      return result;
    } catch (error) {
      console.error(`❌ Error getting paginated chat history for user: ${userId}`, {
        error: error.message,
        options
      });
      throw createError(`Failed to get chat history: ${error.message}`, 500, 'CHAT_HISTORY_ERROR');
    }
  }

  /**
   * Calculate comprehensive user statistics
   * @param {string} userId - User ID
   * @returns {Promise<object>} - User statistics
   */
  static async calculateUserStatistics(userId) {
    try {
      console.log(`📊 Calculating statistics for user: ${userId}`);

      const userObjectId = new mongoose.Types.ObjectId(userId);

      // Get chat statistics
      const chatStats = await ChatHistory.aggregate([
        { $match: { userId: userObjectId } },
        {
          $group: {
            _id: null,
            totalSessions: { $sum: 1 },
            totalMessages: { $sum: { $size: '$messages' } },
            avgMessagesPerSession: { $avg: { $size: '$messages' } },
            lastActivity: { $max: '$metadata.lastActiveAt' },
            firstActivity: { $min: '$createdAt' }
          }
        }
      ]);

      // Get message length statistics
      const messageLengthStats = await ChatHistory.aggregate([
        { $match: { userId: userObjectId } },
        { $unwind: '$messages' },
        {
          $group: {
            _id: null,
            avgMessageLength: { $avg: { $strLenCP: '$messages.text' } },
            maxMessageLength: { $max: { $strLenCP: '$messages.text' } },
            minMessageLength: { $min: { $strLenCP: '$messages.text' } }
          }
        }
      ]);

      // Get session duration statistics (if available)
      const sessionStats = await ChatHistory.aggregate([
        { $match: { userId: userObjectId } },
        {
          $addFields: {
            sessionDuration: {
              $subtract: ['$metadata.lastActiveAt', '$createdAt']
            }
          }
        },
        {
          $group: {
            _id: null,
            avgSessionDuration: { $avg: '$sessionDuration' },
            totalSessionDuration: { $sum: '$sessionDuration' },
            maxSessionDuration: { $max: '$sessionDuration' },
            activeSessions: {
              $sum: { $cond: [{ $eq: ['$metadata.isActive', true] }, 1, 0] }
            }
          }
        }
      ]);

      const stats = chatStats[0] || {};
      const lengthStats = messageLengthStats[0] || {};
      const durationStats = sessionStats[0] || {};

      const result = {
        totalChats: stats.totalSessions || 0,
        totalMessages: stats.totalMessages || 0,
        averageMessagesPerSession: Math.round(stats.avgMessagesPerSession || 0),
        averageMessageLength: Math.round(lengthStats.avgMessageLength || 0),
        maxMessageLength: lengthStats.maxMessageLength || 0,
        minMessageLength: lengthStats.minMessageLength || 0,
        lastActivity: stats.lastActivity,
        firstActivity: stats.firstActivity,
        totalSessionDuration: durationStats.totalSessionDuration || 0,
        averageSessionDuration: Math.round(durationStats.avgSessionDuration || 0),
        maxSessionDuration: durationStats.maxSessionDuration || 0,
        activeSessions: durationStats.activeSessions || 0,
        accountAge: stats.firstActivity ?
          Math.floor((Date.now() - stats.firstActivity.getTime()) / (1000 * 60 * 60 * 24)) : 0
      };

      console.log(`✅ Statistics calculated for user: ${userId}`, {
        totalChats: result.totalChats,
        totalMessages: result.totalMessages
      });

      return result;
    } catch (error) {
      console.error(`❌ Error calculating statistics for user: ${userId}`, {
        error: error.message
      });
      throw createError(`Failed to calculate user statistics: ${error.message}`, 500, 'STATISTICS_ERROR');
    }
  }

  /**
   * Soft delete a chat session
   * @param {string} userId - User ID
   * @param {string} sessionId - Session ID
   * @returns {Promise<object>} - Updated chat session
   */
  static async softDeleteChatSession(userId, sessionId) {
    try {
      console.log(`🗑️ Soft deleting chat session for user: ${userId}, session: ${sessionId}`);

      const chatHistory = await ChatHistory.findOne({ userId, sessionId });

      if (!chatHistory) {
        throw createError('Chat session not found', 404, 'SESSION_NOT_FOUND');
      }

      chatHistory.metadata.isDeleted = true;
      chatHistory.metadata.deletedAt = new Date();
      chatHistory.metadata.isActive = false;

      await chatHistory.save();

      console.log(`✅ Chat session soft deleted for user: ${userId}, session: ${sessionId}`);
      return chatHistory;
    } catch (error) {
      console.error(`❌ Error soft deleting chat session for user: ${userId}`, {
        sessionId,
        error: error.message
      });
      throw createError(`Failed to delete chat session: ${error.message}`, 500, 'DELETE_SESSION_ERROR');
    }
  }

  /**
   * Update user statistics with custom data
   * @param {string} userId - User ID
   * @param {string} userEmail - User email
   * @param {object} customStats - Custom statistics to update
   * @returns {Promise<object>} - Updated user data
   */
  static async updateCustomStatistics(userId, userEmail, customStats) {
    try {
      console.log(`📈 Updating custom statistics for user: ${userId}`, {
        customStats: Object.keys(customStats)
      });

      // Get current statistics
      const currentStats = await this.calculateUserStatistics(userId);

      // Merge with custom stats
      const updatedStats = {
        ...currentStats,
        ...customStats,
        lastUpdated: new Date()
      };

      // Update user data
      const userData = await this.createOrUpdateUserData(userId, userEmail, {
        statistics: updatedStats
      });

      console.log(`✅ Custom statistics updated for user: ${userId}`);
      return userData;
    } catch (error) {
      console.error(`❌ Error updating custom statistics for user: ${userId}`, {
        error: error.message,
        customStats
      });
      throw createError(`Failed to update custom statistics: ${error.message}`, 500, 'CUSTOM_STATS_ERROR');
    }
  }
}

module.exports = UserDataManager;
