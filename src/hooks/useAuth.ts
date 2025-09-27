import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role: 'admin' | 'agent' | 'client';
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

  // Mock profile for demo - in production this would come from database
  const profile: UserProfile = {
    id: user?.id || '',
    email: user?.email || '',
    full_name: 'Admin Fortin',
    role: 'admin', // Default to admin for demo
    preferences: {
      theme: 'light',
      notifications: true,
      language: 'fr'
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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
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

  const updateProfile = async (updates: Partial<UserProfile>) => {
    // Placeholder - in production would update database
    console.log('Profile update:', updates);
  };

  const hasRole = (role: string): boolean => {
    return profile?.role === role;
  };

  const canAccess = (resource: string, action: string): boolean => {
    if (!profile) return false;
    
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
    };

    const rolePermissions = permissions[profile.role];
    if (!rolePermissions) return false;

    // Admin has access to everything
    if (rolePermissions['*']) {
      return rolePermissions['*'].includes(action);
    }

    const resourcePermissions = rolePermissions[resource];
    return resourcePermissions ? resourcePermissions.includes(action) : false;
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