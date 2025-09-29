import { supabaseServices } from '@/services/supabaseServices';
import { logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';
import type {
  CallData,
  LeadData,
  AnalyticsData,
  SettingsData,
  ConnectionTestResult
} from '@/types/api';

// Configuration de l'API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// Helper pour les requêtes avec gestion d'erreur
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json() as T;
  } catch (error) {
    logger.error(`Error fetching ${endpoint}:`, error);
    throw error;
  }
}

// API Services qui combinent backend local et Supabase
export const api = {
  // Appels
  async getCalls(): Promise<CallData[]> {
    try {
      // Essayer d'abord le backend local
      return await fetchApi<CallData[]>('/api/calls');
    } catch {
      // Fallback sur Supabase
      const calls = await supabaseServices.getRecentCalls(50);
      return calls.map(call => ({
        id: call.id,
        phoneNumber: call.phone_number,
        startTime: new Date(call.started_at),
        endTime: call.ended_at ? new Date(call.ended_at) : undefined,
        duration: call.duration || 0,
        transcript: call.transcript || '',
        priority: (call.priority as CallData['priority']) || 'P4',
        status: (call.status as CallData['status']) || 'completed',
        recordingUrl: call.recording_url,
        metadata: (call.metadata as CallData['metadata']) || {},
      }));
    }
  },

  async getCall(id: string): Promise<CallData | null> {
    try {
      return await fetchApi<CallData>(`/api/calls/${id}`);
    } catch {
      const { data } = await supabase
        .from('vapi_calls')
        .select('*')
        .eq('id', id)
        .single();

      if (!data) return null;

      return {
        id: data.id,
        phoneNumber: data.phone_number,
        startTime: new Date(data.started_at),
        endTime: data.ended_at ? new Date(data.ended_at) : undefined,
        duration: data.duration || 0,
        transcript: data.transcript || '',
        priority: (data.priority as CallData['priority']) || 'P4',
        status: (data.status as CallData['status']) || 'completed',
        recordingUrl: data.recording_url,
        metadata: (data.metadata as CallData['metadata']) || {},
      };
    }
  },

  // Leads
  async getLeads(): Promise<LeadData[]> {
    try {
      return await fetchApi<LeadData[]>('/api/leads');
    } catch {
      const leads = await supabaseServices.getLeads();
      return leads.map(lead => ({
        id: lead.id,
        email: lead.email,
        phone: lead.phone,
        name: lead.name,
        status: (lead.status as LeadData['status']) || 'new',
        source: lead.source,
        created_at: lead.created_at,
        updated_at: lead.updated_at,
        metadata: (lead.metadata as LeadData['metadata']) || {},
      }));
    }
  },

  async createLead(lead: Partial<LeadData>): Promise<LeadData> {
    try {
      return await fetchApi<LeadData>('/api/leads', {
        method: 'POST',
        body: JSON.stringify(lead),
      });
    } catch {
      const { data, error } = await supabase
        .from('leads')
        .insert(lead)
        .select()
        .single();
      if (error) throw error;

      return {
        id: data.id,
        email: data.email,
        phone: data.phone,
        name: data.name,
        status: (data.status as LeadData['status']) || 'new',
        source: data.source,
        created_at: data.created_at,
        updated_at: data.updated_at,
        metadata: (data.metadata as LeadData['metadata']) || {},
      };
    }
  },

  // Analytics
  async getAnalytics(): Promise<AnalyticsData> {
    try {
      return await fetchApi<AnalyticsData>('/api/analytics');
    } catch {
      // Utiliser les métriques de Supabase
      const metrics = await supabaseServices.getDashboardMetrics();
      return {
        totalCalls: metrics.totalCalls,
        todayCalls: metrics.todayCalls,
        totalLeads: metrics.totalLeads,
        conversionRate: metrics.conversionRate,
        metrics: [
          { name: 'Calls', value: metrics.totalCalls, trend: 'stable' },
          { name: 'Leads', value: metrics.totalLeads, trend: 'stable' },
        ],
        timeRange: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          end: new Date(),
          period: 'month'
        }
      };
    }
  },

  // Configuration & Settings
  async getSettings(): Promise<SettingsData> {
    try {
      return await fetchApi<SettingsData>('/api/settings');
    } catch {
      // Retourner des settings par défaut
      return {
        constraints: [],
        pricing: {
          baseRate: 0,
          minimumCharge: 0,
          currency: 'USD'
        },
        prompts: {
          greeting: 'Hello!',
          farewell: 'Goodbye!',
          errorMessage: 'An error occurred'
        },
        webhooks: {
          url: import.meta.env.VITE_VAPI_WEBHOOK_URL || '',
          events: [],
          timeout: 5000
        }
      };
    }
  },

  async updateSettings(settings: Partial<SettingsData>): Promise<SettingsData> {
    try {
      return await fetchApi<SettingsData>('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
    } catch (error) {
      logger.error('Error updating settings:', error);
      throw error;
    }
  },

  // Test de connexion
  async testConnection(): Promise<ConnectionTestResult> {
    const results: ConnectionTestResult = {
      backend: false,
      supabase: false,
      timestamp: new Date(),
      details: {}
    };

    // Test backend local
    try {
      const startTime = Date.now();
      await fetch(`${API_BASE_URL}/health`);
      results.backend = true;
      results.details.backendUrl = API_BASE_URL;
      results.details.latency = Date.now() - startTime;
    } catch (error) {
      results.backend = false;
      results.details.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // Test Supabase
    try {
      const { error } = await supabase.from('vapi_calls').select('count').limit(1);
      results.supabase = !error;
      if (error) {
        results.details.error = error.message;
      }
    } catch (error) {
      results.supabase = false;
      results.details.error = error instanceof Error ? error.message : 'Unknown error';
    }

    return results;
  },
};

// Export only supabaseServices (supabase client is internal)
export { supabaseServices };

export default api;