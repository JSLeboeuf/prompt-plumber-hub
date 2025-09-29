/**
 * Unified API Client
 * Consolidates all API patterns into a single, maintainable architecture
 * - Type-safe requests with validation
 * - Comprehensive error handling and retry logic
 * - Circuit breaker pattern for external services
 * - Request/response interceptors
 * - Automatic authentication handling
 * - Rate limiting and caching support
 */

import { logger } from '@/lib/logger';
import { ErrorHandler, type StandardError } from '@/services/errors/ErrorHandler';
import { apiConfig, getAuthHeaders, validateResponse } from '@/config/api.secure';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

// Request/Response Types
export interface APIRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint: string;
  data?: unknown;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  useCircuitBreaker?: boolean;
  bypassCache?: boolean;
  validateInput?: (data: unknown) => boolean;
  validateOutput?: (data: unknown) => boolean;
}

export interface APIResponse<T = unknown> {
  data: T;
  status: number;
  headers: Record<string, string>;
  requestId: string;
  timestamp: string;
  cached?: boolean;
}

export interface APIErrorResponse {
  error: StandardError;
  requestId: string;
  timestamp: string;
}

// Configuration
export interface UnifiedAPIConfig {
  baseUrl: string;
  timeout: number;
  maxRetries: number;
  enableCaching: boolean;
  cacheTimeout: number;
  enableCircuitBreaker: boolean;
  rateLimit: {
    enabled: boolean;
    requestsPerMinute: number;
  };
  authentication: {
    enabled: boolean;
    autoRefresh: boolean;
  };
}

// Cache entry
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

// Rate limiting
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

/**
 * Unified API Client - Single source of truth for all API operations
 */
export class UnifiedAPIClient {
  private static instance: UnifiedAPIClient;
  private errorHandler: ErrorHandler;
  private cache = new Map<string, CacheEntry<unknown>>();
  private rateLimits = new Map<string, RateLimitEntry>();
  private currentUser: User | null = null;
  private authToken: string | null = null;
  private requestInterceptors: Array<(request: APIRequest) => Promise<APIRequest>> = [];
  private responseInterceptors: Array<(response: APIResponse) => Promise<APIResponse>> = [];

  private config: UnifiedAPIConfig = {
    baseUrl: apiConfig.baseUrl,
    timeout: apiConfig.timeout,
    maxRetries: 3,
    enableCaching: true,
    cacheTimeout: 5 * 60 * 1000, // 5 minutes
    enableCircuitBreaker: true,
    rateLimit: {
      enabled: true,
      requestsPerMinute: 100,
    },
    authentication: {
      enabled: true,
      autoRefresh: true,
    },
  };

  private constructor(config?: Partial<UnifiedAPIConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    
    this.errorHandler = ErrorHandler.getInstance();
    this.initializeAuth();
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: Partial<UnifiedAPIConfig>): UnifiedAPIClient {
    if (!UnifiedAPIClient.instance) {
      UnifiedAPIClient.instance = new UnifiedAPIClient(config);
    }
    return UnifiedAPIClient.instance;
  }

