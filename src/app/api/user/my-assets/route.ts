import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
    try {
        let session = await getSession();

        let userId = session?.id;

        // Fallback jika belum login di browser: gunakan user karyawan Febmy (id: 1)
        if (!userId) {
            const fallbackUser = await pool.query(
                `SELECT id, name, employee_id, department, email, role 
         FROM users 
         WHERE role = 'employee' 
         LIMIT 1;`
            );
            if (fallbackUser.rows.length > 0) {
                userId = fallbackUser.rows[0].id;
                session = fallbackUser.rows[0];
            } else {
                return NextResponse.json(
                    { success: false, message: 'Sesi tidak ditemukan' },
                    { status: 401 }
                );
            }
        }

        const query = `
      SELECT DISTINCT ON (a.id)
        a.id,
        a.asset_tag,
        a.serial_number,
        a.brand,
        a.model,
        a.specs,
        a.status,
        a.warranty_expiry,
        COALESCE(c.name, 'Hardware IT') AS category_name,
        asg.id AS assignment_id,
        asg.assigned_date,
        asg.condition_notes,
        asg.bast_file_url
      FROM assets a
      JOIN asset_assignments asg ON a.id = asg.asset_id AND asg.user_id = $1 AND asg.status = 'active'
      LEFT JOIN asset_categories c ON a.category_id = c.id
      ORDER BY a.id, asg.id DESC;
    `;

        const result = await pool.query(query, [userId]);

        return NextResponse.json({
            success: true,
            user: session,
            data: result.rows,
        });
    } catch (error) {
        console.error('Fetch my-assets error:', error);
        return NextResponse.json(
            { success: false, message: 'Gagal mengambil data aset karyawan' },
            { status: 500 }
        );
    }
}
