const mongoose = require('mongoose');

// Enhanced User Activity Tracking Model
const userActivitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  userEmail: {
    type: String,
    required: true
  },

  // Activity tracking
  activities: [{
    type: {
      type: String,
      enum: [
        'LOGIN', 'LOGOUT', 'PROFILE_UPDATE', 'PASSWORD_CHANGE',
        'STOCK_VIEW', 'STOCK_SEARCH', 'WATCHLIST_ADD', 'WATCHLIST_REMOVE',
        'ORDER_PLACE', 'ORDER_CANCEL', 'PORTFOLIO_VIEW',
        'CHAT_MESSAGE', 'NOTIFICATION_READ', 'SETTINGS_UPDATE',
        'NEWS_READ', 'CHART_VIEW', 'DASHBOARD_VIEW'
      ],
      required: true
    },
    
    description: {
      type: String,
      required: true
    },
    
    metadata: {
      stockSymbol: String,
      orderType: String,
      amount: Number,
      ipAddress: String,
      userAgent: String,
      deviceType: String
    },
    
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    }
  }],

  // Session tracking
  sessions: [{
    sessionId: {
      type: String,
      required: true
    },
    
    startTime: {
      type: Date,
      default: Date.now
    },
    
    endTime: {
      type: Date,
      default: null
    },
    
    duration: {
      type: Number, // in seconds
      default: 0
    },
    
    ipAddress: String,
    userAgent: String,
    deviceType: String,
    
    pagesVisited: [{
      page: String,
      timestamp: Date,
      timeSpent: Number // in seconds
    }]
  }],

  // Daily statistics
  dailyStats: [{
    date: {
      type: Date,
      required: true
    },
    
    loginCount: {
      type: Number,
      default: 0
    },
    
    timeSpent: {
      type: Number, // in seconds
      default: 0
    },
    
    activitiesCount: {
      type: Number,
      default: 0
    },
    
    stocksViewed: {
      type: Number,
      default: 0
    },
    
    ordersPlaced: {
      type: Number,
      default: 0
    },
    
    chatMessages: {
      type: Number,
      default: 0
    }
  }],

  // User preferences for activity tracking
  trackingPreferences: {
    enableActivityTracking: {
      type: Boolean,
      default: true
    },
    
    enableSessionTracking: {
      type: Boolean,
      default: true
    },
    
    enableLocationTracking: {
      type: Boolean,
      default: false
    },
    
    dataRetentionDays: {
      type: Number,
      default: 90 // Keep data for 90 days
    }
  },

  // Summary statistics
  summary: {
    totalLogins: {
      type: Number,
      default: 0
    },
    
    totalTimeSpent: {
      type: Number, // in seconds
      default: 0
    },
    
    averageSessionDuration: {
      type: Number, // in seconds
      default: 0
    },
    
    mostActiveDay: {
      type: String,
      default: null
    },
    
    mostUsedFeature: {
      type: String,
      default: null
    },
    
    lastActivity: {
      type: Date,
      default: Date.now
    }
  }
}, { 
  timestamps: true,
  // Automatically remove old activities based on retention policy
  expireAfterSeconds: 7776000 // 90 days
});

// Indexes for better performance
userActivitySchema.index({ userId: 1, 'activities.timestamp': -1 });
userActivitySchema.index({ userEmail: 1, 'activities.type': 1 });
userActivitySchema.index({ 'sessions.sessionId': 1 });
userActivitySchema.index({ 'dailyStats.date': 1 });

// Methods
userActivitySchema.methods.addActivity = function(activityType, description, metadata = {}) {
  this.activities.push({
    type: activityType,
    description,
    metadata,
    timestamp: new Date()
  });
  
  // Update summary
  this.summary.lastActivity = new Date();
  
  return this.save();
};

userActivitySchema.methods.startSession = function(sessionId, ipAddress, userAgent, deviceType) {
  this.sessions.push({
    sessionId,
    startTime: new Date(),
    ipAddress,
    userAgent,
    deviceType,
    pagesVisited: []
  });
  
  // Update login count
  this.summary.totalLogins += 1;
  
  return this.save();
};

userActivitySchema.methods.endSession = function(sessionId) {
  const session = this.sessions.find(s => s.sessionId === sessionId);
  if (session && !session.endTime) {
    session.endTime = new Date();
    session.duration = Math.floor((session.endTime - session.startTime) / 1000);
    
    // Update total time spent
    this.summary.totalTimeSpent += session.duration;
    
    // Recalculate average session duration
    const completedSessions = this.sessions.filter(s => s.endTime);
    if (completedSessions.length > 0) {
      this.summary.averageSessionDuration = Math.floor(
        this.summary.totalTimeSpent / completedSessions.length
      );
    }
  }
  
  return this.save();
};

userActivitySchema.methods.updateDailyStats = function(date = new Date()) {
  const dateStr = date.toISOString().split('T')[0];
  const today = new Date(dateStr);
  
  let dailyStat = this.dailyStats.find(stat => 
    stat.date.toISOString().split('T')[0] === dateStr
  );
  
  if (!dailyStat) {
    dailyStat = {
      date: today,
      loginCount: 0,
      timeSpent: 0,
      activitiesCount: 0,
      stocksViewed: 0,
      ordersPlaced: 0,
      chatMessages: 0
    };
    this.dailyStats.push(dailyStat);
  }
  
  // Count today's activities
  const todayActivities = this.activities.filter(activity => 
    activity.timestamp.toISOString().split('T')[0] === dateStr
  );
  
  dailyStat.activitiesCount = todayActivities.length;
  dailyStat.loginCount = todayActivities.filter(a => a.type === 'LOGIN').length;
  dailyStat.stocksViewed = todayActivities.filter(a => a.type === 'STOCK_VIEW').length;
  dailyStat.ordersPlaced = todayActivities.filter(a => a.type === 'ORDER_PLACE').length;
  dailyStat.chatMessages = todayActivities.filter(a => a.type === 'CHAT_MESSAGE').length;
  
  // Calculate time spent today
  const todaySessions = this.sessions.filter(session => 
    session.startTime.toISOString().split('T')[0] === dateStr
  );
  
  dailyStat.timeSpent = todaySessions.reduce((total, session) => {
    return total + (session.duration || 0);
  }, 0);
  
  return this.save();
};

// Static methods
userActivitySchema.statics.getUserActivity = async function(userId) {
  return this.findOne({ userId }).populate('userId', 'fullName email');
};

userActivitySchema.statics.getActivitySummary = async function(userId, days = 30) {
  const activity = await this.findOne({ userId });
  if (!activity) return null;
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const recentActivities = activity.activities.filter(
    a => a.timestamp >= cutoffDate
  );
  
  const recentSessions = activity.sessions.filter(
    s => s.startTime >= cutoffDate
  );
  
  return {
    totalActivities: recentActivities.length,
    totalSessions: recentSessions.length,
    totalTimeSpent: recentSessions.reduce((total, s) => total + (s.duration || 0), 0),
    mostActiveDay: activity.summary.mostActiveDay,
    mostUsedFeature: activity.summary.mostUsedFeature,
    dailyStats: activity.dailyStats.filter(stat => stat.date >= cutoffDate)
  };
};

const UserActivity = mongoose.model('UserActivity', userActivitySchema);

module.exports = UserActivity;
