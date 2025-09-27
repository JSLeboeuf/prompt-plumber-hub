import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  resource?: string;
  action?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  resource,
  action = 'read'
}) => {
  const { user, profile, loading, canAccess } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user || !profile) {
        
        navigate('/auth');
        return;
      }

      if (requiredRole && profile.role !== requiredRole) {
        
        navigate('/dashboard');
        return;
      }

      if (resource && !canAccess(resource, action)) {
        
        navigate('/dashboard');
        return;
      }
    }
  }, [user, profile, loading, requiredRole, resource, action, navigate, canAccess]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return <>{children}</>;
};