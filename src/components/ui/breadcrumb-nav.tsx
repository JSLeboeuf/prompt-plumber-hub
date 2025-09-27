import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface BreadcrumbNavProps {
  items?: BreadcrumbItem[];
  className?: string;
}

export const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({ 
  items: customItems, 
  className 
}) => {
  const location = useLocation();
  
  // Auto-generate breadcrumbs from current path if no custom items provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Dashboard', href: '/dashboard', icon: Home }
    ];

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      if (segment !== 'dashboard') {
        const label = segment.charAt(0).toUpperCase() + segment.slice(1);
        breadcrumbs.push({
          label: label === 'Crm' ? 'CRM' : label,
          href: index === pathSegments.length - 1 ? undefined : currentPath
        });
      }
    });

    return breadcrumbs;
  };

  const items = customItems || generateBreadcrumbs();

  return (
    <nav className={cn("flex items-center space-x-1 text-sm text-muted-foreground animate-fade-in", className)}>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <ChevronRight className="h-4 w-4" />
          )}
          
          {item.href ? (
            <Link
              to={item.href}
              className="flex items-center gap-1 hover:text-primary transition-colors interactive-button px-2 py-1 rounded-md"
            >
              {item.icon && <item.icon className="h-4 w-4" />}
              {item.label}
            </Link>
          ) : (
            <span className="flex items-center gap-1 text-foreground font-medium">
              {item.icon && <item.icon className="h-4 w-4" />}
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};