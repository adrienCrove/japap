'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getCurrentUser, logout as apiLogout, getToken } from '@/lib/api';

interface User {
  userId: string;
  phone: string;
  role: 'user' | 'moderator' | 'admin';
  email?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const loadUser = async () => {
    try {
      const token = getToken();
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      const response = await getCurrentUser();
      if (response.success && response.data) {
        setUser(response.data);
      } else {
        setUser(null);
        apiLogout();
      }
    } catch (error) {
      console.error('Error loading user:', error);
      setUser(null);
      apiLogout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  // Redirection automatique
  useEffect(() => {
    if (!loading) {
      const isLoginPage = pathname === '/login';
      const isDashboardPage = pathname?.startsWith('/dashboard');

      if (!user && isDashboardPage) {
        // Non authentifié et sur une page dashboard -> rediriger vers login
        router.push('/login');
      } else if (user && isLoginPage) {
        // Authentifié et sur la page login -> rediriger vers dashboard
        router.push('/dashboard');
      } else if (user && (user.role !== 'admin' && user.role !== 'moderator') && isDashboardPage) {
        // Utilisateur standard qui tente d'accéder au dashboard -> rediriger vers login
        apiLogout();
        setUser(null);
        router.push('/login');
      }
    }
  }, [user, loading, pathname, router]);

  const logout = () => {
    apiLogout();
    setUser(null);
    router.push('/login');
  };

  const refreshUser = async () => {
    await loadUser();
  };

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    logout,
    refreshUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
