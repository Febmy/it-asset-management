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
          @page { size: A4; margin: 15mm 20mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #1e293b; line-height: 1.6; }
          .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
          .company-title { font-size: 15px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; color: #0f172a; margin: 0; }
          .company-sub { font-size: 10px; color: #64748b; margin: 2px 0 10px; }
          .doc-title { margin: 6px 0 0; font-size: 14px; text-transform: uppercase; font-weight: 700; color: #1e293b; }
          .doc-num { margin: 2px 0 0; font-size: 11px; color: #475569; font-family: Consolas, monospace; }
          table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 12px; }
          table, th, td { border: 1px solid #cbd5e1; }
          th, td { padding: 7px 10px; text-align: left; }
          th { background-color: #f8fafc; width: 28%; font-weight: 600; color: #334155; }
          .terms { font-size: 11px; color: #475569; margin-top: 20px; }
          .terms ol { padding-left: 18px; margin: 4px 0; }
          .signatures { display: flex; justify-content: space-between; margin-top: 40px; page-break-inside: avoid; gap: 20px; }
          .sign-box { text-align: center; flex: 1; }
          .sign-title { font-size: 11px; color: #475569; margin: 0; }
          .sign-role { font-weight: 700; font-size: 11px; color: #0f172a; margin: 2px 0 0; }
          .sign-line { margin-top: 60px; border-bottom: 1px solid #475569; }
          .sign-name { font-weight: 700; font-size: 11px; margin: 4px 0 0; color: #0f172a; font-family: monospace; }
          .sign-dept { font-size: 10px; color: #64748b; margin: 1px 0 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <p class="company-title">PT. AKASANET BUMI NUSANTARA</p>
          <p class="company-sub">Divisi Teknologi Informasi & Manajemen Aset Perusahaan</p>
          <h2 class="doc-title">Berita Acara Serah Terima (BAST) Inventaris IT</h2>
          <p class="doc-num">Nomor: BAST/IT/${new Date(data.assigned_date).getFullYear()}/${String(data.assignment_id).padStart(4, '0')}</p>
        </div>

        <p style="margin: 0 0 10px;">Pada hari ini, <strong>${dateFormatted}</strong>, telah diserahkan 1 (satu) unit perangkat kerja dinas operasional kepada:</p>

        <table>
          <tr><th>Nama Karyawan Penerima</th><td><strong>${data.user_name}</strong> (NIK: ${data.employee_id})</td></tr>
          <tr><th>Departemen / Email</th><td>${data.department || '-'} / ${data.email}</td></tr>
          <tr><th>Nomor Aset (Tag ID)</th><td><strong style="font-family: monospace; font-size: 13px;">${data.asset_tag}</strong></td></tr>
          <tr><th>Tipe & Model Perangkat</th><td>${data.category_name} - ${data.brand} ${data.model}</td></tr>
          <tr><th>Nomor Seri (Serial Number)</th><td style="font-family: monospace;">${data.serial_number}</td></tr>
          <tr><th>Spesifikasi Teknis</th><td>CPU: ${data.specs?.cpu || '-'} | RAM: ${data.specs?.ram || '-'} | Storage: ${data.specs?.storage || '-'}</td></tr>
          <tr><th>Kondisi Fisik & Catatan</th><td>${data.condition_notes || 'Lengkap, berfungsi normal & siap pakai'}</td></tr>
        </table>

        <div class="terms">
          <strong>Ketentuan & Kewajiban Pemegang Aset:</strong>
          <ol>
            <li>Perangkat wajib dirawat sebaik mungkin dan dipergunakan untuk kepentingan operasional kantor / kedinasan.</li>
            <li>Segala bentuk modifikasi perangkat keras (hardware) harus melalui persetujuan Departemen IT.</li>
            <li>Kerusakan atau kehilangan akibat kelalaian pribadi di luar dinas menjadi tanggung jawab pengguna.</li>
            <li>Perangkat wajib dikembalikan ke Departemen IT saat karyawan mengakhiri masa tugas / resign (*offboarding*).</li>
          </ol>
        </div>

        <div class="signatures">
          <div class="sign-box">
            <p class="sign-title">Diserahkan oleh,</p>
            <p class="sign-role">IT Asset Management</p>
            <div class="sign-line"></div>
            <p class="sign-name">( ........................................ )</p>
            <p class="sign-dept">Petugas IT Penyerah</p>
          </div>

          <div class="sign-box">
            <p class="sign-title">Diterima oleh,</p>
            <p class="sign-role">Penerima / Pemakai</p>
            <div class="sign-line"></div>
            <p class="sign-name">( ${data.user_name} )</p>
            <p class="sign-dept">${data.department || 'Karyawan Penerima'}</p>
          </div>

          <div class="sign-box">
            <p class="sign-title">Mengetahui,</p>
            <p class="sign-role">Head of IT</p>
            <div class="sign-line"></div>
            <p class="sign-name">( ........................................ )</p>
            <p class="sign-dept">Kepala Departemen IT</p>
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
