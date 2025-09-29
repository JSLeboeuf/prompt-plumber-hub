import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { supabaseServices } from "@/services/supabaseServices";
import type { VapiCall, Lead, SMSLog } from "@/shared/types/supabase";
import type { SupabaseRealtimePayload } from "@/shared/types/supabase";
import api from "@/services/legacyApi";

// Hook pour récupérer les appels depuis Supabase avec optimisations
export function useSupabaseCalls(limit = 10) {
  return useQuery({
    queryKey: ['supabase', 'calls', limit],
    queryFn: () => supabaseServices.getRecentCalls(limit),
    refetchInterval: 10000, // Refresh toutes les 10 secondes
    staleTime: 5000, // Data stays fresh for 5 seconds
    gcTime: 300000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false, // Prevent refetch on tab focus
    refetchOnMount: 'always',
  });
}

// Hook pour récupérer les leads
export function useSupabaseLeads(limit = 50) {
  return useQuery({
    queryKey: ['supabase', 'leads', limit],
    queryFn: () => supabaseServices.getLeads(),
    refetchInterval: 30000, // Refresh toutes les 30 secondes
  });
}

// Hook pour récupérer les logs SMS
export function useSupabaseSMSLogs(limit = 20) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['supabase', 'sms_logs', limit],
    queryFn: () => supabaseServices.getSMSLogs(limit),
  });

  useEffect(() => {
    const subscription = supabaseServices.subscribeToSMSLogs((_payload: SupabaseRealtimePayload<SMSLog>) => {
      queryClient.invalidateQueries({ queryKey: ['supabase', 'sms_logs'] });
    });

    return () => {
      supabaseServices.unsubscribeFromTable(subscription);
    };
  }, [queryClient]);

  return query;
}

// Hook pour les métriques du dashboard
export function useSupabaseDashboardMetrics() {
  return useQuery({
    queryKey: ['supabase', 'dashboard_metrics'],
    queryFn: () => supabaseServices.getDashboardMetrics(),
    refetchInterval: 60000, // Refresh chaque minute
  });
}

// Hook pour les appels temps réel
export function useRealtimeCalls() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const subscription = supabaseServices.subscribeToNewCalls((_payload: SupabaseRealtimePayload<VapiCall>) => {
      // Invalider et refetch les queries relatives aux appels
      queryClient.invalidateQueries({ queryKey: ['supabase', 'calls'] });
      queryClient.invalidateQueries({ queryKey: ['supabase', 'dashboard_metrics'] });

      // Notification removed for production
    });

    return () => {
      supabaseServices.unsubscribeFromTable(subscription);
    };
  }, [queryClient]);
}

// Hook pour tester la connexion
export function useConnectionStatus() {
  return useQuery({
    queryKey: ['connection', 'status'],
    queryFn: () => api.testConnection(),
    refetchInterval: 30000, // Test toutes les 30 secondes
    staleTime: 20000,
  });
}

// Hook pour créer un lead
export function useCreateLead() {
  const queryClient = useQueryClient();

  return useMutation({
mutationFn: async (lead: Partial<Lead>) => {
      const { data, error } = await supabase
        .from('leads')
        .insert(lead)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supabase', 'leads'] });
    },
  });
}

// Hook pour mettre à jour un appel
export function useUpdateCall() {
  const queryClient = useQueryClient();

  return useMutation({
mutationFn: async ({ id, updates }: { id: string; updates: Partial<VapiCall> }) => {
      const { data, error } = await supabase
        .from('vapi_calls')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supabase', 'calls'] });
    },
  });
}

// Hook pour récupérer les contraintes depuis la DB
export function useConstraints() {
  return useQuery({
    queryKey: ['supabase', 'constraints'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_constraints')
        .select('*')
        .order('category', { ascending: true });

      if (error) {
        // Error handled silently in production
        return [];
      }

      return data || [];
    },
    staleTime: 300000, // Cache pour 5 minutes
  });
}

// Hook pour récupérer les règles de tarification
export function usePricingRules() {
  return useQuery({
    queryKey: ['supabase', 'pricing_rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pricing_rules')
        .select('*')
        .order('priority', { ascending: true });

      if (error) {
        // Error handled silently in production
        return [];
      }

      return data || [];
    },
    staleTime: 300000,
  });
}

// Types for dashboard data response
interface DashboardMetrics {
  totalCalls: number;
  totalLeads: number;
  urgentCalls: number;
  avgDuration: number;
  conversionRate: number;
}

interface ConnectionStatus {
  backend: boolean;
  supabase: boolean;
  timestamp?: Date;
  details?: Record<string, unknown>;
}

// Hook combiné pour toutes les métriques
export function useDashboardData() {
  const calls = useSupabaseCalls(20);
  const leads = useSupabaseLeads(10);
  const metrics = useSupabaseDashboardMetrics();
  const connection = useConnectionStatus();

  // Activer les mises à jour temps réel
  useRealtimeCalls();

  const defaultMetrics: DashboardMetrics = {
    totalCalls: 0,
    totalLeads: 0,
    urgentCalls: 0,
    avgDuration: 0,
    conversionRate: 0
  };

  const defaultConnection: ConnectionStatus = {
    backend: false,
    supabase: false
  };

  return {
    calls: Array.isArray(calls.data) ? calls.data : [],
    leads: Array.isArray(leads.data) ? leads.data : [],
    metrics: metrics.data || defaultMetrics,
    connectionStatus: connection.data || defaultConnection,
    isLoading: calls.isLoading || leads.isLoading || metrics.isLoading,
    error: calls.error || leads.error || metrics.error,
  };
}

export default {
  useSupabaseCalls,
  useSupabaseLeads,
  useSupabaseSMSLogs,
  useSupabaseDashboardMetrics,
  useRealtimeCalls,
  useConnectionStatus,
  useCreateLead,
  useUpdateCall,
  useConstraints,
  usePricingRules,
  useDashboardData,
};