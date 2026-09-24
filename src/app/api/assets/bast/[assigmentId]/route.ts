import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
    // Ambil segmen terakhir dari URL secara langsung (contoh: .../bast/4 -> 4)
    const url = new URL(request.url);
    const segments = url.pathname.split('/').filter(Boolean);
    const rawId = segments[segments.length - 1];
    const parsedId = Number(rawId);

    if (!rawId || isNaN(parsedId)) {
        return NextResponse.json(
            { success: false, message: `ID transaksi BAST tidak valid (Diterima: ${rawId})` },
            { status: 400 }
        );
    }

    try {
        const query = `
      SELECT 
        asg.id AS assignment_id,
        asg.assigned_date,
        asg.condition_notes,
        a.asset_tag,
        a.brand,
        a.model,
        a.serial_number,
        a.specs,
        COALESCE(c.name, 'Hardware IT') AS category_name,
        u.name AS user_name,
        u.employee_id,
        u.department,
        u.email
      FROM asset_assignments asg
      JOIN assets a ON asg.asset_id = a.id
      LEFT JOIN asset_categories c ON a.category_id = c.id
      JOIN users u ON asg.user_id = u.id
      WHERE asg.id = $1
      LIMIT 1;
    `;

        const result = await pool.query(query, [parsedId]);

        if (result.rows.length === 0) {
            return NextResponse.json(
                { success: false, message: `Data BAST dengan ID ${parsedId} tidak ditemukan` },
                { status: 404 }
            );
        }

        const data = result.rows[0];
        const dateFormatted = new Date(data.assigned_date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });

        const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>BAST - ${data.asset_tag}</title>
        <style>
          @page { size: A4; margin: 20mm; }
          body { font-family: Arial, sans-serif; font-size: 12px; color: #222; line-height: 1.6; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
          .header h2 { margin: 0; font-size: 15px; text-transform: uppercase; }
          .header p { margin: 3px 0 0; font-size: 11px; color: #555; }
          table { width: 100%; border-collapse: collapse; margin: 16px 0; }
          table, th, td { border: 1px solid #ddd; }
          th, td { padding: 8px 10px; text-align: left; }
          th { background-color: #f8fafc; width: 30%; }
          .terms { font-size: 11px; color: #444; margin-top: 25px; }
          .signatures { display: flex; justify-content: space-between; margin-top: 45px; page-break-inside: avoid; }
          .sign-box { text-align: center; width: 40%; }
          .sign-line { margin-top: 60px; border-bottom: 1px solid #333; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>Berita Acara Serah Terima (BAST) Inventaris IT</h2>
          <p>Nomor: BAST/IT/${new Date(data.assigned_date).getFullYear()}/${String(data.assignment_id).padStart(4, '0')}</p>
        </div>

        <p>Pada hari ini, <strong>${dateFormatted}</strong>, telah dilakukan serah terima unit perangkat operasional kepada:</p>

        <table>
          <tr><th>Nama Karyawan</th><td>${data.user_name} (${data.employee_id})</td></tr>
          <tr><th>Departemen / Email</th><td>${data.department || '-'} / ${data.email}</td></tr>
          <tr><th>Nomor Aset (Tag ID)</th><td><strong>${data.asset_tag}</strong></td></tr>
          <tr><th>Model / Seri Perangkat</th><td>${data.category_name} - ${data.brand} ${data.model}</td></tr>
          <tr><th>Nomor Seri (Serial Number)</th><td>${data.serial_number}</td></tr>
          <tr><th>Spesifikasi</th><td>CPU: ${data.specs?.cpu || '-'} | RAM: ${data.specs?.ram || '-'} | Storage: ${data.specs?.storage || '-'}</td></tr>
          <tr><th>Kondisi & Catatan Fisik</th><td>${data.condition_notes || 'Lengkap & berfungsi normal'}</td></tr>
        </table>

        <div class="terms">
          <strong>Ketentuan & Kewajiban:</strong>
          <ol style="padding-left: 18px; margin: 4px 0;">
            <li>Perangkat wajib dirawat dan hanya dipergunakan untuk keperluan operasional dinas/kantor.</li>
            <li>Kerusakan akibat kelalaian pribadi di luar dinas menjadi tanggung jawab pengguna.</li>
            <li>Unit wajib dikembalikan ke departemen IT saat terjadi pengakhiran masa kerja (offboarding).</li>
          </ol>
        </div>

        <div class="signatures">
          <div class="sign-box">
            <p>Diserahkan oleh,<br><strong>IT Support</strong></p>
            <div class="sign-line"></div>
            <p>( IT Administrator )</p>
          </div>
          <div class="sign-box">
            <p>Diterima oleh,<br><strong>Penerima / Pemakai</strong></p>
            <div class="sign-line"></div>
            <p>( ${data.user_name} )</p>
          </div>
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

        return new NextResponse(htmlContent, {
            status: 200,
            headers: { 'Content-Type': 'text/html' },
        });
    } catch (error) {
        console.error('Generate BAST error:', error);
        return NextResponse.json(
            { success: false, message: 'Gagal membuat dokumen BAST' },
            { status: 500 }
        );
    }
}