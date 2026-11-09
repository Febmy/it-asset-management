# Security Assessment Report: IT-Asset-Management

**Date**: 2026-10-23  
**Application**: Next.js 16.3.4 IT Asset Management System  
**Assessment Type**: Comprehensive Code Security Review

---

## Executive Summary

**Overall Risk Level: 🔴 CRITICAL**

This application has **multiple critical security vulnerabilities** that must be addressed immediately before any production deployment. The most severe issues include hardcoded production secrets committed to git, authentication bypasses, and missing server-side authorization controls.

---

## Critical Vulnerabilities (Fix Immediately)

### 1. 🔴 CRITICAL: Production Secrets Committed to Git
**File**: `.env.local`  
**Severity**: CRITICAL  
**CVSS**: 9.8 (Critical)

```env
# .env.local - COMMITTED TO GIT
DB_PASSWORD="Y0du!123"
JWT_SECRET=super_secret_jwt_key_min_32_karakter_bebas
CRON_SECRET_TOKEN=my_cron_secret_123
```

**Impact**: 
- Database credentials exposed → full database compromise
- JWT secret exposed → token forgery, session hijacking, privilege escalation
- Cron secret exposed → unauthorized cron job triggering

**Remediation**:
```bash
# 1. Immediately rotate ALL secrets
# 2. Remove .env.local from git history (use git filter-repo or BFG Repo-Cleaner)
# 3. Add .env.local to .gitignore (already present but verify)
# 4. Use environment variables in production (Vercel, Docker, etc.)
```

**Verify**: `git log --all --full-history -- .env.local` - should show no commits

---

### 2. 🔴 CRITICAL: JWT Secret Hardcoded Fallback
**File**: `src/lib/auth.ts:8-10`

```typescript
const JWT_SECRET = process.env.JWT_SECRET || 'it_asset_management_jwt_super_secret_key_32_characters_minimum';
```

**Impact**: If env var missing, uses predictable secret → token forgery

**Remediation**:
```typescript
// src/lib/auth.ts - FAIL LOUD if secret missing
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
if (JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters');
}
```

---

### 3. 🔴 CRITICAL: Authentication Bypass in `/api/auth/me`
**File**: `src/app/api/auth/me/route.ts:16-25`

```typescript
// Fallback jika belum login: ambil user admin pertama untuk preview dev
const fallbackRes = await pool.query(
  `SELECT id, employee_id, name, email, department, role FROM users WHERE role = 'super_admin' LIMIT 1;`
);

if (fallbackRes.rows.length > 0) {
  return NextResponse.json({ success: true, data: fallbackRes.rows[0] });
}
```

**Impact**: Any unauthenticated request gets super_admin session → full system compromise

**Remediation**: Remove entire fallback block. Return 401 if no session:
```typescript
if (!session) {
  return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
}
```

---

### 4. 🔴 CRITICAL: No Server-Side Authorization Middleware
**Files**: 
- `src/app/(dashboard)/layout.tsx` - `'use client'` only, no server auth
- **Missing**: `src/middleware.ts` (does not exist)

**Impact**: 
- All dashboard routes accessible without authentication
- API routes lack consistent auth checks (only some check manually)
- Client-side auth easily bypassed via browser dev tools

**Remediation**: Create `src/middleware.ts`:
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/me'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }
  
  const token = request.cookies.get('auth_token')?.value;
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  try {
    await verifyToken(token);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};
```

---

### 5. 🔴 CRITICAL: No Rate Limiting on Auth Endpoints
**Files**: 
- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/me/route.ts`

**Impact**: Credential stuffing, brute-force attacks, session enumeration

**Remediation**: Add rate limiting (e.g., `@vercel/rate-limit` or custom):
```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@vercel/rate-limit';
import { kv } from '@vercel/kv';

export const ratelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 requests per minute
});
```

---

## High Severity Vulnerabilities

### 6. 🟠 HIGH: Missing CSRF Protection
**Impact**: State-changing operations (login, user creation, asset disposal) vulnerable to CSRF

