import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SupportTicket {
  id: string;
  ticket_number: string;
  client_id?: string;
  client_name: string;
  client_phone?: string;
  client_email?: string;
  subject: string;
  description: string;
  category: 'general' | 'technical' | 'billing' | 'urgent' | 'feedback';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed';
  assigned_to?: string;
  resolution?: string;
  satisfaction_rating?: number;
  feedback?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  closed_at?: string;
  metadata?: Record<string, any>;
}

interface TicketStats {
  open: number;
  in_progress: number;
  pending: number;
  resolved: number;
  closed: number;
  total: number;
  urgent: number;
}

export const useSupportTickets = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<TicketStats>({
    open: 0,
    in_progress: 0,
    pending: 0,
    resolved: 0,
    closed: 0,
    total: 0,
    urgent: 0
  });

  // Fetch tickets
  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('support_tickets')
        .select('id, ticket_number, client_name, subject, status, priority, created_at, category')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setTickets(data as SupportTicket[] || []);
      
      // Calculate stats
      const newStats: TicketStats = {
        open: 0,
        in_progress: 0,
        pending: 0,
        resolved: 0,
        closed: 0,
        total: data?.length || 0,
        urgent: 0
      };

      data?.forEach((ticket) => {
        if (ticket.status in newStats) {
          newStats[ticket.status as keyof Omit<TicketStats, 'total' | 'urgent'>]++;
        }
        if (ticket.priority === 'urgent') {
          newStats.urgent++;
        }
      });

      setStats(newStats);
    } catch (err) {
      console.error('Erreur fetch tickets:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, []);

  // Create ticket
  const createTicket = useCallback(async (ticket: Omit<SupportTicket, 'id' | 'ticket_number' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error: createError } = await supabase
        .from('support_tickets')
        .insert([ticket])
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      // Log audit
      await supabase.rpc('log_audit_action', {
        p_user_id: (await supabase.auth.getUser()).data.user?.id,
        p_action: 'CREATE',
        p_resource_type: 'support_tickets',
        p_resource_id: data.id,
        p_new_values: data,
        p_metadata: { source: 'useSupportTickets-hook' }
      });

      // Refresh data
      await fetchTickets();
      return data;
    } catch (err) {
      console.error('Erreur création ticket:', err);
      throw err;
    }
  }, [fetchTickets]);

  // Update ticket
  const updateTicket = useCallback(async (id: string, updates: Partial<SupportTicket>) => {
    try {
      // Get old values for audit
      const { data: oldData } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('id', id)
        .single();

      // Auto-set timestamps based on status changes
      const timestampUpdates: Record<string, any> = {};
      if (updates.status === 'resolved' && oldData?.status !== 'resolved') {
        timestampUpdates.resolved_at = new Date().toISOString();
      }
      if (updates.status === 'closed' && oldData?.status !== 'closed') {
        timestampUpdates.closed_at = new Date().toISOString();
      }

      const { data, error: updateError } = await supabase
        .from('support_tickets')
        .update({ ...updates, ...timestampUpdates })
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
        p_resource_type: 'support_tickets',
        p_resource_id: id,
        p_old_values: oldData,
        p_new_values: data,
        p_metadata: { source: 'useSupportTickets-hook' }
      });

      // Refresh data
      await fetchTickets();
      return data;
    } catch (err) {
      console.error('Erreur mise à jour ticket:', err);
      throw err;
    }
  }, [fetchTickets]);

  // Delete ticket
  const deleteTicket = useCallback(async (id: string) => {
    try {
      // Get old values for audit
      const { data: oldData } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('id', id)
        .single();

      const { error: deleteError } = await supabase
        .from('support_tickets')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      // Log audit
      await supabase.rpc('log_audit_action', {
        p_user_id: (await supabase.auth.getUser()).data.user?.id,
        p_action: 'DELETE',
        p_resource_type: 'support_tickets',
        p_resource_id: id,
        p_old_values: oldData,
        p_metadata: { source: 'useSupportTickets-hook' }
      });

      // Refresh data
      await fetchTickets();
    } catch (err) {
      console.error('Erreur suppression ticket:', err);
      throw err;
    }
  }, [fetchTickets]);

  // Filter tickets by status
  const getTicketsByStatus = useCallback((status: SupportTicket['status']) => {
    return tickets.filter(ticket => ticket.status === status);
  }, [tickets]);

  // Filter tickets by priority
  const getTicketsByPriority = useCallback((priority: SupportTicket['priority']) => {
    return tickets.filter(ticket => ticket.priority === priority);
  }, [tickets]);

  // Search tickets
  const searchTickets = useCallback(async (query: string) => {
    if (!query.trim()) {
      return tickets;
    }

    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .or(`subject.ilike.%${query}%,description.ilike.%${query}%,client_name.ilike.%${query}%,ticket_number.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data as SupportTicket[] || [];
    } catch (err) {
      console.error('Erreur recherche tickets:', err);
      return [];
    }
  }, [tickets]);

  // Submit feedback via Edge Function
  const submitSupportRequest = useCallback(async (request: {
    client_name: string;
    client_phone?: string;
    client_email?: string;
    subject: string;
    description: string;
    category?: string;
    priority?: string;
  }) => {
    try {
      const { data, error } = await supabase.functions.invoke('support-feedback', {
        body: request
      });

      if (error) {
        throw error;
      }

      // Refresh tickets after submission
      await fetchTickets();
      return data;
    } catch (err) {
      console.error('Erreur soumission support:', err);
      throw err;
    }
  }, [fetchTickets]);

  // Real-time subscription
  useEffect(() => {
    fetchTickets();

    // Subscribe to changes
    const subscription = supabase
      .channel('support_tickets_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'support_tickets'
      }, (payload) => {
        fetchTickets();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchTickets]);

  return {
    tickets,
    loading,
    error,
    stats,
    fetchTickets,
    createTicket,
    updateTicket,
    deleteTicket,
    getTicketsByStatus,
    getTicketsByPriority,
    searchTickets,
    submitSupportRequest
  };
};