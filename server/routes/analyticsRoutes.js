const express = require('express');
const router = express.Router();
const VirtualMoney = require('../models/VirtualMoney');
const User = require('../models/User');
const { provideDefaultUser } = require('../middleware/defaultUser');

/**
 * Calculate portfolio performance metrics
 * @param {Object} virtualMoney - The virtual money document
 * @returns {Object} - Detailed analytics
 */
function calculatePortfolioAnalytics(virtualMoney) {
  try {
    const portfolio = virtualMoney.portfolio || [];
    const transactions = virtualMoney.transactions || [];
    
    // Basic portfolio metrics
    let totalInvested = 0;
    let totalCurrentValue = 0;
    let totalProfitLoss = 0;
    let bestPerformer = null;
    let worstPerformer = null;
    let bestPerformancePercent = -Infinity;
    let worstPerformancePercent = Infinity;

    // Analyze each stock in portfolio
    const stockAnalytics = portfolio.map(stock => {
      const invested = stock.averageBuyPrice * stock.quantity;
      // Simulate current price with variation for demo
      const variation = (Math.random() * 0.1) - 0.05;
      const currentPrice = stock.averageBuyPrice * (1 + variation);
      const currentValue = currentPrice * stock.quantity;
      const profitLoss = currentValue - invested;
      const profitLossPercent = (profitLoss / invested) * 100;

      totalInvested += invested;
      totalCurrentValue += currentValue;
      totalProfitLoss += profitLoss;

      // Track best and worst performers
      if (profitLossPercent > bestPerformancePercent) {
        bestPerformancePercent = profitLossPercent;
        bestPerformer = {
          symbol: stock.stockSymbol,
          profitLoss: profitLoss,
          profitLossPercent: profitLossPercent
        };
      }

      if (profitLossPercent < worstPerformancePercent) {
        worstPerformancePercent = profitLossPercent;
        worstPerformer = {
          symbol: stock.stockSymbol,
          profitLoss: profitLoss,
          profitLossPercent: profitLossPercent
        };
      }

      return {
        symbol: stock.stockSymbol,
        quantity: stock.quantity,
        averageBuyPrice: stock.averageBuyPrice,
        currentPrice: parseFloat(currentPrice.toFixed(2)),
        invested: parseFloat(invested.toFixed(2)),
        currentValue: parseFloat(currentValue.toFixed(2)),
        profitLoss: parseFloat(profitLoss.toFixed(2)),
        profitLossPercent: parseFloat(profitLossPercent.toFixed(2)),
        weightInPortfolio: 0 // Will calculate after totals
      };
    });

    // Calculate portfolio weights
    stockAnalytics.forEach(stock => {
      stock.weightInPortfolio = totalCurrentValue > 0 ? 
        parseFloat(((stock.currentValue / totalCurrentValue) * 100).toFixed(2)) : 0;
    });

    // Transaction analysis
    const buyTransactions = transactions.filter(t => t.type === 'BUY');
    const sellTransactions = transactions.filter(t => t.type === 'SELL');
    const rewardTransactions = transactions.filter(t => t.type === 'LOGIN_REWARD');

    // Calculate trading frequency
    const totalTrades = buyTransactions.length + sellTransactions.length;
    const avgTradeSize = totalTrades > 0 ? 
      (buyTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) / buyTransactions.length) : 0;

    // Risk metrics
    const portfolioVolatility = stockAnalytics.length > 0 ? 
      Math.sqrt(stockAnalytics.reduce((sum, stock) => 
        sum + Math.pow(stock.profitLossPercent, 2), 0) / stockAnalytics.length) : 0;

    return {
      overview: {
        totalInvested: parseFloat(totalInvested.toFixed(2)),
        totalCurrentValue: parseFloat(totalCurrentValue.toFixed(2)),
        totalProfitLoss: parseFloat(totalProfitLoss.toFixed(2)),
        totalProfitLossPercent: totalInvested > 0 ? 
          parseFloat(((totalProfitLoss / totalInvested) * 100).toFixed(2)) : 0,
        portfolioSize: portfolio.length,
        cashBalance: virtualMoney.balance
      },
      performance: {
        bestPerformer,
        worstPerformer,
        portfolioVolatility: parseFloat(portfolioVolatility.toFixed(2))
      },
      trading: {
        totalTrades,
        buyTrades: buyTransactions.length,
        sellTrades: sellTransactions.length,
        avgTradeSize: parseFloat(avgTradeSize.toFixed(2)),
        totalRewards: rewardTransactions.length,
        totalRewardAmount: rewardTransactions.reduce((sum, t) => sum + t.amount, 0)
      },
      holdings: stockAnalytics
    };
  } catch (error) {
    console.error('Error calculating portfolio analytics:', error);
    return {
      overview: { totalInvested: 0, totalCurrentValue: 0, totalProfitLoss: 0, totalProfitLossPercent: 0, portfolioSize: 0, cashBalance: 0 },
      performance: { bestPerformer: null, worstPerformer: null, portfolioVolatility: 0 },
      trading: { totalTrades: 0, buyTrades: 0, sellTrades: 0, avgTradeSize: 0, totalRewards: 0, totalRewardAmount: 0 },
      holdings: []
    };
  }
}

