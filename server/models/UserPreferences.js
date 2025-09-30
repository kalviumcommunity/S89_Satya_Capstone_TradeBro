const mongoose = require('mongoose');

// Enhanced User Preferences Model
const userPreferencesSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  userEmail: {
    type: String,
    required: true
  },

  // UI/UX Preferences
  interface: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    },
    
    language: {
      type: String,
      enum: ['en', 'hi', 'es', 'fr', 'de', 'ja', 'zh'],
      default: 'en'
    },
    
    currency: {
      type: String,
      enum: ['INR', 'USD', 'EUR', 'GBP', 'JPY'],
      default: 'INR'
    },
    
    dateFormat: {
      type: String,
      enum: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'],
      default: 'DD/MM/YYYY'
    },
    
    timeFormat: {
      type: String,
      enum: ['12h', '24h'],
      default: '12h'
    },
    
    numberFormat: {
      type: String,
      enum: ['indian', 'international'],
      default: 'indian'
    },
    
    sidebarCollapsed: {
      type: Boolean,
      default: false
    },
    
    compactMode: {
      type: Boolean,
      default: false
    },
    
    animationsEnabled: {
      type: Boolean,
      default: true
    }
  },

  // Trading Preferences
  trading: {
    defaultOrderType: {
      type: String,
      enum: ['market', 'limit', 'stop-loss'],
      default: 'market'
    },
    
    defaultQuantity: {
      type: Number,
      default: 1,
      min: 1
    },
    
    confirmBeforeOrder: {
      type: Boolean,
      default: true
    },
    
    autoRefreshPortfolio: {
      type: Boolean,
      default: true
    },
    
    refreshInterval: {
      type: Number, // in seconds
      default: 30,
      min: 10,
      max: 300
    },
    
    showProfitLoss: {
      type: Boolean,
      default: true
    },
    
    showPercentageChange: {
      type: Boolean,
      default: true
    },
    
    riskTolerance: {
      type: String,
      enum: ['conservative', 'moderate', 'aggressive'],
      default: 'moderate'
    },
    
    investmentGoals: [{
      type: String,
      enum: ['wealth-building', 'retirement', 'education', 'emergency-fund', 'short-term']
    }],
    
    preferredSectors: [{
      type: String,
      enum: ['technology', 'healthcare', 'finance', 'energy', 'consumer', 'industrial', 'materials', 'utilities', 'real-estate']
    }]
  },

  // Dashboard Preferences
  dashboard: {
    layout: {
      type: String,
      enum: ['default', 'compact', 'detailed'],
      default: 'default'
    },
    
    widgets: [{
      name: {
        type: String,
        required: true
      },
      position: {
        x: Number,
        y: Number,
        w: Number,
        h: Number
      },
      visible: {
        type: Boolean,
        default: true
      },
      settings: mongoose.Schema.Types.Mixed
    }],
    
    defaultPage: {
      type: String,
      enum: ['dashboard', 'portfolio', 'watchlist', 'charts', 'news'],
      default: 'dashboard'
    },
    
    showMarketSummary: {
      type: Boolean,
      default: true
    },
    
    showTopGainers: {
      type: Boolean,
      default: true
    },
    
    showTopLosers: {
      type: Boolean,
      default: true
    },
    
    showNews: {
      type: Boolean,
      default: true
    },
    
    newsCategories: [{
      type: String,
      enum: ['market', 'stocks', 'economy', 'technology', 'politics', 'global']
    }]
  },

  // Chart Preferences
  charts: {
    defaultTimeframe: {
      type: String,
      enum: ['1D', '5D', '1M', '3M', '6M', '1Y', '5Y'],
      default: '1M'
    },
    
    chartType: {
      type: String,
      enum: ['candlestick', 'line', 'area', 'bar'],
      default: 'candlestick'
    },
    
    indicators: [{
      name: String,
      enabled: Boolean,
      settings: mongoose.Schema.Types.Mixed
    }],
    
    overlays: [{
      name: String,
      enabled: Boolean,
      settings: mongoose.Schema.Types.Mixed
    }],
    
    showVolume: {
      type: Boolean,
      default: true
    },
    
    showGrid: {
      type: Boolean,
      default: true
    },
    
    colorScheme: {
      type: String,
      enum: ['green-red', 'blue-orange', 'custom'],
      default: 'green-red'
    }
  },

  // Notification Preferences
  notifications: {
    email: {
      enabled: {
        type: Boolean,
        default: true
      },
      frequency: {
        type: String,
        enum: ['immediate', 'hourly', 'daily', 'weekly'],
        default: 'immediate'
      },
      types: {
        priceAlerts: { type: Boolean, default: true },
        orderUpdates: { type: Boolean, default: true },
        newsAlerts: { type: Boolean, default: false },
        marketUpdates: { type: Boolean, default: false },
        portfolioSummary: { type: Boolean, default: true }
      }
    },
    
    push: {
      enabled: {
        type: Boolean,
        default: true
      },
      types: {
        priceAlerts: { type: Boolean, default: true },
        orderUpdates: { type: Boolean, default: true },
        newsAlerts: { type: Boolean, default: false },
        marketUpdates: { type: Boolean, default: false }
      }
    },
    
    inApp: {
      enabled: {
        type: Boolean,
        default: true
      },
      sound: {
        type: Boolean,
        default: true
      },
      position: {
        type: String,
        enum: ['top-right', 'top-left', 'bottom-right', 'bottom-left'],
        default: 'top-right'
      }
    }
  },

  // Privacy Preferences
  privacy: {
    profileVisibility: {
      type: String,
      enum: ['public', 'friends', 'private'],
      default: 'private'
    },
    
    showOnlineStatus: {
      type: Boolean,
      default: false
    },
    
    allowMessages: {
      type: Boolean,
      default: true
    },
    
    shareAnalytics: {
      type: Boolean,
      default: false
    },
    
    dataRetention: {
      type: Number, // in days
      default: 365,
      min: 30,
      max: 2555 // 7 years
    }
  },

  // AI Assistant Preferences
  aiAssistant: {
    enabled: {
      type: Boolean,
      default: true
    },
    
    voiceEnabled: {
      type: Boolean,
      default: false
    },
    
    personality: {
      type: String,
      enum: ['professional', 'friendly', 'casual', 'expert'],
      default: 'professional'
    },
    
    responseLength: {
      type: String,
      enum: ['brief', 'detailed', 'comprehensive'],
      default: 'detailed'
    },
    
    autoSuggestions: {
      type: Boolean,
      default: true
    },
    
    contextAware: {
      type: Boolean,
      default: true
    }
  },

  // Advanced Settings
  advanced: {
    enableBetaFeatures: {
      type: Boolean,
      default: false
    },
    
    debugMode: {
      type: Boolean,
      default: false
    },
    
    apiRateLimit: {
      type: Number,
      default: 100,
      min: 10,
      max: 1000
    },
    
    cacheEnabled: {
      type: Boolean,
      default: true
    },
    
    offlineMode: {
      type: Boolean,
      default: false
    }
  }
}, { 
  timestamps: true 
});

