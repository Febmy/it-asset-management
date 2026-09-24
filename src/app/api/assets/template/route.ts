import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import pool from '@/lib/db';

export async function GET() {
    try {
        // Ambil kategori dari database untuk lembar panduan
        const catRes = await pool.query('SELECT code, name FROM asset_categories ORDER BY id ASC');
        const categories = catRes.rows;

        // 1. Sheet Utama: Template Import Data Aset
        const templateData = [
            {
                'Tag Aset *': 'IT-NB-2026-0101',
                'Kategori (Kode/Nama) *': 'NB',
                'Brand / Merk *': 'Lenovo',
                'Model / Seri *': 'ThinkPad T14 Gen 4',
                'Serial Number *': 'SN-LN-88123',
                'Processor (CPU)': 'Intel Core i7-1365U',
                'RAM': '16GB',
                'Storage': '512GB SSD',
                'Tanggal Pembelian (YYYY-MM-DD)': '2024-03-01',
                'Batas Garansi (YYYY-MM-DD)': '2027-03-01',
                'Status': 'in_stock',
            },
            {
                'Tag Aset *': 'IT-PC-2026-0102',
                'Kategori (Kode/Nama) *': 'PC',
                'Brand / Merk *': 'Dell',
                'Model / Seri *': 'OptiPlex 7090',
                'Serial Number *': 'SN-DL-99411',
                'Processor (CPU)': 'Intel Core i5-11500',
                'RAM': '16GB',
                'Storage': '1TB NVMe',
                'Tanggal Pembelian (YYYY-MM-DD)': '2024-04-10',
                'Batas Garansi (YYYY-MM-DD)': '2027-04-10',
                'Status': 'in_stock',
            },
            {
                'Tag Aset *': 'IT-MN-2026-0103',
                'Kategori (Kode/Nama) *': 'MN',
                'Brand / Merk *': 'LG',
                'Model / Seri *': 'UltraFine 27UP850',
                'Serial Number *': 'SN-LG-33100',
                'Processor (CPU)': '',
                'RAM': '',
                'Storage': '',
                'Tanggal Pembelian (YYYY-MM-DD)': '2024-05-20',
                'Batas Garansi (YYYY-MM-DD)': '2026-05-20',
                'Status': 'in_stock',
            },
        ];

        const workbook = XLSX.utils.book_new();
        const mainSheet = XLSX.utils.json_to_sheet(templateData);

        // Atur lebar kolom agar rapi
        mainSheet['!cols'] = [
            { wch: 18 }, // Tag Aset
            { wch: 24 }, // Kategori
            { wch: 16 }, // Brand
            { wch: 22 }, // Model
            { wch: 18 }, // Serial Number
            { wch: 24 }, // CPU
            { wch: 12 }, // RAM
            { wch: 16 }, // Storage
            { wch: 26 }, // Tgl Beli
            { wch: 26 }, // Garansi
            { wch: 14 }, // Status
        ];

        XLSX.utils.book_append_sheet(workbook, mainSheet, 'Template Import Aset');

        // 2. Sheet Kedua: Panduan Pengisian & Master Data
        const categoryRows = categories.map((c) => ({
            'Kode Kategori': c.code,
            'Nama Kategori': c.name,
            'Contoh Penggunaan': `Tulis "${c.code}" atau "${c.name}" pada kolom Kategori`,
        }));

        const statusGuide = [
            { 'Opsi Status': 'in_stock', 'Arti / Keterangan': 'Tersedia di Gudang IT (Default jika kosong)' },
            { 'Opsi Status': 'deployed', 'Arti / Keterangan': 'Sedang Aktif Digunakan / Ditugaskan' },
            { 'Opsi Status': 'repair', 'Arti / Keterangan': 'Dalam Masa Perbaikan / Servis' },
            { 'Opsi Status': 'disposed', 'Arti / Keterangan': 'Sudah Dihapus / Dimusnahkan' },
        ];

        const categorySheet = XLSX.utils.json_to_sheet(categoryRows);
        categorySheet['!cols'] = [{ wch: 16 }, { wch: 24 }, { wch: 45 }];
        XLSX.utils.book_append_sheet(workbook, categorySheet, 'Daftar Kategori');

        const statusSheet = XLSX.utils.json_to_sheet(statusGuide);
        statusSheet['!cols'] = [{ wch: 18 }, { wch: 45 }];
        XLSX.utils.book_append_sheet(workbook, statusSheet, 'Opsi Status');

        // Generate buffer
        const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        return new NextResponse(excelBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': 'attachment; filename="template_import_aset.xlsx"',
            },
        });
    } catch (error: any) {
        console.error('Download template error:', error);
        return NextResponse.json(
            { success: false, message: 'Gagal membuat template Excel', error: error?.message },
            { status: 500 }
        );
    }
}
