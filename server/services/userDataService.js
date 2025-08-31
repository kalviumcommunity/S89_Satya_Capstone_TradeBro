const User = require('../models/User');
const UserData = require('../models/UserData');
const UserActivity = require('../models/UserActivity');
const UserPreferences = require('../models/UserPreferences');
const VirtualMoney = require('../models/VirtualMoney');
const Watchlist = require('../models/Watchlist');
const Order = require('../models/Order');
const ChatHistory = require('../models/ChatHistory');

/**
 * Comprehensive User Data Service
 * Manages all user-related data across different models
 */
class UserDataService {
  
  /**
   * Get complete user profile with all related data
   * @param {string} userId - User ID
   * @returns {Object} Complete user profile
   */
  static async getCompleteUserProfile(userId) {
    try {
      // Get all user-related data in parallel
      const [
        user,
        userData,
        userActivity,
        userPreferences,
        virtualMoney,
        watchlists,
        orders,
        chatHistory
      ] = await Promise.all([
        User.findById(userId).select('-password'),
        UserData.findOne({ userId }),
        UserActivity.findOne({ userId }),
        UserPreferences.findOne({ userId }),
        VirtualMoney.findOne({ userId }),
        Watchlist.find({ userId }),
        Order.find({ userId }).sort({ createdAt: -1 }).limit(10),
        ChatHistory.findOne({ userId })
      ]);

      if (!user) {
        throw new Error('User not found');
      }

      // Calculate portfolio summary
      const portfolioSummary = virtualMoney ? {
        totalValue: virtualMoney.totalValue,
        availableCash: virtualMoney.availableCash,
        totalInvested: virtualMoney.totalInvested,
        totalGainLoss: virtualMoney.totalGainLoss,
        totalGainLossPercentage: virtualMoney.totalGainLossPercentage,
        holdingsCount: virtualMoney.holdings?.length || 0
      } : null;

      // Calculate activity summary
      const activitySummary = userActivity ? {
        totalActivities: userActivity.activities?.length || 0,
        totalSessions: userActivity.sessions?.length || 0,
        totalTimeSpent: userActivity.summary?.totalTimeSpent || 0,
        lastActivity: userActivity.summary?.lastActivity,
        mostUsedFeature: userActivity.summary?.mostUsedFeature
      } : null;

      return {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          phoneNumber: user.phoneNumber,
          profileImage: user.profileImage,
          tradingExperience: user.tradingExperience,
          preferredMarkets: user.preferredMarkets,
          bio: user.bio,
          authProvider: user.authProvider,
          emailVerified: user.emailVerified,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt
        },
        userData: userData || null,
        activity: activitySummary,
        preferences: userPreferences || null,
        portfolio: portfolioSummary,
        watchlists: watchlists || [],
        recentOrders: orders || [],
        chatHistory: chatHistory || null,
        stats: {
          watchlistsCount: watchlists?.length || 0,
          ordersCount: orders?.length || 0,
          chatMessagesCount: chatHistory?.messages?.length || 0
        }
      };
    } catch (error) {
      console.error('Error getting complete user profile:', error);
      throw error;
    }
  }

  /**
   * Initialize user data for new users
   * @param {string} userId - User ID
   * @param {string} userEmail - User email
   * @returns {Object} Initialized user data
   */
  static async initializeUserData(userId, userEmail) {
    try {
      // Create default user data documents
      const [userData, userActivity, userPreferences, virtualMoney] = await Promise.all([
        // Create UserData if it doesn't exist
        UserData.findOneAndUpdate(
          { userId },
          {
            userId,
            userEmail,
            preferences: {
              theme: 'light',
              language: 'en',
              notifications: { email: true, push: true, sms: false },
              privacy: { profileVisibility: 'private', showOnlineStatus: false, allowMessages: true }
            },
            profile: {
              bio: '', location: '', website: '',
              socialLinks: { twitter: '', linkedin: '', github: '' }
            },
            statistics: {
              totalChats: 0, totalMessages: 0, averageMessageLength: 0,
              lastActivity: new Date(), sessionsCount: 0, totalSessionDuration: 0
            }
          },
          { upsert: true, new: true }
        ),

        // Create UserActivity if it doesn't exist
        UserActivity.findOneAndUpdate(
          { userId },
          {
            userId,
            userEmail,
            activities: [],
            sessions: [],
            dailyStats: [],
            trackingPreferences: {
              enableActivityTracking: true,
              enableSessionTracking: true,
              enableLocationTracking: false,
              dataRetentionDays: 90
            },
            summary: {
              totalLogins: 0,
              totalTimeSpent: 0,
              averageSessionDuration: 0,
              mostActiveDay: null,
              mostUsedFeature: null,
              lastActivity: new Date()
            }
          },
          { upsert: true, new: true }
        ),

        // Create UserPreferences if it doesn't exist
        UserPreferences.findOneAndUpdate(
          { userId },
          {
            userId,
            userEmail,
            interface: {
              theme: 'light',
              language: 'en',
              currency: 'INR',
              dateFormat: 'DD/MM/YYYY',
              timeFormat: '12h',
              numberFormat: 'indian'
            },
            trading: {
              defaultOrderType: 'market',
              defaultQuantity: 1,
              confirmBeforeOrder: true,
              autoRefreshPortfolio: true,
              refreshInterval: 30,
              riskTolerance: 'moderate'
            },
            dashboard: {
              layout: 'default',
              widgets: [],
              defaultPage: 'dashboard',
              showMarketSummary: true,
              showTopGainers: true,
              showTopLosers: true,
              showNews: true
            }
          },
          { upsert: true, new: true }
        ),

        // Create VirtualMoney if it doesn't exist
        VirtualMoney.findOneAndUpdate(
          { userId },
          {
            userId,
            userEmail,
            totalValue: 10000,
            availableCash: 10000,
            totalInvested: 0,
            totalGainLoss: 0,
            totalGainLossPercentage: 0,
            balance: 10000,
            transactions: [{
              type: 'DEPOSIT',
              amount: 10000,
              timestamp: new Date(),
              description: 'Initial deposit - Welcome to TradeBro!'
            }],
            holdings: [],
            portfolio: []
          },
          { upsert: true, new: true }
        )
      ]);

      return {
        userData,
        userActivity,
        userPreferences,
        virtualMoney
      };
    } catch (error) {
      console.error('Error initializing user data:', error);
      throw error;
    }
  }

  /**
   * Update user activity
   * @param {string} userId - User ID
   * @param {string} activityType - Type of activity
   * @param {string} description - Activity description
   * @param {Object} metadata - Additional metadata
   */
  static async trackUserActivity(userId, activityType, description, metadata = {}) {
    try {
      let activity = await UserActivity.findOne({ userId });
      
      if (!activity) {
        const user = await User.findById(userId);
        if (user) {
          activity = new UserActivity({
            userId,
            userEmail: user.email,
            activities: [],
            sessions: [],
            dailyStats: [],
            trackingPreferences: {},
            summary: {}
          });
        }
      }

      if (activity) {
        await activity.addActivity(activityType, description, metadata);
        await activity.updateDailyStats();
      }
    } catch (error) {
      console.error('Error tracking user activity:', error);
      // Don't throw error for activity tracking to avoid breaking main functionality
    }
  }

  /**
   * Get user dashboard data
   * @param {string} userId - User ID
   * @returns {Object} Dashboard data
   */
  static async getDashboardData(userId) {
    try {
      const [user, virtualMoney, watchlists, recentOrders, userActivity] = await Promise.all([
        User.findById(userId).select('fullName email profileImage tradingExperience'),
        VirtualMoney.findOne({ userId }),
        Watchlist.find({ userId }).limit(5),
        Order.find({ userId }).sort({ createdAt: -1 }).limit(5),
        UserActivity.findOne({ userId })
      ]);

      // Get recent activity summary
      const recentActivity = userActivity?.activities
        ?.slice(-10)
        ?.reverse() || [];

      // Calculate today's stats
      const today = new Date().toISOString().split('T')[0];
      const todayStats = userActivity?.dailyStats?.find(
        stat => stat.date.toISOString().split('T')[0] === today
      ) || {
        loginCount: 0,
        timeSpent: 0,
        activitiesCount: 0,
        stocksViewed: 0,
        ordersPlaced: 0
      };

      return {
        user: {
          fullName: user?.fullName || 'User',
          email: user?.email || '',
          profileImage: user?.profileImage || null,
          tradingExperience: user?.tradingExperience || 'Beginner'
        },
        portfolio: {
          totalValue: virtualMoney?.totalValue || 10000,
          availableCash: virtualMoney?.availableCash || 10000,
          totalInvested: virtualMoney?.totalInvested || 0,
          totalGainLoss: virtualMoney?.totalGainLoss || 0,
          totalGainLossPercentage: virtualMoney?.totalGainLossPercentage || 0,
          holdingsCount: virtualMoney?.holdings?.length || 0
        },
        watchlists: watchlists?.map(w => ({
          id: w._id,
          name: w.name,
          stocksCount: w.stocks?.length || 0
        })) || [],
        recentOrders: recentOrders?.map(o => ({
          id: o._id,
          stockSymbol: o.stockSymbol,
          type: o.type,
          quantity: o.quantity,
          price: o.price,
          status: o.status,
          createdAt: o.createdAt
        })) || [],
        activity: {
          recent: recentActivity,
          todayStats,
          totalActivities: userActivity?.activities?.length || 0,
          lastActivity: userActivity?.summary?.lastActivity || null
        }
      };
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      throw error;
    }
  }

  /**
   * Delete all user data (GDPR compliance)
   * @param {string} userId - User ID
   * @returns {Object} Deletion summary
   */
  static async deleteAllUserData(userId) {
    try {
      const deletionResults = await Promise.allSettled([
        UserData.deleteOne({ userId }),
        UserActivity.deleteOne({ userId }),
        UserPreferences.deleteOne({ userId }),
        VirtualMoney.deleteOne({ userId }),
        Watchlist.deleteMany({ userId }),
        Order.deleteMany({ userId }),
        ChatHistory.deleteOne({ userId })
      ]);

      const summary = {
        userData: deletionResults[0].status === 'fulfilled' ? deletionResults[0].value.deletedCount : 0,
        userActivity: deletionResults[1].status === 'fulfilled' ? deletionResults[1].value.deletedCount : 0,
        userPreferences: deletionResults[2].status === 'fulfilled' ? deletionResults[2].value.deletedCount : 0,
        virtualMoney: deletionResults[3].status === 'fulfilled' ? deletionResults[3].value.deletedCount : 0,
        watchlists: deletionResults[4].status === 'fulfilled' ? deletionResults[4].value.deletedCount : 0,
        orders: deletionResults[5].status === 'fulfilled' ? deletionResults[5].value.deletedCount : 0,
        chatHistory: deletionResults[6].status === 'fulfilled' ? deletionResults[6].value.deletedCount : 0
      };

      return {
        success: true,
        message: 'All user data deleted successfully',
        summary,
        deletedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error deleting user data:', error);
      throw error;
    }
  }
}

module.exports = UserDataService;
