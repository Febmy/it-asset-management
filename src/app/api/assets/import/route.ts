import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import pool from '@/lib/db';

function normalizeString(val: any): string {
    if (val === null || val === undefined) return '';
    return String(val).replace(/\u00A0/g, ' ').trim();
}

function formatDateValue(val: any): string | null {
    if (!val) return null;
    if (val instanceof Date && !isNaN(val.getTime())) {
        return val.toISOString().split('T')[0];
    }
    const str = String(val).trim();
    if (!str) return null;

    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        return str;
    }

    const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmyMatch) {
        const day = dmyMatch[1].padStart(2, '0');
        const month = dmyMatch[2].padStart(2, '0');
        const year = dmyMatch[3];
        return `${year}-${month}-${day}`;
    }

    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0];
    }

    return null;
}

function getColumnValue(row: Record<string, any>, possibleKeys: string[]): any {
    const rowKeys = Object.keys(row);
    for (const pKey of possibleKeys) {
        const cleanPKey = pKey.toLowerCase().replace(/[^a-z0-9]/g, '');
        for (const rKey of rowKeys) {
            const cleanRKey = rKey.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (cleanRKey === cleanPKey || cleanRKey.includes(cleanPKey)) {
                return row[rKey];
            }
        }
    }
    return undefined;
}

