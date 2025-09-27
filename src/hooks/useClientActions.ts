import { useCallback } from "react";
import { useToast } from "@/hooks/useToast";

export function useClientActions() {
  const { success, error } = useToast();

  const callClient = useCallback((phone: string, clientName?: string) => {
    try {
      window.open(`tel:${phone}`);
      success("Appel initié", clientName ? `Appel vers ${clientName}` : `Appel vers ${phone}`);
    } catch (err) {
      error("Erreur", "Impossible d'initier l'appel");
    }
  }, [success, error]);

  const emailClient = useCallback((email: string, clientName?: string) => {
    try {
      window.open(`mailto:${email}`);
      success("Email ouvert", clientName ? `Email vers ${clientName}` : `Email vers ${email}`);
    } catch (err) {
      error("Erreur", "Impossible d'ouvrir l'email");
    }
  }, [success, error]);

  const scheduleIntervention = useCallback((clientId: string, clientName?: string) => {
    success("Intervention planifiée", `Intervention planifiée pour ${clientName || 'le client'}`);
  }, [success]);

  const viewHistory = useCallback((clientId: string, clientName?: string) => {
    success("Historique consulté", `Historique de ${clientName || 'le client'} consulté`);
  }, [success]);

  return {
    callClient,
    emailClient,
    scheduleIntervention,
    viewHistory
  };
}