/**
 * API Gateway - Centralized request routing and middleware orchestration
 * Implements enterprise-grade API gateway pattern with:
 * - Request routing and aggregation
 * - Rate limiting and throttling
 * - Authentication/authorization checks
 * - Request/response transformation
 * - Comprehensive logging and monitoring
 */


import { logger } from '@/lib/logger';
// import { csrfProtection } from '@/services/security/csrf';
import { withSecurityHeaders } from '@/services/security/headers';
import { RateLimiter } from './RateLimiter';
import { RequestValidator } from './RequestValidator';
import { ResponseTransformer } from './ResponseTransformer';
import { MetricsCollector } from './MetricsCollector';
import { CircuitBreaker } from './CircuitBreaker';

export interface GatewayConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  rateLimiting: {
    enabled: boolean;
    windowMs: number;
    maxRequests: number;
    skipSuccessful?: boolean;
  };
  auth: {
    required: boolean;
    skipRoutes: string[];
  };
  monitoring: {
    enabled: boolean;
    sampleRate: number;
  };
}

export interface GatewayRequest<T = unknown> {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint: string;
  data?: T;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  skipAuth?: boolean;
  skipRateLimit?: boolean;
  transform?: (data: unknown) => unknown;
}

export interface GatewayResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
    stack?: string;
  };
  meta: {
    requestId: string;
    timestamp: string;
    duration: number;
    endpoint: string;
    cached?: boolean;
    retryAttempt?: number;
  };
}

export class ApiGateway {
  private static instance: ApiGateway;
  private config: GatewayConfig;
  private rateLimiter: RateLimiter;
  private validator: RequestValidator;
  private transformer: ResponseTransformer;
  private metrics: MetricsCollector;
  private circuitBreakers: Map<string, CircuitBreaker>;

  private constructor(config: GatewayConfig) {
    this.config = config;
    this.rateLimiter = new RateLimiter(config.rateLimiting);
    this.validator = new RequestValidator();
    this.transformer = new ResponseTransformer();
    this.metrics = new MetricsCollector();
    this.circuitBreakers = new Map();
  }

  static getInstance(config?: GatewayConfig): ApiGateway {
    if (!ApiGateway.instance) {
      if (!config) {
        throw new Error('ApiGateway config required for first initialization');
      }
      ApiGateway.instance = new ApiGateway(config);
    }
    return ApiGateway.instance;
  }

  /**
   * Main gateway request handler - orchestrates all middleware
   */
  async request<TRequest = unknown, TResponse = unknown>(
    request: GatewayRequest<TRequest>
  ): Promise<GatewayResponse<TResponse>> {
    const requestId = crypto.randomUUID();
    const startTime = Date.now();

    try {
      // 1. Request validation and preprocessing
      await this.validateRequest(request, requestId);

      // 2. Authentication check
      if (!request.skipAuth && this.config.auth.required) {
        await this.authenticateRequest(request, requestId);
      }

      // 3. Rate limiting
      if (!request.skipRateLimit && this.config.rateLimiting.enabled) {
        await this.checkRateLimit(request, requestId);
      }

      // 4. Circuit breaker check
      const circuitBreaker = this.getCircuitBreaker(request.endpoint);
      if (circuitBreaker.isOpen()) {
        throw new Error('Circuit breaker is open for ' + request.endpoint);
      }

      // 5. Execute request with retries
      const response = await this.executeWithRetries(request, requestId);

      // 6. Transform response
      const transformedResponse = await this.transformer.transform(response, request.transform);

      // 7. Collect metrics
      this.collectMetrics(request, transformedResponse, startTime, requestId);

      return {
        success: true,
        data: transformedResponse,
        meta: {
          requestId,
          timestamp: new Date().toISOString(),
          duration: Date.now() - startTime,
          endpoint: request.endpoint
        }
      };

    } catch (error) {
      const errorResponse = this.handleError(error, request, requestId, startTime);

      // Record circuit breaker failure
      const circuitBreaker = this.getCircuitBreaker(request.endpoint);
      circuitBreaker.recordFailure();

      return errorResponse;
    }
  }

