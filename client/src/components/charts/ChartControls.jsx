import React from 'react';
import { motion } from 'framer-motion';
import { 
  FiRefreshCw, 
  FiDownload, 
  FiBarChart2, 
  FiTrendingUp, 
  FiActivity,
  FiMaximize2,
  FiSettings
} from 'react-icons/fi';
import './ChartControls.css';

const ChartControls = ({
  selectedPeriod = '1Y',
  onPeriodChange = () => {},
  chartType = 'candlestick',
  onChartTypeChange = () => {},
  showVolume = true,
  onVolumeToggle = () => {},
  isLoading = false,
  onRefresh = () => {},
  onExport = () => {},
  onFullscreen = () => {},
  className = ''
}) => {
  const periods = [
    { value: '1D', label: '1D', tooltip: '1 Day' },
    { value: '5D', label: '5D', tooltip: '5 Days' },
    { value: '1M', label: '1M', tooltip: '1 Month' },
    { value: '3M', label: '3M', tooltip: '3 Months' },
    { value: '6M', label: '6M', tooltip: '6 Months' },
    { value: '1Y', label: '1Y', tooltip: '1 Year' },
    { value: 'MAX', label: 'MAX', tooltip: 'All Time' }
  ];

  const chartTypes = [
    { value: 'candlestick', label: 'Candlestick', icon: FiBarChart2, tooltip: 'Candlestick Chart' },
    { value: 'line', label: 'Line', icon: FiTrendingUp, tooltip: 'Line Chart' },
    { value: 'area', label: 'Area', icon: FiActivity, tooltip: 'Area Chart' }
  ];

  return (
    <div className={`chart-controls ${className}`}>
      {/* Time Period Selector */}
      <div className="control-group period-selector">
        <label className="control-label">Time Period</label>
        <div className="period-buttons">
          {periods.map((period) => (
            <motion.button
              key={period.value}
              className={`period-btn ${selectedPeriod === period.value ? 'active' : ''}`}
              onClick={() => onPeriodChange(period.value)}
              disabled={isLoading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={period.tooltip}
            >
              {period.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Chart Type Selector */}
      <div className="control-group chart-type-selector">
        <label className="control-label">Chart Type</label>
        <div className="chart-type-buttons">
          {chartTypes.map((type) => {
            const IconComponent = type.icon;
            return (
              <motion.button
                key={type.value}
                className={`chart-type-btn ${chartType === type.value ? 'active' : ''}`}
                onClick={() => onChartTypeChange(type.value)}
                disabled={isLoading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title={type.tooltip}
              >
                <IconComponent size={16} />
                <span className="btn-label">{type.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Chart Options */}
      <div className="control-group chart-options">
        <label className="control-label">Options</label>
        <div className="option-buttons">
          {/* Volume Toggle */}
          <motion.button
            className={`option-btn ${showVolume ? 'active' : ''}`}
            onClick={onVolumeToggle}
            disabled={isLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Toggle Volume Display"
          >
            <FiBarChart2 size={16} />
            <span className="btn-label">Volume</span>
          </motion.button>

          {/* Refresh Button */}
          <motion.button
            className="option-btn refresh-btn"
            onClick={onRefresh}
            disabled={isLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Refresh Data"
          >
            <FiRefreshCw 
              size={16} 
              className={isLoading ? 'spinning' : ''} 
            />
            <span className="btn-label">Refresh</span>
          </motion.button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="control-group action-buttons">
        <div className="action-btn-group">
          {/* Export Button */}
          <motion.button
            className="action-btn export-btn"
            onClick={onExport}
            disabled={isLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Export Chart"
          >
            <FiDownload size={16} />
          </motion.button>

          {/* Fullscreen Button */}
          <motion.button
            className="action-btn fullscreen-btn"
            onClick={onFullscreen}
            disabled={isLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Fullscreen View"
          >
            <FiMaximize2 size={16} />
          </motion.button>

          {/* Settings Button */}
          <motion.button
            className="action-btn settings-btn"
            disabled={isLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Chart Settings"
          >
            <FiSettings size={16} />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default ChartControls;