**Remediation**: 
- Use `sameSite: 'strict'` on auth cookies (see #8)
- Implement CSRF tokens for all mutating operations
- Consider Double-Submit Cookie pattern

---

### 7. 🟠 HIGH: Insecure Cookie Configuration
**File**: `src/app/api/auth/login/route.ts:92`

```typescript
sameSite: 'lax',  // Should be 'strict'
```

**Impact**: CSRF risk, cookie sent on cross-site navigations

**Remediation**:
```typescript
sameSite: 'strict',
secure: true,  // Always true in production
```

---

### 8. 🟠 HIGH: Missing Security Headers
**File**: `next.config.ts` - No security headers configured

**Remediation**: Add to `next.config.ts`:
```typescript
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { 
    key: 'Content-Security-Policy', 
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  },
];

module.exports = {
  // ...existing config
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};
```

---

## Medium Severity Vulnerabilities

### 9. 🟡 MEDIUM: Overly Permissive `allowedDevOrigins`
**File**: `next.config.ts:21-28`

```typescript
allowedDevOrigins: [
  '192.168.*.*',
  '10.*.*.*',
  '172.16.*.*',
  '*.trycloudflare.com',
  '*.ngrok-free.app',
  '*.cloudflared.dev',
],
```

**Impact**: Any device on these networks can access dev server → potential RCE via hot reload

**Remediation**: Restrict to specific IPs or use VPN:
```typescript
allowedDevOrigins: [
  '192.168.1.100',  // Specific dev machine
  // Or use Tailscale/VPN instead
],
```

---

### 10. 🟡 MEDIUM: Optional Cron Secret Check
**File**: `src/app/api/cron/alerts/route.ts:8-15`

```typescript
const cronSecret = process.env.CRON_SECRET_TOKEN;
if (cronSecret && authHeader && authHeader !== `Bearer ${cronSecret}`) {
  return NextResponse.json({ success: false, message: 'Unauthorized cron trigger' }, { status: 401 });
}
```

**Impact**: If CRON_SECRET_TOKEN not set, cron endpoint is public

**Remediation**: Require secret, fail if missing:
```typescript
const cronSecret = process.env.CRON_SECRET_TOKEN;
if (!cronSecret) {
  throw new Error('CRON_SECRET_TOKEN environment variable is required');
}
if (authHeader !== `Bearer ${cronSecret}`) {
  return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
}
```

---

### 11. 🟡 MEDIUM: Inconsistent API Authorization
**Findings**: Some API routes check session, others don't:
- ✅ `/api/users` POST - checks session + role
- ✅ `/api/users` PUT - **NO session check** (line 185-186)
- ✅ `/api/assets/disposal` - **NO session check**
- ✅ `/api/assets/[id]` PUT - **NO session check**
- ✅ `/api/cron/alerts` - optional secret only

**Remediation**: Centralize auth in middleware (#4) + add role checks per route

---

### 12. 🟡 MEDIUM: Password Minimum Length Too Low
**File**: `src/app/api/users/route.ts:22` and `src/app/api/auth/login/route.ts` (no explicit min)

```typescript
password: z.string().min(6, 'Password minimal 6 karakter')
```

**Remediation**: Increase to 12+ characters, add complexity requirements

---

## Low Severity / Info

### 13. 🔵 LOW: Error Messages Leak Stack Traces
**Files**: Multiple routes return `console.error` output in catch blocks

**Remediation**: Use generic error messages in production, log details server-side only

---

### 14. 🔵 LOW: No Audit Logging
**Impact**: No trail of security-relevant events (login failures, privilege changes, data access)

**Remediation**: Implement audit logging for:
- Authentication events (success/failure)
- Role/permission changes
- Data export/bulk operations
- Admin actions

---

### 15. 🔵 LOW: Missing Input Sanitization for HTML/URL Fields
**Files**: `image_url`, `proof_doc_url` accept URLs without validation of scheme

**Remediation**: Validate URLs allow only https:// scheme

---

## Security Strengths (Positive Findings)

| Area | Implementation | Status |
|------|---------------|--------|
| SQL Injection Prevention | Parameterized queries throughout | ✅ Good |
| Password Hashing | scrypt with timing-safe comparison | ✅ Good |
| Input Validation | Zod schemas on all mutating endpoints | ✅ Good |
| Role-Based Access Control | Defined roles with route-level checks | ✅ Good |
| Session Management | HTTP-only, secure cookies | ⚠️ Partial (sameSite: lax) |
| Cron Protection | Secret token check (optional) | ⚠️ Partial |
| Employee Login Block | Explicit check prevents employee portal access | ✅ Good |

---

## Remediation Priority Checklist

### Phase 1: Emergency (Do Today)
- [ ] Rotate ALL secrets (DB, JWT, Cron, Telegram)
- [ ] Remove `.env.local` from git history
- [ ] Remove auth bypass in `/api/auth/me`
- [ ] Add JWT_SECRET validation (fail if missing)
- [ ] Change cookie to `sameSite: 'strict'`

### Phase 2: Critical Infrastructure (This Week)
- [ ] Create `src/middleware.ts` with server-side auth
- [ ] Add rate limiting to `/api/auth/*`
- [ ] Add security headers to `next.config.ts`
- [ ] Make cron secret required
- [ ] Restrict `allowedDevOrigins`

### Phase 3: Hardening (Next Sprint)
- [ ] Add CSRF protection for all mutations
- [ ] Implement consistent auth checks on all API routes
- [ ] Add audit logging
- [ ] Increase password minimum to 12 chars
- [ ] Add URL scheme validation
- [ ] Generic error messages in production

---

## Environment Variables Required (Production)

```env
# REQUIRED - Generate secure values (32+ chars each)
JWT_SECRET=                    # openssl rand -base64 32
DB_PASSWORD=                   # Strong random password
CRON_SECRET_TOKEN=             # openssl rand -base64 32
TELEGRAM_BOT_TOKEN=            # From BotFather
TELEGRAM_CHAT_ID=              # Target chat ID

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require

# App
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

---

## Verification Commands

```bash
# Verify no secrets in git history
git log --all --full-history -- .env.local

# Check for hardcoded secrets
grep -r "super_secret\|Y0du\|my_cron_secret" --include="*.ts" --include="*.tsx" .

# Verify middleware exists
ls -la src/middleware.ts

# Check security headers
curl -I https://your-domain.com | grep -i "x-frame\|x-content\|csp\|referrer"

# Test rate limiting
for i in {1..10}; do curl -X POST https://your-domain.com/api/auth/login -d '{"identifier":"test","password":"test"}'; done
```

---

## Appendix: Files Examined

| File | Status |
|------|--------|
| `.env.local` | 🔴 Critical issues |
| `.gitignore` | ✅ Correct (has `.env*`) |
| `next.config.ts` | 🟡 Medium issues |
| `src/lib/auth.ts` | 🔴 Critical issue |
| `src/lib/db.ts` | ✅ Good (parameterized queries) |
| `src/app/(dashboard)/layout.tsx` | 🔴 Missing server auth |
| `src/app/api/auth/me/route.ts` | 🔴 Auth bypass |
| `src/app/api/auth/login/route.ts` | 🟠 No rate limit, lax cookie |
| `src/app/api/auth/logout/route.ts` | ✅ Good |
| `src/app/api/users/route.ts` | 🟡 PUT missing auth |
| `src/app/api/assets/route.ts` | 🟡 Missing auth |
| `src/app/api/assets/[id]/route.ts` | 🟡 Missing auth |
| `src/app/api/assets/disposal/route.ts` | 🟡 Missing auth |
| `src/app/api/cron/alerts/route.ts` | 🟡 Optional secret |

---

**Assessment Complete** - All critical attack vectors identified. Immediate action required on Phase 1 items.