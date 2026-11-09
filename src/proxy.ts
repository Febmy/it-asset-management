import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getEnv } from '@/lib/env';
import { csrfProtection } from '@/lib/csrf';

// Paths that don't require authentication
const publicPaths = [
  '/api/auth/login',
  '/api/auth/logout',
  '/api/csrf',
  '/api/health',
  '/login',
  '/',
];

// Paths that require authentication
const protectedPaths = [
  '/api/auth/me',
  '/api/assets',
  '/api/users',
  '/api/licenses',
  '/api/categories',
  '/api/locations',
  '/api/departments',
  '/api/dashboard',
];

function isPublicPath(pathname: string): boolean {
  return publicPaths.some((publicPath) => pathname.startsWith(publicPath));
}

function isProtectedPath(pathname: string): boolean {
  return protectedPaths.some((protectedPath) => pathname.startsWith(protectedPath));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip proxy for static files and Next.js internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Allow public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Check if path requires authentication
  const requiresAuth = isProtectedPath(pathname) || pathname.startsWith('/api/');

  if (requiresAuth) {
    try {
      // Get token from cookie
      const token = request.cookies.get('auth_token')?.value;

      if (!token) {
        // For API routes, return 401 JSON
        if (pathname.startsWith('/api/')) {
          return NextResponse.json(
            { success: false, message: 'Unauthenticated' },
            { status: 401 }
          );
        }
        // For pages, redirect to login
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Verify token
      const env = getEnv();
      const payload = await verifyToken(token);

      if (!payload) {
        // For API routes, return 401 JSON
        if (pathname.startsWith('/api/')) {
          return NextResponse.json(
            { success: false, message: 'Invalid or expired session' },
            { status: 401 }
          );
        }
        // For pages, redirect to login
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Token is valid - add user info to headers for downstream use
      const response = NextResponse.next();
      response.headers.set('x-user-id', String(payload.id));
      response.headers.set('x-user-role', payload.role);
      response.headers.set('x-user-email', payload.email);

      // CSRF Protection for mutating API routes
      if (pathname.startsWith('/api/')) {
        const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
        if (mutatingMethods.includes(request.method)) {
          // Exclude public/auth endpoints from CSRF protection
          const publicMutatingPaths = [
            '/api/auth/login',
            '/api/auth/logout',
            '/api/csrf',
            '/api/health',
          ];

          const isPublicMutating = publicMutatingPaths.some((path) =>
            pathname.startsWith(path)
          );

          if (!isPublicMutating) {
            const csrfResponse = await csrfProtection(request);
            if (csrfResponse) {
              // Add user headers to the CSRF error response too
              csrfResponse.headers.set('x-user-id', String(payload.id));
              csrfResponse.headers.set('x-user-role', payload.role);
              csrfResponse.headers.set('x-user-email', payload.email);
              return csrfResponse;
            }
          }
        }
      }

      return response;
    } catch (error) {
      console.error('Proxy auth error:', error);
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { success: false, message: 'Authentication error' },
          { status: 401 }
        );
      }
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Handle non-API routes (web pages) - redirect authenticated users from login to dashboard
  const token = request.cookies.get('auth_token')?.value;
  let isAuthenticated = false;
  if (token) {
    const session = await verifyToken(token);
    isAuthenticated = !!session;
  }

  // If already authenticated and accessing /login or root '/', redirect to /dashboard
  if (isAuthenticated && (pathname === '/login' || pathname === '/')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.ico$).*)',
  ],
};