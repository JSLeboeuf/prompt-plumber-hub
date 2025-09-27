/**
 * Production Supabase Data Hooks for Drain Fortin
 * Real-time data management with automatic updates
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/useToast';
import { webhookUtils } from '@/config/api.config';

export interface EmergencyCall {
  id: string;
  call_id?: string;
  customer_name: string;
  phone_number: string;
  priority: 'normal' | 'P1' | 'P2' | 'P3';
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  duration?: number;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at?: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  lead_score?: number;
  status: 'active' | 'inactive' | 'lead';
  tags?: string[];
  notes?: string;
  service_history?: any[];
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// Emergency Calls Hook
export const useEmergencyCalls = () => {
  const [calls, setCalls] = useState<EmergencyCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    fetchCalls();

    const subscription = supabase
      .channel('vapi_calls_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vapi_calls' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setCalls(prev => [payload.new as any, ...prev]);
            toast.success("Nouvel appel", `${payload.new.customer_name} - ${payload.new.priority}`);
          } else if (payload.eventType === 'UPDATE') {
            setCalls(prev => prev.map(call => 
              call.id === payload.new.id ? payload.new as any : call
            ));
          } else if (payload.eventType === 'DELETE') {
            setCalls(prev => prev.filter(call => call.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchCalls = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vapi_calls')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCalls(data as any[] || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des appels';
      setError(errorMessage);
      toast.error("Erreur", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const createCall = async (callData: Partial<EmergencyCall>) => {
    try {
      const { data, error } = await supabase
        .from('vapi_calls')
        .insert([{
          call_id: `call_${Date.now()}`,
          customer_name: callData.customer_name || '',
          phone_number: callData.phone_number || '',
          priority: callData.priority || 'normal',
          status: callData.status || 'pending',
          metadata: callData.metadata || {}
        }])
        .select()
        .single();

      if (error) throw error;

      await webhookUtils.triggerN8nWebhook('emergencyCall', data);
      toast.success("Appel créé", "Nouvel appel d'urgence enregistré");

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création';
      toast.error("Erreur", errorMessage);
      return { data: null, error: errorMessage };
    }
  };

  const updateCall = async (id: string, updates: Partial<EmergencyCall>) => {
    try {
      const { data, error } = await supabase
        .from('vapi_calls')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      toast.success("Appel mis à jour", "Modifications enregistrées");

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour';
      toast.error("Erreur", errorMessage);
      return { data: null, error: errorMessage };
    }
  };

  return {
    calls,
    loading,
    error,
    fetchCalls,
    createCall,
    updateCall
  };
};

// Clients Hook
export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data as any[] || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des clients';
      setError(errorMessage);
      toast.error("Erreur", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const createClient = async (clientData: Partial<Client>) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert([{
          name: clientData.name || '',
          phone: clientData.phone || '',
          email: clientData.email,
          address: clientData.address,
          status: clientData.status || 'active',
          tags: clientData.tags || [],
          notes: clientData.notes
        }])
        .select()
        .single();

      if (error) throw error;

      await webhookUtils.triggerN8nWebhook('newClient', data);
      toast.success("Client créé", `${data.name} ajouté avec succès`);

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création';
      toast.error("Erreur", errorMessage);
      return { data: null, error: errorMessage };
    }
  };

  const searchClients = async (query: string) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .or(`name.ilike.%${query}%,phone.ilike.%${query}%,email.ilike.%${query}%`)
        .order('name');

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (err) {
      return { data: [], error: err instanceof Error ? err.message : 'Erreur de recherche' };
    }
  };

  return {
    clients,
    loading,
    error,
    fetchClients,
    createClient,
    searchClients
  };
};