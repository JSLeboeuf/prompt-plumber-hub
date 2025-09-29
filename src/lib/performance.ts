/**
 * Performance Monitoring Utility
 * Track and report application performance metrics
 */

import { logger } from './logger';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

interface AppPerformanceTiming {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, unknown>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private timings: Map<string, AppPerformanceTiming> = new Map();
  private observers: Map<string, PerformanceObserver> = new Map();
  private reportInterval: number = 60000; // 1 minute
  private maxMetrics: number = 1000;

  constructor() {
    this.initializeObservers();
    this.startReporting();
  }

  /**
   * Initialize performance observers
   */
  private initializeObservers(): void {
    // Observe navigation timing
    if ('PerformanceObserver' in window) {
      try {
        // Navigation timing
        const navObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              const nav = entry as PerformanceNavigationTiming;
              this.recordMetric('page_load', nav.loadEventEnd - nav.fetchStart, 'ms', {
                type: 'navigation',
                domContentLoaded: nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart,
                domInteractive: nav.domInteractive - nav.fetchStart,
              });
            }
          }
        });
        navObserver.observe({ entryTypes: ['navigation'] });
        this.observers.set('navigation', navObserver);

        // Long tasks
        const taskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) { // Tasks longer than 50ms
              this.recordMetric('long_task', entry.duration, 'ms', {
                name: entry.name,
                startTime: entry.startTime,
              });
              logger.warn('Long task detected', {
                duration: entry.duration,
                name: entry.name,
              });
            }
          }
        });
        taskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.set('longtask', taskObserver);

        // Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          if (entries.length === 0) return;
          const lastEntry = entries[entries.length - 1] as PerformanceEntry;
          this.recordMetric('lcp', (lastEntry as any).startTime, 'ms', {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            element: (lastEntry as any).element?.tagName,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            size: (lastEntry as any).size,
          });
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.set('lcp', lcpObserver);

        // First Input Delay
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const fid = entry as PerformanceEventTiming;
            this.recordMetric('fid', fid.processingStart - fid.startTime, 'ms', {
              name: fid.name,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              target: (fid as any).target?.tagName,
            });
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.set('fid', fidObserver);

        // Cumulative Layout Shift
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (!(entry as any).hadRecentInput) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              clsValue += (entry as any).value;
              this.recordMetric('cls', clsValue, 'score', {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                sources: (entry as any).sources?.length,
              });
            }
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.set('cls', clsObserver);
      } catch (error) {
        logger.error('Failed to initialize performance observers', { error });
      }
    }
  }

  /**
   * Start a performance timing
   */
  startTiming(name: string, metadata?: Record<string, unknown>): void {
    this.timings.set(name, {
      name,
      startTime: performance.now(),
      metadata,
    } as AppPerformanceTiming);
  }

  /**
   * End a performance timing
   */
  endTiming(name: string): number | null {
    const timing = this.timings.get(name);
    if (!timing) {
      logger.warn(`Timing ${name} not found`);
      return null;
    }

    timing.endTime = performance.now();
    timing.duration = timing.endTime - timing.startTime;

    this.recordMetric(`timing_${name}`, timing.duration, 'ms', timing.metadata);
    this.timings.delete(name);

    return timing.duration;
  }

  /**
   * Record a performance metric
   */
  recordMetric(
    name: string,
    value: number,
    unit: string = 'ms',
    metadata?: Record<string, unknown>
  ): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
    };
    
    if (metadata !== undefined) {
      metric.metadata = metadata;
    }

    this.metrics.push(metric);

    // Limit stored metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Log if metric exceeds threshold
    this.checkThresholds(metric);
  }

  /**
   * Check if metrics exceed thresholds
   */
  private checkThresholds(metric: PerformanceMetric): void {
    const thresholds: Record<string, number> = {
      page_load: 3000, // 3 seconds
      lcp: 2500, // 2.5 seconds
      fid: 100, // 100ms
      cls: 0.1, // 0.1 score
      long_task: 200, // 200ms
    };

    const threshold = thresholds[metric.name];
    if (threshold && metric.value > threshold) {
      logger.warn(`Performance threshold exceeded: ${metric.name}`, {
        value: metric.value,
        threshold,
        unit: metric.unit,
      });
    }
  }

  /**
   * Get current memory usage
   */
  getMemoryUsage(): Record<string, number> | null {
    if ('memory' in performance) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const memory = (performance as any).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        percentUsed: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
      };
    }
    return null;
  }

  /**
   * Get performance metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Clear stored metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Start automatic reporting
   */
  private startReporting(): void {
    setInterval(() => {
      this.generateReport();
    }, this.reportInterval);
  }

  /**
   * Generate performance report
   */
  private generateReport(): void {
    const memory = this.getMemoryUsage();
    const recentMetrics = this.metrics.slice(-10);

    const report = {
      timestamp: Date.now(),
      memory,
      recentMetrics,
      totalMetrics: this.metrics.length,
    };

    logger.info('Performance report', report);
  }

  /**
   * Cleanup observers
   */
  cleanup(): void {
    for (const observer of this.observers.values()) {
      observer.disconnect();
    }
    this.observers.clear();
  }
}

// Create global instance
const performanceMonitor = new PerformanceMonitor();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    performanceMonitor.cleanup();
  });
}

export default performanceMonitor;