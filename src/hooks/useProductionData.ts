export interface EmergencyCall {
  id: string;
  status: string | null;
  priority: string | null;
  duration?: number | null;
  created_at: string | null;
  call_id?: string;
  customer_name?: string | null;
  phone_number?: string | null;
  metadata?: any;
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

export const useEmergencyCalls = (): {
  calls: EmergencyCall[];
  loading: boolean;
  error: string | null;
  fetchCalls: () => Promise<void>;
  createCall: (payload?: any) => Promise<void>;
  updateCall: (id: string, updates?: any) => Promise<void>;
} => {
  const [calls, setCalls] = useState<EmergencyCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCalls = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('vapi_calls')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setCalls(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de chargement';
      setError(errorMessage);
      console.error('Error fetching calls:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createCall = useCallback(async (payload: any = {}) => {
    try {
      const { error: insertError } = await supabase
        .from('vapi_calls')
        .insert({
          call_id: payload.call_id || `call_${Date.now()}`,
          phone_number: payload.phone_number || null,
          status: 'pending',
          priority: payload.priority || 'normal',
          metadata: payload.metadata || {}
        });

      if (insertError) throw insertError;
      await fetchCalls();
    } catch (err) {
      console.error('Error creating call:', err);
      throw err;
    }
  }, [fetchCalls]);

  const updateCall = useCallback(async (id: string, updates: any = {}) => {
    try {
      const { error: updateError } = await supabase
        .from('vapi_calls')
        .update({
          status: updates.status || 'active',
          ...updates
        })
        .eq('id', id);

      if (updateError) throw updateError;
      await fetchCalls();
    } catch (err) {
      console.error('Error updating call:', err);
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
      console.error('Error fetching clients:', err);
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
  
  return {
    clients,
    calls,
    interventions: [],
    loading: callsLoading || clientsLoading,
    error: null
  };
};

export const useAnalyticsData = () => ({
  data: null as any,
  loading: false,
  error: null
});

export const useClientsData = () => ({
  data: [] as Client[],
  loading: false,
  error: null
});