'use client';

import { useState } from 'react';

interface CheckinModalProps {
    asset: {
        id: number;
        asset_tag: string;
        brand: string;
        model: string;
        current_user_name?: string | null;
        current_user_dept?: string | null;
    };
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CheckinModal({ asset, isOpen, onClose, onSuccess }: CheckinModalProps) {
    const [notes, setNotes] = useState('');
    const [isDamaged, setIsDamaged] = useState(false);
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setErrorMsg('');

        try {
            let returnProofUrl: string | null = null;

            if (proofFile) {
                const pForm = new FormData();
                pForm.append('file', proofFile);
                pForm.append('type', 'return_proof');
                const pRes = await fetch('/api/assets/upload-proof', { method: 'POST', body: pForm });
                const pData = await pRes.json();
                if (pData.success) returnProofUrl = pData.url;
            }

            const res = await fetch('/api/assets/checkin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    asset_id: asset.id,
                    condition_notes: notes,
                    is_damaged: isDamaged,
                    return_proof_url: returnProofUrl,
                }),
            });

            const result = await res.json();
            if (result.success) {
                onSuccess();
                onClose();
            } else {
                setErrorMsg(result.message || 'Gagal memproses penarikan aset');
            }
        } catch {
            setErrorMsg('Terjadi kendala jaringan');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md bg-white rounded-2xl p-5 shadow-lg">
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h3 className="font-bold text-slate-900 text-sm">Tarik Unit (Check-in)</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg leading-none">
                        &times;
                    </button>
                </div>

                {errorMsg && (
                    <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1">
                        <div>
                            <span className="block font-medium text-slate-500 text-[11px]">Unit yang ditarik:</span>
                            <p className="text-sm font-bold text-slate-800 mt-0.5">{asset.brand} {asset.model}</p>
                            <p className="text-xs font-mono text-slate-600">{asset.asset_tag}</p>
                        </div>
                        {asset.current_user_name && (
                            <div className="pt-1 border-t border-slate-200 mt-1">
                                <span className="text-[11px] text-slate-500">Pemegang saat ini: </span>
                                <span className="font-semibold text-slate-700">{asset.current_user_name}</span>
                                {asset.current_user_dept && <span className="text-slate-500"> ({asset.current_user_dept})</span>}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block font-medium text-slate-700 mb-1">Catatan Kondisi Saat Pengembalian</label>
                        <textarea
                            rows={3}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Contoh: Kondisi fisik mulus, kelengkapan adaptor & box lengkap"
                            className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-xs"
                        />
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                        <input
                            type="checkbox"
                            id="isDamaged"
                            checked={isDamaged}
                            onChange={(e) => setIsDamaged(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                        />
                        <label htmlFor="isDamaged" className="text-xs text-amber-900 font-medium cursor-pointer">
                            Unit mengalami kendala / rusak (Ubah status ke <span className="font-bold text-rose-700">Perbaikan / Repair</span>)
                        </label>
                    </div>

                    {/* Bukti Foto / Dokumen Pengembalian (Opsional) */}
                    <div>
                        <label className="block font-medium text-slate-700 mb-1">
                            Foto Kondisi Unit Saat Dikembalikan / BAST (Opsional)
                        </label>
                        <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                    setProofFile(e.target.files[0]);
                                }
                            }}
                            className="w-full text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                        />
                        {proofFile && (
                            <p className="mt-1 text-[11px] text-emerald-600 font-medium">
                                ✓ {proofFile.name} ({(proofFile.size / 1024).toFixed(1)} KB)
                            </p>
                        )}
                    </div>

                    <div className="flex gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl font-medium hover:bg-rose-700 disabled:opacity-50"
                        >
                            {submitting ? 'Memproses...' : 'Konfirmasi Penarikan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}