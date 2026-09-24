import { NextResponse } from 'next/server';
import pool from '@/lib/db';

interface RouteContext {
    params: Promise<{ id: string }>;
}

// PUT /api/departments/[id] (Edit Divisi)
export async function PUT(request: Request, context: RouteContext) {
    try {
        const { id } = await context.params;
        const deptId = parseInt(id, 10);

        if (isNaN(deptId)) {
            return NextResponse.json(
                { success: false, message: 'ID divisi tidak valid' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { name, code, description } = body;

        if (!name || !name.trim()) {
            return NextResponse.json(
                { success: false, message: 'Nama divisi tidak boleh kosong' },
                { status: 400 }
            );
        }

        const trimmedName = name.trim();
        const trimmedCode = code?.trim()?.toUpperCase() || null;

        // Ambil data divisi saat ini
        const currentRes = await pool.query('SELECT id, name FROM departments WHERE id = $1', [
            deptId,
        ]);
        if (currentRes.rows.length === 0) {
            return NextResponse.json(
                { success: false, message: 'Divisi tidak ditemukan' },
                { status: 404 }
            );
        }
        const oldName = currentRes.rows[0].name;

        // Cek duplikasi nama atau kode dengan divisi lain
        const duplicateRes = await pool.query(
            'SELECT id FROM departments WHERE (LOWER(name) = LOWER($1) OR (code IS NOT NULL AND UPPER(code) = $2)) AND id != $3',
            [trimmedName, trimmedCode, deptId]
        );
        if (duplicateRes.rows.length > 0) {
            return NextResponse.json(
                { success: false, message: 'Nama atau kode divisi sudah digunakan oleh divisi lain' },
                { status: 400 }
            );
        }

        // Update departemen
        const updateDeptQuery = `
            UPDATE departments
            SET name = $1, code = $2, description = $3
            WHERE id = $4
            RETURNING id, name, code, description;
        `;
        const result = await pool.query(updateDeptQuery, [
            trimmedName,
            trimmedCode,
            description?.trim() || null,
            deptId,
        ]);

        // Jika nama berubah, cascade update nama departemen di tabel users
        if (oldName.toLowerCase() !== trimmedName.toLowerCase()) {
            await pool.query(
                'UPDATE users SET department = $1 WHERE LOWER(TRIM(department)) = LOWER(TRIM($2))',
                [trimmedName, oldName]
            );
        }

        return NextResponse.json({
            success: true,
            message: `Divisi ${trimmedName} berhasil diperbarui!`,
            data: result.rows[0],
        });
    } catch (error) {
        console.error('Update department error:', error);
        return NextResponse.json(
            { success: false, message: 'Gagal memperbarui divisi' },
            { status: 500 }
        );
    }
}

// DELETE /api/departments/[id] (Hapus Divisi)
export async function DELETE(request: Request, context: RouteContext) {
    try {
        const { id } = await context.params;
        const deptId = parseInt(id, 10);

        if (isNaN(deptId)) {
            return NextResponse.json(
                { success: false, message: 'ID divisi tidak valid' },
                { status: 400 }
            );
        }

        const deptRes = await pool.query('SELECT id, name FROM departments WHERE id = $1', [
            deptId,
        ]);
        if (deptRes.rows.length === 0) {
            return NextResponse.json(
                { success: false, message: 'Divisi tidak ditemukan' },
                { status: 404 }
            );
        }

        const deptName = deptRes.rows[0].name;

        // Cek apakah ada user/karyawan yang bernaung di divisi ini
        const membersRes = await pool.query(
            'SELECT COUNT(id) as count FROM users WHERE LOWER(TRIM(department)) = LOWER(TRIM($1))',
            [deptName]
        );
        const memberCount = parseInt(membersRes.rows[0].count, 10);

        if (memberCount > 0) {
            return NextResponse.json(
                {
                    success: false,
                    message: `Divisi ${deptName} masih memiliki ${memberCount} karyawan/akun aktif. Pindahkan anggota ke divisi lain terlebih dahulu sebelum menghapus.`,
                },
                { status: 400 }
            );
        }

        await pool.query('DELETE FROM departments WHERE id = $1', [deptId]);

        return NextResponse.json({
            success: true,
            message: `Divisi ${deptName} berhasil dihapus.`,
        });
    } catch (error) {
        console.error('Delete department error:', error);
        return NextResponse.json(
            { success: false, message: 'Gagal menghapus divisi' },
            { status: 500 }
        );
    }
}
