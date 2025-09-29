/**
 * Enhanced ErrorHandler - Centralized error handling with recovery and monitoring
 * Replaces the existing error handler with improved functionality
 */

import { AppError } from './AppError';
import {
  ErrorCategory,
  ErrorSeverity,
  ErrorContext,
  ErrorHandlerConfig,
  ErrorMonitoringData,
  RecoveryStrategy,
  ErrorRecoveryOptions,
  ErrorFeedbackConfig,
  ErrorFeedbackType
} from './types';
import { logger } from '../logger';

export class ErrorHandler {
  private static instance: ErrorHandler;
  private config: ErrorHandlerConfig;
  private errorCounts = new Map<string, { count: number; lastReset: number }>();
  private recoveryStrategies = new Map<string, ErrorRecoveryOptions>();

  private constructor(config: ErrorHandlerConfig) {
    this.config = config;
    this.setupDefaultRecoveryStrategies();
  }

  static getInstance(config?: Partial<ErrorHandlerConfig>): ErrorHandler {
    if (!ErrorHandler.instance) {
      const defaultConfig = ErrorHandler.getDefaultConfig();
      ErrorHandler.instance = new ErrorHandler({ ...defaultConfig, ...config });
    }
    return ErrorHandler.instance;
  }

  /**
   * Main error handling entry point
   */
  async handleError(
    error: unknown,
    context: ErrorContext,
    options?: {
      enableRecovery?: boolean;
      enableUserFeedback?: boolean;
      customRecovery?: ErrorRecoveryOptions;
    }
  ): Promise<AppError> {
    // Convert to AppError if needed
    const appError = this.toAppError(error, context);

    // Log the error
    this.logError(appError, context);

    // Track error patterns
    this.trackErrorPattern(appError);

    // Send to monitoring if configured
    await this.sendToMonitoring(appError, context);

    // Send critical error notifications
    if (appError.severity === ErrorSeverity.CRITICAL) {
      await this.sendCriticalNotification(appError, context);
    }

    // Attempt recovery if enabled
    if (options?.enableRecovery !== false && this.config.enableRecovery) {
      const recovery = options?.customRecovery || this.getRecoveryStrategy(appError);
      if (recovery.strategy !== RecoveryStrategy.NONE) {
        await this.attemptRecovery(appError, recovery);
      }
    }

    // Show user feedback if enabled
    if (options?.enableUserFeedback !== false && this.config.enableUserFeedback) {
      await this.showUserFeedback(appError);
    }

    return appError;
  }

  /**
   * Handle errors with automatic retry logic
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    options?: {
      maxRetries?: number;
      retryDelay?: number;
      retryableCategories?: ErrorCategory[];
    }
  ): Promise<T> {
    const maxRetries = options?.maxRetries ?? this.config.maxRetries;
    const baseDelay = options?.retryDelay ?? this.config.retryDelay;
    const retryableCategories = options?.retryableCategories ?? [
      ErrorCategory.NETWORK,
      ErrorCategory.TIMEOUT,
      ErrorCategory.SERVER,
      ErrorCategory.EXTERNAL_SERVICE
    ];

    let lastError: AppError;
    let attempt = 1;

    while (attempt <= maxRetries) {
      try {
        return await operation();
      } catch (error) {
        lastError = await this.handleError(error, {
          ...context,
          additionalData: { attempt, maxRetries }
        }, { enableUserFeedback: false }); // Don't show feedback during retries

        // Check if we should retry
        if (
          attempt === maxRetries ||
          !lastError.retryable ||
          !retryableCategories.includes(lastError.category)
        ) {
          break;
        }

        // Calculate delay and wait
        const delay = lastError.getRetryDelay(attempt, baseDelay);
        logger.info('Retrying operation', {
          source: context.component || 'unknown',
          operation: context.operation,
          attempt,
          maxRetries,
          delay,
          error: lastError.code
        });

        await this.sleep(delay);
        attempt++;
      }
    }

    throw lastError!;
  }

  /**
   * Convert any error to AppError
   */
  private toAppError(error: unknown, context: ErrorContext): AppError {
    if (error instanceof AppError) {
      return error;
    }

    if (error instanceof Error) {
      return AppError.fromError(error, context.component || 'unknown');
    }

    // Handle fetch/HTTP errors
    if (error && typeof error === 'object' && 'status' in error) {
      const httpError = error as { status: number; statusText?: string; data?: unknown };
      return AppError.fromHttpError(
        httpError.status,
        httpError.statusText || 'Unknown',
        httpError.data,
        context.component || 'unknown'
      );
    }

    // Fallback for unknown error types
    return new AppError({
      code: 'UNK_001',
      message: String(error),
      category: ErrorCategory.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
      source: context.component || 'unknown',
      context: { originalError: error }
    });
  }

