import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    const resolvedParams = await Promise.resolve(context.params);
    const assetId = Number(resolvedParams.id);

    if (!assetId || isNaN(assetId)) {
        return NextResponse.json(
            { success: false, message: 'ID Aset tidak valid' },
            { status: 400 }
        );
    }

    try {
        // 1. Data utama unit aset dengan LEFT JOIN LATERAL
        const assetQuery = `
      SELECT 
        a.*,
        c.name AS category_name,
        u.name AS current_user_name,
        u.employee_id AS current_user_emp_id,
        u.department AS current_user_dept
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
      WHERE a.id = $1
      LIMIT 1;
    `;
        const assetRes = await pool.query(assetQuery, [assetId]);

        if (assetRes.rows.length === 0) {
            return NextResponse.json(
                { success: false, message: 'Aset tidak ditemukan' },
                { status: 404 }
            );
        }

        // 2. Riwayat penyerahan unit (Assignment History)
        const assignmentsQuery = `
      SELECT 
        asg.id,
        asg.assigned_date,
        asg.returned_date,
        asg.condition_notes,
        asg.bast_file_url,
        asg.return_proof_url,
        asg.status,
        u.name AS user_name,
        u.employee_id,
        u.department
      FROM asset_assignments asg
      JOIN users u ON asg.user_id = u.id
      WHERE asg.asset_id = $1
      ORDER BY asg.id DESC;
    `;
        const assignmentsRes = await pool.query(assignmentsQuery, [assetId]);

        // 3. Riwayat perbaikan / servis (Maintenance Logs)
        const maintenanceQuery = `
      SELECT 
        id,
        issue_description,
        vendor_name,
        cost,
        start_date,
        completion_date,
        action_taken,
        invoice_proof_url,
        status
      FROM maintenance_logs
      WHERE asset_id = $1
      ORDER BY id DESC;
    `;
        const maintenanceRes = await pool.query(maintenanceQuery, [assetId]);

        // 4. Data disposal jika ada
        const disposalQuery = `
      SELECT 
        d.*,
        u.name AS approved_by_name
      FROM asset_disposals d
      LEFT JOIN users u ON d.approved_by = u.id
      WHERE d.asset_id = $1
      ORDER BY d.id DESC
      LIMIT 1;
    `;
        const disposalRes = await pool.query(disposalQuery, [assetId]);

        return NextResponse.json({
            success: true,
            data: {
                asset: assetRes.rows[0],
                assignments: assignmentsRes.rows,
                maintenance: maintenanceRes.rows,
                disposal: disposalRes.rows[0] || null,
            },
        });
    } catch (error) {
        console.error('Fetch asset detail error:', error);
        return NextResponse.json(
            { success: false, message: 'Gagal memuat detail aset' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: Request,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    const resolvedParams = await Promise.resolve(context.params);
    const assetId = Number(resolvedParams.id);

    if (!assetId || isNaN(assetId)) {
        return NextResponse.json(
            { success: false, message: 'ID Aset tidak valid' },
            { status: 400 }
        );
    }

    try {
        const body = await request.json();
        const { brand, model, serial_number, specs, warranty_expiry, purchase_date, image_url, proof_doc_url, proof_notes } = body;

        const query = `
      UPDATE assets 
      SET 
        brand = COALESCE($1, brand),
        model = COALESCE($2, model),
        serial_number = COALESCE($3, serial_number),
        specs = COALESCE($4, specs),
        warranty_expiry = $5,
        purchase_date = $6,
        image_url = COALESCE($7, image_url),
        proof_doc_url = COALESCE($8, proof_doc_url),
        proof_notes = COALESCE($9, proof_notes)
      WHERE id = $10
      RETURNING *;
    `;

        const result = await pool.query(query, [
            brand?.trim() || null,
            model?.trim() || null,
            serial_number?.trim() || null,
            specs ? JSON.stringify(specs) : null,
            warranty_expiry || null,
            purchase_date || null,
            image_url !== undefined ? image_url : null,
            proof_doc_url !== undefined ? proof_doc_url : null,
            proof_notes !== undefined ? proof_notes : null,
            assetId,
        ]);

        if (result.rows.length === 0) {
            return NextResponse.json(
                { success: false, message: 'Aset tidak ditemukan' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Informasi aset berhasil diperbarui',
            data: result.rows[0],
        });
    } catch (error: any) {
        console.error('Update asset error:', error);
        if (error.code === '23505') {
            return NextResponse.json(
                { success: false, message: 'Serial number sudah digunakan oleh perangkat lain' },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { success: false, message: 'Gagal memperbarui data aset' },
            { status: 500 }
        );
    }
}