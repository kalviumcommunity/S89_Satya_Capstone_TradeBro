const mongoose = require('mongoose');

/**
 * Schema for storing chat history between users and the trading assistant
 */
const chatHistorySchema = new mongoose.Schema({
  // Reference to the user
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // User email for easier querying
  userEmail: {
    type: String,
    required: true
  },

  // Unique session identifier
  sessionId: {
    type: String,
    required: true
  },

  // Array of messages in the conversation
  messages: [
    {
      // Message content
      text: {
        type: String,
        required: true
      },

      // Who sent the message: 'user' or 'bot'
      sender: {
        type: String,
        enum: ['user', 'bot'],
        required: true
      },

      // When the message was sent
      timestamp: {
        type: Date,
        default: Date.now
      }
    }
  ],

  // Session metadata
  metadata: {
    // When the session was created
    startedAt: {
      type: Date,
      default: Date.now
    },

    // When the session was last active
    lastActiveAt: {
      type: Date,
      default: Date.now
    },

    // Whether the session is still active
    isActive: {
      type: Boolean,
      default: true
    }
  }
}, { timestamps: true });

// Create indexes for efficient querying
chatHistorySchema.index({ 'sessionId': 1 });
chatHistorySchema.index({ 'metadata.lastActiveAt': -1 });

const ChatHistory = mongoose.model('ChatHistory', chatHistorySchema);

module.exports = ChatHistory;
