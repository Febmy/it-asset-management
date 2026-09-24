import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        // 1. Hitung ringkasan status aset
        const statsQuery = `
      SELECT 
        COUNT(*) AS total_assets,
        COUNT(*) FILTER (WHERE status = 'deployed') AS deployed_assets,
        COUNT(*) FILTER (WHERE status = 'in_stock') AS instock_assets,
        COUNT(*) FILTER (WHERE status = 'repair') AS repair_assets,
        COUNT(*) FILTER (WHERE status = 'disposed') AS disposed_assets
      FROM assets;
    `;
        const statsRes = await pool.query(statsQuery);

        // 2. Unit dengan garansi mendekati habis (dalam 60 hari ke depan)
        const warrantyQuery = `
      SELECT id, asset_tag, brand, model, warranty_expiry
      FROM assets
      WHERE warranty_expiry IS NOT NULL 
        AND warranty_expiry >= CURRENT_DATE 
        AND warranty_expiry <= CURRENT_DATE + INTERVAL '60 days'
      ORDER BY warranty_expiry ASC
      LIMIT 5;
    `;
        const warrantyRes = await pool.query(warrantyQuery);

        // 3. Aktivitas serah terima terbaru
        const recentAssignmentsQuery = `
      SELECT 
        asg.id,
        asg.assigned_date,
        asg.status,
        a.asset_tag,
        a.brand,
        a.model,
        u.name AS user_name
      FROM asset_assignments asg
      JOIN assets a ON asg.asset_id = a.id
      JOIN users u ON asg.user_id = u.id
      ORDER BY asg.id DESC
      LIMIT 5;
    `;
        const recentAssignmentsRes = await pool.query(recentAssignmentsQuery);

        // 4. Rekap total pengeluaran servis/maintenance
        const costQuery = `
      SELECT COALESCE(SUM(cost), 0) AS total_maintenance_cost
      FROM maintenance_logs;
    `;
        const costRes = await pool.query(costQuery);

        return NextResponse.json({
            success: true,
            data: {
                counts: statsRes.rows[0],
                expiringWarranty: warrantyRes.rows,
                recentAssignments: recentAssignmentsRes.rows,
                totalMaintenanceCost: Number(costRes.rows[0].total_maintenance_cost),
            },
        });
    } catch (error) {
        console.error('Fetch dashboard stats error:', error);
        return NextResponse.json(
            { success: false, message: 'Gagal memuat ringkasan dashboard' },
            { status: 500 }
        );
    }
}