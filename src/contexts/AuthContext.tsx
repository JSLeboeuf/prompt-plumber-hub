/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { logger } from '@/lib/logger';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role: 'admin' | 'agent' | 'client' | 'manager' | 'technician';
  avatar_url?: string;
  phone?: string;
  preferences?: {
    theme: 'light' | 'dark';
    notifications: boolean;
    language: 'fr' | 'en';
  };
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: Error | null }>;
  signUp: (email: string, password: string, userData?: Partial<UserProfile>) => Promise<{ error?: Error | null }>;
  signOut: () => Promise<void>;
  hasRole: (role: string) => boolean;
  canAccess: (resource: string, action: string) => boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user profile from database
  const loadProfile = async (currentUser: User) => {
    try {
      
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role, permissions')
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (error) {
        logger.error('Error loading profile', error as Error);
        throw error;
      }

      const profileData: UserProfile = {
        id: currentUser.id,
        email: currentUser.email || '',
        full_name: currentUser.user_metadata?.full_name || 'Utilisateur',
        role: data?.role || 'client',
        preferences: {
          theme: 'light',
          notifications: true,
          language: 'fr'
        }
      };

      
      setProfile(profileData);
      
    } catch (error) {
      logger.error('Failed to load profile', error as Error);
      // Set fallback profile to prevent app crash
      setProfile({
        id: currentUser.id,
        email: currentUser.email || '',
        full_name: 'Utilisateur',
        role: 'client',
        preferences: {
          theme: 'light',
          notifications: true,
          language: 'fr'
        }
      });
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user);
    }
  };

  // Handle auth state changes
  useEffect(() => {
    
    
    // Listen for auth changes
const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadProfile(session.user);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        loadProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    return () => {
      
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    
    setLoading(true);
    
    try {
const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        logger.error('Sign in error', error);
        toast.error('Erreur de connexion', { description: error.message });
        return { error };
      }
      
      
      return { error: null };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur de connexion';
      logger.error('Sign in exception', error as Error);
      toast.error('Erreur', { description: errorMessage });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userData?: Partial<UserProfile>) => {
    
    setLoading(true);
    
    try {
      const redirectUrl = `${window.location.origin}/`;
const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          ...(userData && { data: userData }),
          emailRedirectTo: redirectUrl
        }
      });
      
      if (error) {
        logger.error('Sign up error', error);
        toast.error("Erreur d'inscription", { description: error.message });
        return { error };
      }
      
      
      return { error: null };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur d'inscription";
      logger.error('Sign up exception', error as Error);
      toast.error('Erreur', { description: errorMessage });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        logger.error('Sign out error', error);
        throw error;
      }
      
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur de déconnexion';
      logger.error('Sign out exception', error as Error);
      toast.error('Erreur', { description: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (role: string): boolean => {
    return profile?.role === role;
  };

  // Client-side permission check for UI rendering
  // IMPORTANT: This is for UI only - actual authorization happens server-side
  const canAccess = (resource: string, action: string): boolean => {
    if (!profile) return false;

    const normalizedAction = action === 'write' ? 'create' : action === 'view' ? 'read' : action;

    // These are UI hints only - server validates actual permissions
    const permissions = {
      admin: {
        '*': ['create', 'read', 'update', 'delete', 'manage']
      },
      agent: {
        calls: ['create', 'read', 'update'],
        clients: ['create', 'read', 'update'],
        interventions: ['create', 'read', 'update'],
        analytics: ['read'],
        support: ['read', 'create']
      },
      client: {
        profile: ['read', 'update'],
        interventions: ['read'],
        support: ['create']
      }
    } as const;

    const rolePermissions = permissions[profile.role as keyof typeof permissions];
    if (!rolePermissions) return false;

    // Admin has access to everything (UI hint only)
    if ('*' in rolePermissions && rolePermissions['*']) {
      return true;
    }

    const resourcePermissions = (rolePermissions as any)[resource];
    return resourcePermissions ? resourcePermissions.includes(normalizedAction) : false;
  };

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    signIn: signIn as (email: string, password: string) => Promise<{ error?: Error | null }>,
    signUp: signUp as (email: string, password: string, userData?: Partial<UserProfile>) => Promise<{ error?: Error | null }>,
    signOut,
    hasRole,
    canAccess,
    refreshProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};