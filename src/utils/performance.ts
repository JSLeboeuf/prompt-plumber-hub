/**
 * UTILITAIRES DE PERFORMANCE - Remplacement optimisé
 */

import React from 'react';
import { logger } from '@/lib/logger';

// Remplacement des console.log pour la production
export const devLog = {
  info: (message: string, data?: unknown) => {
    if (process.env.NODE_ENV === 'development') {
      logger.info(message, data ? { data } : undefined);
    }
  },
  warn: (message: string, data?: unknown) => {
    if (process.env.NODE_ENV === 'development') {
      logger.warn(message, data ? { data } : undefined);
    }
  },
  error: (message: string, error?: unknown) => {
    logger.error(message, error instanceof Error ? error : new Error(String(error)));
  }
};

// Métriques de performance optimisées
export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage?: {
    used: number;
    total: number;
    limit: number;
  };
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();
  private startTimes: Map<string, number> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startMeasure(name: string): void {
    this.startTimes.set(name, performance.now());
  }

  endMeasure(name: string): number {
    const startTime = this.startTimes.get(name);
    if (!startTime) return 0;
    
    const duration = performance.now() - startTime;
    this.metrics.set(name, duration);
    this.startTimes.delete(name);
    
    devLog.info(`Performance: ${name}`, { duration: `${duration.toFixed(2)}ms` });
    return duration;
  }

  getMetric(name: string): number | undefined {
    return this.metrics.get(name);
  }

  getAllMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  getMemoryUsage(): PerformanceMetrics['memoryUsage'] {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const memory = (performance as unknown as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
      if (memory) {
        return {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit
        };
      }
    }
    return undefined;
  }

  clear(): void {
    this.metrics.clear();
    this.startTimes.clear();
  }
}

// Hook pour surveiller les performances des composants
export function withPerformanceMonitoring<T extends Record<string, unknown>>(
  componentName: string,
  Component: React.ComponentType<T>
): React.ComponentType<T> {
  return function PerformanceMonitoredComponent(props: T) {
    const monitor = PerformanceMonitor.getInstance();
    
    React.useEffect(() => {
      monitor.startMeasure(`${componentName}_mount`);
      return () => {
        monitor.endMeasure(`${componentName}_mount`);
      };
    }, [monitor]);

    React.useEffect(() => {
      monitor.startMeasure(`${componentName}_render`);
      monitor.endMeasure(`${componentName}_render`);
    });

    return React.createElement(Component, props);
  };
}

// Utilitaire pour les mesures de temps
export function measureTime<T>(
  operation: () => T | Promise<T>,
  name: string
): T | Promise<T> {
  const monitor = PerformanceMonitor.getInstance();
  
  if (operation.constructor.name === 'AsyncFunction') {
    return (async () => {
      monitor.startMeasure(name);
      try {
        const result = await (operation() as Promise<T>);
        return result;
      } finally {
        monitor.endMeasure(name);
      }
    })();
  } else {
    monitor.startMeasure(name);
    try {
      return operation() as T;
    } finally {
      monitor.endMeasure(name);
    }
  }
}

// Optimisation du bundle - lazy loading helper
export function createLazyComponent(
  factory: () => Promise<{ default: React.ComponentType }>
) {
  return React.lazy(factory);
}

// Export par défaut
export default {
  devLog,
  PerformanceMonitor,
  withPerformanceMonitoring,
  measureTime,
  createLazyComponent
};