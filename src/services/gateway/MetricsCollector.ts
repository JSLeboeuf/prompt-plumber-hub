/**
 * Metrics Collector - Performance and usage monitoring
 * Collects and aggregates API metrics for monitoring and alerting
 */

import { logger } from '@/lib/logger';

export interface RequestMetric {
  endpoint: string;
  method: string;
  duration: number;
  success: boolean;
  timestamp: number;
  statusCode?: number;
  errorCode?: string;
  clientId?: string;
}

export interface AggregatedMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
  topEndpoints: Array<{ endpoint: string; count: number; avgDuration: number }>;
  topErrors: Array<{ code: string; count: number }>;
  timeRange: { start: number; end: number };
}

export interface MetricsWindow {
  windowStart: number;
  windowEnd: number;
  metrics: RequestMetric[];
}

export class MetricsCollector {
  private metrics: RequestMetric[] = [];
  private readonly maxMetrics = 10000; // Keep last 10k metrics in memory
  private readonly windowSize = 5 * 60 * 1000; // 5 minute windows
  private aggregationInterval: NodeJS.Timeout;

  constructor() {
    // Aggregate metrics every minute
    this.aggregationInterval = setInterval(() => {
      this.cleanupOldMetrics();
      this.logAggregatedMetrics();
    }, 60 * 1000);
  }

