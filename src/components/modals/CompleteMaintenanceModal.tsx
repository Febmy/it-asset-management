'use client';

import { useState } from 'react';

interface CompleteMaintenanceModalProps {
    isOpen: boolean;
    maintenanceId: number | null;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CompleteMaintenanceModal({
    isOpen,
    maintenanceId,
    onClose,
    onSuccess,
}: CompleteMaintenanceModalProps) {
    const [actionTaken, setActionTaken] = useState('');
    const [finalCost, setFinalCost] = useState('');
    const [targetStatus, setTargetStatus] = useState<'deployed' | 'in_stock'>('deployed');
    const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    if (!isOpen || !maintenanceId) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        try {
            let invoiceUrl: string | null = null;

            if (invoiceFile) {
                const iForm = new FormData();
                iForm.append('file', invoiceFile);
                iForm.append('type', 'maintenance_invoice');
                const iRes = await fetch('/api/assets/upload-proof', { method: 'POST', body: iForm });
                const iData = await iRes.json();
                if (iData.success) invoiceUrl = iData.url;
            }

            const res = await fetch('/api/assets/maintenance', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    maintenance_id: maintenanceId,
                    action_taken: actionTaken || 'Unit selesai diperbaiki dan normal',
                    final_cost: finalCost ? Number(finalCost) : null,
                    target_status: targetStatus,
                    invoice_proof_url: invoiceUrl,
                }),
            });

            const result = await res.json();
            if (result.success) {
                onSuccess();
                onClose();
            } else {
                setErrorMsg(result.message || 'Gagal memperbarui data servis');
            }
        } catch {
            setErrorMsg('Gagal terhubung ke server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md bg-white rounded-2xl p-5 shadow-xl">
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h3 className="font-bold text-slate-900 text-sm">Selesaikan Tiket Perbaikan</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg font-bold">
                        &times;
                    </button>
                </div>

                {errorMsg && (
                    <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
                    <div>
                        <label className="block font-medium text-slate-700 mb-1">
                            Tindakan / Solusi yang Dilakukan <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                            rows={3}
                            required
                            placeholder="Contoh: Penggantian motherboard, ganti LCD, install ulang OS"
                            value={actionTaken}
                            onChange={(e) => setActionTaken(e.target.value)}
                            className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block font-medium text-slate-700 mb-1">Biaya Akhir Perbaikan (IDR)</label>
                        <input
                            type="number"
                            placeholder="Biaya riil servis (kosongkan jika tidak ada tambahan)"
                            value={finalCost}
                            onChange={(e) => setFinalCost(e.target.value)}
                            className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block font-medium text-slate-700 mb-1">Status Aset Setelah Selesai Servis</label>
                        <select
                            value={targetStatus}
                            onChange={(e) => setTargetStatus(e.target.value as 'deployed' | 'in_stock')}
                            className="w-full p-2.5 border border-slate-300 rounded-xl bg-white outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-700"
                        >
                            <option value="deployed">Aktif Digunakan (Deployed)</option>
                            <option value="in_stock">Tersedia di Gudang (In Stock)</option>
                        </select>
                    </div>

                    {/* Bukti Nota / Kuitansi Servis (Opsional) */}
                    <div>
                        <label className="block font-medium text-slate-700 mb-1">
                            Foto Nota / Kuitansi Pembayaran Servis (Opsional)
                        </label>
                        <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                    setInvoiceFile(e.target.files[0]);
                                }
                            }}
                            className="w-full text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                        />
                        {invoiceFile && (
                            <p className="mt-1 text-[11px] text-emerald-600 font-medium">
                                ✓ {invoiceFile.name} ({(invoiceFile.size / 1024).toFixed(1)} KB)
                            </p>
                        )}
                    </div>

                    <div className="flex gap-2 pt-2 border-t">
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
                            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium disabled:opacity-50"
                        >
                            {loading ? 'Menyimpan...' : 'Tandai Selesai'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}