const express = require('express');
const router = express.Router();
const VirtualMoney = require('../models/VirtualMoney');
const User = require('../models/User');
const { provideDefaultUser } = require('../middleware/defaultUser');

/**
 * Calculate total portfolio value and profit/loss for a user
 * @param {Object} virtualMoney - The virtual money document
 * @returns {Object} - Portfolio statistics
 */
function calculatePortfolioStats(virtualMoney) {
  try {
    let totalInvested = 0;
    let totalCurrentValue = 0;
    let totalProfitLoss = 0;

    virtualMoney.portfolio.forEach(stock => {
      const invested = stock.averageBuyPrice * stock.quantity;
      // Simulate current price with 5% variation for demo
      const variation = (Math.random() * 0.1) - 0.05;
      const currentPrice = stock.averageBuyPrice * (1 + variation);
      const currentValue = currentPrice * stock.quantity;
      
      totalInvested += invested;
      totalCurrentValue += currentValue;
      totalProfitLoss += (currentValue - invested);
    });

    const profitLossPercentage = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

    return {
      totalInvested: parseFloat(totalInvested.toFixed(2)),
      totalCurrentValue: parseFloat(totalCurrentValue.toFixed(2)),
      totalProfitLoss: parseFloat(totalProfitLoss.toFixed(2)),
      profitLossPercentage: parseFloat(profitLossPercentage.toFixed(2)),
      portfolioSize: virtualMoney.portfolio.length
    };
  } catch (error) {
    console.error('Error calculating portfolio stats:', error);
    return {
      totalInvested: 0,
      totalCurrentValue: 0,
      totalProfitLoss: 0,
      profitLossPercentage: 0,
      portfolioSize: 0
    };
  }
}

// Get global leaderboard based on profit/loss
router.get('/global', async (req, res) => {
  try {
    const { limit = 50, sortBy = 'profit' } = req.query;
    
    // Validate limit
    const limitNum = Math.min(parseInt(limit) || 50, 100); // Max 100 users
    
    console.log(`Fetching global leaderboard with limit: ${limitNum}, sortBy: ${sortBy}`);

    // Get all virtual money accounts with user data
    const virtualMoneyAccounts = await VirtualMoney.find({})
      .populate('userId', 'username fullName profileImage tradingExperience')
      .lean();

    if (!virtualMoneyAccounts || virtualMoneyAccounts.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: 'No users found on leaderboard yet'
      });
    }

    // Calculate stats for each user
    const leaderboardData = virtualMoneyAccounts
      .map((account, index) => {
        try {
          const stats = calculatePortfolioStats(account);
          const user = account.userId || {};
          
          return {
            rank: 0, // Will be set after sorting
            userId: account.userId?._id || account.userId,
            username: user.username || 'Anonymous',
            fullName: user.fullName || user.username || 'Anonymous User',
            profileImage: user.profileImage || null,
            tradingExperience: user.tradingExperience || 'Beginner',
            balance: account.balance,
            balanceFormatted: `₹${account.balance.toLocaleString('en-IN')}`,
            totalInvested: stats.totalInvested,
            totalInvestedFormatted: `₹${stats.totalInvested.toLocaleString('en-IN')}`,
            totalCurrentValue: stats.totalCurrentValue,
            totalCurrentValueFormatted: `₹${stats.totalCurrentValue.toLocaleString('en-IN')}`,
            totalProfitLoss: stats.totalProfitLoss,
            totalProfitLossFormatted: `₹${stats.totalProfitLoss.toLocaleString('en-IN')}`,
            profitLossPercentage: stats.profitLossPercentage,
            portfolioSize: stats.portfolioSize,
            totalValue: account.balance + stats.totalCurrentValue,
            totalValueFormatted: `₹${(account.balance + stats.totalCurrentValue).toLocaleString('en-IN')}`,
            joinedAt: account.createdAt || new Date()
          };
        } catch (error) {
          console.error(`Error processing user ${index}:`, error);
          return null;
        }
      })
      .filter(user => user !== null);

    // Sort based on criteria
    let sortedData;
    switch (sortBy) {
      case 'profit':
        sortedData = leaderboardData.sort((a, b) => b.totalProfitLoss - a.totalProfitLoss);
        break;
      case 'percentage':
        sortedData = leaderboardData.sort((a, b) => b.profitLossPercentage - a.profitLossPercentage);
        break;
      case 'totalValue':
        sortedData = leaderboardData.sort((a, b) => b.totalValue - a.totalValue);
        break;
      case 'balance':
        sortedData = leaderboardData.sort((a, b) => b.balance - a.balance);
        break;
      default:
        sortedData = leaderboardData.sort((a, b) => b.totalProfitLoss - a.totalProfitLoss);
    }

    // Assign ranks and limit results
    const finalData = sortedData
      .slice(0, limitNum)
      .map((user, index) => ({
        ...user,
        rank: index + 1
      }));

    console.log(`Leaderboard generated successfully with ${finalData.length} users`);

    res.status(200).json({
      success: true,
      data: finalData,
      meta: {
        totalUsers: leaderboardData.length,
        displayedUsers: finalData.length,
        sortBy,
        currency: 'INR'
      }
    });
  } catch (error) {
    console.error('Error fetching global leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching leaderboard',
      error: error.message
    });
  }
});

