import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET: Ambil daftar seluruh aset dengan filter & pencarian
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q') || '';
    const status = searchParams.get('status') || '';
    const categoryId = searchParams.get('category') || '';

    try {
        let query = `
      SELECT 
        a.id,
        a.asset_tag,
        a.serial_number,
        a.brand,
        a.model,
        a.specs,
        a.status,
        a.warranty_expiry,
        a.image_url,
        a.proof_doc_url,
        c.name AS category_name,
        u.name AS assigned_to,
        u.department AS user_department
      FROM assets a
      LEFT JOIN asset_categories c ON a.category_id = c.id
      LEFT JOIN LATERAL (
        SELECT user_id
        FROM asset_assignments
        WHERE asset_id = a.id AND status = 'active'
        ORDER BY id DESC
        LIMIT 1
      ) asg ON true
      LEFT JOIN users u ON asg.user_id = u.id
      WHERE 1=1
    `;

        const values: (string | number)[] = [];
        let paramIndex = 1;

        if (search.trim()) {
            query += ` AND (
        a.asset_tag ILIKE $${paramIndex} OR 
        a.serial_number ILIKE $${paramIndex} OR 
        a.model ILIKE $${paramIndex} OR
        u.name ILIKE $${paramIndex}
      )`;
            values.push(`%${search.trim()}%`);
            paramIndex++;
        }

        if (status) {
            query += ` AND a.status = $${paramIndex}`;
            values.push(status);
            paramIndex++;
        }

        if (categoryId) {
            query += ` AND a.category_id = $${paramIndex}`;
            values.push(Number(categoryId));
            paramIndex++;
        }

        query += ` ORDER BY a.id DESC;`;

        const result = await pool.query(query, values);

        return NextResponse.json({
            success: true,
            data: result.rows,
        });
    } catch (error) {
        console.error('Fetch assets error:', error);
        return NextResponse.json(
            { success: false, message: 'Gagal mengambil data inventaris aset' },
            { status: 500 }
        );
    }
}

// POST: Tambah aset fisik baru secara manual
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            asset_tag,
            category_id,
            serial_number,
            brand,
            model,
            specs,
            warranty_expiry,
            purchase_date,
            image_url,
            proof_doc_url,
        } = body;

        if (!asset_tag || !serial_number || !brand || !model || !category_id) {
            return NextResponse.json(
                { success: false, message: 'Semua kolom wajib harus diisi' },
                { status: 400 }
            );
        }

        const query = `
      INSERT INTO assets (
        asset_tag, 
        category_id, 
        serial_number, 
        brand, 
        model, 
        specs, 
        warranty_expiry, 
        purchase_date, 
        image_url,
        proof_doc_url,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'in_stock')
      RETURNING id, asset_tag;
    `;

        const result = await pool.query(query, [
            asset_tag.trim(),
            Number(category_id),
            serial_number.trim(),
            brand.trim(),
            model.trim(),
            specs ? JSON.stringify(specs) : null,
            warranty_expiry || null,
            purchase_date || null,
            image_url || null,
            proof_doc_url || null,
        ]);

        return NextResponse.json({
            success: true,
            message: 'Aset baru berhasil ditambahkan',
            data: result.rows[0],
        });
    } catch (error: any) {
        console.error('Insert asset error:', error);
        if (error.code === '23505') {
            return NextResponse.json(
                { success: false, message: 'Nomor Asset Tag atau Serial Number sudah terdaftar' },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { success: false, message: 'Gagal menambahkan aset ke database' },
            { status: 500 }
        );
    }
}