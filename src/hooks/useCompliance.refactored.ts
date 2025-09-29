import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import logger from '@/lib/logger';
import { UIGdprRequest, DatabaseGdprRequest } from '@/types/database.types';
import { SafeError } from '@/types/utils.types';

// Transform database type to UI type
function transformGdprRequest(dbRequest: DatabaseGdprRequest): UIGdprRequest {
  return {
    ...dbRequest,
    type: dbRequest.request_type,
  };
}

export function useCompliance() {
  const [gdprRequests, setGdprRequests] = useState<UIGdprRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGdprRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('gdpr_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform database records to UI format
      const transformedRequests = (data || []).map(transformGdprRequest);
      setGdprRequests(transformedRequests);
    } catch (error) {
      const safeError: SafeError = error instanceof Error ? error : { message: 'Unknown error occurred' };
      logger.error('Failed to fetch GDPR requests', safeError);
      toast.error('Erreur lors du chargement des demandes GDPR');
    } finally {
      setLoading(false);
    }
  };

  const createGdprRequest = async (requestData: {
    email: string;
    request_type: string;
    justification?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('gdpr_requests')
        .insert({
          ...requestData,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      const transformedRequest = transformGdprRequest(data);
      setGdprRequests(prev => [transformedRequest, ...prev]);
      toast.success('Demande GDPR créée avec succès');
      
      return { success: true, data: transformedRequest };
    } catch (error) {
      const safeError: SafeError = error instanceof Error ? error : { message: 'Unknown error occurred' };
      logger.error('Failed to create GDPR request', safeError);
      toast.error('Erreur lors de la création de la demande');
      return { success: false, error: safeError };
    }
  };

  useEffect(() => {
    fetchGdprRequests();
  }, []);

  return {
    gdprRequests,
    loading,
    createGdprRequest,
    refetch: fetchGdprRequests,
  };
}