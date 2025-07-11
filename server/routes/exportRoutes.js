const express = require('express');
const router = express.Router();
const VirtualMoney = require('../models/VirtualMoney');
const User = require('../models/User');
const { provideDefaultUser } = require('../middleware/defaultUser');

/**
 * Generate CSV content from transaction data
 * @param {Array} transactions - Array of transaction objects
 * @param {Object} userInfo - User information
 * @returns {String} - CSV formatted string
 */
function generateTransactionCSV(transactions, userInfo) {
  try {
    // CSV headers
    const headers = [
      'Date',
      'Time',
      'Type',
      'Amount (₹)',
      'Stock Symbol',
      'Stock Quantity',
      'Stock Price (₹)',
      'Description',
      'Balance After Transaction (₹)'
    ];

    let csvContent = headers.join(',') + '\n';

    // Sort transactions by timestamp (oldest first for CSV)
    const sortedTransactions = [...transactions].sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );

    let runningBalance = 0;

    sortedTransactions.forEach((transaction, index) => {
      const date = new Date(transaction.timestamp);
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
      const timeStr = date.toTimeString().split(' ')[0]; // HH:MM:SS

      // Calculate running balance
      if (transaction.type === 'DEPOSIT' || transaction.type === 'LOGIN_REWARD' || transaction.type === 'SELL') {
        runningBalance += transaction.amount;
      } else if (transaction.type === 'BUY') {
        runningBalance += transaction.amount; // Amount is negative for buys
      }

      // Escape description for CSV (handle commas and quotes)
      const escapedDescription = transaction.description ? 
        `"${transaction.description.replace(/"/g, '""')}"` : '';

      const row = [
        dateStr,
        timeStr,
        transaction.type,
        transaction.amount.toFixed(2),
        transaction.stockSymbol || '',
        transaction.stockQuantity || '',
        transaction.stockPrice ? transaction.stockPrice.toFixed(2) : '',
        escapedDescription,
        runningBalance.toFixed(2)
      ];

      csvContent += row.join(',') + '\n';
    });

    return csvContent;
  } catch (error) {
    console.error('Error generating CSV:', error);
    throw new Error('Failed to generate CSV content');
  }
}

// Export user transactions to CSV
router.get('/transactions/csv', provideDefaultUser, async (req, res) => {
  try {
    console.log('Exporting transactions to CSV for user:', req.user.id);

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

    // Fallback to email search
    if (!virtualMoney) {
      virtualMoney = await VirtualMoney.findOne({ userEmail: user.email });
    }

    if (!virtualMoney) {
      return res.status(404).json({
        success: false,
        message: 'No transaction history found'
      });
    }

    // Check if user has any transactions
    if (!virtualMoney.transactions || virtualMoney.transactions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No transactions found to export'
      });
    }

    // Generate CSV content
    const userInfo = {
      username: user.username,
      fullName: user.fullName || user.username,
      email: user.email,
      currentBalance: virtualMoney.balance
    };

    const csvContent = generateTransactionCSV(virtualMoney.transactions, userInfo);

    // Add user info header to CSV
    const userInfoHeader = [
      `# TradeBro Transaction Export`,
      `# User: ${userInfo.fullName} (${userInfo.username})`,
      `# Email: ${userInfo.email}`,
      `# Export Date: ${new Date().toISOString()}`,
      `# Current Balance: ₹${userInfo.currentBalance.toLocaleString('en-IN')}`,
      `# Total Transactions: ${virtualMoney.transactions.length}`,
      `#`,
      ``
    ].join('\n') + '\n';

    const finalCSV = userInfoHeader + csvContent;

    // Set response headers for file download
    const filename = `tradebro_transactions_${user.username}_${new Date().toISOString().split('T')[0]}.csv`;
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache');

    console.log(`CSV export successful for user: ${user.email}, ${virtualMoney.transactions.length} transactions`);

    res.status(200).send(finalCSV);
  } catch (error) {
    console.error('Error exporting transactions to CSV:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while exporting transactions',
      error: error.message
    });
  }
});

