import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

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

// Simple auth hook for now - can be extended with context later
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Real user profile from database
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Load real user profile
  useEffect(() => {
    const loadProfile = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('user_roles')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"

          if (data) {
            setProfile({
              id: user.id,
              email: user.email || '',
              full_name: user.user_metadata?.full_name || 'Utilisateur',
              role: data.role || 'client',
              preferences: {
                theme: 'light',
                notifications: true,
                language: 'fr'
              }
            });
          } else {
            // Set default profile if no user role exists
            setProfile({
              id: user.id,
              email: user.email || '',
              full_name: user.user_metadata?.full_name || 'Utilisateur',
              role: 'client',
              preferences: {
                theme: 'light',
                notifications: true,
                language: 'fr'
              }
            });
          }
        } catch (error) {
          console.error('Error loading profile:', error);
          // Set fallback profile
          setProfile({
            id: user.id,
            email: user.email || '',
            full_name: 'Utilisateur',
            role: 'client',
            preferences: {
              theme: 'light',
              notifications: true,
              language: 'fr'
            }
          });
        }
      } else {
        setProfile(null);
      }
    };

    loadProfile();
  }, [user]);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      return data;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userData?: any) => {
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
      
      if (error) throw error;
      return data;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    // Update profile in database
    if (profile && user) {
      try {
        const { error } = await supabase
          .from('user_roles')
          .upsert({
            user_id: user.id,
            email: user.email,
            role: updates.role || profile.role
          });

        if (error) throw error;
        
        setProfile(prev => prev ? { ...prev, ...updates } : null);
      } catch (error) {
        console.error('Error updating profile:', error);
      }
    }
  };

  const hasRole = (role: string): boolean => {
    return profile?.role === role;
  };

  const canAccess = (resource: string, action: string): boolean => {
    if (!profile) return false;

    // Normalize common action aliases
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

    // Admin (or any role with "*") has access to everything
    if (rolePermissions['*']) {
      return true;
    }

    const resourcePermissions = rolePermissions[resource];
    return resourcePermissions ? resourcePermissions.includes(normalizedAction) : false;
  };
  return {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    hasRole,
    canAccess
  };
};