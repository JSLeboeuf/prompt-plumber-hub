import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  onClose?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EnhancedToast: React.FC<EnhancedToastProps> = ({
  type,
  title,
  message,
  onClose,
  action
}) => {
  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info
  };

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-900',
    error: 'bg-red-50 border-red-200 text-red-900',
    warning: 'bg-orange-50 border-orange-200 text-orange-900',
    info: 'bg-blue-50 border-blue-200 text-blue-900'
  };

  const iconColors = {
    success: 'text-green-500',
    error: 'text-red-500',
    warning: 'text-orange-500',
    info: 'text-blue-500'
  };

  const Icon = icons[type];

  return (
    <div className={cn(
      "relative flex items-start p-4 border rounded-lg shadow-lg animate-slide-down",
      colors[type]
    )}>
      <Icon className={cn("h-5 w-5 mr-3 mt-0.5 flex-shrink-0", iconColors[type])} />
      
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm">{title}</h4>
        {message && (
          <p className="text-sm opacity-90 mt-1">{message}</p>
        )}
        
        {action && (
          <button
            onClick={action.onClick}
            className="mt-2 text-sm font-medium underline hover:no-underline transition-all"
          >
            {action.label}
          </button>
        )}
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="ml-2 p-1 rounded-full hover:bg-black/5 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};