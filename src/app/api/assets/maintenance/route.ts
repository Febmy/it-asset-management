import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { z } from 'zod';

// Define Zod schemas for maintenance request bodies
const maintenanceCreateSchema = z.object({
  asset_id: z.union([z.string(), z.number()]).transform((val) => Number(val)),
  issue_description: z.string().min(1, 'Deskripsi kendala wajib diisi'),
  vendor_name: z.string().optional(),
  cost: z.preprocess(
    (val) => (val === '' || val === undefined ? undefined : Number(val)),
    z.number().min(0, 'Biaya tidak boleh negatif').optional()
  )
});

const maintenanceUpdateSchema = z.object({
  maintenance_id: z.union([z.string(), z.number()]).optional(),
  asset_id: z.union([z.string(), z.number()]).optional(),
  action_taken: z.string().optional(),
  final_cost: z.preprocess(
    (val) => (val === '' || val === undefined ? undefined : Number(val)),
    z.number().min(0, 'Biaya tidak boleh negatif').optional()
  ),
  target_status: z.enum(['deployed', 'in_stock']).optional(),
  invoice_proof_url: z.string().url().optional()
});

// POST: Daftarkan aset ke antrean perbaikan / vendor
export async function POST(request: Request) {
    const client = await pool.connect();

    try {
        const body = await request.json();

        // Validate request body using Zod
        const validationResult = maintenanceCreateSchema.safeParse(body);
        if (!validationResult.success) {
            // Return the first error message for simplicity
            const errorMessage = validationResult.error.issues[0].message;
            return NextResponse.json(
                { success: false, message: errorMessage },
                { status: 400 }
            );
        }

        const { asset_id, issue_description, vendor_name, cost } = validationResult.data;

        await client.query('BEGIN');

        // 1. Buat catatan tiket di maintenance_logs
        const logResult = await client.query(
            `INSERT INTO maintenance_logs (asset_id, issue_description, vendor_name, cost, start_date, status)
       VALUES ($1, $2, $3, $4, CURRENT_DATE, 'in_progress')
       RETURNING id;`,
            [asset_id, issue_description, vendor_name || null, cost ?? 0]
        );

        // 2. Ubah status aset menjadi 'repair'
        await client.query(
            `UPDATE assets SET status = 'repair' WHERE id = $1;`,
            [asset_id]
        );

        await client.query('COMMIT');

        return NextResponse.json({
            success: true,
            message: 'Tiket servis berhasil dicatat. Status unit kini "repair".',
            data: { maintenance_id: logResult.rows[0].id },
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Maintenance error:', error);
        return NextResponse.json(
            { success: false, message: 'Gagal membuat tiket perbaikan' },
            { status: 500 }
        );
    } finally {
        client.release();
    }
}

// PATCH: Selesaikan servis dengan pilihan status target ('deployed' atau 'in_stock')
export async function PATCH(request: Request) {
    const client = await pool.connect();

    try {
        const body = await request.json();

        // Validate request body using Zod
        const validationResult = maintenanceUpdateSchema.safeParse(body);
        if (!validationResult.success) {
            // Return the first error message for simplicity
            const errorMessage = validationResult.error.issues[0].message;
            return NextResponse.json(
                { success: false, message: errorMessage },
                { status: 400 }
            );
        }

        const { maintenance_id, asset_id, action_taken, final_cost, target_status, invoice_proof_url } = validationResult.data;

        // At least one of maintenance_id or asset_id must be provided
        if (!maintenance_id && !asset_id) {
            return NextResponse.json(
                { success: false, message: 'ID Tiket Servis atau ID Aset wajib diisi' },
                { status: 400 }
            );
        }

        await client.query('BEGIN');

        let targetAssetId = asset_id;
        const nextStatus = target_status === 'deployed' ? 'deployed' : 'in_stock';

        if (maintenance_id) {
            // 1. Selesaikan tiket maintenance
            const updateLog = await client.query(
                `UPDATE maintenance_logs
           SET status = 'completed',
               completion_date = CURRENT_DATE,
               action_taken = $1,
               cost = COALESCE($2, cost),
               invoice_proof_url = COALESCE($4, invoice_proof_url)
           WHERE id = $3
           RETURNING asset_id;`,
                [action_taken || 'Perbaikan selesai', final_cost ?? null, maintenance_id, invoice_proof_url || null]
            );

            if (updateLog.rows.length === 0) {
                await client.query('ROLLBACK');
                return NextResponse.json(
                    { success: false, message: 'Data tiket servis tidak ditemukan' },
                    { status: 404 }
                );
            }
            targetAssetId = updateLog.rows[0].asset_id;
        }

        // 2. Sinkronkan status aset fisik
        await client.query(
            `UPDATE assets SET status = $1 WHERE id = $2;`,
            [nextStatus, targetAssetId]
        );

        // 3. Jika kembali ke gudang (in_stock), tutup assignment aktif yang lama (bila ada)
        if (nextStatus === 'in_stock') {
            await client.query(
                `UPDATE asset_assignments
         SET status = 'returned',
             returned_date = CURRENT_DATE
         WHERE asset_id = $1 AND status = 'active';`,
                [targetAssetId]
            );
        }

        await client.query('COMMIT');

        return NextResponse.json({
            success: true,
            message: `Unit selesai diperbaiki dan status diubah menjadi "${nextStatus}".`,
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Update maintenance error:', error);
        return NextResponse.json(
            { success: false, message: 'Gagal memperbarui status perbaikan' },
            { status: 500 }
        );
    } finally {
        client.release();
    }
}