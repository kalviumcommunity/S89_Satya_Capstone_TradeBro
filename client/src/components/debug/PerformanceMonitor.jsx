/**
 * Performance Monitor Component
 * Real-time performance monitoring and debugging
 */

import React, { useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiActivity, FiCpu, FiMonitor, FiX, FiRefreshCw } from 'react-icons/fi';

const PerformanceMonitor = memo(({ 
  enabled = process.env.NODE_ENV === 'development',
  position = 'bottom-right'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [metrics, setMetrics] = useState({
    fps: 0,
    memory: 0,
    renderTime: 0,
    componentCount: 0
  });
  
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const animationFrame = useRef(null);

  // FPS Calculation
  useEffect(() => {
    if (!enabled) return;

    const calculateFPS = () => {
      frameCount.current++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime.current + 1000) {
        const fps = Math.round((frameCount.current * 1000) / (currentTime - lastTime.current));
        
        setMetrics(prev => ({
          ...prev,
          fps,
          memory: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : 0,
          renderTime: currentTime - lastTime.current
        }));
        
        frameCount.current = 0;
        lastTime.current = currentTime;
      }
      
      animationFrame.current = requestAnimationFrame(calculateFPS);
    };

    calculateFPS();

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [enabled]);

  // Performance Observer for render times
  useEffect(() => {
    if (!enabled || !window.PerformanceObserver) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const renderEntries = entries.filter(entry => entry.name.includes('render'));
      
      if (renderEntries.length > 0) {
        const avgRenderTime = renderEntries.reduce((sum, entry) => sum + entry.duration, 0) / renderEntries.length;
        setMetrics(prev => ({ ...prev, renderTime: Math.round(avgRenderTime * 100) / 100 }));
      }
    });

    observer.observe({ entryTypes: ['measure'] });

    return () => observer.disconnect();
  }, [enabled]);

  if (!enabled) return null;

  const getPositionStyles = () => {
    const base = {
      position: 'fixed',
      zIndex: 9999,
      padding: '12px',
      background: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      borderRadius: '8px',
      fontSize: '12px',
      fontFamily: 'monospace',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    };

    switch (position) {
      case 'top-left':
        return { ...base, top: '20px', left: '20px' };
      case 'top-right':
        return { ...base, top: '20px', right: '20px' };
      case 'bottom-left':
        return { ...base, bottom: '20px', left: '20px' };
      case 'bottom-right':
      default:
        return { ...base, bottom: '20px', right: '20px' };
    }
  };

  const getFPSColor = (fps) => {
    if (fps >= 55) return '#10B981'; // Green
    if (fps >= 30) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  const getMemoryColor = (memory) => {
    if (memory < 50) return '#10B981'; // Green
    if (memory < 100) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  return (
    <>
      {/* Toggle Button */}
      <motion.button
        onClick={() => setIsVisible(!isVisible)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'rgba(0, 0, 0, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          color: 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9998,
          backdropFilter: 'blur(10px)'
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <FiActivity size={20} />
      </motion.button>

      {/* Performance Panel */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            style={getPositionStyles()}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <FiMonitor size={16} style={{ marginRight: '8px' }} />
              <span style={{ fontWeight: 'bold' }}>Performance Monitor</span>
              <button
                onClick={() => setIsVisible(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  marginLeft: 'auto',
                  padding: '4px'
                }}
              >
                <FiX size={14} />
              </button>
            </div>

            <div style={{ display: 'grid', gap: '8px' }}>
              {/* FPS */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>FPS:</span>
                <span style={{ color: getFPSColor(metrics.fps), fontWeight: 'bold' }}>
                  {metrics.fps}
                </span>
              </div>

              {/* Memory Usage */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Memory:</span>
                <span style={{ color: getMemoryColor(metrics.memory), fontWeight: 'bold' }}>
                  {metrics.memory} MB
                </span>
              </div>

              {/* Render Time */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Render:</span>
                <span style={{ color: metrics.renderTime > 16 ? '#EF4444' : '#10B981', fontWeight: 'bold' }}>
                  {metrics.renderTime.toFixed(2)}ms
                </span>
              </div>

              {/* Performance Tips */}
              <div style={{ marginTop: '12px', padding: '8px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px' }}>
                <div style={{ fontSize: '11px', opacity: 0.8 }}>
                  {metrics.fps < 30 && <div style={{ color: '#EF4444' }}>⚠️ Low FPS detected</div>}
                  {metrics.memory > 100 && <div style={{ color: '#EF4444' }}>⚠️ High memory usage</div>}
                  {metrics.renderTime > 16 && <div style={{ color: '#EF4444' }}>⚠️ Slow renders</div>}
                  {metrics.fps >= 55 && metrics.memory < 50 && metrics.renderTime <= 16 && (
                    <div style={{ color: '#10B981' }}>✅ Performance optimal</div>
                  )}
                </div>
              </div>

              {/* Performance Actions */}
              <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => {
                    // Clear caches
                    if ('caches' in window) {
                      caches.keys().then(names => {
                        names.forEach(name => caches.delete(name));
                      });
                    }
                    // Force garbage collection if available
                    if (window.gc) {
                      window.gc();
                    }
                  }}
                  style={{
                    background: 'rgba(59, 130, 246, 0.2)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    color: '#60A5FA',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    cursor: 'pointer'
                  }}
                >
                  <FiRefreshCw size={10} style={{ marginRight: '4px' }} />
                  Clear Cache
                </button>
                
                <button
                  onClick={() => {
                    console.log('Performance Metrics:', metrics);
                    console.log('Performance Entries:', performance.getEntries());
                  }}
                  style={{
                    background: 'rgba(16, 185, 129, 0.2)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#34D399',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    cursor: 'pointer'
                  }}
                >
                  <FiCpu size={10} style={{ marginRight: '4px' }} />
                  Log Metrics
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});

PerformanceMonitor.displayName = 'PerformanceMonitor';

export default PerformanceMonitor;
