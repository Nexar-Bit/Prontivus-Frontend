"use client";

/**
 * Authentication Context
 * Provides global authentication state and functions
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  User,
  LoginCredentials,
  RegisterData,
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  getCurrentUser,
  getStoredUser,
  setAuthData,
  clearAuthData,
  isAuthenticated as checkIsAuthenticated,
  verifyToken,
} from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Initialize authentication state
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Skip verification on public routes (e.g., login)
        if (pathname === '/login') {
          setIsLoading(false);
          return;
        }
        // Check if user is stored in localStorage
        const storedUser = getStoredUser();
        
        if (storedUser && checkIsAuthenticated()) {
          // Optimistically set user to allow page access immediately
          setUser(storedUser);
          // Verify token in background
          const isValid = await verifyToken();
          if (!isValid) {
            clearAuthData();
            setUser(null);
            if (pathname !== '/login') {
              router.push('/login');
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        clearAuthData();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [pathname]);

  // Login function
  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      const response = await apiLogin(credentials);
      // Ensure tokens and user are persisted even if apiLogin implementation changes
      setAuthData(response);
      setUser(response.user);
      
      // Don't redirect here - let the calling component handle redirect
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      await apiLogout();
      setUser(null);
      
      // Redirect to login page
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Clear local data even if API call fails
      clearAuthData();
      setUser(null);
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Register function
  const register = useCallback(async (userData: RegisterData) => {
    try {
      setIsLoading(true);
      const response = await apiRegister(userData);
      setUser(response.user);
      
      // Redirect based on user role
      if (response.user.role === 'patient') {
        router.push('/patient/dashboard');
      } else {
        router.push('/portal');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Refresh user error:', error);
      // If refresh fails, logout user
      clearAuthData();
      setUser(null);
    }
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    register,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

// Hook to require authentication (redirects if not authenticated)
export function useRequireAuth() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  return { user, isLoading, logout };
}

// Hook to require specific role
export function useRequireRole(allowedRoles: User['role'][]) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (!allowedRoles.includes(user.role)) {
        router.push('/unauthorized');
      }
    }
  }, [user, isLoading, allowedRoles, router]);

  return { user, isLoading };
}

