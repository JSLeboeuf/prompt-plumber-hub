/**
 * Unified API Configuration
 * Consolidates all API configuration patterns into a single, secure source
 * - Environment-based configuration with validation
 * - Feature flags for conditional service enabling
 * - Security-first design with proper secret handling
 * - Type-safe configuration interfaces
 * - Runtime validation and health checks
 */

import logger from '@/lib/logger';

// Environment variable validation
interface EnvironmentConfig {
  // Core API
  API_BASE_URL: string;
  NODE_ENV: 'development' | 'production' | 'test';
  
  // Supabase
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  
  // VAPI (Voice AI)
  VITE_VAPI_PUBLIC_KEY?: string;
  VITE_VAPI_ASSISTANT_ID?: string;
  VITE_VAPI_WEBHOOK_URL?: string;
  
  // Google Maps
  VITE_GOOGLE_MAPS_API_KEY?: string;
  
  // Twilio
  VITE_TWILIO_ACCOUNT_SID?: string;
  
  // n8n Automation
  VITE_N8N_BASE_URL?: string;
  
  // Feature flags
  VITE_ENABLE_VAPI?: string;
  VITE_ENABLE_MAPS?: string;
  VITE_ENABLE_SMS?: string;
  VITE_ENABLE_AUTOMATION?: string;
  VITE_ENABLE_ANALYTICS?: string;
}

// Unified configuration interface
export interface UnifiedAPIConfig {
  // Environment
  environment: 'development' | 'production' | 'test';
  isDevelopment: boolean;
  isProduction: boolean;
  
  // Core API settings
  api: {
    baseUrl: string;
    timeout: number;
    retries: number;
    enableLogging: boolean;
  };
  
  // Authentication & Security
  auth: {
    supabaseUrl: string;
    supabaseAnonKey: string;
    enableAutoRefresh: boolean;
    tokenExpiryBuffer: number; // seconds
  };
  
  // Feature-based service configuration
  services: {
    vapi: {
      enabled: boolean;
      publicKey?: string;
      assistantId?: string;
      webhookUrl?: string;
      apiUrl: string;
    };
    maps: {
      enabled: boolean;
      apiKey?: string;
      apiUrl: string;
    };
    sms: {
      enabled: boolean;
      accountSid?: string;
      apiUrl: string;
    };
    automation: {
      enabled: boolean;
      baseUrl?: string;
      apiUrl: string;
    };
    analytics: {
      enabled: boolean;
      apiUrl: string;
    };
  };
  
  // Request defaults
  defaults: {
    headers: Record<string, string>;
    timeout: number;
    retries: number;
    cacheTimeout: number;
  };
  
  // Circuit breaker settings
  circuitBreaker: {
    enabled: boolean;
    failureThreshold: number;
    recoveryTimeout: number;
    monitoringPeriod: number;
  };
  
  // Rate limiting
  rateLimit: {
    enabled: boolean;
    requestsPerMinute: number;
    burstLimit: number;
  };
  
  // Caching
  cache: {
    enabled: boolean;
    defaultTtl: number;
    maxSize: number;
  };
}

/**
 * Environment variable loading with validation
 */
function getEnvironmentConfig(): EnvironmentConfig {
  // Get environment variables with proper typing
  const env = {
    API_BASE_URL: getEnvVar('VITE_API_BASE_URL', 'http://localhost:8080'),
    NODE_ENV: (getEnvVar('NODE_ENV', 'development') as 'development' | 'production' | 'test'),
    
    // Required Supabase config
    VITE_SUPABASE_URL: getEnvVar('VITE_SUPABASE_URL', '', true),
    VITE_SUPABASE_ANON_KEY: getEnvVar('VITE_SUPABASE_ANON_KEY', '', true),
    
    // Optional service configs
    VITE_VAPI_PUBLIC_KEY: getEnvVar('VITE_VAPI_PUBLIC_KEY'),
    VITE_VAPI_ASSISTANT_ID: getEnvVar('VITE_VAPI_ASSISTANT_ID'),
    VITE_VAPI_WEBHOOK_URL: getEnvVar('VITE_VAPI_WEBHOOK_URL'),
    
    VITE_GOOGLE_MAPS_API_KEY: getEnvVar('VITE_GOOGLE_MAPS_API_KEY'),
    
    VITE_TWILIO_ACCOUNT_SID: getEnvVar('VITE_TWILIO_ACCOUNT_SID'),
    
    VITE_N8N_BASE_URL: getEnvVar('VITE_N8N_BASE_URL'),
    
    // Feature flags
    VITE_ENABLE_VAPI: getEnvVar('VITE_ENABLE_VAPI', 'true'),
    VITE_ENABLE_MAPS: getEnvVar('VITE_ENABLE_MAPS', 'true'),
    VITE_ENABLE_SMS: getEnvVar('VITE_ENABLE_SMS', 'true'),
    VITE_ENABLE_AUTOMATION: getEnvVar('VITE_ENABLE_AUTOMATION', 'true'),
    VITE_ENABLE_ANALYTICS: getEnvVar('VITE_ENABLE_ANALYTICS', 'true'),
  };
  
  // Validate required variables
  validateRequiredConfig(env);
  
  return env;
}

