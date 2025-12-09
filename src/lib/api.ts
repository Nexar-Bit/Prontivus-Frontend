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
 * Generic API request handler with retry logic and timeout
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { token, skipAuth, ...fetchOptions } = options;
  const maxRetries = 3;
  const retryDelay = 1000; // Start with 1 second

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

  let lastError: Error | null = null;

  // Retry logic for transient failures
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Create AbortController for timeout (60 seconds for analytics endpoints)
      const isAnalyticsEndpoint = endpoint.includes('/analytics/') || endpoint.includes('/dashboard/');
      const timeoutDuration = isAnalyticsEndpoint ? 60000 : 30000; // 60s for analytics, 30s for others
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);

      const response = await fetch(`${API_URL}${endpoint}`, {
        ...fetchOptions,
        headers,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      // If successful, process response
      if (response.ok) {
        if (response.status === 204) {
          return null as T;
        }
        return await response.json();
      }

      // Don't retry on client errors (4xx) except 408 (Request Timeout) and 429 (Too Many Requests)
      if (response.status >= 400 && response.status < 500 && 
          response.status !== 408 && response.status !== 429) {
        // Process error response
        let errorMessage = `HTTP error! status: ${response.status}`;
        let errorData: any = null;
        
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            errorData = await response.json();
            if (errorData.detail) {
              if (Array.isArray(errorData.detail)) {
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
            }
          }
        } catch {
          errorMessage = response.statusText || errorMessage;
        }

        // Handle 401 Unauthorized - redirect to login
        if (response.status === 401) {
          clearAuthData();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }

        // Handle 403 Forbidden - especially for "Inactive user"
        if (response.status === 403) {
          if (errorMessage.toLowerCase().includes('inactive user') || 
              (errorData?.detail && typeof errorData.detail === 'string' && errorData.detail.toLowerCase().includes('inactive user'))) {
            clearAuthData();
            if (typeof window !== 'undefined') {
              console.warn('User account is inactive. Redirecting to login...');
              window.location.href = '/login?error=inactive';
            }
          }
        }

        // Handle 404 errors
        if (response.status === 404) {
          errorMessage = `Not Found: ${endpoint}. The endpoint may not exist or the backend server may need to be restarted.`;
        }

        const error = new Error(errorMessage);
        (error as any).status = response.status;
        (error as any).statusText = response.statusText;
        (error as any).data = errorData;
        (error as any).detail = errorData?.detail;
        throw error;
      }

      // For server errors (5xx) or retryable client errors, retry if not last attempt
      if (attempt < maxRetries) {
        const error = new Error(`Server error: ${response.status}`);
        (error as any).status = response.status;
        throw error;
      }

      // Last attempt failed, process error
      let errorMessage = `HTTP error! status: ${response.status}`;
      let errorData: any = null;
      
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
          if (errorData.detail) {
            errorMessage = typeof errorData.detail === 'string' 
              ? errorData.detail 
              : JSON.stringify(errorData.detail);
          }
        }
      } catch {
        errorMessage = response.statusText || errorMessage;
      }

      const error = new Error(errorMessage);
      (error as any).status = response.status;
      throw error;

    } catch (error: any) {
      lastError = error;
      
      // Don't retry on abort (timeout) - throw immediately
      if (error.name === 'AbortError') {
        throw new Error('Request timeout: The server did not respond in time. Please check your connection and try again.');
      }

      // Don't retry on last attempt
      if (attempt >= maxRetries) {
        break;
      }

      // Don't retry on certain client errors
      if (error.status && error.status >= 400 && error.status < 500 && 
          error.status !== 408 && error.status !== 429) {
        throw error;
      }

      // Wait before retrying with exponential backoff
      const delay = retryDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      if (typeof window !== 'undefined') {
        console.warn(`API request failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`, error.message);
      }
    }
  }

  // All retries exhausted
  if (lastError) {
    throw lastError;
  }

  throw new Error('Request failed after all retries');
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

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...fetchOptions,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

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
          if (errorMessage.toLowerCase().includes('inactive user') || 
              (errorData?.detail && typeof errorData.detail === 'string' && errorData.detail.toLowerCase().includes('inactive user'))) {
            clearAuthData();
            if (typeof window !== 'undefined') {
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
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Download timeout: The server did not respond in time.');
      }
      throw error;
    }
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
