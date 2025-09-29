/**
 * Comprehensive Error Handling Strategy
 * Implements standardized error handling with categorization, retry logic,
 * and circuit breaker patterns for external services
 */

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

import { logger } from '@/lib/logger';
import { CircuitBreaker } from '@/services/gateway/CircuitBreaker';

// Error Categories
export enum ErrorCategory {
  CLIENT_ERROR = 'CLIENT_ERROR',           // 4xx - Client side issues
  SERVER_ERROR = 'SERVER_ERROR',           // 5xx - Server side issues
  NETWORK_ERROR = 'NETWORK_ERROR',         // Network connectivity issues
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',         // Request timeouts
  VALIDATION_ERROR = 'VALIDATION_ERROR',   // Data validation failures
  AUTHENTICATION_ERROR = 'AUTH_ERROR',     // Auth/authz failures
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',   // Rate limiting
  EXTERNAL_SERVICE_ERROR = 'EXT_ERROR',    // External service failures
  DATABASE_ERROR = 'DATABASE_ERROR',       // Database connectivity/query issues
  CONFIGURATION_ERROR = 'CONFIG_ERROR'     // Configuration/setup issues
}

// Error Severity Levels
export enum ErrorSeverity {
  LOW = 'LOW',           // Minor issues, app continues normally
  MEDIUM = 'MEDIUM',     // Significant but recoverable issues
  HIGH = 'HIGH',         // Major issues affecting functionality
  CRITICAL = 'CRITICAL'  // System-threatening issues
}

// Standardized Error Format
export interface StandardError {
  id: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  code: string;
  message: string;
  userMessage: string;
  details?: Record<string, unknown>;
  timestamp: string;
  source: string;
  correlationId?: string;
  retryable: boolean;
  retryAfter?: number;
  stack?: string;
}

// Retry Configuration
export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryableCategories: ErrorCategory[];
}

// Error Handling Configuration
export interface ErrorHandlerConfig {
  enableStackTrace: boolean;
  enableUserFriendlyMessages: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  notificationWebhook?: string;
  retryConfig: RetryConfig;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private config: ErrorHandlerConfig;
  private circuitBreakers = new Map<string, CircuitBreaker>();
  private errorCounts = new Map<string, { count: number; lastReset: number }>();

  private constructor(config: ErrorHandlerConfig) {
    this.config = config;
  }

