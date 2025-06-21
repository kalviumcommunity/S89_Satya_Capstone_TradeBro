/**
 * Performance Monitor Component
 * Monitors and optimizes app performance in real-time
 */

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PerformanceMonitor = ({ enabled = process.env.NODE_ENV === 'development' }) => {
  const [metrics, setMetrics] = useState({
    fps: 0,
    memory: 0,
    loadTime: 0,
    renderTime: 0,
    bundleSize: 0
  });
  const [isVisible, setIsVisible] = useState(false);
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const renderStart = useRef(0);

  // FPS Monitoring
  useEffect(() => {
    if (!enabled) return;

    const measureFPS = () => {
      frameCount.current++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime.current + 1000) {
        const fps = Math.round((frameCount.current * 1000) / (currentTime - lastTime.current));
        
        setMetrics(prev => ({ ...prev, fps }));
        
        frameCount.current = 0;
        lastTime.current = currentTime;
      }
      
      requestAnimationFrame(measureFPS);
    };

    const rafId = requestAnimationFrame(measureFPS);
    return () => cancelAnimationFrame(rafId);
  }, [enabled]);

  // Memory Monitoring
  useEffect(() => {
    if (!enabled || !performance.memory) return;

    const measureMemory = () => {
      const memory = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
      setMetrics(prev => ({ ...prev, memory }));
    };

    const interval = setInterval(measureMemory, 2000);
    return () => clearInterval(interval);
  }, [enabled]);

  // Load Time Monitoring
  useEffect(() => {
    if (!enabled) return;

    const measureLoadTime = () => {
      const navigation = performance.getEntriesByType('navigation')[0];
      if (navigation) {
        const loadTime = Math.round(navigation.loadEventEnd - navigation.fetchStart);
        setMetrics(prev => ({ ...prev, loadTime }));
      }
    };

    if (document.readyState === 'complete') {
      measureLoadTime();
    } else {
      window.addEventListener('load', measureLoadTime);
      return () => window.removeEventListener('load', measureLoadTime);
    }
  }, [enabled]);

  // Render Time Monitoring
  useEffect(() => {
    renderStart.current = performance.now();
  });

  useEffect(() => {
    const renderTime = performance.now() - renderStart.current;
    if (renderTime > 0) {
      setMetrics(prev => ({ ...prev, renderTime: Math.round(renderTime * 100) / 100 }));
    }
  });

  // Bundle Size Estimation
  useEffect(() => {
    if (!enabled) return;

    const estimateBundleSize = async () => {
      try {
        const scripts = Array.from(document.querySelectorAll('script[src]'));
        let totalSize = 0;

        for (const script of scripts) {
          try {
            const response = await fetch(script.src, { method: 'HEAD' });
            const size = response.headers.get('content-length');
            if (size) {
              totalSize += parseInt(size);
            }
          } catch (error) {
            // Ignore CORS errors
          }
        }

        const bundleSize = Math.round(totalSize / 1024); // KB
        setMetrics(prev => ({ ...prev, bundleSize }));
      } catch (error) {
        console.warn('Could not estimate bundle size:', error);
      }
    };

    estimateBundleSize();
  }, [enabled]);

  // Performance Warnings
  useEffect(() => {
    if (!enabled) return;

    const checkPerformance = () => {
      const warnings = [];

      if (metrics.fps < 30) {
        warnings.push(`Low FPS: ${metrics.fps}`);
      }

      if (metrics.memory > 100) {
        warnings.push(`High memory usage: ${metrics.memory}MB`);
      }

      if (metrics.renderTime > 16) {
        warnings.push(`Slow render: ${metrics.renderTime}ms`);
      }

      if (warnings.length > 0) {
        console.warn('Performance warnings:', warnings);
      }
    };

    const interval = setInterval(checkPerformance, 5000);
    return () => clearInterval(interval);
  }, [enabled, metrics]);

  // Keyboard shortcut to toggle visibility
  useEffect(() => {
    if (!enabled) return;

    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setIsVisible(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [enabled]);

  if (!enabled) return null;

  const getStatusColor = (metric, value) => {
    switch (metric) {
      case 'fps':
        return value >= 60 ? 'text-green-500' : value >= 30 ? 'text-yellow-500' : 'text-red-500';
      case 'memory':
        return value <= 50 ? 'text-green-500' : value <= 100 ? 'text-yellow-500' : 'text-red-500';
      case 'renderTime':
        return value <= 16 ? 'text-green-500' : value <= 33 ? 'text-yellow-500' : 'text-red-500';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <motion.button
        className="fixed top-4 right-4 z-50 bg-gray-800 text-white p-2 rounded-full shadow-lg hover:bg-gray-700 transition-colors"
        onClick={() => setIsVisible(!isVisible)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        title="Performance Monitor (Ctrl+Shift+P)"
      >
        📊
      </motion.button>

      {/* Performance Panel */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            className="fixed top-16 right-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 min-w-64"
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Performance
              </h3>
              <button
                onClick={() => setIsVisible(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-300">FPS:</span>
                <span className={`text-sm font-mono ${getStatusColor('fps', metrics.fps)}`}>
                  {metrics.fps}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-300">Memory:</span>
                <span className={`text-sm font-mono ${getStatusColor('memory', metrics.memory)}`}>
                  {metrics.memory}MB
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-300">Load Time:</span>
                <span className="text-sm font-mono text-gray-600 dark:text-gray-300">
                  {metrics.loadTime}ms
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-300">Render:</span>
                <span className={`text-sm font-mono ${getStatusColor('renderTime', metrics.renderTime)}`}>
                  {metrics.renderTime}ms
                </span>
              </div>

              {metrics.bundleSize > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Bundle:</span>
                  <span className="text-sm font-mono text-gray-600 dark:text-gray-300">
                    {metrics.bundleSize}KB
                  </span>
                </div>
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Press Ctrl+Shift+P to toggle
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PerformanceMonitor;
