/**
 * API Service Manager - Main entry point for the secure API layer
 * Orchestrates initialization and provides unified access to all API services
 */

import { logger } from '@/lib/logger';
import { ApiGateway, GatewayConfig } from './gateway/ApiGateway';
import { ErrorHandler, ErrorHandlerConfig } from './errors/ErrorHandler';
import { SecurityMiddleware, SecurityConfig } from './security/SecurityMiddleware';
import { ServiceRegistry } from './core/ServiceRegistry';
import { ServiceOrchestrator } from './integration/ServiceOrchestrator';
import { createSupabaseService } from './supabaseServices';
import { supabase } from '@/integrations/supabase/client';
import type {
  BatchOperation,
  CallContext,
  HttpRequestOptions,
  WebhookClientData,
  WebhookCallData,
  WebhookInterventionData,
  WebhookFeedbackData
} from '@/types/api.types';

export interface ApiServiceConfig {
  environment: 'development' | 'staging' | 'production';
  gateway: Partial<GatewayConfig>;
  security: Partial<SecurityConfig>;
  errorHandling: Partial<ErrorHandlerConfig>;
  services: {
    supabase: {
      enabled: boolean;
    };
    vapi: {
      enabled: boolean;
      baseUrl: string;
      apiKey: string;
      assistantId: string;
    };
    twilio: {
      enabled: boolean;
      accountSid: string;
      authToken: string;
    };
    googleMaps: {
      enabled: boolean;
      apiKey: string;
    };
    n8n: {
      enabled: boolean;
      webhookBaseUrl: string;
    };
  };
  monitoring: {
    enabled: boolean;
    metricsEndpoint?: string;
    healthCheckInterval: number;
  };
}

export class ApiServiceManager {
  private static instance: ApiServiceManager;
  private config: ApiServiceConfig;
  private registry: ServiceRegistry;
  private gateway: ApiGateway;
  private errorHandler: ErrorHandler;
  private security: SecurityMiddleware;
  private orchestrator: ServiceOrchestrator;
  private initialized = false;
  private healthCheckInterval?: NodeJS.Timeout;

  private constructor() {
    this.registry = ServiceRegistry.getInstance();
    this.orchestrator = ServiceOrchestrator.getInstance();
  }

  static getInstance(): ApiServiceManager {
    if (!ApiServiceManager.instance) {
      ApiServiceManager.instance = new ApiServiceManager();
    }
    return ApiServiceManager.instance;
  }

