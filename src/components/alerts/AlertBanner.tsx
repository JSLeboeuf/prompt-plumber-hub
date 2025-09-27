import { useState } from "react";
import { AlertTriangle, CheckCircle, Info, XCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AlertBannerProps {
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  onAction?: () => void;
  actionLabel?: string;
  dismissible?: boolean;
  className?: string;
}

const alertConfig = {
  success: {
    icon: CheckCircle,
    bgClass: "bg-green-50 border-green-200",
    textClass: "text-green-800",
    iconClass: "text-green-600"
  },
  info: {
    icon: Info,
    bgClass: "bg-blue-50 border-blue-200", 
    textClass: "text-blue-800",
    iconClass: "text-blue-600"
  },
  warning: {
    icon: AlertTriangle,
    bgClass: "bg-orange-50 border-orange-200",
    textClass: "text-orange-800", 
    iconClass: "text-orange-600"
  },
  error: {
    icon: XCircle,
    bgClass: "bg-red-50 border-red-200",
    textClass: "text-red-800",
    iconClass: "text-red-600"
  }
};

export const AlertBanner = ({ 
  type, 
  title, 
  message, 
  onAction,
  actionLabel,
  dismissible = true,
  className 
}: AlertBannerProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const config = alertConfig[type];
  const Icon = config.icon;

  if (!isVisible) return null;

  return (
    <div className={cn(
      "border-b p-4 animate-fade-in",
      config.bgClass,
      className
    )}>
      <div className="max-w-7xl mx-auto flex items-start gap-3">
        <Icon className={cn("h-5 w-5 mt-0.5 flex-shrink-0", config.iconClass)} />
        
        <div className="flex-1 min-w-0">
          <div className={cn("label", config.textClass)}>
            {title}
          </div>
          <div className={cn("body mt-1", config.textClass)}>
            {message}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {onAction && actionLabel && (
            <Button
              variant="outline"
              size="sm"
              onClick={onAction}
              className={cn(
                "border-current hover:bg-current hover:text-white",
                config.textClass
              )}
            >
              {actionLabel}
            </Button>
          )}
          
          {dismissible && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className={cn("p-1 h-auto", config.textClass)}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};