  /**
   * Initialize authentication
   */
  private async initializeAuth(): Promise<void> {
    if (!this.config.authentication.enabled) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        this.currentUser = session.user;
        this.authToken = session.access_token;
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange((event, session) => {
        if (session) {
          this.currentUser = session.user;
          this.authToken = session.access_token;
        } else {
          this.currentUser = null;
          this.authToken = null;
        }
      });
    } catch (error) {
      logger.warn('Failed to initialize authentication', { error });
    }
  }

  /**
   * Main request method - handles all HTTP operations
   */
  async request<T = unknown>(request: APIRequest): Promise<APIResponse<T>> {
    const requestId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    
    try {
      // Apply request interceptors
      let processedRequest = request;
      for (const interceptor of this.requestInterceptors) {
        processedRequest = await interceptor(processedRequest);
      }

      // Input validation
      if (processedRequest.validateInput && processedRequest.data) {
        if (!processedRequest.validateInput(processedRequest.data)) {
          throw new Error('Request validation failed');
        }
      }

      // Check rate limit
      this.checkRateLimit(processedRequest.endpoint);

      // Check cache for GET requests
      if (processedRequest.method === 'GET' && !processedRequest.bypassCache) {
        const cached = this.getFromCache<T>(processedRequest.endpoint);
        if (cached) {
          return {
            data: cached,
            status: 200,
            headers: {},
            requestId,
            timestamp,
            cached: true,
          };
        }
      }

      // Execute request with error handling and retries
      const response = await this.errorHandler.executeWithErrorHandling(
        () => this.executeRequest<T>(processedRequest, requestId),
        {
          source: 'UnifiedAPIClient',
          operation: `${processedRequest.method} ${processedRequest.endpoint}`,
          correlationId: requestId,
          retryConfig: {
            maxAttempts: processedRequest.retries ?? this.config.maxRetries,
          },
        }
      );

      // Output validation
      if (processedRequest.validateOutput && !processedRequest.validateOutput(response.data)) {
        throw new Error('Response validation failed');
      }

      // Security validation
      if (!validateResponse(response.data)) {
        throw new Error('Response security validation failed');
      }

      // Cache successful GET responses
      if (processedRequest.method === 'GET' && this.config.enableCaching) {
        this.setCache(processedRequest.endpoint, response.data);
      }

      // Apply response interceptors
      let processedResponse = response;
      for (const interceptor of this.responseInterceptors) {
        processedResponse = await interceptor(processedResponse);
      }

      return processedResponse;

    } catch (error) {
      const standardError = this.errorHandler.handleError(error, {
        source: 'UnifiedAPIClient',
        operation: `${request.method} ${request.endpoint}`,
        correlationId: requestId,
        userId: this.currentUser?.id,
      });

      throw {
        error: standardError,
        requestId,
        timestamp,
      } as APIErrorResponse;
    }
  }

  /**
   * Execute the actual HTTP request
   */
  private async executeRequest<T>(
    request: APIRequest,
    requestId: string
  ): Promise<APIResponse<T>> {
    const url = this.buildUrl(request.endpoint);
    const headers = this.buildHeaders(request.headers);
    const timeout = request.timeout ?? this.config.timeout;

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const fetchOptions: RequestInit = {
        method: request.method,
        headers,
        signal: controller.signal,
        credentials: 'include',
      };

      // Add body for non-GET requests
      if (request.data && request.method !== 'GET') {
        fetchOptions.body = JSON.stringify(request.data);
      }

      logger.debug('API Request', {
        requestId,
        method: request.method,
        url,
        headers: this.sanitizeHeaders(headers),
      });

      const response = await fetch(url, fetchOptions);
      
      // Parse response
      const responseData = await this.parseResponse<T>(response);
      
      const apiResponse: APIResponse<T> = {
        data: responseData,
        status: response.status,
        headers: this.extractHeaders(response.headers),
        requestId,
        timestamp: new Date().toISOString(),
      };

      logger.debug('API Response', {
        requestId,
        status: response.status,
        dataType: typeof responseData,
      });

      return apiResponse;

    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Parse response based on content type
   */
  private async parseResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorData: unknown;
      try {
        errorData = await response.json();
      } catch {
        errorData = await response.text();
      }
      
      interface HTTPError extends Error {
        status: number;
        data: unknown;
      }
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`) as HTTPError;
      error.status = response.status;
      error.data = errorData;
      throw error;
    }

    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      return await response.json();
    }
    
    if (contentType?.includes('text/')) {
      return await response.text() as T;
    }
    
    return await response.blob() as T;
  }

  /**
   * Build complete URL
   */
  private buildUrl(endpoint: string): string {
    if (endpoint.startsWith('http')) {
      return endpoint;
    }
    
    const baseUrl = this.config.baseUrl.endsWith('/') 
      ? this.config.baseUrl.slice(0, -1) 
      : this.config.baseUrl;
    
    const cleanEndpoint = endpoint.startsWith('/') 
      ? endpoint 
      : `/${endpoint}`;
    
    return `${baseUrl}${cleanEndpoint}`;
  }

  /**
   * Build request headers
   */
  private buildHeaders(additionalHeaders?: Record<string, string>): Record<string, string> {
    const headers = {
      ...apiConfig.headers,
      ...getAuthHeaders(this.authToken || undefined),
      ...additionalHeaders,
    };

    return headers;
  }

  /**
   * Sanitize headers for logging (remove sensitive data)
   */
  private sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
    const sanitized = { ...headers };
    const sensitiveKeys = ['authorization', 'x-api-key', 'x-csrf-token'];
    
    for (const key of sensitiveKeys) {
      if (sanitized[key.toLowerCase()]) {
        sanitized[key.toLowerCase()] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }

  /**
   * Extract headers from Response
   */
  private extractHeaders(headers: Headers): Record<string, string> {
    const result: Record<string, string> = {};
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  /**
   * Rate limiting check
   */
  private checkRateLimit(endpoint: string): void {
    if (!this.config.rateLimit.enabled) return;

    const now = Date.now();
    const minute = 60 * 1000;
    const key = this.getRateLimitKey(endpoint);
    
    let entry = this.rateLimits.get(key);
    
    if (!entry || (now - entry.resetTime) > minute) {
      entry = { count: 0, resetTime: now };
      this.rateLimits.set(key, entry);
    }
    
    entry.count++;
    
    if (entry.count > this.config.rateLimit.requestsPerMinute) {
      interface RateLimitError extends Error {
        retryAfter: number;
      }
      const error = new Error('Rate limit exceeded') as RateLimitError;
      error.retryAfter = minute - (now - entry.resetTime);
      throw error;
    }
  }

  /**
   * Get rate limit key
   */
  private getRateLimitKey(endpoint: string): string {
    // Group by endpoint pattern, not exact URL
    const pattern = endpoint.replace(/\/\d+/g, '/:id').replace(/\?.*/g, '');
    return `${this.currentUser?.id || 'anonymous'}:${pattern}`;
  }

  /**
   * Cache management
   */
  private getFromCache<T>(key: string): T | null {
    if (!this.config.enableCaching) return null;
    
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  private setCache(key: string, data: unknown): void {
    if (!this.config.enableCaching) return;
    
    const entry: CacheEntry<unknown> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.config.cacheTimeout,
    };
    
    this.cache.set(key, entry);
  }

  /**
   * Convenience methods for common HTTP operations
   */
  async get<T = unknown>(
    endpoint: string, 
    options?: Omit<APIRequest, 'method' | 'endpoint' | 'data'>
  ): Promise<APIResponse<T>> {
    return this.request<T>({
      method: 'GET',
      endpoint,
      ...options,
    });
  }

  async post<T = unknown>(
    endpoint: string,
    data?: unknown,
    options?: Omit<APIRequest, 'method' | 'endpoint' | 'data'>
  ): Promise<APIResponse<T>> {
    return this.request<T>({
      method: 'POST',
      endpoint,
      data,
      ...options,
    });
  }

  async put<T = unknown>(
    endpoint: string,
    data?: unknown,
    options?: Omit<APIRequest, 'method' | 'endpoint' | 'data'>
  ): Promise<APIResponse<T>> {
    return this.request<T>({
      method: 'PUT',
      endpoint,
      data,
      ...options,
    });
  }

  async patch<T = unknown>(
    endpoint: string,
    data?: unknown,
    options?: Omit<APIRequest, 'method' | 'endpoint' | 'data'>
  ): Promise<APIResponse<T>> {
    return this.request<T>({
      method: 'PATCH',
      endpoint,
      data,
      ...options,
    });
  }

  async delete<T = unknown>(
    endpoint: string,
    options?: Omit<APIRequest, 'method' | 'endpoint' | 'data'>
  ): Promise<APIResponse<T>> {
    return this.request<T>({
      method: 'DELETE',
      endpoint,
      ...options,
    });
  }

  /**
   * Interceptor management
   */
  addRequestInterceptor(interceptor: (request: APIRequest) => Promise<APIRequest>): void {
    this.requestInterceptors.push(interceptor);
  }

  addResponseInterceptor(interceptor: (response: APIResponse) => Promise<APIResponse>): void {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Cache management
   */
  clearCache(): void {
    this.cache.clear();
  }

  invalidateCache(pattern?: string): void {
    if (!pattern) {
      this.clearCache();
      return;
    }

    const regex = new RegExp(pattern);
    for (const [key] of this.cache) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Configuration updates
   */
  updateConfig(config: Partial<UnifiedAPIConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): Readonly<UnifiedAPIConfig> {
    return Object.freeze({ ...this.config });
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    checks: {
      api: boolean;
      auth: boolean;
      cache: boolean;
    };
  }> {
    const timestamp = new Date().toISOString();
    const checks = {
      api: false,
      auth: false,
      cache: true, // Cache is always available
    };

    try {
      // Test API connectivity
      await this.get('/health', { timeout: 5000 });
      checks.api = true;
    } catch {
      // API check failed
    }

    try {
      // Test auth
      if (this.config.authentication.enabled) {
        const { data } = await supabase.auth.getUser();
        checks.auth = !!data.user;
      } else {
        checks.auth = true; // Auth not required
      }
    } catch {
      // Auth check failed
    }

    const healthyChecks = Object.values(checks).filter(Boolean).length;
    const totalChecks = Object.keys(checks).length;
    
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyChecks === totalChecks) {
      status = 'healthy';
    } else if (healthyChecks > 0) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      timestamp,
      checks,
    };
  }
}

// Export singleton instance
export const unifiedAPI = UnifiedAPIClient.getInstance();

// Export types
export type {
  APIRequest,
  APIResponse,
  APIErrorResponse,
  UnifiedAPIConfig,
};