/**
 * Get environment variable with optional validation
 */
function getEnvVar(key: string, defaultValue?: string, required = false): string {
  const value = import.meta.env?.[key] ||
               (globalThis as { process?: { env?: Record<string, string | undefined> } })?.process?.env?.[key] ||
               defaultValue;
  
  if (required && !value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  
  return value || '';
}

/**
 * Validate required configuration
 */
function validateRequiredConfig(env: EnvironmentConfig): void {
  const requiredFields: Array<keyof EnvironmentConfig> = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
  ];
  
  const missing = requiredFields.filter(field => !env[field]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  // Validate URLs
  validateUrl(env.VITE_SUPABASE_URL, 'VITE_SUPABASE_URL');
  if (env.VITE_N8N_BASE_URL) {
    validateUrl(env.VITE_N8N_BASE_URL, 'VITE_N8N_BASE_URL');
  }
}

/**
 * Validate URL format
 */
function validateUrl(url: string, name: string): void {
  try {
    new URL(url);
  } catch {
    throw new Error(`Invalid URL format for ${name}: ${url}`);
  }
}

/**
 * Check if feature is enabled
 */
function isFeatureEnabled(feature: string, env: EnvironmentConfig): boolean {
  const envKey = `VITE_ENABLE_${feature.toUpperCase()}` as keyof EnvironmentConfig;
  const value = env[envKey];
  return value === 'true' || value === '1';
}

/**
 * Create unified configuration from environment
 */
function createUnifiedConfig(): UnifiedAPIConfig {
  const env = getEnvironmentConfig();
  
  return {
    environment: env.NODE_ENV,
    isDevelopment: env.NODE_ENV === 'development',
    isProduction: env.NODE_ENV === 'production',
    
    api: {
      baseUrl: env.API_BASE_URL,
      timeout: 10000,
      retries: 3,
      enableLogging: env.NODE_ENV === 'development',
    },
    
    auth: {
      supabaseUrl: env.VITE_SUPABASE_URL,
      supabaseAnonKey: env.VITE_SUPABASE_ANON_KEY,
      enableAutoRefresh: true,
      tokenExpiryBuffer: 300, // 5 minutes
    },
    
    services: {
      vapi: {
        enabled: isFeatureEnabled('vapi', env) && Boolean(env.VITE_VAPI_PUBLIC_KEY),
        publicKey: env.VITE_VAPI_PUBLIC_KEY,
        assistantId: env.VITE_VAPI_ASSISTANT_ID,
        webhookUrl: env.VITE_VAPI_WEBHOOK_URL,
        apiUrl: 'https://api.vapi.ai',
      },
      maps: {
        enabled: isFeatureEnabled('maps', env) && Boolean(env.VITE_GOOGLE_MAPS_API_KEY),
        apiKey: env.VITE_GOOGLE_MAPS_API_KEY,
        apiUrl: 'https://maps.googleapis.com/maps/api',
      },
      sms: {
        enabled: isFeatureEnabled('sms', env) && Boolean(env.VITE_TWILIO_ACCOUNT_SID),
        accountSid: env.VITE_TWILIO_ACCOUNT_SID,
        apiUrl: 'https://api.twilio.com',
      },
      automation: {
        enabled: isFeatureEnabled('automation', env) && Boolean(env.VITE_N8N_BASE_URL),
        baseUrl: env.VITE_N8N_BASE_URL,
        apiUrl: env.VITE_N8N_BASE_URL || 'http://localhost:5678',
      },
      analytics: {
        enabled: isFeatureEnabled('analytics', env),
        apiUrl: `${env.API_BASE_URL}/api/analytics`,
      },
    },
    
    defaults: {
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-Client-Version': '1.0.0',
      },
      timeout: 10000,
      retries: 3,
      cacheTimeout: 5 * 60 * 1000, // 5 minutes
    },
    
    circuitBreaker: {
      enabled: true,
      failureThreshold: 5,
      recoveryTimeout: 60000, // 1 minute
      monitoringPeriod: 10000, // 10 seconds
    },
    
    rateLimit: {
      enabled: true,
      requestsPerMinute: env.NODE_ENV === 'production' ? 60 : 200,
      burstLimit: env.NODE_ENV === 'production' ? 10 : 50,
    },
    
    cache: {
      enabled: true,
      defaultTtl: 5 * 60 * 1000, // 5 minutes
      maxSize: 100, // 100 entries
    },
  };
}

