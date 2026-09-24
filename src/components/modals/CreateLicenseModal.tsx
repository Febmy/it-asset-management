'use client';

import { useState } from 'react';

interface CreateLicenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateLicenseModal({ isOpen, onClose, onSuccess }: CreateLicenseModalProps) {
    const [formData, setFormData] = useState({
        software_name: '',
        license_key: '',
        total_seats: '1',
        expiry_date: '',
        cost_per_year: '',
    });
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.software_name.trim()) {
            setErrorMsg('Nama software wajib diisi');
            return;
        }

        setLoading(true);
        setErrorMsg('');

        try {
            const res = await fetch('/api/licenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const result = await res.json();
            if (result.success) {
                onSuccess();
                onClose();
            } else {
                setErrorMsg(result.message || 'Gagal menyimpan lisensi');
            }
        } catch {
            setErrorMsg('Terjadi kendala jaringan');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md bg-white rounded-2xl p-5 shadow-xl">
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h3 className="font-bold text-slate-900 text-sm">Registrasi Lisensi Software</h3>
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
                            Nama Software / Aplikasi <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="Contoh: Microsoft 365 Business Standard"
                            value={formData.software_name}
                            onChange={(e) => setFormData({ ...formData, software_name: e.target.value })}
                            className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block font-medium text-slate-700 mb-1">Kunci Lisensi / Serial Key (Opsional)</label>
                        <input
                            type="text"
                            placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
                            value={formData.license_key}
                            onChange={(e) => setFormData({ ...formData, license_key: e.target.value })}
                            className="w-full p-2.5 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block font-medium text-slate-700 mb-1">
                                Kapasitas Kursi / Seats <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="number"
                                min="1"
                                required
                                value={formData.total_seats}
                                onChange={(e) => setFormData({ ...formData, total_seats: e.target.value })}
                                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block font-medium text-slate-700 mb-1">Biaya per Tahun (IDR)</label>
                            <input
                                type="number"
                                placeholder="Contoh: 1800000"
                                value={formData.cost_per_year}
                                onChange={(e) => setFormData({ ...formData, cost_per_year: e.target.value })}
                                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block font-medium text-slate-700 mb-1">Tanggal Kedaluwarsa (Renewal)</label>
                        <input
                            type="date"
                            value={formData.expiry_date}
                            onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                            className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        />
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
                            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium disabled:opacity-50"
                        >
                            {loading ? 'Menyimpan...' : 'Simpan Lisensi'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}