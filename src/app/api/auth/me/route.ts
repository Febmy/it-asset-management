import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import pool from '@/lib/db';

export async function GET() {
    try {
        const session = await getSession();

        if (session) {
            return NextResponse.json({
                success: true,
                data: session,
            });
        }

        // Fallback jika belum login: ambil user admin pertama untuk preview dev
        const fallbackRes = await pool.query(
            `SELECT id, employee_id, name, email, department, role FROM users WHERE role = 'super_admin' LIMIT 1;`
        );

        if (fallbackRes.rows.length > 0) {
            return NextResponse.json({
                success: true,
                data: fallbackRes.rows[0],
            });
        }

        return NextResponse.json(
            { success: false, message: 'Belum terotentikasi' },
            { status: 401 }
        );
    } catch (error) {
        console.error('Fetch me error:', error);
        return NextResponse.json(
            { success: false, message: 'Gagal mengambil data sesi' },
            { status: 500 }
        );
    }
}
