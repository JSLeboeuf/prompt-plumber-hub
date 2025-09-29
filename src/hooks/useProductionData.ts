export interface EmergencyCall {
  id: string;
  status: string | null;
  priority: string | null;
  duration?: number | null;
  created_at: string | null;
  call_id?: string;
  customer_name?: string | null;
  phone_number?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string | null;
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import logger from '@/lib/logger';
import { getServiceConfig } from '@/config/unified.api.config';
import { useInterventions } from './useInterventions';

const vapiServiceConfig = getServiceConfig('vapi');
const isVapiFeatureEnabled = vapiServiceConfig.enabled;

const CALLS_KEY = ['vapi_calls'] as const;
const CLIENTS_KEY = ['clients'] as const;

export const useEmergencyCalls = () => {
  const queryClient = useQueryClient();

  const { data: calls = [], isLoading: loading, error } = useQuery({
    queryKey: CALLS_KEY,
    queryFn: async () => {
      if (!isVapiFeatureEnabled) {
        logger.warn('VAPI disabled');
        return [];
      }

      const { data, error: fetchError } = await supabase
        .from('vapi_calls')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      return (data || []).map(call => ({ 
        ...call, 
        metadata: call.metadata as Record<string, unknown> | null 
      })) as EmergencyCall[];
    },
    staleTime: 30000,
    gcTime: 300000,
    enabled: isVapiFeatureEnabled,
  });

  const { mutateAsync: createCall } = useMutation({
    mutationFn: async (payload: Record<string, unknown> = {}) => {
      if (!isVapiFeatureEnabled) {
        logger.warn('VAPI disabled');
        return;
      }

      const { error } = await supabase.from('vapi_calls').insert([{
        call_id: (payload.call_id as string) || `call_${Date.now()}`,
        phone_number: (payload.phone_number as string) || null,
        status: 'pending',
        priority: (payload.priority as string) || 'normal',
        metadata: (payload.metadata || {}) as never
      }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CALLS_KEY });
    },
  });

  const { mutateAsync: updateCall } = useMutation({
    mutationFn: async ({ id, updates = {} }: { id: string; updates?: Record<string, unknown> }) => {
      if (!isVapiFeatureEnabled) {
        logger.warn('VAPI disabled');
        return;
      }

      const { error } = await supabase.from('vapi_calls')
        .update({ status: (updates.status as string) || 'active', ...updates })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CALLS_KEY });
    },
  });

  const fetchCalls = () => queryClient.invalidateQueries({ queryKey: CALLS_KEY });

  return {
    calls,
    loading,
    error: error ? (error instanceof Error ? error.message : 'Erreur de chargement') : null,
    createCall,
    updateCall: (id: string, updates: Record<string, unknown> = {}) => updateCall({ id, updates }),
    fetchCalls,
  };
};

export const useClients = () => {
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading: loading, error } = useQuery({
    queryKey: CLIENTS_KEY,
    queryFn: async () => {
      const { data, error: fetchError } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      return data as Client[];
    },
    staleTime: 60000,
    gcTime: 300000,
  });

  const fetchClients = () => queryClient.invalidateQueries({ queryKey: CLIENTS_KEY });

  return {
    clients,
    loading,
    error: error ? (error instanceof Error ? error.message : 'Erreur de chargement') : null,
    fetchClients,
  };
};

export const useProductionData = () => {
  const { calls, loading: callsLoading } = useEmergencyCalls();
  const { clients, loading: clientsLoading } = useClients();
  const { interventions, loading: interventionsLoading } = useInterventions();

  return {
    clients,
    calls,
    interventions,
    loading: callsLoading || clientsLoading || interventionsLoading,
    error: null
  };
};

// These hooks are deprecated - use useEmergencyCalls and useClients instead
export const useAnalyticsData = () => {
  const { calls } = useEmergencyCalls();
  const { clients } = useClients();

  return {
    data: { calls, clients },
    loading: false,
    error: null
  };
};

export const useClientsData = () => {
  const { clients, loading, error } = useClients();
  return {
    data: clients,
    loading,
    error
  };
};
