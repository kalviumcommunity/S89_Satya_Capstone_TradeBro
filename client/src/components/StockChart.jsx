import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  FiTrendingUp,
  FiTrendingDown,
  FiRefreshCw,
  FiMaximize2,
  FiSettings,
  FiBarChart2,
  FiActivity,
  FiLoader
} from 'react-icons/fi';
import { fetchHistoricalChart, fetchStockQuote, generateMockChartData, calculateSMA } from '../api/fmp';
import '../styles/components/StockChart.css';

// Simple SVG-based chart component as fallback - memoized to prevent unnecessary re-renders
const SimpleChart = React.memo(({ data, height, width }) => {
  if (!data || data.length === 0) return null;

  const maxPrice = Math.max(...data.map(d => d.close));
  const minPrice = Math.min(...data.map(d => d.close));
  const priceRange = maxPrice - minPrice;

  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * (width - 40) + 20;
    const y = height - 40 - ((item.close - minPrice) / priceRange) * (height - 80);
    return `${x},${y}`;
  }).join(' ');

  const currentPrice = data[data.length - 1]?.close || 0;
  const previousPrice = data[data.length - 2]?.close || 0;
  const isPositive = currentPrice >= previousPrice;

  return (
    <div className="simple-chart" style={{ height: `${height}px`, position: 'relative' }}>
      <svg width={width} height={height} style={{ position: 'absolute', top: 0, left: 0 }}>
        <defs>
          <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={isPositive ? "#10B981" : "#EF4444"} stopOpacity="0.3"/>
            <stop offset="100%" stopColor={isPositive ? "#10B981" : "#EF4444"} stopOpacity="0.05"/>
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
          <line
            key={ratio}
            x1="20"
            y1={40 + ratio * (height - 80)}
            x2={width - 20}
            y2={40 + ratio * (height - 80)}
            stroke="#E5E7EB"
            strokeWidth="1"
            opacity="0.5"
          />
        ))}

        {/* Price line */}
        <polyline
          points={points}
          fill="none"
          stroke={isPositive ? "#10B981" : "#EF4444"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Fill area */}
        <polygon
          points={`20,${height-40} ${points} ${width-20},${height-40}`}
          fill="url(#chartGradient)"
        />

        {/* Current price indicator */}
        {data.length > 0 && (
          <circle
            cx={(data.length - 1) / (data.length - 1) * (width - 40) + 20}
            cy={height - 40 - ((currentPrice - minPrice) / priceRange) * (height - 80)}
            r="4"
            fill={isPositive ? "#10B981" : "#EF4444"}
            stroke="white"
            strokeWidth="2"
          />
        )}
      </svg>

      {/* Price labels */}
      <div className="chart-labels">
        <div className="price-label max" style={{ top: '40px', right: '10px' }}>
          ₹{maxPrice.toFixed(2)}
        </div>
        <div className="price-label min" style={{ bottom: '40px', right: '10px' }}>
          ₹{minPrice.toFixed(2)}
        </div>
      </div>
    </div>
  );
});

