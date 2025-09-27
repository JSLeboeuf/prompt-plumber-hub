import { useState, useCallback } from 'react';
import type { Toast } from '@/components/ui/custom-toast';

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = {
      id,
      duration: 5000, // Default 5 seconds
      ...toast
    };

    setToasts(prev => [...prev, newToast]);

    // Auto remove after duration (unless persistent)
    if (!newToast.persistent && newToast.duration) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods
  const success = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    addToast({ type: 'success', title, message, ...options });
  }, [addToast]);

  const error = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    addToast({ type: 'error', title, message, persistent: true, ...options });
  }, [addToast]);

  const warning = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    addToast({ type: 'warning', title, message, ...options });
  }, [addToast]);

  const info = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    addToast({ type: 'info', title, message, ...options });
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    clearAll,
    success,
    error,
    warning,
    info
  };
};

// Toast notification component data
export const toastConfig = {
  success: {
    icon: '✅',
    bgClass: 'bg-success border-success/20',
    textClass: 'text-success-foreground',
    iconClass: 'text-success-foreground'
  },
  error: {
    icon: '❌',
    bgClass: 'bg-destructive border-destructive/20',
    textClass: 'text-destructive-foreground',
    iconClass: 'text-destructive-foreground'
  },
  warning: {
    icon: '⚠️',
    bgClass: 'bg-warning border-warning/20',
    textClass: 'text-warning-foreground',
    iconClass: 'text-warning-foreground'
  },
  info: {
    icon: 'ℹ️',
    bgClass: 'bg-primary border-primary/20',
    textClass: 'text-primary-foreground',
    iconClass: 'text-primary-foreground'
  }
};