'use client';

import { useState } from 'react';

interface MaintenanceModalProps {
    asset: {
        id: number;
        asset_tag: string;
        brand: string;
        model: string;
    };
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function MaintenanceModal({ asset, isOpen, onClose, onSuccess }: MaintenanceModalProps) {
    const [issue, setIssue] = useState('');
    const [vendor, setVendor] = useState('');
    const [estimatedCost, setEstimatedCost] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!issue.trim()) {
            setErrorMsg('Deskripsi kendala wajib diisi');
            return;
        }

        setLoading(true);
        setErrorMsg('');

        try {
            const res = await fetch('/api/assets/maintenance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    asset_id: asset.id,
                    issue_description: issue,
                    vendor_name: vendor,
                    cost: estimatedCost ? Number(estimatedCost) : 0,
                }),
            });

            const result = await res.json();
            if (result.success) {
                onSuccess();
                onClose();
            } else {
                setErrorMsg(result.message || 'Gagal membuat tiket perbaikan');
            }
        } catch {
            setErrorMsg('Terjadi kendala jaringan');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md bg-white rounded-2xl p-5 shadow-lg">
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h3 className="font-bold text-slate-900 text-sm">Lapor Kendala / Servis Unit</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg leading-none">
                        &times;
                    </button>
                </div>

                {errorMsg && (
                    <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                        <span className="text-slate-400 block text-[11px]">Unit yang dilaporkan:</span>
                        <p className="text-sm font-bold text-slate-800 mt-0.5">{asset.brand} {asset.model}</p>
                        <p className="text-xs font-mono text-slate-500">{asset.asset_tag}</p>
                    </div>

                    <div>
                        <label className="block font-medium text-slate-700 mb-1">
                            Gejala Kerusakan / Kendala <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                            rows={3}
                            value={issue}
                            onChange={(e) => setIssue(e.target.value)}
                            placeholder="Contoh: Layar flickering, baterai drop, keyboard tombol enter macet"
                            className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                            required
                        />
                    </div>

                    <div>
                        <label className="block font-medium text-slate-700 mb-1">Vendor / Tempat Servis (Opsional)</label>
                        <input
                            type="text"
                            value={vendor}
                            onChange={(e) => setVendor(e.target.value)}
                            placeholder="Contoh: Official Service Center / Internal IT"
                            className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block font-medium text-slate-700 mb-1">Estimasi Biaya (IDR)</label>
                        <input
                            type="number"
                            value={estimatedCost}
                            onChange={(e) => setEstimatedCost(e.target.value)}
                            placeholder="Contoh: 450000"
                            className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                        />
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
                            disabled={loading}
                            className="flex-1 py-2.5 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-700 disabled:opacity-50"
                        >
                            {loading ? 'Menyimpan...' : 'Kirim ke Antrean Servis'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}