// Get comprehensive portfolio analytics
router.get('/portfolio', provideDefaultUser, async (req, res) => {
  try {
    console.log('Fetching portfolio analytics for user:', req.user.id);

    // Get user details
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get virtual money account
    let virtualMoney = await VirtualMoney.findOne({ userId: req.user.id });

    if (!virtualMoney) {
      // Create new account if not found
      virtualMoney = new VirtualMoney({
        userId: req.user.id,
        userEmail: user.email,
        balance: 10000,
        portfolio: [],
        transactions: [{
          type: 'DEPOSIT',
          amount: 10000,
          description: 'Initial deposit of ₹10,000',
          timestamp: new Date()
        }]
      });
      await virtualMoney.save();
      console.log('Created new virtual money account for analytics');
    }

    // Calculate comprehensive analytics
    const analytics = calculatePortfolioAnalytics(virtualMoney);

    // Format currency values
    const formatCurrency = (amount) => `₹${amount.toLocaleString('en-IN')}`;

    const formattedAnalytics = {
      overview: {
        ...analytics.overview,
        totalInvestedFormatted: formatCurrency(analytics.overview.totalInvested),
        totalCurrentValueFormatted: formatCurrency(analytics.overview.totalCurrentValue),
        totalProfitLossFormatted: formatCurrency(analytics.overview.totalProfitLoss),
        cashBalanceFormatted: formatCurrency(analytics.overview.cashBalance),
        totalPortfolioValue: analytics.overview.totalCurrentValue + analytics.overview.cashBalance,
        totalPortfolioValueFormatted: formatCurrency(analytics.overview.totalCurrentValue + analytics.overview.cashBalance)
      },
      performance: {
        ...analytics.performance,
        bestPerformer: analytics.performance.bestPerformer ? {
          ...analytics.performance.bestPerformer,
          profitLossFormatted: formatCurrency(analytics.performance.bestPerformer.profitLoss)
        } : null,
        worstPerformer: analytics.performance.worstPerformer ? {
          ...analytics.performance.worstPerformer,
          profitLossFormatted: formatCurrency(analytics.performance.worstPerformer.profitLoss)
        } : null
      },
      trading: {
        ...analytics.trading,
        avgTradeSizeFormatted: formatCurrency(analytics.trading.avgTradeSize),
        totalRewardAmountFormatted: formatCurrency(analytics.trading.totalRewardAmount)
      },
      holdings: analytics.holdings.map(holding => ({
        ...holding,
        investedFormatted: formatCurrency(holding.invested),
        currentValueFormatted: formatCurrency(holding.currentValue),
        profitLossFormatted: formatCurrency(holding.profitLoss),
        averageBuyPriceFormatted: formatCurrency(holding.averageBuyPrice),
        currentPriceFormatted: formatCurrency(holding.currentPrice)
      })),
      meta: {
        currency: 'INR',
        lastUpdated: new Date().toISOString(),
        accountAge: Math.floor((new Date() - new Date(virtualMoney.createdAt)) / (1000 * 60 * 60 * 24))
      }
    };

    console.log('Portfolio analytics calculated successfully');

    res.status(200).json({
      success: true,
      data: formattedAnalytics,
      message: 'Portfolio analytics retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching portfolio analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching analytics',
      error: error.message
    });
  }
});

