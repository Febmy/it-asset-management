import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const query = `
      SELECT id, name, code 
      FROM asset_categories 
      ORDER BY id ASC;
    `;

        const result = await pool.query(query);

        return NextResponse.json({
            success: true,
            data: result.rows,
        });
    } catch (error) {
        console.error('Fetch categories error:', error);
        return NextResponse.json(
            { success: false, message: 'Gagal mengambil data kategori' },
            { status: 500 }
        );
    }
}
