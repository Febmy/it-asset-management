import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import pool from '@/lib/db';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const uploadType = (formData.get('type') as string) || 'photo'; // 'photo' | 'document' | 'return_proof' | 'maintenance_invoice'
        const assetId = formData.get('asset_id') ? Number(formData.get('asset_id')) : null;
        const assignmentId = formData.get('assignment_id') ? Number(formData.get('assignment_id')) : null;
        const maintenanceId = formData.get('maintenance_id') ? Number(formData.get('maintenance_id')) : null;

        if (!file) {
            return NextResponse.json(
                { success: false, message: 'Tidak ada berkas yang diunggah' },
                { status: 400 }
            );
        }

        // Batasi ukuran file (maksimal 15 MB)
        const MAX_SIZE = 15 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            return NextResponse.json(
                { success: false, message: 'Ukuran berkas melebihi batas maksimal 15MB' },
                { status: 400 }
            );
        }

        // Validasi ekstensi
        const originalName = file.name || 'uploaded_file';
        const ext = path.extname(originalName).toLowerCase();
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.doc', '.docx'];

        if (!allowedExtensions.includes(ext)) {
            return NextResponse.json(
                { success: false, message: `Format berkas ${ext} tidak didukung. Harap gunakan format gambar atau PDF/DOC.` },
                { status: 400 }
            );
        }

        // Tentukan folder penyimpanan
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'assets');
        await fs.mkdir(uploadDir, { recursive: true });

        // Generate nama file unik & aman
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const cleanPrefix = uploadType.replace(/[^a-zA-Z0-9_-]/g, '_');
        const fileName = `${cleanPrefix}_${timestamp}_${randomStr}${ext}`;
        const filePath = path.join(uploadDir, fileName);

        // Tulis file ke disk
        const buffer = Buffer.from(await file.arrayBuffer());
        await fs.writeFile(filePath, buffer);

        // Buat path URL publik
        const publicUrl = `/uploads/assets/${fileName}`;

        // Jika ada ID yang ditautkan, update langsung ke database
        if (assetId && !isNaN(assetId)) {
            if (uploadType === 'photo') {
                await pool.query('UPDATE assets SET image_url = $1 WHERE id = $2', [publicUrl, assetId]);
            } else if (uploadType === 'document') {
                await pool.query('UPDATE assets SET proof_doc_url = $1 WHERE id = $2', [publicUrl, assetId]);
            }
        }

        if (assignmentId && !isNaN(assignmentId)) {
            await pool.query('UPDATE asset_assignments SET return_proof_url = $1 WHERE id = $2', [publicUrl, assignmentId]);
        }

        if (maintenanceId && !isNaN(maintenanceId)) {
            await pool.query('UPDATE maintenance_logs SET invoice_proof_url = $1 WHERE id = $2', [publicUrl, maintenanceId]);
        }

        return NextResponse.json({
            success: true,
            message: 'Berkas bukti berhasil diunggah',
            url: publicUrl,
            fileName,
            originalName,
        });
    } catch (error: any) {
        console.error('Upload proof error:', error);
        return NextResponse.json(
            { success: false, message: 'Gagal mengunggah berkas bukti', error: error?.message },
            { status: 500 }
        );
    }
}
