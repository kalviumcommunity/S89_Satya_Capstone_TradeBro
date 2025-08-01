import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './InteractiveChart.css';

const InteractiveChart = () => {
  const [activePoint, setActivePoint] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const chartData = [
    { value: 10000, label: 'Start', color: '#3B82F6' },
    { value: 12500, label: '1 Month', color: '#10B981' },
    { value: 11800, label: '2 Months', color: '#F59E0B' },
    { value: 15200, label: '3 Months', color: '#10B981' },
    { value: 18750, label: '6 Months', color: '#10B981' },
    { value: 22300, label: '1 Year', color: '#10B981' }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isHovered) {
        setActivePoint((prev) => (prev + 1) % chartData.length);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isHovered, chartData.length]);

  return (
    <div
      className="interactive-chart"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="chart-header">
        <div className="chart-title-section">
          <h3>Portfolio Growth Simulation</h3>
        </div>
        <div className="chart-value-section">
          <div className="chart-value">
            <span className="currency">₹</span>
            <motion.span
              className="amount"
              key={activePoint}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {chartData[activePoint].value.toLocaleString()}
            </motion.span>
          </div>
          <span className="chart-period">{chartData[activePoint].label}</span>
        </div>
      </div>

      <div className="chart-container">
        <svg viewBox="0 0 400 200" className="chart-svg">
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 20" fill="none" stroke="rgba(59, 130, 246, 0.1)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Chart line */}
          <motion.path
            d="M 20 150 Q 80 120 120 130 T 200 100 T 280 80 T 360 60"
            fill="none"
            stroke="url(#chartGradient)"
            strokeWidth="3"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />

          {/* Gradient definition */}
          <defs>
            <linearGradient id="chartGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="50%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
          </defs>

          {/* Chart points */}
          {chartData.map((point, index) => (
            <motion.circle
              key={index}
              cx={20 + (index * 68)}
              cy={150 - (index * 15)}
              r={activePoint === index ? 8 : 5}
              fill={point.color}
              className="chart-point"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.2, duration: 0.3 }}
              onClick={() => setActivePoint(index)}
              style={{ cursor: 'pointer' }}
            />
          ))}

          {/* Active point indicator */}
          <motion.circle
            cx={20 + (activePoint * 68)}
            cy={150 - (activePoint * 15)}
            r="12"
            fill="none"
            stroke={chartData[activePoint].color}
            strokeWidth="2"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          />
        </svg>
      </div>

      <div className="chart-legend">
        {chartData.map((point, index) => (
          <motion.button
            key={index}
            className={`legend-item ${activePoint === index ? 'active' : ''}`}
            onClick={() => setActivePoint(index)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span 
              className="legend-dot" 
              style={{ backgroundColor: point.color }}
            />
            <span className="legend-label">{point.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default InteractiveChart;
