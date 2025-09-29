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

interface PerformanceTiming {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, unknown>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private timings: Map<string, PerformanceTiming> = new Map();
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
          const lastEntry = entries[entries.length - 1];
          this.recordMetric('lcp', lastEntry.startTime, 'ms', {
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
    });
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
      metadata,
    };

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
   * Get all metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics summary
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getMetricsSummary(): Record<string, any> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const summary: Record<string, any> = {
      totalMetrics: this.metrics.length,
      metrics: {},
    };

    // Group metrics by name and calculate statistics
    const grouped = this.metrics.reduce((acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = [];
      }
      acc[metric.name].push(metric.value);
      return acc;
    }, {} as Record<string, number[]>);

    for (const [name, values] of Object.entries(grouped)) {
      const sorted = values.sort((a, b) => a - b);
      summary.metrics[name] = {
        count: values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        median: sorted[Math.floor(sorted.length / 2)],
        p95: sorted[Math.floor(sorted.length * 0.95)],
        p99: sorted[Math.floor(sorted.length * 0.99)],
      };
    }

    // Add memory usage
    summary.memory = this.getMemoryUsage();

    return summary;
  }

  /**
   * Start periodic reporting
   */
  private startReporting(): void {
    setInterval(() => {
      const summary = this.getMetricsSummary();
      if (summary.totalMetrics > 0) {
        logger.info('Performance metrics summary', summary);
      }
    }, this.reportInterval);
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    this.timings.clear();
  }

  /**
   * Destroy observers
   */
  destroy(): void {
    for (const observer of this.observers.values()) {
      observer.disconnect();
    }
    this.observers.clear();
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * React hook for performance timing
 */
export function usePerformanceTiming(name: string) {
  const start = () => performanceMonitor.startTiming(name);
  const end = () => performanceMonitor.endTiming(name);

  return { start, end };
}

/**
 * Measure component render time
 */
export function measureRenderTime(componentName: string) {
  return function decorator<T extends { new(...args: unknown[]): object }>(constructor: T) {
    return class extends constructor {
      componentDidMount() {
        performanceMonitor.recordMetric(
          `render_${componentName}`,
          performance.now(),
          'ms'
        );
        if (super.componentDidMount) {
          super.componentDidMount();
        }
      }
    };
  };
}

/**
 * Performance mark utility
 */
export function mark(name: string): void {
  if ('mark' in performance) {
    performance.mark(name);
  }
}

/**
 * Performance measure utility
 */
export function measure(name: string, startMark: string, endMark: string): void {
  if ('measure' in performance) {
    try {
      performance.measure(name, startMark, endMark);
      const measures = performance.getEntriesByName(name, 'measure');
      if (measures.length > 0) {
        const measure = measures[measures.length - 1];
        performanceMonitor.recordMetric(`measure_${name}`, measure.duration, 'ms');
      }
    } catch (error) {
      logger.error('Performance measure failed', { error, name, startMark, endMark });
    }
  }
}

/**
 * Web Vitals tracking
 */
export const webVitals = {
  getLCP: () => performanceMonitor.getMetrics().find(m => m.name === 'lcp')?.value,
  getFID: () => performanceMonitor.getMetrics().find(m => m.name === 'fid')?.value,
  getCLS: () => performanceMonitor.getMetrics().find(m => m.name === 'cls')?.value,
  getTTFB: () => {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    return nav ? nav.responseStart - nav.fetchStart : null;
  },
  getFCP: () => {
    const fcp = performance.getEntriesByName('first-contentful-paint')[0];
    return fcp ? fcp.startTime : null;
  },
};