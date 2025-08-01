import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiGift, FiX, FiCalendar, FiTrendingUp, FiStar } from 'react-icons/fi';
import tradingService from '../services/tradingService';
import { usePortfolio } from '../contexts/PortfolioContext';
import './DailyRewards.css';

const DailyRewards = () => {
  const [showReward, setShowReward] = useState(false);
  const [rewardData, setRewardData] = useState(null);
  const [rewardsInfo, setRewardsInfo] = useState(null);
  const { refreshPortfolio } = usePortfolio();
  const hasCheckedReward = useRef(false);

  useEffect(() => {
    // Only check once per component mount
    if (hasCheckedReward.current) return;

    // Check for daily login reward
    const checkReward = () => {
      const reward = tradingService.checkDailyLogin();
      const info = tradingService.getDailyRewardsInfo();

      setRewardsInfo(info);

      if (reward.awarded) {
        setRewardData(reward);
        setShowReward(true);

        // Sync portfolio data across all components
        setTimeout(() => {
          tradingService.syncPortfolioData();
          refreshPortfolio();
        }, 500);
      }

      hasCheckedReward.current = true;
    };

    // Check immediately
    checkReward();
  }, []); // Empty dependency array - only run once on mount

  const handleCloseReward = () => {
    setShowReward(false);

    // Ensure portfolio is synced and refreshed when modal is closed
    tradingService.syncPortfolioData();
    refreshPortfolio();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <>
      {/* Daily Reward Modal */}
      <AnimatePresence>
        {showReward && rewardData && (
          <motion.div
            className="daily-reward-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseReward}
          >
            <motion.div
              className="daily-reward-modal"
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="close-btn" onClick={handleCloseReward}>
                <FiX />
              </button>

              <div className="reward-content">
                <motion.div
                  className="reward-icon"
                  animate={{ 
                    rotate: [0, -10, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 0.6,
                    repeat: Infinity,
                    repeatDelay: 2
                  }}
                >
                  <FiGift />
                </motion.div>

                <h2>Daily Login Bonus!</h2>
                <div className="reward-amount">
                  {formatCurrency(rewardData.amount)}
                </div>

                <div className="reward-details">
                  <div className="detail-item">
                    <FiCalendar />
                    <span>Login Streak: {rewardData.streak} days</span>
                  </div>
                  <div className="detail-item">
                    <FiTrendingUp />
                    <span>Total Rewards: {formatCurrency(rewardData.totalRewards)}</span>
                  </div>
                </div>

                <div className="reward-message">
                  <p>Keep logging in daily to maintain your streak!</p>
                  {rewardData.streak >= 7 && (
                    <div className="streak-bonus">
                      <FiStar />
                      <span>Amazing! 7+ day streak!</span>
                    </div>
                  )}
                </div>

                <button className="claim-btn" onClick={handleCloseReward}>
                  Awesome! 🎉
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Daily Rewards Info Widget (Optional - can be placed in dashboard) */}
      {rewardsInfo && (
        <div className="daily-rewards-widget">
          <div className="widget-header">
            <FiGift />
            <span>Daily Rewards</span>
          </div>
          <div className="widget-content">
            <div className="streak-info">
              <span className="streak-number">{rewardsInfo.loginStreak}</span>
              <span className="streak-label">Day Streak</span>
            </div>
            <div className="total-rewards">
              <span className="total-label">Total Earned</span>
              <span className="total-amount">{formatCurrency(rewardsInfo.totalRewards)}</span>
            </div>
            {rewardsInfo.nextRewardAvailable && (
              <div className="next-reward">
                <span>Next reward available tomorrow!</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default DailyRewards;
