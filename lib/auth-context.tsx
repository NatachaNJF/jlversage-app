import React, { createContext, useContext, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { router, useSegments } from 'expo-router';

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
  const segments = useSegments();

  // Récupérer le rôle depuis l'objet user (étendu par le backend)
  const userAny = auth.user as any;
  const appRole = userAny?.appRole as string | undefined;
  const role = userAny?.role as string | undefined;

  const isAdmin = role === 'admin';
  const isGestionnaire = isAdmin || appRole === 'gestionnaire';
  const isPrepose = !isAdmin && appRole === 'prepose';

  // Redirection automatique vers login si non connecté
  useEffect(() => {
    if (auth.loading) return;

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'oauth';

    if (!auth.isAuthenticated && !inAuthGroup) {
      // Non connecté → rediriger vers login
      router.replace('/login');
    } else if (auth.isAuthenticated && inAuthGroup) {
      // Connecté et sur login → rediriger vers l'app
      router.replace('/(tabs)');
    }
  }, [auth.isAuthenticated, auth.loading, segments]);

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