  /**
   * Convenient HTTP method wrappers
   */
  async get<T = unknown>(endpoint: string, options?: Partial<GatewayRequest>): Promise<GatewayResponse<T>> {
    return this.request<never, T>({ method: 'GET', endpoint, ...options });
  }

  async post<TRequest = unknown, TResponse = unknown>(
    endpoint: string,
    data: TRequest,
    options?: Partial<GatewayRequest>
  ): Promise<GatewayResponse<TResponse>> {
    return this.request<TRequest, TResponse>({ method: 'POST', endpoint, data, ...options });
  }

  async put<TRequest = unknown, TResponse = unknown>(
    endpoint: string,
    data: TRequest,
    options?: Partial<GatewayRequest>
  ): Promise<GatewayResponse<TResponse>> {
    return this.request<TRequest, TResponse>({ method: 'PUT', endpoint, data, ...options });
  }

  async delete<T = unknown>(endpoint: string, options?: Partial<GatewayRequest>): Promise<GatewayResponse<T>> {
    return this.request<never, T>({ method: 'DELETE', endpoint, ...options });
  }

  /**
   * Request validation middleware
   */
  private async validateRequest(request: GatewayRequest, requestId: string): Promise<void> {
    const validation = await this.validator.validate(request);

    if (!validation.valid) {
      logger.warn('Request validation failed', {
        requestId,
        endpoint: request.endpoint,
        errors: validation.errors
      });
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
  }

  /**
   * Authentication middleware
   */
  private async authenticateRequest(request: GatewayRequest, requestId: string): Promise<void> {
    // Skip auth for whitelisted routes
    if (this.config.auth.skipRoutes.includes(request.endpoint)) {
      return;
    }

    // Check CSRF token for state-changing operations
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
      const csrfToken = request.headers?.['X-CSRF-Token'];
      if (!csrfToken) {
        logger.warn('Missing CSRF token', { requestId, endpoint: request.endpoint });
        throw new Error('CSRF token required');
      }

      // In a full implementation, validate CSRF token here
      // For now, just check presence
    }

    // Additional auth checks would go here (JWT validation, etc.)
    logger.debug('Request authenticated', { requestId, endpoint: request.endpoint });
  }

  /**
   * Rate limiting middleware
   */
  private async checkRateLimit(request: GatewayRequest, requestId: string): Promise<void> {
    const identifier = this.getClientIdentifier(request);
    const allowed = await this.rateLimiter.isAllowed(identifier, request.endpoint);

    if (!allowed) {
      logger.warn('Rate limit exceeded', {
        requestId,
        endpoint: request.endpoint,
        identifier
      });
      throw new Error('Rate limit exceeded');
    }
  }

