/**
 * API Configuration for Drain Fortin SaaS - Production Ready
 * Centralized configuration for all external services and webhooks
 */

// Environment validation
const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_PUBLISHABLE_KEY'
] as const;

requiredEnvVars.forEach(envVar => {
  if (!import.meta.env[envVar]) {
    console.warn(`Missing required environment variable: ${envVar}`);
  }
});

// Base configuration
export const API_CONFIG = {
  // Supabase configuration
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || 'https://rmtnitwtxikuvnrlsmtq.supabase.co',
    anonKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtdG5pdHd0eGlrdXZucmxzbXRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3MTc0MjAsImV4cCI6MjA3MzI5MzQyMH0.Wd5fOfMNJ--1E4GTggB4pMW2z0VSZVgHgd0k0e2lOTc',
  },

  // VAPI Voice AI configuration
  vapi: {
    baseUrl: 'https://api.vapi.ai/v1',
    publicKey: import.meta.env.VITE_VAPI_PUBLIC_KEY || '',
    assistantId: import.meta.env.VITE_VAPI_ASSISTANT_ID || '',
    webhookUrl: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vapi-webhook`,
  },

  // Twilio SMS configuration  
  twilio: {
    webhookUrl: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/twilio-sms`,
  },

  // n8n Automation webhooks
  n8n: {
    baseUrl: import.meta.env.VITE_N8N_BASE_URL || 'https://your-n8n-instance.com',
    webhooks: {
      newClient: `${import.meta.env.VITE_N8N_BASE_URL}/webhook/new-client`,
      emergencyCall: `${import.meta.env.VITE_N8N_BASE_URL}/webhook/emergency-call`,
      interventionCompleted: `${import.meta.env.VITE_N8N_BASE_URL}/webhook/intervention-completed`,
      feedback: `${import.meta.env.VITE_N8N_BASE_URL}/webhook/customer-feedback`,
    }
  },

  // Google Maps configuration
  maps: {
    apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    baseUrl: 'https://maps.googleapis.com/maps/api',
  },

  // Request timeout and retry configuration
  timeout: 10000, // 10 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
};

// API endpoints for Edge Functions
export const ENDPOINTS = {
  // Authentication
  auth: {
    signIn: '/auth/sign-in',
    signUp: '/auth/sign-up',
    signOut: '/auth/sign-out',
    profile: '/auth/profile',
  },

  // Emergency calls
  calls: {
    list: '/functions/v1/emergency-calls',
    create: '/functions/v1/emergency-calls',
    update: (id: string) => `/functions/v1/emergency-calls/${id}`,
    assign: '/functions/v1/assign-call',
    escalate: '/functions/v1/escalate-call',
  },

  // CRM/Clients
  clients: {
    list: '/functions/v1/clients',
    create: '/functions/v1/clients',
    update: (id: string) => `/functions/v1/clients/${id}`,
    search: '/functions/v1/clients/search',
    timeline: (id: string) => `/functions/v1/clients/${id}/timeline`,
  },

  // Interventions
  interventions: {
    list: '/functions/v1/interventions',
    create: '/functions/v1/interventions',
    update: (id: string) => `/functions/v1/interventions/${id}`,
    complete: (id: string) => `/functions/v1/interventions/${id}/complete`,
    schedule: '/functions/v1/interventions/schedule',
  },

  // Analytics
  analytics: {
    dashboard: '/functions/v1/analytics/dashboard',
    export: '/functions/v1/analytics/export',
    kpis: '/functions/v1/analytics/kpis',
  },

  // Audit logs
  audit: {
    logs: '/functions/v1/audit-logs',
    export: '/functions/v1/audit-logs/export',
  },

  // Support & Communication
  support: {
    vapiCall: '/functions/v1/vapi-call',
    sendSms: '/functions/v1/send-sms',
    feedback: '/functions/v1/support-feedback',
  },

  // Webhooks
  webhooks: {
    vapi: '/functions/v1/vapi-webhook',
    twilio: '/functions/v1/twilio-webhook',
    n8n: '/functions/v1/n8n-webhook',
  }
};

// HTTP client configuration
export const createApiClient = () => {
  const baseURL = API_CONFIG.supabase.url;

  return {
    async request<T>(
      endpoint: string, 
      options: RequestInit = {}
    ): Promise<{ data: T | null; error: string | null }> {
      const url = endpoint.startsWith('http') ? endpoint : `${baseURL}${endpoint}`;
      
      const defaultHeaders = {
        'Content-Type': 'application/json',
        'apikey': API_CONFIG.supabase.anonKey,
        ...options.headers,
      };

      try {
        const response = await fetch(url, {
          ...options,
          headers: defaultHeaders,
          signal: AbortSignal.timeout(API_CONFIG.timeout),
        });

        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return { data, error: null };
      } catch (error) {
        console.error('API Request failed:', error);
        return { 
          data: null, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    },

    async get(endpoint: string, headers?: Record<string, string>) {
      return this.request(endpoint, { method: 'GET', headers });
    },

    async post(endpoint: string, body?: any, headers?: Record<string, string>) {
      return this.request(endpoint, { 
        method: 'POST', 
        body: JSON.stringify(body),
        headers 
      });
    },

    async put(endpoint: string, body?: any, headers?: Record<string, string>) {
      return this.request(endpoint, { 
        method: 'PUT', 
        body: JSON.stringify(body),
        headers 
      });
    },

    async patch(endpoint: string, body?: any, headers?: Record<string, string>) {
      return this.request(endpoint, { 
        method: 'PATCH', 
        body: JSON.stringify(body),
        headers 
      });
    },

    async delete(endpoint: string, headers?: Record<string, string>) {
      return this.request(endpoint, { method: 'DELETE', headers });
    },
  };
};

export const apiClient = createApiClient();

// Webhook utilities
export const webhookUtils = {
  async triggerN8nWebhook(webhook: keyof typeof API_CONFIG.n8n.webhooks, data: any) {
    const url = API_CONFIG.n8n.webhooks[webhook];
    if (!url) {
      console.warn(`N8N webhook URL not configured for: ${webhook}`);
      return { success: false, error: 'Webhook URL not configured' };
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...data, 
          timestamp: new Date().toISOString(),
          source: 'drain-fortin-dashboard' 
        }),
        mode: 'no-cors',
      });
      
      return { success: true, data: response };
    } catch (error) {
      console.error('N8N webhook error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  async logAction(action: string, resourceType: string, resourceId?: string, details?: any) {
    return apiClient.post('/functions/v1/log-action', {
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      details,
      timestamp: new Date().toISOString(),
    });
  }
};

// Export types for TypeScript
export type ApiResponse<T> = {
  data: T | null;
  error: string | null;
};

export type WebhookResponse = {
  success: boolean;
  data?: any;
  error?: string;
};