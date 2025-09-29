/**
 * Service Registry - Centralized service management and dependency injection
 * Provides service discovery, lifecycle management, and configuration
 */

import { logger } from '@/lib/logger';
import { ApiGateway, GatewayConfig } from '@/services/gateway/ApiGateway';

export interface ServiceConfig {
  name: string;
  version: string;
  dependencies?: string[];
  config?: Record<string, unknown>;
  healthCheck?: () => Promise<boolean>;
}

export interface ServiceInstance<T = unknown> {
  instance: T;
  config: ServiceConfig;
  status: 'initializing' | 'ready' | 'error' | 'stopped';
  createdAt: number;
  lastHealthCheck?: number;
}

export type ServiceFactory<T> = (config: ServiceConfig, registry: ServiceRegistry) => T | Promise<T>;

export class ServiceRegistry {
  private static instance: ServiceRegistry;
  private services = new Map<string, ServiceInstance>();
  private factories = new Map<string, ServiceFactory<unknown>>();
  private dependencyGraph = new Map<string, Set<string>>();
  private healthCheckInterval: NodeJS.Timeout;

  private constructor() {
    // Health check every 30 seconds
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, 30 * 1000);

    this.registerCoreServices();
  }

  static getInstance(): ServiceRegistry {
    if (!ServiceRegistry.instance) {
      ServiceRegistry.instance = new ServiceRegistry();
    }
    return ServiceRegistry.instance;
  }

  /**
   * Register a service factory
   */
  registerFactory<T>(name: string, factory: ServiceFactory<T>): void {
    this.factories.set(name, factory as ServiceFactory<unknown>);
    logger.debug('Service factory registered', { serviceName: name });
  }

  /**
   * Register a service instance
   */
  async registerService<T>(config: ServiceConfig): Promise<T> {
    const { name, dependencies = [] } = config;

    // Check if service already exists
    if (this.services.has(name)) {
      const existing = this.services.get(name)!;
      if (existing.status === 'ready') {
        return existing.instance as T;
      }
    }

    // Initialize dependencies first
    await this.initializeDependencies(dependencies);

    // Create service instance
    const serviceInstance: ServiceInstance<T> = {
      instance: null as unknown as T,
      config,
      status: 'initializing',
      createdAt: Date.now()
    };

    this.services.set(name, serviceInstance as ServiceInstance);

    try {
      // Get factory and create instance
      const factory = this.factories.get(name);
      if (!factory) {
        throw new Error(`No factory registered for service: ${name}`);
      }

      const instance = await factory(config, this);
      serviceInstance.instance = instance as T;
      serviceInstance.status = 'ready';

      // Update dependency graph
      this.updateDependencyGraph(name, dependencies);

      logger.info('Service registered successfully', {
        serviceName: name,
        version: config.version,
        dependencies: dependencies.length
      });

      return instance as T;

    } catch (error) {
      serviceInstance.status = 'error';
      logger.error('Service registration failed', {
        serviceName: name,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Get a service instance
   */
  getService<T>(name: string): T {
    const service = this.services.get(name);

    if (!service) {
      throw new Error(`Service not found: ${name}`);
    }

    if (service.status !== 'ready') {
      throw new Error(`Service not ready: ${name} (status: ${service.status})`);
    }

    return service.instance as T;
  }

  /**
   * Check if a service exists and is ready
   */
  hasService(name: string): boolean {
    const service = this.services.get(name);
    return service?.status === 'ready';
  }

  /**
   * Get all registered services
   */
  getAllServices(): Record<string, { status: string; config: ServiceConfig }> {
    const result: Record<string, { status: string; config: ServiceConfig }> = {};

    for (const [name, service] of this.services) {
      result[name] = {
        status: service.status,
        config: service.config
      };
    }

    return result;
  }

  /**
   * Stop a service
   */
  async stopService(name: string): Promise<void> {
    const service = this.services.get(name);
    if (!service) {
      return;
    }

    try {
      // Call service cleanup if available
      const instance = service.instance as { destroy?: () => Promise<void>; stop?: () => Promise<void> };
      if (typeof instance.destroy === 'function') {
        await instance.destroy();
      } else if (typeof instance.stop === 'function') {
        await instance.stop();
      }

      service.status = 'stopped';
      logger.info('Service stopped', { serviceName: name });

    } catch (error) {
      logger.error('Error stopping service', {
        serviceName: name,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Restart a service
   */
  async restartService(name: string): Promise<void> {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service not found: ${name}`);
    }

    await this.stopService(name);
    await this.registerService(service.config);
  }

  /**
   * Initialize service dependencies
   */
  private async initializeDependencies(dependencies: string[]): Promise<void> {
    for (const dep of dependencies) {
      if (!this.hasService(dep)) {
        throw new Error(`Dependency not available: ${dep}`);
      }
    }
  }

  /**
   * Update dependency graph
   */
  private updateDependencyGraph(serviceName: string, dependencies: string[]): void {
    this.dependencyGraph.set(serviceName, new Set(dependencies));
  }

  /**
   * Get service dependency order
   */
  getDependencyOrder(): string[] {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const result: string[] = [];

    const visit = (serviceName: string): void => {
      if (visiting.has(serviceName)) {
        throw new Error(`Circular dependency detected: ${serviceName}`);
      }

      if (visited.has(serviceName)) {
        return;
      }

      visiting.add(serviceName);

      const dependencies = this.dependencyGraph.get(serviceName) || new Set();
      for (const dep of dependencies) {
        visit(dep);
      }

      visiting.delete(serviceName);
      visited.add(serviceName);
      result.push(serviceName);
    };

    for (const serviceName of this.services.keys()) {
      visit(serviceName);
    }

    return result;
  }

  /**
   * Perform health checks on all services
   */
  private async performHealthChecks(): Promise<void> {
    const healthPromises = Array.from(this.services.entries()).map(
      async ([name, service]) => {
        if (service.status !== 'ready' || !service.config.healthCheck) {
          return;
        }

        try {
          const healthy = await service.config.healthCheck();
          service.lastHealthCheck = Date.now();

          if (!healthy) {
            logger.warn('Service health check failed', { serviceName: name });
            service.status = 'error';
          }
        } catch (error) {
          logger.error('Service health check error', {
            serviceName: name,
            error: error instanceof Error ? error.message : String(error)
          });
          service.status = 'error';
        }
      }
    );

    await Promise.allSettled(healthPromises);
  }

  /**
   * Register core services with the registry
   */
  private registerCoreServices(): void {
    // API Gateway factory
    this.registerFactory('ApiGateway', (config) => {
      const gatewayConfig: GatewayConfig = {
        baseUrl: (config.config?.baseUrl as string) || 'http://localhost:3000',
        timeout: (config.config?.timeout as number) || 30000,
        retries: (config.config?.retries as number) || 3,
        rateLimiting: {
          enabled: true,
          windowMs: 60 * 1000,
          maxRequests: 100
        },
        auth: {
          required: true,
          skipRoutes: ['/health', '/metrics']
        },
        monitoring: {
          enabled: true,
          sampleRate: 0.1
        }
      };

      return ApiGateway.getInstance(gatewayConfig);
    });

    // Cache service factory
    this.registerFactory('CacheService', () => {
      return new Map(); // Simple in-memory cache for now
    });

    // Event bus factory
    this.registerFactory('EventBus', () => {
      return new EventTarget(); // Simple event bus for now
    });
  }

  /**
   * Get service health status
   */
  getHealthStatus(): {
    overall: 'healthy' | 'degraded' | 'unhealthy';
    services: Record<string, {
      status: string;
      lastHealthCheck?: number;
      uptime: number;
    }>;
  } {
    const serviceStatuses: Record<string, {
      status: string;
      lastHealthCheck?: number;
      uptime: number;
    }> = {};

    let healthyCount = 0;
    let totalCount = 0;

    for (const [name, service] of this.services) {
      const uptime = Date.now() - service.createdAt;
      serviceStatuses[name] = {
        status: service.status,
        lastHealthCheck: service.lastHealthCheck,
        uptime
      };

      totalCount++;
      if (service.status === 'ready') {
        healthyCount++;
      }
    }

    let overall: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyCount === totalCount) {
      overall = 'healthy';
    } else if (healthyCount > 0) {
      overall = 'degraded';
    } else {
      overall = 'unhealthy';
    }

    return {
      overall,
      services: serviceStatuses
    };
  }

  /**
   * Clean up resources
   */
  async destroy(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Stop all services in reverse dependency order
    const dependencyOrder = this.getDependencyOrder().reverse();

    for (const serviceName of dependencyOrder) {
      await this.stopService(serviceName);
    }

    this.services.clear();
    this.factories.clear();
    this.dependencyGraph.clear();
  }
}