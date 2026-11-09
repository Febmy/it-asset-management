import { NextRequest, NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';
import { getEnv } from './env';

// Lazy evaluation of CSRF_SECRET - only evaluated at runtime when CSRF functions are called
function getCsrfSecret(): Uint8Array {
    // During Next.js build phase (phase-production-build), return a placeholder
    // The actual secret will be validated at runtime
    if (process.env.NEXT_PHASE === 'phase-production-build') {
        return new TextEncoder().encode('build-time-placeholder-secret-min-32-chars');
    }

    const secret = process.env.CSRF_SECRET || process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('CSRF_SECRET or JWT_SECRET environment variable is required');
    }
    return new TextEncoder().encode(secret);
}

export const CSRF_COOKIE_NAME = 'csrf_token';
export const CSRF_HEADER_NAME = 'x-csrf-token';

export async function generateCsrfToken(): Promise<string> {
  return new SignJWT({ csrf: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(getCsrfSecret());
}

export async function verifyCsrfToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, getCsrfSecret());
    return true;
  } catch {
    return false;
  }
}

export async function getCsrfTokenFromRequest(request: NextRequest): Promise<string | null> {
  // Check header first (for API calls)
  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  if (headerToken) return headerToken;

  // Check cookie (for form submissions)
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  if (cookieToken) return cookieToken;

  return null;
}

export async function csrfProtection(request: NextRequest): Promise<NextResponse | null> {
  // Only protect mutating methods
  const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (!mutatingMethods.includes(request.method)) {
    return null;
  }

  // Skip CSRF for public endpoints that don't require auth
  const publicMutatingPaths = [
    '/api/auth/login',
    '/api/auth/logout',
  ];

  if (publicMutatingPaths.some((path) => request.nextUrl.pathname.startsWith(path))) {
    return null;
  }

  const token = await getCsrfTokenFromRequest(request);

  if (!token) {
    return NextResponse.json(
      { success: false, message: 'CSRF token required' },
      { status: 403 }
    );
  }

  const isValid = await verifyCsrfToken(token);
  if (!isValid) {
    return NextResponse.json(
      { success: false, message: 'Invalid CSRF token' },
      { status: 403 }
    );
  }

  return null;
}

export function setCsrfCookie(response: NextResponse, token: string): void {
  response.cookies.set({
    name: CSRF_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60, // 1 hour
  });
}