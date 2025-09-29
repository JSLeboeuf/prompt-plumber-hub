import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import logger from '@/lib/logger';

export interface Intervention {
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
  description?: string | null;
  created_at: string | null;
  updated_at: string | null;
}

const INTERVENTIONS_KEY = ['interventions'] as const;

export const useInterventions = () => {
  const queryClient = useQueryClient();

  const { data: interventions = [], isLoading: loading, error } = useQuery({
    queryKey: INTERVENTIONS_KEY,
    queryFn: async () => {
      const { data, error: fetchError } = await supabase
        .from('interventions')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      return data as Intervention[];
    },
    staleTime: 30000,
    gcTime: 300000,
  });

  const { mutateAsync: createIntervention } = useMutation({
    mutationFn: async (interventionData: Record<string, unknown>) => {
      const payload = {
        title: (interventionData.title as string) || 'Nouvelle intervention',
        client_name: (interventionData.client_name as string) || 'Client à assigner',
        address: (interventionData.address as string) || 'Adresse à définir',
        service_type: (interventionData.service_type as string) || 'general',
        priority: (interventionData.priority as string) || 'normal',
        status: (interventionData.status as string) || 'planned',
        scheduled_date: (interventionData.scheduled_date as string) || new Date().toISOString().split('T')[0],
        ...(interventionData.description !== undefined && { description: interventionData.description }),
      };

      const { error } = await supabase.from('interventions').insert([payload as never]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INTERVENTIONS_KEY });
    },
    onError: (err) => {
      logger.error('Error creating intervention', err instanceof Error ? err : new Error(String(err)));
    },
  });

  const { mutateAsync: updateIntervention } = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Record<string, unknown>> }) => {
      const { error } = await supabase.from('interventions').update(updates as never).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INTERVENTIONS_KEY });
    },
    onError: (err, { id, updates }) => {
      logger.error('Error updating intervention', { error: err instanceof Error ? err : new Error(String(err)), id, updates });
    },
  });

  const { mutateAsync: deleteIntervention } = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('interventions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INTERVENTIONS_KEY });
    },
    onError: (err, id) => {
      logger.error('Error deleting intervention', { error: err instanceof Error ? err : new Error(String(err)), id });
    },
  });

  return {
    interventions,
    loading,
    error: error ? (error instanceof Error ? error.message : 'Erreur de chargement') : null,
    createIntervention,
    updateIntervention: (id: string, updates: Partial<Record<string, unknown>>) => updateIntervention({ id, updates }),
    deleteIntervention,
  };
};
