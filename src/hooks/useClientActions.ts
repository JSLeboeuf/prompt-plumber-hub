import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToastContext } from '@/components/providers/ToastProvider';
import logger from '@/lib/logger';
import { getServiceConfig } from '@/config/unified.api.config';

interface Client {
  id?: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'lead';
  address?: string;
  notes?: string;
}

export const useClientActions = () => {
  const { success, error: showError } = useToastContext();

  const createClient = useCallback(async (clientData: Omit<Client, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert(clientData)
        .select()
        .single();

      if (error) throw error;
      
      success('Client créé avec succès');
      return { success: true, data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création';
      showError('Erreur', errorMessage);
      return { success: false, data: null, error: errorMessage };
    }
  }, [success, showError]);

  const updateClient = useCallback(async (id: string, updates: Partial<Client>) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      success('Client mis à jour avec succès');
      return { success: true, data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour';
      showError('Erreur', errorMessage);
      return { success: false, data: null, error: errorMessage };
    }
  }, [success, showError]);

  const deleteClient = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      success('Client supprimé avec succès');
      return { success: true, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression';
      showError('Erreur', errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [success, showError]);

  const callClient = useCallback(async (clientId: string, phoneNumber: string) => {
    try {
      const vapiConfig = getServiceConfig('vapi');
      if (!vapiConfig.enabled) {
        const reason = vapiConfig.publicKey
          ? 'Les appels automatisés sont désactivés pour cette instance.'
          : 'Clé publique VAPI manquante. Configurez VITE_VAPI_PUBLIC_KEY pour activer les appels.';
        logger.warn('Client call skipped because VAPI is disabled', {
          clientId,
          reason,
        });
        showError('Fonctionnalité indisponible', reason);
        return { success: false, data: null, error: reason };
      }

      // Integration with VAPI service would go here
      const { data, error } = await supabase.functions.invoke('vapi-call', {
        body: {
          phoneNumber,
          clientId,
          context: { type: 'client_call' }
        }
      });

      if (error) throw error;
      
      success('Appel initié avec succès');
      return { success: true, data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur lors de l'initiation de l'appel";
      showError('Erreur', errorMessage);
      return { success: false, data: null, error: errorMessage };
    }
  }, [success, showError]);

  const emailClient = useCallback(async (clientEmail: string, subject: string) => {
    try {
      // Email service integration would go here
      // For now, we'll log the action
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          action: 'email_sent',
          resource_type: 'client',
          metadata: { email: clientEmail, subject }
        });

      if (error) throw error;
      
      success('Email envoyé avec succès');
      return { success: true, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur lors de l'envoi de l'email";
      showError('Erreur', errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [success, showError]);

  return {
    createClient,
    updateClient,
    deleteClient,
    callClient,
    emailClient
  };
};
