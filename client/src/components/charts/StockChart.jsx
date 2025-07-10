import React, { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import './StockChart.css';

const StockChart = ({ 
  data = [], 
  symbol = '', 
  height = 400, 
  showVolume = true,
  chartType = 'candlestick', // 'candlestick', 'line', 'area'
  onCrosshairMove = null,
  className = ''
}) => {
  const chartContainerRef = useRef();
  const chartRef = useRef();
  const mainSeriesRef = useRef();
  const volumeSeriesRef = useRef();
  const { darkMode } = useTheme();
  const [isLoading, setIsLoading] = useState(true);

  // Theme-based colors
  const getChartColors = () => {
    const isDark = darkMode || false; // Fallback to false if darkMode is undefined

    return {
      backgroundColor: isDark ? '#0f172a' : '#ffffff',
      textColor: isDark ? '#f8fafc' : '#1e293b',
      gridColor: isDark ? '#1e293b' : '#f1f5f9',
      borderColor: isDark ? '#334155' : '#e2e8f0',
      upColor: '#10b981', // Green for bullish
      downColor: '#ef4444', // Red for bearish
      volumeUpColor: isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)',
      volumeDownColor: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)',
      lineColor: isDark ? '#3b82f6' : '#2563eb',
      areaTopColor: isDark ? 'rgba(59, 130, 246, 0.4)' : 'rgba(37, 99, 235, 0.3)',
      areaBottomColor: isDark ? 'rgba(59, 130, 246, 0.0)' : 'rgba(37, 99, 235, 0.0)'
    };
  };

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    try {
      const colors = getChartColors();

      // Create chart with theme-based styling
      const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: colors.backgroundColor },
        textColor: colors.textColor,
        fontSize: 12,
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
      },
      grid: {
        vertLines: { color: colors.gridColor, style: 1, visible: true },
        horzLines: { color: colors.gridColor, style: 1, visible: true }
      },
      crosshair: {
        mode: 1, // Normal crosshair mode
        vertLine: {
          color: colors.textColor,
          width: 1,
          style: 3, // Dashed line
          visible: true,
          labelVisible: true
        },
        horzLine: {
          color: colors.textColor,
          width: 1,
          style: 3,
          visible: true,
          labelVisible: true
        }
      },
      rightPriceScale: {
        borderColor: colors.borderColor,
        textColor: colors.textColor,
        scaleMargins: { top: 0.1, bottom: showVolume ? 0.3 : 0.1 }
      },
      timeScale: {
        borderColor: colors.borderColor,
        textColor: colors.textColor,
        timeVisible: true,
        secondsVisible: false
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true
      },
      width: chartContainerRef.current.clientWidth,
      height: height
    });

      if (!chart) {
        console.error('Failed to create chart');
        return;
      }

      chartRef.current = chart;

      // Create main price series - using simple line series for now
      let mainSeries;

      // For now, let's use a simple line series that works
      mainSeries = chart.addLineSeries({
        color: colors.lineColor || '#2563EB',
        lineWidth: 2,
        priceFormat: {
          type: 'price',
          precision: 2,
          minMove: 0.01
        }
      });

    mainSeriesRef.current = mainSeries;

    // Add volume series if enabled
    if (showVolume) {
      const volumeSeries = chart.addHistogramSeries({
        color: colors.volumeUpColor,
        priceFormat: {
          type: 'volume'
        },
        priceScaleId: 'volume',
        scaleMargins: {
          top: 0.7,
          bottom: 0
        }
      });
      
      volumeSeriesRef.current = volumeSeries;
    }

    // Handle crosshair move events
    if (onCrosshairMove) {
      chart.subscribeCrosshairMove(onCrosshairMove);
    }

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chart) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chart) {
        chart.remove();
      }
    };
    } catch (error) {
      console.error('Error initializing chart:', error);
    }
  }, [darkMode, height, showVolume, chartType]);

  // Update data when it changes
  useEffect(() => {
    if (!data || data.length === 0) {
      setIsLoading(true);
      return;
    }

    try {
      if (mainSeriesRef.current) {
      // Prepare data based on chart type
      let chartData;
      
      if (chartType === 'line' || chartType === 'area') {
        chartData = data.map(item => ({
          time: item.time,
          value: item.close
        }));
      } else {
        chartData = data.map(item => ({
          time: item.time,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close
        }));
      }

      mainSeriesRef.current.setData(chartData);
    }

    // Update volume data
    if (showVolume && volumeSeriesRef.current) {
      const volumeData = data.map(item => ({
        time: item.time,
        value: item.volume,
        color: item.close >= item.open ? 
          getChartColors().volumeUpColor : 
          getChartColors().volumeDownColor
      }));

      volumeSeriesRef.current.setData(volumeData);
    }

      setIsLoading(false);
    } catch (error) {
      console.error('Error updating chart data:', error);
      setIsLoading(false);
    }
  }, [data, chartType, showVolume, darkMode]);

  // Auto-fit content when data changes
  useEffect(() => {
    if (chartRef.current && data.length > 0) {
      try {
        setTimeout(() => {
          if (chartRef.current) {
            chartRef.current.timeScale().fitContent();
          }
        }, 100);
      } catch (error) {
        console.error('Error fitting chart content:', error);
      }
    }
  }, [data]);

  return (
    <div className={`stock-chart-container ${className}`}>
      {isLoading && data.length === 0 && (
        <motion.div
          className="chart-loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="loading-spinner"></div>
          <p>Loading chart data for {symbol}...</p>
        </motion.div>
      )}

      <div
        ref={chartContainerRef}
        className="chart-wrapper"
        style={{
          height: `${height}px`,
          opacity: isLoading && data.length === 0 ? 0.3 : 1,
          transition: 'opacity 0.3s ease',
          background: darkMode ? '#1E293B' : '#FFFFFF',
          borderRadius: '12px',
          border: darkMode ? '1px solid #334155' : '1px solid #E5E7EB'
        }}
      />

      {data.length === 0 && !isLoading && (
        <motion.div
          className="chart-no-data"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="no-data-icon">📊</div>
          <p>No chart data available for {symbol}</p>
          <span>Try selecting a different stock symbol</span>
        </motion.div>
      )}
    </div>
  );
};

export default StockChart;
