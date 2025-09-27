import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Intervention {
  id: string;
  title: string;
  description?: string;
  client_id?: string;
  client_name: string;
  client_phone?: string;
  address: string;
  city?: string;
  postal_code?: string;
  scheduled_date: string;
  scheduled_time?: string;
  estimated_duration?: number;
  estimated_price?: number;
  actual_price?: number;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled' | 'invoiced';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  service_type: string;
  assigned_technician?: string;
  notes?: string;
  equipment_needed?: string[];
  photos?: string[];
  completion_notes?: string;
  customer_signature?: string;
  invoice_sent_at?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

interface InterventionStats {
  planned: number;
  in_progress: number;
  completed: number;
  cancelled: number;
  invoiced: number;
  total: number;
}

export const useInterventions = () => {
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<InterventionStats>({
    planned: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
    invoiced: 0,
    total: 0
  });

  // Fetch interventions
  const fetchInterventions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('interventions')
        .select('id, client_name, status, priority, service_type, scheduled_date, created_at')
        .order('scheduled_date', { ascending: true })
        .order('scheduled_time', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      setInterventions(data as Intervention[] || []);
      
      // Calculate stats
      const newStats: InterventionStats = {
        planned: 0,
        in_progress: 0,
        completed: 0,
        cancelled: 0,
        invoiced: 0,
        total: data?.length || 0
      };

      data?.forEach((intervention) => {
        if (intervention.status in newStats) {
          newStats[intervention.status as keyof Omit<InterventionStats, 'total'>]++;
        }
      });

      setStats(newStats);
    } catch (err) {
      console.error('Erreur fetch interventions:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, []);

  // Create intervention
  const createIntervention = useCallback(async (intervention: Omit<Intervention, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error: createError } = await supabase
        .from('interventions')
        .insert([intervention])
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      // Log audit
      await supabase.rpc('log_audit_action', {
        p_user_id: (await supabase.auth.getUser()).data.user?.id,
        p_action: 'CREATE',
        p_resource_type: 'interventions',
        p_resource_id: data.id,
        p_new_values: data,
        p_metadata: { source: 'useInterventions-hook' }
      });

      // Refresh data
      await fetchInterventions();
      return data;
    } catch (err) {
      console.error('Erreur création intervention:', err);
      throw err;
    }
  }, [fetchInterventions]);

  // Update intervention
  const updateIntervention = useCallback(async (id: string, updates: Partial<Intervention>) => {
    try {
      // Get old values for audit
      const { data: oldData } = await supabase
        .from('interventions')
        .select('id, title, client_name, status, priority, service_type, scheduled_date')
        .eq('id', id)
        .single();

      const { data, error: updateError } = await supabase
        .from('interventions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      // Log audit
      await supabase.rpc('log_audit_action', {
        p_user_id: (await supabase.auth.getUser()).data.user?.id,
        p_action: 'UPDATE',
        p_resource_type: 'interventions',
        p_resource_id: id,
        p_old_values: oldData,
        p_new_values: data,
        p_metadata: { source: 'useInterventions-hook' }
      });

      // Refresh data
      await fetchInterventions();
      return data;
    } catch (err) {
      console.error('Erreur mise à jour intervention:', err);
      throw err;
    }
  }, [fetchInterventions]);

  // Delete intervention
  const deleteIntervention = useCallback(async (id: string) => {
    try {
      // Get old values for audit
      const { data: oldData } = await supabase
        .from('interventions')
        .select('id, title, client_name, address, status')
        .eq('id', id)
        .single();

      const { error: deleteError } = await supabase
        .from('interventions')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      // Log audit
      await supabase.rpc('log_audit_action', {
        p_user_id: (await supabase.auth.getUser()).data.user?.id,
        p_action: 'DELETE',
        p_resource_type: 'interventions',
        p_resource_id: id,
        p_old_values: oldData,
        p_metadata: { source: 'useInterventions-hook' }
      });

      // Refresh data
      await fetchInterventions();
    } catch (err) {
      console.error('Erreur suppression intervention:', err);
      throw err;
    }
  }, [fetchInterventions]);

  // Filter interventions by status
  const getInterventionsByStatus = useCallback((status: Intervention['status']) => {
    return interventions.filter(intervention => intervention.status === status);
  }, [interventions]);

  // Search interventions
  const searchInterventions = useCallback(async (query: string) => {
    if (!query.trim()) {
      return interventions;
    }

    try {
      const { data, error } = await supabase
        .from('interventions')
        .select('id, title, client_name, service_type, address, scheduled_date')
        .or(`title.ilike.%${query}%,client_name.ilike.%${query}%,address.ilike.%${query}%,service_type.ilike.%${query}%`)
        .order('scheduled_date', { ascending: true });

      if (error) {
        throw error;
      }

      return data as Intervention[] || [];
    } catch (err) {
      console.error('Erreur recherche interventions:', err);
      return [];
    }
  }, [interventions]);

  // Real-time subscription
  useEffect(() => {
    fetchInterventions();

    // Subscribe to changes
    const subscription = supabase
      .channel('interventions_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'interventions'
      }, (payload) => {
        console.log('Changement interventions:', payload);
        fetchInterventions();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchInterventions]);

  return {
    interventions,
    loading,
    error,
    stats,
    fetchInterventions,
    createIntervention,
    updateIntervention,
    deleteIntervention,
    getInterventionsByStatus,
    searchInterventions
  };
};