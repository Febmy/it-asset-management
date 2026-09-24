import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'it_asset_management_jwt_super_secret_key_32_characters_minimum'
);

export async function middleware(request: NextRequest) {
    const token = request.cookies.get('auth_token')?.value;
    const pathname = request.nextUrl.pathname;

    let isAuthenticated = false;
    if (token) {
        try {
            await jwtVerify(token, JWT_SECRET);
            isAuthenticated = true;
        } catch {
            isAuthenticated = false;
        }
    }

    // 1. Jika belum terotentikasi dan mencoba mengakses halaman manapun selain /login
    if (!isAuthenticated) {
        if (pathname !== '/login') {
            const loginUrl = new URL('/login', request.url);
            const response = NextResponse.redirect(loginUrl);
            if (token) {
                // Hapus cookie usang jika token tidak valid
                response.cookies.delete('auth_token');
            }
            return response;
        }
        return NextResponse.next();
    }

    // 2. Jika sudah terotentikasi dan membuka halaman /login atau root '/', arahkan ke /dashboard
    if (pathname === '/login' || pathname === '/') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
