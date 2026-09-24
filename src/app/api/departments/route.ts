import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/departments (Ambil seluruh divisi terdaftar dan jumlah anggotanya)
export async function GET() {
    try {
        const query = `
            SELECT 
                d.id,
                d.name,
                d.code,
                d.description,
                d.created_at,
                COUNT(u.id) as members_count,
                COUNT(u.id) FILTER (WHERE u.role != 'employee') as account_holders_count,
                COUNT(u.id) FILTER (WHERE u.role = 'employee') as employees_count
            FROM departments d
            LEFT JOIN users u ON LOWER(TRIM(u.department)) = LOWER(TRIM(d.name))
            GROUP BY d.id
            ORDER BY d.name ASC;
        `;

        const result = await pool.query(query);

        return NextResponse.json({
            success: true,
            data: result.rows,
        });
    } catch (error) {
        console.error('Fetch departments error:', error);
        return NextResponse.json(
            { success: false, message: 'Gagal mengambil data divisi' },
            { status: 500 }
        );
    }
}

// POST /api/departments (Tambah Divisi Baru)
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, code, description } = body;

        if (!name || !name.trim()) {
            return NextResponse.json(
                { success: false, message: 'Nama divisi wajib diisi' },
                { status: 400 }
            );
        }

        const trimmedName = name.trim();
        const trimmedCode = code?.trim()?.toUpperCase() || null;

        // Cek duplikasi
        const existing = await pool.query(
            'SELECT id, name, code FROM departments WHERE LOWER(name) = LOWER($1) OR (code IS NOT NULL AND UPPER(code) = $2)',
            [trimmedName, trimmedCode]
        );

        if (existing.rows.length > 0) {
            const isNameMatch = existing.rows[0].name.toLowerCase() === trimmedName.toLowerCase();
            return NextResponse.json(
                {
                    success: false,
                    message: isNameMatch
                        ? 'Divisi dengan nama tersebut sudah terdaftar'
                        : 'Kode divisi tersebut sudah digunakan',
                },
                { status: 400 }
            );
        }

        const insertQuery = `
            INSERT INTO departments (name, code, description)
            VALUES ($1, $2, $3)
            RETURNING id, name, code, description, created_at;
        `;

        const result = await pool.query(insertQuery, [
            trimmedName,
            trimmedCode,
            description?.trim() || null,
        ]);

        return NextResponse.json({
            success: true,
            message: `Divisi ${trimmedName} berhasil didaftarkan!`,
            data: result.rows[0],
        });
    } catch (error) {
        console.error('Create department error:', error);
        return NextResponse.json(
            { success: false, message: 'Gagal mendaftarkan divisi baru' },
            { status: 500 }
        );
    }
}
