import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import logger from '@/lib/logger';

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
      const normalizedError = err instanceof Error ? err : new Error(String(err));
      logger.error('Error fetching interventions', normalizedError);
    } finally {
      setLoading(false);
    }
  }, []);

  const createIntervention = useCallback(async (interventionData: Record<string, unknown>) => {
    try {
      const { error: insertError } = await supabase
        .from('interventions')
        .insert({
          title: (interventionData.title as string) || 'Nouvelle intervention',
          client_name: (interventionData.client_name as string) || 'Client à assigner',
          address: (interventionData.address as string) || 'Adresse à définir',
          service_type: (interventionData.service_type as string) || 'general',
          priority: (interventionData.priority as string) || 'normal',
          status: (interventionData.status as string) || 'planned',
          scheduled_date: (interventionData.scheduled_date as string) || new Date().toISOString().split('T')[0],
          description: (interventionData.description as string) || 'Nouvelle intervention créée'
        });

      if (insertError) throw insertError;
      await fetchInterventions();
    } catch (err) {
      const normalizedError = err instanceof Error ? err : new Error(String(err));
      logger.error('Error creating intervention', normalizedError);
      throw err;
    }
  }, [fetchInterventions]);

  const updateIntervention = useCallback(async (id: string, updates: Record<string, unknown>) => {
    try {
      const { error: updateError } = await supabase
        .from('interventions')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;
      await fetchInterventions();
    } catch (err) {
      const normalizedError = err instanceof Error ? err : new Error(String(err));
      logger.error('Error updating intervention', { error: normalizedError, id, updates });
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
      const normalizedError = err instanceof Error ? err : new Error(String(err));
      logger.error('Error deleting intervention', { error: normalizedError, id });
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
