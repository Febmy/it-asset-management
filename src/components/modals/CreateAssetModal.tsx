'use client';

import { useState, useEffect } from 'react';

interface CreateAssetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface Category {
    id: number;
    name: string;
    code: string;
}

export default function CreateAssetModal({ isOpen, onClose, onSuccess }: CreateAssetModalProps) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [formData, setFormData] = useState({
        asset_tag: '',
        category_id: '',
        serial_number: '',
        brand: '',
        model: '',
        cpu: '',
        ram: '',
        storage: '',
        warranty_expiry: '',
        purchase_date: '',
    });

    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [docFile, setDocFile] = useState<File | null>(null);

    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (isOpen) {
            // Ambil daftar kategori dari endpoint /api/categories jika ada, atau fallback manual
            fetch('/api/categories')
                .then((res) => res.json())
                .then((res) => {
                    if (res.success) setCategories(res.data);
                })
                .catch(() => {
                    // Fallback kategori dasar jika endpoint belum dibuat
                    setCategories([
                        { id: 1, name: 'Notebook / Laptop', code: 'NB' },
                        { id: 2, name: 'Desktop PC', code: 'PC' },
                        { id: 3, name: 'Monitor', code: 'MN' },
                        { id: 4, name: 'Network Gear', code: 'NW' },
                        { id: 5, name: 'Peripheral', code: 'PR' },
                    ]);
                });
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        try {
            let uploadedImageUrl: string | null = null;
            let uploadedDocUrl: string | null = null;

            // Upload foto fisik jika ada
            if (photoFile) {
                const pForm = new FormData();
                pForm.append('file', photoFile);
                pForm.append('type', 'photo');
                const pRes = await fetch('/api/assets/upload-proof', { method: 'POST', body: pForm });
                const pData = await pRes.json();
                if (pData.success) uploadedImageUrl = pData.url;
            }

            // Upload dokumen bukti jika ada
            if (docFile) {
                const dForm = new FormData();
                dForm.append('file', docFile);
                dForm.append('type', 'document');
                const dRes = await fetch('/api/assets/upload-proof', { method: 'POST', body: dForm });
                const dData = await dRes.json();
                if (dData.success) uploadedDocUrl = dData.url;
            }

            const payload = {
                asset_tag: formData.asset_tag,
                category_id: Number(formData.category_id),
                serial_number: formData.serial_number,
                brand: formData.brand,
                model: formData.model,
                specs: {
                    cpu: formData.cpu || undefined,
                    ram: formData.ram || undefined,
                    storage: formData.storage || undefined,
                },
                warranty_expiry: formData.warranty_expiry || null,
                purchase_date: formData.purchase_date || null,
                image_url: uploadedImageUrl,
                proof_doc_url: uploadedDocUrl,
            };

            const res = await fetch('/api/assets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const result = await res.json();
            if (result.success) {
                onSuccess();
                onClose();
            } else {
                setErrorMsg(result.message || 'Gagal menyimpan unit');
            }
        } catch {
            setErrorMsg('Gagal terhubung ke server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h3 className="font-bold text-slate-900 text-base">Registrasi Unit Aset Baru</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl font-bold">
                        &times;
                    </button>
                </div>

                {errorMsg && (
                    <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block font-medium text-slate-700 mb-1">
                                Nomor Tag Aset <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="Contoh: IT-NB-2026-0003"
                                value={formData.asset_tag}
                                onChange={(e) => setFormData({ ...formData, asset_tag: e.target.value })}
                                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none uppercase font-mono"
                            />
                        </div>
                        <div>
                            <label className="block font-medium text-slate-700 mb-1">
                                Kategori <span className="text-rose-500">*</span>
                            </label>
                            <select
                                required
                                value={formData.category_id}
                                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            >
                                <option value="">Pilih Kategori</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name} ({c.code})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block font-medium text-slate-700 mb-1">
                                Brand / Merk <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="Lenovo, Dell, dll"
                                value={formData.brand}
                                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block font-medium text-slate-700 mb-1">
                                Model / Seri <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="Latitude 5420"
                                value={formData.model}
                                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block font-medium text-slate-700 mb-1">
                                Serial Number <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="SN-XXXXX"
                                value={formData.serial_number}
                                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                            />
                        </div>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                        <span className="font-semibold text-slate-700 block">Rincian Spesifikasi (Opsional)</span>
                        <div className="grid grid-cols-3 gap-2">
                            <input
                                type="text"
                                placeholder="CPU (cth: i7-1365U)"
                                value={formData.cpu}
                                onChange={(e) => setFormData({ ...formData, cpu: e.target.value })}
                                className="p-2 border border-slate-300 rounded-lg outline-none bg-white"
                            />
                            <input
                                type="text"
                                placeholder="RAM (cth: 16GB)"
                                value={formData.ram}
                                onChange={(e) => setFormData({ ...formData, ram: e.target.value })}
                                className="p-2 border border-slate-300 rounded-lg outline-none bg-white"
                            />
                            <input
                                type="text"
                                placeholder="Disk (cth: 512GB SSD)"
                                value={formData.storage}
                                onChange={(e) => setFormData({ ...formData, storage: e.target.value })}
                                className="p-2 border border-slate-300 rounded-lg outline-none bg-white"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block font-medium text-slate-700 mb-1">Tanggal Pembelian</label>
                            <input
                                type="date"
                                value={formData.purchase_date}
                                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block font-medium text-slate-700 mb-1">Batas Garansi</label>
                            <input
                                type="date"
                                value={formData.warranty_expiry}
                                onChange={(e) => setFormData({ ...formData, warranty_expiry: e.target.value })}
                                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Upload Bukti & Foto Aset (Opsional) */}
                    <div className="p-3 bg-blue-50/50 border border-blue-200/80 rounded-xl space-y-3">
                        <span className="font-semibold text-slate-800 block">Bukti & Lampiran Unit (Opsional)</span>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block font-medium text-slate-700 mb-1 text-[11px]">
                                    Foto Fisik Unit
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            const f = e.target.files[0];
                                            setPhotoFile(f);
                                            const r = new FileReader();
                                            r.onloadend = () => setPhotoPreview(r.result as string);
                                            r.readAsDataURL(f);
                                        }
                                    }}
                                    className="w-full text-[11px] text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer"
                                />
                                {photoPreview && (
                                    <div className="mt-2 relative w-20 h-16 rounded-lg overflow-hidden border border-slate-300">
                                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setPhotoFile(null);
                                                setPhotoPreview(null);
                                            }}
                                            className="absolute top-0 right-0 bg-rose-600 text-white text-[9px] px-1 rounded-bl cursor-pointer"
                                        >
                                            &times;
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block font-medium text-slate-700 mb-1 text-[11px]">
                                    Faktur Pembelian / Garansi (PDF/Gambar)
                                </label>
                                <input
                                    type="file"
                                    accept=".pdf,image/*,.doc,.docx"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            setDocFile(e.target.files[0]);
                                        }
                                    }}
                                    className="w-full text-[11px] text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300 cursor-pointer"
                                />
                                {docFile && (
                                    <p className="mt-1 text-[10px] text-emerald-700 font-medium truncate">
                                        ✓ {docFile.name} ({(docFile.size / 1024).toFixed(1)} KB)
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2 pt-3 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium disabled:opacity-50"
                        >
                            {loading ? 'Menyimpan...' : 'Simpan Aset'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}