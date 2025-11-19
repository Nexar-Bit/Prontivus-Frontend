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
  '/pacient': {
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

    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64').toString('utf-8')
    );

    return {
      role_id: payload.role_id,
      role_name: payload.role_name,
      role: payload.role,
    };
  } catch (error) {
    console.error('Error decoding token:', error);
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
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Check authentication
  const user = getUserFromToken(request);

  // If not authenticated, redirect to login
  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check route access
  if (!hasRouteAccess(pathname, user)) {
    const redirectUrl = getRedirectUrl(pathname);
    const url = new URL(redirectUrl, request.url);
    url.searchParams.set('error', 'access_denied');
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
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

