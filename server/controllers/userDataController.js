/**
 * @fileoverview User Data Controller
 * @description Handles all user data operations including preferences, chat history, and statistics
 * @version 1.0.0
 */

const UserDataManager = require('../utils/userDataManager');
const { sendSuccessResponse, sendErrorResponse, asyncHandler } = require('../utils/errorHandler');

class UserDataController {
  /**
   * @swagger
   * /api/userdata:
   *   get:
   *     summary: Get user data
   *     description: Retrieve user data including preferences, profile, and statistics
   *     tags: [UserData]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User data retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 data:
   *                   $ref: '#/components/schemas/UserData'
   *       404:
   *         description: User data not found
   *       500:
   *         description: Internal server error
   */
  getUserData = asyncHandler(async (req, res) => {
    const { id: userId, email: userEmail } = req.user;
    
    console.log(`📋 Getting user data for user: ${userId}`);
    
    const userData = await UserDataManager.getUserData(userId);
    
    if (!userData) {
      return sendErrorResponse(res, 'User data not found', 404, 'USER_DATA_NOT_FOUND');
    }

    sendSuccessResponse(res, userData, 'User data retrieved successfully');
  });

  /**
   * @swagger
   * /api/userdata:
   *   post:
   *     summary: Create or update user data
   *     description: Create new user data or update existing user preferences and profile
   *     tags: [UserData]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UserDataInput'
   *     responses:
   *       200:
   *         description: User data created/updated successfully
   *       400:
   *         description: Validation error
   *       500:
   *         description: Internal server error
   */
  createOrUpdateUserData = asyncHandler(async (req, res) => {
    const { id: userId, email: userEmail } = req.user;
    const userData = req.body;
    
    console.log(`📝 Creating/updating user data for user: ${userId}`, {
      hasPreferences: !!userData.preferences,
      hasProfile: !!userData.profile
    });
    
    const result = await UserDataManager.createOrUpdateUserData(userId, userEmail, userData);
    
    sendSuccessResponse(res, result, 'User data saved successfully', 200);
  });

  /**
   * @swagger
   * /api/userdata/preferences:
   *   patch:
   *     summary: Update user preferences
   *     description: Update specific user preferences without affecting other data
   *     tags: [UserData]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UserPreferences'
   *     responses:
   *       200:
   *         description: Preferences updated successfully
   *       400:
   *         description: Validation error
   *       500:
   *         description: Internal server error
   */
  updatePreferences = asyncHandler(async (req, res) => {
    const { id: userId, email: userEmail } = req.user;
    const preferences = req.body.preferences;
    
    console.log(`⚙️ Updating preferences for user: ${userId}`, {
      preferences: Object.keys(preferences || {})
    });
    
    const result = await UserDataManager.createOrUpdateUserData(userId, userEmail, { preferences });
    
    sendSuccessResponse(res, result, 'Preferences updated successfully');
  });

  /**
   * @swagger
   * /api/userdata/chat:
   *   post:
   *     summary: Add chat message
   *     description: Add a new message to user's chat history
   *     tags: [Chat]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ChatMessage'
   *     responses:
   *       201:
   *         description: Message added successfully
   *       400:
   *         description: Validation error
   *       500:
   *         description: Internal server error
   */
  addChatMessage = asyncHandler(async (req, res) => {
    const { id: userId, email: userEmail } = req.user;
    const { message, sessionId, metadata = {} } = req.body;
    
    console.log(`💬 Adding chat message for user: ${userId}`, {
      sessionId,
      messageLength: message.length,
      messageType: metadata.type || 'text'
    });
    
    const result = await UserDataManager.addChatMessage(userId, userEmail, message, sessionId, metadata);
    
    sendSuccessResponse(res, result, 'Message added successfully', 201);
  });

