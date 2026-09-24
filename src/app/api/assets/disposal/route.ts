import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
    const client = await pool.connect();

    try {
        const body = await request.json();
        const {
            asset_id,
            disposal_type,
            residual_value,
            data_wiped,
            wipe_method,
            reason,
            approved_by,
        } = body;

        if (!asset_id || !disposal_type || !reason) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'ID Aset, metode disposal, dan alasan pemusnahan wajib diisi',
                },
                { status: 400 }
            );
        }

        await client.query('BEGIN');

        // 1. Cek unit aset
        const assetCheck = await client.query(
            `SELECT id, asset_tag, status FROM assets WHERE id = $1 FOR UPDATE;`,
            [asset_id]
        );

        if (assetCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return NextResponse.json(
                { success: false, message: 'Aset tidak ditemukan' },
                { status: 404 }
            );
        }

        const currentAsset = assetCheck.rows[0];

        if (currentAsset.status === 'disposed') {
            await client.query('ROLLBACK');
            return NextResponse.json(
                { success: false, message: 'Aset ini sudah berstatus disposed sebelumnya' },
                { status: 400 }
            );
        }

        // 2. Tutup assignment aktif jika ada
        await client.query(
            `UPDATE asset_assignments
       SET status = 'returned',
           returned_date = CURRENT_DATE,
           condition_notes = CONCAT(COALESCE(condition_notes, ''), ' | Unit dihapus/disposal: ', $1::text)
       WHERE asset_id = $2 AND status = 'active';`,
            [reason, asset_id]
        );

        // 3. Selesaikan tiket servis aktif jika ada
        await client.query(
            `UPDATE maintenance_logs
       SET status = 'completed',
           completion_date = CURRENT_DATE,
           action_taken = CONCAT(COALESCE(action_taken, ''), ' | Dibatalkan karena unit di-disposal')
       WHERE asset_id = $1 AND status = 'in_progress';`,
            [asset_id]
        );

        // 4. Catat riwayat disposal ke tabel asset_disposals
        const insertDisposal = await client.query(
            `INSERT INTO asset_disposals (
        asset_id,
        disposal_type,
        disposal_date,
        residual_value,
        data_wiped,
        wipe_method,
        approved_by,
        reason
      ) VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $6, $7)
      RETURNING id;`,
            [
                asset_id,
                disposal_type,
                Number(residual_value) || 0,
                Boolean(data_wiped),
                wipe_method || null,
                approved_by || null,
                reason,
            ]
        );

        // 5. Ubah status master aset menjadi 'disposed'
        await client.query(
            `UPDATE assets SET status = 'disposed' WHERE id = $1;`,
            [asset_id]
        );

        await client.query('COMMIT');

        return NextResponse.json({
            success: true,
            message: `Aset ${currentAsset.asset_tag} berhasil dihapus/disposed.`,
            data: { disposal_id: insertDisposal.rows[0].id },
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Asset disposal error:', error);
        return NextResponse.json(
            { success: false, message: 'Gagal memproses pemusnahan aset di database' },
            { status: 500 }
        );
    } finally {
        client.release();
    }
}
