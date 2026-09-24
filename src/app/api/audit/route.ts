import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET: Ambil sesi audit yang sedang berlangsung (ongoing)
export async function GET() {
    try {
        const sessionRes = await pool.query(
            `SELECT * FROM audit_sessions WHERE status = 'ongoing' ORDER BY id DESC LIMIT 1;`
        );

        if (sessionRes.rows.length === 0) {
            return NextResponse.json({ success: true, session: null, logs: [] });
        }

        const session = sessionRes.rows[0];

        // Ambil rekap unit yang sudah di-scan pada sesi ini
        const logsRes = await pool.query(
            `SELECT 
        l.id,
        l.scanned_at,
        l.physical_location,
        l.condition,
        l.notes,
        a.asset_tag,
        a.brand,
        a.model,
        u.name AS scanned_by_name
      FROM audit_logs l
      JOIN assets a ON l.asset_id = a.id
      LEFT JOIN users u ON l.scanned_by = u.id
      WHERE l.session_id = $1
      ORDER BY l.scanned_at DESC;`,
            [session.id]
        );

        return NextResponse.json({
            success: true,
            session,
            logs: logsRes.rows,
        });
    } catch (error) {
        console.error('Audit GET error:', error);
        return NextResponse.json(
            { success: false, message: 'Gagal memuat sesi audit' },
            { status: 500 }
        );
    }
}

// POST: Buat sesi audit baru
export async function POST(request: Request) {
    try {
        const { name } = await request.json();

        if (!name) {
            return NextResponse.json(
                { success: false, message: 'Nama sesi audit wajib diisi' },
                { status: 400 }
            );
        }

        const result = await pool.query(
            `INSERT INTO audit_sessions (name, start_date, status)
       VALUES ($1, CURRENT_DATE, 'ongoing')
       RETURNING *;`,
            [name]
        );

        return NextResponse.json({
            success: true,
            data: result.rows[0],
        });
    } catch (error) {
        console.error('Audit POST error:', error);
        return NextResponse.json(
            { success: false, message: 'Gagal membuat sesi audit baru' },
            { status: 500 }
        );
    }
}

// PATCH: Selesaikan / Tutup sesi audit
export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { session_id } = body;

        if (!session_id) {
            return NextResponse.json(
                { success: false, message: 'Session ID wajib disertakan' },
                { status: 400 }
            );
        }

        const result = await pool.query(
            `UPDATE audit_sessions 
       SET status = 'completed', 
           end_date = CURRENT_DATE 
       WHERE id = $1 
       RETURNING *;`,
            [session_id]
        );

        if (result.rows.length === 0) {
            return NextResponse.json(
                { success: false, message: 'Sesi audit tidak ditemukan' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Sesi audit berhasil diselesaikan dan diarsipkan',
            data: result.rows[0],
        });
    } catch (error) {
        console.error('Audit PATCH error:', error);
        return NextResponse.json(
            { success: false, message: 'Gagal menutup sesi audit' },
            { status: 500 }
        );
    }
}