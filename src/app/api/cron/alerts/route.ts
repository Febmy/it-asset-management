import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { sendWarrantyAlert, sendLicenseExpiryAlert } from '@/lib/telegram';

export async function GET(request: Request) {
    try {
        // Required security check for CRON_SECRET_TOKEN
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET_TOKEN;
        if (!cronSecret) {
            throw new Error('CRON_SECRET_TOKEN environment variable is required');
        }
        if (authHeader !== `Bearer ${cronSecret}`) {
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

        const expiringAssets = warrantyRes.rows.map((row) => ({
            asset_tag: row.asset_tag,
            brand: row.brand,
            model: row.model,
            days_left: Number(row.days_left),
            warranty_expiry: new Date(row.warranty_expiry).toLocaleDateString('id-ID'),
        }));

        // 2. Cari lisensi & langganan software yang akan jatuh tempo dalam 30 hari ke depan
        const licenseQuery = `
      SELECT 
        id, 
        software_name, 
        provider, 
        expiry_date,
        (expiry_date - CURRENT_DATE) AS days_left
      FROM licenses
      WHERE expiry_date IS NOT NULL 
        AND expiry_date >= CURRENT_DATE 
        AND expiry_date <= CURRENT_DATE + INTERVAL '30 days'
      ORDER BY expiry_date ASC;
    `;
        const licenseRes = await pool.query(licenseQuery);

        const expiringLicenses = licenseRes.rows.map((row) => ({
            software_name: row.software_name,
            provider: row.provider,
            days_left: Number(row.days_left),
            expiry_date: new Date(row.expiry_date).toLocaleDateString('id-ID'),
        }));

        // 3. Kirim notifikasi telegram (jika bot token diset)
        let warrantyTelegramSent = false;
        let licenseTelegramSent = false;

        if (expiringAssets.length > 0) {
            warrantyTelegramSent = await sendWarrantyAlert(expiringAssets);
        }

        if (expiringLicenses.length > 0) {
            licenseTelegramSent = await sendLicenseExpiryAlert(expiringLicenses);
        }

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            data: {
                total_expiring_assets: expiringAssets.length,
                expiring_assets: expiringAssets,
                warranty_telegram_dispatched: warrantyTelegramSent,
                total_expiring_licenses: expiringLicenses.length,
                expiring_licenses: expiringLicenses,
                license_telegram_dispatched: licenseTelegramSent,
            },
        });
    } catch (error) {
        console.error('Cron alert error:', error);
        return NextResponse.json(
            { success: false, message: 'Gagal menjalankan cron alert garansi & lisensi' },
            { status: 500 }
        );
    }
}
