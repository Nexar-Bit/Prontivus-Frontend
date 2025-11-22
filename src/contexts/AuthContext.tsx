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
  const justLoggedInRef = React.useRef<number>(0); // Track when user just logged in
  const verificationAttemptsRef = React.useRef<number>(0); // Track verification attempts
  const hasInitializedRef = React.useRef<boolean>(false); // Track if auth has been initialized

  // Initialize authentication state
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Skip verification on public routes (e.g., login, home page, forgot password)
        const publicRoutes = ['/', '/login', '/portal/login', '/forgot-password', '/reset-password', '/register', '/portal/register'];
        if (publicRoutes.includes(pathname)) {
          setIsLoading(false);
          hasInitializedRef.current = true;
          return;
        }
        
        // Check if user is stored in localStorage
        const storedUser = getStoredUser();
        
        if (storedUser && checkIsAuthenticated()) {
          // Optimistically set user to allow page access immediately
          setUser(storedUser);
          
          // Skip verification if user just logged in (within last 30 seconds)
          // This prevents immediate logout after successful login, especially with timezone changes
          const timeSinceLogin = Date.now() - justLoggedInRef.current;
          const GRACE_PERIOD_MS = 30000; // 30 seconds grace period after login (increased for timezone changes)
          
          if (timeSinceLogin < GRACE_PERIOD_MS && justLoggedInRef.current > 0) {
            // User just logged in, skip verification to avoid race conditions and timezone issues
            console.log('Skipping token verification - user just logged in', {
              timeSinceLogin,
              gracePeriod: GRACE_PERIOD_MS
            });
            setIsLoading(false);
            hasInitializedRef.current = true;
            return;
          }
          
          // Only verify token if we haven't just logged in
          // Add a small delay to ensure login process is complete
          if (!hasInitializedRef.current) {
            // First initialization - wait a bit before verifying
            await new Promise(resolve => setTimeout(resolve, 1000)); // Increased to 1 second
          }
          
          // Verify token in background with retry logic (only if not just logged in)
          // Be more lenient with verification failures, especially after timezone changes
          let isValid = false;
          const MAX_RETRIES = 3; // Increased retries
          
          for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
              isValid = await verifyToken();
              if (isValid) {
                verificationAttemptsRef.current = 0; // Reset on success
                break;
              }
              
              // If verification fails, wait a bit before retry (except on last attempt)
              if (attempt < MAX_RETRIES) {
                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds between retries
              }
            } catch (error) {
              console.warn(`Token verification attempt ${attempt + 1} failed:`, error);
              // Continue to next attempt - don't fail immediately
            }
          }
          
          if (!isValid) {
            verificationAttemptsRef.current++;
            // Only logout after multiple consecutive failures (increased threshold for timezone changes)
            // This gives more tolerance for timezone-related issues
            if (verificationAttemptsRef.current >= 5) { // Increased from 3 to 5
              console.error('Token verification failed multiple times, logging out');
              clearAuthData();
              setUser(null);
              verificationAttemptsRef.current = 0; // Reset counter
              if (pathname !== '/' && pathname !== '/login' && pathname !== '/portal/login') {
                router.push('/login');
              }
            } else {
              // Don't logout on first few failures, might be temporary issue or timezone change
              console.warn(`Token verification failed (attempt ${verificationAttemptsRef.current}/5), but keeping session active`);
            }
          } else {
            verificationAttemptsRef.current = 0; // Reset on success
          }
        } else if (!storedUser) {
          // No user found - check if we're on a public page
          const publicRoutes = ['/', '/login', '/portal/login', '/forgot-password', '/reset-password', '/register', '/portal/register'];
          if (!publicRoutes.includes(pathname)) {
            // Not on a public page - redirect to login
            router.push('/login');
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Don't immediately clear auth on error, might be temporary
        // Only clear if we've had multiple failures
        if (verificationAttemptsRef.current >= 3) {
          clearAuthData();
          setUser(null);
          verificationAttemptsRef.current = 0;
        }
      } finally {
        setIsLoading(false);
        hasInitializedRef.current = true;
      }
    };

    initAuth();
  }, [pathname, router]);

  // Login function
  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      
      // Mark that user is about to log in (set before API call to ensure it's set)
      // Use a timestamp slightly in the past to account for API call time
      justLoggedInRef.current = Date.now();
      verificationAttemptsRef.current = 0; // Reset verification attempts on login
      hasInitializedRef.current = false; // Reset initialization flag
      
      const response = await apiLogin(credentials);
      // Ensure tokens and user are persisted even if apiLogin implementation changes
      setAuthData(response);
      setUser(response.user);
      
      // Update the timestamp again after successful login to ensure it's recent
      // This ensures we have a fresh timestamp for the grace period
      justLoggedInRef.current = Date.now();
      
      console.log('Login successful, grace period started', {
        timestamp: justLoggedInRef.current,
        user: response.user.username
      });
      
      // Don't redirect here - let the calling component handle redirect
    } catch (error) {
      console.error('Login error:', error);
      // Reset the ref on login failure
      justLoggedInRef.current = 0;
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
      
      // Mark that user just registered/logged in to skip immediate verification
      justLoggedInRef.current = Date.now();
      verificationAttemptsRef.current = 0; // Reset verification attempts
      
      // Redirect based on user role
      if (response.user.role === 'patient') {
        router.push('/patient/dashboard');
      } else {
        router.push('/dashboard');
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