  static getInstance(config?: ErrorHandlerConfig): ErrorHandler {
    if (!ErrorHandler.instance) {
      if (!config) {
        config = ErrorHandler.getDefaultConfig();
      }
      ErrorHandler.instance = new ErrorHandler(config);
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle and standardize an error
   */
  handleError(
    error: unknown,
    context: {
      source: string;
      operation?: string;
      correlationId?: string;
      userId?: string;
      additionalData?: Record<string, unknown>;
    }
  ): StandardError {
    const standardError = this.standardizeError(error, context);

    // Log the error
    this.logError(standardError, context);

    // Track error patterns
    this.trackError(standardError);

    // Send notifications for critical errors
    if (standardError.severity === ErrorSeverity.CRITICAL) {
      this.sendCriticalErrorNotification(standardError, context);
    }

    return standardError;
  }

  /**
   * Execute operation with comprehensive error handling and retry logic
   */
  async executeWithErrorHandling<T>(
    operation: () => Promise<T>,
    context: {
      source: string;
      operation?: string;
      correlationId?: string;
      retryConfig?: Partial<RetryConfig>;
    }
  ): Promise<T> {
    const retryConfig = { ...this.config.retryConfig, ...context.retryConfig };
    let lastError: StandardError;

    for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = this.handleError(error, {
          ...context,
          additionalData: { attempt, maxAttempts: retryConfig.maxAttempts }
        });

        // Don't retry if not retryable or on last attempt
        if (!lastError.retryable || attempt === retryConfig.maxAttempts) {
          break;
        }

        // Don't retry certain categories
        if (!retryConfig.retryableCategories.includes(lastError.category)) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = this.calculateRetryDelay(attempt, retryConfig);

        logger.info('Retrying operation', {
          source: context.source,
          operation: context.operation,
          attempt,
          maxAttempts: retryConfig.maxAttempts,
          delay,
          error: lastError.code
        });

        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  /**
   * Execute with circuit breaker protection
   */
  async executeWithCircuitBreaker<T>(
    operation: () => Promise<T>,
    context: {
      source: string;
      circuitBreakerKey: string;
      fallback?: () => Promise<T>;
    }
  ): Promise<T> {
    const circuitBreaker = this.getCircuitBreaker(context.circuitBreakerKey);

    try {
      if (context.fallback) {
        return await circuitBreaker.executeWithFallback(operation, context.fallback);
      } else {
        return await circuitBreaker.execute(operation);
      }
    } catch (error) {
      throw this.handleError(error, context);
    }
  }

  /**
   * Standardize error into consistent format
   */
  private standardizeError(
    error: unknown,
    context: { source: string; operation?: string; correlationId?: string }
  ): StandardError {
    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    // If already a StandardError, return as-is
    if (this.isStandardError(error)) {
      return error;
    }

    // Handle different error types
    if (error instanceof Error) {
      return this.standardizeNativeError(error, id, timestamp, context);
    }

    if (typeof error === 'object' && error !== null) {
      return this.standardizeObjectError(error, id, timestamp, context);
    }

    // Fallback for primitive errors
    return {
      id,
      category: ErrorCategory.SERVER_ERROR,
      severity: ErrorSeverity.MEDIUM,
      code: 'UNKNOWN_ERROR',
      message: String(error),
      userMessage: 'An unexpected error occurred',
      timestamp,
      source: context.source,
      correlationId: context.correlationId,
      retryable: false
    };
  }

  /**
   * Standardize native Error objects
   */
  private standardizeNativeError(
    error: Error,
    id: string,
    timestamp: string,
    context: { source: string; operation?: string; correlationId?: string }
  ): StandardError {
    const category = this.categorizeError(error);
    const severity = this.determineSeverity(category, error);
    const retryable = this.isRetryable(category, error);

    return {
      id,
      category,
      severity,
      code: error.name || 'ERROR',
      message: error.message,
      userMessage: this.generateUserMessage(category, error),
      details: this.extractErrorDetails(error),
      timestamp,
      source: context.source,
      correlationId: context.correlationId,
      retryable,
      stack: this.config.enableStackTrace ? error.stack : undefined
    };
  }

  /**
   * Standardize object errors (like HTTP response errors)
   */
  private standardizeObjectError(
    error: Record<string, unknown>,
    id: string,
    timestamp: string,
    context: { source: string; operation?: string; correlationId?: string }
  ): StandardError {
    const status = error.status || error.statusCode as number;
    const message = error.message || error.error || 'Unknown error';

    const category = this.categorizeHttpError(status);
    const severity = this.determineSeverity(category);

    return {
      id,
      category,
      severity,
      code: error.code as string || `HTTP_${status}` || 'UNKNOWN',
      message: String(message),
      userMessage: this.generateUserMessage(category),
      details: error,
      timestamp,
      source: context.source,
      correlationId: context.correlationId,
      retryable: this.isRetryableHttpStatus(status)
    };
  }

  /**
   * Categorize errors based on type and content
   */
  private categorizeError(error: Error): ErrorCategory {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    // Network and timeout errors
    if (message.includes('timeout') || name.includes('timeout')) {
      return ErrorCategory.TIMEOUT_ERROR;
    }

    if (message.includes('network') || message.includes('fetch') ||
        message.includes('connection') || name.includes('network')) {
      return ErrorCategory.NETWORK_ERROR;
    }

    // Authentication errors
    if (message.includes('unauthorized') || message.includes('forbidden') ||
        message.includes('authentication') || message.includes('token')) {
      return ErrorCategory.AUTHENTICATION_ERROR;
    }

    // Rate limiting
    if (message.includes('rate limit') || message.includes('too many requests')) {
      return ErrorCategory.RATE_LIMIT_ERROR;
    }

    // Validation errors
    if (name.includes('validation') || message.includes('invalid') ||
        message.includes('required') || name === 'zodError') {
      return ErrorCategory.VALIDATION_ERROR;
    }

    // Database errors
    if (message.includes('database') || message.includes('sql') ||
        message.includes('connection') || name.includes('db')) {
      return ErrorCategory.DATABASE_ERROR;
    }

    return ErrorCategory.SERVER_ERROR;
  }

  /**
   * Categorize HTTP errors by status code
   */
  private categorizeHttpError(status?: number): ErrorCategory {
    if (!status) return ErrorCategory.SERVER_ERROR;

    if (status >= 400 && status < 500) {
      switch (status) {
        case 401:
        case 403:
          return ErrorCategory.AUTHENTICATION_ERROR;
        case 429:
          return ErrorCategory.RATE_LIMIT_ERROR;
        case 422:
          return ErrorCategory.VALIDATION_ERROR;
        default:
          return ErrorCategory.CLIENT_ERROR;
      }
    }

    if (status >= 500) {
      return ErrorCategory.SERVER_ERROR;
    }

    return ErrorCategory.SERVER_ERROR;
  }

  /**
   * Determine error severity
   */
  private determineSeverity(category: ErrorCategory, error?: Error): ErrorSeverity {
    switch (category) {
      case ErrorCategory.VALIDATION_ERROR:
      case ErrorCategory.CLIENT_ERROR:
        return ErrorSeverity.LOW;

      case ErrorCategory.AUTHENTICATION_ERROR:
      case ErrorCategory.RATE_LIMIT_ERROR:
        return ErrorSeverity.MEDIUM;

      case ErrorCategory.DATABASE_ERROR:
      case ErrorCategory.EXTERNAL_SERVICE_ERROR:
        return ErrorSeverity.HIGH;

      case ErrorCategory.CONFIGURATION_ERROR:
        return ErrorSeverity.CRITICAL;

      case ErrorCategory.NETWORK_ERROR:
      case ErrorCategory.TIMEOUT_ERROR:
        return error?.message.includes('critical') ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM;

      default:
        return ErrorSeverity.MEDIUM;
    }
  }

  /**
   * Determine if error is retryable
   */
  private isRetryable(category: ErrorCategory, error?: Error): boolean {
    const retryableCategories = [
      ErrorCategory.NETWORK_ERROR,
      ErrorCategory.TIMEOUT_ERROR,
      ErrorCategory.SERVER_ERROR,
      ErrorCategory.EXTERNAL_SERVICE_ERROR
    ];

    return retryableCategories.includes(category);
  }

  /**
   * Check if HTTP status is retryable
   */
  private isRetryableHttpStatus(status?: number): boolean {
    if (!status) return false;

    // Retry on server errors and specific client errors
    const retryableStatuses = [408, 429, 500, 502, 503, 504];
    return retryableStatuses.includes(status);
  }

  /**
   * Generate user-friendly error messages
   */
  private generateUserMessage(category: ErrorCategory, error?: Error): string {
    if (!this.config.enableUserFriendlyMessages) {
      return error?.message || 'An error occurred';
    }

    switch (category) {
      case ErrorCategory.NETWORK_ERROR:
        return 'Unable to connect to the service. Please check your internet connection and try again.';

      case ErrorCategory.TIMEOUT_ERROR:
        return 'The request took too long to complete. Please try again.';

      case ErrorCategory.AUTHENTICATION_ERROR:
        return 'You are not authorized to perform this action. Please sign in and try again.';

      case ErrorCategory.RATE_LIMIT_ERROR:
        return 'Too many requests. Please wait a moment before trying again.';

      case ErrorCategory.VALIDATION_ERROR:
        return 'Please check your input and try again.';

      case ErrorCategory.DATABASE_ERROR:
        return 'Unable to save your changes. Please try again.';

      case ErrorCategory.EXTERNAL_SERVICE_ERROR:
        return 'A required service is temporarily unavailable. Please try again later.';

      default:
        return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
    }
  }

  /**
   * Extract additional error details
   */
  private extractErrorDetails(error: Error): Record<string, unknown> {
    const details: Record<string, unknown> = {};

    // Add common error properties
    const props = Object.getOwnPropertyNames(error);
    for (const prop of props) {
      if (prop !== 'name' && prop !== 'message' && prop !== 'stack') {
        try {
          details[prop] = (error as any)[prop];
        } catch {
          // Skip properties that can't be accessed
        }
      }
    }

    return details;
  }

  /**
   * Log error based on severity
   */
  private logError(
    error: StandardError,
    context: { source: string; operation?: string; userId?: string }
  ): void {
    const logData = {
      errorId: error.id,
      category: error.category,
      severity: error.severity,
      code: error.code,
      source: error.source,
      operation: context.operation,
      userId: context.userId,
      correlationId: error.correlationId,
      message: error.message,
      retryable: error.retryable
    };

    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        logger.error('Critical error occurred', logData);
        break;
      case ErrorSeverity.HIGH:
        logger.error('High severity error', logData);
        break;
      case ErrorSeverity.MEDIUM:
        logger.warn('Medium severity error', logData);
        break;
      case ErrorSeverity.LOW:
        if (this.config.logLevel === 'debug') {
          logger.debug('Low severity error', logData);
        }
        break;
    }
  }

  /**
   * Track error patterns for analysis
   */
  private trackError(error: StandardError): void {
    const key = `${error.source}:${error.code}`;
    const now = Date.now();
    const hourMs = 60 * 60 * 1000;

    let errorCount = this.errorCounts.get(key);

    if (!errorCount || (now - errorCount.lastReset) > hourMs) {
      errorCount = { count: 0, lastReset: now };
      this.errorCounts.set(key, errorCount);
    }

    errorCount.count++;

    // Alert on error patterns
    if (errorCount.count > 10) { // More than 10 errors per hour
      logger.warn('High error rate detected', {
        source: error.source,
        code: error.code,
        count: errorCount.count,
        timeWindow: '1 hour'
      });
    }
  }

  /**
   * Send critical error notifications
   */
  private async sendCriticalErrorNotification(
    error: StandardError,
    context: { source: string; operation?: string; userId?: string }
  ): Promise<void> {
    if (!this.config.notificationWebhook) {
      return;
    }

    try {
      const payload = {
        type: 'critical_error',
        error: {
          id: error.id,
          category: error.category,
          code: error.code,
          message: error.message,
          source: error.source,
          timestamp: error.timestamp
        },
        context
      };

      await fetch(this.config.notificationWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

    } catch (notificationError) {
      logger.error('Failed to send critical error notification', {
        originalError: error.id,
        notificationError: notificationError instanceof Error ?
          notificationError.message : String(notificationError)
      });
    }
  }

  /**
   * Helper methods
   */
  private getCircuitBreaker(key: string): CircuitBreaker {
    if (!this.circuitBreakers.has(key)) {
      this.circuitBreakers.set(key, new CircuitBreaker({
        failureThreshold: 5,
        recoveryTimeout: 60000,
        monitoringPeriod: 10000
      }));
    }
    return this.circuitBreakers.get(key)!;
  }

  private calculateRetryDelay(attempt: number, config: RetryConfig): number {
    const delay = Math.min(
      config.baseDelay * Math.pow(config.backoffFactor, attempt - 1),
      config.maxDelay
    );

    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * delay;
    return delay + jitter;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private isStandardError(error: unknown): error is StandardError {
    return typeof error === 'object' && error !== null &&
           'id' in error && 'category' in error && 'severity' in error;
  }

  /**
   * Get default configuration
   */
  private static getDefaultConfig(): ErrorHandlerConfig {
    return {
      enableStackTrace: process.env.NODE_ENV === 'development',
      enableUserFriendlyMessages: true,
      logLevel: 'error',
      retryConfig: {
        maxAttempts: 3,
        baseDelay: 1000,
        maxDelay: 10000,
        backoffFactor: 2,
        retryableCategories: [
          ErrorCategory.NETWORK_ERROR,
          ErrorCategory.TIMEOUT_ERROR,
          ErrorCategory.SERVER_ERROR,
          ErrorCategory.EXTERNAL_SERVICE_ERROR
        ]
      }
    };
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    totalErrors: number;
    errorsByCategory: Record<string, number>;
    errorsBySource: Record<string, number>;
    topErrors: Array<{ key: string; count: number }>;
  } {
    const errorsByCategory: Record<string, number> = {};
    const errorsBySource: Record<string, number> = {};
    const topErrors: Array<{ key: string; count: number }> = [];

    let totalErrors = 0;

    for (const [key, errorCount] of this.errorCounts) {
      totalErrors += errorCount.count;

      const [source, code] = key.split(':');
      errorsBySource[source] = (errorsBySource[source] || 0) + errorCount.count;

      topErrors.push({ key, count: errorCount.count });
    }

    topErrors.sort((a, b) => b.count - a.count);

    return {
      totalErrors,
      errorsByCategory,
      errorsBySource,
      topErrors: topErrors.slice(0, 10)
    };
  }
}