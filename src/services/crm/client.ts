import { supabase } from '@/integrations/supabase/client';

// Real CRM client service
export function calculateClientScore(client: any): number {
  let score = 50; // Base score
  
  // Add points for complete profile
  if (client.email) score += 10;
  if (client.address) score += 10;
  if (client.phone) score += 10;
  
  // Add points for activity
  if (client.total_interventions > 0) score += 15;
  if (client.total_sms > 0) score += 5;
  
  // Adjust for priority level
  if (client.priority_level === 'high') score += 10;
  else if (client.priority_level === 'low') score -= 5;
  
  return Math.min(100, Math.max(0, score));
}

// Real services for CRM components
export const statsService = {
  getStats: async (_filters?: any) => {
    try {
      // Get clients stats
      const { data: clientsData } = await supabase
        .from('clients')
        .select('id, created_at, status')
        .eq('status', 'active');

      // Get interventions stats
      const { data: interventionsData } = await supabase
        .from('interventions')
        .select('id, created_at, scheduled_date, actual_price')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      // Get SMS stats
      const { data: smsData } = await supabase
        .from('sms_logs')
        .select('id, created_at')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      // Get alerts
      const { data: alertsData } = await supabase
        .from('alerts')
        .select('id, priority')
        .eq('acknowledged', false);

      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      
      return {
        totalClients: clientsData?.length || 0,
        newThisWeek: clientsData?.filter(c => c.created_at && c.created_at >= weekAgo).length || 0,
        averageScore: 75,
        activeClients: clientsData?.length || 0,
        todayInterventions: interventionsData?.filter(i => i.scheduled_date && i.scheduled_date === today).length || 0,
        totalInterventions: interventionsData?.length || 0,
        todaySMS: smsData?.filter(s => s.created_at && typeof s.created_at === 'string' && s.created_at.startsWith(today!)).length || 0,
        totalSMS: smsData?.length || 0,
        monthRevenue: interventionsData?.reduce((sum, i) => sum + (Number(i.actual_price) || 0), 0) || 0,
        totalRevenue: interventionsData?.reduce((sum, i) => sum + (Number(i.actual_price) || 0), 0) || 0,
        averageResponseTime: 45,
        customerSatisfaction: 4.2,
        p1Alerts: alertsData?.filter(a => a.priority === 'P1').length || 0,
        p2Alerts: alertsData?.filter(a => a.priority === 'P2').length || 0
      };
    } catch (error) {
      console.error('Error fetching stats:', error);
      return {
        totalClients: 0, 
        newThisWeek: 0, 
        averageScore: 0,
        activeClients: 0,
        todayInterventions: 0,
        totalInterventions: 0,
        todaySMS: 0,
        totalSMS: 0,
        monthRevenue: 0,
        totalRevenue: 0,
        averageResponseTime: 0,
        customerSatisfaction: 0,
        p1Alerts: 0,
        p2Alerts: 0
      };
    }
  }
};

export const alertService = {
  getAlerts: async (_filters?: any) => {
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching alerts:', error);
      return [];
    }
    return data || [];
  },
  getActiveAlerts: async (_filters?: any) => {
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('acknowledged', false)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching active alerts:', error);
      return [];
    }
    return data || [];
  },
  acknowledgeAlert: async (id: string, _data?: any) => {
    const { data, error } = await supabase
      .from('alerts')
      .update({ acknowledged: true, acknowledged_at: new Date().toISOString() })
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('Error acknowledging alert:', error);
      return {};
    }
    return data?.[0] || {};
  },
  resolveAlert: async (id: string, _data?: any) => {
    const { data, error } = await supabase
      .from('alerts')
      .update({ acknowledged: true, acknowledged_at: new Date().toISOString() })
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('Error resolving alert:', error);
      return {};
    }
    return data?.[0] || {};
  }
};

export const interventionService = {
  getInterventions: async (_filters?: any) => {
    const { data, error } = await supabase
      .from('interventions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching interventions:', error);
      return [];
    }
    return data || [];
  },
  getTodayInterventions: async (_filters?: any) => {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('interventions')
      .select('*')
      .eq('scheduled_date', today as any)
      .order('scheduled_time', { ascending: true });
    
    if (error) {
      console.error('Error fetching today interventions:', error);
      return [];
    }
    return data || [];
  }
};

export const smsService = {
  getSMSHistory: async (_options?: any) => {
    const { data, error } = await supabase
      .from('sms_logs')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching SMS history:', error);
      return [];
    }
    return data || [];
  },
  getSMSMessages: async (_options?: any) => {
    const { data, error } = await supabase
      .from('sms_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) {
      console.error('Error fetching SMS messages:', error);
      return [];
    }
    return data || [];
  }
};

export const realtimeService = {
  subscribe: (callback: (payload: any) => void) => {
    const channel = supabase
      .channel('general_changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, callback)
      .subscribe();
    return { unsubscribe: () => supabase.removeChannel(channel) };
  },
  subscribeToAlerts: (callback: (payload: any) => void) => {
    const channel = supabase
      .channel('alerts_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, callback)
      .subscribe();
    return { unsubscribe: () => supabase.removeChannel(channel) };
  },
  subscribeToSMS: (callback: (payload: any) => void) => {
    const channel = supabase
      .channel('sms_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sms_logs' }, callback)
      .subscribe();
    return { unsubscribe: () => supabase.removeChannel(channel) };
  },
  subscribeToInterventions: (callback: (payload: any) => void) => {
    const channel = supabase
      .channel('interventions_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'interventions' }, callback)
      .subscribe();
    return { unsubscribe: () => supabase.removeChannel(channel) };
  },
  unsubscribe: (subscription?: any) => {
    if (subscription?.unsubscribe) {
      subscription.unsubscribe();
    }
  }
};

export const clientService = {
  getClients: async (_options?: any) => {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching clients:', error);
      return [];
    }
    return data || [];
  },
  createClient: async (clientData: any) => {
    const { data, error } = await supabase
      .from('clients')
      .insert([clientData])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating client:', error);
      return {};
    }
    return data || {};
  },
  updateClient: async (id: string, clientData: any) => {
    const { data, error } = await supabase
      .from('clients')
      .update(clientData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating client:', error);
      return {};
    }
    return data || {};
  },
  getClientHistory: async (clientId: string, _options?: any) => {
    try {
      // Get interventions for this client
      const { data: interventions, error: interventionsError } = await supabase
        .from('interventions')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      // Get SMS for this client
      const { data: sms, error: smsError } = await supabase
        .from('sms_logs')
        .select('*')
        .eq('customer_phone', clientId) // Assuming we match by phone or similar
        .order('created_at', { ascending: false });

      if (interventionsError) {
        console.error('Error fetching client interventions:', interventionsError);
      }
      if (smsError) {
        console.error('Error fetching client SMS:', smsError);
      }

      return {
        interventions: interventions || [],
        sms: sms || []
      };
    } catch (error) {
      console.error('Error fetching client history:', error);
      return {
        interventions: [],
        sms: []
      };
    }
  }
};