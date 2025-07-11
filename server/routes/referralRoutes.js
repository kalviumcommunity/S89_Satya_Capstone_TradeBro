const express = require('express');
const router = express.Router();
const VirtualMoney = require('../models/VirtualMoney');
const User = require('../models/User');
const { provideDefaultUser } = require('../middleware/defaultUser');
const crypto = require('crypto');

// Referral bonus amounts
const REFERRAL_BONUS = {
  REFERRER: 500, // ₹500 for the person who refers
  REFEREE: 250   // ₹250 for the person who gets referred
};

/**
 * Generate unique referral code for user
 * @param {String} username - User's username
 * @param {String} userId - User's ID
 * @returns {String} - Unique referral code
 */
function generateReferralCode(username, userId) {
  try {
    // Create a hash from username and userId for uniqueness
    const hash = crypto.createHash('md5').update(username + userId).digest('hex');
    // Take first 8 characters and make uppercase
    const code = hash.substring(0, 8).toUpperCase();
    return `TB${code}`; // TB prefix for TradeBro
  } catch (error) {
    console.error('Error generating referral code:', error);
    // Fallback to random code
    return `TB${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  }
}

/**
 * Add referral transaction to virtual money account
 * @param {String} userId - User ID
 * @param {Number} amount - Bonus amount
 * @param {String} type - Type of referral bonus
 * @param {String} referralCode - Referral code used
 * @returns {Object} - Transaction result
 */
async function addReferralBonus(userId, amount, type, referralCode) {
  try {
    const virtualMoney = await VirtualMoney.findOne({ userId });
    
    if (!virtualMoney) {
      throw new Error('Virtual money account not found');
    }

    // Add bonus to balance
    virtualMoney.balance += amount;

    // Add transaction record
    const transaction = {
      type: 'REFERRAL_BONUS',
      amount: amount,
      description: `${type} referral bonus - Code: ${referralCode}`,
      timestamp: new Date()
    };

    virtualMoney.transactions.push(transaction);
    await virtualMoney.save();

    return { success: true, newBalance: virtualMoney.balance };
  } catch (error) {
    console.error('Error adding referral bonus:', error);
    throw error;
  }
}

// Get user's referral information
router.get('/info', provideDefaultUser, async (req, res) => {
  try {
    console.log('Fetching referral info for user:', req.user.id);

    // Get user details
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate or get existing referral code
    let referralCode = user.referralCode;
    if (!referralCode) {
      referralCode = generateReferralCode(user.username, user._id.toString());
      
      // Save referral code to user document
      user.referralCode = referralCode;
      await user.save();
      console.log(`Generated new referral code for user ${user.email}: ${referralCode}`);
    }

    // Count successful referrals
    const referredUsers = await User.find({ referredBy: referralCode });
    const totalReferrals = referredUsers.length;

    // Calculate total referral earnings
    const virtualMoney = await VirtualMoney.findOne({ userId: req.user.id });
    const referralTransactions = virtualMoney ? 
      virtualMoney.transactions.filter(t => t.type === 'REFERRAL_BONUS') : [];
    
    const totalEarnings = referralTransactions.reduce((sum, t) => sum + t.amount, 0);

    // Get recent referrals (last 10)
    const recentReferrals = referredUsers
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10)
      .map(referredUser => ({
        username: referredUser.username,
        fullName: referredUser.fullName || referredUser.username,
        joinedAt: referredUser.createdAt,
        bonusEarned: REFERRAL_BONUS.REFERRER
      }));

    const responseData = {
      referralCode,
      totalReferrals,
      totalEarnings,
      totalEarningsFormatted: `₹${totalEarnings.toLocaleString('en-IN')}`,
      bonusAmounts: {
        referrer: REFERRAL_BONUS.REFERRER,
        referrerFormatted: `₹${REFERRAL_BONUS.REFERRER.toLocaleString('en-IN')}`,
        referee: REFERRAL_BONUS.REFEREE,
        refereeFormatted: `₹${REFERRAL_BONUS.REFEREE.toLocaleString('en-IN')}`
      },
      recentReferrals,
      referralLink: `https://tradebro.com/signup?ref=${referralCode}`,
      shareMessage: `Join TradeBro with my referral code ${referralCode} and get ₹${REFERRAL_BONUS.REFEREE} bonus! I'll get ₹${REFERRAL_BONUS.REFERRER} too. Start your virtual trading journey: https://tradebro.com/signup?ref=${referralCode}`
    };

    res.status(200).json({
      success: true,
      data: responseData,
      message: 'Referral information retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching referral info:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching referral information',
      error: error.message
    });
  }
});