function parseSpecsText(text: string): Record<string, string> {
    if (!text) return {};
    const specs: Record<string, string> = {};
    const lines = text.split(/[\r\n]+/);
    for (const line of lines) {
        const match = line.match(/^([^:=]+)[:=]\s*(.+)$/);
        if (match) {
            const rawKey = match[1].trim();
            const lowerKey = rawKey.toLowerCase();
            const val = match[2].trim().replace(/^"|"$/g, '');
            if (lowerKey.includes('cpu') || lowerKey.includes('prosesor') || lowerKey.includes('processor')) {
                specs.cpu = val;
            } else if (lowerKey.includes('ram') || lowerKey.includes('memory')) {
                specs.ram = val;
            } else if (
                lowerKey.includes('storage') ||
                lowerKey.includes('harddisk') ||
                lowerKey.includes('ssd') ||
                lowerKey.includes('hdd') ||
                lowerKey.includes('penyimpanan')
            ) {
                specs.storage = val;
            } else if (lowerKey.includes('vga') || lowerKey.includes('gpu') || lowerKey.includes('graphics')) {
                specs.gpu = val;
            } else if (lowerKey.includes('os') || lowerKey.includes('operating')) {
                specs.os = val;
            } else if (lowerKey.includes('monitor') || lowerKey.includes('display') || lowerKey.includes('layar')) {
                specs.display = val;
            } else {
                specs[rawKey] = val;
            }
        }
    }
    return specs;
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const dryRun = formData.get('dry_run') === 'true';

        if (!file) {
            return NextResponse.json(
                { success: false, message: 'Berkas Excel / CSV belum dipilih' },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
            return NextResponse.json(
                { success: false, message: 'Lembar kerja dokumen Excel kosong' },
                { status: 400 }
            );
        }

        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];

        // 1. Ekstrak data sebagai grid 2D untuk mendeteksi header secara dinamis jika ada baris judul
        const rawGrid: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
        if (rawGrid.length === 0) {
            return NextResponse.json(
                { success: false, message: 'Dokumen tidak memiliki baris data' },
                { status: 400 }
            );
        }

        // Cari baris header yang sesungguhnya (scan 15 baris pertama)
        let headerRowIndex = 0;
        for (let i = 0; i < Math.min(rawGrid.length, 15); i++) {
            const row = rawGrid[i];
            if (Array.isArray(row)) {
                const rowStr = row.map((cell) => String(cell).toLowerCase()).join(' ');
                if (
                    (rowStr.includes('kode aset') ||
                        rowStr.includes('tag aset') ||
                        rowStr.includes('asset tag') ||
                        rowStr.includes('tag id')) &&
                    (rowStr.includes('nama aset') ||
                        rowStr.includes('serial') ||
                        rowStr.includes('merk') ||
                        rowStr.includes('model'))
                ) {
                    headerRowIndex = i;
                    break;
                }
            }
        }

        const headerCells = rawGrid[headerRowIndex].map((h: any) => String(h).trim());
        const rawRows: Record<string, any>[] = [];

        for (let r = headerRowIndex + 1; r < rawGrid.length; r++) {
            const line = rawGrid[r];
            if (!line || line.every((c: any) => String(c).trim() === '')) continue;
            const obj: Record<string, any> = {};
            headerCells.forEach((h: string, colIdx: number) => {
                if (h) {
                    obj[h] = line[colIdx] !== undefined ? line[colIdx] : '';
                }
            });
            rawRows.push(obj);
        }

        if (rawRows.length === 0) {
            return NextResponse.json(
                { success: false, message: 'Tidak ada baris data aset setelah baris header' },
                { status: 400 }
            );
        }

        // 2. Ambil master kategori dari database
        const catRes = await pool.query('SELECT id, code, name FROM asset_categories');
        const categoryMap = new Map<string, { id: number; name: string; code: string }>();

        for (const cat of catRes.rows) {
            categoryMap.set(cat.code.toUpperCase().trim(), cat);
            categoryMap.set(cat.name.toUpperCase().trim(), cat);
        }

        // Kategori cadangan spesifik
        const laptopCat = categoryMap.get('NB') || catRes.rows[0];
        const pcCat = categoryMap.get('PC') || catRes.rows[0];
        const peripheralCat = categoryMap.get('PR') || catRes.rows[0];

        // 3. Ambil seluruh asset_tag dan serial_number yang sudah ada di DB
        const existingAssetsRes = await pool.query('SELECT asset_tag, serial_number FROM assets');
        const existingTags = new Set<string>();
        const existingSerials = new Set<string>();

        for (const a of existingAssetsRes.rows) {
            if (a.asset_tag) existingTags.add(a.asset_tag.toUpperCase().trim());
            if (a.serial_number) existingSerials.add(a.serial_number.toUpperCase().trim());
        }

        // 4. Validasi dan petakan data baris
        const seenTagsInFile = new Set<string>();
        const seenSerialsInFile = new Set<string>();

        const parsedItems: any[] = [];
        let validCount = 0;
        let invalidCount = 0;

        for (let i = 0; i < rawRows.length; i++) {
            const row = rawRows[i];
            const rowNumber = headerRowIndex + 2 + i;
            const errors: string[] = [];
            const warnings: string[] = [];

            // Mapping kolom fleksibel (mendukung format template standar & format kustom perusahaan)
            const assetTag = normalizeString(
                getColumnValue(row, ['kodeaset', 'tagaset', 'assettag', 'tagid', 'tag', 'kodepencatatan'])
            );

            const namaAset = normalizeString(
                getColumnValue(row, ['namaaset', 'namaunit', 'modelseri', 'model', 'seri', 'tipe', 'deskripsi'])
            );

            let brand = normalizeString(
                getColumnValue(row, ['merkmodel', 'brandmerk', 'merk', 'brand', 'merek'])
            );

            let model = namaAset || brand;
            if (!brand && model) {
                // Ekstrak kata pertama sebagai brand
                const firstWord = model.split(' ')[0];
                if (firstWord) brand = firstWord;
            }
            if (!brand) brand = 'Umum';

            const rawSerial = normalizeString(
                getColumnValue(row, ['noserial', 'serialnumber', 'nomorseri', 'sn', 'serial', 'snno'])
            );

            // Bersihkan format serial number
            let cleanedSerial = rawSerial
                .replace(/^(SN|S\/N|NO\.?\s*SERIAL)\s*[:\-]?\s*/i, '')
                .replace(/\u00A0/g, ' ')
                .trim();

            // Jika serial kosong atau hanya tanda strip '-', generate serial otomatis yang jelas
            if (!cleanedSerial || cleanedSerial === '-') {
                cleanedSerial = `AUTO-SN-${assetTag || 'AST'}-${rowNumber}`;
                warnings.push(`Serial number tidak tercantum, otomatis dibuat: "${cleanedSerial}"`);
            }

            const catInput = normalizeString(
                getColumnValue(row, ['kategori', 'category', 'categorycode', 'kodekategori'])
            );

            const namaPemegang = normalizeString(
                getColumnValue(row, ['namapemegang', 'pemegang', 'user', 'karyawan', 'assignedto', 'namakaryawan'])
            );

            const nikKaryawan = normalizeString(
                getColumnValue(row, ['nikidkaryawan', 'nik', 'idkaryawan', 'empid', 'employeeid'])
            );

            const departemen = normalizeString(
                getColumnValue(row, ['departemen', 'department', 'divisi', 'dept'])
            );

            const kondisiDiterima = normalizeString(
                getColumnValue(row, ['kondisisaatditerima', 'kondisiditerima', 'kondisi'])
            );

            const statusInput = normalizeString(
                getColumnValue(row, ['status', 'statusaset'])
            ).toLowerCase();

            const spesifikasiRaw = normalizeString(
                getColumnValue(row, ['spesifikasi', 'specs', 'spec', 'spesifikasiaset'])
            );

            const keterangan = normalizeString(
                getColumnValue(row, ['keterangan', 'catatan', 'notes', 'remark'])
            );

            // Parsing tanggal jika ada
            const purchaseDateRaw = getColumnValue(row, ['tanggalpembelian', 'purchasedate', 'tglpembelian', 'tgl_beli']);
            const warrantyExpiryRaw = getColumnValue(row, ['batasgaransi', 'warrantyexpiry', 'garansi', 'expwarranty']);
            const purchaseDate = formatDateValue(purchaseDateRaw);
            const warrantyExpiry = formatDateValue(warrantyExpiryRaw);

            // Validasi kolom wajib
            if (!assetTag) errors.push('Kode / Tag Aset tidak boleh kosong');
            if (!model) errors.push('Nama atau Model Aset tidak boleh kosong');

            // Pencocokan kategori cerdas
            let matchedCategory: { id: number; name: string; code: string } | null = null;
            if (catInput) {
                const upperCat = catInput.toUpperCase();
                if (categoryMap.has(upperCat)) {
                    matchedCategory = categoryMap.get(upperCat)!;
                } else if (upperCat.includes('ELEKTRONIK')) {
                    // Deteksi apakah Desktop PC atau Laptop
                    const lowerModel = model.toLowerCase();
                    if (
                        lowerModel.includes('imac') ||
                        lowerModel.includes('desktop') ||
                        lowerModel.includes('pc') ||
                        lowerModel.includes('tower')
                    ) {
                        matchedCategory = pcCat;
                    } else {
                        matchedCategory = laptopCat;
                    }
                } else if (
                    upperCat.includes('AKSESORIS') ||
                    upperCat.includes('LAIN') ||
                    upperCat.includes('FLASHDISK') ||
                    upperCat.includes('CONNECTOR') ||
                    upperCat.includes('MOUSE') ||
                    upperCat.includes('KEYBOARD')
                ) {
                    matchedCategory = peripheralCat;
                } else {
                    // Cari partial match
                    for (const [key, val] of categoryMap.entries()) {
                        if (key.includes(upperCat) || upperCat.includes(key)) {
                            matchedCategory = val;
                            break;
                        }
                    }
                }
            }

            if (!matchedCategory) {
                matchedCategory = laptopCat; // Default jika tidak teridentifikasi
            }

            // Normalisasi status unit
            let status = 'in_stock';
            if (statusInput.includes('rusak')) {
                status = 'repair';
            } else if (statusInput.includes('nonaktif')) {
                status = 'disposed';
            } else if (statusInput.includes('digunakan') || statusInput.includes('deployed')) {
                status = 'deployed';
            } else if (statusInput.includes('stock') || statusInput.includes('warehouse') || statusInput.includes('gudang')) {
                status = 'in_stock';
            } else {
                // Jika status kosong, tentukan dari pemegang
                if (namaPemegang && !namaPemegang.toLowerCase().includes('warehouse') && namaPemegang !== '-') {
                    status = 'deployed';
                } else {
                    status = 'in_stock';
                }
            }

            // Cek duplikasi Tag Aset
            if (assetTag) {
                if (existingTags.has(assetTag.toUpperCase())) {
                    errors.push(`Tag Aset "${assetTag}" sudah terdaftar di sistem`);
                } else if (seenTagsInFile.has(assetTag.toUpperCase())) {
                    errors.push(`Tag Aset "${assetTag}" duplikat di dalam berkas ini`);
                } else {
                    seenTagsInFile.add(assetTag.toUpperCase());
                }
            }

            // Cek duplikasi Serial Number
            if (cleanedSerial) {
                if (existingSerials.has(cleanedSerial.toUpperCase()) || seenSerialsInFile.has(cleanedSerial.toUpperCase())) {
                    // Jangan buat error fatal jika hanya serial number ganda di catatan admin, tambahkan penanda agar tetap bisa masuk
                    cleanedSerial = `${cleanedSerial}-DUP-${assetTag}`;
                    warnings.push(`Serial number duplikat, disesuaikan menjadi "${cleanedSerial}"`);
                }
                seenSerialsInFile.add(cleanedSerial.toUpperCase());
            }

            // Ekstrak spesifikasi
            let parsedSpecs: Record<string, string> | null = null;
            if (spesifikasiRaw) {
                parsedSpecs = parseSpecsText(spesifikasiRaw);
            } else {
                const cpu = normalizeString(getColumnValue(row, ['cpu', 'processor', 'prosesor']));
                const ram = normalizeString(getColumnValue(row, ['ram', 'memory']));
                const storage = normalizeString(getColumnValue(row, ['storage', 'penyimpanan', 'ssd', 'hdd']));
                if (cpu || ram || storage) {
                    parsedSpecs = {};
                    if (cpu) parsedSpecs.cpu = cpu;
                    if (ram) parsedSpecs.ram = ram;
                    if (storage) parsedSpecs.storage = storage;
                }
            }

            // Gabungkan catatan keterangan
            const combinedNotes = [keterangan, kondisiDiterima ? `Kondisi diterima: ${kondisiDiterima}` : '']
                .filter(Boolean)
                .join(' | ');

            const isValid = errors.length === 0;
            if (isValid) validCount++;
            else invalidCount++;

            parsedItems.push({
                rowNumber,
                asset_tag: assetTag,
                category_id: matchedCategory?.id || null,
                category_name: matchedCategory?.name || catInput || 'Umum',
                brand,
                model,
                serial_number: cleanedSerial,
                specs: parsedSpecs && Object.keys(parsedSpecs).length > 0 ? parsedSpecs : null,
                purchase_date: purchaseDate,
                warranty_expiry: warrantyExpiry,
                status,
                nama_pemegang: namaPemegang && !namaPemegang.toLowerCase().includes('warehouse') ? namaPemegang : null,
                nik_karyawan: nikKaryawan || null,
                departemen: departemen || null,
                proof_notes: combinedNotes || null,
                isValid,
                errors,
                warnings,
            });
        }

        // Jika dry_run = true, kembalikan hasil analisa pratinjau
        if (dryRun) {
            return NextResponse.json({
                success: true,
                dryRun: true,
                total: parsedItems.length,
                validCount,
                invalidCount,
                items: parsedItems,
            });
        }

        // Jika dry_run = false, simpan ke database dan tautkan pemegang bila ada
        const validItems = parsedItems.filter((i) => i.isValid);
        if (validItems.length === 0) {
            return NextResponse.json(
                { success: false, message: 'Tidak ada baris data valid yang dapat disimpan', errors: parsedItems },
                { status: 400 }
            );
        }

        const client = await pool.connect();
        let insertedCount = 0;
        let assignedCount = 0;
        const failedItems: any[] = [];

        try {
            await client.query('BEGIN');

            for (const item of validItems) {
                try {
                    // 1. Simpan unit aset
                    const insertAssetQuery = `
            INSERT INTO assets (
              asset_tag,
              category_id,
              serial_number,
              brand,
              model,
              specs,
              purchase_date,
              warranty_expiry,
              status,
              proof_notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id;
          `;

                    const assetRes = await client.query(insertAssetQuery, [
                        item.asset_tag,
                        item.category_id,
                        item.serial_number,
                        item.brand,
                        item.model,
                        item.specs ? JSON.stringify(item.specs) : null,
                        item.purchase_date,
                        item.warranty_expiry,
                        item.status,
                        item.proof_notes,
                    ]);

                    const newAssetId = assetRes.rows[0].id;
                    insertedCount++;

                    // 2. Jika ada pemegang unit (karyawan), tautkan ke tabel asset_assignments
                    if (item.nama_pemegang) {
                        // Cari user di database berdasarkan nama
                        const userCheck = await client.query(
                            'SELECT id FROM users WHERE LOWER(name) = LOWER($1) LIMIT 1',
                            [item.nama_pemegang]
                        );

                        let targetUserId: number | null = null;
                        if (userCheck.rows.length > 0) {
                            targetUserId = userCheck.rows[0].id;
                        } else {
                            // Otomatis buat profil user karyawan baru
                            const safeEmpId =
                                item.nik_karyawan ||
                                `EMP-${item.asset_tag.replace(/[^a-zA-Z0-9]/g, '')}`;
                            const cleanEmailName = item.nama_pemegang
                                .toLowerCase()
                                .replace(/[^a-z0-9]/g, '');
                            const safeEmail = `${cleanEmailName || 'user'}@yodu.id`;

                            const newUserRes = await client.query(
                                `INSERT INTO users (employee_id, name, email, department, role, is_active)
                 VALUES ($1, $2, $3, $4, 'employee', TRUE)
                 ON CONFLICT (employee_id) DO UPDATE SET name = EXCLUDED.name
                 RETURNING id;`,
                                [safeEmpId, item.nama_pemegang, safeEmail, item.departemen || 'Umum']
                            );
                            targetUserId = newUserRes.rows[0].id;
                        }

                        if (targetUserId) {
                            await client.query(
                                `INSERT INTO asset_assignments (
                  asset_id, user_id, assigned_date, condition_notes, status
                ) VALUES ($1, $2, CURRENT_DATE, $3, 'active');`,
                                [newAssetId, targetUserId, item.proof_notes || 'Penyerahan unit awal saat impor data']
                            );
                            assignedCount++;
                        }
                    }
                } catch (rowErr: any) {
                    console.error(`Error inserting asset ${item.asset_tag}:`, rowErr);
                    failedItems.push({
                        asset_tag: item.asset_tag,
                        error: rowErr?.message || 'Database insert error',
                    });
                }
            }

            await client.query('COMMIT');

            return NextResponse.json({
                success: true,
                dryRun: false,
                message: `Berhasil mengimpor ${insertedCount} unit aset (${assignedCount} langsung ditautkan ke karyawan pemegang).`,
                totalUploaded: parsedItems.length,
                insertedCount,
                assignedCount,
                skippedCount: parsedItems.length - insertedCount,
                failedItems,
            });
        } catch (dbErr: any) {
            await client.query('ROLLBACK');
            console.error('Import database transaction error:', dbErr);
            return NextResponse.json(
                { success: false, message: 'Terjadi kesalahan transaksi saat menyimpan data ke database', error: dbErr?.message },
                { status: 500 }
            );
        } finally {
            client.release();
        }
    } catch (error: any) {
        console.error('Import excel error:', error);
        return NextResponse.json(
            { success: false, message: 'Gagal memproses dokumen Excel / CSV', error: error?.message },
            { status: 500 }
        );
    }
}