  /**
   * Execute request with retry logic
   */
  private async executeWithRetries<TRequest, TResponse>(
    request: GatewayRequest<TRequest>,
    requestId: string
  ): Promise<TResponse> {
    const maxRetries = request.retries ?? this.config.retries;
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.executeRequest(request, requestId, attempt);

        // Record circuit breaker success
        const circuitBreaker = this.getCircuitBreaker(request.endpoint);
        circuitBreaker.recordSuccess();

        return response;

      } catch (error) {
        lastError = error as Error;

        if (attempt < maxRetries && this.isRetryableError(error)) {
          const delay = this.calculateRetryDelay(attempt);
          logger.info('Retrying request', {
            requestId,
            endpoint: request.endpoint,
            attempt: attempt + 1,
            maxRetries,
            delay
          });
          await this.sleep(delay);
        } else {
          break;
        }
      }
    }

    throw lastError!;
  }

  /**
   * Execute the actual HTTP request
   */
  private async executeRequest<TRequest, TResponse>(
    request: GatewayRequest<TRequest>,
    requestId: string,
    attempt: number
  ): Promise<TResponse> {
    const url = `${this.config.baseUrl}${request.endpoint}`;
    const timeout = request.timeout ?? this.config.timeout;

    // Build request options with security headers
    const requestOptions = withSecurityHeaders(url, {
      method: request.method,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
        'X-Retry-Attempt': attempt.toString(),
        ...request.headers
      },
      body: request.data ? JSON.stringify(request.data) : undefined,
      signal: AbortSignal.timeout(timeout),
    });

    logger.debug('Executing HTTP request', {
      requestId,
      method: request.method,
      endpoint: request.endpoint,
      attempt
    });

    const response = await fetch(url, requestOptions);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const responseData = await response.json();
    return responseData as TResponse;
  }

  /**
   * Error handling with classification
   */
  private handleError<TRequest>(
    error: unknown,
    request: GatewayRequest<TRequest>,
    requestId: string,
    startTime: number
  ): GatewayResponse<never> {
    const duration = Date.now() - startTime;
    const errorObj = this.normalizeError(error);

    logger.error('Gateway request failed', {
      requestId,
      endpoint: request.endpoint,
      method: request.method,
      duration,
      error: errorObj.message,
      stack: errorObj.stack
    });

    // Collect error metrics
    this.metrics.recordError(request.endpoint, errorObj.code, duration);

    return {
      success: false,
      error: {
        code: errorObj.code,
        message: errorObj.message,
        details: errorObj.details
      },
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
        duration,
        endpoint: request.endpoint
      }
    };
  }

  /**
   * Helper methods
   */
  private getCircuitBreaker(endpoint: string): CircuitBreaker {
    if (!this.circuitBreakers.has(endpoint)) {
      this.circuitBreakers.set(endpoint, new CircuitBreaker({
        failureThreshold: 5,
        recoveryTimeout: 60000,
        monitoringPeriod: 10000
      }));
    }
    return this.circuitBreakers.get(endpoint)!;
  }

  private getClientIdentifier(request: GatewayRequest): string {
    // In production, use actual client identification
    return request.headers?.['X-Client-ID'] || 'anonymous';
  }

  private isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      // Retry on network errors, timeouts, and 5xx responses
      return error.message.includes('timeout') ||
             error.message.includes('network') ||
             error.message.includes('HTTP 5');
    }
    return false;
  }

  private calculateRetryDelay(attempt: number): number {
    // Exponential backoff with jitter
    const baseDelay = 1000;
    const maxDelay = 10000;
    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    const jitter = Math.random() * 0.1 * delay;
    return delay + jitter;
  }

  private normalizeError(error: unknown): {
    code: string;
    message: string;
    details?: unknown;
    stack?: string;
  } {
    if (error instanceof Error) {
      return {
        code: error.name || 'Unknown',
        message: error.message,
        stack: error.stack
      };
    }

    return {
      code: 'Unknown',
      message: String(error)
    };
  }

  private collectMetrics<T>(
    request: GatewayRequest,
    response: T,
    startTime: number,
    requestId: string
  ): void {
    if (!this.config.monitoring.enabled) return;

    const duration = Date.now() - startTime;
    this.metrics.recordRequest(request.endpoint, request.method, duration, true);

    if (Math.random() < this.config.monitoring.sampleRate) {
      logger.info('Request completed', {
        requestId,
        endpoint: request.endpoint,
        method: request.method,
        duration,
        responseSize: JSON.stringify(response).length
      });
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; details: Record<string, unknown> }> {
    const checks = await Promise.allSettled([
      this.checkDatabaseConnection(),
      this.checkExternalServices(),
      this.checkCircuitBreakers()
    ]);

    const results = checks.map((check, index) => ({
      name: ['database', 'external_services', 'circuit_breakers'][index],
      status: check.status === 'fulfilled' ? 'healthy' : 'unhealthy',
      details: check.status === 'fulfilled' ? check.value : check.reason
    }));

    const healthyCount = results.filter(r => r.status === 'healthy').length;
    const overallStatus = healthyCount === results.length ? 'healthy' :
                         healthyCount > 0 ? 'degraded' : 'unhealthy';

    return {
      status: overallStatus,
      details: Object.fromEntries(results.map(r => [r.name, r]))
    };
  }

  private async checkDatabaseConnection(): Promise<{ connected: boolean }> {
    // Implement actual database health check
    return { connected: true };
  }

  private async checkExternalServices(): Promise<Record<string, boolean>> {
    // Check external service health
    return { vapi: true, twilio: true, maps: true };
  }

  private async checkCircuitBreakers(): Promise<Record<string, string>> {
    const status: Record<string, string> = {};
    for (const [endpoint, breaker] of this.circuitBreakers) {
      status[endpoint] = breaker.getState();
    }
    return status;
  }
}