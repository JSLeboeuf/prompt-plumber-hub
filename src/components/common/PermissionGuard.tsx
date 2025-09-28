import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface PermissionGuardProps {
  resource: string;
  action: string;
  children: ReactNode;
  fallback?: ReactNode;
  loadingComponent?: ReactNode;
}

export const PermissionGuard = ({ 
  resource, 
  action, 
  children, 
  fallback,
  loadingComponent 
}: PermissionGuardProps) => {
  const { canAccess, loading } = useAuth();

  if (loading && loadingComponent) {
    return <>{loadingComponent}</>;
  }

import { Link } from 'react-router-dom';

  if (!canAccess(resource, action)) {
    return fallback || (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="title-md text-muted-foreground mb-2">Accès non autorisé</h3>
          <p className="body text-muted-foreground mb-4">
            Vous n'avez pas les permissions pour accéder à {resource}
          </p>
          <Link to="/auth" className="btn btn-primary">Se connecter</Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};