'use client';

import React, { useState } from 'react';

interface DisposalModalProps {
    asset: {
        id: number;
        asset_tag: string;
        brand: string;
        model: string;
        serial_number?: string;
    };
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function DisposalModal({
    asset,
    isOpen,
    onClose,
    onSuccess,
}: DisposalModalProps) {
    const [disposalType, setDisposalType] = useState('scrap');
    const [residualValue, setResidualValue] = useState('0');
    const [dataWiped, setDataWiped] = useState(true);
    const [wipeMethod, setWipeMethod] = useState('NIST 800-88 Clear');
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason.trim()) {
            setErrorMsg('Alasan pemusnahan/penghapusan unit wajib diisi');
            return;
        }

        setSubmitting(true);
        setErrorMsg('');

        try {
            const res = await fetch('/api/assets/disposal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    asset_id: asset.id,
                    disposal_type: disposalType,
                    residual_value: Number(residualValue) || 0,
                    data_wiped: dataWiped,
                    wipe_method: dataWiped ? wipeMethod : null,
                    reason: reason.trim(),
                }),
            });

            const result = await res.json();
            if (result.success) {
                onSuccess();
                onClose();
            } else {
                setErrorMsg(result.message || 'Gagal memproses disposal aset');
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
                    <div>
                        <h3 className="font-bold text-slate-900 text-sm">Penghapusan / Pemusnahan Unit (Disposal)</h3>
                        <p className="text-[11px] text-slate-500">Unit akan diarsipkan secara permanen sebagai nonaktif</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
                    >
                        &times;
                    </button>
                </div>

                {errorMsg && (
                    <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
                    {/* Ringkasan Unit */}
                    <div className="bg-rose-50/60 border border-rose-100 p-3 rounded-xl">
                        <span className="text-[10px] uppercase font-bold text-rose-600 tracking-wider">Perangkat Target</span>
                        <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">{asset.asset_tag}</div>
                        <div className="text-slate-600">{asset.brand} {asset.model}</div>
                    </div>

                    {/* Tipe Disposal */}
                    <div>
                        <label className="block text-slate-600 font-semibold mb-1">
                            Metode / Tipe Penghapusan <span className="text-rose-500">*</span>
                        </label>
                        <select
                            value={disposalType}
                            onChange={(e) => setDisposalType(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                        >
                            <option value="scrap">Scrap / Dibuang (Kerusakan Fatal/Tidak Ekonomis)</option>
                            <option value="sale">Dijual / Lelang Bekas (Asset Sale)</option>
                            <option value="donation">Didonasikan (CSR / Yayasan)</option>
                            <option value="recycle">Didaur Ulang (E-Waste Recycling)</option>
                            <option value="lost">Hilang / Tidak Ditemukan</option>
                        </select>
                    </div>

                    {/* Nilai Residu / Harga Jual */}
                    <div>
                        <label className="block text-slate-600 font-semibold mb-1">
                            Nilai Residu / Nilai Jual (Rp)
                        </label>
                        <input
                            type="number"
                            min="0"
                            step="1000"
                            value={residualValue}
                            onChange={(e) => setResidualValue(e.target.value)}
                            placeholder="0 jika dibuang/rusak total"
                            className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                        />
                    </div>

                    {/* Penghapusan Data (Security Compliance) */}
                    <div className="border border-slate-200 p-3 rounded-xl space-y-2 bg-slate-50/50">
                        <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                            <input
                                type="checkbox"
                                checked={dataWiped}
                                onChange={(e) => setDataWiped(e.target.checked)}
                                className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500"
                            />
                            <span>Data Storage Telah Dihapus / Sanitasi (Data Wipe)</span>
                        </label>

                        {dataWiped && (
                            <div>
                                <label className="block text-slate-500 text-[11px] mb-1">Metode Penghapusan Data</label>
                                <select
                                    value={wipeMethod}
                                    onChange={(e) => setWipeMethod(e.target.value)}
                                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                                >
                                    <option value="NIST 800-88 Clear">NIST 800-88 Clear (Cryptographic Erase / Secure Erase)</option>
                                    <option value="DoD 5220.22-M">DoD 5220.22-M (3 Passes Overwrite)</option>
                                    <option value="Physical Destruction">Physical Destruction (Penghancuran Fisik Storage)</option>
                                    <option value="Factory Reset">Factory Reset (OS Default Format)</option>
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Alasan Pemusnahan */}
                    <div>
                        <label className="block text-slate-600 font-semibold mb-1">
                            Alasan & Keterangan Penghapusan <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                            rows={3}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Contoh: Motherboard mati total, biaya perbaikan melebihi nilai unit baru..."
                            className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                        />
                    </div>

                    {/* Tombol Aksi */}
                    <div className="flex justify-end gap-2 pt-2 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 cursor-pointer"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold shadow-sm disabled:opacity-50 cursor-pointer"
                        >
                            {submitting ? 'Memproses...' : 'Konfirmasi Penghapusan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
