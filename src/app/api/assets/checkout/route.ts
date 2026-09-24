import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
    const client = await pool.connect();

    try {
        const body = await request.json();
        const { asset_id, user_id, condition_notes } = body;

        if (!asset_id || !user_id) {
            return NextResponse.json(
                { success: false, message: 'Asset ID dan User ID wajib diisi' },
                { status: 400 }
            );
        }

        await client.query('BEGIN');

        // 1. Cek apakah aset memang berstatus 'in_stock'
        const assetCheck = await client.query(
            `SELECT id, status, asset_tag FROM assets WHERE id = $1 FOR UPDATE`,
            [asset_id]
        );

        if (assetCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return NextResponse.json(
                { success: false, message: 'Aset tidak ditemukan' },
                { status: 404 }
            );
        }

        if (assetCheck.rows[0].status !== 'in_stock') {
            await client.query('ROLLBACK');
            return NextResponse.json(
                { success: false, message: `Unit tidak dapat diserahkan karena status saat ini: ${assetCheck.rows[0].status}` },
                { status: 400 }
            );
        }

        // 2. Buat record peminjaman baru di tabel asset_assignments
        const insertAssignment = await client.query(
            `INSERT INTO asset_assignments (asset_id, user_id, assigned_date, condition_notes, status)
       VALUES ($1, $2, CURRENT_DATE, $3, 'active')
       RETURNING id`,
            [asset_id, user_id, condition_notes || 'Unit diserahkan dalam kondisi baik']
        );

        const assignmentId = insertAssignment.rows[0].id;

        // 3. Ubah status aset menjadi 'deployed'
        await client.query(
            `UPDATE assets SET status = 'deployed' WHERE id = $1`,
            [asset_id]
        );

        await client.query('COMMIT');

        return NextResponse.json({
            success: true,
            message: 'Aset berhasil diserahterimakan',
            data: {
                asset_id,
                assignment_id: assignmentId,
            },
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Checkout error:', error);
        return NextResponse.json(
            { success: false, message: 'Gagal memproses penyerahan unit' },
            { status: 500 }
        );
    } finally {
        client.release();
    }
}