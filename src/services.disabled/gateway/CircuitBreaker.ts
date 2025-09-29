/**
 * Circuit Breaker Pattern Implementation
 * Prevents cascading failures by monitoring service health
 * and temporarily blocking requests to failing services
 */

import { logger } from '@/lib/logger';

export interface CircuitBreakerConfig {
  failureThreshold: number;    // Number of failures before opening
  recoveryTimeout: number;     // Time to wait before trying again (ms)
  monitoringPeriod: number;    // Sliding window for failure counting (ms)
  minimumThroughput?: number;  // Minimum requests before circuit can open
}

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface FailureRecord {
  timestamp: number;
  error: string;
}

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failures: FailureRecord[] = [];
  private lastFailureTime = 0;
  private nextAttemptTime = 0;
  private successCount = 0;
  private config: Required<CircuitBreakerConfig>;

  constructor(config: CircuitBreakerConfig) {
    this.config = {
      minimumThroughput: 10,
      ...config
    };
  }

  /**
   * Check if circuit breaker allows request through
   */
  isOpen(): boolean {
    this.updateState();
    return this.state === 'OPEN';
  }

  /**
   * Record a successful operation
   */
  recordSuccess(): void {
    this.successCount++;

    if (this.state === 'HALF_OPEN') {
      // Successful request in half-open state - close the circuit
      this.state = 'CLOSED';
      this.failures = [];
      this.lastFailureTime = 0;
      this.successCount = 0;

      logger.info('Circuit breaker closed after successful recovery attempt');
    } else if (this.state === 'CLOSED') {
      // Clean up old failure records in closed state
      this.cleanupOldFailures();
    }
  }

  /**
   * Record a failed operation
   */
  recordFailure(error?: string): void {
    const now = Date.now();
    this.failures.push({
      timestamp: now,
      error: error || 'Unknown error'
    });
    this.lastFailureTime = now;

    // Clean up old failures outside monitoring window
    this.cleanupOldFailures();

    if (this.state === 'HALF_OPEN') {
      // Failure in half-open state - reopen circuit
      this.state = 'OPEN';
      this.nextAttemptTime = now + this.config.recoveryTimeout;

      logger.warn('Circuit breaker reopened after failed recovery attempt', {
        failures: this.failures.length,
        error
      });
    } else if (this.state === 'CLOSED' && this.shouldOpenCircuit()) {
      // Too many failures in closed state - open circuit
      this.state = 'OPEN';
      this.nextAttemptTime = now + this.config.recoveryTimeout;

      logger.warn('Circuit breaker opened due to failure threshold', {
        failures: this.failures.length,
        threshold: this.config.failureThreshold,
        monitoringPeriod: this.config.monitoringPeriod
      });
    }
  }

  /**
   * Get current circuit breaker state
   */
  getState(): CircuitState {
    this.updateState();
    return this.state;
  }

  /**
   * Get circuit breaker metrics
   */
  getMetrics(): {
    state: CircuitState;
    failureCount: number;
    successCount: number;
    lastFailureTime: number;
    nextAttemptTime: number;
    failureRate: number;
  } {
    this.updateState();
    this.cleanupOldFailures();

    const totalRequests = this.failures.length + this.successCount;
    const failureRate = totalRequests > 0 ? this.failures.length / totalRequests : 0;

    return {
      state: this.state,
      failureCount: this.failures.length,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime,
      failureRate
    };
  }

  /**
   * Manually reset circuit breaker to closed state
   */
  reset(): void {
    this.state = 'CLOSED';
    this.failures = [];
    this.lastFailureTime = 0;
    this.nextAttemptTime = 0;
    this.successCount = 0;

    logger.info('Circuit breaker manually reset to closed state');
  }

  /**
   * Update state based on current conditions
   */
  private updateState(): void {
    const now = Date.now();

    if (this.state === 'OPEN' && now >= this.nextAttemptTime) {
      // Transition from OPEN to HALF_OPEN for recovery attempt
      this.state = 'HALF_OPEN';
      logger.info('Circuit breaker transitioning to half-open for recovery attempt');
    }
  }

  /**
   * Check if circuit should be opened based on failure threshold
   */
  private shouldOpenCircuit(): boolean {
    const recentFailures = this.failures.length;
    const totalRequests = recentFailures + this.successCount;

    // Need minimum throughput before circuit can open
    if (totalRequests < this.config.minimumThroughput) {
      return false;
    }

    // Open if failure count exceeds threshold
    return recentFailures >= this.config.failureThreshold;
  }

  /**
   * Remove failure records outside the monitoring window
   */
  private cleanupOldFailures(): void {
    const cutoff = Date.now() - this.config.monitoringPeriod;
    this.failures = this.failures.filter(failure => failure.timestamp > cutoff);
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.isOpen()) {
      throw new Error('Circuit breaker is open');
    }

    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure(error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Execute with fallback function when circuit is open
   */
  async executeWithFallback<T>(
    fn: () => Promise<T>,
    fallback: () => Promise<T>
  ): Promise<T> {
    if (this.isOpen()) {
      logger.info('Circuit breaker open, executing fallback');
      return fallback();
    }

    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure(error instanceof Error ? error.message : String(error));

      // If circuit opened during execution, try fallback
      if (this.isOpen()) {
        logger.info('Circuit opened during execution, trying fallback');
        return fallback();
      }

      throw error;
    }
  }
}