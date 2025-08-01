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

      // Who sent the message: 'user' or 'assistant'
      sender: {
        type: String,
        enum: ['user', 'assistant', 'bot'],
        required: true
      },

      // Message type for better categorization
      messageType: {
        type: String,
        enum: ['text', 'stock_query', 'news_query', 'educational', 'voice_input'],
        default: 'text'
      },

      // Stock data associated with the message (if any)
      stockData: {
        symbol: String,
        name: String,
        price: Number,
        change: Number,
        changesPercentage: Number,
        marketCap: Number,
        pe: Number,
        eps: Number,
        sector: String,
        industry: String
      },

      // Additional data (news, market movers, etc.)
      additionalData: {
        type: mongoose.Schema.Types.Mixed,
        default: null
      },

      // Voice input metadata
      voiceMetadata: {
        isVoiceInput: {
          type: Boolean,
          default: false
        },
        confidence: {
          type: Number,
          default: null
        },
        language: {
          type: String,
          default: 'en-US'
        }
      },

      // When the message was sent
      timestamp: {
        type: Date,
        default: Date.now
      },

      // Message ID for tracking
      messageId: {
        type: String,
        default: () => new mongoose.Types.ObjectId().toString()
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


chatHistorySchema.index({ 'userId': 1, 'sessionId': 1 }, { unique: true });
chatHistorySchema.index({ 'sessionId': 1 });
chatHistorySchema.index({ 'metadata.lastActiveAt': -1 });

const ChatHistory = mongoose.model('ChatHistory', chatHistorySchema);

module.exports = ChatHistory;