  /**
   * Record a successful request
   */
  recordRequest(
    endpoint: string,
    method: string,
    duration: number,
    success: boolean,
    statusCode?: number,
    clientId?: string
  ): void {
    const metric: RequestMetric = {
      endpoint,
      method,
      duration,
      success,
      timestamp: Date.now(),
      statusCode,
      clientId
    };

    this.metrics.push(metric);

    // Keep metrics array within bounds
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Record an error
   */
  recordError(
    endpoint: string,
    errorCode: string,
    duration: number,
    clientId?: string
  ): void {
    const metric: RequestMetric = {
      endpoint,
      method: 'UNKNOWN',
      duration,
      success: false,
      timestamp: Date.now(),
      errorCode,
      clientId
    };

    this.metrics.push(metric);

    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Get aggregated metrics for a time period
   */
  getAggregatedMetrics(periodMs = 5 * 60 * 1000): AggregatedMetrics {
    const now = Date.now();
    const cutoff = now - periodMs;
    const relevantMetrics = this.metrics.filter(m => m.timestamp > cutoff);

    if (relevantMetrics.length === 0) {
      return this.getEmptyMetrics(cutoff, now);
    }

    const durations = relevantMetrics.map(m => m.duration).sort((a, b) => a - b);
    const successfulRequests = relevantMetrics.filter(m => m.success).length;
    const failedRequests = relevantMetrics.length - successfulRequests;

    // Calculate percentiles
    const p95Index = Math.floor(durations.length * 0.95);
    const p99Index = Math.floor(durations.length * 0.99);

    // Group by endpoint
    const endpointStats = new Map<string, { count: number; totalDuration: number }>();
    for (const metric of relevantMetrics) {
      const current = endpointStats.get(metric.endpoint) || { count: 0, totalDuration: 0 };
      current.count += 1;
      current.totalDuration += metric.duration;
      endpointStats.set(metric.endpoint, current);
    }

    // Group by error code
    const errorStats = new Map<string, number>();
    for (const metric of relevantMetrics) {
      if (!metric.success && metric.errorCode) {
        const current = errorStats.get(metric.errorCode) || 0;
        errorStats.set(metric.errorCode, current + 1);
      }
    }

    return {
      totalRequests: relevantMetrics.length,
      successfulRequests,
      failedRequests,
      averageResponseTime: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      p95ResponseTime: durations[p95Index] || 0,
      p99ResponseTime: durations[p99Index] || 0,
      requestsPerSecond: relevantMetrics.length / (periodMs / 1000),
      errorRate: failedRequests / relevantMetrics.length,
      topEndpoints: Array.from(endpointStats.entries())
        .map(([endpoint, stats]) => ({
          endpoint,
          count: stats.count,
          avgDuration: stats.totalDuration / stats.count
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      topErrors: Array.from(errorStats.entries())
        .map(([code, count]) => ({ code, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      timeRange: { start: cutoff, end: now }
    };
  }

  /**
   * Get metrics for a specific endpoint
   */
  getEndpointMetrics(endpoint: string, periodMs = 5 * 60 * 1000): {
    totalRequests: number;
    successRate: number;
    averageResponseTime: number;
    recentErrors: Array<{ errorCode: string; timestamp: number }>;
  } {
    const now = Date.now();
    const cutoff = now - periodMs;
    const endpointMetrics = this.metrics.filter(
      m => m.endpoint === endpoint && m.timestamp > cutoff
    );

    const successCount = endpointMetrics.filter(m => m.success).length;
    const avgDuration = endpointMetrics.length > 0 ?
      endpointMetrics.reduce((sum, m) => sum + m.duration, 0) / endpointMetrics.length : 0;

    const recentErrors = endpointMetrics
      .filter(m => !m.success && m.errorCode)
      .map(m => ({ errorCode: m.errorCode!, timestamp: m.timestamp }))
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);

    return {
      totalRequests: endpointMetrics.length,
      successRate: endpointMetrics.length > 0 ? successCount / endpointMetrics.length : 0,
      averageResponseTime: avgDuration,
      recentErrors
    };
  }

  /**
   * Get real-time metrics dashboard data
   */
  getDashboardMetrics(): {
    current: AggregatedMetrics;
    previous: AggregatedMetrics;
    alerts: Array<{ type: string; message: string; severity: 'low' | 'medium' | 'high' }>;
  } {
    const current = this.getAggregatedMetrics(5 * 60 * 1000); // Last 5 minutes
    const previous = this.getAggregatedMetrics(10 * 60 * 1000); // Previous 5 minutes

    const alerts = this.generateAlerts(current, previous);

    return { current, previous, alerts };
  }

  /**
   * Generate alerts based on metrics
   */
  private generateAlerts(
    current: AggregatedMetrics,
    previous: AggregatedMetrics
  ): Array<{ type: string; message: string; severity: 'low' | 'medium' | 'high' }> {
    const alerts: Array<{ type: string; message: string; severity: 'low' | 'medium' | 'high' }> = [];

    // High error rate alert
    if (current.errorRate > 0.05) { // 5% error rate
      alerts.push({
        type: 'error_rate',
        message: `High error rate: ${(current.errorRate * 100).toFixed(1)}%`,
        severity: current.errorRate > 0.1 ? 'high' : 'medium'
      });
    }

    // High response time alert
    if (current.p95ResponseTime > 5000) { // 5 seconds
      alerts.push({
        type: 'response_time',
        message: `High response time: P95 = ${current.p95ResponseTime}ms`,
        severity: current.p95ResponseTime > 10000 ? 'high' : 'medium'
      });
    }

    // Traffic spike alert
    const trafficIncrease = current.requestsPerSecond / Math.max(previous.requestsPerSecond, 1);
    if (trafficIncrease > 2 && current.requestsPerSecond > 10) {
      alerts.push({
        type: 'traffic_spike',
        message: `Traffic spike: ${trafficIncrease.toFixed(1)}x increase`,
        severity: trafficIncrease > 5 ? 'high' : 'medium'
      });
    }

    // Low traffic alert (potential outage)
    if (current.requestsPerSecond < 0.1 && previous.requestsPerSecond > 1) {
      alerts.push({
        type: 'low_traffic',
        message: 'Unusually low traffic - potential outage',
        severity: 'high'
      });
    }

    return alerts;
  }

  /**
   * Get empty metrics structure
   */
  private getEmptyMetrics(start: number, end: number): AggregatedMetrics {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      requestsPerSecond: 0,
      errorRate: 0,
      topEndpoints: [],
      topErrors: [],
      timeRange: { start, end }
    };
  }

  /**
   * Clean up old metrics to prevent memory leaks
   */
  private cleanupOldMetrics(): void {
    const cutoff = Date.now() - (60 * 60 * 1000); // Keep 1 hour of data
    const initialLength = this.metrics.length;
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff);

    const cleaned = initialLength - this.metrics.length;
    if (cleaned > 0) {
      logger.debug('Cleaned up old metrics', { cleaned, remaining: this.metrics.length });
    }
  }

  /**
   * Log aggregated metrics periodically
   */
  private logAggregatedMetrics(): void {
    const metrics = this.getAggregatedMetrics(60 * 1000); // Last minute

    if (metrics.totalRequests > 0) {
      logger.info('API Metrics Summary', {
        totalRequests: metrics.totalRequests,
        successRate: `${((1 - metrics.errorRate) * 100).toFixed(1)}%`,
        avgResponseTime: `${metrics.averageResponseTime.toFixed(0)}ms`,
        p95ResponseTime: `${metrics.p95ResponseTime.toFixed(0)}ms`,
        requestsPerSecond: metrics.requestsPerSecond.toFixed(1),
        topEndpoints: metrics.topEndpoints.slice(0, 3)
      });
    }
  }

  /**
   * Export metrics for external monitoring systems
   */
  exportMetrics(format: 'prometheus' | 'json' = 'json'): string {
    const metrics = this.getAggregatedMetrics();

    if (format === 'prometheus') {
      return this.formatPrometheusMetrics(metrics);
    }

    return JSON.stringify(metrics, null, 2);
  }

  /**
   * Format metrics for Prometheus
   */
  private formatPrometheusMetrics(metrics: AggregatedMetrics): string {
    const lines: string[] = [];

    lines.push(`# HELP api_requests_total Total number of API requests`);
    lines.push(`# TYPE api_requests_total counter`);
    lines.push(`api_requests_total ${metrics.totalRequests}`);

    lines.push(`# HELP api_request_duration_seconds Request duration in seconds`);
    lines.push(`# TYPE api_request_duration_seconds histogram`);
    lines.push(`api_request_duration_seconds_sum ${metrics.averageResponseTime / 1000}`);
    lines.push(`api_request_duration_seconds_count ${metrics.totalRequests}`);

    lines.push(`# HELP api_error_rate Current error rate`);
    lines.push(`# TYPE api_error_rate gauge`);
    lines.push(`api_error_rate ${metrics.errorRate}`);

    return lines.join('\n');
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.aggregationInterval) {
      clearInterval(this.aggregationInterval);
    }
    this.metrics = [];
  }
}