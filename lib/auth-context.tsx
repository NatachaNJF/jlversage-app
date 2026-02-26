import React, { createContext, useContext } from 'react';
import { useAuth } from '@/hooks/use-auth';

interface AuthContextValue {
  user: ReturnType<typeof useAuth>['user'];
  loading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  isGestionnaire: boolean;
  isPrepose: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();

  // Récupérer le rôle depuis l'objet user (étendu par le backend)
  const userAny = auth.user as any;
  const appRole = userAny?.appRole as string | undefined;
  const role = userAny?.role as string | undefined;

  const isAdmin = role === 'admin';
  const isGestionnaire = isAdmin || appRole === 'gestionnaire';
  const isPrepose = appRole === 'prepose';

  return (
    <AuthContext.Provider value={{
      user: auth.user,
      loading: auth.loading,
      isAuthenticated: auth.isAuthenticated,
      logout: auth.logout,
      refresh: auth.refresh,
      isGestionnaire,
      isPrepose,
      isAdmin,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
}
