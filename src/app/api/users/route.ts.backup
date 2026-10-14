import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { hashPassword, getSession } from '@/lib/auth';
import type { SystemAccountRole } from '@/types/user';

const ALLOWED_ROLES: SystemAccountRole[] = [
    'director',
    'it_asset_manager',
    'head_it',
    'finance',
    'lead_it_gov',
];

// GET /api/users
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type'); // 'accounts' | 'employees' | 'all'
        const search = searchParams.get('search')?.trim();

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
                (u.password_hash IS NOT NULL) as has_password,
                COUNT(DISTINCT a.id) as assigned_assets_count
            FROM users u
            LEFT JOIN asset_assignments aa ON aa.user_id = u.id AND aa.status = 'active'
            LEFT JOIN assets a ON a.id = aa.asset_id
        `;

        const conditions: string[] = [];
        const params: any[] = [];

        if (type === 'accounts') {
            // Hanya akun login sistem
            conditions.push(`u.role != 'employee'`);
        } else if (type === 'employees') {
            // Hanya master karyawan penerima aset
            conditions.push(`u.role = 'employee'`);
        }

        if (search) {
            params.push(`%${search}%`);
            conditions.push(
                `(u.name ILIKE $${params.length} OR u.email ILIKE $${params.length} OR u.employee_id ILIKE $${params.length} OR u.department ILIKE $${params.length})`
            );
        }

        if (conditions.length > 0) {
            query += ` WHERE ` + conditions.join(' AND ');
        }

        query += ` GROUP BY u.id ORDER BY u.role = 'director' DESC, u.role = 'head_it' DESC, u.role = 'it_asset_manager' DESC, u.name ASC`;

        const result = await pool.query(query, params);

        return NextResponse.json({
            success: true,
            data: result.rows,
        });
    } catch (error) {
        console.error('Fetch users error:', error);
        return NextResponse.json(
            { success: false, message: 'Gagal memuat data akun / pengguna' },
            { status: 500 }
        );
    }
}

// POST /api/users (Pendaftaran Akun Sistem Baru)
export async function POST(request: Request) {
    try {
        const session = await getSession();
        // Hanya akun berwenang yang bisa menambahkan akun baru
        // (director, head_it, it_asset_manager, atau super_admin)
        if (
            session &&
            !['director', 'head_it', 'it_asset_manager', 'super_admin'].includes(session.role)
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Anda tidak memiliki hak akses untuk mendaftarkan akun sistem baru.',
                },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { employee_id, name, email, department, role, password } = body;

        // Validasi input wajib
        if (!employee_id || !employee_id.trim()) {
            return NextResponse.json(
                { success: false, message: 'ID Akun / NIK wajib diisi' },
                { status: 400 }
            );
        }

        if (!name || !name.trim()) {
            return NextResponse.json(
                { success: false, message: 'Nama lengkap wajib diisi' },
                { status: 400 }
            );
        }

        if (!email || !email.trim()) {
            return NextResponse.json(
                { success: false, message: 'Email resmi wajib diisi' },
                { status: 400 }
            );
        }

        if (!password || password.length < 6) {
            return NextResponse.json(
                { success: false, message: 'Password minimal 6 karakter' },
                { status: 400 }
            );
        }

        // Batasan Role: HANYA role resmi yang diperbolehkan!
        if (!ALLOWED_ROLES.includes(role)) {
            return NextResponse.json(
                {
                    success: false,
                    message: `Role tidak valid. Role yang diizinkan hanya: ${ALLOWED_ROLES.join(', ')}`,
                },
                { status: 400 }
            );
        }

        // Cek duplikasi email atau employee_id
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
                        ? 'Email tersebut sudah terdaftar di sistem'
                        : 'ID Akun / NIK tersebut sudah digunakan',
                },
                { status: 400 }
            );
        }

        // Enkripsi Password
        const passwordHash = hashPassword(password);

        const insertQuery = `
            INSERT INTO users (employee_id, name, email, department, role, password_hash, is_active)
            VALUES ($1, $2, $3, $4, $5, $6, TRUE)
            RETURNING id, employee_id, name, email, department, role, is_active, created_at;
        `;

        const result = await pool.query(insertQuery, [
            employee_id.trim().toUpperCase(),
            name.trim(),
            email.trim().toLowerCase(),
            department?.trim() || null,
            role,
            passwordHash,
        ]);

        return NextResponse.json({
            success: true,
            message: `Akun untuk ${name.trim()} (${role}) berhasil didaftarkan!`,
            data: result.rows[0],
        });
    } catch (error) {
        console.error('Create account error:', error);
        return NextResponse.json(
            { success: false, message: 'Terjadi kesalahan sistem saat mendaftarkan akun' },
            { status: 500 }
        );
    }
}

// PUT /api/users (Update data akun atau ganti password / status)
export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, employee_id, name, email, department, role, is_active, new_password } = body;

        if (!id) {
            return NextResponse.json(
                { success: false, message: 'User ID wajib disertakan' },
                { status: 400 }
            );
        }

        // Validasi jika role diubah
        if (role && !ALLOWED_ROLES.includes(role) && role !== 'employee') {
            return NextResponse.json(
                { success: false, message: `Role tidak valid. Pilihan: ${ALLOWED_ROLES.join(', ')}` },
                { status: 400 }
            );
        }

        // Cek duplikasi email atau employee_id pada pengguna lain
        if (email || employee_id) {
            const checkQuery = `
                SELECT id, email, employee_id 
                FROM users 
                WHERE (
                    ($1::text IS NOT NULL AND LOWER(email) = LOWER($1)) OR 
                    ($2::text IS NOT NULL AND UPPER(employee_id) = UPPER($2))
                ) AND id != $3
            `;
            const checkRes = await pool.query(checkQuery, [
                email?.trim() || null,
                employee_id?.trim() || null,
                id,
            ]);

            if (checkRes.rows.length > 0) {
                const isEmail =
                    email && checkRes.rows[0].email.toLowerCase() === email.trim().toLowerCase();
                return NextResponse.json(
                    {
                        success: false,
                        message: isEmail
                            ? 'Email tersebut sudah digunakan oleh akun lain'
                            : 'NIK / ID Akun tersebut sudah digunakan oleh akun lain',
                    },
                    { status: 400 }
                );
            }
        }

        let updateQuery = `
            UPDATE users 
            SET name = COALESCE($1, name),
                email = COALESCE($2, email),
                employee_id = COALESCE($3, employee_id),
                department = COALESCE($4, department),
                role = COALESCE($5, role),
                is_active = COALESCE($6, is_active)
        `;
        const params: any[] = [
            name?.trim() || null,
            email?.trim()?.toLowerCase() || null,
            employee_id?.trim()?.toUpperCase() || null,
            department?.trim() || null,
            role || null,
            typeof is_active === 'boolean' ? is_active : null,
        ];

        if (new_password && new_password.length >= 6) {
            const passwordHash = hashPassword(new_password);
            params.push(passwordHash);
            updateQuery += `, password_hash = $${params.length}`;
        }

        params.push(id);
        updateQuery += ` WHERE id = $${params.length} RETURNING id, employee_id, name, email, department, role, is_active;`;

        const result = await pool.query(updateQuery, params);

        if (result.rows.length === 0) {
            return NextResponse.json(
                { success: false, message: 'Pengguna tidak ditemukan' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Data akun berhasil diperbarui',
            data: result.rows[0],
        });
    } catch (error) {
        console.error('Update user error:', error);
        return NextResponse.json(
            { success: false, message: 'Gagal memperbarui data akun' },
            { status: 500 }
        );
    }
}