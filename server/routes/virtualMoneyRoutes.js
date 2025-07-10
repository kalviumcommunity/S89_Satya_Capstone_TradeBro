const express = require('express');
const router = express.Router();
const VirtualMoney = require('../models/VirtualMoney');
const User = require('../models/User');
const { provideDefaultUser } = require('../middleware/defaultUser');

/**
 * Calculate the day streak for a user (consecutive days they've claimed rewards)
 * @param {Object} virtualMoney - The virtual money document
 * @returns {Number} - The number of consecutive days
 */
async function calculateDayStreak(virtualMoney) {
  try {
    // Get all LOGIN_REWARD transactions, sorted by timestamp (newest first)
    const rewardTransactions = virtualMoney.transactions
      .filter(t => t.type === 'LOGIN_REWARD')
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (rewardTransactions.length === 0) {
      return 1; // First day
    }

    let streak = 1; // Start with today
    let lastDate = new Date(rewardTransactions[0].timestamp);
    lastDate.setHours(0, 0, 0, 0); // Normalize to start of day

    // Loop through transactions starting from the second most recent
    for (let i = 1; i < rewardTransactions.length; i++) {
      const currentDate = new Date(rewardTransactions[i].timestamp);
      currentDate.setHours(0, 0, 0, 0); // Normalize to start of day

      // Calculate days between this transaction and the previous one
      const dayDiff = Math.floor((lastDate - currentDate) / (1000 * 60 * 60 * 24));

      if (dayDiff === 1) {
        // Consecutive day
        streak++;
        lastDate = currentDate;
      } else if (dayDiff > 1) {
        // Break in the streak
        break;
      }
    }

    return streak;
  } catch (error) {
    console.error('Error calculating day streak:', error);
    return 1; // Default to 1 if there's an error
  }
}

