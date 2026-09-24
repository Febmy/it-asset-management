import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { session_id, asset_tag, physical_location, condition, notes, user_id } = body;

        if (!session_id || !asset_tag) {
            return NextResponse.json(
                { success: false, message: 'Session ID dan Tag Aset wajib diisi' },
                { status: 400 }
            );
        }

        // 1. Cari data aset berdasarkan asset_tag
        const assetRes = await pool.query(
            `SELECT id, brand, model FROM assets WHERE asset_tag = $1 LIMIT 1;`,
            [asset_tag.trim()]
        );

        if (assetRes.rows.length === 0) {
            return NextResponse.json(
                { success: false, message: `Tag Aset "${asset_tag}" tidak ditemukan di database` },
                { status: 404 }
            );
        }

        const asset = assetRes.rows[0];

        // 2. Simpan atau perbarui log audit (Upsert berdasarkan session_id & asset_id)
        const logRes = await pool.query(
            `INSERT INTO audit_logs (session_id, asset_id, scanned_by, physical_location, condition, notes, scanned_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
       ON CONFLICT (session_id, asset_id) 
       DO UPDATE SET 
         scanned_at = CURRENT_TIMESTAMP,
         physical_location = EXCLUDED.physical_location,
         condition = EXCLUDED.condition,
         notes = EXCLUDED.notes
       RETURNING id;`,
            [
                session_id,
                asset.id,
                user_id || 1, // Fallback default admin
                physical_location || 'Kantor Utama',
                condition || 'good',
                notes || null,
            ]
        );

        return NextResponse.json({
            success: true,
            message: `Aset ${asset_tag} (${asset.brand} ${asset.model}) berhasil diverifikasi!`,
            data: { log_id: logRes.rows[0].id, asset },
        });
    } catch (error) {
        console.error('Audit scan error:', error);
        return NextResponse.json(
            { success: false, message: 'Gagal memproses verifikasi opname' },
            { status: 500 }
        );
    }
}