const StockChart = ({
  symbol,
  chartType = 'line',
  height = 400,
  showControls = true,
  showVolume = false, // Simplified for now
  showSMA = false,
  smaLength = 14,
  onPriceChange,
  className = ''
}) => {
  const chartContainerRef = useRef();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [priceChange, setPriceChange] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [selectedChartType, setSelectedChartType] = useState(chartType);
  const [timeInterval, setTimeInterval] = useState('1min');
  const [isPolling, setIsPolling] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [containerWidth, setContainerWidth] = useState(800);

  // Use ref to store the latest onPriceChange callback to prevent infinite loops
  const onPriceChangeRef = useRef(onPriceChange);
  useEffect(() => {
    onPriceChangeRef.current = onPriceChange;
  }, [onPriceChange]);

  // Use ref to track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Handle container resize
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const resizeObserver = new ResizeObserver(entries => {
      if (entries.length === 0 || !isMountedRef.current) return;
      const { width } = entries[0].contentRect;
      setContainerWidth(width);
    });

    resizeObserver.observe(chartContainerRef.current);
    setContainerWidth(chartContainerRef.current.clientWidth);

    return () => resizeObserver.disconnect();
  }, []);

  // Fetch and update chart data - stable function that doesn't change on every render
  const updateChartData = useCallback(async () => {
    if (!symbol || !isMountedRef.current) return;

    try {
      // Batch state updates to prevent multiple re-renders
      setLoading(true);
      setError(null);

      // Use mock data directly for faster loading and better reliability
      console.log(`Generating mock data for ${symbol}`);
      const data = generateMockChartData(symbol, 100);

      if (!isMountedRef.current) return; // Check if component is still mounted

      if (!data || data.length === 0) {
        console.warn('No data generated, this should not happen');
        if (isMountedRef.current) {
          setError('Failed to generate chart data');
          setLoading(false);
        }
        return;
      }

      // Batch all state updates together
      const latestData = data[data.length - 1];
      const updates = {
        chartData: data,
        currentPrice: latestData?.close || null,
        priceChange: null,
        lastUpdate: new Date(),
        loading: false
      };

      // Calculate price change if we have enough data
      if (latestData && data.length > 1) {
        const previousData = data[data.length - 2];
        const change = latestData.close - previousData.close;
        const changePercent = (change / previousData.close) * 100;
        updates.priceChange = { change, changePercent };

        // Call onPriceChange callback if provided
        if (onPriceChangeRef.current) {
          try {
            onPriceChangeRef.current({
              price: latestData.close,
              change,
              changePercent,
            });
          } catch (callbackError) {
            console.warn('Error in onPriceChange callback:', callbackError);
          }
        }
      }

      // Apply all updates at once if component is still mounted
      if (isMountedRef.current) {
        setChartData(updates.chartData);
        setCurrentPrice(updates.currentPrice);
        setPriceChange(updates.priceChange);
        setLastUpdate(updates.lastUpdate);
        setLoading(false);
      }

    } catch (err) {
      console.error('Error updating chart data:', err);
      if (isMountedRef.current) {
        setError(`Failed to load chart data for ${symbol}: ${err.message}`);
        setLoading(false);
      }
    }
  }, [symbol, timeInterval]); // Only depend on symbol and timeInterval

  // Polling for real-time updates - use ref to access latest updateChartData
  const updateChartDataRef = useRef(updateChartData);
  useEffect(() => {
    updateChartDataRef.current = updateChartData;
  }, [updateChartData]);

  useEffect(() => {
    if (!symbol || !isPolling || !isMountedRef.current) return;

    const interval = setInterval(() => {
      if (isMountedRef.current) {
        updateChartDataRef.current();
      }
    }, 15000); // Update every 15 seconds for real-time data

    return () => clearInterval(interval);
  }, [symbol, isPolling]); // Stable dependencies

  // Update data when symbol or settings change
  useEffect(() => {
    if (symbol && isMountedRef.current) {
      updateChartData();
    }
  }, [symbol, timeInterval, updateChartData]); // Include updateChartData since it's stable now

  // Memoize static data to prevent unnecessary re-renders
  const chartTypes = useMemo(() => [
    { value: 'line', label: 'Line', icon: <FiActivity /> },
    { value: 'candlestick', label: 'Candlestick', icon: <FiBarChart2 /> },
  ], []);

  const timeIntervals = useMemo(() => [
    { value: '1min', label: '1m' },
    { value: '5min', label: '5m' },
    { value: '15min', label: '15m' },
    { value: '30min', label: '30m' },
    { value: '1hour', label: '1h' },
  ], []);

  // Memoize motion props to prevent recreation
  const motionProps = useMemo(() => ({
    className: `stock-chart-container ${className}`,
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  }), [className]);

  // Use useCallback for event handlers to prevent unnecessary re-renders
  const handleRefresh = useCallback(() => {
    if (isMountedRef.current) {
      updateChartData();
    }
  }, [updateChartData]);

  const togglePolling = useCallback(() => {
    setIsPolling(prev => !prev);
  }, []);

  const handleChartTypeChange = useCallback((e) => {
    setSelectedChartType(e.target.value);
  }, []);

  const handleTimeIntervalChange = useCallback((e) => {
    setTimeInterval(e.target.value);
  }, []);

  return (
    <motion.div {...motionProps}>
      {showControls && (
        <div className="chart-header">
          <div className="chart-info">
            <h3 className="chart-title">{symbol}</h3>
            {currentPrice && (
              <div className="price-info">
                <span className="current-price">₹{currentPrice.toFixed(2)}</span>
                {priceChange && (
                  <span className={`price-change ${priceChange.change >= 0 ? 'positive' : 'negative'}`}>
                    {priceChange.change >= 0 ? <FiTrendingUp /> : <FiTrendingDown />}
                    {priceChange.change >= 0 ? '+' : ''}{priceChange.change.toFixed(2)} 
                    ({priceChange.change >= 0 ? '+' : ''}{priceChange.changePercent.toFixed(2)}%)
                  </span>
                )}
              </div>
            )}
            {lastUpdate && (
              <div className="last-update">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </div>
            )}
          </div>

          <div className="chart-controls">
            <div className="control-group">
              <label>Chart Type:</label>
              <select
                value={selectedChartType}
                onChange={handleChartTypeChange}
                className="chart-select"
              >
                {chartTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="control-group">
              <label>Interval:</label>
              <select
                value={timeInterval}
                onChange={handleTimeIntervalChange}
                className="chart-select"
              >
                {timeIntervals.map(interval => (
                  <option key={interval.value} value={interval.value}>
                    {interval.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="action-buttons">
              <button 
                onClick={handleRefresh} 
                className="control-btn"
                disabled={loading}
                title="Refresh data"
              >
                <FiRefreshCw className={loading ? 'spinning' : ''} />
              </button>
              
              <button 
                onClick={togglePolling} 
                className={`control-btn ${isPolling ? 'active' : ''}`}
                title={isPolling ? 'Stop real-time updates' : 'Start real-time updates'}
              >
                {isPolling ? <FiLoader className="spinning" /> : <FiActivity />}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="chart-content">
        {loading && (
          <motion.div
            className="chart-loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <FiLoader />
            </motion.div>
            <span>Loading chart data...</span>
          </motion.div>
        )}
        
        {error && (
          <div className="chart-error">
            <span>Error: {error}</span>
            <button onClick={handleRefresh} className="retry-btn">
              Retry
            </button>
          </div>
        )}
        
        <div
          ref={chartContainerRef}
          className="chart-canvas"
          style={{ height: `${height}px` }}
        >
          {!loading && !error && chartData.length > 0 && (
            <SimpleChart
              data={chartData}
              height={height}
              width={containerWidth}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default StockChart;
