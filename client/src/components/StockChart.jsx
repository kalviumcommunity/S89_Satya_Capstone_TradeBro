import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  BarChart,
  Bar
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { FiClock, FiCalendar, FiTrendingUp, FiTrendingDown, FiRefreshCw, FiBarChart2, FiActivity } from 'react-icons/fi';
import axios from 'axios';
import { ThemeContext } from '../context/ThemeContext';
import API_ENDPOINTS from '../config/apiConfig';
import { createDummyChartData, formatPrice, formatLargeNumber } from '../utils/chartUtils';
import EnhancedLoading from './EnhancedLoading';
import '../styles/components/StockChart.css';

const StockChart = ({ symbol, chartType = 'area', timeRange = '1day', height = 350 }) => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const { theme } = useContext(ThemeContext);

  const isDarkMode = theme === 'dark';

  // Colors based on our unified color palette
  const colors = {
    areaGradientStart: isDarkMode ? `var(--chart-area-gradient-start)` : `var(--chart-area-gradient-start)`,
    areaGradientEnd: isDarkMode ? `var(--chart-area-gradient-end)` : `var(--chart-area-gradient-end)`,
    lineColor: isDarkMode ? `var(--chart-line)` : `var(--chart-line)`,
    gridColor: isDarkMode ? `var(--chart-grid)` : `var(--chart-grid)`,
    textColor: isDarkMode ? `var(--text-primary)` : `var(--text-primary)`,
    positiveColor: `var(--chart-positive)`, // Green for gains
    negativeColor: `var(--chart-negative)`, // Red for losses
    tooltipBackground: isDarkMode ? `rgba(34, 34, 59, 0.9)` : `rgba(255, 255, 255, 0.9)`,
    tooltipBorder: isDarkMode ? `var(--card-border)` : `var(--card-border)`,
    tooltipText: isDarkMode ? `var(--text-primary)` : `var(--text-primary)`,
  };

  // Time range options
  const timeRangeOptions = [
    { label: '1D', value: '1day' },
    { label: '1W', value: '1week' },
    { label: '1M', value: '1month' },
    { label: '3M', value: '3months' },
    { label: '1Y', value: '1year' },
  ];

  // Chart type options
  const chartTypeOptions = [
    { label: 'Area', value: 'area', icon: <FiActivity /> },
    { label: 'Line', value: 'line', icon: <FiTrendingUp /> },
    { label: 'Bar', value: 'bar', icon: <FiBarChart2 /> },
  ];

  // State for chart type
  const [selectedChartType, setSelectedChartType] = useState(chartType);

  // Fetch chart data
  useEffect(() => {
    const fetchChartData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Since we don't have a specific chart endpoint, we'll use the historical price endpoint
        // or just use dummy data directly
        let chartData;

        // Try to use historical price endpoint if available
        if (API_ENDPOINTS.PROXY.HISTORICAL_PRICE) {
          try {
            const response = await axios.get(API_ENDPOINTS.PROXY.HISTORICAL_PRICE(symbol));

            if (response.data && response.data.historical) {
              // Process the historical data based on the selected time range
              const historicalData = response.data.historical;
              const filteredData = filterDataByTimeRange(historicalData, selectedTimeRange);

              chartData = filteredData.map(item => ({
                timestamp: new Date(item.date).getTime(),
                open: item.open,
                high: item.high,
                low: item.low,
                close: item.close,
                volume: item.volume
              }));
            } else {
              throw new Error('Invalid historical data format');
            }
          } catch (historyError) {
            console.log('Using dummy data due to history error:', historyError);
            chartData = createDummyChartData(selectedTimeRange);
          }
        } else {
          // If no historical endpoint, use dummy data
          chartData = createDummyChartData(selectedTimeRange);
        }

        setChartData(chartData);
      } catch (error) {
        console.error('Error fetching chart data:', error);
        setError('Failed to load chart data');

        // Use dummy data as fallback
        const dummyData = createDummyChartData(selectedTimeRange);
        setChartData(dummyData);
      } finally {
        setLoading(false);
      }
    };

    // Helper function to filter data by time range
    const filterDataByTimeRange = (data, timeRange) => {
      const now = new Date();
      let cutoffDate;

      switch (timeRange) {
        case '1day':
          cutoffDate = new Date(now.setDate(now.getDate() - 1));
          break;
        case '1week':
          cutoffDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case '1month':
          cutoffDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case '3months':
          cutoffDate = new Date(now.setMonth(now.getMonth() - 3));
          break;
        case '1year':
          cutoffDate = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
        default:
          cutoffDate = new Date(now.setDate(now.getDate() - 30)); // Default to 30 days
      }

      return data.filter(item => new Date(item.date) >= cutoffDate).reverse();
    };

    fetchChartData();
  }, [symbol, selectedTimeRange]);

  // Format date for tooltip
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isPositive = data.close >= data.open;
      const priceChangePercent = ((data.close - data.open) / data.open * 100).toFixed(2);
      const priceChangeIcon = isPositive ? <FiTrendingUp style={{ marginRight: '4px' }} /> : <FiTrendingDown style={{ marginRight: '4px' }} />;

      return (
        <div className="custom-tooltip">
          <p className="tooltip-time">
            {formatDate(label)}
          </p>
          <p className="tooltip-price">
            {formatPrice(data.close)}
          </p>

          <div className="tooltip-change" data-positive={isPositive.toString()}>
            {priceChangeIcon}
            <span>{isPositive ? '+' : ''}{priceChangePercent}%</span>
          </div>

          <p className="tooltip-open">
            Open <span>{formatPrice(data.open)}</span>
          </p>
          <p className="tooltip-high">
            High <span>{formatPrice(data.high)}</span>
          </p>
          <p className="tooltip-low">
            Low <span>{formatPrice(data.low)}</span>
          </p>
          <p className="tooltip-volume">
            Volume <span>{formatLargeNumber(data.volume)}</span>
          </p>
        </div>
      );
    }

    return null;
  };

  // Render chart based on type
  const renderChart = () => {
    if (loading) {
      return (
        <div className="chart-loading">
          <EnhancedLoading
            type="gradient"
            size="medium"
            text="Loading chart data..."
            color="#55828b"
          />
        </div>
      );
    }

    if (error) {
      return (
        <div className="chart-error">
          <p>{error}</p>
          <motion.button
            className="retry-button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setLoading(true);
              setSelectedTimeRange(selectedTimeRange); // This will trigger a refetch
            }}
          >
            <FiRefreshCw /> Retry
          </motion.button>
        </div>
      );
    }

    switch (selectedChartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#55828b" />
                  <stop offset="100%" stopColor="#cb997e" />
                </linearGradient>
                <filter id="lineShadow" x="-10%" y="-10%" width="120%" height="130%">
                  <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#55828b" floodOpacity="0.3" />
                </filter>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.gridColor} />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(timestamp) => {
                  const date = new Date(timestamp);
                  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }}
                stroke={colors.textColor}
                tick={{ fill: colors.textColor }}
              />
              <YAxis
                domain={['auto', 'auto']}
                stroke={colors.textColor}
                tick={{ fill: colors.textColor }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="close"
                stroke="url(#lineGradient)"
                strokeWidth={3}
                dot={false}
                activeDot={{
                  r: 8,
                  fill: "#55828b",
                  stroke: "white",
                  strokeWidth: 2
                }}
                animationDuration={1800}
                style={{ filter: 'url(#lineShadow)' }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#55828b" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#cb997e" stopOpacity={0.7} />
                </linearGradient>
                <filter id="barShadow" x="-10%" y="-10%" width="120%" height="130%">
                  <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#55828b" floodOpacity="0.2" />
                </filter>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.gridColor} />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(timestamp) => {
                  const date = new Date(timestamp);
                  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }}
                stroke={colors.textColor}
                tick={{ fill: colors.textColor }}
              />
              <YAxis
                domain={['auto', 'auto']}
                stroke={colors.textColor}
                tick={{ fill: colors.textColor }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="volume"
                fill="url(#barGradient)"
                radius={[6, 6, 0, 0]}
                animationDuration={1800}
                style={{ filter: 'url(#barShadow)' }}
                barSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'area':
      default:
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colors.areaGradientStart} stopOpacity={0.9} />
                  <stop offset="50%" stopColor={colors.areaGradientStart} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={colors.areaGradientEnd} stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#55828b" />
                  <stop offset="100%" stopColor="#cb997e" />
                </linearGradient>
                <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
                  <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#55828b" floodOpacity="0.3" />
                </filter>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.gridColor} />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(timestamp) => {
                  const date = new Date(timestamp);
                  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }}
                stroke={colors.textColor}
                tick={{ fill: colors.textColor }}
              />
              <YAxis
                domain={['auto', 'auto']}
                stroke={colors.textColor}
                tick={{ fill: colors.textColor }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="close"
                stroke="url(#strokeGradient)"
                fillOpacity={1}
                fill="url(#colorGradient)"
                strokeWidth={2.5}
                activeDot={{
                  r: 8,
                  fill: "#55828b",
                  stroke: "white",
                  strokeWidth: 2
                }}
                animationDuration={1800}
              />
            </AreaChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        className="stock-chart-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.6, ease: [0.25, 0.8, 0.25, 1] }}
        key={`${symbol}-${selectedTimeRange}-${selectedChartType}`}
      >
        <div className="chart-header">
          <h3 className="chart-title">
            <span className="symbol-text">{symbol}</span> Price Chart
          </h3>
          <div className="chart-controls">
            <div className="chart-type-selector">
              {chartTypeOptions.map((option) => (
                <motion.button
                  key={option.value}
                  className={selectedChartType === option.value ? 'active' : ''}
                  onClick={() => setSelectedChartType(option.value)}
                  whileHover={{ y: -2, boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }}
                  whileTap={{ y: 0, scale: 0.95 }}
                  aria-label={`Show ${option.label} chart type`}
                >
                  {option.icon}
                </motion.button>
              ))}
            </div>
            <div className="time-range-selector">
              {timeRangeOptions.map((option) => (
                <motion.button
                  key={option.value}
                  className={selectedTimeRange === option.value ? 'active' : ''}
                  onClick={() => setSelectedTimeRange(option.value)}
                  whileHover={{ y: -2, boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }}
                  whileTap={{ y: 0, scale: 0.95 }}
                  aria-label={`Show ${option.label} chart data`}
                >
                  {option.label}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
        <div className="chart-container">
          {renderChart()}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

StockChart.propTypes = {
  symbol: PropTypes.string.isRequired,
  chartType: PropTypes.oneOf(['line', 'area', 'bar']),
  timeRange: PropTypes.string,
  height: PropTypes.number
};

export default StockChart;
