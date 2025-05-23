import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiClock, FiInfo, FiSun, FiMoon, FiSettings } from 'react-icons/fi';
import NotificationCenter from './NotificationCenter';
import SquaresBackground from './SquaresBackground';
import { useTheme } from '../context/ThemeContext';
import { useNotification } from '../context/NotificationContext';
import '../styles/components/FixedHeader.kalvium.css';

/**
 * FixedHeader component with Kalvium-inspired design
 * 
 * @param {Object} props - Component props
 * @param {string} props.title - Header title
 * @param {string} props.symbol - Stock symbol
 * @param {string} props.timeRange - Current time range
 * @param {Function} props.setTimeRange - Function to set time range
 * @param {string} props.chartType - Current chart type
 * @param {Function} props.setChartType - Function to set chart type
 * @param {boolean} props.showTimeControls - Whether to show time controls
 */
const FixedHeader = ({
  title,
  symbol,
  timeRange,
  setTimeRange,
  chartType,
  setChartType,
  showTimeControls = true
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [marketStatus, setMarketStatus] = useState('');
  const { theme, toggleTheme } = useTheme();
  const { notifications } = useNotification();

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      updateMarketStatus();
    }, 1000);

    // Initial market status check
    updateMarketStatus();

    return () => {
      clearInterval(timer);
    };
  }, []);

  // Check if market is open
  const updateMarketStatus = () => {
    const now = new Date();
    const day = now.getDay();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    // Weekend check (0 = Sunday, 6 = Saturday)
    if (day === 0 || day === 6) {
      setMarketStatus('closed');
      return;
    }

    // Market hours check (9:30 AM to 4:00 PM IST for NSE/BSE)
    const isBeforeOpen = hours < 9 || (hours === 9 && minutes < 30);
    const isAfterClose = hours > 16 || (hours === 16 && minutes >= 0);

    if (isBeforeOpen || isAfterClose) {
      setMarketStatus('closed');
    } else {
      setMarketStatus('open');
    }
  };

  return (
    <div className="fixed-header-kalvium">
      <SquaresBackground color="primary" count={5} animated={false} />
      <div className="fixed-header-content">
        <div className="header-left">
          <h1 className="header-title">{title || 'Stock Details'}</h1>
          {/* Display market status next to the title */}
          <div className={`market-status ${marketStatus}`}>
            {marketStatus === 'open' ? 'Market Open' : 'Market Closed'}
          </div>
        </div>

        <div className="header-right">
          {/* Display current time */}
          <div className="time-display">
            <FiClock className="time-icon" />
            <span className="current-time">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Theme toggle */}
          <button 
            className="theme-toggle" 
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <FiMoon /> : <FiSun />}
          </button>

          {/* Notification center */}
          <NotificationCenter 
            notifications={notifications}
            onMarkAsRead={(id) => {}}
            onMarkAllAsRead={() => {}}
            onDelete={(id) => {}}
            onClearAll={() => {}}
          />

          {/* Settings button */}
          <button 
            className="settings-button" 
            onClick={() => {}}
            aria-label="Settings"
          >
            <FiSettings />
          </button>

          {showTimeControls && (
            <div className="time-controls">
              <div className="time-range-selector">
                <button
                  className={timeRange === "5min" ? "active" : ""}
                  onClick={() => setTimeRange("5min")}
                  title="5-Minute intervals"
                >
                  5M
                </button>
                <button
                  className={timeRange === "1day" ? "active" : ""}
                  onClick={() => setTimeRange("1day")}
                  title="1 Day view"
                >
                  1D
                </button>
                <button
                  className={timeRange === "1week" ? "active" : ""}
                  onClick={() => setTimeRange("1week")}
                  title="1 Week view"
                >
                  1W
                </button>
                <button
                  className={timeRange === "1month" ? "active" : ""}
                  onClick={() => setTimeRange("1month")}
                  title="1 Month view"
                >
                  1M
                </button>
                <button
                  className={timeRange === "3months" ? "active" : ""}
                  onClick={() => setTimeRange("3months")}
                  title="3 Months view"
                >
                  3M
                </button>
                <button
                  className={timeRange === "1year" ? "active" : ""}
                  onClick={() => setTimeRange("1year")}
                  title="1 Year view"
                >
                  1Y
                </button>
              </div>

              {/* Chart type selector in the header */}
              <div className="chart-type-selector">
                <button
                  className={chartType === "line" ? "active" : ""}
                  onClick={() => setChartType("line")}
                  title="Line Chart"
                >
                  Line
                </button>
                <button
                  className={chartType === "area" ? "active" : ""}
                  onClick={() => setChartType("area")}
                  title="Area Chart"
                >
                  Area
                </button>
                <button
                  className={chartType === "candle" ? "active" : ""}
                  onClick={() => setChartType("candle")}
                  title="Candlestick Chart"
                >
                  Candle
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FixedHeader;
