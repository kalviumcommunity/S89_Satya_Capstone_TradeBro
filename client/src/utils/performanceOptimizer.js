/**
 * Performance Optimizer Utilities
 * Centralized performance optimization tools for TradeBro
 */

import { useCallback, useRef, useMemo, useEffect, useState } from 'react';

// ========================================
// DEBOUNCING & THROTTLING
// ========================================

/**
 * Debounce function to limit rapid function calls
 */
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

/**
 * Throttle function to limit function calls to once per interval
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Custom hook for debounced values
 */
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Custom hook for throttled callbacks
 */
export const useThrottle = (callback, delay) => {
  const lastRun = useRef(Date.now());

  return useCallback((...args) => {
    if (Date.now() - lastRun.current >= delay) {
      callback(...args);
      lastRun.current = Date.now();
    }
  }, [callback, delay]);
};

// ========================================
// MEMORY MANAGEMENT
// ========================================

/**
 * Cleanup manager for intervals and timeouts
 */
export class CleanupManager {
  constructor() {
    this.intervals = new Set();
    this.timeouts = new Set();
    this.listeners = new Set();
  }

  addInterval(id) {
    this.intervals.add(id);
    return id;
  }

  addTimeout(id) {
    this.timeouts.add(id);
    return id;
  }

  addListener(element, event, handler) {
    const listener = { element, event, handler };
    this.listeners.add(listener);
    element.addEventListener(event, handler);
    return listener;
  }

  cleanup() {
    // Clear intervals
    this.intervals.forEach(id => clearInterval(id));
    this.intervals.clear();

    // Clear timeouts
    this.timeouts.forEach(id => clearTimeout(id));
    this.timeouts.clear();

    // Remove event listeners
    this.listeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this.listeners.clear();
  }
}

/**
 * Custom hook for automatic cleanup
 */
export const useCleanup = () => {
  const cleanupManager = useRef(new CleanupManager());

  useEffect(() => {
    return () => {
      cleanupManager.current.cleanup();
    };
  }, []);

  return cleanupManager.current;
};

// ========================================
// CACHING & MEMOIZATION
// ========================================

/**
 * LRU Cache implementation
 */
export class LRUCache {
  constructor(maxSize = 100) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key) {
    if (this.cache.has(key)) {
      const value = this.cache.get(key);
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    return null;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
}

/**
 * Memoization with expiration
 */
export const memoizeWithExpiration = (fn, ttl = 60000) => {
  const cache = new Map();

  return (...args) => {
    const key = JSON.stringify(args);
    const cached = cache.get(key);

    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.value;
    }

    const result = fn(...args);
    cache.set(key, {
      value: result,
      timestamp: Date.now()
    });

    return result;
  };
};

// ========================================
// PERFORMANCE MONITORING
// ========================================

/**
 * Performance monitor for tracking render times
 */
export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
  }

  startMeasure(name) {
    performance.mark(`${name}-start`);
  }

  endMeasure(name) {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    const measure = performance.getEntriesByName(name)[0];
    this.metrics.set(name, measure.duration);
    
    // Clean up marks
    performance.clearMarks(`${name}-start`);
    performance.clearMarks(`${name}-end`);
    performance.clearMeasures(name);
    
    return measure.duration;
  }

  getMetrics() {
    return Object.fromEntries(this.metrics);
  }

  logSlowOperations(threshold = 16) {
    this.metrics.forEach((duration, name) => {
      if (duration > threshold) {
        console.warn(`🐌 Slow operation detected: ${name} took ${duration.toFixed(2)}ms`);
      }
    });
  }
}

/**
 * Custom hook for performance monitoring
 */
export const usePerformanceMonitor = (componentName) => {
  const monitor = useRef(new PerformanceMonitor());

  const startMeasure = useCallback((operation) => {
    monitor.current.startMeasure(`${componentName}-${operation}`);
  }, [componentName]);

  const endMeasure = useCallback((operation) => {
    return monitor.current.endMeasure(`${componentName}-${operation}`);
  }, [componentName]);

  return { startMeasure, endMeasure, getMetrics: () => monitor.current.getMetrics() };
};

// ========================================
// BATCH PROCESSING
// ========================================

/**
 * Batch processor for grouping operations
 */
export class BatchProcessor {
  constructor(batchSize = 10, delay = 100) {
    this.batchSize = batchSize;
    this.delay = delay;
    this.queue = [];
    this.timeoutId = null;
  }

  add(item, processor) {
    this.queue.push({ item, processor });

    if (this.queue.length >= this.batchSize) {
      this.flush();
    } else if (!this.timeoutId) {
      this.timeoutId = setTimeout(() => this.flush(), this.delay);
    }
  }

  flush() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    if (this.queue.length === 0) return;

    const batch = this.queue.splice(0, this.batchSize);
    
    // Group by processor function
    const groups = new Map();
    batch.forEach(({ item, processor }) => {
      if (!groups.has(processor)) {
        groups.set(processor, []);
      }
      groups.get(processor).push(item);
    });

    // Process each group
    groups.forEach((items, processor) => {
      try {
        processor(items);
      } catch (error) {
        console.error('Batch processing error:', error);
      }
    });
  }
}

// ========================================
// EXPORTS
// ========================================

export const performanceOptimizer = {
  debounce,
  throttle,
  LRUCache,
  memoizeWithExpiration,
  PerformanceMonitor,
  BatchProcessor,
  CleanupManager
};

export default performanceOptimizer;
