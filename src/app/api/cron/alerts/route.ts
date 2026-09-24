import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { sendWarrantyAlert } from '@/lib/telegram';

export async function GET(request: Request) {
    try {
        // Optional security check jika CRON_SECRET_TOKEN disertakan di header
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET_TOKEN;
        if (cronSecret && authHeader && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized cron trigger' },
                { status: 401 }
            );
        }

        // 1. Cari unit dengan garansi yang akan habis dalam 60 hari ke depan
        const warrantyQuery = `
      SELECT 
        id, 
        asset_tag, 
        brand, 
        model, 
        warranty_expiry,
        (warranty_expiry - CURRENT_DATE) AS days_left
      FROM assets
      WHERE warranty_expiry IS NOT NULL 
        AND warranty_expiry >= CURRENT_DATE 
        AND warranty_expiry <= CURRENT_DATE + INTERVAL '60 days'
        AND status != 'disposed'
      ORDER BY warranty_expiry ASC;
    `;
        const warrantyRes = await pool.query(warrantyQuery);

        // 2. Format data peringatan
        const expiringAssets = warrantyRes.rows.map((row) => ({
            asset_tag: row.asset_tag,
            brand: row.brand,
            model: row.model,
            days_left: Number(row.days_left),
            warranty_expiry: new Date(row.warranty_expiry).toLocaleDateString('id-ID'),
        }));

        // 3. Kirim notifikasi telegram (jika bot token diset)
        let telegramSent = false;
        if (expiringAssets.length > 0) {
            telegramSent = await sendWarrantyAlert(expiringAssets);
        }

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            data: {
                total_expiring: expiringAssets.length,
                expiring_assets: expiringAssets,
                telegram_dispatched: telegramSent,
            },
        });
    } catch (error) {
        console.error('Cron alert error:', error);
        return NextResponse.json(
            { success: false, message: 'Gagal menjalankan cron alert garansi' },
            { status: 500 }
        );
    }
}
