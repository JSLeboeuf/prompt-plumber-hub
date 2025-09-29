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

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import logger from '@/lib/logger';
import { getServiceConfig } from '@/config/unified.api.config';
import { useInterventions } from './useInterventions';

const vapiServiceConfig = getServiceConfig('vapi');
const isVapiFeatureEnabled = vapiServiceConfig.enabled;
const vapiDisabledMessage = isVapiFeatureEnabled
  ? null
  : 'La fonctionnalité d\'appels VAPI est désactivée ou mal configurée. Configurez VITE_ENABLE_VAPI et VITE_VAPI_PUBLIC_KEY.';

export const useEmergencyCalls = (): {
  calls: EmergencyCall[];
  loading: boolean;
  error: string | null;
  fetchCalls: () => Promise<void>;
  createCall: (payload?: Record<string, unknown>) => Promise<void>;
  updateCall: (id: string, updates?: Record<string, unknown>) => Promise<void>;
} => {
  const [calls, setCalls] = useState<EmergencyCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCalls = useCallback(async () => {
    try {
      setLoading(true);
      if (!isVapiFeatureEnabled) {
        if (vapiDisabledMessage) {
          setError(vapiDisabledMessage);
        }
        setCalls([]);
        logger.warn('Skipping call fetch because VAPI is disabled or not configured');
        return;
      }

      setError(null);

      const { data, error: fetchError } = await supabase
        .from('vapi_calls')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setCalls((data || []).map(call => ({ 
        ...call, 
        metadata: call.metadata as Record<string, unknown> | null 
      })));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de chargement';
      setError(errorMessage);
      const normalizedError = err instanceof Error ? err : new Error(String(err));
      logger.error('Error fetching calls', normalizedError);
    } finally {
      setLoading(false);
    }
  }, []);

  const createCall = useCallback(async (payload: Record<string, unknown> = {}) => {
    if (!isVapiFeatureEnabled) {
      if (vapiDisabledMessage) {
        setError(vapiDisabledMessage);
      }
      logger.warn('Skipping call creation because VAPI is disabled or not configured');
      return;
    }

    try {
      const { error: insertError } = await supabase
        .from('vapi_calls')
        .insert({
          call_id: (payload.call_id as string) || `call_${Date.now()}`,
          phone_number: (payload.phone_number as string) || null,
          status: 'pending',
          priority: (payload.priority as string) || 'normal',
          metadata: (payload.metadata as Record<string, unknown>) || {} as never
        });

      if (insertError) throw insertError;
      await fetchCalls();
    } catch (err) {
      const normalizedError = err instanceof Error ? err : new Error(String(err));
      logger.error('Error creating call', normalizedError);
      throw err;
    }
  }, [fetchCalls]);

  const updateCall = useCallback(async (id: string, updates: Record<string, unknown> = {}) => {
    if (!isVapiFeatureEnabled) {
      if (vapiDisabledMessage) {
        setError(vapiDisabledMessage);
      }
      logger.warn('Skipping call update because VAPI is disabled or not configured', { id });
      return;
    }

    try {
      const { error: updateError } = await supabase
        .from('vapi_calls')
        .update({
          status: (updates.status as string) || 'active',
          ...updates
        })
        .eq('id', id);

      if (updateError) throw updateError;
      await fetchCalls();
    } catch (err) {
      const normalizedError = err instanceof Error ? err : new Error(String(err));
      logger.error('Error updating call', { error: normalizedError, id, updates });
      throw err;
    }
  }, [fetchCalls]);

  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

  return {
    calls,
    loading,
    error,
    fetchCalls,
    createCall,
    updateCall
  };
};

export const useClients = (): {
  clients: Client[];
  loading: boolean;
  error: string | null;
  fetchClients: () => Promise<void>;
} => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setClients(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de chargement';
      setError(errorMessage);
      const normalizedError = err instanceof Error ? err : new Error(String(err));
      logger.error('Error fetching clients', normalizedError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  return {
    clients,
    loading,
    error,
    fetchClients
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
