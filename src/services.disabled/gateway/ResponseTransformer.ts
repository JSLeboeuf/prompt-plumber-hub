/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Response Transformer - Handles response transformation and formatting
 * Provides consistent response structure and data transformation
 */

import { logger } from '@/lib/logger';

export interface TransformConfig {
  maskSensitiveData?: boolean;
  normalizeStructure?: boolean;
  addMetadata?: boolean;
}

export class ResponseTransformer {
  private sensitiveFields = [
    'password', 'token', 'secret', 'key', 'authorization',
    'ssn', 'social_security', 'credit_card', 'bank_account'
  ];

  /**
   * Transform response data with optional custom transformer
   */
  async transform<T>(
    data: T,
    customTransform?: (data: T) => unknown,
    config: TransformConfig = {}
  ): Promise<T> {
    try {
      let transformed = data;

      // Apply custom transformation first
      if (customTransform) {
        transformed = customTransform(transformed) as T;
      }

      // Apply built-in transformations
      if (config.maskSensitiveData !== false) {
        transformed = this.maskSensitiveData(transformed);
      }

      if (config.normalizeStructure) {
        transformed = this.normalizeStructure(transformed);
      }

      return transformed;

    } catch (error) {
      logger.error('Response transformation failed', {
        error: error instanceof Error ? error.message : String(error)
      });
      return data; // Return original data if transformation fails
    }
  }

  /**
   * Mask sensitive data in response
   */
  private maskSensitiveData<T>(data: T): T {
    if (data === null || data === undefined) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.maskSensitiveData(item)) as T;
    }

    if (typeof data === 'object') {
      const masked = { ...data } as Record<string, unknown>;

      for (const [key, value] of Object.entries(masked)) {
        const lowerKey = key.toLowerCase();

        // Check if field should be masked
        if (this.sensitiveFields.some(field => lowerKey.includes(field))) {
          if (typeof value === 'string' && value.length > 0) {
            // Show first 2 and last 2 characters for identifiable data
            if (value.length > 6) {
              masked[key] = `${value.substring(0, 2)}***${value.substring(value.length - 2)}`;
            } else {
              masked[key] = '***';
            }
          } else {
            masked[key] = '***';
          }
        } else {
          // Recursively mask nested objects
          masked[key] = this.maskSensitiveData(value);
        }
      }

      return masked as T;
    }

    return data;
  }

  /**
   * Normalize response structure for consistency
   */
  private normalizeStructure<T>(data: T): T {
    if (data === null || data === undefined) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.normalizeStructure(item)) as T;
    }

    if (typeof data === 'object') {
      const normalized = { ...data } as Record<string, unknown>;

      // Convert timestamp strings to ISO format
      for (const [key, value] of Object.entries(normalized)) {
        if (typeof value === 'string' && this.isTimestamp(key, value)) {
          try {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
              normalized[key] = date.toISOString();
            }
          } catch {
            // Keep original value if parsing fails
          }
        } else if (typeof value === 'object') {
          normalized[key] = this.normalizeStructure(value);
        }
      }

      // Ensure consistent naming conventions
      const standardized = this.standardizeFieldNames(normalized);

      return standardized as T;
    }

    return data;
  }

  /**
   * Check if a field value looks like a timestamp
   */
  private isTimestamp(key: string, value: string): boolean {
    const timestampFields = ['created_at', 'updated_at', 'timestamp', 'date', 'time'];
    const lowerKey = key.toLowerCase();

    if (timestampFields.some(field => lowerKey.includes(field))) {
      // Check if value looks like a date
      return /^\d{4}-\d{2}-\d{2}/.test(value) ||
             /^\d{10,13}$/.test(value) || // Unix timestamp
             !isNaN(Date.parse(value));
    }

    return false;
  }

  /**
   * Standardize field names to consistent format
   */
  private standardizeFieldNames(obj: Record<string, unknown>): Record<string, unknown> {
    const standardized: Record<string, unknown> = {};
    const fieldMappings: Record<string, string> = {
      'id': 'id',
      'ID': 'id',
      'userId': 'user_id',
      'callId': 'call_id',
      'phoneNumber': 'phone_number',
      'createdAt': 'created_at',
      'updatedAt': 'updated_at',
      'startedAt': 'started_at',
      'endedAt': 'ended_at',
      'customerName': 'customer_name',
      'customerPhone': 'customer_phone',
      'customerEmail': 'customer_email'
    };

    for (const [key, value] of Object.entries(obj)) {
      const standardKey = fieldMappings[key] || this.camelToSnake(key);
      standardized[standardKey] = value;
    }

    return standardized;
  }

  /**
   * Convert camelCase to snake_case
   */
  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  /**
   * Transform error responses to consistent format
   */
  transformError(error: unknown): {
    code: string;
    message: string;
    details?: unknown;
    timestamp: string;
  } {
    if (error instanceof Error) {
      return {
        code: error.name || 'UnknownError',
        message: error.message,
        details: this.extractErrorDetails(error),
        timestamp: new Date().toISOString()
      };
    }

    if (typeof error === 'object' && error !== null) {
      const errorObj = error as Record<string, unknown>;
      return {
        code: String(errorObj.code || errorObj.name || 'UnknownError'),
        message: String(errorObj.message || 'An error occurred'),
        details: errorObj.details || errorObj,
        timestamp: new Date().toISOString()
      };
    }

    return {
      code: 'UnknownError',
      message: String(error),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Extract additional error details while masking sensitive info
   */
  private extractErrorDetails(error: Error): Record<string, unknown> {
    const details: Record<string, unknown> = {};

    // Add stack trace in development
    if (process.env.NODE_ENV === 'development' && error.stack) {
      details.stack = error.stack;
    }

    // Add any additional error properties
    const errorProps = Object.getOwnPropertyNames(error);
    for (const prop of errorProps) {
      if (prop !== 'name' && prop !== 'message' && prop !== 'stack') {
        try {
          const value = (error as any)[prop];
          details[prop] = this.maskSensitiveData(value);
        } catch {
          // Skip properties that can't be accessed
        }
      }
    }

    return details;
  }

  /**
   * Transform paginated responses to consistent format
   */
  transformPaginatedResponse<T>(data: {
    items: T[];
    total?: number;
    count?: number;
    page?: number;
    pageSize?: number;
    hasMore?: boolean;
  }): {
    items: T[];
    pagination: {
      total: number;
      count: number;
      page: number;
      pageSize: number;
      hasMore: boolean;
      totalPages: number;
    };
  } {
    const items = data.items || [];
    const total = data.total ?? data.count ?? items.length;
    const page = data.page ?? 1;
    const pageSize = data.pageSize ?? items.length || 25;
    const totalPages = Math.ceil(total / pageSize);
    const hasMore = data.hasMore ?? (page < totalPages);

    return {
      items: items.map(item => this.maskSensitiveData(item)),
      pagination: {
        total,
        count: items.length,
        page,
        pageSize,
        hasMore,
        totalPages
      }
    };
  }

  /**
   * Add performance metadata to response
   */
  addPerformanceMetadata<T>(
    data: T,
    startTime: number,
    additionalMeta?: Record<string, unknown>
  ): T & { _meta: Record<string, unknown> } {
    const duration = Date.now() - startTime;

    return {
      ...data as object,
      _meta: {
        processingTime: duration,
        timestamp: new Date().toISOString(),
        ...additionalMeta
      }
    } as T & { _meta: Record<string, unknown> };
  }
}