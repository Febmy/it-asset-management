import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET: Ambil seluruh data lisensi software
export async function GET() {
    try {
        const query = `
      SELECT 
        id,
        software_name,
        license_key,
        total_seats,
        expiry_date,
        cost_per_year,
        category,
        provider,
        billing_cycle
      FROM licenses
      ORDER BY id DESC;
    `;

        const result = await pool.query(query);

        return NextResponse.json({
            success: true,
            data: result.rows,
        });
    } catch (error) {
        console.error('Fetch licenses error:', error);
        return NextResponse.json(
            { success: false, message: 'Gagal mengambil data lisensi' },
            { status: 500 }
        );
    }
}

// POST: Tambah data lisensi software baru
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { software_name, license_key, total_seats, expiry_date, cost_per_year, category, provider, billing_cycle } = body;

        if (!software_name) {
            return NextResponse.json(
                { success: false, message: 'Nama software wajib diisi' },
                { status: 400 }
            );
        }

        const query = `
      INSERT INTO licenses (software_name, license_key, total_seats, expiry_date, cost_per_year, category, provider, billing_cycle)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;

        const result = await pool.query(query, [
            software_name.trim(),
            license_key ? license_key.trim() : null,
            Number(total_seats) || 1,
            expiry_date || null,
            Number(cost_per_year) || 0,
            category || 'Software',
            provider ? provider.trim() : null,
            billing_cycle || 'Tahunan'
        ]);

        return NextResponse.json({
            success: true,
            message: 'Lisensi software berhasil ditambahkan',
            data: result.rows[0],
        });
    } catch (error) {
        console.error('Create license error:', error);
        return NextResponse.json(
            { success: false, message: 'Gagal menyimpan data lisensi' },
            { status: 500 }
        );
    }
}

// DELETE: Hapus lisensi software
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { success: false, message: 'ID lisensi wajib disertakan' },
                { status: 400 }
            );
        }

        await pool.query('DELETE FROM licenses WHERE id = $1;', [Number(id)]);

        return NextResponse.json({
            success: true,
            message: 'Lisensi software berhasil dihapus',
        });
    } catch (error) {
        console.error('Delete license error:', error);
        return NextResponse.json(
            { success: false, message: 'Gagal menghapus data lisensi' },
            { status: 500 }
        );
    }
}