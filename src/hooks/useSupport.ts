import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/useToast';
import { logger } from '@/lib/logger';

interface SupportTicket {
  id: string;
  titre: string;
  statut: 'ouvert' | 'en_cours' | 'resolu';
  priorite: 'urgent' | 'normal' | 'faible';
  description: string;
  created_at: string;
  updated_at: string;
}

interface FAQItem {
  id: string;
  question: string;
  reponse: string;
  category: string;
}

interface ChatMessage {
  type: 'bot' | 'user';
  content: string;
}

export const useSupport = () => {
  const [message, setMessage] = useState("");
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { type: "bot", content: "Bonjour ! Je suis l'assistant Drain Fortin. Comment puis-je vous aider ?" },
  ]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState("");
  const [priority, setPriority] = useState("normal");
  const [detailedMessage, setDetailedMessage] = useState("");
  const { success, error } = useToast();

  const fetchSupportData = useCallback(async () => {
    try {
      setLoading(true);
      // Tables support non configurées - affichage état vide
      setTickets([]);
      setFaqItems([]);
    } catch (err) {
      console.error('Erreur lors du chargement des données support:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSupportData();
  }, [fetchSupportData]);

  const sendMessage = useCallback(async () => {
    if (!message.trim()) return;

    setChatMessages(prev => [...prev,
      { type: "user", content: message },
      { type: "bot", content: "Merci pour votre message. Un agent va vous répondre sous peu. Pour des urgences, utilisez le numéro d'appel direct." }
    ]);
    setMessage("");

    // Tentative de log du message via Supabase
    try {
      await supabase.functions.invoke('support-feedback', {
        body: {
          type: 'chat_message',
          message: message,
          priority: 'normal'
        }
      });
    } catch (err) {
      logger.error('Failed to log support chat message', err as Error);
    }
  }, [message]);

  const submitSupportRequest = useCallback(async () => {
    if (!subject.trim() || !detailedMessage.trim()) {
      error("Champs requis", "Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      // Envoi via edge function support-feedback
      const { error: functionError } = await supabase.functions.invoke('support-feedback', {
        body: {
          type: 'support_request',
          subject: subject,
          message: detailedMessage,
          priority: priority
        }
      });

      if (functionError) throw functionError;

      success("Demande envoyée", "Votre demande de support a été enregistrée");
      setSubject("");
      setDetailedMessage("");
      setPriority("normal");

    } catch (err) {
      console.error('Erreur lors de l\'envoi:', err);
      error("Erreur", "Impossible d'envoyer la demande. Veuillez réessayer.");
    }
  }, [subject, detailedMessage, priority, success, error]);

  const resetForm = useCallback(() => {
    setSubject("");
    setDetailedMessage("");
    setPriority("normal");
  }, []);

  return {
    // State
    message,
    tickets,
    faqItems,
    chatMessages,
    loading,
    subject,
    priority,
    detailedMessage,

    // Actions
    setMessage,
    setSubject,
    setPriority,
    setDetailedMessage,
    sendMessage,
    submitSupportRequest,
    resetForm
  };
};