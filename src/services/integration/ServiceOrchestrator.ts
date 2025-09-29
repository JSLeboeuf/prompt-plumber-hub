/**
 * Service Orchestrator - Unified interface for all API integrations
 * Coordinates between internal services, external APIs, and provides
 * a single point of configuration and monitoring
 */

import { logger } from '@/lib/logger';
import { ApiGateway } from '@/services/gateway/ApiGateway';
import { ErrorHandler, ErrorCategory } from '@/services/errors/ErrorHandler';
import { SecurityMiddleware } from '@/services/security/SecurityMiddleware';
import { ServiceRegistry } from '@/services/core/ServiceRegistry';
import type { SupabaseService } from '@/services/supabaseServices';

export interface ServiceConfig {
  name: string;
  baseUrl?: string;
  timeout?: number;
  retries?: number;
  circuitBreaker?: {
    enabled: boolean;
    failureThreshold: number;
    recoveryTimeout: number;
  };
  authentication?: {
    type: 'none' | 'bearer' | 'api-key' | 'oauth';
    credentials?: Record<string, string>;
  };
  rateLimiting?: {
    enabled: boolean;
    maxRequests: number;
    windowMs: number;
  };
}

export interface OrchestrationContext {
  correlationId: string;
  userId?: string;
  clientId?: string;
  source: string;
  operation: string;
  timeout?: number;
  priority?: 'low' | 'normal' | 'high';
}

export interface ServiceResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    category: ErrorCategory;
    code: string;
    message: string;
    retryable: boolean;
  };
  metadata: {
    correlationId: string;
    duration: number;
    service: string;
    cached?: boolean;
    retryAttempt?: number;
  };
}

export class ServiceOrchestrator {
  private static instance: ServiceOrchestrator;
  private registry: ServiceRegistry;
  private gateway: ApiGateway;
  private errorHandler: ErrorHandler;
  private security: SecurityMiddleware;
  private serviceConfigs = new Map<string, ServiceConfig>();
  private cacheStore = new Map<string, { data: unknown; expiry: number }>();

  private constructor() {
    this.registry = ServiceRegistry.getInstance();
    this.errorHandler = ErrorHandler.getInstance();
    this.security = SecurityMiddleware.getInstance();
  }

  static getInstance(): ServiceOrchestrator {
    if (!ServiceOrchestrator.instance) {
      ServiceOrchestrator.instance = new ServiceOrchestrator();
    }
    return ServiceOrchestrator.instance;
  }

  /**
   * Initialize the orchestrator with service configurations
   */
  async initialize(configs: Record<string, ServiceConfig>): Promise<void> {
    logger.info('Initializing Service Orchestrator', { services: Object.keys(configs) });

    // Store service configurations
    for (const [name, config] of Object.entries(configs)) {
      this.serviceConfigs.set(name, config);
    }

    // Initialize API Gateway
    this.gateway = this.registry.getService<ApiGateway>('ApiGateway');

    logger.info('Service Orchestrator initialized successfully');
  }

  /**
   * Execute a Supabase operation
   */
  async executeSupabaseOperation<T>(
    operation: string,
    params: Record<string, unknown>,
    context: OrchestrationContext
  ): Promise<ServiceResponse<T>> {
    return this.executeServiceOperation(
      'supabase',
      async () => {
        const supabaseService = this.registry.getService<SupabaseService>('SupabaseService');

        switch (operation) {
          case 'fetchData':
            return await supabaseService.fetchData(
              params.table as string,
              params.filters as Record<string, unknown>
            );

          case 'insertData':
            return await supabaseService.insertData(
              params.table as string,
              params.data as Record<string, unknown>
            );

          case 'updateData':
            return await supabaseService.updateData(
              params.table as string,
              params.id as string,
              params.data as Record<string, unknown>
            );

          case 'deleteData':
            await supabaseService.deleteData(
              params.table as string,
              params.id as string
            );
            return true;

          default:
            throw new Error(`Unknown Supabase operation: ${operation}`);
        }
      },
      context
    );
  }

  /**
   * Execute a VAPI operation
   */
  async executeVapiOperation<T>(
    operation: string,
    params: Record<string, unknown>,
    context: OrchestrationContext
  ): Promise<ServiceResponse<T>> {
    return this.executeExternalServiceOperation(
      'vapi',
      async () => {
        switch (operation) {
          case 'makeCall':
            return await this.gateway.post('/functions/v1/vapi-call', {
              phone_number: params.phoneNumber,
              assistant_id: params.assistantId,
              context: params.context
            });

          case 'getCallStatus':
            return await this.gateway.get(`/functions/v1/vapi-call/${params.callId}`);

          default:
            throw new Error(`Unknown VAPI operation: ${operation}`);
        }
      },
      context
    );
  }

