import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export const PageLayout = ({ 
  title, 
  subtitle, 
  icon: Icon, 
  actions, 
  children, 
  className = "" 
}: PageLayoutProps) => {
  return (
    <div className={`space-y-6 animate-fade-in ${className}`}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="title-xl flex items-center gap-2">
            {Icon && <Icon className="h-8 w-8 text-primary" />}
            {title}
          </h1>
          {subtitle && (
            <p className="subtitle text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>

      {/* Content */}
      {children}
    </div>
  );
};