// Indexes
userPreferencesSchema.index({ userId: 1 });
userPreferencesSchema.index({ userEmail: 1 });

// Methods
userPreferencesSchema.methods.updatePreference = function(category, key, value) {
  if (this[category] && this[category][key] !== undefined) {
    this[category][key] = value;
    return this.save();
  }
  throw new Error(`Invalid preference: ${category}.${key}`);
};

userPreferencesSchema.methods.resetToDefaults = function(category = null) {
  if (category) {
    // Reset specific category to defaults
    const defaultSchema = this.constructor.schema.paths[category].schema;
    if (defaultSchema) {
      this[category] = {};
      // Apply defaults from schema
    }
  } else {
    // Reset all preferences to defaults
    const defaultPrefs = new this.constructor();
    Object.keys(defaultPrefs.toObject()).forEach(key => {
      if (key !== '_id' && key !== 'userId' && key !== 'userEmail') {
        this[key] = defaultPrefs[key];
      }
    });
  }
  return this.save();
};

// Static methods
userPreferencesSchema.statics.getUserPreferences = async function(userId) {
  let preferences = await this.findOne({ userId });
  
  if (!preferences) {
    // Create default preferences if they don't exist
    const user = await mongoose.model('User').findById(userId);
    if (user) {
      preferences = new this({
        userId,
        userEmail: user.email
      });
      await preferences.save();
    }
  }
  
  return preferences;
};

userPreferencesSchema.statics.updateUserPreferences = async function(userId, updates) {
  const preferences = await this.getUserPreferences(userId);
  
  Object.keys(updates).forEach(category => {
    if (preferences[category]) {
      Object.keys(updates[category]).forEach(key => {
        if (preferences[category][key] !== undefined) {
          preferences[category][key] = updates[category][key];
        }
      });
    }
  });
  
  return preferences.save();
};

const UserPreferences = mongoose.model('UserPreferences', userPreferencesSchema);

module.exports = UserPreferences;
