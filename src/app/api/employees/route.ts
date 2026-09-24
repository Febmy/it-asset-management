import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/employees (Master data karyawan penerima aset)
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search')?.trim();
        const department = searchParams.get('department')?.trim();

        let query = `
            SELECT 
                u.id, 
                u.employee_id, 
                u.name, 
                u.email, 
                u.department, 
                u.role, 
                u.is_active, 
                u.created_at,
                COUNT(DISTINCT aa.id) FILTER (WHERE aa.status = 'active') as active_assets_count,
                COALESCE(
                    (
                        SELECT JSON_AGG(
                            JSON_BUILD_OBJECT(
                                'id', a2.id,
                                'asset_tag', a2.asset_tag,
                                'brand', a2.brand,
                                'model', a2.model
                            )
                        )
                        FROM asset_assignments aa2
                        JOIN assets a2 ON a2.id = aa2.asset_id
                        WHERE aa2.user_id = u.id AND aa2.status = 'active'
                    ),
                    '[]'::json
                ) as assigned_assets
            FROM users u
            LEFT JOIN asset_assignments aa ON aa.user_id = u.id AND aa.status = 'active'
            WHERE u.role = 'employee'
        `;

        const conditions: string[] = [];
        const params: any[] = [];

        if (search) {
            params.push(`%${search}%`);
            conditions.push(
                `(u.name ILIKE $${params.length} OR u.email ILIKE $${params.length} OR u.employee_id ILIKE $${params.length})`
            );
        }

        if (department && department !== 'all') {
            params.push(department);
            conditions.push(`u.department = $${params.length}`);
        }

        if (conditions.length > 0) {
            query += ` AND ` + conditions.join(' AND ');
        }

        query += ` GROUP BY u.id ORDER BY u.name ASC`;

        const result = await pool.query(query, params);

        return NextResponse.json({
            success: true,
            data: result.rows,
        });
    } catch (error) {
        console.error('Fetch employees error:', error);
        return NextResponse.json(
            { success: false, message: 'Gagal mengambil master data karyawan' },
            { status: 500 }
        );
    }
}

// POST /api/employees (Registrasi Karyawan Baru - Tanpa Akun/Password)
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { employee_id, name, email, department } = body;

        if (!employee_id || !employee_id.trim()) {
            return NextResponse.json(
                { success: false, message: 'ID Karyawan / NIK wajib diisi' },
                { status: 400 }
            );
        }

        if (!name || !name.trim()) {
            return NextResponse.json(
                { success: false, message: 'Nama lengkap karyawan wajib diisi' },
                { status: 400 }
            );
        }

        if (!email || !email.trim()) {
            return NextResponse.json(
                { success: false, message: 'Email karyawan wajib diisi' },
                { status: 400 }
            );
        }

        if (!department || !department.trim()) {
            return NextResponse.json(
                { success: false, message: 'Divisi / Departemen wajib dipilih' },
                { status: 400 }
            );
        }

        // Cek duplikasi
        const existing = await pool.query(
            'SELECT id, email, employee_id FROM users WHERE LOWER(email) = LOWER($1) OR UPPER(employee_id) = UPPER($2)',
            [email.trim(), employee_id.trim()]
        );

        if (existing.rows.length > 0) {
            const isEmail = existing.rows[0].email.toLowerCase() === email.trim().toLowerCase();
            return NextResponse.json(
                {
                    success: false,
                    message: isEmail
                        ? 'Email karyawan sudah terdaftar'
                        : 'ID Karyawan sudah terdaftar dalam master data',
                },
                { status: 400 }
            );
        }

        // Insert tanpa password_hash dan role = 'employee'
        const insertQuery = `
            INSERT INTO users (employee_id, name, email, department, role, password_hash, is_active)
            VALUES ($1, $2, $3, $4, 'employee', NULL, TRUE)
            RETURNING id, employee_id, name, email, department, role, is_active, created_at;
        `;

        const result = await pool.query(insertQuery, [
            employee_id.trim().toUpperCase(),
            name.trim(),
            email.trim().toLowerCase(),
            department.trim(),
        ]);

        return NextResponse.json({
            success: true,
            message: `Karyawan ${name.trim()} (${department.trim()}) berhasil ditambahkan ke master data!`,
            data: result.rows[0],
        });
    } catch (error) {
        console.error('Create employee error:', error);
        return NextResponse.json(
            { success: false, message: 'Gagal mendaftarkan karyawan baru' },
            { status: 500 }
        );
    }
}

// PUT /api/employees (Update Data Karyawan)
export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, employee_id, name, email, department } = body;

        if (!id) {
            return NextResponse.json(
                { success: false, message: 'ID Karyawan wajib disertakan' },
                { status: 400 }
            );
        }

        if (!name || !name.trim() || !email || !email.trim() || !employee_id || !employee_id.trim()) {
            return NextResponse.json(
                { success: false, message: 'Nama, Email, dan NIK karyawan wajib diisi' },
                { status: 400 }
            );
        }

        // Cek duplikasi email atau employee_id pada pengguna lain
        const duplicateCheck = await pool.query(
            'SELECT id, email, employee_id FROM users WHERE (LOWER(email) = LOWER($1) OR UPPER(employee_id) = UPPER($2)) AND id != $3',
            [email.trim(), employee_id.trim(), id]
        );

        if (duplicateCheck.rows.length > 0) {
            const isEmail = duplicateCheck.rows[0].email.toLowerCase() === email.trim().toLowerCase();
            return NextResponse.json(
                {
                    success: false,
                    message: isEmail
                        ? 'Email tersebut sudah digunakan oleh data pengguna lain'
                        : 'NIK / ID Karyawan sudah digunakan oleh pengguna lain',
                },
                { status: 400 }
            );
        }

        const updateQuery = `
            UPDATE users
            SET employee_id = $1, name = $2, email = $3, department = $4
            WHERE id = $5 AND role = 'employee'
            RETURNING id, employee_id, name, email, department, role, is_active;
        `;

        const result = await pool.query(updateQuery, [
            employee_id.trim().toUpperCase(),
            name.trim(),
            email.trim().toLowerCase(),
            department?.trim() || null,
            id,
        ]);

        if (result.rows.length === 0) {
            return NextResponse.json(
                { success: false, message: 'Data karyawan tidak ditemukan' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `Data karyawan ${name.trim()} berhasil diperbarui!`,
            data: result.rows[0],
        });
    } catch (error) {
        console.error('Update employee error:', error);
        return NextResponse.json(
            { success: false, message: 'Gagal memperbarui data karyawan' },
            { status: 500 }
        );
    }
}