/**
 * Configuration validation
 */
export function validateConfig(config: UnifiedAPIConfig): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Validate required fields
  if (!config.auth.supabaseUrl) {
    errors.push('Supabase URL is required');
  }
  
  if (!config.auth.supabaseAnonKey) {
    errors.push('Supabase anonymous key is required');
  }
  
  // Check service configuration
  if (config.services.vapi.enabled && !config.services.vapi.publicKey) {
    warnings.push('VAPI service enabled but public key not configured');
  }
  
  if (config.services.maps.enabled && !config.services.maps.apiKey) {
    warnings.push('Maps service enabled but API key not configured');
  }
  
  if (config.services.sms.enabled && !config.services.sms.accountSid) {
    warnings.push('SMS service enabled but account SID not configured');
  }
  
  // Validate timeout values
  if (config.api.timeout < 1000) {
    warnings.push('API timeout is very low (<1s)');
  }
  
  if (config.api.timeout > 60000) {
    warnings.push('API timeout is very high (>60s)');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get service health check endpoints
 */
export function getHealthCheckEndpoints(config: UnifiedAPIConfig): Record<string, string> {
  const endpoints: Record<string, string> = {
    api: `${config.api.baseUrl}/health`,
    supabase: `${config.auth.supabaseUrl}/rest/v1/`,
  };
  
  if (config.services.vapi.enabled) {
    endpoints.vapi = `${config.services.vapi.apiUrl}/health`;
  }
  
  if (config.services.automation.enabled && config.services.automation.baseUrl) {
    endpoints.n8n = `${config.services.automation.baseUrl}/healthz`;
  }
  
  return endpoints;
}

/**
 * Create configuration singleton
 */
let configInstance: UnifiedAPIConfig | null = null;

export function getUnifiedConfig(): UnifiedAPIConfig {
  if (!configInstance) {
    try {
      configInstance = createUnifiedConfig();
      
      // Validate configuration
      const validation = validateConfig(configInstance);
      
      if (!validation.valid) {
        logger.error('Configuration validation failed', {
          errors: validation.errors,
        });
        throw new Error(`Configuration errors: ${validation.errors.join(', ')}`);
      }
      
      if (validation.warnings.length > 0) {
        logger.warn('Configuration warnings', {
          warnings: validation.warnings,
        });
      }
      
      logger.info('Unified API configuration initialized', {
        environment: configInstance.environment,
        enabledServices: Object.entries(configInstance.services)
          .filter(([, service]) => service.enabled)
          .map(([name]) => name),
      });
      
    } catch (error) {
      logger.error('Failed to initialize configuration', { error });
      throw error;
    }
  }
  
  return configInstance;
}

/**
 * Reset configuration (useful for testing)
 */
export function resetConfig(): void {
  configInstance = null;
}

/**
 * Check if a service is properly configured and enabled
 */
export function isServiceEnabled(serviceName: keyof UnifiedAPIConfig['services']): boolean {
  const config = getUnifiedConfig();
  return config.services[serviceName].enabled;
}

/**
 * Get service configuration
 */
export function getServiceConfig<T extends keyof UnifiedAPIConfig['services']>(
  serviceName: T
): UnifiedAPIConfig['services'][T] {
  const config = getUnifiedConfig();
  return config.services[serviceName];
}

/**
 * Export the unified configuration
 */
export const unifiedConfig = getUnifiedConfig();

// Export configuration object for backwards compatibility
export default unifiedConfig;
