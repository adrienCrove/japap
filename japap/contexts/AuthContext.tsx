import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as api from '@/services/api';
import * as storage from '@/services/storage';

interface User {
  id: string;
  name: string;
  email?: string;
  phone: string;
  role: string;
  status: string;
  reputationScore: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (emailOrPhone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: api.RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Charger les données d'authentification au démarrage
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const [savedToken, savedUser] = await Promise.all([
        storage.getAuthToken(),
        storage.getUser()
      ]);

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(savedUser as User);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (emailOrPhone: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await api.login(emailOrPhone, password);

      if (!response.success || !response.token || !response.user) {
        return {
          success: false,
          error: response.error || 'Échec de la connexion'
        };
      }

      // Sauvegarder le token et l'utilisateur
      await Promise.all([
        storage.saveAuthToken(response.token),
        storage.saveUser(response.user)
      ]);

      setToken(response.token);
      setUser(response.user);
      setIsAuthenticated(true);

      return { success: true };
    } catch (error: any) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la connexion'
      };
    }
  };

  const register = async (userData: api.RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await api.register(userData);

      if (!response.success || !response.token || !response.user) {
        return {
          success: false,
          error: response.error || 'Échec de la création du compte'
        };
      }

      // Sauvegarder le token et l'utilisateur
      await Promise.all([
        storage.saveAuthToken(response.token),
        storage.saveUser(response.user)
      ]);

      setToken(response.token);
      setUser(response.user);
      setIsAuthenticated(true);

      return { success: true };
    } catch (error: any) {
      console.error('Register error:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la création du compte'
      };
    }
  };

  const logout = async () => {
    try {
      await storage.clearAuthData();
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    checkAuth
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