  /**
   * @swagger
   * /api/userdata/chat-history:
   *   get:
   *     summary: Get chat history
   *     description: Retrieve paginated chat history with optional filtering
   *     tags: [Chat]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: sessionId
   *         schema:
   *           type: string
   *         description: Filter by specific session ID
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 20
   *         description: Number of records per page
   *       - in: query
   *         name: offset
   *         schema:
   *           type: integer
   *           minimum: 0
   *           default: 0
   *         description: Number of records to skip
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Filter messages from this date
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Filter messages until this date
   *     responses:
   *       200:
   *         description: Chat history retrieved successfully
   *       400:
   *         description: Invalid query parameters
   *       500:
   *         description: Internal server error
   */
  getChatHistory = asyncHandler(async (req, res) => {
    const { id: userId } = req.user;
    const options = req.query;
    
    console.log(`📚 Getting chat history for user: ${userId}`, {
      sessionId: options.sessionId,
      limit: options.limit,
      offset: options.offset
    });
    
    const result = await UserDataManager.getPaginatedChatHistory(userId, options);
    
    sendSuccessResponse(res, result, 'Chat history retrieved successfully');
  });

  /**
   * @swagger
   * /api/userdata/end-session:
   *   post:
   *     summary: End chat session
   *     description: Mark a chat session as ended and update metadata
   *     tags: [Chat]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/EndSession'
   *     responses:
   *       200:
   *         description: Session ended successfully
   *       400:
   *         description: Validation error
   *       404:
   *         description: Session not found
   *       500:
   *         description: Internal server error
   */
  endChatSession = asyncHandler(async (req, res) => {
    const { id: userId } = req.user;
    const { sessionId, reason = 'user_ended', metadata = {} } = req.body;
    
    console.log(`🔚 Ending chat session for user: ${userId}`, {
      sessionId,
      reason
    });
    
    const result = await UserDataManager.endChatSession(userId, sessionId, reason, metadata);
    
    sendSuccessResponse(res, result, 'Session ended successfully');
  });

  /**
   * @swagger
   * /api/userdata/statistics:
   *   get:
   *     summary: Get user statistics
   *     description: Retrieve comprehensive user statistics including chat metrics
   *     tags: [Statistics]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Statistics retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 data:
   *                   $ref: '#/components/schemas/UserStatistics'
   *       500:
   *         description: Internal server error
   */
  getStatistics = asyncHandler(async (req, res) => {
    const { id: userId } = req.user;
    
    console.log(`📊 Getting statistics for user: ${userId}`);
    
    const statistics = await UserDataManager.calculateUserStatistics(userId);
    
    sendSuccessResponse(res, statistics, 'Statistics retrieved successfully');
  });

  /**
   * @swagger
   * /api/userdata/statistics:
   *   patch:
   *     summary: Update custom statistics
   *     description: Update user-specific custom statistics
   *     tags: [Statistics]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CustomStatistics'
   *     responses:
   *       200:
   *         description: Statistics updated successfully
   *       400:
   *         description: Validation error
   *       500:
   *         description: Internal server error
   */
  updateStatistics = asyncHandler(async (req, res) => {
    const { id: userId, email: userEmail } = req.user;
    const { customStats } = req.body;
    
    console.log(`📈 Updating custom statistics for user: ${userId}`, {
      customStats: Object.keys(customStats || {})
    });
    
    const result = await UserDataManager.updateCustomStatistics(userId, userEmail, customStats);
    
    sendSuccessResponse(res, result, 'Statistics updated successfully');
  });

  /**
   * @swagger
   * /api/userdata/sessions/{sessionId}:
   *   delete:
   *     summary: Soft delete chat session
   *     description: Mark a chat session as deleted (soft delete)
   *     tags: [Chat]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: sessionId
   *         required: true
   *         schema:
   *           type: string
   *         description: Session ID to delete
   *     responses:
   *       200:
   *         description: Session deleted successfully
   *       404:
   *         description: Session not found
   *       500:
   *         description: Internal server error
   */
  deleteChatSession = asyncHandler(async (req, res) => {
    const { id: userId } = req.user;
    const { sessionId } = req.params;
    
    console.log(`🗑️ Soft deleting chat session for user: ${userId}`, { sessionId });
    
    const result = await UserDataManager.softDeleteChatSession(userId, sessionId);
    
    sendSuccessResponse(res, result, 'Session deleted successfully');
  });
}

module.exports = new UserDataController();
