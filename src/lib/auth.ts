import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import crypto from 'node:crypto';
import type { UserSession } from '@/types/user';

export const AUTH_COOKIE_NAME = 'auth_token';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'it_asset_management_jwt_super_secret_key_32_characters_minimum'
);

export async function signToken(payload: UserSession): Promise<string> {
    return new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<UserSession | null> {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
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
