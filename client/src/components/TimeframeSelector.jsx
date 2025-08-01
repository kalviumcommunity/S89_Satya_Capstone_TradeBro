import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FiClock,
  FiCalendar,
  FiTrendingUp,
  FiBarChart2
} from 'react-icons/fi';

/**
 * Timeframe Selector Component
 * Professional timeframe selection for charts and analysis
 */
const TimeframeSelector = ({
  selectedTimeframe = '1D',
  onTimeframeChange,
  className = ''
}) => {
  const [activeTimeframe, setActiveTimeframe] = useState(selectedTimeframe);

  const timeframes = [
    { value: '1m', label: '1M', description: '1 Minute', icon: FiClock, type: 'intraday' },
    { value: '5m', label: '5M', description: '5 Minutes', icon: FiClock, type: 'intraday' },
    { value: '15m', label: '15M', description: '15 Minutes', icon: FiClock, type: 'intraday' },
    { value: '1h', label: '1H', description: '1 Hour', icon: FiClock, type: 'intraday' },
    { value: '1D', label: '1D', description: '1 Day', icon: FiCalendar, type: 'daily' },
    { value: '1W', label: '1W', description: '1 Week', icon: FiCalendar, type: 'weekly' },
    { value: '1M', label: '1M', description: '1 Month', icon: FiCalendar, type: 'monthly' },
    { value: '3M', label: '3M', description: '3 Months', icon: FiTrendingUp, type: 'quarterly' },
    { value: '6M', label: '6M', description: '6 Months', icon: FiTrendingUp, type: 'quarterly' },
    { value: '1Y', label: '1Y', description: '1 Year', icon: FiBarChart2, type: 'yearly' },
    { value: '5Y', label: '5Y', description: '5 Years', icon: FiBarChart2, type: 'yearly' }
  ];

  const handleTimeframeSelect = (timeframe) => {
    setActiveTimeframe(timeframe.value);
    onTimeframeChange?.(timeframe);
  };

  const getTimeframeColor = (type) => {
    switch (type) {
      case 'intraday':
        return '#EF4444'; // Red for intraday
      case 'daily':
        return '#10B981'; // Green for daily
      case 'weekly':
        return '#3B82F6'; // Blue for weekly
      case 'monthly':
        return '#8B5CF6'; // Purple for monthly
      case 'quarterly':
        return '#F59E0B'; // Orange for quarterly
      case 'yearly':
        return '#6B7280'; // Gray for yearly
      default:
        return '#6B7280';
    }
  };

  // Group timeframes by type
  const groupedTimeframes = timeframes.reduce((groups, timeframe) => {
    const type = timeframe.type;
    if (!groups[type]) groups[type] = [];
    groups[type].push(timeframe);
    return groups;
  }, {});

  const typeLabels = {
    intraday: 'Intraday',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    yearly: 'Long Term'
  };

  return (
    <div className={`timeframe-selector ${className}`}>
      <div className="timeframe-header">
        <div className="timeframe-title">
          <FiClock className="timeframe-icon" />
          <span>Timeframe</span>
        </div>
        <div className="selected-timeframe-info">
          {timeframes.find(tf => tf.value === activeTimeframe)?.description}
        </div>
      </div>

      <div className="timeframe-groups">
        {Object.entries(groupedTimeframes).map(([type, typeTimeframes]) => (
          <div key={type} className="timeframe-group">
            <div className="timeframe-group-label">
              {typeLabels[type]}
            </div>
            <div className="timeframe-buttons">
              {typeTimeframes.map((timeframe, index) => {
                const Icon = timeframe.icon;
                const isActive = activeTimeframe === timeframe.value;
                const color = getTimeframeColor(timeframe.type);

                return (
                  <motion.button
                    key={timeframe.value}
                    className={`timeframe-btn ${isActive ? 'active' : ''}`}
                    onClick={() => handleTimeframeSelect(timeframe)}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{ '--timeframe-color': color }}
                  >
                    <Icon className="timeframe-btn-icon" size={14} />
                    <span className="timeframe-btn-label">{timeframe.label}</span>
                    {isActive && (
                      <motion.div
                        className="active-indicator"
                        layoutId="activeTimeframe"
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Presets */}
      <div className="timeframe-presets">
        <div className="preset-label">Quick Select:</div>
        <div className="preset-buttons">
          {['1D', '1W', '1M', '1Y'].map((preset) => (
            <button
              key={preset}
              className={`preset-btn ${activeTimeframe === preset ? 'active' : ''}`}
              onClick={() => {
                const timeframe = timeframes.find(tf => tf.value === preset);
                if (timeframe) handleTimeframeSelect(timeframe);
              }}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Market Hours Info */}
      <div className="market-hours-info">
        <div className="market-hours-title">
          <FiClock size={12} />
          Market Hours
        </div>
        <div className="market-hours-details">
          <div className="market-session">
            <span className="session-label">Regular:</span>
            <span className="session-time">9:15 AM - 3:30 PM IST</span>
          </div>
          <div className="market-session">
            <span className="session-label">Pre-market:</span>
            <span className="session-time">9:00 AM - 9:15 AM IST</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeframeSelector;
