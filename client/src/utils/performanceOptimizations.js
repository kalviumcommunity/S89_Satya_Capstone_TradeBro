/**
 * Performance Optimization Utilities for TradeBro
 * Comprehensive performance enhancements to make the website lag-free
 */

import { memo, useMemo, useCallback, useRef, useEffect } from 'react';

// ===== DEBOUNCING & THROTTLING =====

/**
 * Debounce function to limit function calls
 */
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

/**
 * Throttle function to limit function calls
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
 * RAF throttle for smooth animations
 */
export const rafThrottle = (func) => {
  let rafId = null;
  return (...args) => {
    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        func.apply(null, args);
        rafId = null;
      });
    }
  };
};

// ===== LAZY LOADING =====

/**
 * Intersection Observer for lazy loading
 */
export const createLazyLoader = (callback, options = {}) => {
  const defaultOptions = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1
  };
  
  return new IntersectionObserver(callback, { ...defaultOptions, ...options });
};

/**
 * Hook for lazy loading images
 */
export const useLazyImage = (src, placeholder = '') => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef();

  useEffect(() => {
    const observer = createLazyLoader((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = new Image();
          img.onload = () => {
            setImageSrc(src);
            setIsLoaded(true);
          };
          img.src = src;
          observer.unobserve(entry.target);
        }
      });
    });

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src]);

  return { imgRef, imageSrc, isLoaded };
};

// ===== MEMORY MANAGEMENT =====

/**
 * Hook to cleanup event listeners
 */
export const useEventListener = (eventName, handler, element = window) => {
  const savedHandler = useRef();

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const isSupported = element && element.addEventListener;
    if (!isSupported) return;

    const eventListener = (event) => savedHandler.current(event);
    element.addEventListener(eventName, eventListener);

    return () => {
      element.removeEventListener(eventName, eventListener);
    };
  }, [eventName, element]);
};

/**
 * Hook to cleanup timeouts and intervals
 */
export const useTimeout = (callback, delay) => {
  const timeoutRef = useRef();
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay !== null) {
      timeoutRef.current = setTimeout(() => callbackRef.current(), delay);
      return () => clearTimeout(timeoutRef.current);
    }
  }, [delay]);

  return () => clearTimeout(timeoutRef.current);
};

// ===== ANIMATION OPTIMIZATIONS =====

/**
 * Optimized animation frame hook
 */
export const useAnimationFrame = (callback) => {
  const requestRef = useRef();
  const previousTimeRef = useRef();

  const animate = useCallback((time) => {
    if (previousTimeRef.current !== undefined) {
      const deltaTime = time - previousTimeRef.current;
      callback(deltaTime);
    }
    previousTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  }, [callback]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [animate]);
};

/**
 * Performance-optimized scroll handler
 */
export const useOptimizedScroll = (callback, deps = []) => {
  const ticking = useRef(false);

  const handleScroll = useCallback(() => {
    if (!ticking.current) {
      requestAnimationFrame(() => {
        callback();
        ticking.current = false;
      });
      ticking.current = true;
    }
  }, deps);

  useEventListener('scroll', handleScroll);
};

// ===== COMPONENT OPTIMIZATIONS =====

/**
 * Higher-order component for performance optimization
 */
export const withPerformance = (Component) => {
  return memo(Component, (prevProps, nextProps) => {
    // Custom comparison logic
    const keys = Object.keys(nextProps);
    for (let key of keys) {
      if (prevProps[key] !== nextProps[key]) {
        return false;
      }
    }
    return true;
  });
};

/**
 * Optimized list renderer for large datasets
 */
export const VirtualizedList = memo(({ 
  items, 
  renderItem, 
  itemHeight = 50, 
  containerHeight = 400,
  overscan = 5 
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef();

  const handleScroll = useCallback(
    throttle((e) => {
      setScrollTop(e.target.scrollTop);
    }, 16), // ~60fps
    []
  );

  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight) + overscan,
    items.length
  );

  const visibleItems = items.slice(
    Math.max(0, visibleStart - overscan),
    visibleEnd
  );

  const offsetY = Math.max(0, visibleStart - overscan) * itemHeight;

  return (
    <div
      ref={containerRef}
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div key={item.id || index} style={{ height: itemHeight }}>
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

// ===== BUNDLE OPTIMIZATION =====

/**
 * Dynamic import wrapper with error handling
 */
export const lazyImport = (importFunc) => {
  return React.lazy(() =>
    importFunc().catch(err => {
      console.error('Lazy import failed:', err);
      // Return a fallback component
      return { default: () => <div>Failed to load component</div> };
    })
  );
};

/**
 * Preload critical resources
 */
export const preloadResource = (href, as = 'script') => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  document.head.appendChild(link);
};

// ===== CACHE OPTIMIZATIONS =====

/**
 * Simple memoization cache
 */
export const createMemoCache = (maxSize = 100) => {
  const cache = new Map();
  
  return (key, computeFn) => {
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = computeFn();
    
    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    cache.set(key, result);
    return result;
  };
};

/**
 * Hook for memoized expensive calculations
 */
export const useExpensiveCalculation = (computeFn, deps) => {
  return useMemo(() => {
    const startTime = performance.now();
    const result = computeFn();
    const endTime = performance.now();
    
    if (endTime - startTime > 16) { // More than one frame
      console.warn('Expensive calculation detected:', endTime - startTime, 'ms');
    }
    
    return result;
  }, deps);
};

// ===== PERFORMANCE MONITORING =====

/**
 * Performance monitor hook
 */
export const usePerformanceMonitor = (componentName) => {
  const renderCount = useRef(0);
  const startTime = useRef(performance.now());

  useEffect(() => {
    renderCount.current += 1;
    const renderTime = performance.now() - startTime.current;
    
    if (renderTime > 16) {
      console.warn(`${componentName} render took ${renderTime.toFixed(2)}ms`);
    }
    
    startTime.current = performance.now();
  });

  return renderCount.current;
};

// ===== EXPORT ALL OPTIMIZATIONS =====

export const PerformanceOptimizations = {
  debounce,
  throttle,
  rafThrottle,
  createLazyLoader,
  useLazyImage,
  useEventListener,
  useTimeout,
  useAnimationFrame,
  useOptimizedScroll,
  withPerformance,
  VirtualizedList,
  lazyImport,
  preloadResource,
  createMemoCache,
  useExpensiveCalculation,
  usePerformanceMonitor
};
