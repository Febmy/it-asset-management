'use client';

import { useState } from 'react';
import { toast } from 'sonner';

export interface LicenseFormData {
    id?: number;
    software_name: string;
    category: string;
    provider: string;
    license_key: string;
    total_seats: string | number;
    billing_cycle: string;
    start_date: string;
    expiry_date: string;
    cost_per_year: string | number;
    admin_email: string;
    auto_renew: boolean;
    notes: string;
}

interface LicenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: LicenseFormData | null;
}

const defaultFormData: LicenseFormData = {
    software_name: '',
    category: 'Software',
    provider: '',
    license_key: '',
    total_seats: '1',
    billing_cycle: 'Tahunan',
    start_date: '',
    expiry_date: '',
    cost_per_year: '',
    admin_email: '',
    auto_renew: false,
    notes: '',
};

export default function LicenseModal({ isOpen, onClose, onSuccess, initialData }: LicenseModalProps) {
    const isEdit = Boolean(initialData?.id);
    const [formData, setFormData] = useState<LicenseFormData>(() => {
        if (initialData) {
            return {
                id: initialData.id,
                software_name: initialData.software_name || '',
                category: initialData.category || 'Software',
                provider: initialData.provider || '',
                license_key: initialData.license_key || '',
                total_seats: initialData.total_seats ?? '1',
                billing_cycle: initialData.billing_cycle || 'Tahunan',
                start_date: initialData.start_date ? initialData.start_date.split('T')[0] : '',
                expiry_date: initialData.expiry_date ? initialData.expiry_date.split('T')[0] : '',
                cost_per_year: initialData.cost_per_year ?? '',
                admin_email: initialData.admin_email || '',
                auto_renew: Boolean(initialData.auto_renew),
                notes: initialData.notes || '',
            };
        }
        return defaultFormData;
    });
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    if (!isOpen) return null;

    const handleExtendOneYear = () => {
        let baseDate = new Date();
        if (formData.expiry_date) {
            const currentExpiry = new Date(formData.expiry_date);
            if (!isNaN(currentExpiry.getTime())) {
                baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
            }
        }
        baseDate.setFullYear(baseDate.getFullYear() + 1);
        const yyyy = baseDate.getFullYear();
        const mm = String(baseDate.getMonth() + 1).padStart(2, '0');
        const dd = String(baseDate.getDate()).padStart(2, '0');
        setFormData((prev) => ({
            ...prev,
            expiry_date: `${yyyy}-${mm}-${dd}`,
        }));
        toast.info('Tanggal jatuh tempo diperpanjang 1 tahun ke depan.');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.software_name.trim()) {
            setErrorMsg('Nama layanan / software wajib diisi');
            return;
        }

        setLoading(true);
        setErrorMsg('');

        try {
            const url = '/api/licenses';
            const method = isEdit ? 'PUT' : 'POST';

            const payload = {
                ...formData,
                total_seats: Number(formData.total_seats) || 1,
                cost_per_year: formData.cost_per_year ? Number(formData.cost_per_year) : 0,
                start_date: formData.start_date || null,
                expiry_date: formData.expiry_date || null,
            };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const result = await res.json();
            if (result.success) {
                toast.success(isEdit ? 'Data langganan berhasil diperbarui' : 'Langganan baru berhasil didaftarkan');
                onSuccess();
                onClose();
            } else {
                setErrorMsg(result.message || 'Gagal menyimpan data');
            }
        } catch {
            setErrorMsg('Terjadi kendala jaringan saat menghubungi server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs overflow-y-auto">
            <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl my-8">
                {/* Header */}
                <div className="flex justify-between items-center border-b border-slate-100 pb-3.5 mb-4">
                    <div>
                        <h3 className="font-bold text-slate-900 text-base">
                            {isEdit ? 'Edit Langganan & Lisensi' : 'Registrasi Langganan & Lisensi Baru'}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Kelola siklus langganan Microsoft, Apple Developer, SaaS, dan Cloud Service.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                        &times;
                    </button>
                </div>

                {errorMsg && (
                    <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{errorMsg}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                    {/* Baris 1: Nama Layanan & Vendor */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block font-medium text-slate-700 mb-1">
                                Nama Software / Layanan <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="Contoh: Microsoft 365, Apple Dev"
                                value={formData.software_name}
                                onChange={(e) => setFormData({ ...formData, software_name: e.target.value })}
                                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block font-medium text-slate-700 mb-1">Penyedia (Provider / Vendor)</label>
                            <input
                                type="text"
                                placeholder="Apple Inc, Microsoft, AWS, dll"
                                value={formData.provider}
                                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Baris 2: Kategori & Akun Admin */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block font-medium text-slate-700 mb-1">Kategori Layanan</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                            >
                                <option value="Software">Software Desktop / Office</option>
                                <option value="Developer Platform">Developer Platform (Apple, Google Play)</option>
                                <option value="Cloud Infrastructure">Cloud Infrastructure (AWS, Azure, GCP)</option>
                                <option value="SaaS">SaaS & Produktivitas (Figma, Canva, Zoom)</option>
                                <option value="AI Agent">AI Platform & API (OpenAI, Anthropic)</option>
                                <option value="Database">Database & Backend</option>
                                <option value="Lainnya">Lainnya</option>
                            </select>
                        </div>
                        <div>
                            <label className="block font-medium text-slate-700 mb-1">Akun Admin Terdaftar / Apple ID</label>
                            <input
                                type="email"
                                placeholder="admin@perusahaan.com"
                                value={formData.admin_email}
                                onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Baris 3: Siklus Tagihan & Biaya */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block font-medium text-slate-700 mb-1">Siklus Penagihan</label>
                            <select
                                value={formData.billing_cycle}
                                onChange={(e) => setFormData({ ...formData, billing_cycle: e.target.value })}
                                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                            >
                                <option value="Tahunan">Tahunan (Annual Renewal)</option>
                                <option value="Bulanan">Bulanan (Monthly)</option>
                                <option value="Triwulanan">Triwulanan (Quarterly)</option>
                                <option value="Semesteran">Semesteran (6 Bulan)</option>
                                <option value="Pay-as-you-go">Pay-as-you-go (Berdasarkan Pemakaian)</option>
                                <option value="Lifetime">Lifetime (Sekali Bayar)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block font-medium text-slate-700 mb-1">Biaya per Siklus (IDR)</label>
                            <input
                                type="number"
                                placeholder="Contoh: 1599000"
                                value={formData.cost_per_year}
                                onChange={(e) => setFormData({ ...formData, cost_per_year: e.target.value })}
                                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Baris 4: Tanggal Mulai & Tanggal Jatuh Tempo */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block font-medium text-slate-700 mb-1">Tanggal Mulai Langganan</label>
                            <input
                                type="date"
                                value={formData.start_date}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block font-medium text-slate-700">Tanggal Jatuh Tempo (Renewal)</label>
                                {isEdit && (
                                    <button
                                        type="button"
                                        onClick={handleExtendOneYear}
                                        className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold hover:underline"
                                    >
                                        +1 Thn
                                    </button>
                                )}
                            </div>
                            <input
                                type="date"
                                value={formData.expiry_date}
                                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Baris 5: Kuota Kursi & Kunci Lisensi */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block font-medium text-slate-700 mb-1">
                                Kuota Kursi (Seats) / Instans
                            </label>
                            <input
                                type="number"
                                min="1"
                                placeholder="1"
                                value={formData.total_seats}
                                onChange={(e) => setFormData({ ...formData, total_seats: e.target.value })}
                                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block font-medium text-slate-700 mb-1">License Key / Org ID / Order No.</label>
                            <input
                                type="text"
                                placeholder="XXXXX-XXXXX atau Agreement ID"
                                value={formData.license_key}
                                onChange={(e) => setFormData({ ...formData, license_key: e.target.value })}
                                className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-[11px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Baris 6: Auto-Renew Toggle */}
                    <div className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <input
                            type="checkbox"
                            id="auto_renew"
                            checked={formData.auto_renew}
                            onChange={(e) => setFormData({ ...formData, auto_renew: e.target.checked })}
                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                        />
                        <label htmlFor="auto_renew" className="font-medium text-slate-800 cursor-pointer select-none">
                            Perpanjangan Otomatis (Auto-Renew)
                            <span className="block text-[10px] text-slate-500 font-normal">
                                Centang jika langganan ini dipotong otomatis via Kartu Kredit korporat.
                            </span>
                        </label>
                    </div>

                    {/* Baris 7: Catatan & Nomor Dokumen */}
                    <div>
                        <label className="block font-medium text-slate-700 mb-1">Catatan Tambahan / Link PO / SLA</label>
                        <textarea
                            rows={2}
                            placeholder="Catatan nomor invoice, tim pemohon, atau ketentuan renewal khusus..."
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                    </div>

                    {/* Footer Tombol */}
                    <div className="flex gap-2 pt-2 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-sm disabled:opacity-50 transition-colors cursor-pointer"
                        >
                            {loading ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Daftarkan Langganan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
