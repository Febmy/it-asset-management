// src/app/api/assets/scan/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get('tag');

    if (!tag) {
        return NextResponse.json({ success: false, message: 'Tag aset wajib diisi' }, { status: 400 });
    }

    try {
        const query = `
      SELECT 
        a.id,
        a.asset_tag,
        c.name AS category,
        a.brand,
        a.model,
        a.serial_number,
        a.specs,
        a.status,
        a.warranty_expiry,
        u.name AS current_user_name,
        u.email AS current_user_email,
        u.department AS current_user_dept,
        asg.assigned_date,
        asg.condition_notes AS handover_condition
      FROM assets a
      LEFT JOIN asset_categories c ON a.category_id = c.id
      LEFT JOIN LATERAL (
        SELECT user_id, assigned_date, condition_notes
        FROM asset_assignments
        WHERE asset_id = a.id AND status = 'active'
        ORDER BY id DESC
        LIMIT 1
      ) asg ON true
      LEFT JOIN users u ON asg.user_id = u.id
      WHERE a.asset_tag = $1
      LIMIT 1;
    `;

        const result = await pool.query(query, [tag]);

        if (result.rows.length === 0) {
            return NextResponse.json({ success: false, message: 'Aset tidak ditemukan' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Scan Error:', error);
        return NextResponse.json({ success: false, message: 'Koneksi database bermasalah' }, { status: 500 });
    }
}