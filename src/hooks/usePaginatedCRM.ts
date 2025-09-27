import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/useToast';

interface Client {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  status: string;
  created_at: string;
  address?: string;
  service_history?: any[];
  tags?: string[];
}

interface Lead {
  id: string;
  nom: string;
  status: string;
}

const PAGE_SIZE = 20;

export function usePaginatedCRM() {
  const [clients, setClients] = useState<Client[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const { success, error: showError } = useToast();

  const loadClients = useCallback(async (pageNum: number = 0, append: boolean = false) => {
    try {
      if (!append) setLoading(true);
      else setLoadingMore(true);

      const from = pageNum * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      // Optimized query with only needed columns
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, phone, email, status, created_at, address')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const newClients = (data || []).map(client => ({
        ...client,
        service_history: [],
        tags: []
      })) as Client[];

      if (append) {
        setClients(prev => [...prev, ...newClients]);
      } else {
        setClients(newClients);
      }

      setHasMore(newClients.length === PAGE_SIZE);

    } catch (error: any) {
      console.error('Error loading clients:', error);
      showError("Erreur", "Impossible de charger les clients");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [showError]);

  const loadLeads = useCallback(async () => {
    try {
      // Just get summary for leads
      const { data, error } = await supabase
        .from('leads')
        .select('id, nom, status')
        .limit(10);

      if (error) throw error;
      setLeads(data || []);

    } catch (error: any) {
      console.error('Error loading leads:', error);
    }
  }, []);

  const createClient = useCallback(async (clientData: Partial<Client>) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert([{
          name: clientData.name || 'Nouveau Client',
          status: clientData.status || 'lead',
          ...clientData
        }])
        .select('id, name, phone, email, status, created_at, address')
        .single();

      if (error) throw error;

      const newClient = {
        ...data,
        service_history: [],
        tags: []
      } as Client;

      setClients(prev => [newClient, ...prev]);
      success("Client créé", `${data.name} ajouté avec succès`);

      return newClient;

    } catch (error: any) {
      showError("Erreur", error.message);
      throw error;
    }
  }, [success, showError]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadClients(nextPage, true);
    }
  }, [page, loadingMore, hasMore, loadClients]);

  const refresh = useCallback(() => {
    setPage(0);
    loadClients(0, false);
  }, [loadClients]);

  // Initial load
  useEffect(() => {
    Promise.all([
      loadClients(0, false),
      loadLeads()
    ]);
  }, [loadClients, loadLeads]);

  // Computed values
  const activeClients = clients.filter(c => c.status === 'active');
  const newLeads = leads.filter(l => l.status === 'nouveau' || l.status === 'en_cours');

  return {
    clients,
    leads,
    activeClients,
    newLeads,
    loading,
    loadingMore,
    hasMore,
    createClient,
    loadMore,
    refresh
  };
}