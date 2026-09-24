'use client';

import { useState, useRef } from 'react';

interface ImportAssetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface ParsedItem {
    rowNumber: number;
    asset_tag: string;
    category_id: number | null;
    category_name: string;
    brand: string;
    model: string;
    serial_number: string;
    specs: { cpu?: string; ram?: string; storage?: string } | null;
    purchase_date: string | null;
    warranty_expiry: string | null;
    status: string;
    nama_pemegang?: string | null;
    isValid: boolean;
    errors: string[];
    warnings?: string[];
}

export default function ImportAssetModal({ isOpen, onClose, onSuccess }: ImportAssetModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [importing, setImporting] = useState(false);
    const [previewData, setPreviewData] = useState<{
        total: number;
        validCount: number;
        invalidCount: number;
        items: ParsedItem[];
    } | null>(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const resetState = () => {
        setFile(null);
        setPreviewData(null);
        setErrorMsg('');
        setSuccessMsg('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    const handleFileChange = async (selectedFile: File) => {
        setFile(selectedFile);
        setErrorMsg('');
        setSuccessMsg('');
        setAnalyzing(true);
        setPreviewData(null);

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('dry_run', 'true');

            const res = await fetch('/api/assets/import', {
                method: 'POST',
                body: formData,
            });

            const result = await res.json();
            if (result.success) {
                setPreviewData({
                    total: result.total,
                    validCount: result.validCount,
                    invalidCount: result.invalidCount,
                    items: result.items,
                });
            } else {
                setErrorMsg(result.message || 'Gagal memproses berkas Excel');
            }
        } catch {
            setErrorMsg('Terjadi kendala jaringan saat menganalisis berkas');
        } finally {
            setAnalyzing(false);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileChange(e.dataTransfer.files[0]);
        }
    };

    const handleExecuteImport = async () => {
        if (!file) return;

        setImporting(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('dry_run', 'false');

            const res = await fetch('/api/assets/import', {
                method: 'POST',
                body: formData,
            });

            const result = await res.json();
            if (result.success) {
                setSuccessMsg(result.message || `Berhasil mengimpor ${result.insertedCount} unit aset`);
                setTimeout(() => {
                    onSuccess();
                    handleClose();
                }, 1500);
            } else {
                setErrorMsg(result.message || 'Gagal menyimpan data ke database');
            }
        } catch {
            setErrorMsg('Gagal terhubung ke server saat eksekusi impor');
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-4xl bg-white rounded-3xl p-6 shadow-2xl max-h-[90vh] flex flex-col">
                {/* Header Modal */}
                <div className="flex justify-between items-start border-b border-slate-100 pb-4 mb-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xl">📊</span>
                            <h3 className="font-bold text-slate-900 text-lg">Import Data Inventaris dari Excel</h3>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Unggah berkas spreadsheet (.xlsx, .xls, .csv) untuk memasukkan banyak data aset sekaligus
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors text-lg leading-none cursor-pointer"
                    >
                        &times;
                    </button>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto space-y-5 pr-1">
                    {/* Baris Tindakan Bantuan: Unduh Format Template */}
                    <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                                📑
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-emerald-950">Gunakan Format Template Resmi</h4>
                                <p className="text-[11px] text-emerald-800">
                                    Unduh template Excel dengan header kolom standar, contoh data, dan daftar kode kategori.
                                </p>
                            </div>
                        </div>
                        <a
                            href="/api/assets/template"
                            download="template_import_aset.xlsx"
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all shrink-0 hover:shadow-md cursor-pointer"
                        >
                            <span>📥</span> Unduh Template (.xlsx)
                        </a>
                    </div>

                    {/* Area Upload & Drag-and-Drop */}
                    <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                            file
                                ? 'border-blue-500 bg-blue-50/40'
                                : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/60'
                        }`}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx, .xls, .csv"
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                    handleFileChange(e.target.files[0]);
                                }
                            }}
                            className="hidden"
                        />
                        <div className="flex flex-col items-center justify-center space-y-2">
                            <span className="text-3xl animate-bounce">📂</span>
                            <div>
                                <p className="text-xs font-bold text-slate-800">
                                    {file ? file.name : 'Pilih Berkas Excel atau Tarik & Lepas di Sini'}
                                </p>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                    Mendukung format .XLSX, .XLS, atau .CSV (Maksimal 10MB)
                                </p>
                            </div>
                            {file && (
                                <span className="inline-block px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold">
                                    Ukuran: {(file.size / 1024).toFixed(1)} KB &bull; Klik untuk ganti berkas
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Feedback Messages */}
                    {analyzing && (
                        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 text-xs rounded-xl flex items-center gap-2">
                            <span className="animate-spin text-sm">⏳</span> Menganalisis dan memvalidasi data spreadsheet...
                        </div>
                    )}

                    {errorMsg && (
                        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                            <span>⚠️</span> {errorMsg}
                        </div>
                    )}

                    {successMsg && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                            <span>✅</span> {successMsg}
                        </div>
                    )}

                    {/* Pratinjau (Preview) Hasil Analisa Data */}
                    {previewData && (
                        <div className="space-y-3">
                            {/* Summary Badges */}
                            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-slate-700">Hasil Analisa:</span>
                                    <span className="px-2 py-0.5 bg-slate-200 text-slate-800 rounded-lg font-bold">
                                        Total: {previewData.total} Baris
                                    </span>
                                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-lg font-bold">
                                        ✓ Siap Impor: {previewData.validCount}
                                    </span>
                                    {previewData.invalidCount > 0 && (
                                        <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-lg font-bold">
                                            ✕ Bermasalah: {previewData.invalidCount}
                                        </span>
                                    )}
                                </div>
                                <span className="text-[11px] text-slate-500">
                                    *Hanya baris bertanda hijau yang akan disimpan ke database
                                </span>
                            </div>

                            {/* Tabel Preview Baris Data */}
                            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                                <div className="max-h-60 overflow-y-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-slate-100/80 sticky top-0 text-slate-600 font-semibold border-b border-slate-200">
                                            <tr>
                                                <th className="py-2.5 px-3">Baris</th>
                                                <th className="py-2.5 px-3">Status Validasi</th>
                                                <th className="py-2.5 px-3">Tag ID</th>
                                                <th className="py-2.5 px-3">Perangkat</th>
                                                <th className="py-2.5 px-3">Serial Number</th>
                                                <th className="py-2.5 px-3">Pemegang & Status</th>
                                                <th className="py-2.5 px-3">Kategori</th>
                                                <th className="py-2.5 px-3">Spesifikasi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-slate-700">
                                            {previewData.items.map((row, idx) => (
                                                <tr
                                                    key={idx}
                                                    className={`hover:bg-slate-50 transition-colors ${
                                                        !row.isValid ? 'bg-rose-50/40' : ''
                                                    }`}
                                                >
                                                    <td className="py-2.5 px-3 font-mono text-slate-400 font-bold">
                                                        #{row.rowNumber}
                                                    </td>
                                                    <td className="py-2.5 px-3">
                                                        {row.isValid ? (
                                                            <div className="space-y-0.5">
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                    ✓ Siap Impor
                                                                </span>
                                                                {row.warnings && row.warnings.length > 0 && (
                                                                    <p className="text-[9px] text-amber-700 font-medium">
                                                                        ⚠️ {row.warnings.join(', ')}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-0.5">
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                                                    ✕ Gagal
                                                                </span>
                                                                <p className="text-[10px] text-rose-600 font-medium">
                                                                    {row.errors.join(', ')}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="py-2.5 px-3 font-mono font-bold text-blue-600">
                                                        {row.asset_tag || '-'}
                                                    </td>
                                                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                                                        {row.brand} {row.model}
                                                    </td>
                                                    <td className="py-2.5 px-3 font-mono text-slate-600">
                                                        {row.serial_number || '-'}
                                                    </td>
                                                    <td className="py-2.5 px-3">
                                                        {row.nama_pemegang ? (
                                                            <div>
                                                                <span className="font-semibold text-slate-900 block">{row.nama_pemegang}</span>
                                                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-50 text-blue-700">
                                                                    {row.status.toUpperCase()}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <div>
                                                                <span className="text-slate-500 italic block">Gudang</span>
                                                                <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                                                    row.status === 'repair'
                                                                        ? 'bg-amber-50 text-amber-700'
                                                                        : row.status === 'disposed'
                                                                        ? 'bg-rose-50 text-rose-700'
                                                                        : 'bg-slate-100 text-slate-700'
                                                                }`}>
                                                                    {row.status.toUpperCase()}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="py-2.5 px-3">
                                                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-medium text-slate-700">
                                                            {row.category_name || '-'}
                                                        </span>
                                                    </td>
                                                    <td className="py-2.5 px-3 text-[11px] text-slate-500">
                                                        {row.specs ? (
                                                            <span>
                                                                {[row.specs.cpu, row.specs.ram, row.specs.storage]
                                                                    .filter(Boolean)
                                                                    .join(' &bull; ')}
                                                            </span>
                                                        ) : (
                                                            '-'
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Modal Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                        Tutup
                    </button>

                    <div className="flex items-center gap-2">
                        {file && (
                            <button
                                type="button"
                                onClick={resetState}
                                className="px-3.5 py-2 text-slate-500 hover:text-slate-800 text-xs font-medium cursor-pointer"
                            >
                                Bersihkan Pilihan
                            </button>
                        )}

                        <button
                            type="button"
                            disabled={!previewData || previewData.validCount === 0 || importing || analyzing}
                            onClick={handleExecuteImport}
                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                        >
                            {importing ? (
                                <>
                                    <span className="animate-spin text-sm">⏳</span> Menyimpan Data...
                                </>
                            ) : (
                                <>
                                    <span>🚀</span> Simpan ({previewData?.validCount || 0}) Aset ke Database
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
