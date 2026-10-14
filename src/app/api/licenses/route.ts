import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { z } from 'zod';

// Define Zod schema for license creation request body
const licenseCreateSchema = z.object({
  software_name: z.string().min(1, 'Nama software wajib diisi'),
  license_key: z.string().optional(),
  total_seats: z.preprocess(
    (val) => (val === '' || val === undefined ? undefined : Number(val)),
    z.number().int().positive('Total kursi harus berupa angka positif').optional()
  ),
  expiry_date: z.string().date('Format tanggal tidak valid').optional(),
  cost_per_year: z.preprocess(
    (val) => (val === '' || val === undefined ? undefined : Number(val)),
    z.number().min(0, 'Biaya tidak boleh negatif').optional()
  ),
  category: z.string().optional(),
  provider: z.string().optional(),
  billing_cycle: z.enum(['Tahunan', 'Bulanan', 'Triwulanan', 'Semesteran']).optional()
});

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

        // Validate request body using Zod
        const validationResult = licenseCreateSchema.safeParse(body);
        if (!validationResult.success) {
            // Return the first error message for simplicity
            const errorMessage = validationResult.error.issues[0].message;
            return NextResponse.json(
                { success: false, message: errorMessage },
                { status: 400 }
            );
        }

        const { software_name, license_key, total_seats, expiry_date, cost_per_year, category, provider, billing_cycle } = validationResult.data;

        const query = `
      INSERT INTO licenses (software_name, license_key, total_seats, expiry_date, cost_per_year, category, provider, billing_cycle)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;

        const result = await pool.query(query, [
            software_name.trim(),
            license_key ? license_key.trim() : null,
            total_seats ?? 1,
            expiry_date || null,
            cost_per_year ?? 0,
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