// Export portfolio to CSV
router.get('/portfolio/csv', provideDefaultUser, async (req, res) => {
  try {
    console.log('Exporting portfolio to CSV for user:', req.user.id);

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
      virtualMoney = await VirtualMoney.findOne({ userEmail: user.email });
    }

    if (!virtualMoney) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found'
      });
    }

    // Check if user has any portfolio holdings
    if (!virtualMoney.portfolio || virtualMoney.portfolio.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No portfolio holdings found to export'
      });
    }

    // Generate portfolio CSV
    const headers = [
      'Stock Symbol',
      'Quantity',
      'Average Buy Price (₹)',
      'Current Price (₹)',
      'Total Invested (₹)',
      'Current Value (₹)',
      'Profit/Loss (₹)',
      'Profit/Loss (%)',
      'Weight in Portfolio (%)'
    ];

    let csvContent = headers.join(',') + '\n';

    let totalPortfolioValue = 0;
    let totalInvested = 0;

    // Calculate current values and totals
    const portfolioWithValues = virtualMoney.portfolio.map(stock => {
      // Simulate current price with variation
      const variation = (Math.random() * 0.1) - 0.05; // -5% to +5%
      const currentPrice = stock.averageBuyPrice * (1 + variation);
      const invested = stock.averageBuyPrice * stock.quantity;
      const currentValue = currentPrice * stock.quantity;
      const profitLoss = currentValue - invested;
      const profitLossPercent = (profitLoss / invested) * 100;

      totalPortfolioValue += currentValue;
      totalInvested += invested;

      return {
        ...stock,
        currentPrice: parseFloat(currentPrice.toFixed(2)),
        invested: parseFloat(invested.toFixed(2)),
        currentValue: parseFloat(currentValue.toFixed(2)),
        profitLoss: parseFloat(profitLoss.toFixed(2)),
        profitLossPercent: parseFloat(profitLossPercent.toFixed(2))
      };
    });

    // Add portfolio data to CSV
    portfolioWithValues.forEach(stock => {
      const weightInPortfolio = (stock.currentValue / totalPortfolioValue) * 100;
      
      const row = [
        stock.stockSymbol,
        stock.quantity,
        stock.averageBuyPrice.toFixed(2),
        stock.currentPrice.toFixed(2),
        stock.invested.toFixed(2),
        stock.currentValue.toFixed(2),
        stock.profitLoss.toFixed(2),
        stock.profitLossPercent.toFixed(2),
        weightInPortfolio.toFixed(2)
      ];

      csvContent += row.join(',') + '\n';
    });

    // Add summary row
    const totalProfitLoss = totalPortfolioValue - totalInvested;
    const totalProfitLossPercent = (totalProfitLoss / totalInvested) * 100;

    csvContent += '\n';
    csvContent += 'PORTFOLIO SUMMARY\n';
    csvContent += `Total Invested,₹${totalInvested.toFixed(2)}\n`;
    csvContent += `Current Value,₹${totalPortfolioValue.toFixed(2)}\n`;
    csvContent += `Total Profit/Loss,₹${totalProfitLoss.toFixed(2)}\n`;
    csvContent += `Total Profit/Loss %,${totalProfitLossPercent.toFixed(2)}%\n`;
    csvContent += `Cash Balance,₹${virtualMoney.balance.toFixed(2)}\n`;
    csvContent += `Total Account Value,₹${(totalPortfolioValue + virtualMoney.balance).toFixed(2)}\n`;

    // Add user info header
    const userInfoHeader = [
      `# TradeBro Portfolio Export`,
      `# User: ${user.fullName || user.username} (${user.username})`,
      `# Email: ${user.email}`,
      `# Export Date: ${new Date().toISOString()}`,
      `# Holdings: ${virtualMoney.portfolio.length} stocks`,
      `#`,
      ``
    ].join('\n') + '\n';

    const finalCSV = userInfoHeader + csvContent;

    // Set response headers for file download
    const filename = `tradebro_portfolio_${user.username}_${new Date().toISOString().split('T')[0]}.csv`;
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache');

    console.log(`Portfolio CSV export successful for user: ${user.email}, ${virtualMoney.portfolio.length} holdings`);

    res.status(200).send(finalCSV);
  } catch (error) {
    console.error('Error exporting portfolio to CSV:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while exporting portfolio',
      error: error.message
    });
  }
});

