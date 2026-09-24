'use client';

import { useState, useRef } from 'react';

interface UploadProofModalProps {
    asset: {
        id: number;
        asset_tag: string;
        brand: string;
        model: string;
        image_url?: string | null;
        proof_doc_url?: string | null;
        proof_notes?: string | null;
    };
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function UploadProofModal({
    asset,
    isOpen,
    onClose,
    onSuccess,
}: UploadProofModalProps) {
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(asset.image_url || null);
    const [docFile, setDocFile] = useState<File | null>(null);
    const [proofNotes, setProofNotes] = useState(asset.proof_notes || '');

    const [uploading, setUploading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const photoInputRef = useRef<HTMLInputElement>(null);
    const docInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handlePhotoSelect = (file: File) => {
        setPhotoFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setPhotoPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);
        setErrorMsg('');

        try {
            let finalImageUrl = asset.image_url;
            let finalDocUrl = asset.proof_doc_url;

            // 1. Upload Foto jika ada file baru dipilih
            if (photoFile) {
                const photoFormData = new FormData();
                photoFormData.append('file', photoFile);
                photoFormData.append('type', 'photo');
                photoFormData.append('asset_id', String(asset.id));

                const photoRes = await fetch('/api/assets/upload-proof', {
                    method: 'POST',
                    body: photoFormData,
                });
                const photoResult = await photoRes.json();
                if (!photoResult.success) {
                    throw new Error(photoResult.message || 'Gagal mengunggah foto unit');
                }
                finalImageUrl = photoResult.url;
            }

            // 2. Upload Dokumen Bukti/Faktur jika ada file baru dipilih
            if (docFile) {
                const docFormData = new FormData();
                docFormData.append('file', docFile);
                docFormData.append('type', 'document');
                docFormData.append('asset_id', String(asset.id));

                const docRes = await fetch('/api/assets/upload-proof', {
                    method: 'POST',
                    body: docFormData,
                });
                const docResult = await docRes.json();
                if (!docResult.success) {
                    throw new Error(docResult.message || 'Gagal mengunggah dokumen bukti');
                }
                finalDocUrl = docResult.url;
            }

            // 3. Simpan perubahan notes / urls jika perlu
            if (proofNotes !== (asset.proof_notes || '')) {
                await fetch(`/api/assets/${asset.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        proof_notes: proofNotes,
                        image_url: finalImageUrl,
                        proof_doc_url: finalDocUrl,
                    }),
                });
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Upload proof error:', err);
            setErrorMsg(err.message || 'Gagal menyimpan bukti aset');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
            <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <div>
                        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                            <span>📸</span> Unggah Bukti & Dokumen Aset
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                            {asset.brand} {asset.model} &bull; <span className="font-mono">{asset.asset_tag}</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 text-xl font-bold leading-none cursor-pointer"
                    >
                        &times;
                    </button>
                </div>

                {errorMsg && (
                    <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                    {/* Input Foto Fisik Unit */}
                    <div>
                        <label className="block font-semibold text-slate-700 mb-1.5">
                            Foto Fisik Unit (Laptop / Perangkat)
                        </label>
                        <input
                            ref={photoInputRef}
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                    handlePhotoSelect(e.target.files[0]);
                                }
                            }}
                            className="hidden"
                        />

                        {photoPreview ? (
                            <div className="relative border border-slate-200 rounded-2xl overflow-hidden group bg-slate-50">
                                <img
                                    src={photoPreview}
                                    alt="Foto Fisik Aset"
                                    className="w-full h-44 object-cover object-center"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => photoInputRef.current?.click()}
                                        className="px-3 py-1.5 bg-white/90 hover:bg-white text-slate-800 rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
                                    >
                                        Ganti Foto
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPhotoFile(null);
                                            setPhotoPreview(null);
                                        }}
                                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
                                    >
                                        Hapus
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div
                                onClick={() => photoInputRef.current?.click()}
                                className="border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-slate-50/60 rounded-2xl p-5 text-center cursor-pointer transition-all"
                            >
                                <span className="text-2xl block mb-1">📷</span>
                                <p className="font-semibold text-slate-700">Pilih Foto Fisik Unit</p>
                                <p className="text-[11px] text-slate-400 mt-0.5">Format JPG, PNG, WEBP (Maks 10MB)</p>
                            </div>
                        )}
                    </div>

                    {/* Input Dokumen Bukti Pembelian / Faktur */}
                    <div>
                        <label className="block font-semibold text-slate-700 mb-1.5">
                            Dokumen / Faktur Pembelian / Kartu Garansi
                        </label>
                        <input
                            ref={docInputRef}
                            type="file"
                            accept=".pdf,image/*,.doc,.docx"
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                    setDocFile(e.target.files[0]);
                                }
                            }}
                            className="hidden"
                        />

                        <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 overflow-hidden">
                                <span className="text-xl shrink-0">📄</span>
                                <div className="truncate">
                                    <p className="font-semibold text-slate-800 truncate">
                                        {docFile
                                            ? docFile.name
                                            : asset.proof_doc_url
                                            ? 'Dokumen bukti telah tersimpan'
                                            : 'Belum ada dokumen yang diunggah'}
                                    </p>
                                    <p className="text-[11px] text-slate-400">
                                        {docFile
                                            ? `${(docFile.size / 1024).toFixed(1)} KB`
                                            : asset.proof_doc_url
                                            ? 'Klik ganti dokumen jika ingin memperbarui'
                                            : 'Mendukung PDF, Foto Faktur, atau DOC'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                                {asset.proof_doc_url && !docFile && (
                                    <a
                                        href={asset.proof_doc_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold"
                                    >
                                        Lihat
                                    </a>
                                )}
                                <button
                                    type="button"
                                    onClick={() => docInputRef.current?.click()}
                                    className="px-2.5 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-xs font-semibold cursor-pointer"
                                >
                                    {asset.proof_doc_url || docFile ? 'Ganti File' : 'Pilih File'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Catatan Bukti */}
                    <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                            Catatan Bukti / Keterangan Pembelian (Opsional)
                        </label>
                        <textarea
                            rows={2}
                            value={proofNotes}
                            onChange={(e) => setProofNotes(e.target.value)}
                            placeholder="Contoh: Dibeli melalui vendor PT Sumber Solusi, PO #4410, kondisi baru garansi 3 tahun"
                            className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                        />
                    </div>

                    <div className="flex gap-2 pt-3 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 cursor-pointer"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={uploading || (!photoFile && !docFile && proofNotes === (asset.proof_notes || ''))}
                            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl font-medium cursor-pointer transition-colors"
                        >
                            {uploading ? 'Mengunggah...' : 'Simpan Bukti'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
