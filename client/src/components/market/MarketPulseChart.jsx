import React, { useState } from 'react';
import { motion } from 'framer-motion';
import './MarketPulseChart.css';

const MarketPulseChart = () => {
  const [activeIndex, setActiveIndex] = useState(null);
  const [activeTimeframe, setActiveTimeframe] = useState('1D');
  
  // Mock data for different timeframes
  const chartData = {
    '1D': [
      { time: '9:15', value: 19500 },
      { time: '10:00', value: 19550 },
      { time: '11:00', value: 19525 },
      { time: '12:00', value: 19600 },
      { time: '13:00', value: 19580 },
      { time: '14:00', value: 19620 },
      { time: '15:00', value: 19650 },
      { time: '15:30', value: 19675 }
    ],
    '1W': [
      { time: 'Mon', value: 19400 },
      { time: 'Tue', value: 19450 },
      { time: 'Wed', value: 19500 },
      { time: 'Thu', value: 19550 },
      { time: 'Fri', value: 19675 }
    ],
    '1M': [
      { time: 'Week 1', value: 19200 },
      { time: 'Week 2', value: 19350 },
      { time: 'Week 3', value: 19450 },
      { time: 'Week 4', value: 19675 }
    ]
  };
  
  const timeframes = ['1D', '1W', '1M'];
  
  const activeData = chartData[activeTimeframe];
  const minValue = Math.min(...activeData.map(d => d.value));
  const maxValue = Math.max(...activeData.map(d => d.value));
  const range = maxValue - minValue;
  
  // Normalize values to fit in the chart height
  const normalizeValue = (value) => {
    return 100 - ((value - minValue) / range) * 80;
  };
  
  // Generate SVG path for the chart line
  const generatePath = () => {
    return activeData.map((point, index) => {
      const x = (index / (activeData.length - 1)) * 100;
      const y = normalizeValue(point.value);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };
  
  // Generate SVG path for the area under the chart
  const generateAreaPath = () => {
    const linePath = activeData.map((point, index) => {
      const x = (index / (activeData.length - 1)) * 100;
      const y = normalizeValue(point.value);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
    
    const lastX = 100;
    const lastY = normalizeValue(activeData[activeData.length - 1].value);
    const firstX = 0;
    const firstY = normalizeValue(activeData[0].value);
    
    return `${linePath} L ${lastX} 100 L ${firstX} 100 Z`;
  };
  
  // Calculate if the chart is trending up
  const isTrendingUp = activeData[0].value < activeData[activeData.length - 1].value;
  
  return (
    <div className="market-pulse-chart">
      <div className="chart-header">
        <h3>NIFTY 50 Market Pulse</h3>
        <div className="chart-value">
          <span className="current-value">₹19,675.25</span>
          <span className={`change-value ${isTrendingUp ? 'positive' : 'negative'}`}>
            {isTrendingUp ? '+175.25 (+0.90%)' : '-75.25 (-0.38%)'}
          </span>
        </div>
      </div>
      
      <div className="chart-container">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="chart-svg">
          {/* Area under the line */}
          <motion.path
            d={generateAreaPath()}
            className={`chart-area ${isTrendingUp ? 'positive' : 'negative'}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.2 }}
            transition={{ duration: 1 }}
          />
          
          {/* Chart line */}
          <motion.path
            d={generatePath()}
            fill="none"
            className={`chart-line ${isTrendingUp ? 'positive' : 'negative'}`}
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />
          
          {/* Data points */}
          {activeData.map((point, index) => {
            const x = (index / (activeData.length - 1)) * 100;
            const y = normalizeValue(point.value);
            
            return (
              <g key={index}>
                <motion.circle
                  cx={x}
                  cy={y}
                  r={activeIndex === index ? 4 : 3}
                  className={`chart-point ${isTrendingUp ? 'positive' : 'negative'} ${activeIndex === index ? 'active' : ''}`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                />
                
                {activeIndex === index && (
                  <g className="tooltip">
                    <rect
                      x={x - 30}
                      y={y - 30}
                      width="60"
                      height="20"
                      rx="4"
                      className="tooltip-bg"
                    />
                    <text
                      x={x}
                      y={y - 18}
                      textAnchor="middle"
                      className="tooltip-text"
                      fontSize="8"
                    >
                      {point.time}: ₹{point.value}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      
      <div className="chart-timeframes">
        {timeframes.map(timeframe => (
          <button
            key={timeframe}
            className={`timeframe-btn ${activeTimeframe === timeframe ? 'active' : ''}`}
            onClick={() => setActiveTimeframe(timeframe)}
          >
            {timeframe}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MarketPulseChart;
