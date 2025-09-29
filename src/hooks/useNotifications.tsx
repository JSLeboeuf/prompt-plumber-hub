import { useEffect, useCallback, useState } from 'react';
import { logger } from "@/lib/logger";
import { toast } from 'sonner';

interface NotificationOptions {
  enableSound?: boolean;
  enableDesktop?: boolean;
  enableToast?: boolean;
}

interface CallData {
  id: string;
  customerName?: string;
  phoneNumber: string;
  transcript?: string;
  priority: string;
}

interface AlertData {
  length: number;
  severity?: 'critical' | 'warning' | 'info';
  message: string;
}

export function useP1Notifications(options: NotificationOptions = {
  enableSound: true,
  enableDesktop: true,
  enableToast: true
}) {
  const [notifiedCalls, setNotifiedCalls] = useState<Set<string>>(new Set());
  const [permission, setPermission] = useState<NotificationPermission>('default');

  // Demander permission pour notifications desktop
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(perm => {
        setPermission(perm);
      });
    }
  }, []);

  // Jouer son d'alerte
  const playAlertSound = useCallback(() => {
    if (!options.enableSound) return;

    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBCuBzvLZiTYIF2m98OScTgwOUarm7blmFgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
    audio.play().catch(logger.error);
  }, [options.enableSound]);

  // Envoyer notification desktop
  const sendDesktopNotification = useCallback((call: CallData) => {
    if (!options.enableDesktop || permission !== 'granted') return;

    const notification = new Notification('🚨 URGENCE P1 DÉTECTÉE!', {
      body: `Client: ${call.customerName || call.phoneNumber}\nProblème: ${call.transcript?.substring(0, 100) || 'Appel urgent en cours'}`,
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      tag: call.id,
      requireInteraction: true
    });

    notification.onclick = () => {
      window.focus();
      window.location.href = '/real-time';
      notification.close();
    };
  }, [options.enableDesktop, permission]);

  // Envoyer toast notification
  const sendToastNotification = useCallback((call: CallData) => {
    if (!options.enableToast) return;

    toast.error("🚨 URGENCE P1 DÉTECTÉE!", {
      description: `Client: ${call.customerName || 'Inconnu'} - ${call.phoneNumber || 'N/A'}`
    });
  }, [options.enableToast]);

  return {
    playAlertSound,
    sendDesktopNotification,
    sendToastNotification,
    notificationPermission: permission
  };
}

// Hook pour notifications SLA
export function useSLANotifications() {
  const [lastCheck, setLastCheck] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      // Vérifier violations SLA toutes les 5 minutes
      fetch('/api/alerts/sla')
        .then(res => res.json())
        .then((alerts: AlertData[]) => {
          if (alerts.length > 0) {
            toast.warning("⚠️ Violations SLA détectées", {
              description: `${alerts.length} appels dépassent les temps de réponse SLA`
            });
          }
        })
        .catch(logger.error);

      setLastCheck(Date.now());
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  return { lastCheck };
}

// Hook pour notifications contraintes
export function useConstraintNotifications() {
  useEffect(() => {
    const interval = setInterval(() => {
      // Vérifier violations contraintes toutes les 10 minutes
      fetch('/api/alerts/constraints')
        .then(res => res.json())
        .then((alerts: AlertData[]) => {
          alerts.forEach((alert: AlertData) => {
            if (alert.severity === 'critical') {
              toast.error("🚫 Contrainte critique violée", {
                description: alert.message
              });
            }
          });
        })
        .catch(logger.error);
    }, 600000); // 10 minutes

    return () => clearInterval(interval);
  }, []);
}