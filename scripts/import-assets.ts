import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import pool from '../src/lib/db';

interface CsvRow {
    asset_tag: string;
    category_code: string;
    serial_number: string;
    brand: string;
    model: string;
    cpu?: string;
    ram?: string;
    storage?: string;
    warranty_expiry?: string;
    purchase_date?: string;
}

async function importAssets(filePath: string) {
    if (!fs.existsSync(filePath)) {
        console.error(`Berkas CSV tidak ditemukan di: ${filePath}`);
        process.exit(1);
    }

    console.log(`🚀 Memulai impor aset dari: ${filePath}`);

    // 1. Ambil pemetaan kategori
    const catRes = await pool.query('SELECT id, code FROM asset_categories');
    const categoryMap = new Map<string, number>();
    for (const row of catRes.rows) {
        categoryMap.set(row.code.toUpperCase(), row.id);
    }

    const rows: CsvRow[] = [];

    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => rows.push(data))
        .on('end', async () => {
            console.log(`📋 Membaca ${rows.length} baris data dari CSV...`);
            let inserted = 0;
            let skipped = 0;

            for (const row of rows) {
                try {
                    const tag = row.asset_tag?.trim();
                    const sn = row.serial_number?.trim();
                    const catCode = row.category_code?.trim().toUpperCase();
                    const categoryId = categoryMap.get(catCode) || null;

                    if (!tag || !sn || !row.brand || !row.model) {
                        console.warn(`⚠️ Baris dilewati karena data tidak lengkap: ${JSON.stringify(row)}`);
                        skipped++;
                        continue;
                    }

                    const specs = {
                        cpu: row.cpu?.trim() || undefined,
                        ram: row.ram?.trim() || undefined,
                        storage: row.storage?.trim() || undefined,
                    };

                    const query = `
            INSERT INTO assets (
              asset_tag, category_id, serial_number, brand, model, specs, warranty_expiry, purchase_date, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'in_stock')
            ON CONFLICT (asset_tag) DO NOTHING
            RETURNING id;
          `;

                    const res = await pool.query(query, [
                        tag,
                        categoryId,
                        sn,
                        row.brand.trim(),
                        row.model.trim(),
                        JSON.stringify(specs),
                        row.warranty_expiry || null,
                        row.purchase_date || null,
                    ]);

                    if (res.rows.length > 0) {
                        inserted++;
                    } else {
                        console.log(`ℹ️ Asset tag ${tag} sudah ada, dilewati.`);
                        skipped++;
                    }
                } catch (err: any) {
                    console.error(`❌ Gagal mengimpor baris ${row.asset_tag}:`, err.message);
                    skipped++;
                }
            }

            console.log(`\n🎉 Impor Selesai! Berhasil dimasukkan: ${inserted}, Dilewati/Gagal: ${skipped}`);
            await pool.end();
            process.exit(0);
        });
}

// Mengambil argumen path CSV dari command line
const targetFile = process.argv[2] || path.join(__dirname, 'sample-assets.csv');
importAssets(targetFile);
