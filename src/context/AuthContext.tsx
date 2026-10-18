import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AdminUser, UserRole } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: AdminUser | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  hasRole: (requiredRole: UserRole | UserRole[]) => boolean;
}

const STORAGE_KEY_AUTH = 'oldish_admin_auth_session';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session
  useEffect(() => {
    const checkSession = async () => {
      try {
        if (isSupabaseConfigured()) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            // Fetch role from admin_users
            const { data: adminData } = await supabase
              .from('admin_users')
              .select('role')
              .eq('id', session.user.id)
              .single();

            setUser({
              id: session.user.id,
              email: session.user.email || '',
              role: (adminData?.role as UserRole) || 'owner',
              created_at: session.user.created_at,
              last_sign_in_at: session.user.last_sign_in_at,
            });
            setIsLoading(false);
            return;
          }
        }

        // Check local demo session
        const localSession = localStorage.getItem(STORAGE_KEY_AUTH);
        if (localSession) {
          const parsed = JSON.parse(localSession);
          // Check expiration (4 hours)
          if (Date.now() - parsed.timestamp < 4 * 60 * 60 * 1000) {
            setUser(parsed.user);
          } else {
            localStorage.removeItem(STORAGE_KEY_AUTH);
          }
        }
      } catch (err) {
        console.warn('Auth check error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // 1. If Supabase configured, attempt live auth
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          return { success: false, error: error.message };
        }
        if (data.user) {
          const { data: adminData } = await supabase
            .from('admin_users')
            .select('role')
            .eq('id', data.user.id)
            .single();

          const adminUser: AdminUser = {
            id: data.user.id,
            email: data.user.email || '',
            role: (adminData?.role as UserRole) || 'owner',
            created_at: data.user.created_at,
            last_sign_in_at: data.user.last_sign_in_at,
          };
          setUser(adminUser);
          return { success: true };
        }
      } catch (e: any) {
        return { success: false, error: e.message || 'Login failed' };
      }
    }

    // 2. Demo mode credentials (for local test / staging demo before live Supabase project)
    const normalizedEmail = email.toLowerCase().trim();
    if (password.length >= 6) {
      let role: UserRole = 'editor';
      if (normalizedEmail.includes('owner') || normalizedEmail.includes('admin')) {
        role = 'owner';
      } else if (normalizedEmail.includes('viewer') || normalizedEmail.includes('demo') || normalizedEmail.includes('auditor')) {
        role = 'viewer';
      } else if (normalizedEmail.includes('manager') || normalizedEmail.includes('editor')) {
        role = 'editor';
      }

      const demoUser: AdminUser = {
        id: `usr-${Date.now()}`,
        email: normalizedEmail,
        role,
        created_at: new Date().toISOString(),
        last_sign_in_at: new Date().toISOString()
      };

      setUser(demoUser);
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify({
        user: demoUser,
        timestamp: Date.now()
      }));

      return { success: true };
    }

    return { success: false, error: 'Password must be at least 6 characters' };
  };

  const logout = async () => {
    if (isSupabaseConfigured()) {
      try { await supabase.auth.signOut(); } catch (e) {}
    }
    localStorage.removeItem(STORAGE_KEY_AUTH);
    setUser(null);
  };

  const hasRole = (requiredRole: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{
      user,
      role: user?.role || null,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      hasRole
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
