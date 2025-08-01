/**
 * Cache Management Utility
 * Handles caching logic with TTL support and automatic cleanup
 */

const { getCacheTTL, getCacheConfig } = require('../config/cacheTTL');

class CacheManager {
  constructor() {
    this.data = new Map();
    this.timestamps = new Map();
    this.config = getCacheConfig();
    
    // Start cleanup interval if enabled
    if (this.config.enabled && this.config.cleanupInterval) {
      this.startCleanupInterval();
    }
  }

  /**
   * Check if cache entry is valid
   * @param {string} key - Cache key
   * @param {string} type - Data type for TTL lookup
   * @returns {boolean} True if cache is valid
   */
  isValid(key, type = 'DEFAULT') {
    if (!this.config.enabled) return false;
    if (!this.timestamps.has(key)) return false;
    
    const now = Date.now();
    const timestamp = this.timestamps.get(key);
    const ttl = getCacheTTL(type);
    
    return (now - timestamp) < ttl;
  }

  /**
   * Get cached data
   * @param {string} key - Cache key
   * @param {string} type - Data type for TTL lookup
   * @returns {any|null} Cached data or null if invalid/missing
   */
  get(key, type = 'DEFAULT') {
    if (!this.isValid(key, type)) {
      this.delete(key);
      return null;
    }
    
    return this.data.get(key);
  }

  /**
   * Set cache data
   * @param {string} key - Cache key
   * @param {any} value - Data to cache
   * @param {string} type - Data type for TTL lookup
   */
  set(key, value, type = 'DEFAULT') {
    if (!this.config.enabled) return;
    
    // Check if we need to make room
    if (this.data.size >= this.config.maxSize) {
      this.cleanup();
    }
    
    this.data.set(key, value);
    this.timestamps.set(key, Date.now());
  }

  /**
   * Delete cache entry
   * @param {string} key - Cache key
   */
  delete(key) {
    this.data.delete(key);
    this.timestamps.delete(key);
  }

  /**
   * Clear all cache
   */
  clear() {
    this.data.clear();
    this.timestamps.clear();
  }

  /**
   * Get cache statistics
   * @returns {object} Cache statistics
   */
  getStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;
    
    for (const [key, timestamp] of this.timestamps) {
      const age = now - timestamp;
      if (age < getCacheTTL('DEFAULT')) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    }
    
    return {
      totalEntries: this.data.size,
      validEntries,
      expiredEntries,
      maxSize: this.config.maxSize,
      memoryUsage: this.getMemoryUsage()
    };
  }

  /**
   * Get cache info for debugging
   * @returns {object} Cache information
   */
  getInfo() {
    const info = {
      keys: Array.from(this.data.keys()),
      timestamps: {},
      stats: this.getStats()
    };
    
    // Add timestamp info for each key
    for (const [key, timestamp] of this.timestamps) {
      info.timestamps[key] = {
        timestamp,
        age: Date.now() - timestamp,
        isValid: this.isValid(key)
      };
    }
    
    return info;
  }

  /**
   * Cleanup expired entries
   */
  cleanup() {
    const now = Date.now();
    const keysToDelete = [];
    
    for (const [key, timestamp] of this.timestamps) {
      const age = now - timestamp;
      if (age > getCacheTTL('DEFAULT')) {
        keysToDelete.push(key);
      }
    }
    
    // If still too many entries, remove oldest ones
    if (this.data.size - keysToDelete.length > this.config.maxSize) {
      const sortedEntries = Array.from(this.timestamps.entries())
        .sort((a, b) => a[1] - b[1]); // Sort by timestamp (oldest first)
      
      const additionalToDelete = this.data.size - keysToDelete.length - this.config.maxSize;
      for (let i = 0; i < additionalToDelete; i++) {
        keysToDelete.push(sortedEntries[i][0]);
      }
    }
    
    keysToDelete.forEach(key => this.delete(key));
    
    if (keysToDelete.length > 0) {
      console.log(`Cache cleanup: removed ${keysToDelete.length} entries`);
    }
  }

  /**
   * Start automatic cleanup interval
   */
  startCleanupInterval() {
    setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Estimate memory usage (rough calculation)
   * @returns {string} Memory usage estimate
   */
  getMemoryUsage() {
    let totalSize = 0;
    
    for (const value of this.data.values()) {
      totalSize += JSON.stringify(value).length * 2; // Rough estimate (UTF-16)
    }
    
    if (totalSize < 1024) return `${totalSize} bytes`;
    if (totalSize < 1024 * 1024) return `${(totalSize / 1024).toFixed(2)} KB`;
    return `${(totalSize / (1024 * 1024)).toFixed(2)} MB`;
  }
}

// Create singleton instance
const cache = new CacheManager();

module.exports = {
  cache,
  CacheManager
};