// Get user's position on leaderboard
router.get('/my-position', provideDefaultUser, async (req, res) => {
  try {
    console.log('Fetching user position for user:', req.user.id);

    // Get user's virtual money account
    let virtualMoney = await VirtualMoney.findOne({ userId: req.user.id });

    if (!virtualMoney) {
      return res.status(404).json({
        success: false,
        message: 'Virtual money account not found'
      });
    }

    // Get user details
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Calculate user's stats
    const userStats = calculatePortfolioStats(virtualMoney);

    // Get all users for ranking calculation
    const allVirtualMoneyAccounts = await VirtualMoney.find({}).lean();
    
    // Calculate stats for all users and sort by profit
    const allUserStats = allVirtualMoneyAccounts
      .map(account => {
        const stats = calculatePortfolioStats(account);
        return {
          userId: account.userId,
          totalProfitLoss: stats.totalProfitLoss,
          profitLossPercentage: stats.profitLossPercentage,
          totalValue: account.balance + stats.totalCurrentValue
        };
      })
      .sort((a, b) => b.totalProfitLoss - a.totalProfitLoss);

    // Find user's rank
    const userRank = allUserStats.findIndex(u => u.userId.toString() === req.user.id) + 1;

    // Calculate percentile
    const percentile = ((allUserStats.length - userRank + 1) / allUserStats.length) * 100;

    const responseData = {
      rank: userRank,
      totalUsers: allUserStats.length,
      percentile: parseFloat(percentile.toFixed(1)),
      username: user.username,
      fullName: user.fullName || user.username,
      balance: virtualMoney.balance,
      balanceFormatted: `₹${virtualMoney.balance.toLocaleString('en-IN')}`,
      totalInvested: userStats.totalInvested,
      totalInvestedFormatted: `₹${userStats.totalInvested.toLocaleString('en-IN')}`,
      totalCurrentValue: userStats.totalCurrentValue,
      totalCurrentValueFormatted: `₹${userStats.totalCurrentValue.toLocaleString('en-IN')}`,
      totalProfitLoss: userStats.totalProfitLoss,
      totalProfitLossFormatted: `₹${userStats.totalProfitLoss.toLocaleString('en-IN')}`,
      profitLossPercentage: userStats.profitLossPercentage,
      portfolioSize: userStats.portfolioSize,
      totalValue: virtualMoney.balance + userStats.totalCurrentValue,
      totalValueFormatted: `₹${(virtualMoney.balance + userStats.totalCurrentValue).toLocaleString('en-IN')}`,
      currency: 'INR'
    };

    console.log(`User position calculated: Rank ${userRank} out of ${allUserStats.length}`);

    res.status(200).json({
      success: true,
      data: responseData,
      message: userRank <= 10 ? 
        `Congratulations! You're in the top 10!` : 
        `You're ranked ${userRank} out of ${allUserStats.length} traders`
    });
  } catch (error) {
    console.error('Error fetching user position:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching position',
      error: error.message
    });
  }
});

// Get leaderboard by trading experience level
router.get('/by-experience/:level', async (req, res) => {
  try {
    const { level } = req.params;
    const { limit = 20 } = req.query;
    
    const validLevels = ['Beginner', 'Intermediate', 'Advanced', 'Professional'];
    
    if (!validLevels.includes(level)) {
      return res.status(400).json({
        success: false,
        message: `Invalid experience level. Valid options: ${validLevels.join(', ')}`
      });
    }

    const limitNum = Math.min(parseInt(limit) || 20, 50);

    console.log(`Fetching ${level} leaderboard with limit: ${limitNum}`);

    // Get users with specific trading experience
    const users = await User.find({ tradingExperience: level }).lean();
    const userIds = users.map(user => user._id);

    // Get virtual money accounts for these users
    const virtualMoneyAccounts = await VirtualMoney.find({ userId: { $in: userIds } })
      .populate('userId', 'username fullName profileImage tradingExperience')
      .lean();

    if (!virtualMoneyAccounts || virtualMoneyAccounts.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: `No ${level} traders found yet`
      });
    }

    // Calculate and sort by profit
    const leaderboardData = virtualMoneyAccounts
      .map(account => {
        const stats = calculatePortfolioStats(account);
        const user = account.userId || {};
        
        return {
          userId: account.userId?._id || account.userId,
          username: user.username || 'Anonymous',
          fullName: user.fullName || user.username || 'Anonymous User',
          profileImage: user.profileImage || null,
          tradingExperience: level,
          totalProfitLoss: stats.totalProfitLoss,
          totalProfitLossFormatted: `₹${stats.totalProfitLoss.toLocaleString('en-IN')}`,
          profitLossPercentage: stats.profitLossPercentage,
          portfolioSize: stats.portfolioSize,
          totalValue: account.balance + stats.totalCurrentValue,
          totalValueFormatted: `₹${(account.balance + stats.totalCurrentValue).toLocaleString('en-IN')}`
        };
      })
      .sort((a, b) => b.totalProfitLoss - a.totalProfitLoss)
      .slice(0, limitNum)
      .map((user, index) => ({
        ...user,
        rank: index + 1
      }));

    res.status(200).json({
      success: true,
      data: leaderboardData,
      meta: {
        experienceLevel: level,
        totalUsers: leaderboardData.length,
        currency: 'INR'
      }
    });
  } catch (error) {
    console.error('Error fetching experience-based leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching leaderboard',
      error: error.message
    });
  }
});

module.exports = router;
