import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/useToast';

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
  signIn: (email: string, password: string) => Promise<{ error?: any }>;
  signUp: (email: string, password: string, userData?: any) => Promise<{ error?: any }>;
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
  const { error: showError } = useToast();

  // Load user profile from database
  const loadProfile = async (currentUser: User) => {
    try {
      console.log('🔄 Loading profile for user:', currentUser.email);
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role, permissions')
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (error) {
        console.error('❌ Error loading profile:', error);
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

      console.log('✅ Profile loaded:', profileData);
      setProfile(profileData);
      
    } catch (error) {
      console.error('❌ Failed to load profile:', error);
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
    console.log('🔄 Setting up auth listener...');
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔔 Auth event:', event, session?.user?.email);
        
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
      console.log('🔄 Initial session:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        loadProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    return () => {
      console.log('🧹 Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('🔐 Attempting sign in for:', email);
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('❌ Sign in error:', error);
        showError('Erreur de connexion', error.message);
        return { error };
      }
      
      console.log('✅ Sign in successful:', data.user?.email);
      return { error: null };
      
    } catch (error: any) {
      console.error('❌ Sign in exception:', error);
      showError('Erreur', error.message || 'Erreur de connexion');
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userData?: any) => {
    console.log('📝 Attempting sign up for:', email);
    setLoading(true);
    
    try {
      const redirectUrl = `${window.location.origin}/`;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
          emailRedirectTo: redirectUrl
        }
      });
      
      if (error) {
        console.error('❌ Sign up error:', error);
        showError('Erreur d\'inscription', error.message);
        return { error };
      }
      
      console.log('✅ Sign up successful:', data.user?.email);
      return { error: null };
      
    } catch (error: any) {
      console.error('❌ Sign up exception:', error);
      showError('Erreur', error.message || 'Erreur d\'inscription');
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    console.log('🚪 Signing out...');
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Sign out error:', error);
        throw error;
      }
      
      console.log('✅ Sign out successful');
    } catch (error: any) {
      console.error('❌ Sign out exception:', error);
      showError('Erreur', error.message || 'Erreur de déconnexion');
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (role: string): boolean => {
    return profile?.role === role;
  };

  const canAccess = (resource: string, action: string): boolean => {
    if (!profile) return false;

    const normalizedAction = action === 'write' ? 'create' : action === 'view' ? 'read' : action;
    
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

    const rolePermissions = (permissions as any)[profile.role];
    if (!rolePermissions) return false;

    // Admin has access to everything
    if (rolePermissions['*']) {
      return true;
    }

    const resourcePermissions = rolePermissions[resource];
    return resourcePermissions ? resourcePermissions.includes(normalizedAction) : false;
  };

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
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