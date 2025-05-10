import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiClock, FiInfo } from 'react-icons/fi';
import '../styles/FixedHeader.css';

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
    <div className="fixed-header">
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
