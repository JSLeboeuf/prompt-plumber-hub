import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  }>;
}

interface ToastProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const toastVariants = {
  success: {
    icon: '✅',
    className: 'bg-success border-success/20 text-success-foreground'
  },
  error: {
    icon: '❌', 
    className: 'bg-destructive border-destructive/20 text-destructive-foreground'
  },
  warning: {
    icon: '⚠️',
    className: 'bg-warning border-warning/20 text-warning-foreground'
  },
  info: {
    icon: 'ℹ️',
    className: 'bg-primary border-primary/20 text-primary-foreground'
  }
};

export const ToastComponent: React.FC<ToastProps> = ({ toast, onRemove }) => {
  const variant = toastVariants[toast.type];

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        'relative flex w-full items-start gap-3 rounded-lg border p-4 shadow-lg animate-fade-in',
        'max-w-md backdrop-blur-sm',
        variant.className
      )}
    >
      <div className="text-lg" aria-hidden="true">
        {variant.icon}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="label font-semibold">
          {toast.title}
        </div>
        {toast.message && (
          <div className="body mt-1 opacity-90">
            {toast.message}
          </div>
        )}
        
        {toast.actions && toast.actions.length > 0 && (
          <div className="flex gap-2 mt-3">
            {toast.actions.map((action, index) => (
              <Button
                key={index}
                size="sm"
                variant={action.variant === 'primary' ? 'secondary' : 'outline'}
                onClick={action.onClick}
                className="h-8 px-3 text-xs"
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRemove(toast.id)}
        className="p-1 h-6 w-6 opacity-70 hover:opacity-100"
        aria-label="Fermer la notification"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
};

export const ToastContainer: React.FC<{
  toasts: Toast[];
  onRemove: (id: string) => void;
}> = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;

  return (
    <div 
      className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <ToastComponent
          key={toast.id}
          toast={toast}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
};