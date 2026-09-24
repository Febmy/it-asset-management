// src/app/api/assets/checkin/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// PASTIKAN NAMA FUNGSI ADALAH "POST" DENGAN HURUF KAPITAL SEMUA
export async function POST(request: Request) {
    const client = await pool.connect();

    try {
        const body = await request.json();
        const { asset_id, condition_notes, is_damaged, return_proof_url } = body;

        if (!asset_id) {
            return NextResponse.json(
                { success: false, message: 'Asset ID wajib diisi' },
                { status: 400 }
            );
        }

        await client.query('BEGIN');

        // 1. Ambil transaksi peminjaman aktif untuk aset ini
        const activeAssignment = await client.query(
            `SELECT id FROM asset_assignments 
       WHERE asset_id = $1 AND status = 'active' 
       FOR UPDATE`,
            [asset_id]
        );

        if (activeAssignment.rows.length === 0) {
            await client.query('ROLLBACK');
            return NextResponse.json(
                { success: false, message: 'Tidak ada status peminjaman aktif untuk aset ini' },
                { status: 400 }
            );
        }

        const assignmentId = activeAssignment.rows[0].id;
        const newAssetStatus = is_damaged ? 'repair' : 'in_stock';

        // 2. Perbarui status riwayat penyerahan menjadi returned
        await client.query(
            `UPDATE asset_assignments 
       SET status = 'returned',
           returned_date = CURRENT_DATE,
           condition_notes = CONCAT(COALESCE(condition_notes, ''), ' | Pengembalian: ', $1::text),
           return_proof_url = COALESCE($3, return_proof_url)
       WHERE id = $2`,
            [condition_notes || 'Kondisi baik/lengkap', assignmentId, return_proof_url || null]
        );

        // 3. Kembalikan status aset di master
        await client.query(
            `UPDATE assets 
       SET status = $1 
       WHERE id = $2`,
            [newAssetStatus, asset_id]
        );

        await client.query('COMMIT');

        return NextResponse.json({
            success: true,
            message: `Aset berhasil ditarik. Status kini: ${newAssetStatus}`,
            data: { asset_id, new_status: newAssetStatus }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Checkin Error:', error);
        return NextResponse.json(
            { success: false, message: 'Gagal memproses penarikan di database' },
            { status: 500 }
        );
    } finally {
        client.release();
    }
}