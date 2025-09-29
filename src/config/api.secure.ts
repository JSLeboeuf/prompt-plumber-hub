import { env, isFeatureEnabled, getApiConfig } from '@/lib/env';

/**
 * Secure API Configuration
 * All API keys and sensitive configuration loaded from environment variables
 */

// Get validated configuration
const config = getApiConfig();

// Export secure configuration
export const apiConfig = {
  // Base configuration
  environment: env.MODE,
  isDevelopment: env.DEV || false,
  isProduction: env.PROD || false,

  // API endpoints
  baseUrl: config.baseUrl,

  // Supabase configuration
  supabase: {
    url: config.supabase.url,
    anonKey: config.supabase.anonKey,
  },

  // VAPI configuration (only if enabled)
  vapi: isFeatureEnabled('vapi') ? {
    enabled: true,
    apiUrl: config.vapi.apiUrl,
    webhookUrl: config.vapi.webhookUrl,
    publicKey: config.vapi.publicKey,
    // Private key should never be exposed to client
    // Use server-side API for operations requiring private key
  } : {
    enabled: false,
  },

  // Google Maps configuration (only if enabled)
  googleMaps: isFeatureEnabled('maps') ? {
    enabled: true,
    apiKey: config.googleMaps.apiKey,
  } : {
    enabled: false,
  },

  // OpenAI configuration (only if enabled)
  openai: isFeatureEnabled('openai') ? {
    enabled: true,
    assistantId: config.openai.assistantId,
    // API key should be used server-side only
    // Create a proxy endpoint for OpenAI calls
  } : {
    enabled: false,
  },

  // Security headers
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'X-Client-Version': '1.0.0',
  },

  // Request timeout
  timeout: 30000,

  // Retry configuration
  retry: {
    maxAttempts: 3,
    backoff: 'exponential',
    maxDelay: 10000,
  },
};

/**
 * Check if a service is properly configured
 */
export function isServiceConfigured(service: 'supabase' | 'vapi' | 'maps' | 'openai'): boolean {
  switch (service) {
    case 'supabase':
      return Boolean(apiConfig.supabase.url && apiConfig.supabase.anonKey);
    case 'vapi':
      return apiConfig.vapi.enabled;
    case 'maps':
      return apiConfig.googleMaps.enabled;
    case 'openai':
      return apiConfig.openai.enabled;
    default:
      return false;
  }
}

/**
 * Get headers with authentication
 */
export function getAuthHeaders(token?: string): Record<string, string> {
  const headers = { ...apiConfig.headers };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Add CSRF token if available
  const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  return headers;
}

/**
 * Sanitize user input for API calls
 */
export function sanitizeInput(input: string): string {
  // Remove potential injection characters
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/['"]/g, '') // Remove quotes
    .replace(/[;]/g, '') // Remove semicolons
    .trim();
}

/**
 * Validate API response
 */
export function validateResponse(response: unknown): boolean {
  // Check for common attack patterns in response
  const jsonString = JSON.stringify(response);

  // Check for potential XSS
  if (/<script|javascript:/i.test(jsonString)) {
    console.error('Potential XSS detected in API response');
    return false;
  }

  // Check for SQL injection patterns
  if (/(\b(union|select|insert|update|delete|drop)\b.*\b(from|where|table)\b)/i.test(jsonString)) {
    console.error('Potential SQL injection pattern in response');
    return false;
  }

  return true;
}

export default apiConfig;