// Get user's virtual money account
router.get('/account', provideDefaultUser, async (req, res) => {
  try {
    // Find or create virtual money account - use lean() for better performance
    let virtualMoney = await VirtualMoney.findOne({ userId: req.user.id });

    if (!virtualMoney) {
      // Get user details only if needed
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Create a new account with initial balance
      virtualMoney = new VirtualMoney({
        userId: req.user.id,
        userEmail: user.email,
        balance: 10000
      });

      // Add initial transaction
      virtualMoney.transactions.push({
        type: 'DEPOSIT',
        amount: 10000,
        description: 'Initial deposit of ₹10,000'
      });

      await virtualMoney.save();
      console.log('Created new virtual money account for user:', user.email);
    }

    // Convert to plain object for faster processing
    const virtualMoneyObj = virtualMoney.toObject ? virtualMoney.toObject() : virtualMoney;

    // Calculate portfolio values efficiently with Indian Rupee prices
    const portfolioWithProfitLoss = virtualMoneyObj.portfolio.map(stock => {
      // Use a simple calculation for current price (5% variation from buy price)
      const variation = (Math.random() * 0.1) - 0.05; // -5% to +5%
      const currentPrice = parseFloat((stock.averageBuyPrice * (1 + variation)).toFixed(2));

      // Calculate profit/loss
      const totalValue = currentPrice * stock.quantity;
      const investedValue = stock.averageBuyPrice * stock.quantity;
      const profitLoss = totalValue - investedValue;
      const profitLossPercentage = (profitLoss / investedValue) * 100;

      return {
        ...stock,
        currentPrice,
        currentPriceFormatted: `₹${currentPrice.toLocaleString('en-IN')}`,
        totalValue: parseFloat(totalValue.toFixed(2)),
        totalValueFormatted: `₹${totalValue.toLocaleString('en-IN', {maximumFractionDigits: 2})}`,
        profitLoss: parseFloat(profitLoss.toFixed(2)),
        profitLossFormatted: `₹${profitLoss.toLocaleString('en-IN', {maximumFractionDigits: 2})}`,
        profitLossPercentage: parseFloat(profitLossPercentage.toFixed(2))
      };
    });

    res.status(200).json({
      success: true,
      data: {
        balance: virtualMoneyObj.balance,
        balanceFormatted: `₹${virtualMoneyObj.balance.toLocaleString('en-IN')}`,
        lastLoginReward: virtualMoneyObj.lastLoginReward,
        portfolio: portfolioWithProfitLoss,
        currency: 'INR'
      }
    });
  } catch (error) {
    console.error('Error getting virtual money account:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get user's transaction history
router.get('/transactions', provideDefaultUser, async (req, res) => {
  try {
    const virtualMoney = await VirtualMoney.findOne({ userId: req.user.id });

    if (!virtualMoney) {
      return res.status(404).json({
        success: false,
        message: 'Virtual money account not found'
      });
    }

    // Sort transactions by timestamp (newest first)
    const transactions = [...virtualMoney.transactions].sort((a, b) =>
      new Date(b.timestamp) - new Date(a.timestamp)
    );

    res.status(200).json({
      success: true,
      data: transactions
    });
  } catch (error) {
    console.error('Error getting transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Claim daily login reward
router.post('/claim-reward', provideDefaultUser, async (req, res) => {
  try {
    // Log the request for debugging
    console.log('Claim reward request received for user:', req.user);

    // Validate user ID and email
    if (!req.user || !req.user.id) {
      console.error('Invalid user ID in request:', req.user);
      return res.status(401).json({
        success: false,
        message: 'Invalid user authentication'
      });
    }

    // Get user email from token or fetch from database
    let userEmail = req.user.email;
    let userName = req.user.username || 'User';
    let userFullName = req.user.fullName || userName;

    if (!userEmail) {
      // If email is not in the token, fetch user details
      console.log('Email not found in token, fetching user details');
      try {
        const user = await User.findById(req.user.id);
        if (user) {
          userEmail = user.email;
          userName = user.username || 'User';
          userFullName = user.fullName || userName;
        } else {
          console.error('User not found with ID:', req.user.id);
          return res.status(404).json({
            success: false,
            message: 'User not found'
          });
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
        return res.status(500).json({
          success: false,
          message: 'Error fetching user details',
          error: error.message
        });
      }
    }

    console.log('Processing request for user:', userEmail, '(', userFullName, ')');

    // Find virtual money account directly
    let virtualMoney = await VirtualMoney.findOne({ userId: req.user.id });

    // If not found by userId, try to find by email
    if (!virtualMoney && userEmail) {
      console.log('Trying to find virtual money account by email:', userEmail);
      virtualMoney = await VirtualMoney.findOne({ userEmail: userEmail });
    }

    if (!virtualMoney) {
      console.log('Virtual money account not found, creating new account');

      // Create a new account with initial balance
      virtualMoney = new VirtualMoney({
        userId: req.user.id,
        userEmail: userEmail,
        balance: 10000
      });

      // Add initial transaction with personalized message
      virtualMoney.transactions.push({
        type: 'DEPOSIT',
        amount: 10000,
        description: `Welcome ${userFullName}! Initial deposit of ₹10,000`,
        timestamp: new Date()
      });

      // Save the new account before proceeding
      try {
        await virtualMoney.save();
        console.log('Created new virtual money account for user:', userEmail);
      } catch (saveError) {
        console.error('Error saving new virtual money account:', saveError);
        return res.status(500).json({
          success: false,
          message: 'Failed to create virtual money account',
          error: saveError.message
        });
      }
    }

    // Process login reward
    const now = new Date();
    console.log('Processing login reward for user:', virtualMoney.userEmail);

    try {
      // Check if user already received a reward in the last 24 hours
      if (virtualMoney.lastLoginReward) {
        const lastRewardTime = new Date(virtualMoney.lastLoginReward).getTime();
        const currentTime = now.getTime();
        const hoursSinceLastReward = (currentTime - lastRewardTime) / (1000 * 60 * 60);

        console.log('Hours since last reward:', hoursSinceLastReward);

        if (hoursSinceLastReward < 24) {
          // Calculate time remaining until next reward
          const minutesRemaining = Math.ceil((24 - hoursSinceLastReward) * 60);
          const hoursRemaining = Math.floor(minutesRemaining / 60);
          const mins = minutesRemaining % 60;

          console.log('Reward already claimed. Time remaining:', hoursRemaining, 'hours,', mins, 'minutes');

          // Personalized message for already claimed reward
          return res.status(400).json({
            success: false,
            message: `Hi ${userFullName}, you've already claimed your daily reward.`,
            timeRemaining: {
              hours: hoursRemaining,
              minutes: mins,
              totalMinutes: minutesRemaining
            },
            nextRewardTime: new Date(lastRewardTime + (24 * 60 * 60 * 1000)).toISOString()
          });
        }
      }

      // Add reward
      const rewardAmount = 1; // ₹1 per day
      virtualMoney.balance += rewardAmount;
      virtualMoney.lastLoginReward = now;

      console.log('Adding reward of', rewardAmount, 'to balance. New balance:', virtualMoney.balance);

      // Generate a personalized reward message
      const rewardMessages = [
        `Daily login reward of ₹${rewardAmount.toLocaleString('en-IN')}`,
        `Welcome back ${userName}! Here's your daily ₹${rewardAmount.toLocaleString('en-IN')}`,
        `Thanks for logging in today ${userName}! You earned ₹${rewardAmount.toLocaleString('en-IN')}`,
        `Your daily reward of ₹${rewardAmount.toLocaleString('en-IN')} has been added to your account`,
        `Consistency pays off! Here's your ₹${rewardAmount.toLocaleString('en-IN')} reward`
      ];

      // Select a random message
      const randomMessage = rewardMessages[Math.floor(Math.random() * rewardMessages.length)];

      // Add transaction record with personalized message
      virtualMoney.transactions.push({
        type: 'LOGIN_REWARD',
        amount: rewardAmount,
        description: randomMessage,
        timestamp: now
      });

      // Save the updated account
      try {
        await virtualMoney.save();
        console.log('Daily reward claimed successfully for user:', virtualMoney.userEmail);

        // Get the day streak (how many consecutive days they've claimed)
        const dayStreak = await calculateDayStreak(virtualMoney);

        // Personalized success message
        res.status(200).json({
          success: true,
          message: `Congratulations ${userFullName}! You've claimed your daily reward.`,
          data: {
            balance: virtualMoney.balance,
            balanceFormatted: `₹${virtualMoney.balance.toLocaleString('en-IN')}`,
            rewardAmount: rewardAmount,
            rewardAmountFormatted: `₹${rewardAmount.toLocaleString('en-IN')}`,
            currency: 'INR',
            dayStreak: dayStreak,
            userName: userName,
            userFullName: userFullName
          }
        });
      } catch (saveError) {
        console.error('Error saving virtual money after claiming reward:', saveError);
        return res.status(500).json({
          success: false,
          message: 'Failed to save reward',
          error: saveError.message
        });
      }
    } catch (rewardError) {
      console.error('Error processing reward:', rewardError);
      return res.status(500).json({
        success: false,
        message: 'Error processing reward',
        error: rewardError.message
      });
    }
  } catch (error) {
    console.error('Error claiming reward:', error);

    // Check if headers have already been sent
    if (res.headersSent) {
      console.error('Headers already sent, cannot send error response');
      return;
    }

    // Send detailed error response
    res.status(500).json({
      success: false,
      message: 'Server error while claiming reward',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Public reward status endpoint (no authentication required)
router.get('/reward-status-public', async (req, res) => {
  try {
    // This is a public endpoint that doesn't require authentication
    // It returns mock data for testing purposes

    const now = new Date();
    // Mock last reward time (12 hours ago)
    const lastReward = new Date(now.getTime() - (12 * 60 * 60 * 1000));
    const hoursSinceLastReward = 12;

    // Calculate time remaining
    const minutesRemaining = Math.ceil((24 - hoursSinceLastReward) * 60);
    const hoursRemaining = Math.floor(minutesRemaining / 60);
    const mins = minutesRemaining % 60;

    return res.status(200).json({
      success: true,
      canClaim: false,
      message: `You can claim your next reward in ${hoursRemaining}h ${mins}m`,
      timeRemaining: {
        hours: hoursRemaining,
        minutes: mins,
        totalMinutes: minutesRemaining
      },
      balance: 10000,
      balanceFormatted: '₹10,000'
    });
  } catch (error) {
    console.error('Error in public reward status endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Check reward status (authenticated version)
router.get('/reward-status', provideDefaultUser, async (req, res) => {
  try {
    // Get user details
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Try to find by userId first (faster)
    let virtualMoney = await VirtualMoney.findOne({ userId: req.user.id });

    // If not found, try by email as fallback
    if (!virtualMoney) {
      virtualMoney = await VirtualMoney.findOne({ userEmail: user.email });
    }

    if (!virtualMoney) {
      // Create a new account with initial balance
      virtualMoney = new VirtualMoney({
        userId: req.user.id,
        userEmail: user.email,
        balance: 10000
      });

      // Add initial transaction
      virtualMoney.transactions.push({
        type: 'DEPOSIT',
        amount: 10000,
        description: 'Initial deposit of ₹10,000'
      });

      // Save the new account
      await virtualMoney.save();

      console.log('Created new virtual money account for user:', user.email);

      return res.status(200).json({
        success: true,
        canClaim: true,
        message: 'No previous claims found. You can claim your reward!',
        balance: virtualMoney.balance,
        balanceFormatted: `₹${virtualMoney.balance.toLocaleString('en-IN')}`
      });
    }

    // Check if user can claim reward
    if (!virtualMoney.lastLoginReward) {
      return res.status(200).json({
        success: true,
        canClaim: true,
        message: 'You can claim your daily reward!',
        balance: virtualMoney.balance,
        balanceFormatted: `₹${virtualMoney.balance.toLocaleString('en-IN')}`
      });
    }

    // Calculate time since last reward
    const now = new Date().getTime();
    const lastReward = new Date(virtualMoney.lastLoginReward).getTime();
    const hoursSinceLastReward = (now - lastReward) / (1000 * 60 * 60);

    if (hoursSinceLastReward >= 24) {
      return res.status(200).json({
        success: true,
        canClaim: true,
        message: 'You can claim your daily reward!',
        balance: virtualMoney.balance,
        balanceFormatted: `₹${virtualMoney.balance.toLocaleString('en-IN')}`
      });
    } else {
      // Calculate time remaining
      const minutesRemaining = Math.ceil((24 - hoursSinceLastReward) * 60);
      const hoursRemaining = Math.floor(minutesRemaining / 60);
      const mins = minutesRemaining % 60;

      return res.status(200).json({
        success: true,
        canClaim: false,
        message: `You can claim your next reward in ${hoursRemaining}h ${mins}m`,
        timeRemaining: {
          hours: hoursRemaining,
          minutes: mins,
          totalMinutes: minutesRemaining
        },
        balance: virtualMoney.balance,
        balanceFormatted: `₹${virtualMoney.balance.toLocaleString('en-IN')}`
      });
    }
  } catch (error) {
    console.error('Error checking reward status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Buy stock
router.post('/buy', provideDefaultUser, async (req, res) => {
  try {
    const { stockSymbol, quantity, price } = req.body;

    // Validate input
    if (!stockSymbol || !quantity || !price) {
      return res.status(400).json({
        success: false,
        message: 'Stock symbol, quantity, and price are required'
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be greater than 0'
      });
    }

    if (price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be greater than 0'
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

    let virtualMoney = await VirtualMoney.findOne({ userId: req.user.id });

    if (!virtualMoney) {
      // Create a new account with initial balance
      virtualMoney = new VirtualMoney({
        userId: req.user.id,
        userEmail: user.email,
        balance: 10000
      });

      // Add initial transaction
      virtualMoney.transactions.push({
        type: 'DEPOSIT',
        amount: 10000,
        description: 'Initial deposit of ₹10,000'
      });

      await virtualMoney.save();
      console.log('Created new virtual money account for user:', user.email);
    }

    const result = await virtualMoney.buyStock(stockSymbol, quantity, price);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          balance: virtualMoney.balance,
          portfolio: virtualMoney.portfolio
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error buying stock:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Sell stock
router.post('/sell', provideDefaultUser, async (req, res) => {
  try {
    const { stockSymbol, quantity, price } = req.body;

    // Validate input
    if (!stockSymbol || !quantity || !price) {
      return res.status(400).json({
        success: false,
        message: 'Stock symbol, quantity, and price are required'
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be greater than 0'
      });
    }

    if (price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be greater than 0'
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

    // Try to find by userId first (faster)
    let virtualMoney = await VirtualMoney.findOne({ userId: req.user.id });

    // If not found, try by email as fallback
    if (!virtualMoney) {
      virtualMoney = await VirtualMoney.findOne({ userEmail: user.email });
    }

    if (!virtualMoney) {
      return res.status(404).json({
        success: false,
        message: 'Virtual money account not found'
      });
    }

    const result = await virtualMoney.sellStock(stockSymbol, quantity, price);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          balance: virtualMoney.balance,
          portfolio: virtualMoney.portfolio
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error selling stock:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get portfolio
router.get('/portfolio', provideDefaultUser, async (req, res) => {
  try {
    // Get user details
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Try to find by userId first (faster)
    let virtualMoney = await VirtualMoney.findOne({ userId: req.user.id });

    // If not found, try by email as fallback
    if (!virtualMoney) {
      virtualMoney = await VirtualMoney.findOne({ userEmail: user.email });
    }

    if (!virtualMoney) {
      return res.status(404).json({
        success: false,
        message: 'Virtual money account not found'
      });
    }

    res.status(200).json({
      success: true,
      data: virtualMoney.portfolio
    });
  } catch (error) {
    console.error('Error getting portfolio:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
