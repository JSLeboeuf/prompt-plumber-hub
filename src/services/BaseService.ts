import { logger } from '@/lib/logger';
import type { SupabaseQuery } from '@/types/api.types';

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  meta: {
    action: string;
    entity: string;
    timestamp: string;
  };
}

export type SortOrder = 'asc' | 'desc';

export interface QueryOptions {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
  filters?: Record<string, unknown>;
}

export interface ValidationRule<T> {
  validate(input: T): string | null;
}

export class RequiredFieldRule<T extends Record<string, unknown>> implements ValidationRule<T> {
  private readonly field: keyof T;
  private readonly label: string;

  constructor(field: keyof T, label?: string) {
    this.field = field;
    this.label = label ?? String(field);
  }

  validate(input: T): string | null {
    const value = input[this.field];
    const isEmptyString = typeof value === 'string' && value.trim().length === 0;
    if (value === null || value === undefined || isEmptyString) {
      return this.label + ' is required';
    }
    return null;
  }
}

export function Injectable(identifier?: string) {
  return function decorator<T extends { new (...args: unknown[]): unknown }>(target: T): T {
    if (identifier) {
      Reflect.defineProperty(target, '__injectable__', {
        value: identifier,
        enumerable: false,
        configurable: false,
      });
    }
    return target;
  };
}

export abstract class BaseRepository<T> {
  protected readonly tableName: string;
  protected readonly selectFields: string;

  protected constructor(tableName: string, selectFields: string = '*') {
    this.tableName = tableName;
    this.selectFields = selectFields;
  }

  protected buildFilters<T>(query: SupabaseQuery<T>, filters?: Record<string, unknown>): SupabaseQuery<T> {
    if (!filters) {
      return query;
    }

    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return;
      }

      if (key === 'or' && typeof value === 'string' && typeof query.or === 'function') {
        query = query.or(value);
        return;
      }

      if (Array.isArray(value) && typeof query.in === 'function') {
        query = query.in(key, value);
        return;
      }

      if (typeof value === 'object' && value !== null) {
        const record = value as Record<string, unknown>;
        if ('gte' in record && typeof query.gte === 'function') {
          query = query.gte(key, record['gte']);
        }
        if ('lte' in record && typeof query.lte === 'function') {
          query = query.lte(key, record['lte']);
        }
        return;
      }

      if (typeof query.eq === 'function') {
        query = query.eq(key, value);
      }
    });

    return query;
  }

  protected applySorting<T>(query: SupabaseQuery<T>, sortBy?: string, sortOrder: SortOrder = 'desc'): SupabaseQuery<T> {
    if (sortBy && typeof query.order === 'function') {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    }
    return query;
  }

  protected applyPagination<T>(query: SupabaseQuery<T>, page = 1, pageSize = 25): SupabaseQuery<T> {
    if (typeof query.range === 'function') {
      const start = (page - 1) * pageSize;
      const end = start + pageSize - 1;
      query = query.range(start, end);
    }
    return query;
  }

  protected transformPaginatedResult(items: T[], total: number, page: number, pageSize: number): PaginatedResult<T> {
    return {
      items,
      total,
      page,
      pageSize,
    };
  }
}

export abstract class BaseService {
  protected transformPaginatedResult<T>(items: T[], total: number, page: number, pageSize: number): PaginatedResult<T> {
    return {
      items,
      total,
      page,
      pageSize,
    };
  }

  protected invalidateCache(_key: string): void {
    // Placeholder for cache invalidation hook. Implement when caching layer is available.
  }

  protected async publishEvent(event: string, resourceId: string, resourceType: string, payload?: unknown): Promise<void> {
    logger.debug('Domain event published', {
      event,
      resourceId,
      resourceType,
      payload,
    });
  }

  protected validateEntity<T>(entity: T, rules: ValidationRule<T>[]): { valid: boolean; errors: string[] } {
    const errors = rules
      .map((rule) => rule.validate(entity))
      .filter((message): message is string => Boolean(message));

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  protected transformError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }
    return new Error(String(error));
  }

  protected async executeOperation<T>(operation: () => Promise<T>, action: string, entity: string): Promise<ServiceResult<T>> {
    const meta = {
      action,
      entity,
      timestamp: new Date().toISOString(),
    };

    try {
      const data = await operation();
      return {
        success: true,
        data,
        meta,
      };
    } catch (error) {
      const normalized = this.transformError(error);
      logger.error(action + ' failed', normalized);
      return {
        success: false,
        error: normalized,
        meta,
      };
    }
  }
}