  /**
   * Log error based on severity
   */
  private logError(error: AppError, context: ErrorContext): void {
    const logData = {
      errorId: error.id,
      code: error.code,
      category: error.category,
      severity: error.severity,
      source: error.source,
      component: context.component,
      operation: context.operation,
      userId: context.userId,
      correlationId: error.correlationId,
      message: error.message,
      userMessage: error.userMessage,
      retryable: error.retryable,
      url: context.url,
      userAgent: context.userAgent
    };

    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        logger.error('CRITICAL ERROR', logData);
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
  private trackErrorPattern(error: AppError): void {
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
    if (errorCount.count > 10) {
      logger.warn('High error rate detected', {
        source: error.source,
        code: error.code,
        count: errorCount.count,
        timeWindow: '1 hour'
      });
    }
  }

  /**
   * Send error to monitoring service
   */
  private async sendToMonitoring(error: AppError, context: ErrorContext): Promise<void> {
    if (!this.config.monitoringEndpoint) {
      return;
    }

    try {
      const monitoringData: ErrorMonitoringData = {
        error,
        context,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'unknown',
        version: process.env.VITE_APP_VERSION || 'unknown',
        sessionId: context.sessionId,
        userId: context.userId
      };

      await fetch(this.config.monitoringEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(monitoringData)
      });
    } catch (monitoringError) {
      logger.error('Failed to send error to monitoring', {
        originalError: error.id,
        monitoringError: monitoringError instanceof Error ?
          monitoringError.message : String(monitoringError)
      });
    }
  }