// Get trading performance over time
router.get('/performance-history', provideDefaultUser, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const daysNum = Math.min(parseInt(days) || 30, 365); // Max 1 year

    console.log(`Fetching ${daysNum} days of performance history for user:`, req.user.id);

    // Get virtual money account
    const virtualMoney = await VirtualMoney.findOne({ userId: req.user.id });

    if (!virtualMoney) {
      return res.status(404).json({
        success: false,
        message: 'Virtual money account not found'
      });
    }

    // Get transactions within the specified period
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysNum);

    const recentTransactions = virtualMoney.transactions
      .filter(t => new Date(t.timestamp) >= cutoffDate)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // Calculate daily performance
    const dailyPerformance = [];
    let runningBalance = 10000; // Starting balance
    let runningInvestment = 0;

    // Group transactions by date
    const transactionsByDate = {};
    recentTransactions.forEach(transaction => {
      const dateKey = new Date(transaction.timestamp).toISOString().split('T')[0];
      if (!transactionsByDate[dateKey]) {
        transactionsByDate[dateKey] = [];
      }
      transactionsByDate[dateKey].push(transaction);
    });

    // Generate daily performance data
    for (let i = 0; i < daysNum; i++) {
      const currentDate = new Date();
      currentDate.setDate(currentDate.getDate() - (daysNum - 1 - i));
      const dateKey = currentDate.toISOString().split('T')[0];

      const dayTransactions = transactionsByDate[dateKey] || [];
      
      // Process transactions for this day
      dayTransactions.forEach(transaction => {
        switch (transaction.type) {
          case 'BUY':
            runningBalance += transaction.amount; // Amount is negative for buys
            runningInvestment -= transaction.amount; // Track total invested
            break;
          case 'SELL':
            runningBalance += transaction.amount; // Amount is positive for sells
            runningInvestment -= (transaction.stockPrice * transaction.stockQuantity); // Reduce investment
            break;
          case 'LOGIN_REWARD':
          case 'DEPOSIT':
            runningBalance += transaction.amount;
            break;
        }
      });

      // Simulate portfolio value with some variation
      const portfolioVariation = (Math.random() * 0.02) - 0.01; // -1% to +1% daily variation
      const estimatedPortfolioValue = runningInvestment * (1 + portfolioVariation);
      const totalValue = runningBalance + estimatedPortfolioValue;

      dailyPerformance.push({
        date: dateKey,
        balance: parseFloat(runningBalance.toFixed(2)),
        balanceFormatted: `₹${runningBalance.toLocaleString('en-IN')}`,
        estimatedPortfolioValue: parseFloat(estimatedPortfolioValue.toFixed(2)),
        estimatedPortfolioValueFormatted: `₹${estimatedPortfolioValue.toLocaleString('en-IN')}`,
        totalValue: parseFloat(totalValue.toFixed(2)),
        totalValueFormatted: `₹${totalValue.toLocaleString('en-IN')}`,
        transactionCount: dayTransactions.length,
        profitLoss: parseFloat((totalValue - 10000).toFixed(2)),
        profitLossFormatted: `₹${(totalValue - 10000).toLocaleString('en-IN')}`
      });
    }

    // Calculate summary statistics
    const firstValue = dailyPerformance[0]?.totalValue || 10000;
    const lastValue = dailyPerformance[dailyPerformance.length - 1]?.totalValue || 10000;
    const totalReturn = lastValue - firstValue;
    const totalReturnPercent = (totalReturn / firstValue) * 100;

    const summary = {
      periodDays: daysNum,
      startValue: firstValue,
      endValue: lastValue,
      totalReturn: parseFloat(totalReturn.toFixed(2)),
      totalReturnFormatted: `₹${totalReturn.toLocaleString('en-IN')}`,
      totalReturnPercent: parseFloat(totalReturnPercent.toFixed(2)),
      avgDailyReturn: parseFloat((totalReturnPercent / daysNum).toFixed(4)),
      bestDay: dailyPerformance.reduce((best, day) => 
        day.totalValue > best.totalValue ? day : best, dailyPerformance[0]),
      worstDay: dailyPerformance.reduce((worst, day) => 
        day.totalValue < worst.totalValue ? day : worst, dailyPerformance[0])
    };

    res.status(200).json({
      success: true,
      data: {
        dailyPerformance,
        summary
      },
      meta: {
        currency: 'INR',
        period: `${daysNum} days`,
        dataPoints: dailyPerformance.length
      }
    });
  } catch (error) {
    console.error('Error fetching performance history:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching performance history',
      error: error.message
    });
  }
});

