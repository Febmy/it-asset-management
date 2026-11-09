import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { z } from 'zod';

const billingCycles = ['Tahunan', 'Bulanan', 'Triwulanan', 'Semesteran', 'Pay-as-you-go', 'Lifetime'] as const;

// Define Zod schema for license creation and update
const licenseSchema = z.object({
  software_name: z.string().min(1, 'Nama software / layanan wajib diisi'),
  license_key: z.string().optional().nullable(),
  total_seats: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? 1 : Number(val)),
    z.number().int().positive('Total kuota / kursi harus berupa angka positif').optional()
  ),
  start_date: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? null : val),
    z.string().date('Format tanggal mulai tidak valid').nullable().optional()
  ),
  expiry_date: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? null : val),
    z.string().date('Format tanggal jatuh tempo tidak valid').nullable().optional()
  ),
  cost_per_year: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? 0 : Number(val)),
    z.number().min(0, 'Biaya tidak boleh negatif').optional()
  ),
  category: z.string().optional().nullable(),
  provider: z.string().optional().nullable(),
  billing_cycle: z.enum(billingCycles).optional(),
  admin_email: z.string().optional().nullable(),
  auto_renew: z.boolean().optional(),
  notes: z.string().optional().nullable(),
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
        start_date,
        expiry_date,
        cost_per_year,
        category,
        provider,
        billing_cycle,
        admin_email,
        auto_renew,
        notes
      FROM licenses
      ORDER BY 
        CASE 
          WHEN expiry_date IS NULL THEN 2 
          ELSE 1 
        END,
        expiry_date ASC, 
        id DESC;
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

// POST: Tambah data lisensi / langganan software baru
export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Validate request body using Zod
        const validationResult = licenseSchema.safeParse(body);
        if (!validationResult.success) {
            const errorMessage = validationResult.error.issues[0]?.message || 'Data tidak valid';
            return NextResponse.json(
                { success: false, message: errorMessage },
                { status: 400 }
            );
        }

        const {
            software_name,
            license_key,
            total_seats,
            start_date,
            expiry_date,
            cost_per_year,
            category,
            provider,
            billing_cycle,
            admin_email,
            auto_renew,
            notes
        } = validationResult.data;

        const query = `
      INSERT INTO licenses (
        software_name, 
        license_key, 
        total_seats, 
        start_date, 
        expiry_date, 
        cost_per_year, 
        category, 
        provider, 
        billing_cycle, 
        admin_email, 
        auto_renew, 
        notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *;
    `;

        const result = await pool.query(query, [
            software_name.trim(),
            license_key ? license_key.trim() : null,
            total_seats ?? 1,
            start_date || null,
            expiry_date || null,
            cost_per_year ?? 0,
            category || 'Software',
            provider ? provider.trim() : null,
            billing_cycle || 'Tahunan',
            admin_email ? admin_email.trim() : null,
            auto_renew ?? false,
            notes ? notes.trim() : null
        ]);

        return NextResponse.json({
            success: true,
            message: 'Lisensi / langganan software berhasil ditambahkan',
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

// PUT: Perbarui data lisensi / perpanjang langganan
export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const id = body.id;

        if (!id) {
            return NextResponse.json(
                { success: false, message: 'ID lisensi wajib disertakan' },
                { status: 400 }
            );
        }

        const validationResult = licenseSchema.safeParse(body);
        if (!validationResult.success) {
            const errorMessage = validationResult.error.issues[0]?.message || 'Data tidak valid';
            return NextResponse.json(
                { success: false, message: errorMessage },
                { status: 400 }
            );
        }

        const {
            software_name,
            license_key,
            total_seats,
            start_date,
            expiry_date,
            cost_per_year,
            category,
            provider,
            billing_cycle,
            admin_email,
            auto_renew,
            notes
        } = validationResult.data;

        const query = `
      UPDATE licenses
      SET 
        software_name = $1,
        license_key = $2,
        total_seats = $3,
        start_date = $4,
        expiry_date = $5,
        cost_per_year = $6,
        category = $7,
        provider = $8,
        billing_cycle = $9,
        admin_email = $10,
        auto_renew = $11,
        notes = $12
      WHERE id = $13
      RETURNING *;
    `;

        const result = await pool.query(query, [
            software_name.trim(),
            license_key ? license_key.trim() : null,
            total_seats ?? 1,
            start_date || null,
            expiry_date || null,
            cost_per_year ?? 0,
            category || 'Software',
            provider ? provider.trim() : null,
            billing_cycle || 'Tahunan',
            admin_email ? admin_email.trim() : null,
            auto_renew ?? false,
            notes ? notes.trim() : null,
            Number(id)
        ]);

        if (result.rowCount === 0) {
            return NextResponse.json(
                { success: false, message: 'Data lisensi tidak ditemukan' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Data lisensi / langganan berhasil diperbarui',
            data: result.rows[0],
        });
    } catch (error) {
        console.error('Update license error:', error);
        return NextResponse.json(
            { success: false, message: 'Gagal memperbarui data lisensi' },
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