  /**
   * Send critical error notifications
   */
  private async sendCriticalNotification(error: AppError, context: ErrorContext): Promise<void> {
    if (!this.config.notificationWebhook) {
      return;
    }

    try {
      const payload = {
        type: 'critical_error',
        error: error.toJSON(),
        context,
        timestamp: new Date().toISOString()
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
   * Setup default recovery strategies
   */
  private setupDefaultRecoveryStrategies(): void {
    // Network errors - retry
    this.recoveryStrategies.set('NET_001', {
      strategy: RecoveryStrategy.RETRY,
      maxRetries: 3
    });

    // Timeout errors - retry with backoff
    this.recoveryStrategies.set('NET_002', {
      strategy: RecoveryStrategy.RETRY,
      maxRetries: 2,
      retryDelay: 2000
    });

    // Service unavailable - fallback
    this.recoveryStrategies.set('NET_003', {
      strategy: RecoveryStrategy.FALLBACK,
      fallbackAction: () => {
        // Could show cached data or offline mode
        logger.info('Using fallback for service unavailable');
      }
    });

    // Authentication errors - redirect to login
    this.recoveryStrategies.set('AUTH_001', {
      strategy: RecoveryStrategy.REDIRECT,
      redirectUrl: '/auth/login'
    });

    // Token expired - refresh
    this.recoveryStrategies.set('AUTH_002', {
      strategy: RecoveryStrategy.REFRESH,
      refreshTarget: 'auth-token'
    });
  }

  /**
   * Get recovery strategy for error
   */
  private getRecoveryStrategy(error: AppError): ErrorRecoveryOptions {
    const strategy = this.recoveryStrategies.get(error.code);
    if (strategy) {
      return strategy;
    }

    // Default strategies based on category
    switch (error.category) {
      case ErrorCategory.NETWORK:
      case ErrorCategory.TIMEOUT:
        return { strategy: RecoveryStrategy.RETRY, maxRetries: 2 };

      case ErrorCategory.AUTHENTICATION:
        return {
          strategy: RecoveryStrategy.REDIRECT,
          redirectUrl: '/auth/login'
        };

      default:
        return { strategy: RecoveryStrategy.NONE };
    }
  }

  /**
   * Attempt error recovery
   */
  private async attemptRecovery(error: AppError, recovery: ErrorRecoveryOptions): Promise<void> {
    try {
      switch (recovery.strategy) {
        case RecoveryStrategy.RETRY:
          // Retry is handled in executeWithRetry method
          break;

        case RecoveryStrategy.FALLBACK:
          if (recovery.fallbackAction) {
            await recovery.fallbackAction();
          }
          break;

        case RecoveryStrategy.REFRESH:
          if (recovery.refreshTarget === 'auth-token') {
            // Trigger token refresh
            window.dispatchEvent(new CustomEvent('auth:refresh-token'));
          } else {
            window.location.reload();
          }
          break;

        case RecoveryStrategy.REDIRECT:
          if (recovery.redirectUrl) {
            window.location.href = recovery.redirectUrl;
          }
          break;

        case RecoveryStrategy.MANUAL:
          if (recovery.customAction) {
            await recovery.customAction.action();
          }
          break;
      }
    } catch (recoveryError) {
      logger.error('Error recovery failed', {
        originalError: error.id,
        recoveryStrategy: recovery.strategy,
        recoveryError: recoveryError instanceof Error ?
          recoveryError.message : String(recoveryError)
      });
    }
  }

  /**
   * Show user feedback for error
   */
  private async showUserFeedback(error: AppError): Promise<void> {
    const feedbackConfig = this.getFeedbackConfig(error);

    // Dispatch custom event for UI components to handle
    window.dispatchEvent(new CustomEvent('app:error-feedback', {
      detail: { error, config: feedbackConfig }
    }));
  }

  /**
   * Get feedback configuration for error
   */
  private getFeedbackConfig(error: AppError): ErrorFeedbackConfig {
    const baseConfig: ErrorFeedbackConfig = {
      type: ErrorFeedbackType.TOAST,
      message: error.userMessage,
      dismissible: true
    };

    // Customize based on severity
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        return {
          ...baseConfig,
          type: ErrorFeedbackType.MODAL,
          title: 'Erreur Critique',
          dismissible: false,
          actions: [{
            label: 'Recharger la page',
            action: () => window.location.reload(),
            variant: 'primary'
          }]
        };

      case ErrorSeverity.HIGH:
        return {
          ...baseConfig,
          type: ErrorFeedbackType.BANNER,
          title: 'Erreur Importante',
          duration: 0, // Don't auto-dismiss
          actions: [{
            label: 'Réessayer',
            action: () => window.location.reload(),
            variant: 'secondary'
          }]
        };

      case ErrorSeverity.MEDIUM:
        return {
          ...baseConfig,
          type: ErrorFeedbackType.TOAST,
          duration: 5000
        };

      case ErrorSeverity.LOW:
        return {
          ...baseConfig,
          type: ErrorFeedbackType.TOAST,
          duration: 3000
        };

      default:
        return baseConfig;
    }
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

      const [source, _code] = key.split(':');
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

  /**
   * Utility methods
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private static getDefaultConfig(): ErrorHandlerConfig {
    return {
      enableStackTrace: process.env.NODE_ENV === 'development',
      enableUserFeedback: true,
      logLevel: 'error',
      maxRetries: 3,
      retryDelay: 1000,
      enableRecovery: true
    };
  }
}