import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { signToken, verifyPassword, AUTH_COOKIE_NAME } from '@/lib/auth';
import type { UserSession } from '@/types/user';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { identifier, password } = body;

        if (!identifier || !identifier.trim()) {
            return NextResponse.json(
                { success: false, message: 'Email atau ID Karyawan wajib diisi' },
                { status: 400 }
            );
        }

        if (!password) {
            return NextResponse.json(
                { success: false, message: 'Password wajib diisi' },
                { status: 400 }
            );
        }

        const query = `
      SELECT id, employee_id, name, email, department, role, password_hash, is_active
      FROM users
      WHERE (LOWER(email) = LOWER($1) OR UPPER(employee_id) = UPPER($1))
        AND is_active = TRUE
      LIMIT 1;
    `;

        const result = await pool.query(query, [identifier.trim()]);

        if (result.rows.length === 0) {
            return NextResponse.json(
                { success: false, message: 'Akun tidak ditemukan atau tidak aktif' },
                { status: 401 }
            );
        }

        const user = result.rows[0];

        // Karyawan tidak memiliki hak akses login
        if (user.role === 'employee' || !user.password_hash) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        'Karyawan hanya didaftarkan sebagai master data penerima aset dan tidak memiliki akun login. Hak akses portal dikhususkan untuk Direktur, Finance, IT Asset Management, Head of IT, dan Lead IT Gov.',
                },
                { status: 403 }
            );
        }

        // Verifikasi password
        let isValidPassword = false;
        if (user.password_hash) {
            isValidPassword = verifyPassword(password, user.password_hash);
        }

        if (!isValidPassword) {
            return NextResponse.json(
                { success: false, message: 'Password yang Anda masukkan salah' },
                { status: 401 }
            );
        }

        const sessionPayload: UserSession = {
            id: user.id,
            employee_id: user.employee_id,
            name: user.name,
            email: user.email,
            department: user.department,
            role: user.role,
        };

        const token = await signToken(sessionPayload);

        const response = NextResponse.json({
            success: true,
            message: `Selamat datang, ${user.name}!`,
            data: sessionPayload,
        });

        // Set cookie HTTP-only
        response.cookies.set({
            name: AUTH_COOKIE_NAME,
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7, // 7 hari
        });

        return response;
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { success: false, message: 'Terjadi kegagalan server saat proses masuk' },
            { status: 500 }
        );
    }
}
