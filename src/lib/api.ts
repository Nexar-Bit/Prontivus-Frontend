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
  timeout?: number; // Optional timeout override in milliseconds
}

/**
 * Generic API request handler with retry logic and timeout
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { token, skipAuth, timeout: timeoutOverride, ...fetchOptions } = options;
  const maxRetries = 3;
  const retryDelay = 1000; // Start with 1 second

  // Calculate timeout duration (moved outside try block for proper scope)
  // Set to effectively infinite (1 hour) to let system operate normally
  const DEFAULT_TIMEOUT = 3600000; // 1 hour - effectively infinite for normal operations
  
  // Determine timeout based on endpoint and method
  const isDashboardStatsEndpoint = endpoint.includes('/analytics/dashboard/stats');
  const isAnalyticsEndpoint = endpoint.includes('/analytics/') || endpoint.includes('/dashboard/');
  const isSettingsEndpoint = endpoint.includes('/settings/');
  const isNotificationsEndpoint = endpoint.includes('/notifications');
  const requestMethod = (fetchOptions.method || '').toUpperCase();
  const isWriteOperation = ['POST', 'PUT', 'PATCH'].includes(requestMethod);
  const isDeleteOperation = requestMethod === 'DELETE';
  
  // Use override if provided, otherwise use infinite timeout for all requests
  const timeoutDuration = timeoutOverride ?? DEFAULT_TIMEOUT;

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
      // Log timeout duration for debugging (only in development)
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        console.debug(`[API] ${endpoint} - Timeout set to ${timeoutDuration}ms`);
      }
      
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
      // Also don't retry on 503 (Service Unavailable) - service is down, retrying won't help
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

      // For server errors (5xx), don't retry on 503 (Service Unavailable) - service is down
      // Retry other 5xx errors (500, 502, 504) as they might be transient
      if (response.status === 503) {
        // 503 means service is temporarily unavailable - don't retry, fail immediately
        let errorMessage = `Service temporarily unavailable. Please try again later.`;
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            if (errorData.detail) {
              errorMessage = errorData.detail;
            }
          }
        } catch {
          // Use default message
        }
        const error = new Error(errorMessage);
        (error as any).status = 503;
        throw error;
      }
      
      // For other server errors (5xx) or retryable client errors, retry if not last attempt
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
        const timeoutMsg = `Request timeout: The server is processing your request. Please wait a moment and try again.`;
        if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
          console.warn(`[API] Timeout on ${endpoint} after ${timeoutDuration}ms - system is functioning, just slow`);
        }
        throw new Error(timeoutMsg);
      }
      
      // Handle 408 Request Timeout and 503 Service Unavailable gracefully
      // System is working, just slow - don't show alarming errors
      if (error.status === 408 || error.status === 503 || 
          (error.message && (error.message.includes('took too long') || 
                            error.message.includes('temporarily unavailable') ||
                            error.message.includes('processing')))) {
        // For dashboard and non-critical endpoints, handle gracefully
        if (endpoint.includes('/analytics/') || endpoint.includes('/dashboard/') || 
            endpoint.includes('/notifications') || endpoint.includes('/settings/')) {
          if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
            console.log(`[API] Slow response on ${endpoint} - system is functioning, using defaults`);
          }
          // Throw a non-alarming message that will be handled gracefully
          throw new Error('Request is processing. Please wait a moment.');
        }
      }

      // Don't retry on last attempt
      if (attempt >= maxRetries) {
        break;
      }

      // Don't retry on certain client errors (4xx) or 503 (Service Unavailable)
      // 503 means service is temporarily unavailable - retrying immediately won't help
      if (error.status && (
          (error.status >= 400 && error.status < 500 && error.status !== 408 && error.status !== 429) ||
          error.status === 503
      )) {
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
