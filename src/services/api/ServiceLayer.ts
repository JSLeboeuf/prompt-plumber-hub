/**
 * Unified Service Layer
 * Consolidates all service patterns into consistent, type-safe interfaces
 * - Standardized service contracts
 * - Automatic error handling and retry logic
 * - Validation and sanitization
 * - Caching and performance optimization
 * - Circuit breaker protection for external services
 */

import { BaseService, type ServiceResult, type PaginatedResult, type QueryOptions } from '@/services/BaseService';
import { unifiedAPI } from './UnifiedAPIClient';
import { logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';
import type {
  CallData,
  LeadData,
  AnalyticsData,
  SettingsData,
  ConnectionTestResult,
} from '@/types/api';
import type {
  CallContext,
  WebhookClientData,
  WebhookCallData,
  WebhookInterventionData,
  WebhookFeedbackData,
} from '@/types/api.types';
import type { Database } from '@/shared/types/database';

// Service Response Types
interface VAPICallResponse {
  callId: string;
  status: 'initiated' | 'in_progress' | 'completed' | 'failed';
  phoneNumber: string;
  context: CallContext;
  metadata?: Record<string, unknown>;
}

interface TranscriptMessage {
  id: string;
  call_id: string;
  message: string;
  role: 'user' | 'assistant' | 'system';
  confidence: number;
  created_at: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

interface SMSResponse {
  messageId: string;
  status: 'sent' | 'queued' | 'failed';
  to: string;
  timestamp: string;
  errorMessage?: string;
}

interface BulkSMSResponse {
  successful: number;
  failed: number;
  results: SMSResponse[];
}

interface WorkflowResponse {
  workflowId: string;
  status: 'triggered' | 'running' | 'completed' | 'failed';
  timestamp: string;
  result?: unknown;
}

interface RouteOptimizationResponse {
  routes: Array<{
    summary: string;
    waypoint_order: number[];
    legs: Array<{
      distance: { text: string; value: number };
      duration: { text: string; value: number };
      start_address: string;
      end_address: string;
    }>;
  }>;
  status: string;
}

type VAPICallRow = Database['public']['Tables']['vapi_calls']['Row'];
type LeadRow = Database['public']['Tables']['leads']['Row'];

// Service Configuration
export interface ServiceConfig {
  enableFallback: boolean;
  cacheTimeout: number;
  retryAttempts: number;
  circuitBreakerEnabled: boolean;
}

const DEFAULT_SERVICE_CONFIG: ServiceConfig = {
  enableFallback: true,
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
  retryAttempts: 3,
  circuitBreakerEnabled: true,
};

/**
 * Base API Service with unified patterns
 */
abstract class UnifiedBaseService extends BaseService {
  protected config: ServiceConfig;
  protected serviceName: string;

  constructor(serviceName: string, config: Partial<ServiceConfig> = {}) {
    super();
    this.serviceName = serviceName;
    this.config = { ...DEFAULT_SERVICE_CONFIG, ...config };
  }

  /**
   * Execute operation with fallback support
   */
  protected async executeWithFallback<T>(
    primary: () => Promise<T>,
    fallback?: () => Promise<T>,
    operation = 'unknown'
  ): Promise<T> {
    try {
      return await primary();
    } catch (error) {
      logger.warn(`${this.serviceName} primary operation failed`, {
        operation,
        error: error instanceof Error ? error.message : String(error),
      });

      if (this.config.enableFallback && fallback) {
        logger.info(`${this.serviceName} attempting fallback`, { operation });
        return await fallback();
      }

      throw error;
    }
  }

  /**
   * Transform Supabase data to service format
   */
  protected transformSupabaseData<TInput, TOutput>(
    data: TInput,
    transformer: (item: TInput) => TOutput
  ): TOutput {
    return transformer(data);
  }

  /**
   * Transform array of Supabase data
   */
  protected transformSupabaseArray<TInput, TOutput>(
    data: TInput[],
    transformer: (item: TInput) => TOutput
  ): TOutput[] {
    return data.map(transformer);
  }
}

/**
 * VAPI Service - Voice AI Integration
 */
export class VAPIService extends UnifiedBaseService {
  constructor(config?: Partial<ServiceConfig>) {
    super('VAPIService', config);
  }

  /**
   * Start a new call
   */
  async startCall(phoneNumber: string, context: CallContext): Promise<ServiceResult<VAPICallResponse>> {
    return this.executeOperation(
      async () => {
        return this.executeWithFallback(
          // Primary: Use unified API client
          async () => {
            const response = await unifiedAPI.post('/functions/v1/vapi-call', {
              phone_number: phoneNumber,
              context,
            });
            return response.data;
          },
          // Fallback: Direct Supabase function
          async () => {
            const { data, error } = await supabase.functions.invoke('vapi-call', {
              body: {
                phone_number: phoneNumber,
                context,
              },
            });
            if (error) throw error;
            return data;
          }
        );
      },
      'startCall',
      'vapi_call'
    );
  }

  /**
   * Get call transcript
   */
  async getCallTranscript(callId: string): Promise<ServiceResult<TranscriptMessage[]>> {
    return this.executeOperation(
      async () => {
        return this.executeWithFallback(
          // Primary: API endpoint
          async () => {
            const response = await unifiedAPI.get(`/api/calls/${callId}/transcript`);
            return response.data;
          },
          // Fallback: Direct Supabase query
          async () => {
            const { data, error } = await supabase
              .from('call_transcripts')
              .select('id, call_id, message, role, confidence, created_at, timestamp, metadata')
              .eq('call_id', callId)
              .order('created_at', { ascending: false });
            
            if (error) throw error;
            return data || [];
          }
        );
      },
      'getCallTranscript',
      'call_transcript'
    );
  }
}

/**
 * SMS Service - Messaging Integration
 */
export class SMSService extends UnifiedBaseService {
  constructor(config?: Partial<ServiceConfig>) {
    super('SMSService', config);
  }

  /**
   * Send single SMS
   */
  async sendSMS(
    to: string,
    message: string,
    priority: 'normal' | 'urgent' = 'normal'
  ): Promise<ServiceResult<SMSResponse>> {
    return this.executeOperation(
      async () => {
        return this.executeWithFallback(
          // Primary: Unified API
          async () => {
            const response = await unifiedAPI.post('/api/sms/send', {
              to,
              message,
              priority,
            });
            return response.data;
          },
          // Fallback: Supabase function
          async () => {
            const { data, error } = await supabase.functions.invoke('send-sms', {
              body: { to, message, priority },
            });
            if (error) throw error;
            return data;
          }
        );
      },
      'sendSMS',
      'sms'
    );
  }

  /**
   * Send bulk SMS
   */
  async sendBulkSMS(recipients: string[], message: string): Promise<ServiceResult<BulkSMSResponse>> {
    return this.executeOperation(
      async () => {
        return this.executeWithFallback(
          // Primary: Unified API
          async () => {
            const response = await unifiedAPI.post('/api/sms/bulk', {
              recipients,
              message,
            });
            return response.data;
          },
          // Fallback: Supabase function
          async () => {
            const { data, error } = await supabase.functions.invoke('send-bulk-sms', {
              body: { recipients, message },
            });
            if (error) throw error;
            return data;
          }
        );
      },
      'sendBulkSMS',
      'bulk_sms'
    );
  }
}

/**
 * Automation Service - Workflow Integration
 */
export class AutomationService extends UnifiedBaseService {
  constructor(config?: Partial<ServiceConfig>) {
    super('AutomationService', config);
  }

  /**
   * Trigger workflow
   */
  async triggerWorkflow(
    workflowName: string,
    data: WebhookClientData | WebhookCallData | WebhookInterventionData | WebhookFeedbackData
  ): Promise<ServiceResult<WorkflowResponse>> {
    return this.executeOperation(
      async () => {
        return this.executeWithFallback(
          // Primary: Unified API
          async () => {
            const response = await unifiedAPI.post('/api/workflows/trigger', {
              workflow: workflowName,
              payload: data,
            });
            return response.data;
          },
          // Fallback: Direct n8n webhook
          async () => {
            const response = await unifiedAPI.post('/functions/v1/n8n-webhook', {
              webhook: workflowName,
              payload: data,
            });
            return response.data;
          }
        );
      },
      'triggerWorkflow',
      'workflow'
    );
  }

  /**
   * Send feedback
   */
  async sendFeedback(feedback: {
    type: 'bug' | 'feature' | 'general';
    message: string;
    priority: 'low' | 'medium' | 'high';
    userEmail: string;
  }): Promise<ServiceResult<WorkflowResponse>> {
    return this.triggerWorkflow('feedback', feedback);
  }
}

/**
 * Maps Service - Geographic Integration
 */
export class MapsService extends UnifiedBaseService {
  constructor(config?: Partial<ServiceConfig>) {
    super('MapsService', config);
  }

  /**
   * Geocode address
   */
  async geocodeAddress(address: string): Promise<ServiceResult<{
    lat: number;
    lng: number;
    formatted_address: string;
    placeId?: string;
  }>> {
    return this.executeOperation(
      async () => {
        return this.executeWithFallback(
          // Primary: Backend proxy (secure)
          async () => {
            const response = await unifiedAPI.post('/api/maps/geocode', {
              address,
            });
            return response.data;
          },
          // Fallback: Direct Google Maps API (requires client-side key)
          async () => {
            const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
            if (!apiKey) {
              throw new Error('Google Maps API key not configured');
            }

            const response = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
            );
            const data = await response.json();
            
            if (data.status === 'OK' && data.results.length > 0) {
              const location = data.results[0].geometry.location;
              return {
                lat: location.lat,
                lng: location.lng,
                formatted_address: data.results[0].formatted_address,
              };
            }
            throw new Error('Geocoding failed');
          }
        );
      },
      'geocodeAddress',
      'geocode'
    );
  }

  /**
   * Optimize route
   */
  async optimizeRoute(waypoints: Array<{ lat: number; lng: number }>): Promise<ServiceResult<RouteOptimizationResponse>> {
    return this.executeOperation(
      async () => {
        return this.executeWithFallback(
          // Primary: Backend proxy
          async () => {
            const response = await unifiedAPI.post('/api/maps/directions', {
              waypoints,
            });
            return response.data;
          },
          // Fallback: Direct API call
          async () => {
            const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
            if (!apiKey) {
              throw new Error('Google Maps API key not configured');
            }

            if (waypoints.length < 2) {
              throw new Error('At least 2 waypoints required');
            }

            const origin = waypoints[0];
            const destination = waypoints[waypoints.length - 1];
            const intermediateWaypoints = waypoints.slice(1, -1);
            
            const waypointsParam = intermediateWaypoints
              .map(wp => `${wp.lat},${wp.lng}`)
              .join('|');
            
            const response = await fetch(
              `https://maps.googleapis.com/maps/api/directions/json?origin=${origin?.lat},${origin?.lng}&destination=${destination?.lat},${destination?.lng}&waypoints=optimize:true|${waypointsParam}&key=${apiKey}`
            );
            
            return await response.json();
          }
        );
      },
      'optimizeRoute',
      'route_optimization'
    );
  }
}

/**
 * CRM Service - Customer Relationship Management
 */
export class CRMService extends UnifiedBaseService {
  constructor(config?: Partial<ServiceConfig>) {
    super('CRMService', config);
  }

  /**
   * Get calls with pagination
   */
  async getCalls(options?: QueryOptions): Promise<ServiceResult<PaginatedResult<CallData>>> {
    return this.executeOperation(
      async () => {
        return this.executeWithFallback(
          // Primary: API endpoint
          async () => {
            const response = await unifiedAPI.get('/api/calls', {
              headers: {
                'X-Query-Options': JSON.stringify(options || {}),
              },
            });
            return response.data;
          },
          // Fallback: Supabase query
          async () => {
            let query = supabase
              .from('vapi_calls')
              .select('*', { count: 'exact' });

            query = this.buildFilters(query, options?.filters);
            query = this.applySorting(query, options?.sortBy, options?.sortOrder);
            query = this.applyPagination(query, options?.page, options?.pageSize);

            const { data, error, count } = await query;
            if (error) throw error;

            const transformedData = this.transformSupabaseArray<VAPICallRow, CallData>(data || [], (call) => ({
              id: call.id,
              phoneNumber: call.phone_number,
              startTime: new Date(call.started_at),
              endTime: call.ended_at ? new Date(call.ended_at) : undefined,
              duration: call.duration || 0,
              transcript: call.transcript || '',
              priority: call.priority || 'P4',
              status: call.status || 'completed',
              recordingUrl: call.recording_url,
              metadata: call.metadata || {},
            }));

            return this.transformPaginatedResult(
              transformedData,
              count || 0,
              options?.page || 1,
              options?.pageSize || 25
            );
          }
        );
      },
      'getCalls',
      'calls'
    );
  }

  /**
   * Get single call
   */
  async getCall(id: string): Promise<ServiceResult<CallData | null>> {
    return this.executeOperation(
      async () => {
        return this.executeWithFallback(
          // Primary: API endpoint
          async () => {
            const response = await unifiedAPI.get(`/api/calls/${id}`);
            return response.data;
          },
          // Fallback: Supabase query
          async () => {
            const { data, error } = await supabase
              .from('vapi_calls')
              .select('*')
              .eq('id', id)
              .single();

            if (error && error.code !== 'PGRST116') throw error;
            if (!data) return null;

            return this.transformSupabaseData<VAPICallRow, CallData>(data, (call) => ({
              id: call.id,
              phoneNumber: call.phone_number,
              startTime: new Date(call.started_at),
              endTime: call.ended_at ? new Date(call.ended_at) : undefined,
              duration: call.duration || 0,
              transcript: call.transcript || '',
              priority: call.priority || 'P4',
              status: call.status || 'completed',
              recordingUrl: call.recording_url,
              metadata: call.metadata || {},
            }));
          }
        );
      },
      'getCall',
      'call'
    );
  }

  /**
   * Get leads with pagination
   */
  async getLeads(options?: QueryOptions): Promise<ServiceResult<PaginatedResult<LeadData>>> {
    return this.executeOperation(
      async () => {
        return this.executeWithFallback(
          // Primary: API endpoint
          async () => {
            const response = await unifiedAPI.get('/api/leads', {
              headers: {
                'X-Query-Options': JSON.stringify(options || {}),
              },
            });
            return response.data;
          },
          // Fallback: Supabase query
          async () => {
            let query = supabase
              .from('leads')
              .select('*', { count: 'exact' });

            query = this.buildFilters(query, options?.filters);
            query = this.applySorting(query, options?.sortBy, options?.sortOrder);
            query = this.applyPagination(query, options?.page, options?.pageSize);

            const { data, error, count } = await query;
            if (error) throw error;

            const transformedData = this.transformSupabaseArray<LeadRow, LeadData>(data || [], (lead) => ({
              id: lead.id,
              email: lead.email,
              phone: lead.phone,
              name: lead.name,
              status: lead.status || 'new',
              source: lead.source,
              created_at: lead.created_at,
              updated_at: lead.updated_at,
              metadata: lead.metadata || {},
            }));

            return this.transformPaginatedResult(
              transformedData,
              count || 0,
              options?.page || 1,
              options?.pageSize || 25
            );
          }
        );
      },
      'getLeads',
      'leads'
    );
  }

  /**
   * Create lead
   */
  async createLead(lead: Partial<LeadData>): Promise<ServiceResult<LeadData>> {
    return this.executeOperation(
      async () => {
        return this.executeWithFallback(
          // Primary: API endpoint
          async () => {
            const response = await unifiedAPI.post('/api/leads', lead);
            return response.data;
          },
          // Fallback: Supabase insert
          async () => {
            const { data, error } = await supabase
              .from('leads')
              .insert(lead)
              .select()
              .single();

            if (error) throw error;

            return this.transformSupabaseData<LeadRow, LeadData>(data, (l) => ({
              id: l.id,
              email: l.email,
              phone: l.phone,
              name: l.name,
              status: l.status || 'new',
              source: l.source,
              created_at: l.created_at,
              updated_at: l.updated_at,
              metadata: l.metadata || {},
            }));
          }
        );
      },
      'createLead',
      'lead'
    );
  }
}

/**
 * Analytics Service - Data and Metrics
 */
export class AnalyticsService extends UnifiedBaseService {
  constructor(config?: Partial<ServiceConfig>) {
    super('AnalyticsService', config);
  }

  /**
   * Get analytics data
   */
  async getAnalytics(): Promise<ServiceResult<AnalyticsData>> {
    return this.executeOperation(
      async () => {
        return this.executeWithFallback(
          // Primary: API endpoint
          async () => {
            const response = await unifiedAPI.get('/api/analytics');
            return response.data;
          },
          // Fallback: Calculate from Supabase
          async () => {
            // This is a simplified calculation - in production you'd want 
            // more sophisticated analytics queries
            const [callsResult, leadsResult] = await Promise.all([
              supabase.from('vapi_calls').select('id', { count: 'exact' }),
              supabase.from('leads').select('id', { count: 'exact' }),
            ]);

            const totalCalls = callsResult.count || 0;
            const totalLeads = leadsResult.count || 0;
            const conversionRate = totalCalls > 0 ? (totalLeads / totalCalls) * 100 : 0;

            return {
              totalCalls,
              todayCalls: 0, // Would need time-based query
              totalLeads,
              conversionRate,
              metrics: [
                { name: 'Calls', value: totalCalls, trend: 'stable' },
                { name: 'Leads', value: totalLeads, trend: 'stable' },
              ],
              timeRange: {
                start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                end: new Date(),
                period: 'month',
              },
            };
          }
        );
      },
      'getAnalytics',
      'analytics'
    );
  }
}

/**
 * Settings Service - Configuration Management
 */
export class SettingsService extends UnifiedBaseService {
  constructor(config?: Partial<ServiceConfig>) {
    super('SettingsService', config);
  }

  /**
   * Get settings
   */
  async getSettings(): Promise<ServiceResult<SettingsData>> {
    return this.executeOperation(
      async () => {
        return this.executeWithFallback(
          // Primary: API endpoint
          async () => {
            const response = await unifiedAPI.get('/api/settings');
            return response.data;
          },
          // Fallback: Default settings
          async () => {
            return {
              constraints: [],
              pricing: {
                baseRate: 0,
                minimumCharge: 0,
                currency: 'USD',
              },
              prompts: {
                greeting: 'Hello!',
                farewell: 'Goodbye!',
                errorMessage: 'An error occurred',
              },
              webhooks: {
                url: import.meta.env.VITE_VAPI_WEBHOOK_URL || '',
                events: [],
                timeout: 5000,
              },
            };
          }
        );
      },
      'getSettings',
      'settings'
    );
  }

  /**
   * Update settings
   */
  async updateSettings(settings: Partial<SettingsData>): Promise<ServiceResult<SettingsData>> {
    return this.executeOperation(
      async () => {
        const response = await unifiedAPI.put('/api/settings', settings);
        return response.data;
      },
      'updateSettings',
      'settings'
    );
  }
}

/**
 * Health Service - System Health and Connectivity
 */
export class HealthService extends UnifiedBaseService {
  constructor(config?: Partial<ServiceConfig>) {
    super('HealthService', config);
  }

  /**
   * Test connection to all systems
   */
  async testConnection(): Promise<ServiceResult<ConnectionTestResult>> {
    return this.executeOperation(
      async () => {
        const results: ConnectionTestResult = {
          backend: false,
          supabase: false,
          timestamp: new Date(),
          details: {},
        };

        // Test unified API client health
        try {
          const health = await unifiedAPI.healthCheck();
          results.backend = health.status !== 'unhealthy';
          results.details.apiHealth = health;
        } catch (error) {
          results.backend = false;
          results.details.error = error instanceof Error ? error.message : 'Unknown error';
        }

        // Test Supabase connectivity
        try {
          const { error } = await supabase.from('vapi_calls').select('count').limit(1);
          results.supabase = !error;
          if (error) {
            results.details.supabaseError = error.message;
          }
        } catch (error) {
          results.supabase = false;
          results.details.supabaseError = error instanceof Error ? error.message : 'Unknown error';
        }

        return results;
      },
      'testConnection',
      'health'
    );
  }
}

// Export service instances
export const vapiService = new VAPIService();
export const smsService = new SMSService();
export const automationService = new AutomationService();
export const mapsService = new MapsService();
export const crmService = new CRMService();
export const analyticsService = new AnalyticsService();
export const settingsService = new SettingsService();
export const healthService = new HealthService();

// Export unified services object
export const services = {
  vapi: vapiService,
  sms: smsService,
  automation: automationService,
  maps: mapsService,
  crm: crmService,
  analytics: analyticsService,
  settings: settingsService,
  health: healthService,
} as const;

// Export types
export type {
  ServiceConfig,
  ServiceResult,
  PaginatedResult,
  QueryOptions,
};