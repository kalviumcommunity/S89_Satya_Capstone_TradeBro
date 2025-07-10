import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

const SimpleChart = ({
  data = [],
  symbol = '',
  height = 400,
  className = ''
}) => {
  const canvasRef = useRef();
  const containerRef = useRef();
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
      line: darkMode ? '#3399FF' : '#0057FF',
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
      ctx.fillText('No chart data available', rect.width / 2, rect.height / 2);
      return;
    }
    
    // Calculate data bounds
    const prices = data.map(d => d.close || d.value || 0);
    const volumes = data.map(d => d.volume || 0);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const maxVolume = Math.max(...volumes);
    const priceRange = maxPrice - minPrice || 1;
    
    // Chart dimensions
    const padding = 40;
    const chartWidth = rect.width - padding * 2;
    const volumeHeight = 60; // Height for volume bars
    const priceChartHeight = rect.height - padding * 2 - volumeHeight - 10; // 10px gap
    const chartHeight = priceChartHeight;
    
    // Draw grid lines
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    
    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(rect.width - padding, y);
      ctx.stroke();
    }
    
    // Vertical grid lines
    for (let i = 0; i <= 5; i++) {
      const x = padding + (chartWidth / 5) * i;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, rect.height - padding);
      ctx.stroke();
    }
    
    ctx.setLineDash([]);
    
    // Draw price line with gradient
    const gradient = ctx.createLinearGradient(0, padding, 0, rect.height - padding);
    gradient.addColorStop(0, colors.line);
    gradient.addColorStop(1, colors.line + '40');

    ctx.strokeStyle = colors.line;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();

    // Create smooth curve
    const points = data.map((point, index) => ({
      x: padding + (index / (data.length - 1)) * chartWidth,
      y: padding + (1 - ((point.close || point.value || 0) - minPrice) / priceRange) * chartHeight
    }));

    if (points.length > 0) {
      ctx.moveTo(points[0].x, points[0].y);

      for (let i = 1; i < points.length; i++) {
        const prevPoint = points[i - 1];
        const currentPoint = points[i];
        const cpx = (prevPoint.x + currentPoint.x) / 2;

        ctx.quadraticCurveTo(cpx, prevPoint.y, currentPoint.x, currentPoint.y);
      }
    }

    ctx.stroke();

    // Add area fill
    if (points.length > 0) {
      ctx.fillStyle = gradient;
      ctx.globalAlpha = 0.1;
      ctx.lineTo(points[points.length - 1].x, rect.height - padding);
      ctx.lineTo(points[0].x, rect.height - padding);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Draw volume bars
    if (maxVolume > 0) {
      const volumeStartY = rect.height - padding - volumeHeight;

      data.forEach((point, index) => {
        const x = padding + (index / (data.length - 1)) * chartWidth;
        const volume = point.volume || 0;
        const barHeight = (volume / maxVolume) * volumeHeight;
        const barWidth = Math.max(1, chartWidth / data.length * 0.8);

        // Color based on price movement
        const currentPrice = point.close || point.value || 0;
        const prevPrice = index > 0 ? (data[index - 1].close || data[index - 1].value || 0) : currentPrice;
        const isUp = currentPrice >= prevPrice;

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

      // Volume label
      ctx.fillStyle = colors.text;
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Volume', padding, volumeStartY - 5);
    }
    
    // Draw price labels
    ctx.fillStyle = colors.text;
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'right';
    
    for (let i = 0; i <= 5; i++) {
      const price = minPrice + (priceRange / 5) * (5 - i);
      const y = padding + (chartHeight / 5) * i + 4;
      ctx.fillText(`₹${price.toFixed(2)}`, padding - 10, y);
    }
    
    // Draw symbol label and current price
    ctx.fillStyle = colors.text;
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(symbol, padding, 25);

    // Draw current price (latest data point)
    if (data.length > 0) {
      const currentPrice = data[data.length - 1].close || data[data.length - 1].value || 0;
      const prevPrice = data.length > 1 ? (data[data.length - 2].close || data[data.length - 2].value || 0) : currentPrice;
      const isUp = currentPrice >= prevPrice;

      ctx.font = 'bold 20px Inter, sans-serif';
      ctx.fillStyle = isUp ? (darkMode ? '#81C784' : '#2E7D32') : (darkMode ? '#EF5350' : '#D32F2F');
      ctx.textAlign = 'right';
      ctx.fillText(`₹${currentPrice.toFixed(2)}`, rect.width - padding, 30);

      // Draw change indicator
      const change = currentPrice - prevPrice;
      const changePercent = prevPrice !== 0 ? (change / prevPrice) * 100 : 0;
      ctx.font = '12px Inter, sans-serif';
      ctx.fillText(
        `${change >= 0 ? '+' : ''}${change.toFixed(2)} (${changePercent.toFixed(2)}%)`,
        rect.width - padding,
        50
      );
    }

    // Add hover crosshair
    if (hoveredPoint) {
      ctx.strokeStyle = colors.text;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);

      // Vertical line
      ctx.beginPath();
      ctx.moveTo(hoveredPoint.x, padding);
      ctx.lineTo(hoveredPoint.x, rect.height - padding);
      ctx.stroke();

      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(padding, hoveredPoint.y);
      ctx.lineTo(rect.width - padding, hoveredPoint.y);
      ctx.stroke();

      ctx.setLineDash([]);

      // Draw hover point
      ctx.fillStyle = colors.line;
      ctx.beginPath();
      ctx.arc(hoveredPoint.x, hoveredPoint.y, 4, 0, 2 * Math.PI);
      ctx.fill();

      // White border around point
      ctx.strokeStyle = colors.background;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
  }, [data, darkMode, symbol, hoveredPoint]);

  // Handle mouse movement for hover effects
  const handleMouseMove = (e) => {
    if (!canvasRef.current || !data.length) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePos({ x, y });

    // Find closest data point
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
    <div
      ref={containerRef}
      className={`simple-chart-container ${className}`}
      style={{ position: 'relative' }}
    >
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
            top: mousePos.y - 60,
            background: darkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            color: darkMode ? '#FFFFFF' : '#1A1A1A',
            padding: '8px 12px',
            borderRadius: '8px',
            border: `1px solid ${darkMode ? '#334155' : '#E0E0E0'}`,
            fontSize: '12px',
            fontWeight: 600,
            pointerEvents: 'none',
            zIndex: 1000,
            backdropFilter: 'blur(10px)',
            boxShadow: darkMode
              ? '0 4px 6px rgba(0, 0, 0, 0.3)'
              : '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}
        >
          <div>₹{(hoveredPoint.data.close || hoveredPoint.data.value || 0).toFixed(2)}</div>
          {hoveredPoint.data.time && (
            <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '2px' }}>
              {new Date(hoveredPoint.data.time).toLocaleDateString()}
            </div>
          )}
        </motion.div>
      )}
      
      {data.length === 0 && (
        <motion.div
          className="chart-no-data"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: darkMode ? '#B0B0B0' : '#4F4F4F',
            background: darkMode ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            padding: '2rem',
            borderRadius: '12px',
            border: `1px solid ${darkMode ? '#334155' : '#E0E0E0'}`
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>📊</div>
          <p style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 600 }}>
            No chart data available for {symbol}
          </p>
          <span style={{ fontSize: '0.875rem', opacity: 0.7 }}>
            Try selecting a different stock symbol
          </span>
        </motion.div>
      )}
    </div>
  );
};

export default SimpleChart;