// Apply referral code (for new users during signup)
router.post('/apply', provideDefaultUser, async (req, res) => {
  try {
    const { referralCode } = req.body;

    console.log(`Applying referral code ${referralCode} for user:`, req.user.id);

    // Validate input
    if (!referralCode || typeof referralCode !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Valid referral code is required'
      });
    }

    const cleanReferralCode = referralCode.trim().toUpperCase();

    // Get current user
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user already used a referral code
    if (currentUser.referredBy) {
      return res.status(400).json({
        success: false,
        message: 'You have already used a referral code'
      });
    }

    // Find the referrer
    const referrer = await User.findOne({ referralCode: cleanReferralCode });
    if (!referrer) {
      return res.status(404).json({
        success: false,
        message: 'Invalid referral code'
      });
    }

    // Check if user is trying to refer themselves
    if (referrer._id.toString() === currentUser._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot use your own referral code'
      });
    }

    // Check if account is new enough (within 7 days of creation)
    const accountAge = (new Date() - new Date(currentUser.createdAt)) / (1000 * 60 * 60 * 24);
    if (accountAge > 7) {
      return res.status(400).json({
        success: false,
        message: 'Referral codes can only be applied within 7 days of account creation'
      });
    }

    try {
      // Add bonus to referee (current user)
      await addReferralBonus(
        currentUser._id, 
        REFERRAL_BONUS.REFEREE, 
        'New user', 
        cleanReferralCode
      );

      // Add bonus to referrer
      await addReferralBonus(
        referrer._id, 
        REFERRAL_BONUS.REFERRER, 
        'Successful referral', 
        cleanReferralCode
      );

      // Update current user's referredBy field
      currentUser.referredBy = cleanReferralCode;
      await currentUser.save();

      console.log(`Referral bonus applied successfully: ${currentUser.email} referred by ${referrer.email}`);

      res.status(200).json({
        success: true,
        message: `Referral code applied successfully! You received ₹${REFERRAL_BONUS.REFEREE} bonus.`,
        data: {
          bonusReceived: REFERRAL_BONUS.REFEREE,
          bonusReceivedFormatted: `₹${REFERRAL_BONUS.REFEREE.toLocaleString('en-IN')}`,
          referrerUsername: referrer.username,
          referralCode: cleanReferralCode
        }
      });
    } catch (bonusError) {
      console.error('Error applying referral bonuses:', bonusError);
      res.status(500).json({
        success: false,
        message: 'Error applying referral bonus',
        error: bonusError.message
      });
    }
  } catch (error) {
    console.error('Error applying referral code:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while applying referral code',
      error: error.message
    });
  }
});

// Get referral leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const limitNum = Math.min(parseInt(limit) || 20, 50); // Max 50 users

    console.log(`Fetching referral leaderboard with limit: ${limitNum}`);

    // Get all users with referral codes and count their referrals
    const usersWithReferrals = await User.aggregate([
      {
        $match: { referralCode: { $exists: true, $ne: null } }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'referralCode',
          foreignField: 'referredBy',
          as: 'referrals'
        }
      },
      {
        $addFields: {
          referralCount: { $size: '$referrals' }
        }
      },
      {
        $match: { referralCount: { $gt: 0 } }
      },
      {
        $sort: { referralCount: -1 }
      },
      {
        $limit: limitNum
      },
      {
        $project: {
          username: 1,
          fullName: 1,
          profileImage: 1,
          referralCode: 1,
          referralCount: 1,
          createdAt: 1
        }
      }
    ]);

    // Calculate earnings for each user
    const leaderboardData = usersWithReferrals.map((user, index) => ({
      rank: index + 1,
      username: user.username,
      fullName: user.fullName || user.username,
      profileImage: user.profileImage || null,
      referralCode: user.referralCode,
      totalReferrals: user.referralCount,
      totalEarnings: user.referralCount * REFERRAL_BONUS.REFERRER,
      totalEarningsFormatted: `₹${(user.referralCount * REFERRAL_BONUS.REFERRER).toLocaleString('en-IN')}`,
      joinedAt: user.createdAt
    }));

    res.status(200).json({
      success: true,
      data: leaderboardData,
      meta: {
        totalUsers: leaderboardData.length,
        bonusPerReferral: REFERRAL_BONUS.REFERRER,
        bonusPerReferralFormatted: `₹${REFERRAL_BONUS.REFERRER.toLocaleString('en-IN')}`,
        currency: 'INR'
      }
    });
  } catch (error) {
    console.error('Error fetching referral leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching referral leaderboard',
      error: error.message
    });
  }
});

// Validate referral code (for frontend validation)
router.get('/validate/:code', async (req, res) => {
  try {
    const { code } = req.params;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Referral code is required'
      });
    }

    const cleanCode = code.trim().toUpperCase();

    // Find user with this referral code
    const referrer = await User.findOne({ referralCode: cleanCode });

    if (!referrer) {
      return res.status(404).json({
        success: false,
        message: 'Invalid referral code',
        valid: false
      });
    }

    res.status(200).json({
      success: true,
      message: 'Valid referral code',
      valid: true,
      data: {
        referrerUsername: referrer.username,
        referrerName: referrer.fullName || referrer.username,
        bonusAmount: REFERRAL_BONUS.REFEREE,
        bonusAmountFormatted: `₹${REFERRAL_BONUS.REFEREE.toLocaleString('en-IN')}`
      }
    });
  } catch (error) {
    console.error('Error validating referral code:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while validating referral code',
      error: error.message
    });
  }
});

module.exports = router;
