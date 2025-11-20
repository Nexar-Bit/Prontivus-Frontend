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
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
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
        } else if (errorData.error) {
          // Some APIs return error object
          errorMessage = typeof errorData.error === 'string' 
            ? errorData.error 
            : errorData.error.message || JSON.stringify(errorData.error);
        } else {
          errorMessage = JSON.stringify(errorData);
        }
      } else {
        // Try to read as text if not JSON
        const text = await response.text();
        if (text) {
          errorMessage = text;
        }
      }
    } catch (parseError) {
      // If response is not JSON or parsing fails, use status text
      errorMessage = response.statusText || errorMessage;
      
      // For 404 errors, provide more helpful message
      if (response.status === 404) {
        errorMessage = `Not Found: ${endpoint}. The endpoint may not exist or the backend server may need to be restarted.`;
      }
    }
    
    // Handle 403 Forbidden - especially for "Inactive user"
    if (response.status === 403) {
      // Check if it's an inactive user error
      if (errorMessage.toLowerCase().includes('inactive user') || 
          (errorData?.detail && typeof errorData.detail === 'string' && errorData.detail.toLowerCase().includes('inactive user'))) {
        clearAuthData();
        if (typeof window !== 'undefined') {
          // Show a message before redirecting
          console.warn('User account is inactive. Redirecting to login...');
          window.location.href = '/login?error=inactive';
        }
      }
    }
    
    // Create error object with all relevant information
    const error = new Error(errorMessage);
    (error as any).status = response.status;
    (error as any).statusText = response.statusText;
    (error as any).data = errorData;
    (error as any).detail = errorData?.detail;
    (error as any).response = {
      status: response.status,
      statusText: response.statusText,
      data: errorData,
    };
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

  /**
   * Download a file (returns Blob instead of JSON)
   */
  download: async (endpoint: string, options?: RequestOptions): Promise<Blob> => {
    const { token, skipAuth, ...fetchOptions } = options || {};

    const headers: HeadersInit = {
      ...fetchOptions.headers,
    };

    // Automatically include JWT token from localStorage if not skipped
    if (!skipAuth) {
      const authToken = token || getAccessToken();
      if (authToken) {
        (headers as any)['Authorization'] = `Bearer ${authToken}`;
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
        if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string' 
            ? errorData.detail 
            : JSON.stringify(errorData.detail);
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        errorMessage = response.statusText || errorMessage;
      }
      
      // Handle 403 Forbidden - especially for "Inactive user"
      if (response.status === 403) {
        // Check if it's an inactive user error
        if (errorMessage.toLowerCase().includes('inactive user') || 
            (errorData?.detail && typeof errorData.detail === 'string' && errorData.detail.toLowerCase().includes('inactive user'))) {
          clearAuthData();
          if (typeof window !== 'undefined') {
            // Show a message before redirecting
            console.warn('User account is inactive. Redirecting to login...');
            window.location.href = '/login?error=inactive';
          }
        }
      }
      
      const error = new Error(errorMessage);
      (error as any).status = response.status;
      throw error;
    }

    return response.blob();
  },
};

/**
 * Health check endpoint
 */
export async function checkHealth() {
  return api.get<{ status: string; service: string; version: string }>(
    '/api/health'
  );
}

