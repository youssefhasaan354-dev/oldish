import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AdminUser, UserRole } from '../types';
import { 
  isFirebaseConfigured, 
  getAuthInstance, 
  getUserRole, 
  getIdToken 
} from '../lib/firebase';

interface AuthContextType {
  user: AdminUser | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  hasRole: (requiredRole: UserRole | UserRole[]) => boolean;
  getIdToken: () => Promise<string | null>;
}

const STORAGE_KEY_AUTH = 'oldish_admin_auth_session';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const initAuth = async () => {
      try {
        const isAdminRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
        const hasSessionHint = typeof window !== 'undefined' && Boolean(
          localStorage.getItem(STORAGE_KEY_AUTH) || 
          Object.keys(localStorage).some(k => k.startsWith('firebase:authUser:'))
        );

        if (isFirebaseConfigured() && (isAdminRoute || hasSessionHint)) {
          const auth = await getAuthInstance();
          if (auth) {
            const { onAuthStateChanged } = await import('firebase/auth');
            unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
              if (fbUser) {
                const userRole = await getUserRole(fbUser.uid);
                setUser({
                  id: fbUser.uid,
                  email: fbUser.email || '',
                  role: userRole,
                  created_at: fbUser.metadata?.creationTime || new Date().toISOString(),
                  last_sign_in_at: fbUser.metadata?.lastSignInTime
                });
              } else {
                setUser(null);
              }
              setIsLoading(false);
            });
            return;
          }
        }

        // Restore local admin session if available and valid (e.g. demo / test mode)
        const localSession = localStorage.getItem(STORAGE_KEY_AUTH);
        if (localSession) {
          try {
            const parsed = JSON.parse(localSession);
            if (Date.now() - parsed.timestamp < 4 * 60 * 60 * 1000 && parsed.user?.role) {
              setUser(parsed.user);
            } else {
              localStorage.removeItem(STORAGE_KEY_AUTH);
            }
          } catch {}
        }
      } catch (err) {
        console.warn('Auth check error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // 1. If Firebase configured, attempt live Firebase Auth
    if (isFirebaseConfigured()) {
      try {
        const auth = await getAuthInstance();
        if (!auth) {
          return { success: false, error: 'Firebase Auth is not available' };
        }
        const { signInWithEmailAndPassword } = await import('firebase/auth');
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        const fbUser = userCredential.user;
        const userRole = await getUserRole(fbUser.uid);

        const adminUser: AdminUser = {
          id: fbUser.uid,
          email: fbUser.email || '',
          role: userRole,
          created_at: fbUser.metadata?.creationTime || new Date().toISOString(),
          last_sign_in_at: fbUser.metadata?.lastSignInTime
        };

        setUser(adminUser);
        return { success: true };
      } catch (e: any) {
        let msg = e.message || 'فشل تسجيل الدخول';
        if (e.code === 'auth/invalid-credential' || e.code === 'auth/wrong-password' || e.code === 'auth/user-not-found') {
          msg = 'بيانات الدخول غير صحيحة (البريد الإلكتروني أو كلمة المرور).';
        } else if (e.code === 'auth/too-many-requests') {
          msg = 'تم حظر الدخول مؤقتاً لكثرة المحاولات الفاشلة. يرجى المحاولة لاحقاً.';
        }
        return { success: false, error: msg };
      }
    }

    // 2. Demo mode credentials (ONLY allowed when Firebase is NOT configured and VITE_DEMO_MODE=true)
    const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true' || import.meta.env.VITE_DEMO_MODE === true;
    if (!isFirebaseConfigured() && isDemoMode) {
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
      return { success: false, error: 'كلمة المرور يجب ألا تقل عن 6 خانات' };
    }

    return { success: false, error: 'خدمة تسجيل الدخول غير مهيأة بعد' };
  };

  const logout = async () => {
    if (isFirebaseConfigured()) {
      try { 
        const auth = await getAuthInstance();
        if (auth) {
          const { signOut } = await import('firebase/auth');
          await signOut(auth);
        }
      } catch (err) {
        console.warn('Logout error:', err);
      }
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
      hasRole,
      getIdToken
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