  /**
   * Execute a Twilio SMS operation
   */
  async executeTwilioOperation<T>(
    operation: string,
    params: Record<string, unknown>,
    context: OrchestrationContext
  ): Promise<ServiceResponse<T>> {
    return this.executeExternalServiceOperation(
      'twilio',
      async () => {
        switch (operation) {
          case 'sendSms':
            return await this.gateway.post('/functions/v1/send-sms', {
              to: params.to,
              message: params.message,
              priority: params.priority
            });

          case 'getSmsStatus':
            return await this.gateway.get(`/functions/v1/sms-status/${params.messageId}`);

          default:
            throw new Error(`Unknown Twilio operation: ${operation}`);
        }
      },
      context
    );
  }

  /**
   * Execute a Google Maps operation
   */
  async executeGoogleMapsOperation<T>(
    operation: string,
    params: Record<string, unknown>,
    context: OrchestrationContext
  ): Promise<ServiceResponse<T>> {
    return this.executeExternalServiceOperation(
      'google-maps',
      async () => {
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          throw new Error('Google Maps API key not configured');
        }

        switch (operation) {
          case 'geocode': {
            const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(params.address as string)}&key=${apiKey}`;
            return await fetch(geocodeUrl).then(res => res.json());
          }

          case 'distanceMatrix': {
            const distanceUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(params.origins as string)}&destinations=${encodeURIComponent(params.destinations as string)}&key=${apiKey}`;
            return await fetch(distanceUrl).then(res => res.json());
          }

          default:
            throw new Error(`Unknown Google Maps operation: ${operation}`);
        }
      },
      context
    );
  }

  /**
   * Execute a n8n webhook operation
   */
  async executeN8nOperation<T>(
    operation: string,
    params: Record<string, unknown>,
    context: OrchestrationContext
  ): Promise<ServiceResponse<T>> {
    return this.executeExternalServiceOperation(
      'n8n',
      async () => {
        const webhookUrl = this.getN8nWebhookUrl(operation);

        return await this.gateway.post(webhookUrl, {
          event: operation,
          data: params,
          metadata: {
            correlationId: context.correlationId,
            timestamp: new Date().toISOString(),
            source: context.source
          }
        });
      },
      context
    );
  }

  /**
   * Execute batch operations with parallel processing
   */
  async executeBatchOperations<T>(
    operations: Array<{
      service: string;
      operation: string;
      params: Record<string, unknown>;
      context: OrchestrationContext;
    }>,
    options: {
      maxConcurrency?: number;
      failFast?: boolean;
      timeout?: number;
    } = {}
  ): Promise<Array<ServiceResponse<T>>> {
    const { maxConcurrency = 5, failFast = false, timeout = 30000 } = options;

    logger.info('Executing batch operations', {
      count: operations.length,
      maxConcurrency,
      failFast
    });

    // Process in batches to control concurrency
    const results: Array<ServiceResponse<T>> = [];
    const batches = this.chunkArray(operations, maxConcurrency);

    for (const batch of batches) {
      const batchPromises = batch.map(async (op) => {
        try {
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Operation timeout')), timeout);
          });

          const operationPromise = this.executeOperation(
            op.service,
            op.operation,
            op.params,
            op.context
          );

          return await Promise.race([operationPromise, timeoutPromise]);
        } catch (error) {
          if (failFast) {
            throw error;
          }

          return this.errorHandler.handleError(error, {
            source: 'batch_operation',
            operation: `${op.service}.${op.operation}`,
            correlationId: op.context.correlationId
          });
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);

      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value as ServiceResponse<T>);
        } else {
          if (failFast) {
            throw result.reason;
          }
          // Convert rejected promise to error response
          results.push({
            success: false,
            error: {
              category: ErrorCategory.SERVER_ERROR,
              code: 'BATCH_OPERATION_FAILED',
              message: result.reason instanceof Error ? result.reason.message : String(result.reason),
              retryable: true
            },
            metadata: {
              correlationId: crypto.randomUUID(),
              duration: 0,
              service: 'batch'
            }
          });
        }
      }
    }

    return results;
  }

  /**
   * Generic operation execution router
   */
  async executeOperation<T>(
    service: string,
    operation: string,
    params: Record<string, unknown>,
    context: OrchestrationContext
  ): Promise<ServiceResponse<T>> {
    const startTime = Date.now();

    logger.debug('Executing service operation', {
      service,
      operation,
      correlationId: context.correlationId
    });

    try {
      switch (service) {
        case 'supabase':
          return await this.executeSupabaseOperation(operation, params, context);

        case 'vapi':
          return await this.executeVapiOperation(operation, params, context);

        case 'twilio':
          return await this.executeTwilioOperation(operation, params, context);

        case 'google-maps':
          return await this.executeGoogleMapsOperation(operation, params, context);

        case 'n8n':
          return await this.executeN8nOperation(operation, params, context);

        default:
          throw new Error(`Unknown service: ${service}`);
      }
    } catch (error) {
      const standardError = this.errorHandler.handleError(error, {
        source: 'service_orchestrator',
        operation: `${service}.${operation}`,
        correlationId: context.correlationId
      });

      return {
        success: false,
        error: {
          category: standardError.category,
          code: standardError.code,
          message: standardError.message,
          retryable: standardError.retryable
        },
        metadata: {
          correlationId: context.correlationId,
          duration: Date.now() - startTime,
          service
        }
      };
    }
  }

  /**
   * Execute internal service operations (Supabase, local services)
   */
  private async executeServiceOperation<T>(
    serviceName: string,
    operation: () => Promise<T>,
    context: OrchestrationContext
  ): Promise<ServiceResponse<T>> {
    const startTime = Date.now();

    try {
      const result = await this.errorHandler.executeWithErrorHandling(
        operation,
        {
          source: 'service_orchestrator',
          operation: serviceName,
          correlationId: context.correlationId
        }
      );

      return {
        success: true,
        data: result,
        metadata: {
          correlationId: context.correlationId,
          duration: Date.now() - startTime,
          service: serviceName
        }
      };
    } catch (error) {
      const standardError = this.errorHandler.handleError(error, {
        source: 'service_orchestrator',
        operation: serviceName,
        correlationId: context.correlationId
      });

      return {
        success: false,
        error: {
          category: standardError.category,
          code: standardError.code,
          message: standardError.message,
          retryable: standardError.retryable
        },
        metadata: {
          correlationId: context.correlationId,
          duration: Date.now() - startTime,
          service: serviceName
        }
      };
    }
  }

  /**
   * Execute external service operations with circuit breaker
   */
  private async executeExternalServiceOperation<T>(
    serviceName: string,
    operation: () => Promise<T>,
    context: OrchestrationContext
  ): Promise<ServiceResponse<T>> {
    const startTime = Date.now();

    try {
      const result = await this.errorHandler.executeWithCircuitBreaker(
        operation,
        {
          source: 'service_orchestrator',
          circuitBreakerKey: serviceName,
          fallback: async () => {
            // Check cache for fallback data
            const cacheKey = `${serviceName}:${context.operation}:${JSON.stringify(context)}`;
            const cached = this.cacheStore.get(cacheKey);

            if (cached && Date.now() < cached.expiry) {
              logger.info('Returning cached fallback data', {
                service: serviceName,
                correlationId: context.correlationId
              });
              return cached.data as T;
            }

            throw new Error(`Service ${serviceName} unavailable and no cached data`);
          }
        }
      );

      // Cache successful responses
      const cacheKey = `${serviceName}:${context.operation}:${JSON.stringify(context)}`;
      this.cacheStore.set(cacheKey, {
        data: result,
        expiry: Date.now() + (5 * 60 * 1000) // 5 minute cache
      });

      return {
        success: true,
        data: result,
        metadata: {
          correlationId: context.correlationId,
          duration: Date.now() - startTime,
          service: serviceName
        }
      };
    } catch (error) {
      const standardError = this.errorHandler.handleError(error, {
        source: 'service_orchestrator',
        operation: serviceName,
        correlationId: context.correlationId
      });

      return {
        success: false,
        error: {
          category: standardError.category,
          code: standardError.code,
          message: standardError.message,
          retryable: standardError.retryable
        },
        metadata: {
          correlationId: context.correlationId,
          duration: Date.now() - startTime,
          service: serviceName
        }
      };
    }
  }

  /**
   * Helper methods
   */
  private getN8nWebhookUrl(operation: string): string {
    const baseUrl = process.env.N8N_WEBHOOK_BASE_URL || 'https://n8n.example.com/webhook';
    return `${baseUrl}/${operation}`;
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Health check for all configured services
   */
  async healthCheck(): Promise<Record<string, { status: string; latency?: number; error?: string }>> {
    const results: Record<string, { status: string; latency?: number; error?: string }> = {};

    const healthChecks = Array.from(this.serviceConfigs.keys()).map(async (serviceName) => {
      const startTime = Date.now();

      try {
        // Perform service-specific health check
        await this.performServiceHealthCheck(serviceName);

        results[serviceName] = {
          status: 'healthy',
          latency: Date.now() - startTime
        };
      } catch (error) {
        results[serviceName] = {
          status: 'unhealthy',
          latency: Date.now() - startTime,
          error: error instanceof Error ? error.message : String(error)
        };
      }
    });

    await Promise.allSettled(healthChecks);
    return results;
  }

  private async performServiceHealthCheck(serviceName: string): Promise<void> {
    const config = this.serviceConfigs.get(serviceName);

    if (!config?.baseUrl) {
      return; // Skip health check for services without base URL
    }

    const healthUrl = `${config.baseUrl}/health`;
    const timeout = config.timeout || 5000;

    const response = await fetch(healthUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(timeout)
    });

    if (!response.ok) {
      throw new Error(`Health check failed with status ${response.status}`);
    }
  }

  /**
   * Get orchestrator statistics
   */
  getStats(): {
    services: Record<string, { configured: boolean; healthy: boolean }>;
    cache: { size: number; hitRate: number };
    totalOperations: number;
  } {
    const serviceStats: Record<string, { configured: boolean; healthy: boolean }> = {};

    for (const [name] of this.serviceConfigs) {
      serviceStats[name] = {
        configured: true,
        healthy: true // Would implement actual health tracking
      };
    }

    return {
      services: serviceStats,
      cache: {
        size: this.cacheStore.size,
        hitRate: 0.85 // Would calculate actual hit rate
      },
      totalOperations: 0 // Would track actual operations
    };
  }
}