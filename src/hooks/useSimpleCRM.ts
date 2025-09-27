import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/useToast';

interface SimpleClient {
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

interface SimpleLead {
  id: string;
  nom: string;
  status: string;
}

// Cache with 30 second duration
const CACHE_DURATION = 30000;
let clientsCache: { data: SimpleClient[]; timestamp: number } | null = null;

export function useSimpleCRM() {
  const [clients, setClients] = useState<SimpleClient[]>([]);
  const [leads, setLeads] = useState<SimpleLead[]>([]);
  const [loading, setLoading] = useState(true);
  const { success, error: showError } = useToast();

  const loadCRMData = async () => {
    try {
      const now = Date.now();
      
      // Check cache first
      if (clientsCache && (now - clientsCache.timestamp) < CACHE_DURATION) {
        setClients(clientsCache.data);
        setLoading(false);
        return;
      }

      setLoading(true);

      // Optimized parallel queries
      const [clientsResponse, leadsResponse] = await Promise.all([
        supabase
          .from('clients')
          .select('id, name, phone, email, status, created_at, address, service_history, tags')
          .order('created_at', { ascending: false })
          .limit(50), // Limit initial load
        
        supabase
          .from('leads')
          .select('id, nom, status')
          .limit(20) // Just for summary
      ]);

      if (clientsResponse.error) throw clientsResponse.error;
      if (leadsResponse.error) throw leadsResponse.error;

      const clientsData = (clientsResponse.data || []).map(client => ({
        ...client,
        service_history: Array.isArray(client.service_history) ? client.service_history : [],
        tags: Array.isArray(client.tags) ? client.tags : []
      })) as SimpleClient[];
      const leadsData = leadsResponse.data || [];

      setClients(clientsData);
      setLeads(leadsData);

      // Update cache
      clientsCache = { data: clientsData, timestamp: now };

    } catch (error: any) {
      console.error('CRM loading error:', error);
      showError("Erreur", "Impossible de charger les données CRM");
    } finally {
      setLoading(false);
    }
  };

  const createClient = async (clientData: Partial<SimpleClient>) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert([{
          name: clientData.name || 'Nouveau Client',
          status: clientData.status || 'lead',
          ...clientData
        }])
        .select('id, name, phone, email, status, created_at, address, service_history, tags')
        .single();

      if (error) throw error;

      // Update state immediately
      const newClient = {
        ...data,
        service_history: Array.isArray(data.service_history) ? data.service_history : [],
        tags: Array.isArray(data.tags) ? data.tags : []
      } as SimpleClient;
      
      setClients(prev => [newClient, ...prev]);
      
      // Invalidate cache
      clientsCache = null;

      success("Client créé", `${data.name} ajouté avec succès`);
      return newClient;

    } catch (error: any) {
      showError("Erreur", error.message);
      throw error;
    }
  };

  useEffect(() => {
    loadCRMData();
  }, []);

  // Computed values
  const activeClients = clients.filter(c => c.status === 'active');
  const newLeads = leads.filter(l => l.status === 'nouveau' || l.status === 'en_cours');

  return {
    clients,
    leads,
    activeClients,
    newLeads,
    loading,
    createClient,
    refresh: loadCRMData
  };
}