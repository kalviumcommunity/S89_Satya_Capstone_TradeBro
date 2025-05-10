const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const UserDataManager = require('../utils/userDataManager');
const User = require('../models/User');
const UserData = require('../models/UserData');
const ChatHistory = require('../models/ChatHistory');

/**
 * @route   GET /api/userdata
 * @desc    Get user data
 * @access  Private
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    // Get user data
    const userData = await UserData.findOne({ userId: req.user.id });
    
    if (!userData) {
      // Create user data if it doesn't exist
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Create new user data
      const newUserData = await UserDataManager.createOrUpdateUserData(
        req.user.id,
        user.email
      );
      
      return res.status(200).json({
        success: true,
        data: newUserData
      });
    }
    
    res.status(200).json({
      success: true,
      data: userData
    });
  } catch (error) {
    console.error('Error getting user data:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/userdata/preferences
 * @desc    Update user preferences
 * @access  Private
 */
router.put('/preferences', verifyToken, async (req, res) => {
  try {
    const { preferences } = req.body;
    
    if (!preferences) {
      return res.status(400).json({
        success: false,
        message: 'Preferences are required'
      });
    }
    
    // Get user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update user preferences
    const userData = await UserDataManager.createOrUpdateUserData(
      req.user.id,
      user.email,
      { preferences }
    );
    
    res.status(200).json({
      success: true,
      message: 'Preferences updated successfully',
      data: userData.preferences
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/userdata/chat-history
 * @desc    Get user chat history
 * @access  Private
 */
router.get('/chat-history', verifyToken, async (req, res) => {
  try {
    const { sessionId, limit } = req.query;
    
    // Get chat history
    const chatHistory = await UserDataManager.getChatHistory(
      req.user.id,
      sessionId,
      limit ? parseInt(limit) : 10
    );
    
    res.status(200).json({
      success: true,
      data: chatHistory
    });
  } catch (error) {
    console.error('Error getting chat history:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/userdata/chat-message
 * @desc    Add a chat message
 * @access  Private
 */
router.post('/chat-message', verifyToken, async (req, res) => {
  try {
    const { sessionId, text, sender } = req.body;
    
    if (!sessionId || !text || !sender) {
      return res.status(400).json({
        success: false,
        message: 'Session ID, text, and sender are required'
      });
    }
    
    // Get user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Add chat message
    const chatHistory = await UserDataManager.addChatMessage(
      req.user.id,
      user.email,
      sessionId,
      text,
      sender
    );
    
    res.status(200).json({
      success: true,
      message: 'Chat message added successfully',
      data: chatHistory.messages[chatHistory.messages.length - 1]
    });
  } catch (error) {
    console.error('Error adding chat message:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/userdata/end-chat-session
 * @desc    End a chat session
 * @access  Private
 */
router.post('/end-chat-session', verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }
    
    // End chat session
    await UserDataManager.endChatSession(req.user.id, sessionId);
    
    res.status(200).json({
      success: true,
      message: 'Chat session ended successfully'
    });
  } catch (error) {
    console.error('Error ending chat session:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/userdata/statistics
 * @desc    Get user statistics
 * @access  Private
 */
router.get('/statistics', verifyToken, async (req, res) => {
  try {
    // Get user data
    const userData = await UserData.findOne({ userId: req.user.id });
    
    if (!userData) {
      return res.status(404).json({
        success: false,
        message: 'User data not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: userData.statistics
    });
  } catch (error) {
    console.error('Error getting statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
