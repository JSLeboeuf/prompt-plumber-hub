import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/useToast';
import { AutomationService } from '@/services/api';

// Production data interfaces
export interface EmergencyCall {
  id: string;
  call_id: string;
  customer_name: string | null;
  phone_number: string | null;
  status: string;
  priority: string;
  duration: number | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  ended_at: string | null;
}

export interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: string;
  service_history: any[];
  tags: string[] | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  nom: string;
  telephone: string | null;
  email: string | null;
  adresse: string | null;
  service: string | null;
  status: string;
  priorite: string;
  source: string | null;
  assigned_to: string | null;
  notes: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  action: string;
  user_id: string;
  resource_type: string;
  resource_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  metadata: Record<string, any>;
  timestamp: string;
  user_email?: string;
}

// Custom hooks for production data
export function useEmergencyCalls() {
  const [calls, setCalls] = useState<EmergencyCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { success, error: showError } = useToast();

  const fetchCalls = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: supabaseError } = await supabase
        .from('vapi_calls')
        .select('*')
        .order('created_at', { ascending: false });

      if (supabaseError) throw supabaseError;
      setCalls((data || []) as EmergencyCall[]);
    } catch (err: any) {
      console.error('Error fetching calls:', err);
      setError(err.message);
        showError("Erreur de chargement", "Impossible de charger les appels d'urgence");
    } finally {
      setLoading(false);
    }
  };

  const createCall = async (call: Partial<EmergencyCall> & { call_id: string }) => {
    try {
      const { data, error: supabaseError } = await supabase
        .from('vapi_calls')
        .insert([call])
        .select()
        .single();

      if (supabaseError) throw supabaseError;

      setCalls(prev => [data as EmergencyCall, ...prev]);
      
      // Trigger n8n webhook for new call
      try {
        await AutomationService.triggerWorkflow('new-call', {
          callId: data.id,
          priority: data.priority,
          customerName: data.customer_name,
          phoneNumber: data.phone_number
        });
      } catch (webhookError) {
        console.error('Webhook trigger failed:', webhookError);
      }

        success("Appel créé", `Nouvel appel ${data.priority} enregistré`);

      return data;
    } catch (err: any) {
      console.error('Error creating call:', err);
      showError("Erreur de création", err.message);
      throw err;
    }
  };

  const updateCall = async (id: string, updates: Partial<EmergencyCall>) => {
    try {
      const { data, error: supabaseError } = await supabase
        .from('vapi_calls')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (supabaseError) throw supabaseError;

      setCalls(prev => prev.map(call => call.id === id ? { ...call, ...data } as EmergencyCall : call));
      
      success("Appel mis à jour", "Les informations ont été sauvegardées");

      return data;
    } catch (err: any) {
      console.error('Error updating call:', err);
      showError("Erreur de mise à jour", err.message);
      throw err;
    }
  };

  // Real-time subscription
  useEffect(() => {
    fetchCalls();

    const channel = supabase
      .channel('vapi_calls_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'vapi_calls' }, 
        (payload) => {
          console.log('Real-time call update:', payload);
          if (payload.eventType === 'INSERT') {
            setCalls(prev => [payload.new as EmergencyCall, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setCalls(prev => prev.map(call => 
              call.id === payload.new.id ? payload.new as EmergencyCall : call
            ));
          } else if (payload.eventType === 'DELETE') {
            setCalls(prev => prev.filter(call => call.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  return { calls, loading, error, fetchCalls, createCall, updateCall };
}

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { success, error: showError } = useToast();

  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: supabaseError } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (supabaseError) throw supabaseError;
      setClients((data || []) as Client[]);
    } catch (err: any) {
      console.error('Error fetching clients:', err);
      setError(err.message);
      showError("Erreur de chargement", "Impossible de charger les clients");
    } finally {
      setLoading(false);
    }
  };

  const createClient = async (client: Partial<Client> & { name: string }) => {
    try {
      const { data, error: supabaseError } = await supabase
        .from('clients')
        .insert([client])
        .select()
        .single();

      if (supabaseError) throw supabaseError;

      setClients(prev => [data as Client, ...prev]);
      
      // Trigger n8n webhook for new client
      try {
        await AutomationService.triggerWorkflow('new-client', {
          clientId: data.id,
          name: data.name,
          email: data.email,
          phone: data.phone
        });
      } catch (webhookError) {
        console.error('Webhook trigger failed:', webhookError);
      }

      success("Client créé", `Client ${data.name} ajouté avec succès`);

      return data;
    } catch (err: any) {
      console.error('Error creating client:', err);
      showError("Erreur de création", err.message);
      throw err;
    }
  };

  const searchClients = async (query: string) => {
    try {
      const { data, error: supabaseError } = await supabase
        .from('clients')
        .select('*')
        .or(`name.ilike.%${query}%,phone.ilike.%${query}%,email.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (supabaseError) throw supabaseError;
      return data || [];
    } catch (err: any) {
      console.error('Error searching clients:', err);
      showError("Erreur de recherche", err.message);
      return [];
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  return { clients, loading, error, fetchClients, createClient, searchClients };
}

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { success, error: showError } = useToast();

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: supabaseError } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (supabaseError) throw supabaseError;
      setLeads((data || []) as Lead[]);
    } catch (err: any) {
      console.error('Error fetching leads:', err);
      setError(err.message);
      showError("Erreur de chargement", "Impossible de charger les leads");
    } finally {
      setLoading(false);
    }
  };

  const createLead = async (lead: Partial<Lead> & { nom: string }) => {
    try {
      const { data, error: supabaseError } = await supabase
        .from('leads')
        .insert([lead])
        .select()
        .single();

      if (supabaseError) throw supabaseError;

      setLeads(prev => [data as Lead, ...prev]);
      
      success("Lead créé", `Nouveau lead ${data.nom} enregistré`);

      return data;
    } catch (err: any) {
      console.error('Error creating lead:', err);
      showError("Erreur de création", err.message);
      throw err;
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  return { leads, loading, error, fetchLeads, createLead };
}

export function useAnalytics() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { success, error: showError } = useToast();

  const fetchAnalytics = async (period: string = '24h') => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the optimized analytics function
      const { data, error: supabaseError } = await supabase
        .rpc('get_dashboard_metrics_optimized', { time_period: period });

      if (supabaseError) throw supabaseError;
      setAnalytics(data);
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setError(err.message);
      showError("Erreur d'analytiques", "Impossible de charger les métriques");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return { analytics, loading, error, fetchAnalytics };
}

export function useAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { success, error: showError } = useToast();

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: supabaseError } = await supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (supabaseError) throw supabaseError;
      setLogs((data || []) as any[]);
    } catch (err: any) {
      console.error('Error fetching audit logs:', err);
      setError(err.message);
      showError("Erreur de logs", "Impossible de charger les logs d'audit");
      setLogs([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const logAction = async (action: string, resource: string, details: string, metadata: Record<string, any> = {}) => {
    try {
      const { error } = await supabase.rpc('log_audit_action', {
        p_user_id: null, // Will be set by function
        p_action: action,
        p_resource_type: resource,
        p_resource_id: null,
        p_old_values: null,
        p_new_values: { details },
        p_metadata: metadata
      });

      if (error) throw error;
    } catch (err: any) {
      console.error('Error logging action:', err);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  return { logs, loading, error, fetchAuditLogs, logAction };
}