// Get sector allocation analytics
router.get('/sector-allocation', provideDefaultUser, async (req, res) => {
  try {
    console.log('Fetching sector allocation for user:', req.user.id);

    const virtualMoney = await VirtualMoney.findOne({ userId: req.user.id });

    if (!virtualMoney || !virtualMoney.portfolio.length) {
      return res.status(200).json({
        success: true,
        data: [],
        message: 'No portfolio holdings found for sector analysis'
      });
    }

    // Mock sector mapping (in real app, this would come from stock data API)
    const sectorMapping = {
      'AAPL': 'Technology',
      'GOOGL': 'Technology',
      'MSFT': 'Technology',
      'AMZN': 'Consumer Discretionary',
      'TSLA': 'Consumer Discretionary',
      'JPM': 'Financial Services',
      'JNJ': 'Healthcare',
      'PG': 'Consumer Staples',
      'V': 'Financial Services',
      'NVDA': 'Technology'
    };

    // Calculate sector allocation
    const sectorAllocation = {};
    let totalPortfolioValue = 0;

    virtualMoney.portfolio.forEach(stock => {
      const sector = sectorMapping[stock.stockSymbol] || 'Other';
      const variation = (Math.random() * 0.1) - 0.05;
      const currentPrice = stock.averageBuyPrice * (1 + variation);
      const currentValue = currentPrice * stock.quantity;
      
      totalPortfolioValue += currentValue;

      if (!sectorAllocation[sector]) {
        sectorAllocation[sector] = {
          sector,
          totalValue: 0,
          stocks: [],
          stockCount: 0
        };
      }

      sectorAllocation[sector].totalValue += currentValue;
      sectorAllocation[sector].stocks.push({
        symbol: stock.stockSymbol,
        value: currentValue,
        quantity: stock.quantity
      });
      sectorAllocation[sector].stockCount++;
    });

    // Convert to array and calculate percentages
    const sectorData = Object.values(sectorAllocation)
      .map(sector => ({
        ...sector,
        totalValue: parseFloat(sector.totalValue.toFixed(2)),
        totalValueFormatted: `₹${sector.totalValue.toLocaleString('en-IN')}`,
        percentage: parseFloat(((sector.totalValue / totalPortfolioValue) * 100).toFixed(2))
      }))
      .sort((a, b) => b.totalValue - a.totalValue);

    res.status(200).json({
      success: true,
      data: sectorData,
      meta: {
        totalPortfolioValue: parseFloat(totalPortfolioValue.toFixed(2)),
        totalPortfolioValueFormatted: `₹${totalPortfolioValue.toLocaleString('en-IN')}`,
        sectorsCount: sectorData.length,
        currency: 'INR'
      }
    });
  } catch (error) {
    console.error('Error fetching sector allocation:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching sector allocation',
      error: error.message
    });
  }
});

module.exports = router;