  /**
   * Initialize the API service layer with configuration
   */
  async initialize(config: Partial<ApiServiceConfig> = {}): Promise<void> {
    if (this.initialized) {
      logger.warn('API Service Manager already initialized');
      return;
    }

    this.config = this.mergeWithDefaults(config);

    logger.info('Initializing API Service Manager', {
      environment: this.config.environment,
      enabledServices: Object.entries(this.config.services)
        .filter(([_, serviceConfig]) => serviceConfig.enabled)
        .map(([name]) => name)
    });

    try {
      // 1. Initialize core services
      await this.initializeCoreServices();

      // 2. Initialize business services
      await this.initializeBusinessServices();

      // 3. Setup monitoring and health checks
      await this.setupMonitoring();

      // 4. Initialize service orchestrator
      await this.initializeOrchestrator();

      this.initialized = true;

      logger.info('API Service Manager initialized successfully', {
        services: this.registry.getAllServices(),
        monitoring: this.config.monitoring.enabled
      });

    } catch (error) {
      logger.error('Failed to initialize API Service Manager', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Initialize core services (Gateway, Security, Error Handling)
   */
  private async initializeCoreServices(): Promise<void> {
    // Register and initialize API Gateway
    await this.registry.registerService({
      name: 'ApiGateway',
      version: '1.0.0',
      config: {
        ...this.config.gateway,
        baseUrl: this.getApiBaseUrl(),
        timeout: this.config.gateway.timeout || 30000,
        retries: this.config.gateway.retries || 3
      },
      healthCheck: async () => {
        const health = await this.gateway.healthCheck();
        return health.status !== 'unhealthy';
      }
    });

    this.gateway = this.registry.getService<ApiGateway>('ApiGateway');

    // Initialize Error Handler
    this.errorHandler = ErrorHandler.getInstance({
      enableStackTrace: this.config.environment === 'development',
      enableUserFriendlyMessages: true,
      logLevel: this.config.environment === 'development' ? 'debug' : 'error',
      notificationWebhook: process.env.ERROR_NOTIFICATION_WEBHOOK,
      ...this.config.errorHandling,
      retryConfig: {
        maxAttempts: 3,
        baseDelay: 1000,
        maxDelay: 10000,
        backoffFactor: 2,
        retryableCategories: ['NETWORK_ERROR', 'TIMEOUT_ERROR', 'SERVER_ERROR'],
        ...this.config.errorHandling.retryConfig
      }
    });

    // Initialize Security Middleware
    this.security = SecurityMiddleware.getInstance({
      cors: {
        enabled: true,
        allowedOrigins: this.getAllowedOrigins(),
        allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With'],
        credentials: true,
        maxAge: 86400,
        ...this.config.security.cors
      },
      rateLimiting: {
        enabled: this.config.environment === 'production',
        windowMs: 60 * 1000,
        maxRequests: this.config.environment === 'development' ? 1000 : 100,
        skipSuccessfulRequests: false,
        ...this.config.security.rateLimiting
      },
      requestLimits: {
        maxBodySize: 10 * 1024 * 1024, // 10MB
        maxHeaderSize: 16 * 1024,       // 16KB
        maxUrlLength: 2048,             // 2KB
        ...this.config.security.requestLimits
      },
      apiKeys: {
        enabled: this.config.environment === 'production',
        headerName: 'X-API-Key',
        ...this.config.security.apiKeys
      },
      auditLogging: {
        enabled: true,
        logLevel: 'standard',
        sensitiveFields: ['password', 'token', 'secret', 'key', 'authorization'],
        retentionDays: 30,
        ...this.config.security.auditLogging
      },
      contentSecurity: {
        validateContentType: true,
        allowedContentTypes: [
          'application/json',
          'application/x-www-form-urlencoded',
          'multipart/form-data'
        ],
        validateJsonSchema: true,
        ...this.config.security.contentSecurity
      }
    });

    logger.info('Core services initialized successfully');
  }

  /**
   * Initialize business services
   */
  private async initializeBusinessServices(): Promise<void> {
    // Initialize Supabase service
    if (this.config.services.supabase.enabled) {
      await this.registry.registerService({
        name: 'SupabaseService',
        version: '1.0.0',
        config: {},
        healthCheck: async () => {
          try {
            const supabaseService = createSupabaseService(supabase);
            const { data: _data } = await supabaseService.client.from('vapi_calls').select('id').limit(1);
            return true;
          } catch {
            return false;
          }
        }
      });

      logger.info('Supabase service registered');
    }

    // Initialize cache service
    await this.registry.registerService({
      name: 'CacheService',
      version: '1.0.0',
      config: {},
      healthCheck: async () => true
    });

    // Initialize event bus
    await this.registry.registerService({
      name: 'EventBus',
      version: '1.0.0',
      config: {},
      healthCheck: async () => true
    });

    logger.info('Business services initialized successfully');
  }

  /**
   * Setup monitoring and health checks
   */
  private async setupMonitoring(): Promise<void> {
    if (!this.config.monitoring.enabled) {
      return;
    }

    // Start periodic health checks
    this.healthCheckInterval = setInterval(async () => {
      try {
        const health = await this.getHealthStatus();

        if (health.status === 'unhealthy') {
          logger.error('System health check failed', { health });
        } else if (health.status === 'degraded') {
          logger.warn('System health degraded', { health });
        }

        // Send metrics to monitoring endpoint if configured
        if (this.config.monitoring.metricsEndpoint) {
          await this.sendMetricsToMonitoring(health);
        }

      } catch (error) {
        logger.error('Health check failed', {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }, this.config.monitoring.healthCheckInterval);

    logger.info('Monitoring setup completed');
  }

  /**
   * Initialize service orchestrator
   */
  private async initializeOrchestrator(): Promise<void> {
    const serviceConfigs: Record<string, {
      name: string;
      baseUrl: string;
      timeout: number;
      authentication?: {
        type: 'bearer' | 'basic' | 'api-key';
        credentials: Record<string, string>;
      };
    }> = {};

    // Configure enabled services
    if (this.config.services.vapi.enabled) {
      serviceConfigs.vapi = {
        name: 'vapi',
        baseUrl: this.config.services.vapi.baseUrl,
        timeout: 30000,
        authentication: {
          type: 'bearer',
          credentials: { token: this.config.services.vapi.apiKey }
        }
      };
    }

    if (this.config.services.twilio.enabled) {
      serviceConfigs.twilio = {
        name: 'twilio',
        baseUrl: 'https://api.twilio.com',
        timeout: 30000,
        authentication: {
          type: 'basic',
          credentials: {
            username: this.config.services.twilio.accountSid,
            password: this.config.services.twilio.authToken
          }
        }
      };
    }

    if (this.config.services.googleMaps.enabled) {
      serviceConfigs['google-maps'] = {
        name: 'google-maps',
        baseUrl: 'https://maps.googleapis.com/maps/api',
        timeout: 15000,
        authentication: {
          type: 'api-key',
          credentials: { key: this.config.services.googleMaps.apiKey }
        }
      };
    }

    if (this.config.services.n8n.enabled) {
      serviceConfigs.n8n = {
        name: 'n8n',
        baseUrl: this.config.services.n8n.webhookBaseUrl,
        timeout: 60000
      };
    }

    await this.orchestrator.initialize(serviceConfigs);

    logger.info('Service orchestrator initialized');
  }

  /**
   * Get unified API client interface
   */
  getApiClient() {
    if (!this.initialized) {
      throw new Error('API Service Manager not initialized');
    }

    return {
      // Gateway methods
      get: <T>(endpoint: string, options?: HttpRequestOptions) =>
        this.gateway.get<T>(endpoint, options),

      post: <T>(endpoint: string, data: Record<string, unknown>, options?: HttpRequestOptions) =>
        this.gateway.post<T>(endpoint, data, options),

      put: <T>(endpoint: string, data: Record<string, unknown>, options?: HttpRequestOptions) =>
        this.gateway.put<T>(endpoint, data, options),

      delete: <T>(endpoint: string, options?: HttpRequestOptions) =>
        this.gateway.delete<T>(endpoint, options),

      // Service orchestration methods
      supabase: {
        fetchData: <T>(table: string, filters?: Record<string, unknown>) =>
          this.orchestrator.executeSupabaseOperation<T>('fetchData', { table, filters }, {
            correlationId: crypto.randomUUID(),
            source: 'api_client',
            operation: 'fetchData'
          }),

        insertData: <T>(table: string, data: Record<string, unknown>) =>
          this.orchestrator.executeSupabaseOperation<T>('insertData', { table, data }, {
            correlationId: crypto.randomUUID(),
            source: 'api_client',
            operation: 'insertData'
          }),

        updateData: <T>(table: string, id: string, data: Record<string, unknown>) =>
          this.orchestrator.executeSupabaseOperation<T>('updateData', { table, id, data }, {
            correlationId: crypto.randomUUID(),
            source: 'api_client',
            operation: 'updateData'
          })
      },

      vapi: {
        makeCall: (params: { phoneNumber: string; assistantId?: string; context?: CallContext }) =>
          this.orchestrator.executeVapiOperation('makeCall', params, {
            correlationId: crypto.randomUUID(),
            source: 'api_client',
            operation: 'makeCall'
          })
      },

      twilio: {
        sendSms: (params: { to: string; message: string; priority?: string }) =>
          this.orchestrator.executeTwilioOperation('sendSms', params, {
            correlationId: crypto.randomUUID(),
            source: 'api_client',
            operation: 'sendSms'
          })
      },

      googleMaps: {
        geocode: (address: string) =>
          this.orchestrator.executeGoogleMapsOperation('geocode', { address }, {
            correlationId: crypto.randomUUID(),
            source: 'api_client',
            operation: 'geocode'
          }),

        distanceMatrix: (origins: string, destinations: string) =>
          this.orchestrator.executeGoogleMapsOperation('distanceMatrix', { origins, destinations }, {
            correlationId: crypto.randomUUID(),
            source: 'api_client',
            operation: 'distanceMatrix'
          })
      },

      n8n: {
        triggerWorkflow: (workflow: string, data: WebhookClientData | WebhookCallData | WebhookInterventionData | WebhookFeedbackData) =>
          this.orchestrator.executeN8nOperation(workflow, data, {
            correlationId: crypto.randomUUID(),
            source: 'api_client',
            operation: 'triggerWorkflow'
          })
      },

      // Batch operations
      batch: (operations: BatchOperation[]) =>
        this.orchestrator.executeBatchOperations(operations)
    };
  }

  /**
   * Get comprehensive health status
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: Record<string, {
      status: string;
      details?: Record<string, unknown>;
    }>;
    metrics: {
      status: string;
      responseTime?: number;
      uptime?: number;
      memory?: Record<string, unknown>;
    };
    timestamp: string;
  }> {
    const registryHealth = this.registry.getHealthStatus();
    const gatewayHealth = await this.gateway.healthCheck();
    const orchestratorHealth = await this.orchestrator.healthCheck();
    const securityStats = this.security.getSecurityStats();

    const allHealthy = registryHealth.overall === 'healthy' &&
                     gatewayHealth.status === 'healthy' &&
                     Object.values(orchestratorHealth).every(h => h.status === 'healthy');

    const someHealthy = registryHealth.overall !== 'unhealthy' ||
                       gatewayHealth.status !== 'unhealthy' ||
                       Object.values(orchestratorHealth).some(h => h.status === 'healthy');

    return {
      status: allHealthy ? 'healthy' : someHealthy ? 'degraded' : 'unhealthy',
      services: {
        registry: registryHealth,
        gateway: gatewayHealth,
        orchestrator: orchestratorHealth,
        security: securityStats
      },
      metrics: this.gateway.healthCheck(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down API Service Manager');

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    try {
      await this.registry.destroy();
      logger.info('API Service Manager shutdown completed');
    } catch (error) {
      logger.error('Error during shutdown', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Helper methods
   */
  private mergeWithDefaults(config: Partial<ApiServiceConfig>): ApiServiceConfig {
    const defaults: ApiServiceConfig = {
      environment: (process.env.NODE_ENV as 'development' | 'staging' | 'production') || 'development',
      gateway: {
        timeout: 30000,
        retries: 3,
        rateLimiting: {
          enabled: true,
          windowMs: 60000,
          maxRequests: 100
        },
        auth: {
          required: false,
          skipRoutes: ['/health', '/metrics']
        },
        monitoring: {
          enabled: true,
          sampleRate: 0.1
        }
      },
      security: {},
      errorHandling: {},
      services: {
        supabase: { enabled: true },
        vapi: {
          enabled: !!process.env.VAPI_API_KEY,
          baseUrl: 'https://api.vapi.ai',
          apiKey: process.env.VAPI_API_KEY || '',
          assistantId: process.env.VAPI_ASSISTANT_ID || ''
        },
        twilio: {
          enabled: !!process.env.TWILIO_ACCOUNT_SID,
          accountSid: process.env.TWILIO_ACCOUNT_SID || '',
          authToken: process.env.TWILIO_AUTH_TOKEN || ''
        },
        googleMaps: {
          enabled: !!process.env.GOOGLE_MAPS_API_KEY,
          apiKey: process.env.GOOGLE_MAPS_API_KEY || ''
        },
        n8n: {
          enabled: !!process.env.N8N_WEBHOOK_BASE_URL,
          webhookBaseUrl: process.env.N8N_WEBHOOK_BASE_URL || ''
        }
      },
      monitoring: {
        enabled: true,
        healthCheckInterval: 30000
      }
    };

    return this.deepMerge(defaults, config);
  }

  private getApiBaseUrl(): string {
    return process.env.VITE_API_BASE_URL ||
           process.env.NEXT_PUBLIC_API_BASE_URL ||
           'http://localhost:3000';
  }

  private getAllowedOrigins(): string[] {
    const origins = process.env.CORS_ALLOWED_ORIGINS?.split(',') || [];

    if (this.config.environment === 'development') {
      origins.push('http://localhost:3000', 'http://localhost:5173');
    }

    return origins.length > 0 ? origins : ['*'];
  }

  private async sendMetricsToMonitoring(health: {
    status: string;
    services: Record<string, unknown>;
    metrics: Record<string, unknown>;
    timestamp: string;
  }): Promise<void> {
    try {
      if (!this.config.monitoring.metricsEndpoint) return;

      await fetch(this.config.monitoring.metricsEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timestamp: Date.now(),
          health,
          source: 'prompt-plumber-hub'
        })
      });
    } catch (error) {
      logger.error('Failed to send metrics', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private deepMerge<T extends Record<string, unknown>, U extends Record<string, unknown>>(
    target: T,
    source: U
  ): T & U {
    const result = { ...target };

    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }
}