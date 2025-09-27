import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeProps {
  table: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  onUpdate?: (payload: any) => void;
}

export function useRealtime({ table, event = '*', filter, onUpdate }: UseRealtimeProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    // Configuration du channel realtime
    const channelName = `${table}-changes-${Date.now()}`;
    const realtimeChannel = supabase.channel(channelName);

    // Configuration de l'écoute des changements
    const config: any = {
      event,
      schema: 'public',
      table
    };

    if (filter) {
      config.filter = filter;
    }

    realtimeChannel
      .on('postgres_changes', config, (payload) => {
        onUpdate?.(payload);
      })
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    setChannel(realtimeChannel);

    return () => {
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
      setChannel(null);
      setIsConnected(false);
    };
  }, [table, event, filter, onUpdate]);

  return { isConnected, channel };
}

// Hook spécialisé pour les interventions en temps réel
export function useInterventionsRealtime(onUpdate?: (payload: any) => void) {
  return useRealtime({
    table: 'interventions',
    onUpdate
  });
}

// Hook spécialisé pour les appels VAPI
export function useVapiCallsRealtime(onUpdate?: (payload: any) => void) {
  return useRealtime({
    table: 'vapi_calls',
    onUpdate
  });
}

// Hook spécialisé pour les tickets support
export function useSupportTicketsRealtime(onUpdate?: (payload: any) => void) {
  return useRealtime({
    table: 'support_tickets',
    onUpdate
  });
}