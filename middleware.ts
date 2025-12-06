import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Route protection configuration
 * Maps routes to required roles
 */
const ROUTE_ROLES: Record<string, {
  roleIds?: number[];
  roleNames?: string[];
  roleEnums?: string[];
  redirectTo?: string;
}> = {
  '/super-admin': {
    roleIds: [1],
    roleNames: ['SuperAdmin'],
    roleEnums: ['admin'],
    redirectTo: '/dashboard',
  },

  '/admin': {
    roleIds: [2],
    roleNames: ['AdminClinica'],
    roleEnums: ['admin'],
    redirectTo: '/dashboard',
  },
  
  '/medico': {
    roleIds: [3],
    roleNames: ['Medico'],
    roleEnums: ['doctor'],
    redirectTo: '/dashboard',
  },
  '/secretaria': {
    roleIds: [4],
    roleNames: ['Secretaria'],
    roleEnums: ['secretary'],
    redirectTo: '/dashboard',
  },
  '/paciente': {
    roleIds: [5],
    roleNames: ['Paciente'],
    roleEnums: ['patient'],
    redirectTo: '/dashboard',
  },
  '/patient': {
    roleIds: [5],
    roleNames: ['Paciente'],
    roleEnums: ['patient'],
    redirectTo: '/dashboard',
  },
};

/**
 * Public routes that don't require authentication
 */
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/portal/login',
  '/register',
  '/portal/register',
  '/forgot-password',
  '/reset-password',
  '/auth/google/callback',
  '/api/auth',
];

/**
 * Check if route is public
 */
function isPublicRoute(pathname: string): boolean {
  // Exact match for root
  if (pathname === '/') {
    return true;
  }
  // Check if pathname matches any public route exactly or starts with it
  return PUBLIC_ROUTES.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );
}

/**
 * Get user role from token
 */
function getUserFromToken(request: NextRequest): {
  role_id?: number;
  role_name?: string;
  role?: string;
} | null {
  try {
    // Try both token key formats for compatibility
    const token = request.cookies.get('prontivus_access_token')?.value || 
                  request.cookies.get('clinicore_access_token')?.value ||
                  request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return null;
    }

    // Decode JWT token (basic decode, not verification)
    // In production, you should verify the token signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Use Web API atob for Edge Runtime compatibility
    // JWT uses URL-safe base64, so we need to convert it
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    
    // Add padding if needed (base64 strings must be multiples of 4)
    const paddingLength = (4 - (base64.length % 4)) % 4;
    if (paddingLength > 0) {
      base64 += '='.repeat(paddingLength);
    }
    
    // Decode base64 - handle potential errors
    let decoded: string;
    try {
      decoded = atob(base64);
    } catch (e) {
      // Invalid base64, return null
      return null;
    }
    
    // Parse JSON payload - handle potential errors
    let payload: any;
    try {
      payload = JSON.parse(decoded);
    } catch (e) {
      // Invalid JSON, return null
      return null;
    }

    return {
      role_id: payload.role_id,
      role_name: payload.role_name,
      role: payload.role,
    };
  } catch (error) {
    // Silently fail - don't log in Edge Runtime to avoid deployment issues
    return null;
  }
}

/**
 * Check if user has access to route
 */
function hasRouteAccess(
  pathname: string,
  user: { role_id?: number; role_name?: string; role?: string } | null
): boolean {
  // Find matching route configuration
  const routeConfig = Object.entries(ROUTE_ROLES).find(([route]) =>
    pathname.startsWith(route)
  );

  if (!routeConfig) {
    // No specific role requirement, allow authenticated users
    return true;
  }

  const [, config] = routeConfig;

  if (!user) {
    return false;
  }

  // Check role_id
  if (config.roleIds && user.role_id) {
    if (config.roleIds.includes(user.role_id)) {
      return true;
    }
  }

  // Check role_name
  if (config.roleNames && user.role_name) {
    if (config.roleNames.includes(user.role_name)) {
      return true;
    }
  }

  // Check role enum
  if (config.roleEnums && user.role) {
    if (config.roleEnums.includes(user.role)) {
      return true;
    }
  }

  return false;
}

/**
 * Get redirect URL for unauthorized access
 */
function getRedirectUrl(pathname: string): string {
  const routeConfig = Object.entries(ROUTE_ROLES).find(([route]) =>
    pathname.startsWith(route)
  );

  if (routeConfig) {
    return routeConfig[1].redirectTo || '/dashboard';
  }

  return '/dashboard';
}

export function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;

    // Create response
    const response = NextResponse.next();

    // Add cache-control headers to prevent caching of HTML pages
    if (!pathname.startsWith('/_next/') && !pathname.startsWith('/api/')) {
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
    }

    // Allow public routes
    if (isPublicRoute(pathname)) {
      return response;
    }

    // Check authentication
    const user = getUserFromToken(request);

    // If not authenticated, redirect to login
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      const redirectResponse = NextResponse.redirect(loginUrl);
      redirectResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      return redirectResponse;
    }

    // Check route access
    if (!hasRouteAccess(pathname, user)) {
      const redirectUrl = getRedirectUrl(pathname);
      const url = new URL(redirectUrl, request.url);
      url.searchParams.set('error', 'access_denied');
      url.searchParams.set('from', pathname);
      const redirectResponse = NextResponse.redirect(url);
      redirectResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      return redirectResponse;
    }

    return response;
  } catch (error) {
    // If middleware fails, allow request to proceed
    // This prevents deployment failures from middleware errors
    return NextResponse.next();
  }
}

/**
 * Configure which routes to run middleware on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     * - static assets
     */
    '/((?!api|_next/static|_next/image|_next/webpack-hmr|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)$).*)',
  ],
};

