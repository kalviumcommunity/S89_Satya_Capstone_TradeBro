import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertCircle, FiWifi, FiWifiOff } from 'react-icons/fi';
import PageLayout from '../components/PageLayout';
import StockChart from '../components/charts/StockChart';
import SimpleChart from '../components/charts/SimpleChart';
import CandlestickChart from '../components/charts/CandlestickChart';
import ChartControls from '../components/charts/ChartControls';
import StockSelector from '../components/charts/StockSelector';
import StockInfo from '../components/charts/StockInfo';
import TradingIntegration from '../components/trading/TradingIntegration';
import chartApi from '../services/chartApi';
import { useToast } from '../context/ToastContext';
import '../styles/pages/charts.css';

const ChartsPage = () => {
  // State management
  const [selectedSymbol, setSelectedSymbol] = useState('TCS');
  const [selectedPeriod, setSelectedPeriod] = useState('1Y');
  const [chartType, setChartType] = useState('candlestick');
  const [showVolume, setShowVolume] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [stockData, setStockData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [crosshairData, setCrosshairData] = useState(null);

  const { success, error: showError, info, warning } = useToast();

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load initial data
  useEffect(() => {
    if (selectedSymbol) {
      loadChartData();
      loadStockData();
    }
  }, [selectedSymbol, selectedPeriod]);

  // Auto-refresh data every 30 seconds for intraday periods
  useEffect(() => {
    if (!selectedSymbol || !['1D', '5D'].includes(selectedPeriod)) return;

    const interval = setInterval(() => {
      if (isOnline && !isLoading) {
        loadStockData(false); // Refresh stock data without showing loading
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedSymbol, selectedPeriod, isOnline, isLoading]);

  const loadChartData = useCallback(async () => {
    if (!selectedSymbol) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log(`📊 Loading chart data for ${selectedSymbol} (${selectedPeriod})`);
      const data = await chartApi.getHistoricalData(selectedSymbol, selectedPeriod);
      
      if (data && data.length > 0) {
        setChartData(data);
        setLastUpdated(new Date());
        success(`Loaded ${data.length} data points for ${selectedSymbol}`);
      } else {
        throw new Error('No chart data available');
      }
    } catch (err) {
      console.error('Chart data error:', err);
      setError(err.message);
      setChartData([]);
      showError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [selectedSymbol, selectedPeriod, success, showError]);

  const loadStockData = useCallback(async (showLoading = true) => {
    if (!selectedSymbol) return;

    if (showLoading) setIsLoading(true);

    try {
      const data = await chartApi.getStockQuote(selectedSymbol);
      setStockData(data);
      
      if (!showLoading) {
        console.log(`🔄 Stock data refreshed for ${selectedSymbol}`);
      }
    } catch (err) {
      console.error('Stock data error:', err);
      if (showLoading) {
        setError(err.message);
        showError(err.message);
      }
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [selectedSymbol, showError]);

  const handleSymbolSelect = (symbol, name) => {
    console.log(`🎯 Selected symbol: ${symbol}`);
    setSelectedSymbol(symbol);
    setChartData([]);
    setStockData(null);
    setError(null);
    setCrosshairData(null);
  };

  const handlePeriodChange = (period) => {
    console.log(`📅 Period changed to: ${period}`);
    setSelectedPeriod(period);
    setChartData([]);
  };

  const handleChartTypeChange = (type) => {
    console.log(`📈 Chart type changed to: ${type}`);
    setChartType(type);
  };

  const handleVolumeToggle = () => {
    setShowVolume(!showVolume);
  };

  const handleRefresh = () => {
    if (!isOnline) {
      warning('Please check your internet connection');
      return;
    }

    loadChartData();
    loadStockData();
  };

  const handleExport = () => {
    info('Chart export functionality coming soon!');
  };

  const handleFullscreen = () => {
    info('Fullscreen chart view coming soon!');
  };

  const handleCrosshairMove = (param) => {
    if (param.time) {
      const dataPoint = chartData.find(d => d.time === param.time);
      if (dataPoint) {
        setCrosshairData({
          time: param.time,
          date: dataPoint.date,
          ...dataPoint
        });
      }
    } else {
      setCrosshairData(null);
    }
  };

  return (
    <PageLayout>
      <div className="charts-page">
        {/* Page Header */}
        <motion.div 
          className="charts-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="header-content">
            <h1 className="page-title">Stock Charts</h1>
            <p className="page-subtitle">Professional trading charts with real-time data</p>
          </div>
          
          <div className="header-status">
            <div className={`connection-status ${isOnline ? 'online' : 'offline'}`}>
              {isOnline ? <FiWifi size={16} /> : <FiWifiOff size={16} />}
              <span>{isOnline ? 'Online' : 'Offline'}</span>
            </div>
            
            {lastUpdated && (
              <div className="last-updated">
                Last updated: {lastUpdated.toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* Stock Selector */}
        <motion.div 
          className="selector-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <StockSelector
            selectedSymbol={selectedSymbol}
            onSymbolSelect={handleSymbolSelect}
            placeholder="Search stocks (e.g., TCS, INFY, RELIANCE)"
          />
        </motion.div>

        {/* Main Content */}
        <div className="charts-content">
          {/* Left Panel - Chart and Controls */}
          <div className="chart-panel">
            {/* Chart Controls */}
            <motion.div 
              className="controls-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <ChartControls
                selectedPeriod={selectedPeriod}
                onPeriodChange={handlePeriodChange}
                chartType={chartType}
                onChartTypeChange={handleChartTypeChange}
                showVolume={showVolume}
                onVolumeToggle={handleVolumeToggle}
                isLoading={isLoading}
                onRefresh={handleRefresh}
                onExport={handleExport}
                onFullscreen={handleFullscreen}
              />
            </motion.div>

            {/* Chart Container */}
            <motion.div 
              className="chart-container"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              {chartType === 'candlestick' ? (
                <CandlestickChart
                  data={chartData}
                  symbol={selectedSymbol}
                  height={500}
                  className="main-chart"
                />
              ) : (
                <SimpleChart
                  data={chartData}
                  symbol={selectedSymbol}
                  height={500}
                  className="main-chart"
                />
              )}
              
              {/* Crosshair Data Display */}
              <AnimatePresence>
                {crosshairData && (
                  <motion.div 
                    className="crosshair-data"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                  >
                    <div className="crosshair-item">
                      <span className="label">Date:</span>
                      <span className="value">{new Date(crosshairData.date).toLocaleDateString('en-IN')}</span>
                    </div>
                    <div className="crosshair-item">
                      <span className="label">Open:</span>
                      <span className="value">₹{crosshairData.open.toFixed(2)}</span>
                    </div>
                    <div className="crosshair-item">
                      <span className="label">High:</span>
                      <span className="value">₹{crosshairData.high.toFixed(2)}</span>
                    </div>
                    <div className="crosshair-item">
                      <span className="label">Low:</span>
                      <span className="value">₹{crosshairData.low.toFixed(2)}</span>
                    </div>
                    <div className="crosshair-item">
                      <span className="label">Close:</span>
                      <span className="value">₹{crosshairData.close.toFixed(2)}</span>
                    </div>
                    <div className="crosshair-item">
                      <span className="label">Volume:</span>
                      <span className="value">{crosshairData.volume.toLocaleString('en-IN')}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Right Panel - Stock Info and Trading */}
          <div className="info-panel">
            {/* Stock Information */}
            <motion.div 
              className="stock-info-section"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <StockInfo
                stockData={stockData}
                isLoading={isLoading}
                error={error}
              />
            </motion.div>

            {/* Trading Integration */}
            {stockData && (
              <motion.div 
                className="trading-section"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.5 }}
              >
                <TradingIntegration
                  symbol={selectedSymbol}
                  currentPrice={stockData.price}
                  stockData={stockData}
                  layout="vertical"
                  size="medium"
                  showHoldings={true}
                />
              </motion.div>
            )}
          </div>
        </div>

        {/* Error Display */}
        <AnimatePresence>
          {error && !isLoading && (
            <motion.div 
              className="error-banner"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
            >
              <FiAlertCircle size={20} />
              <span>{error}</span>
              <button onClick={handleRefresh} className="retry-btn">
                Retry
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageLayout>
  );
};

export default ChartsPage;
