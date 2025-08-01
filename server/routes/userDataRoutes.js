/**
 * @fileoverview User Data Routes
 * @description Clean routes mapping to controller functions with proper middleware
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();
// Import middleware
const { verifyToken } = require('../middleware/auth');
const { errorMiddleware } = require('../utils/errorHandler');
const {
  validateUserData,
  validateChatMessage,
  validateChatHistoryQuery,
  validateEndSession,
  validateStatisticsUpdate,
  validateObjectId,
  sanitizeInput
} = require('../middleware/validateInput');
const {
  chatMessageRateLimit,
  chatHistoryRateLimit,
  sessionManagementRateLimit,
  userDataRateLimit,
  statisticsRateLimit,
  rateLimitLogger
} = require('../middleware/chatRateLimit');

// Import controller
const userDataController = require('../controllers/userDataController');

// Apply middleware to all routes
router.use(verifyToken); // Authentication required for all routes
router.use(rateLimitLogger); // Log rate limit usage
router.use(sanitizeInput('body')); // Sanitize request body
router.use(sanitizeInput('query')); // Sanitize query parameters

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
 *       404:
 *         description: User data not found
 *       500:
 *         description: Internal server error
 */
router.get('/', userDataRateLimit, userDataController.getUserData);

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
router.post('/', userDataRateLimit, validateUserData, userDataController.createOrUpdateUserData);

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
router.patch('/preferences', userDataRateLimit, validateUserData, userDataController.updatePreferences);

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
 *     responses:
 *       200:
 *         description: Chat history retrieved successfully
 *       400:
 *         description: Invalid query parameters
 *       500:
 *         description: Internal server error
 */
router.get('/chat-history', chatHistoryRateLimit, validateChatHistoryQuery, userDataController.getChatHistory);

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
router.post('/chat', chatMessageRateLimit, validateChatMessage, userDataController.addChatMessage);

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
router.post('/end-session', sessionManagementRateLimit, validateEndSession, userDataController.endChatSession);

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
 *       500:
 *         description: Internal server error
 */
router.get('/statistics', statisticsRateLimit, userDataController.getStatistics);

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
router.patch('/statistics', statisticsRateLimit, validateStatisticsUpdate, userDataController.updateStatistics);

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
router.delete('/sessions/:sessionId', sessionManagementRateLimit, validateObjectId('sessionId'), userDataController.deleteChatSession);

// Apply error handling middleware
router.use(errorMiddleware);

module.exports = router;