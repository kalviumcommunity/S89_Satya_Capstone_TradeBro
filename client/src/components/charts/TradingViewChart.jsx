import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, CandlestickSeries, LineSeries, AreaSeries, HistogramSeries } from 'lightweight-charts';
import { motion } from 'framer-motion';
import { FiMaximize2, FiSettings, FiDownload, FiRefreshCw, FiPlay, FiPause, FiActivity } from 'react-icons/fi';
import liveChartService from '../../services/liveChartService';

const TradingViewChart = ({
  data = [],
  symbol = 'RELIANCE.NS',
  timeframe = '1D',
  chartType = 'candlestick',
  theme = 'dark',
  onRefresh,
  loading = false,
  height = 500,
  enableLiveUpdates = true
}) => {
  const chartContainerRef = useRef();
  const chartRef = useRef();
  const candlestickSeriesRef = useRef();
  const lineSeriesRef = useRef();
  const areaSeriesRef = useRef();
  const volumeSeriesRef = useRef();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showVolume, setShowVolume] = useState(true);
  const [indicators, setIndicators] = useState({
    sma: false,
    ema: false,
    rsi: false,
    macd: false
  });

  // Live chart states
  const [isLive, setIsLive] = useState(enableLiveUpdates && timeframe === '1D');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [marketOpen, setMarketOpen] = useState(false);
  const [livePrice, setLivePrice] = useState(null);
  const [priceChange, setPriceChange] = useState(null);

  // Chart configuration based on theme
  const getChartOptions = () => ({
    layout: {
      background: {
        type: ColorType.Solid,
        color: theme === 'dark' ? '#0F172A' : '#FFFFFF',
      },
      textColor: theme === 'dark' ? '#F8FAFC' : '#1E293B',
      fontSize: 12,
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    },
    grid: {
      vertLines: {
        color: theme === 'dark' ? '#1E293B' : '#E2E8F0',
        style: 1,
      },
      horzLines: {
        color: theme === 'dark' ? '#1E293B' : '#E2E8F0',
        style: 1,
      },
    },
    crosshair: {
      mode: 1,
      vertLine: {
        color: theme === 'dark' ? '#64748B' : '#475569',
        width: 1,
        style: 3,
      },
      horzLine: {
        color: theme === 'dark' ? '#64748B' : '#475569',
        width: 1,
        style: 3,
      },
    },
    priceScale: {
      borderColor: theme === 'dark' ? '#334155' : '#CBD5E1',
      textColor: theme === 'dark' ? '#94A3B8' : '#64748B',
    },
    timeScale: {
      borderColor: theme === 'dark' ? '#334155' : '#CBD5E1',
      textColor: theme === 'dark' ? '#94A3B8' : '#64748B',
      timeVisible: true,
      secondsVisible: false,
    },
    watermark: {
      visible: true,
      fontSize: 48,
      horzAlign: 'center',
      vertAlign: 'center',
      color: theme === 'dark' ? 'rgba(248, 250, 252, 0.05)' : 'rgba(30, 41, 59, 0.05)',
      text: symbol,
    },
    rightPriceScale: {
      scaleMargins: {
        top: 0.1,
        bottom: showVolume ? 0.4 : 0.1,
      },
    },
  });

  // Series options
  const getCandlestickOptions = () => ({
    upColor: '#10B981',
    downColor: '#EF4444',
    borderDownColor: '#EF4444',
    borderUpColor: '#10B981',
    wickDownColor: '#EF4444',
    wickUpColor: '#10B981',
  });

  const getLineOptions = () => ({
    color: '#3B82F6',
    lineWidth: 2,
    lineStyle: 0,
    crosshairMarkerVisible: true,
    crosshairMarkerRadius: 4,
  });

  const getAreaOptions = () => ({
    topColor: 'rgba(59, 130, 246, 0.4)',
    bottomColor: 'rgba(59, 130, 246, 0.0)',
    lineColor: '#3B82F6',
    lineWidth: 2,
  });

  const getVolumeOptions = () => ({
    color: theme === 'dark' ? '#475569' : '#94A3B8',
    priceFormat: {
      type: 'volume',
    },
    priceScaleId: 'volume',
    scaleMargins: {
      top: 0.7,
      bottom: 0,
    },
  });

  // Live update handler
  const handleLiveUpdate = (updateData) => {
    if (!chartRef.current) return;

    const { type, data: candleData, marketOpen: isMarketOpen, error } = updateData;

    if (error) {
      console.warn('Live update error:', error);
      return;
    }

    setMarketOpen(isMarketOpen);
    setLastUpdate(new Date());

    if (type === 'update' && candleData) {
      // New candle - append to series
      if (candlestickSeriesRef.current && chartType === 'candlestick') {
        candlestickSeriesRef.current.update(candleData);
        console.log('📊 Updated candlestick with new candle:', candleData);
      } else if (lineSeriesRef.current && chartType === 'line') {
        lineSeriesRef.current.update({
          time: candleData.time,
          value: candleData.close
        });
      } else if (areaSeriesRef.current && chartType === 'area') {
        areaSeriesRef.current.update({
          time: candleData.time,
          value: candleData.close
        });
      }

      // Update volume if shown
      if (showVolume && volumeSeriesRef.current && candleData.volume) {
        volumeSeriesRef.current.update({
          time: candleData.time,
          value: candleData.volume,
          color: candleData.close >= candleData.open ? '#26a69a' : '#ef5350'
        });
      }

      setLivePrice(candleData.close);

      // Show price change animation
      setPriceChange({
        direction: 'update',
        timestamp: Date.now()
      });
      setTimeout(() => setPriceChange(null), 1000);
    } else if (type === 'price_update' && candleData) {
      // Same candle, updated price - use series.update() for real-time updates
      if (candlestickSeriesRef.current && chartType === 'candlestick') {
        candlestickSeriesRef.current.update(candleData);
      }
      setLivePrice(candleData.close);
    }
  };

  // Toggle live updates
  const toggleLiveUpdates = () => {
    if (isLive) {
      liveChartService.stopLiveUpdates(symbol);
      setIsLive(false);
      console.log('⏹️ Live updates stopped');
    } else {
      liveChartService.startLiveUpdates(symbol, handleLiveUpdate, 5000);
      setIsLive(true);
      console.log('▶️ Live updates started');
    }
  };

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      ...getChartOptions(),
      width: chartContainerRef.current.clientWidth,
      height: isFullscreen ? window.innerHeight - 100 : height,
    });

    chartRef.current = chart;

    // Create main price series based on chart type (TradingView v5 API)
    try {
      if (chartType === 'candlestick') {
        candlestickSeriesRef.current = chart.addSeries(CandlestickSeries, getCandlestickOptions());
      } else if (chartType === 'line') {
        lineSeriesRef.current = chart.addSeries(LineSeries, getLineOptions());
      } else if (chartType === 'area') {
        areaSeriesRef.current = chart.addSeries(AreaSeries, getAreaOptions());
      }
    } catch (error) {
      console.error('Error creating chart series:', error);
      console.log('Available chart methods:', Object.getOwnPropertyNames(chart));
    }

    // Create volume series if enabled (TradingView v5 API)
    if (showVolume) {
      volumeSeriesRef.current = chart.addSeries(HistogramSeries, getVolumeOptions());
      chart.priceScale('volume').applyOptions({
        scaleMargins: {
          top: 0.7,
          bottom: 0,
        },
      });
    }

    // Handle resize
    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: isFullscreen ? window.innerHeight - 100 : height,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, [chartType, theme, showVolume, isFullscreen, height]);

  // Handle sidebar state changes with ResizeObserver
  useEffect(() => {
    if (!chartContainerRef.current) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (chartRef.current) {
          const { width } = entry.contentRect;
          chartRef.current.applyOptions({
            width: width,
            height: isFullscreen ? window.innerHeight - 100 : height,
          });
          chartRef.current.timeScale().fitContent();
        }
      }
    });
    
    resizeObserver.observe(chartContainerRef.current);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [isFullscreen, height]);

  // Update chart data
  useEffect(() => {
    if (!data || data.length === 0) return;

    try {
      // Format time for TradingView (expects yyyy-mm-dd or Unix timestamp)
      const formatTime = (timeStr) => {
        if (!timeStr) return new Date().toISOString().split('T')[0];

        // If it's already a Unix timestamp, return as is
        if (typeof timeStr === 'number') return timeStr;

        // If it's a date string, extract just the date part
        if (typeof timeStr === 'string') {
          const date = new Date(timeStr);
          if (isNaN(date.getTime())) {
            // If invalid date, try to parse manually
            const dateOnly = timeStr.split(' ')[0]; // Get date part before space
            return dateOnly || new Date().toISOString().split('T')[0];
          }
          return date.toISOString().split('T')[0]; // Return yyyy-mm-dd format
        }

        return new Date().toISOString().split('T')[0];
      };

      // Format data for TradingView
      const formattedData = data.map(item => ({
        time: formatTime(item.time || item.date),
        open: parseFloat(item.open),
        high: parseFloat(item.high),
        low: parseFloat(item.low),
        close: parseFloat(item.close),
        value: parseFloat(item.close), // For line/area charts
      }));

      const volumeData = data.map(item => ({
        time: formatTime(item.time || item.date),
        value: parseInt(item.volume || 0),
        color: item.close >= item.open ? '#10B981' : '#EF4444',
      }));

      // Remove duplicates and sort by time (TradingView requirement)
      const uniqueData = [];
      const seenTimes = new Set();

      formattedData
        .sort((a, b) => new Date(a.time) - new Date(b.time))
        .forEach(item => {
          if (!seenTimes.has(item.time)) {
            seenTimes.add(item.time);
            uniqueData.push(item);
          }
        });

      const uniqueVolumeData = [];
      const seenVolumeTimes = new Set();

      volumeData
        .sort((a, b) => new Date(a.time) - new Date(b.time))
        .forEach(item => {
          if (!seenVolumeTimes.has(item.time)) {
            seenVolumeTimes.add(item.time);
            uniqueVolumeData.push(item);
          }
        });

      // Update main series with unique, sorted data
      if (chartType === 'candlestick' && candlestickSeriesRef.current) {
        candlestickSeriesRef.current.setData(uniqueData);
      } else if (chartType === 'line' && lineSeriesRef.current) {
        lineSeriesRef.current.setData(uniqueData);
      } else if (chartType === 'area' && areaSeriesRef.current) {
        areaSeriesRef.current.setData(uniqueData);
      }

      // Update volume series with unique, sorted data
      if (showVolume && volumeSeriesRef.current && uniqueVolumeData.length > 0) {
        volumeSeriesRef.current.setData(uniqueVolumeData);
      }

      // Fit content
      if (chartRef.current) {
        chartRef.current.timeScale().fitContent();
      }

    } catch (error) {
      console.error('Error updating chart data:', error);
    }
  }, [data, chartType, showVolume]);

  // Start/stop live updates based on isLive state
  useEffect(() => {
    // Only enable live updates for 1D timeframe
    if (timeframe !== '1D') {
      if (isLive) {
        setIsLive(false);
        liveChartService.stopLiveUpdates(symbol);
      }
      return;
    }

    if (isLive) {
      console.log(`🔄 Starting live updates for ${symbol}`);
      // Use smart intervals (60s during market hours, longer after hours)
      liveChartService.startLiveUpdates(symbol, handleLiveUpdate);

      // Check market status
      liveChartService.checkMarketStatus(symbol.includes('.NS') ? 'NSE' : 'NASDAQ')
        .then(status => {
          setMarketOpen(status.marketOpen);
        });
    } else {
      liveChartService.stopLiveUpdates(symbol);
    }

    return () => {
      liveChartService.stopLiveUpdates(symbol);
    };
  }, [isLive, symbol, timeframe]);

  // Handle symbol or timeframe changes
  useEffect(() => {
    // Stop previous updates
    liveChartService.stopLiveUpdates(symbol);

    // Reset live state for new symbol
    if (timeframe === '1D' && enableLiveUpdates) {
      setIsLive(true);
      // Use smart intervals based on market hours
      liveChartService.startLiveUpdates(symbol, handleLiveUpdate);
    } else {
      setIsLive(false);
    }

    return () => {
      liveChartService.stopLiveUpdates(symbol);
    };
  }, [symbol, timeframe]);

  // Handle keyboard shortcuts and cleanup
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === 'Escape' && isFullscreen) {
        toggleFullscreen();
      }
      if (event.key === 'f' || event.key === 'F') {
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          toggleFullscreen();
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyPress);
    
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      // Cleanup fullscreen state on unmount
      if (isFullscreen) {
        document.body.style.overflow = '';
        document.body.classList.remove('chart-fullscreen-active');
      }
    };
  }, [isFullscreen]);

  // Toggle fullscreen
  const toggleFullscreen = () => {
    const newFullscreenState = !isFullscreen;
    setIsFullscreen(newFullscreenState);
    
    if (newFullscreenState) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
      document.body.style.top = '0';
      document.body.style.left = '0';
      document.body.classList.add('chart-fullscreen-active');
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.classList.remove('chart-fullscreen-active');
      document.documentElement.style.overflow = '';
    }
    
    setTimeout(() => {
      if (chartRef.current && chartContainerRef.current) {
        const newWidth = newFullscreenState ? window.innerWidth : chartContainerRef.current.clientWidth;
        const newHeight = newFullscreenState ? 
          window.innerHeight - chartContainerRef.current.offsetTop - 60 : height;
        chartRef.current.applyOptions({ width: newWidth, height: newHeight });
        chartRef.current.timeScale().fitContent();
      }
    }, 150);
  };

  // Toggle volume
  const toggleVolume = () => {
    setShowVolume(!showVolume);
  };

  // Export chart
  const exportChart = () => {
    if (chartRef.current) {
      const canvas = chartContainerRef.current.querySelector('canvas');
      if (canvas) {
        const link = document.createElement('a');
        link.download = `${symbol}_${timeframe}_chart.png`;
        link.href = canvas.toDataURL();
        link.click();
      }
    }
  };

  return (
    <motion.div
      className={`tradingview-chart-container ${isFullscreen ? 'fullscreen' : ''}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Chart Header */}
      <div className="chart-header">
        <div className="chart-title">
          <h3>{symbol} - {timeframe}</h3>
          <span className="chart-type">{chartType.charAt(0).toUpperCase() + chartType.slice(1)}</span>

          {/* Live price and market status */}
          {isLive && (
            <div className="live-indicators">
              {livePrice && (
                <span className={`live-price ${priceChange ? `price-${priceChange.direction}` : ''}`}>
                  ₹{livePrice.toFixed(2)}
                </span>
              )}

              <span className={`market-status ${marketOpen ? 'open' : 'closed'}`}>
                <FiActivity size={14} className="status-icon" />
                {marketOpen ? 'Market Open' : 'Market Closed'}
              </span>

              {lastUpdate && (
                <span className="last-update">
                  Updated: {lastUpdate.toLocaleTimeString()}
                </span>
              )}
            </div>
          )}
        </div>
        
        <div className="chart-controls">
          <button
            className={`chart-control-btn ${showVolume ? 'active' : ''}`}
            onClick={toggleVolume}
            title="Toggle Volume Display"
          >
            📊
          </button>
          
          <button
            className="chart-control-btn"
            onClick={onRefresh}
            disabled={loading}
            title="Refresh Chart Data"
          >
            🔄
          </button>

          {timeframe === '1D' && enableLiveUpdates && (
            <button
              onClick={toggleLiveUpdates}
              className={`chart-control-btn ${isLive ? 'live-active' : ''}`}
              title={isLive ? 'Stop Live Updates' : 'Start Live Updates'}
            >
              {isLive ? '⏸️' : '▶️'}
            </button>
          )}
          
          <button
            className="chart-control-btn"
            onClick={exportChart}
            title="Download Chart as PNG"
          >
            💾
          </button>
          
          <button
            className={`chart-control-btn ${isFullscreen ? 'fullscreen-active' : ''}`}
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Enter Fullscreen (F)'}
          >
            {isFullscreen ? '🔲' : '⛶'}
          </button>
        </div>
      </div>

      {/* Chart Container */}
      <div 
        ref={chartContainerRef}
        className="chart-wrapper"
        style={{
          position: 'relative',
          width: '100%',
          height: isFullscreen ? '100%' : `${height}px`,
          flex: isFullscreen ? '1' : 'none',
        }}
      >
        {loading && (
          <div className="chart-loading-overlay">
            <div className="loading-content">
              <FiRefreshCw size={32} className="animate-spin" />
              <p>Loading chart data...</p>
            </div>
          </div>
        )}
        
        {data.length === 0 && !loading && (
          <div className="chart-empty-overlay">
            <div className="empty-content">
              <p>No chart data available</p>
              <button onClick={onRefresh} className="btn-primary">
                <FiRefreshCw size={16} />
                Refresh
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Chart Footer */}
      <div className="chart-footer">
        <div className="chart-info">
          <span>Data Points: {data.length}</span>
          <span>•</span>
          <span>Last Updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default TradingViewChart;
