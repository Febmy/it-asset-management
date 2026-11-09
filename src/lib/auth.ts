import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import crypto from 'node:crypto';
import type { UserSession } from '@/types/user';

export const AUTH_COOKIE_NAME = 'auth_token';

// Lazy evaluation of JWT_SECRET - only evaluated at runtime when auth functions are called
function getJwtSecret(): Uint8Array {
    // During Next.js build phase (phase-production-build), return a placeholder
    // The actual secret will be validated at runtime
    if (process.env.NEXT_PHASE === 'phase-production-build') {
        return new TextEncoder().encode('build-time-placeholder-secret-min-32-chars');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET environment variable is required');
    }
    if (secret.length < 32) {
        throw new Error('JWT_SECRET must be at least 32 characters');
    }
    return new TextEncoder().encode(secret);
}

export async function signToken(payload: UserSession): Promise<string> {
    return new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(getJwtSecret());
}

export async function verifyToken(token: string): Promise<UserSession | null> {
    try {
        const { payload } = await jwtVerify(token, getJwtSecret());
        return payload as unknown as UserSession;
    } catch {
        return null;
    }
}

export async function getSession(): Promise<UserSession | null> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
        if (!token) return null;
        return await verifyToken(token);
    } catch {
        return null;
    }
}

export function hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
    if (!storedHash) return false;
    const parts = storedHash.split(':');
    if (parts.length !== 2) return false;
    const [salt, key] = parts;
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
}
