import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

const CandlestickChart = ({ 
  data = [], 
  symbol = '', 
  height = 400, 
  className = '' 
}) => {
  const canvasRef = useRef();
  const { darkMode } = useTheme();
  const [hoveredPoint, setHoveredPoint] = React.useState(null);
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!canvasRef.current || !data.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    // Set canvas size
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);
    
    // Set colors based on theme
    const colors = {
      background: darkMode ? '#1E293B' : '#FFFFFF',
      upColor: darkMode ? '#81C784' : '#2E7D32',
      downColor: darkMode ? '#EF5350' : '#D32F2F',
      text: darkMode ? '#FFFFFF' : '#1A1A1A',
      grid: darkMode ? '#334155' : '#E0E0E0'
    };
    
    // Fill background
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, rect.width, rect.height);
    
    if (data.length === 0) {
      // Show no data message
      ctx.fillStyle = colors.text;
      ctx.font = '16px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No candlestick data available', rect.width / 2, rect.height / 2);
      return;
    }
    
    // Calculate data bounds
    const highs = data.map(d => d.high || d.close || d.value || 0);
    const lows = data.map(d => d.low || d.close || d.value || 0);
    const volumes = data.map(d => d.volume || 0);
    const minPrice = Math.min(...lows);
    const maxPrice = Math.max(...highs);
    const maxVolume = Math.max(...volumes);
    const priceRange = maxPrice - minPrice || 1;
    
    // Chart dimensions
    const padding = 40;
    const chartWidth = rect.width - padding * 2;
    const volumeHeight = 60;
    const priceChartHeight = rect.height - padding * 2 - volumeHeight - 10;
    
    // Draw grid lines
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    
    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding + (priceChartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(rect.width - padding, y);
      ctx.stroke();
    }
    
    ctx.setLineDash([]);
    
    // Draw candlesticks
    const candleWidth = Math.max(2, (chartWidth / data.length) * 0.8);
    
    data.forEach((candle, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const open = candle.open || candle.close || candle.value || 0;
      const high = candle.high || candle.close || candle.value || 0;
      const low = candle.low || candle.close || candle.value || 0;
      const close = candle.close || candle.value || 0;
      
      const openY = padding + (1 - (open - minPrice) / priceRange) * priceChartHeight;
      const highY = padding + (1 - (high - minPrice) / priceRange) * priceChartHeight;
      const lowY = padding + (1 - (low - minPrice) / priceRange) * priceChartHeight;
      const closeY = padding + (1 - (close - minPrice) / priceRange) * priceChartHeight;
      
      const isUp = close >= open;
      const color = isUp ? colors.upColor : colors.downColor;
      
      // Draw wick (high-low line)
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();
      
      // Draw body (open-close rectangle)
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.abs(closeY - openY) || 1;
      
      if (isUp) {
        // Bullish candle (hollow)
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.strokeRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
      } else {
        // Bearish candle (filled)
        ctx.fillStyle = color;
        ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
      }
    });
    
    // Draw volume bars
    if (maxVolume > 0) {
      const volumeStartY = rect.height - padding - volumeHeight;
      
      data.forEach((point, index) => {
        const x = padding + (index / (data.length - 1)) * chartWidth;
        const volume = point.volume || 0;
        const barHeight = (volume / maxVolume) * volumeHeight;
        const barWidth = Math.max(1, chartWidth / data.length * 0.6);
        
        const open = point.open || point.close || point.value || 0;
        const close = point.close || point.value || 0;
        const isUp = close >= open;
        
        ctx.fillStyle = isUp 
          ? (darkMode ? 'rgba(129, 199, 132, 0.6)' : 'rgba(46, 125, 50, 0.6)')
          : (darkMode ? 'rgba(239, 83, 80, 0.6)' : 'rgba(211, 47, 47, 0.6)');
        
        ctx.fillRect(
          x - barWidth / 2,
          volumeStartY + volumeHeight - barHeight,
          barWidth,
          barHeight
        );
      });
    }
    
    // Draw price labels
    ctx.fillStyle = colors.text;
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'right';
    
    for (let i = 0; i <= 5; i++) {
      const price = minPrice + (priceRange / 5) * (5 - i);
      const y = padding + (priceChartHeight / 5) * i + 4;
      ctx.fillText(`₹${price.toFixed(2)}`, padding - 10, y);
    }
    
    // Draw symbol and current price
    ctx.fillStyle = colors.text;
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(symbol, padding, 25);
    
    if (data.length > 0) {
      const currentCandle = data[data.length - 1];
      const currentPrice = currentCandle.close || currentCandle.value || 0;
      const prevPrice = data.length > 1 ? (data[data.length - 2].close || data[data.length - 2].value || 0) : currentPrice;
      const isUp = currentPrice >= prevPrice;
      
      ctx.font = 'bold 20px Inter, sans-serif';
      ctx.fillStyle = isUp ? colors.upColor : colors.downColor;
      ctx.textAlign = 'right';
      ctx.fillText(`₹${currentPrice.toFixed(2)}`, rect.width - padding, 30);
      
      const change = currentPrice - prevPrice;
      const changePercent = prevPrice !== 0 ? (change / prevPrice) * 100 : 0;
      ctx.font = '12px Inter, sans-serif';
      ctx.fillText(
        `${change >= 0 ? '+' : ''}${change.toFixed(2)} (${changePercent.toFixed(2)}%)`,
        rect.width - padding,
        50
      );
    }
    
  }, [data, darkMode, symbol]);

  // Handle mouse movement for hover effects
  const handleMouseMove = (e) => {
    if (!canvasRef.current || !data.length) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setMousePos({ x, y });
    
    const padding = 40;
    const chartWidth = rect.width - padding * 2;
    const relativeX = (x - padding) / chartWidth;
    const dataIndex = Math.round(relativeX * (data.length - 1));
    
    if (dataIndex >= 0 && dataIndex < data.length) {
      setHoveredPoint({
        index: dataIndex,
        data: data[dataIndex],
        x: padding + (dataIndex / (data.length - 1)) * chartWidth,
        y: y
      });
    } else {
      setHoveredPoint(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  return (
    <div className={`candlestick-chart-container ${className}`} style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          width: '100%',
          height: `${height}px`,
          borderRadius: '12px',
          background: darkMode ? '#1E293B' : '#FFFFFF',
          border: `1px solid ${darkMode ? '#334155' : '#E0E0E0'}`,
          cursor: 'crosshair'
        }}
      />
      
      {/* Hover tooltip */}
      {hoveredPoint && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          style={{
            position: 'absolute',
            left: mousePos.x + 10,
            top: mousePos.y - 100,
            background: darkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            color: darkMode ? '#FFFFFF' : '#1A1A1A',
            padding: '12px',
            borderRadius: '8px',
            border: `1px solid ${darkMode ? '#334155' : '#E0E0E0'}`,
            fontSize: '12px',
            fontWeight: 600,
            pointerEvents: 'none',
            zIndex: 1000,
            backdropFilter: 'blur(10px)',
            boxShadow: darkMode 
              ? '0 4px 6px rgba(0, 0, 0, 0.3)' 
              : '0 4px 6px rgba(0, 0, 0, 0.1)',
            minWidth: '120px'
          }}
        >
          <div style={{ marginBottom: '4px' }}>
            <strong>O:</strong> ₹{(hoveredPoint.data.open || hoveredPoint.data.close || 0).toFixed(2)}
          </div>
          <div style={{ marginBottom: '4px' }}>
            <strong>H:</strong> ₹{(hoveredPoint.data.high || hoveredPoint.data.close || 0).toFixed(2)}
          </div>
          <div style={{ marginBottom: '4px' }}>
            <strong>L:</strong> ₹{(hoveredPoint.data.low || hoveredPoint.data.close || 0).toFixed(2)}
          </div>
          <div style={{ marginBottom: '4px' }}>
            <strong>C:</strong> ₹{(hoveredPoint.data.close || hoveredPoint.data.value || 0).toFixed(2)}
          </div>
          {hoveredPoint.data.volume && (
            <div style={{ marginBottom: '4px' }}>
              <strong>Vol:</strong> {hoveredPoint.data.volume.toLocaleString()}
            </div>
          )}
          {hoveredPoint.data.time && (
            <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '4px' }}>
              {new Date(hoveredPoint.data.time).toLocaleDateString()}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default CandlestickChart;
