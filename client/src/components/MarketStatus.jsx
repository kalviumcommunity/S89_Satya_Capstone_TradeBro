import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FiClock, 
  FiActivity, 
  FiPause, 
  FiPlay,
  FiRefreshCw 
} from 'react-icons/fi';
import '../styles/components/market-status.css';

const MarketStatus = ({ 
  marketStatus, 
  lastUpdated, 
  onRefresh,
  showCountdown = true,
  className = '' 
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [timeUntilNext, setTimeUntilNext] = useState('');

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Calculate time until next market event
  useEffect(() => {
    if (!marketStatus || !showCountdown) {
      setTimeUntilNext('');
      return;
    }

    const calculateTimeUntil = () => {
      const now = new Date();
      const targetTime = marketStatus.isOpen
        ? new Date(marketStatus.nextClose)
        : new Date(marketStatus.nextOpen);

      const diff = targetTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeUntilNext('');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      let timeString = '';
      if (hours > 0) {
        timeString = `${hours}h ${minutes}m`;
      } else if (minutes > 0) {
        timeString = `${minutes}m ${seconds}s`;
      } else {
        timeString = `${seconds}s`;
      }

      setTimeUntilNext(timeString);
    };

    // Initial calculation
    calculateTimeUntil();

    // Set up interval
    const timer = setInterval(calculateTimeUntil, 1000);

    return () => clearInterval(timer);
  }, [marketStatus?.isOpen, marketStatus?.nextClose, marketStatus?.nextOpen, showCountdown]);

  // Format time for display
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Get time since last update
  const getTimeSinceUpdate = () => {
    if (!lastUpdated) return 'Never';
    
    const now = Date.now();
    const diff = now - lastUpdated;
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  if (!marketStatus) {
    return (
      <div className={`market-status loading ${className}`}>
        <div className="status-indicator">
          <FiRefreshCw className="spinning" />
        </div>
        <div className="status-text">
          <span>Loading market status...</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className={`market-status ${marketStatus.isOpen ? 'open' : 'closed'} ${className}`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Status Indicator */}
      <div className="status-indicator">
        {marketStatus.isOpen ? (
          <motion.div
            className="status-dot open"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <FiActivity />
          </motion.div>
        ) : (
          <div className="status-dot closed">
            <FiPause />
          </div>
        )}
      </div>

      {/* Status Text */}
      <div className="status-content">
        <div className="status-main">
          <span className="status-label">
            {marketStatus.isOpen ? 'Market Open' : 'Market Closed'}
          </span>
          
          {showCountdown && timeUntilNext && (
            <span className="countdown">
              {marketStatus.isOpen ? 'Closes in' : 'Opens in'} {timeUntilNext}
            </span>
          )}
        </div>

        <div className="status-details">
          <div className="market-hours">
            <FiClock size={12} />
            <span>
              {marketStatus.isOpen 
                ? `Closes at ${formatTime(marketStatus.nextClose)}`
                : `Opens at ${formatTime(marketStatus.nextOpen)}`
              }
            </span>
          </div>
          
          {lastUpdated && (
            <div className="last-update">
              <span>Updated {getTimeSinceUpdate()}</span>
              {onRefresh && (
                <button 
                  className="refresh-btn"
                  onClick={onRefresh}
                  title="Refresh data"
                >
                  <FiRefreshCw size={12} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Current IST Time */}
      <div className="current-time">
        <span className="time-label">IST</span>
        <span className="time-value">
          {currentTime.toLocaleTimeString('en-IN', {
            timeZone: 'Asia/Kolkata',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          })}
        </span>
      </div>
    </motion.div>
  );
};

export default MarketStatus;
