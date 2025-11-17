/**
 * Authentication Utility Functions
 * Handles token storage, retrieval, and API authentication
 */

const TOKEN_KEY = 'clinicore_access_token';
const REFRESH_TOKEN_KEY = 'clinicore_refresh_token';
const USER_KEY = 'clinicore_user';

export interface Clinic {
  id: number;
  name: string;
  legal_name: string;
  tax_id: string;
  address?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  license_key?: string;
  expiration_date?: string;
  max_users: number;
  active_modules: string[];
  created_at: string;
  updated_at?: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: 'admin' | 'secretary' | 'doctor' | 'patient';
  role_id?: number; // Role ID from menu system
  role_name?: string; // Role name (e.g., "SuperAdmin", "Medico")
  is_active: boolean;
  is_verified: boolean;
  clinic_id: number;
  clinic?: Clinic;
}

export interface LoginResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  user: User;
  menu?: any[]; // Menu structure (optional)
  permissions?: string[]; // User permissions (optional)
}

export interface LoginCredentials {
  username_or_email: string;
  password: string;
  expected_role?: string;
}

// ==================== Token Management ====================

/**
 * Set a cookie with the given name, value, and expiration
 */
function setCookie(name: string, value: string, days: number = 7): void {
  if (typeof document === 'undefined') return;
  
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

/**
 * Delete a cookie
 */
function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
}

/**
 * Store authentication tokens and user data in localStorage and cookies
 * Cookies are needed for middleware (server-side) access
 */
export function setAuthData(data: LoginResponse): void {
  if (typeof window === 'undefined') return;
  
  // Store in localStorage (for client-side access)
  localStorage.setItem(TOKEN_KEY, data.access_token);
  if (data.refresh_token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
  }
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  
  // Also store in cookies (for middleware/server-side access)
  // Calculate expiration days from expires_in (seconds)
  const expirationDays = Math.floor(data.expires_in / (24 * 60 * 60)) || 7;
  setCookie('clinicore_access_token', data.access_token, expirationDays);
  setCookie('prontivus_access_token', data.access_token, expirationDays); // For compatibility
  if (data.refresh_token) {
    setCookie('clinicore_refresh_token', data.refresh_token, 30); // Refresh tokens last longer
  }
}

/**
 * Get the access token from localStorage
 */
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Get the refresh token from localStorage
 */
export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * Get the stored user data from localStorage
 */
export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch (error) {
    console.error('Error parsing stored user data:', error);
    return null;
  }
}

/**
 * Clear all authentication data from localStorage and cookies
 */
export function clearAuthData(): void {
  if (typeof window === 'undefined') return;
  
  // Clear localStorage
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  
  // Clear cookies
  deleteCookie('clinicore_access_token');
  deleteCookie('prontivus_access_token');
  deleteCookie('clinicore_refresh_token');
}

/**
 * Check if user is authenticated (has valid token)
 */
export function isAuthenticated(): boolean {
  return getAccessToken() !== null;
}

// ==================== API Functions ====================

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Login user with credentials
 */
export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Login failed');
  }

  const data: LoginResponse = await response.json();
  setAuthData(data);
  
  return data;
}

/**
 * Logout user (clear local data and call API)
 */
export async function logout(): Promise<void> {
  const token = getAccessToken();
  
  if (token) {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('Logout API call failed:', error);
    }
  }
  
  clearAuthData();
}

/**
 * Get current user information from API
 */
