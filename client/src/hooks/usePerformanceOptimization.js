/**
 * Performance Optimization Hook
 * Centralized performance monitoring and optimization utilities
 */

import { useEffect, useRef, useCallback, useMemo } from 'react';
import { debounce, throttle, LRUCache, useCleanup } from '../utils/performanceOptimizer';

/**
 * Hook for optimizing component re-renders and performance
 */
export const usePerformanceOptimization = (componentName, options = {}) => {
  const {
    enableProfiling = process.env.NODE_ENV === 'development',
    cacheSize = 100,
    debounceDelay = 300,
    throttleDelay = 1000
  } = options;

  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());
  const cache = useRef(new LRUCache(cacheSize));
  const cleanupManager = useCleanup();

  // Track render performance
  useEffect(() => {
    renderCount.current += 1;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    lastRenderTime.current = now;

    if (enableProfiling) {
      console.log(`🔄 ${componentName} render #${renderCount.current} (${timeSinceLastRender}ms since last)`);
      
      if (timeSinceLastRender < 16) {
        console.warn(`⚠️ ${componentName} rendering too frequently (${timeSinceLastRender}ms)`);
      }
    }
  });

  // Optimized debounce function
  const optimizedDebounce = useCallback((func, delay = debounceDelay) => {
    return debounce(func, delay);
  }, [debounceDelay]);

  // Optimized throttle function
  const optimizedThrottle = useCallback((func, delay = throttleDelay) => {
    return throttle(func, delay);
  }, [throttleDelay]);

  // Memoized cache operations
  const cacheOperations = useMemo(() => ({
    get: (key) => cache.current.get(key),
    set: (key, value) => cache.current.set(key, value),
    clear: () => cache.current.clear(),
    size: () => cache.current.size()
  }), []);

  // Performance metrics
  const getMetrics = useCallback(() => ({
    renderCount: renderCount.current,
    lastRenderTime: lastRenderTime.current,
    cacheSize: cache.current.size(),
    componentName
  }), [componentName]);

  return {
    debounce: optimizedDebounce,
    throttle: optimizedThrottle,
    cache: cacheOperations,
    getMetrics,
    cleanupManager
  };
};

/**
 * Hook for optimizing API calls and data fetching
 */
export const useOptimizedFetching = (fetchFunction, dependencies = [], options = {}) => {
  const {
    cacheTime = 300000, // 5 minutes
    staleTime = 60000,  // 1 minute
    retryAttempts = 3,
    retryDelay = 1000
  } = options;

  const cache = useRef(new Map());
  const abortController = useRef(null);
  const cleanupManager = useCleanup();

  const optimizedFetch = useCallback(async (...args) => {
    const cacheKey = JSON.stringify(args);
    const cached = cache.current.get(cacheKey);
    
    // Return cached data if still fresh
    if (cached && Date.now() - cached.timestamp < staleTime) {
      return cached.data;
    }

    // Cancel previous request
    if (abortController.current) {
      abortController.current.abort();
    }

    abortController.current = new AbortController();
    
    try {
      const data = await fetchFunction(...args, {
        signal: abortController.current.signal
      });

      // Cache the result
      cache.current.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      // Clean old cache entries
      if (cache.current.size > 100) {
        const oldestKey = cache.current.keys().next().value;
        cache.current.delete(oldestKey);
      }

      return data;
    } catch (error) {
      if (error.name !== 'AbortError') {
        throw error;
      }
    }
  }, dependencies);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);

  return optimizedFetch;
};

/**
 * Hook for optimizing animations and transitions
 */
export const useOptimizedAnimations = (options = {}) => {
  const {
    respectReducedMotion = true,
    fallbackDuration = 0
  } = options;

  const prefersReducedMotion = useMemo(() => {
    if (!respectReducedMotion) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, [respectReducedMotion]);

  const optimizedVariants = useMemo(() => ({
    initial: { opacity: 0, y: prefersReducedMotion ? 0 : 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: prefersReducedMotion ? fallbackDuration : 0.3,
        ease: 'easeOut'
      }
    },
    exit: { 
      opacity: 0, 
      y: prefersReducedMotion ? 0 : -20,
      transition: { 
        duration: prefersReducedMotion ? fallbackDuration : 0.2 
      }
    }
  }), [prefersReducedMotion, fallbackDuration]);

  const optimizedTransition = useMemo(() => ({
    duration: prefersReducedMotion ? fallbackDuration : 0.3,
    ease: 'easeInOut'
  }), [prefersReducedMotion, fallbackDuration]);

  return {
    variants: optimizedVariants,
    transition: optimizedTransition,
    shouldAnimate: !prefersReducedMotion
  };
};

/**
 * Hook for optimizing large lists with virtual scrolling
 */
export const useVirtualScrolling = (items, itemHeight, containerHeight) => {
  const scrollTop = useRef(0);
  const visibleStart = Math.floor(scrollTop.current / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );

  const visibleItems = useMemo(() => {
    return items.slice(visibleStart, visibleEnd).map((item, index) => ({
      ...item,
      index: visibleStart + index,
      top: (visibleStart + index) * itemHeight
    }));
  }, [items, visibleStart, visibleEnd, itemHeight]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleStart * itemHeight;

  const handleScroll = useCallback(throttle((event) => {
    scrollTop.current = event.target.scrollTop;
  }, 16), []); // 60fps throttling

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll
  };
};

/**
 * Hook for batch processing updates
 */
export const useBatchUpdates = (batchSize = 10, delay = 100) => {
  const queue = useRef([]);
  const timeoutRef = useRef(null);
  const cleanupManager = useCleanup();

  const addToBatch = useCallback((update) => {
    queue.current.push(update);

    if (queue.current.length >= batchSize) {
      processBatch();
    } else if (!timeoutRef.current) {
      timeoutRef.current = setTimeout(processBatch, delay);
      cleanupManager.addTimeout(timeoutRef.current);
    }
  }, [batchSize, delay, cleanupManager]);

  const processBatch = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (queue.current.length === 0) return;

    const batch = queue.current.splice(0, batchSize);
    
    // Process all updates in a single batch
    batch.forEach(update => {
      if (typeof update === 'function') {
        update();
      }
    });
  }, [batchSize]);

  return { addToBatch, processBatch };
};

/**
 * Hook for memory leak prevention
 */
export const useMemoryOptimization = () => {
  const refs = useRef(new Set());
  const intervals = useRef(new Set());
  const timeouts = useRef(new Set());
  const listeners = useRef(new Set());

  const addRef = useCallback((ref) => {
    refs.current.add(ref);
    return ref;
  }, []);

  const addInterval = useCallback((id) => {
    intervals.current.add(id);
    return id;
  }, []);

  const addTimeout = useCallback((id) => {
    timeouts.current.add(id);
    return id;
  }, []);

  const addListener = useCallback((element, event, handler) => {
    const listener = { element, event, handler };
    listeners.current.add(listener);
    element.addEventListener(event, handler);
    return listener;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear intervals
      intervals.current.forEach(id => clearInterval(id));
      intervals.current.clear();

      // Clear timeouts
      timeouts.current.forEach(id => clearTimeout(id));
      timeouts.current.clear();

      // Remove event listeners
      listeners.current.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler);
      });
      listeners.current.clear();

      // Clear refs
      refs.current.clear();
    };
  }, []);

  return {
    addRef,
    addInterval,
    addTimeout,
    addListener
  };
};

export default {
  usePerformanceOptimization,
  useOptimizedFetching,
  useOptimizedAnimations,
  useVirtualScrolling,
  useBatchUpdates,
  useMemoryOptimization
};
