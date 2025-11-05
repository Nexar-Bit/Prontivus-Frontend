/**
 * API client configuration and helper functions
 */
import { getAccessToken, clearAuthData } from './auth';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Normalize error for consistent logging and display
 */
export function normalizeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (typeof error === 'object' && error !== null) {
    try {
      return JSON.stringify(error, null, 2);
    } catch {
      return String(error);
    }
  }
  return String(error);
}

interface RequestOptions extends RequestInit {
  token?: string;
  skipAuth?: boolean;
}

/**
 * Generic API request handler
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { token, skipAuth, ...fetchOptions } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  // Automatically include JWT token from localStorage if not skipped
  if (!skipAuth) {
    const authToken = token || getAccessToken();
    if (authToken) {
      (headers as any)['Authorization'] = `Bearer ${authToken}`;
    } else {
      // Log warning if auth is required but no token found
      if (typeof window !== 'undefined') {
        console.warn('API request made without authentication token');
      }
    }
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    // Handle 401 Unauthorized - redirect to login
    if (response.status === 401) {
      clearAuthData();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    
    let errorMessage = `HTTP error! status: ${response.status}`;
    let errorData: any = null;
    
    try {
      errorData = await response.json();
      // FastAPI validation errors typically have 'detail' as an array or string
      if (errorData.detail) {
        if (Array.isArray(errorData.detail)) {
          // Pydantic validation errors
          errorMessage = errorData.detail.map((err: any) => 
            `${err.loc?.join('.') || 'field'}: ${err.msg}`
          ).join(', ');
        } else if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        } else {
          errorMessage = JSON.stringify(errorData.detail);
        }
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else {
        errorMessage = JSON.stringify(errorData);
      }
    } catch {
      // If response is not JSON, use status text
      errorMessage = response.statusText || errorMessage;
    }
    
    const error = new Error(errorMessage);
    (error as any).status = response.status;
    (error as any).data = errorData;
    throw error;
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

/**
 * API client object with common methods
 */
export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    }),

  put: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  patch: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};

/**
 * Health check endpoint
 */
export async function checkHealth() {
  return api.get<{ status: string; service: string; version: string }>(
    '/api/health'
  );
}

