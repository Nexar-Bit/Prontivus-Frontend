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
}

export interface LoginCredentials {
  username_or_email: string;
  password: string;
}

// ==================== Token Management ====================

/**
 * Store authentication tokens and user data in localStorage
 */
export function setAuthData(data: LoginResponse): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(TOKEN_KEY, data.access_token);
  if (data.refresh_token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
  }
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
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
 * Clear all authentication data from localStorage
 */
export function clearAuthData(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
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
 */
export async function verifyToken(): Promise<boolean> {
  const token = getAccessToken();
  
  if (!token) return false;

  try {
    const response = await fetch(`${API_URL}/api/auth/verify-token`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    return response.ok;
  } catch (error) {
    console.error('Token verification failed:', error);
    return false;
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
    throw new Error(errorData.detail || 'Registration failed');
  }

  const data: LoginResponse = await response.json();
  setAuthData(data);
  return data;
}

