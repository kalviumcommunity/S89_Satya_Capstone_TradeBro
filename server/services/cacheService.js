/**
 * Cache Service
 * Production-ready caching with node-cache and Redis fallback
 */

const NodeCache = require('node-cache');

// Try to use Redis if available, otherwise use node-cache
let redis;
try {
  redis = require('redis');
} catch (error) {
  console.warn('Redis not available, using node-cache for caching');
  redis = null;
}

class CacheService {
  constructor() {
    this.useRedis = false;
    this.redisClient = null;
    this.nodeCache = null;
    this.defaultTTL = 15 * 60; // 15 minutes in seconds
    
    this.initializeCache();
  }

  /**
   * Initialize cache service (Redis or node-cache)
   */
  async initializeCache() {
    // Try Redis first if available
    if (redis && process.env.REDIS_URL) {
      try {
        this.redisClient = redis.createClient({
          url: process.env.REDIS_URL,
          retry_strategy: (options) => {
            if (options.error && options.error.code === 'ECONNREFUSED') {
              console.error('Redis connection refused');
              return new Error('Redis connection refused');
            }
            if (options.total_retry_time > 1000 * 60 * 60) {
              return new Error('Redis retry time exhausted');
            }
            if (options.attempt > 10) {
              return undefined;
            }
            return Math.min(options.attempt * 100, 3000);
          }
        });

        await this.redisClient.connect();
        this.useRedis = true;
        console.log('✅ Redis cache service initialized');
        
        // Handle Redis errors
        this.redisClient.on('error', (err) => {
          console.error('Redis error:', err);
          this.fallbackToNodeCache();
        });

      } catch (error) {
        console.warn('Redis initialization failed, falling back to node-cache:', error.message);
        this.fallbackToNodeCache();
      }
    } else {
      this.fallbackToNodeCache();
    }
  }

  /**
   * Fallback to node-cache when Redis is unavailable
   */
  fallbackToNodeCache() {
    this.useRedis = false;
    this.nodeCache = new NodeCache({
      stdTTL: this.defaultTTL,
      checkperiod: 120, // Check for expired keys every 2 minutes
      useClones: false, // Better performance
      deleteOnExpire: true,
      maxKeys: 1000 // Limit memory usage
    });
    console.log('✅ Node-cache service initialized');
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {Promise<any|null>} Cached value or null
   */
  async get(key) {
    try {
      if (this.useRedis && this.redisClient) {
        const value = await this.redisClient.get(key);
        return value ? JSON.parse(value) : null;
      } else if (this.nodeCache) {
        return this.nodeCache.get(key) || null;
      }
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set value in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in seconds (optional)
   * @returns {Promise<boolean>} Success status
   */
  async set(key, value, ttl = this.defaultTTL) {
    try {
      if (this.useRedis && this.redisClient) {
        await this.redisClient.setEx(key, ttl, JSON.stringify(value));
        return true;
      } else if (this.nodeCache) {
        return this.nodeCache.set(key, value, ttl);
      }
      return false;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Delete value from cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} Success status
   */
  async del(key) {
    try {
      if (this.useRedis && this.redisClient) {
        await this.redisClient.del(key);
        return true;
      } else if (this.nodeCache) {
        return this.nodeCache.del(key) > 0;
      }
      return false;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * Clear all cache
   * @returns {Promise<boolean>} Success status
   */
  async clear() {
    try {
      if (this.useRedis && this.redisClient) {
        await this.redisClient.flushAll();
        return true;
      } else if (this.nodeCache) {
        this.nodeCache.flushAll();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Cache clear error:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getStats() {
    if (this.useRedis) {
      return {
        type: 'redis',
        connected: this.redisClient?.isReady || false
      };
    } else if (this.nodeCache) {
      return {
        type: 'node-cache',
        ...this.nodeCache.getStats()
      };
    }
    return { type: 'none', connected: false };
  }

  /**
   * Check if cache service is ready
   * @returns {boolean} Ready status
   */
  isReady() {
    if (this.useRedis) {
      return this.redisClient?.isReady || false;
    }
    return !!this.nodeCache;
  }
}

// Create singleton instance
const cacheService = new CacheService();

module.exports = cacheService;
