/**
 * AppError Class - Standardized error implementation
 * Extends the native Error class with additional metadata and functionality
 */

import {
  AppError as IAppError,
  ErrorCategory,
  ErrorSeverity,
  ErrorCode,
  UserMessages
} from './types';

export class AppError extends Error implements IAppError {
  declare cause?: Error;
  readonly id: string;
  readonly code: ErrorCode;
  readonly category: ErrorCategory;
  readonly severity: ErrorSeverity;
  readonly userMessage: string;
  readonly context?: Record<string, unknown>;
  readonly timestamp: string;
  readonly source: string;
  readonly correlationId?: string;
  readonly retryable: boolean;
  readonly retryAfter?: number;
  readonly details?: Record<string, unknown>;

  constructor(options: {
    code: ErrorCode;
    message: string;
    category: ErrorCategory;
    severity: ErrorSeverity;
    source: string;
    userMessage?: string;
    context?: Record<string, unknown>;
    correlationId?: string;
    retryable?: boolean;
    retryAfter?: number;
    details?: Record<string, unknown>;
    cause?: Error;
  }) {
    super(options.message);

    this.name = 'AppError';
    this.id = crypto.randomUUID();
    this.code = options.code;
    this.category = options.category;
    this.severity = options.severity;
    this.source = options.source;
    this.timestamp = new Date().toISOString();
if (options.context !== undefined) this.context = options.context;
    if (options.correlationId !== undefined) this.correlationId = options.correlationId;
    this.retryable = options.retryable ?? this.getDefaultRetryable();
    if (options.retryAfter !== undefined) this.retryAfter = options.retryAfter;
    if (options.details !== undefined) this.details = options.details;

    // Set user message with fallback
    const userMessageKey = options.code as keyof typeof UserMessages;
    const defaultMessage = UserMessages[userMessageKey] || 'Une erreur inattendue s\'est produite.';
    this.userMessage = options.userMessage || defaultMessage;

    // Preserve the original error stack if provided
    if (options.cause) {
      if (options.cause.stack) this.stack = options.cause.stack;
      // preserve cause when supported
      // @ts-ignore
      this.cause = options.cause;
    }

    // Ensure stack trace is captured
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  /**
   * Determine default retryable status based on category
   */
  private getDefaultRetryable(): boolean {
    switch (this.category) {
      case ErrorCategory.NETWORK:
      case ErrorCategory.TIMEOUT:
      case ErrorCategory.SERVER:
      case ErrorCategory.EXTERNAL_SERVICE:
      case ErrorCategory.DATABASE:
        return true;

      case ErrorCategory.RATE_LIMIT:
        return true; // But with delay

      case ErrorCategory.VALIDATION:
      case ErrorCategory.AUTHENTICATION:
      case ErrorCategory.AUTHORIZATION:
      case ErrorCategory.NOT_FOUND:
      case ErrorCategory.BUSINESS_LOGIC:
      case ErrorCategory.CONFIGURATION:
        return false;

      default:
        return false;
    }
  }

  /**
   * Convert error to JSON for serialization
   */
  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      code: this.code,
      message: this.message,
      userMessage: this.userMessage,
      category: this.category,
      severity: this.severity,
      source: this.source,
      timestamp: this.timestamp,
      correlationId: this.correlationId,
      retryable: this.retryable,
      retryAfter: this.retryAfter,
      context: this.context,
      details: this.details,
      stack: this.stack
    };
  }

  /**
   * Create a sanitized version for API responses (no stack trace)
   */
  toSafeJSON(): Record<string, unknown> {
    const json = this.toJSON();
    delete json.stack;
    delete json.details; // May contain sensitive info
    return json;
  }

  /**
   * Check if this error should be retried
   */
  shouldRetry(currentAttempt: number, maxAttempts: number): boolean {
    return this.retryable && currentAttempt < maxAttempts;
  }

  /**
   * Get retry delay in milliseconds
   */
  getRetryDelay(attempt: number, baseDelay = 1000): number {
    if (this.retryAfter) {
      return this.retryAfter;
    }

    // Exponential backoff with jitter
    const delay = baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 0.1 * delay;
    return Math.min(delay + jitter, 30000); // Max 30 seconds
  }

  /**
   * Create AppError from native Error
   */
  static fromError(
    error: Error,
    source: string,
    category?: ErrorCategory,
    code?: ErrorCode
  ): AppError {
    return new AppError({
      code: code || 'UNK_001',
      message: error.message,
      category: category || ErrorCategory.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
      source,
      cause: error,
      context: {
        originalErrorName: error.name,
        originalErrorStack: error.stack
      }
    });
  }

  /**
   * Create AppError from HTTP response
   */
  static fromHttpError(
    status: number,
    statusText: string,
    data: unknown,
    source: string
  ): AppError {
    const category = AppError.categorizeHttpStatus(status);
    const severity = AppError.getSeverityFromStatus(status);
    const code = AppError.getCodeFromStatus(status);

    return new AppError({
      code,
      message: `HTTP ${status}: ${statusText}`,
      category,
      severity,
      source,
      retryable: AppError.isHttpStatusRetryable(status),
      details: {
        status,
        statusText,
        response: data
      }
    });
  }

  /**
   * Create validation error
   */
  static validation(
    field: string,
    value: unknown,
    rule: string,
    source: string
  ): AppError {
    return new AppError({
      code: 'VAL_002',
      message: `Validation failed for ${field}: ${rule}`,
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.LOW,
      source,
      userMessage: `Le champ ${field} n'est pas valide.`,
      details: { field, value, rule }
    });
  }

  /**
   * Create business logic error
   */
  static businessLogic(
    operation: string,
    reason: string,
    source: string,
    code: ErrorCode = 'BIZ_002'
  ): AppError {
    return new AppError({
      code,
      message: `Business rule violation: ${operation} - ${reason}`,
      category: ErrorCategory.BUSINESS_LOGIC,
      severity: ErrorSeverity.MEDIUM,
      source,
      details: { operation, reason }
    });
  }

  /**
   * Helper methods for HTTP error categorization
   */
  private static categorizeHttpStatus(status: number): ErrorCategory {
    if (status === 401) return ErrorCategory.AUTHENTICATION;
    if (status === 403) return ErrorCategory.AUTHORIZATION;
    if (status === 404) return ErrorCategory.NOT_FOUND;
    if (status === 422) return ErrorCategory.VALIDATION;
    if (status === 429) return ErrorCategory.RATE_LIMIT;
    if (status >= 400 && status < 500) return ErrorCategory.VALIDATION;
    if (status >= 500) return ErrorCategory.SERVER;
    return ErrorCategory.UNKNOWN;
  }

  private static getSeverityFromStatus(status: number): ErrorSeverity {
    if (status === 401 || status === 403) return ErrorSeverity.MEDIUM;
    if (status === 404) return ErrorSeverity.LOW;
    if (status === 422) return ErrorSeverity.LOW;
    if (status === 429) return ErrorSeverity.MEDIUM;
    if (status >= 500) return ErrorSeverity.HIGH;
    return ErrorSeverity.MEDIUM;
  }

  private static getCodeFromStatus(status: number): ErrorCode {
    switch (status) {
      case 401: return 'AUTH_001';
      case 403: return 'AUTH_003';
      case 404: return 'VAL_001';
      case 422: return 'VAL_002';
      case 429: return 'NET_004';
      case 500: return 'UNK_002';
      case 502:
      case 503:
      case 504: return 'NET_003';
      default: return 'UNK_001';
    }
  }

  private static isHttpStatusRetryable(status: number): boolean {
    // Retry on server errors and specific client errors
    const retryableStatuses = [408, 429, 500, 502, 503, 504];
    return retryableStatuses.includes(status);
  }
}