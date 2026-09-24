'use client';

import { useState, useEffect } from 'react';

interface CheckoutModalProps {
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

interface UserOption {
    id: number;
    name: string;
    employee_id: string;
    department: string;
}

export default function CheckoutModal({ asset, isOpen, onClose, onSuccess }: CheckoutModalProps) {
    const [users, setUsers] = useState<UserOption[]>([]);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetch('/api/users')
                .then((res) => res.json())
                .then((data) => {
                    if (data.success) setUsers(data.data);
                })
                .catch(() => setErrorMsg('Gagal memuat daftar karyawan'));
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUserId) {
            setErrorMsg('Pilih karyawan penerima');
            return;
        }

        setSubmitting(true);
        setErrorMsg('');

        try {
            const res = await fetch('/api/assets/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    asset_id: asset.id,
                    user_id: Number(selectedUserId),
                    condition_notes: notes,
                }),
            });

            const result = await res.json();
            if (result.success) {
                // Otomatis buka dokumen BAST di tab baru
                if (result.data?.assignment_id) {
                    window.open(`/api/assets/bast/${result.data.assignment_id}`, '_blank');
                }
                onSuccess();
                onClose();
            } else {
                setErrorMsg(result.message || 'Gagal memproses penyerahan');
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
                    <h3 className="font-bold text-slate-900 text-sm">Penyerahan Unit (Check-out)</h3>
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
                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                        <span className="block font-medium text-slate-500 text-[11px]">Unit yang diserahkan:</span>
                        <p className="text-sm font-bold text-slate-800 mt-0.5">{asset.brand} {asset.model}</p>
                        <p className="text-xs font-mono text-slate-600">{asset.asset_tag}</p>
                    </div>

                    <div>
                        <label className="block font-medium text-slate-700 mb-1">Penerima / Karyawan</label>
                        <select
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                            className="w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                            required
                        >
                            <option value="">-- Pilih Karyawan --</option>
                            {users.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.name} ({u.employee_id}) - {u.department || 'No Dept'}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block font-medium text-slate-700 mb-1">Catatan Kelengkapan Awal</label>
                        <textarea
                            rows={2}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Contoh: Unit baru unbox, kelengkapan charger 65W, mouse wireless"
                            className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
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
                            disabled={submitting}
                            className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50"
                        >
                            {submitting ? 'Memproses...' : 'Simpan & Buat BAST'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}