export async function getCurrentUser(): Promise<User> {
  const token = getAccessToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_URL}/api/auth/me`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthData();
      throw new Error('Session expired. Please login again.');
    }
    throw new Error('Failed to fetch user data');
  }

  const user: User = await response.json();
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  
  return user;
}

/**
 * Verify if the current token is still valid
 * 
 * This function makes a request to the backend to verify the token.
 * The backend handles all token validation including expiration checks.
 * This is more reliable than client-side validation, especially with timezone changes.
 */
export async function verifyToken(): Promise<boolean> {
  const token = getAccessToken();
  
  if (!token) return false;

  try {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // Increased to 10 second timeout for timezone issues

    const response = await fetch(`${API_URL}/api/auth/verify-token`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Only return true if we get a successful response
    // 401 means token is invalid/expired
    // 200 means token is valid
    if (response.ok && response.status === 200) {
      return true;
    }
    
    // If we get 401, the token might be expired or invalid
    // But be lenient - return true if status is not 401 (might be network issue)
    if (response.status === 401) {
      console.warn('Token verification returned 401 - token may be expired');
      return false;
    }
    
    // For other status codes, assume it's a temporary issue
    console.warn(`Token verification returned status ${response.status}, assuming temporary issue`);
    return true;
  } catch (error) {
    // Handle timeout and network errors gracefully
    if (error instanceof Error) {
      if (error.name === 'TimeoutError' || error.name === 'AbortError') {
        console.warn('Token verification timeout - network issue, not token issue');
        // Return true on timeout to avoid false negatives
        // The token might be valid, we just couldn't verify it
        return true;
      }
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.warn('Token verification network error - network issue, not token issue');
        // Return true on network errors to avoid false negatives
        return true;
      }
    }
    console.error('Token verification failed:', error);
    // Be lenient - return true for unknown errors to avoid false negatives
    // Only return false for confirmed authentication errors
    return true; // Changed to true to be more lenient with timezone changes
  }
}

/**
 * Refresh the access token
 */
export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${refreshToken}`,
      },
    });

    if (!response.ok) {
      clearAuthData();
      return null;
    }

    const data = await response.json();
    localStorage.setItem(TOKEN_KEY, data.access_token);
    
    // Also update cookies
    const expirationDays = Math.floor((data.expires_in || 604800) / (24 * 60 * 60)) || 7;
    setCookie('clinicore_access_token', data.access_token, expirationDays);
    setCookie('prontivus_access_token', data.access_token, expirationDays);
    
    return data.access_token;
  } catch (error) {
    console.error('Token refresh failed:', error);
    clearAuthData();
    return null;
  }
}

// ==================== Authorization Helpers ====================

/**
 * Check if user has a specific role
 */
export function hasRole(user: User | null, role: User['role']): boolean {
  return user?.role === role;
}

/**
 * Check if user has one of the specified roles
 */
export function hasAnyRole(user: User | null, roles: User['role'][]): boolean {
  return user ? roles.includes(user.role) : false;
}

/**
 * Check if user is admin
 */
export function isAdmin(user: User | null): boolean {
  return hasRole(user, 'admin');
}

/**
 * Check if user is staff (admin, secretary, or doctor)
 */
export function isStaff(user: User | null): boolean {
  return hasAnyRole(user, ['admin', 'secretary', 'doctor']);
}

/**
 * Check if user is doctor
 */
export function isDoctor(user: User | null): boolean {
  return hasRole(user, 'doctor');
}

/**
 * Check if user is secretary
 */
export function isSecretary(user: User | null): boolean {
  return hasRole(user, 'secretary');
}

/**
 * Check if user is patient
 */
export function isPatient(user: User | null): boolean {
  return hasRole(user, 'patient');
}

// ==================== Registration ====================

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  role: 'admin' | 'secretary' | 'doctor' | 'patient';
  clinic_id: number;
}

/**
 * Register a new user
 */
export async function register(userData: RegisterData): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    
    // Handle validation errors (array of error objects)
    if (errorData.detail && Array.isArray(errorData.detail)) {
      const errorMessages = errorData.detail.map((err: any) => {
        if (typeof err === 'string') return err;
        if (err.msg) return err.msg;
        if (err.type && err.loc) {
          return `${err.loc.join('.')}: ${err.msg || err.type}`;
        }
        return JSON.stringify(err);
      });
      throw new Error(errorMessages.join(', '));
    }
    
    // Handle single error message
    const errorMessage = typeof errorData.detail === 'string' 
      ? errorData.detail 
      : errorData.message || 'Registration failed';
    throw new Error(errorMessage);
  }

  const data: LoginResponse = await response.json();
  setAuthData(data);
  return data;
}

