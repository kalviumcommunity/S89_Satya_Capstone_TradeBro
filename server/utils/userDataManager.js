const User = require('../models/User');
const VirtualMoney = require('../models/VirtualMoney');
const UserData = require('../models/UserData');
const ChatHistory = require('../models/ChatHistory');
const mongoose = require('mongoose');

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
      // Find existing user data or create new one
      let userData = await UserData.findOne({ userId });
      
      if (!userData) {
        // Create new user data document
        userData = new UserData({
          userId,
          userEmail,
          ...data
        });
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
          userData.statistics = {
            ...userData.statistics,
            ...data.statistics
          };
        }
        
        if (data.virtualMoney) {
          userData.virtualMoney = {
            ...userData.virtualMoney,
            ...data.virtualMoney
          };
        }
      }
      
      // Save and return the updated document
      await userData.save();
      return userData;
    } catch (error) {
      console.error('Error in createOrUpdateUserData:', error);
      throw error;
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
      // Get total messages count
      const totalMessages = await ChatHistory.aggregate([
        { $match: { userId: mongoose.Types.ObjectId(userId) } },
        { $unwind: '$messages' },
        { $count: 'total' }
      ]);
      
      // Get total sessions count
      const totalSessions = await ChatHistory.countDocuments({ userId });
      
      // Get last interaction time
      const lastChat = await ChatHistory.findOne(
        { userId },
        {},
        { sort: { 'metadata.lastActiveAt': -1 } }
      );
      
      // Update user data
      await this.createOrUpdateUserData(userId, userEmail, {
        statistics: {
          chatAssistantUsage: {
            totalMessages: totalMessages[0]?.total || 0,
            totalSessions,
            lastInteraction: lastChat?.metadata.lastActiveAt || null
          }
        }
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
   * @returns {Promise<Object>} - Updated ChatHistory document
   */
  static async endChatSession(userId, sessionId) {
    try {
      // Find chat history
      const chatHistory = await ChatHistory.findOne({ userId, sessionId });
      
      if (!chatHistory) {
        throw new Error('Chat session not found');
      }
      
      // Update metadata
      chatHistory.metadata.isActive = false;
      
      // Save and return the updated document
      await chatHistory.save();
      return chatHistory;
    } catch (error) {
      console.error('Error in endChatSession:', error);
      throw error;
    }
  }
}

module.exports = UserDataManager;
