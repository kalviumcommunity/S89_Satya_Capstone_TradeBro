/**
 * Simple Performance Monitor
 * Lightweight performance tracking without causing re-renders
 */

import React from 'react';

class SimplePerformanceMonitor {
  constructor() {
    this.renderCounts = new Map();
    this.lastRenderTimes = new Map();
    this.warningThrottles = new Map();
    this.enabled = false; // Disabled to prevent console spam during signup
  }

  trackRender(componentName) {
    if (!this.enabled) return;

    const now = Date.now();
    const currentCount = (this.renderCounts.get(componentName) || 0) + 1;
    const lastTime = this.lastRenderTimes.get(componentName) || now;
    const timeSinceLastRender = now - lastTime;

    this.renderCounts.set(componentName, currentCount);
    this.lastRenderTimes.set(componentName, now);

    // Only log occasionally to avoid spam
    if (currentCount % 50 === 0) {
      console.log(`🔄 ${componentName} render #${currentCount} (${timeSinceLastRender}ms since last)`);
    }

    // Throttled warning for frequent renders
    if (timeSinceLastRender < 16 && currentCount > 10) {
      const lastWarning = this.warningThrottles.get(componentName) || 0;
      if (now - lastWarning > 10000) { // Only warn every 10 seconds
        console.warn(`⚠️ ${componentName} rendering too frequently (${timeSinceLastRender}ms)`);
        this.warningThrottles.set(componentName, now);
      }
    }
  }

  getStats(componentName) {
    return {
      renderCount: this.renderCounts.get(componentName) || 0,
      lastRenderTime: this.lastRenderTimes.get(componentName) || 0
    };
  }

  getAllStats() {
    const stats = {};
    for (const [componentName] of this.renderCounts) {
      stats[componentName] = this.getStats(componentName);
    }
    return stats;
  }

  reset(componentName) {
    if (componentName) {
      this.renderCounts.delete(componentName);
      this.lastRenderTimes.delete(componentName);
      this.warningThrottles.delete(componentName);
    } else {
      this.renderCounts.clear();
      this.lastRenderTimes.clear();
      this.warningThrottles.clear();
    }
  }

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }
}

// Create singleton instance
const performanceMonitor = new SimplePerformanceMonitor();

/**
 * Simple hook for performance tracking
 */
export const useSimplePerformanceTracking = (componentName) => {
  // Only track on mount and unmount to avoid re-render loops
  React.useEffect(() => {
    performanceMonitor.trackRender(componentName);
  });

  return {
    getStats: () => performanceMonitor.getStats(componentName),
    reset: () => performanceMonitor.reset(componentName)
  };
};

export default performanceMonitor;
