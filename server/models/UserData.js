const mongoose = require('mongoose');

/**
 * Comprehensive schema for storing all user-related data
 * This includes user preferences, settings, and statistics
 */
const userDataSchema = new mongoose.Schema({
  // Reference to the user
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  // User email for easier querying
  userEmail: {
    type: String,
    required: true,
    unique: true
    // Removed index: true to avoid duplicate index
  },

  // User preferences
  preferences: {
    // Theme preference
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    },

    // Default dashboard view
    defaultView: {
      type: String,
      enum: ['portfolio', 'watchlist', 'market'],
      default: 'portfolio'
    },

    // Chart preferences
    chartPreferences: {
      // Default time period for charts
      defaultTimePeriod: {
        type: String,
        enum: ['1D', '1W', '1M', '3M', '6M', '1Y', 'YTD', 'ALL'],
        default: '1M'
      },

      // Default chart type
      defaultChartType: {
        type: String,
        enum: ['line', 'candle', 'bar'],
        default: 'candle'
      }
    },

    // Notification preferences
    notificationPreferences: {
      // Email notifications
      email: {
        type: Boolean,
        default: true
      },

      // Push notifications
      push: {
        type: Boolean,
        default: true
      },

      // Price alerts
      priceAlerts: {
        type: Boolean,
        default: true
      },

      // News alerts
      newsAlerts: {
        type: Boolean,
        default: true
      }
    }
  },

  // User statistics
  statistics: {
    // Total login count
    loginCount: {
      type: Number,
      default: 0
    },

    // Last login time
    lastLogin: {
      type: Date,
      default: null
    },

    // Total time spent on platform (in minutes)
    totalTimeSpent: {
      type: Number,
      default: 0
    },

    // Trading statistics
    tradingStats: {
      // Total trades made
      totalTrades: {
        type: Number,
        default: 0
      },

      // Successful trades (profit)
      successfulTrades: {
        type: Number,
        default: 0
      },

      // Total profit/loss
      totalProfitLoss: {
        type: Number,
        default: 0
      }
    },

    // Chat assistant usage
    chatAssistantUsage: {
      // Total messages sent to assistant
      totalMessages: {
        type: Number,
        default: 0
      },

      // Total sessions with assistant
      totalSessions: {
        type: Number,
        default: 0
      },

      // Last interaction with assistant
      lastInteraction: {
        type: Date,
        default: null
      }
    }
  },

  // Virtual money tracking (summary data)
  virtualMoney: {
    // Current balance
    balance: {
      type: Number,
      default: 10000 // Start with 10,000 Indian Rupees (₹)
    },

    // Total rewards received
    totalRewards: {
      type: Number,
      default: 0
    },

    // Last login reward time
    lastLoginReward: {
      type: Date,
      default: null
    },

    // Initial deposit
    initialDeposit: {
      type: Number,
      default: 10000
    }
  }
}, { timestamps: true });

// Create indexes for efficient querying
userDataSchema.index({ 'userId': 1 }, { unique: true });
userDataSchema.index({ 'userEmail': 1 }, { unique: true });

const UserData = mongoose.model('UserData', userDataSchema);

module.exports = UserData;
