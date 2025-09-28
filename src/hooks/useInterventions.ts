import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Intervention {
  id: string;
  title: string;
  client_name: string;
  address: string;
  service_type: string;
  priority: string;
  status: string;
  scheduled_date: string;
  scheduled_time?: string | null;
  assigned_technician?: string | null;
  estimated_price?: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export const useInterventions = () => {
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInterventions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('interventions')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setInterventions(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de chargement';
      setError(errorMessage);
      console.error('Error fetching interventions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createIntervention = useCallback(async (interventionData: any) => {
    try {
      const { error: insertError } = await supabase
        .from('interventions')
        .insert({
          title: interventionData.title || 'Nouvelle intervention',
          client_name: interventionData.client_name || 'Client à assigner',
          address: interventionData.address || 'Adresse à définir',
          service_type: interventionData.service_type || 'general',
          priority: interventionData.priority || 'normal',
          status: interventionData.status || 'planned',
          scheduled_date: interventionData.scheduled_date || new Date().toISOString().split('T')[0],
          description: interventionData.description || 'Nouvelle intervention créée'
        });

      if (insertError) throw insertError;
      await fetchInterventions();
    } catch (err) {
      console.error('Error creating intervention:', err);
      throw err;
    }
  }, [fetchInterventions]);

  const updateIntervention = useCallback(async (id: string, updates: any) => {
    try {
      const { error: updateError } = await supabase
        .from('interventions')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;
      await fetchInterventions();
    } catch (err) {
      console.error('Error updating intervention:', err);
      throw err;
    }
  }, [fetchInterventions]);

  const deleteIntervention = useCallback(async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('interventions')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      await fetchInterventions();
    } catch (err) {
      console.error('Error deleting intervention:', err);
      throw err;
    }
  }, [fetchInterventions]);

  useEffect(() => {
    fetchInterventions();
  }, [fetchInterventions]);

  return {
    interventions,
    loading,
    error,
    createIntervention,
    updateIntervention,
    deleteIntervention
  };
};