import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToastContext } from '@/components/providers/ToastProvider';
import logger from '@/lib/logger';

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
  address?: string | null;
  notes?: string | null;
}

interface Lead {
  id: string;
  nom: string;
  telephone?: string | null;
  email?: string | null;
  status: string | null;
  created_at: string | null;
}

interface Filters {
  status?: string;
  dateRange?: { start: Date; end: Date };
}

export const usePaginatedCRM = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Filters>({});
  const [sortBy, setSortBy] = useState<'name' | 'created_at' | 'status'>('name');
  
  const { error: showError } = useToastContext();

  const fetchClients = useCallback(async (page = 1, append = false) => {
    if (!append) setLoading(true);
    else setLoadingMore(true);
    
    try {
      let query = supabase
        .from('clients')
        .select('*', { count: 'exact' });

      // Apply filters
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
      }
      
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      // Apply sorting
      query = query.order(sortBy, { ascending: sortBy === 'name' });

      // Apply pagination
      const from = (page - 1) * 20;
      query = query.range(from, from + 19);

      const { data, error, count } = await query;

      if (error) throw error;

      if (append && data) {
        setClients(prev => [...prev, ...data]);
      } else if (data) {
        setClients(data);
      }
      
      setTotalCount(count || 0);
      setCurrentPage(page);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des clients';
      setError(errorMessage);
      showError('Erreur', errorMessage);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [searchTerm, filters, sortBy, showError]);

  const fetchLeads = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .in('status', ['nouveau', 'en_cours'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setLeads(data || []);
    } catch (err) {
      const normalizedError = err instanceof Error ? err : new Error(String(err));
      logger.error('Error fetching leads', normalizedError);
    }
  }, []);

  const createClient = useCallback(async (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('clients')
        .insert(clientData)
        .select()
        .single();

      if (error) throw error;
      
      // Refresh the list
      await fetchClients(1, false);
      return { success: true, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création du client';
      setError(errorMessage);
      showError('Erreur', errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [fetchClients, showError]);

  const loadMore = useCallback(() => {
    const nextPage = currentPage + 1;
    const maxPage = Math.ceil(totalCount / 20);
    if (nextPage <= maxPage) {
      fetchClients(nextPage, true);
    }
  }, [currentPage, totalCount, fetchClients]);

  useEffect(() => {
    fetchClients(1, false);
    fetchLeads();
  }, [searchTerm, filters, sortBy]);

  const hasMore = currentPage < Math.ceil(totalCount / 20);
  const activeClients = clients.filter(client => client.status === 'active');
  const newLeads = leads.filter(lead => lead.status === 'nouveau');

  return {
    clients,
    leads,
    loading,
    loadingMore,
    error,
    totalCount,
    currentPage,
    hasMore,
    loadMore,
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    sortBy,
    setSortBy,
    createClient,
    activeClients,
    newLeads,
    fetchClients,
    fetchLeads
  };
};