// Export complete account summary to CSV
router.get('/account-summary/csv', provideDefaultUser, async (req, res) => {
  try {
    console.log('Exporting account summary to CSV for user:', req.user.id);

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
      virtualMoney = await VirtualMoney.findOne({ userEmail: user.email });
    }

    if (!virtualMoney) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    // Calculate account statistics
    const totalTransactions = virtualMoney.transactions.length;
    const buyTransactions = virtualMoney.transactions.filter(t => t.type === 'BUY').length;
    const sellTransactions = virtualMoney.transactions.filter(t => t.type === 'SELL').length;
    const rewardTransactions = virtualMoney.transactions.filter(t => t.type === 'LOGIN_REWARD').length;
    const totalRewards = virtualMoney.transactions
      .filter(t => t.type === 'LOGIN_REWARD')
      .reduce((sum, t) => sum + t.amount, 0);

    // Portfolio statistics
    let totalInvested = 0;
    let totalCurrentValue = 0;
    virtualMoney.portfolio.forEach(stock => {
      const variation = (Math.random() * 0.1) - 0.05;
      const currentPrice = stock.averageBuyPrice * (1 + variation);
      totalInvested += stock.averageBuyPrice * stock.quantity;
      totalCurrentValue += currentPrice * stock.quantity;
    });

    const totalProfitLoss = totalCurrentValue - totalInvested;
    const totalAccountValue = virtualMoney.balance + totalCurrentValue;

    // Generate summary CSV
    let csvContent = 'TradeBro Account Summary\n\n';
    
    csvContent += 'ACCOUNT INFORMATION\n';
    csvContent += `Username,${user.username}\n`;
    csvContent += `Full Name,${user.fullName || user.username}\n`;
    csvContent += `Email,${user.email}\n`;
    csvContent += `Trading Experience,${user.tradingExperience || 'Beginner'}\n`;
    csvContent += `Account Created,${new Date(virtualMoney.createdAt).toISOString().split('T')[0]}\n`;
    csvContent += `Export Date,${new Date().toISOString().split('T')[0]}\n\n`;

    csvContent += 'FINANCIAL SUMMARY\n';
    csvContent += `Cash Balance,₹${virtualMoney.balance.toFixed(2)}\n`;
    csvContent += `Portfolio Value,₹${totalCurrentValue.toFixed(2)}\n`;
    csvContent += `Total Account Value,₹${totalAccountValue.toFixed(2)}\n`;
    csvContent += `Total Invested,₹${totalInvested.toFixed(2)}\n`;
    csvContent += `Total Profit/Loss,₹${totalProfitLoss.toFixed(2)}\n`;
    csvContent += `Portfolio Return %,${totalInvested > 0 ? ((totalProfitLoss / totalInvested) * 100).toFixed(2) : 0}%\n\n`;

    csvContent += 'TRADING STATISTICS\n';
    csvContent += `Total Transactions,${totalTransactions}\n`;
    csvContent += `Buy Orders,${buyTransactions}\n`;
    csvContent += `Sell Orders,${sellTransactions}\n`;
    csvContent += `Portfolio Holdings,${virtualMoney.portfolio.length}\n`;
    csvContent += `Login Rewards Claimed,${rewardTransactions}\n`;
    csvContent += `Total Rewards Earned,₹${totalRewards.toFixed(2)}\n`;

    // Set response headers for file download
    const filename = `tradebro_account_summary_${user.username}_${new Date().toISOString().split('T')[0]}.csv`;
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache');

    console.log(`Account summary CSV export successful for user: ${user.email}`);

    res.status(200).send(csvContent);
  } catch (error) {
    console.error('Error exporting account summary to CSV:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while exporting account summary',
      error: error.message
    });
  }
});

module.exports = router;
