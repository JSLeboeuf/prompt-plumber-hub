import { useEffect, useCallback, useState } from 'react';
import { logger } from "@/lib/logger";
import { toast } from '@/components/ui/sonner';
// Icons removed - not used in current implementation
import { useWebSocket } from './useWebSocket';

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
  const { activeCalls } = useWebSocket();
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
      requireInteraction: true,
      vibrate: [200, 100, 200, 100, 200]
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

    toast({
      title: "🚨 URGENCE P1 DÉTECTÉE!",
      description: (
        <div className="space-y-2">
          <p className="font-medium">{call.customerName || call.phoneNumber}</p>
          <p className="text-sm">{call.transcript?.substring(0, 100) || 'Appel urgent en cours'}</p>
          <div className="flex gap-2 mt-2">
            <button
              className="px-3 py-1 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
              onClick={() => window.location.href = '/real-time'}
            >
              Voir maintenant
            </button>
            <button
              className="px-3 py-1 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-700"
              onClick={() => window.open(`tel:${call.phoneNumber}`)}
            >
              Appeler client
            </button>
          </div>
        </div>
      ),
      duration: 10000,
      className: "border-red-500 bg-red-50 animate-pulse-urgent"
    });
  }, [options.enableToast]);

  // Surveiller les appels P1
  useEffect(() => {
    const p1Calls = activeCalls.filter((call: CallData) => call.priority === 'P1');

    p1Calls.forEach((call: CallData) => {
      if (!notifiedCalls.has(call.id)) {
        // Nouvelle urgence P1 détectée!
        playAlertSound();
        sendDesktopNotification(call);
        sendToastNotification(call);

        setNotifiedCalls(prev => new Set(prev).add(call.id));
      }
    });

    // Nettoyer les appels terminés
    const activeIds = new Set(activeCalls.map((c: CallData) => c.id));
    setNotifiedCalls(prev => {
      const newSet = new Set<string>();
      prev.forEach(id => {
        if (activeIds.has(id)) newSet.add(id);
      });
      return newSet;
    });
  }, [activeCalls, notifiedCalls, playAlertSound, sendDesktopNotification, sendToastNotification]);

  return {
    p1Count: activeCalls.filter((c: CallData) => c.priority === 'P1').length,
    hasP1Active: activeCalls.some((c: CallData) => c.priority === 'P1'),
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
            toast({
              title: "⚠️ Violations SLA détectées",
              description: `${alerts.length} appels dépassent les temps de réponse SLA`,
              duration: 5000,
              className: "border-yellow-500 bg-yellow-50"
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
              toast({
                title: "🚫 Contrainte critique violée",
                description: alert.message,
                duration: 7000,
                className: "border-orange-500 bg-orange-50"
              });
            }
          });
        })
        .catch(logger.error);
    }, 600000); // 10 minutes

    return () => clearInterval(interval);
  }, []);
}