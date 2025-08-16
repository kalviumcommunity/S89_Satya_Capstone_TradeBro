/**
 * Performance Configuration
 * Centralized performance settings and optimizations
 */

export const PERFORMANCE_CONFIG = {
  // Animation settings
  ANIMATIONS: {
    DURATION: {
      FAST: 0.15,
      NORMAL: 0.3,
      SLOW: 0.6
    },
    EASING: {
      EASE_OUT: [0.4, 0, 0.2, 1],
      EASE_IN: [0.4, 0, 1, 1],
      EASE_IN_OUT: [0.4, 0, 0.2, 1]
    },
    REDUCED_MOTION_DURATION: 0.01
  },

  // Debounce and throttle delays
  TIMING: {
    DEBOUNCE: {
      SEARCH: 300,
      INPUT: 500,
      RESIZE: 250
    },
    THROTTLE: {
      SCROLL: 16, // 60fps
      MOUSE_MOVE: 16,
      API_CALLS: 1000,
      RENDER_UPDATES: 100
    }
  },

  // Cache settings
  CACHE: {
    MAX_SIZE: 1000,
    TTL: {
      SHORT: 60000,    // 1 minute
      MEDIUM: 300000,  // 5 minutes
      LONG: 1800000    // 30 minutes
    }
  },

  // Virtual scrolling
  VIRTUAL_SCROLL: {
    ITEM_HEIGHT: 60,
    OVERSCAN: 5,
    BUFFER_SIZE: 10
  },

  // API optimization
  API: {
    BATCH_SIZE: 10,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
    TIMEOUT: 30000
  },

  // Real-time updates
  REAL_TIME: {
    UPDATE_INTERVAL: 30000, // 30 seconds
    MARKET_HOURS_INTERVAL: 15000, // 15 seconds during market hours
    AFTER_HOURS_INTERVAL: 60000,  // 1 minute after hours
    MAX_RECONNECT_ATTEMPTS: 5,
    RECONNECT_DELAY: 5000
  },

  // Memory management
  MEMORY: {
    MAX_HISTORY_ITEMS: 1000,
    MAX_CACHE_ENTRIES: 500,
    CLEANUP_INTERVAL: 300000 // 5 minutes
  },

  // Performance thresholds
  THRESHOLDS: {
    FPS: {
      GOOD: 55,
      WARNING: 30,
      CRITICAL: 15
    },
    MEMORY: {
      GOOD: 50,    // MB
      WARNING: 100,
      CRITICAL: 200
    },
    RENDER_TIME: {
      GOOD: 16,    // ms
      WARNING: 33,
      CRITICAL: 50
    }
  }
};

/**
 * Performance optimization utilities
 */
export const PERFORMANCE_UTILS = {
  // Check if device has limited resources
  isLowEndDevice: () => {
    const memory = navigator.deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;
    return memory <= 2 || cores <= 2;
  },

  // Check if user prefers reduced motion
  prefersReducedMotion: () => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  // Check if device is mobile
  isMobileDevice: () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  },

  // Get optimal settings based on device capabilities
  getOptimalSettings: () => {
    const isLowEnd = PERFORMANCE_UTILS.isLowEndDevice();
    const isMobile = PERFORMANCE_UTILS.isMobileDevice();
    const reducedMotion = PERFORMANCE_UTILS.prefersReducedMotion();

    return {
      animations: {
        enabled: !reducedMotion && !isLowEnd,
        duration: reducedMotion ? 0.01 : isLowEnd ? 0.15 : 0.3
      },
      realTime: {
        interval: isLowEnd ? 60000 : isMobile ? 45000 : 30000
      },
      cache: {
        maxSize: isLowEnd ? 100 : 1000
      },
      virtualScroll: {
        enabled: true,
        overscan: isLowEnd ? 2 : 5
      }
    };
  }
};

/**
 * Performance monitoring configuration
 */
export const MONITORING_CONFIG = {
  ENABLED: process.env.NODE_ENV === 'development',
  METRICS: {
    FPS: true,
    MEMORY: true,
    RENDER_TIME: true,
    COMPONENT_COUNT: true,
    API_RESPONSE_TIME: true
  },
  ALERTS: {
    LOW_FPS: true,
    HIGH_MEMORY: true,
    SLOW_RENDERS: true
  },
  LOGGING: {
    CONSOLE: true,
    ANALYTICS: false // Set to true for production analytics
  }
};

/**
 * Component-specific optimizations
 */
export const COMPONENT_OPTIMIZATIONS = {
  Dashboard: {
    updateInterval: 30000,
    maxVisibleItems: 50,
    enableVirtualScroll: true
  },
  Charts: {
    maxDataPoints: 1000,
    updateInterval: 15000,
    enableLiveUpdates: true
  },
  StockList: {
    itemHeight: 60,
    maxVisibleItems: 20,
    enableVirtualScroll: true
  },
  MarketTicker: {
    updateInterval: 8000,
    maxItems: 10,
    enableAnimations: true
  },
  Portfolio: {
    updateInterval: 30000,
    maxPositions: 100,
    enableRealTime: true
  }
};

/**
 * Bundle splitting configuration
 */
export const BUNDLE_CONFIG = {
  LAZY_ROUTES: [
    'Charts',
    'Portfolio',
    'History',
    'Settings',
    'Profile'
  ],
  PRELOAD_ROUTES: [
    'Dashboard',
    'Login',
    'Signup'
  ],
  CHUNK_NAMES: {
    vendor: 'vendor',
    common: 'common',
    runtime: 'runtime'
  }
};

/**
 * Service Worker configuration for caching
 */
export const SW_CONFIG = {
  CACHE_STRATEGIES: {
    API: 'NetworkFirst',
    STATIC: 'CacheFirst',
    IMAGES: 'CacheFirst',
    FONTS: 'CacheFirst'
  },
  CACHE_NAMES: {
    STATIC: 'tradebro-static-v1',
    API: 'tradebro-api-v1',
    IMAGES: 'tradebro-images-v1'
  },
  MAX_AGE: {
    STATIC: 86400000,  // 24 hours
    API: 300000,       // 5 minutes
    IMAGES: 604800000  // 7 days
  }
};

/**
 * Error boundaries configuration
 */
export const ERROR_BOUNDARY_CONFIG = {
  FALLBACK_COMPONENTS: {
    Dashboard: 'DashboardFallback',
    Charts: 'ChartsFallback',
    Portfolio: 'PortfolioFallback'
  },
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  LOGGING: {
    ENABLED: true,
    ENDPOINT: '/api/errors'
  }
};

export default {
  PERFORMANCE_CONFIG,
  PERFORMANCE_UTILS,
  MONITORING_CONFIG,
  COMPONENT_OPTIMIZATIONS,
  BUNDLE_CONFIG,
  SW_CONFIG,
  ERROR_BOUNDARY_CONFIG
};
