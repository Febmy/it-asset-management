'use client';

import { useState, useEffect, useMemo } from 'react';
import LicenseModal, { LicenseFormData } from '@/components/modals/LicenseModal';
import { toast } from 'sonner';

interface LicenseItem {
    id: number;
    software_name: string;
    category: string;
    provider: string | null;
    license_key: string | null;
    total_seats: number;
    billing_cycle: string;
    start_date: string | null;
    expiry_date: string | null;
    cost_per_year: number;
    admin_email: string | null;
    auto_renew: boolean;
    notes: string | null;
}

export default function LicensesPage() {
    const [licenses, setLicenses] = useState<LicenseItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<LicenseFormData | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [revealedKeys, setRevealedKeys] = useState<{ [id: number]: boolean }>({});

    const fetchLicenses = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/licenses');
            const data = await res.json();
            if (data.success) {
                setLicenses(data.data || []);
            }
        } catch (err) {
            console.error('Failed to load licenses', err);
            toast.error('Gagal mengambil data lisensi');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLicenses();
    }, []);

    const toggleKeyVisibility = (id: number) => {
        setRevealedKeys((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} berhasil disalin`);
    };

    const handleOpenCreate = () => {
        setEditingItem(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (item: LicenseItem) => {
        setEditingItem({
            id: item.id,
            software_name: item.software_name,
            category: item.category,
            provider: item.provider || '',
            license_key: item.license_key || '',
            total_seats: item.total_seats,
            billing_cycle: item.billing_cycle,
            start_date: item.start_date || '',
            expiry_date: item.expiry_date || '',
            cost_per_year: item.cost_per_year,
            admin_email: item.admin_email || '',
            auto_renew: item.auto_renew,
            notes: item.notes || '',
        });
        setIsModalOpen(true);
    };

    const handleQuickRenew = async (item: LicenseItem) => {
        let baseDate = new Date();
        if (item.expiry_date) {
            const curDate = new Date(item.expiry_date);
            if (!isNaN(curDate.getTime()) && curDate > new Date()) {
                baseDate = curDate;
            }
        }
        baseDate.setFullYear(baseDate.getFullYear() + 1);
        const yyyy = baseDate.getFullYear();
        const mm = String(baseDate.getMonth() + 1).padStart(2, '0');
        const dd = String(baseDate.getDate()).padStart(2, '0');
        const newExpiry = `${yyyy}-${mm}-${dd}`;

        if (!window.confirm(`Perpanjang langganan "${item.software_name}" 1 tahun ke depan (hingga ${dd}/${mm}/${yyyy})?`)) {
            return;
        }

        try {
            const res = await fetch('/api/licenses', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: item.id,
                    software_name: item.software_name,
                    category: item.category,
                    provider: item.provider,
                    license_key: item.license_key,
                    total_seats: item.total_seats,
                    billing_cycle: item.billing_cycle,
                    start_date: item.start_date,
                    expiry_date: newExpiry,
                    cost_per_year: item.cost_per_year,
                    admin_email: item.admin_email,
                    auto_renew: item.auto_renew,
                    notes: item.notes ? `${item.notes} | Diperpanjang otomatis pada ${new Date().toLocaleDateString('id-ID')}` : `Diperpanjang pada ${new Date().toLocaleDateString('id-ID')}`,
                }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`Langganan ${item.software_name} berhasil diperpanjang hingga ${dd}/${mm}/${yyyy}`);
                fetchLicenses();
            } else {
                toast.error(data.message || 'Gagal memperpanjang langganan');
            }
        } catch {
            toast.error('Terjadi kendala jaringan saat memperpanjang langganan');
        }
    };

    const handleDelete = async (id: number, name: string) => {
        if (!window.confirm(`Hapus langganan / lisensi "${name}" dari sistem?`)) return;

        try {
            const res = await fetch(`/api/licenses?id=${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                toast.success(`Lisensi "${name}" berhasil dihapus`);
                fetchLicenses();
            } else {
                toast.error(data.message || 'Gagal menghapus lisensi');
            }
        } catch {
            toast.error('Terjadi kendala jaringan saat menghapus lisensi');
        }
    };

    // Helper kalkulasi sisa hari dan status
    const calculateStatus = (expiryDateStr: string | null) => {
        if (!expiryDateStr) {
            return { type: 'lifetime', label: 'LIFETIME', daysLeft: null, badgeClass: 'bg-slate-100 text-slate-700 border-slate-200' };
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiry = new Date(expiryDateStr);
        expiry.setHours(0, 0, 0, 0);

        const diffTime = expiry.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return {
                type: 'expired',
                label: `EXPIRED (${Math.abs(diffDays)} hari lalu)`,
                daysLeft: diffDays,
                badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 font-bold',
            };
        }
        if (diffDays <= 30) {
            return {
                type: 'expiring_soon',
                label: `JATUH TEMPO (${diffDays} hari lagi)`,
                daysLeft: diffDays,
                badgeClass: 'bg-amber-50 text-amber-700 border-amber-300 font-bold animate-pulse',
            };
        }
        return {
            type: 'active',
            label: `AKTIF (${diffDays} hari lagi)`,
            daysLeft: diffDays,
            badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold',
        };
    };

    // Filter data
    const filteredLicenses = useMemo(() => {
        return licenses.filter((item) => {
            const matchesSearch =
                item.software_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.provider && item.provider.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (item.admin_email && item.admin_email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (item.license_key && item.license_key.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter;

            const st = calculateStatus(item.expiry_date);
            const matchesStatus =
                statusFilter === 'ALL' ||
                (statusFilter === 'ACTIVE' && (st.type === 'active' || st.type === 'lifetime')) ||
                (statusFilter === 'EXPIRING' && st.type === 'expiring_soon') ||
                (statusFilter === 'EXPIRED' && st.type === 'expired');

            return matchesSearch && matchesCategory && matchesStatus;
        });
    }, [licenses, searchTerm, categoryFilter, statusFilter]);

    // Ringkasan Finansial & Operasional
    const totalAnnualCost = licenses.reduce((sum, item) => sum + Number(item.cost_per_year || 0), 0);
    const totalSeats = licenses.reduce((sum, item) => sum + Number(item.total_seats || 0), 0);
    const expiringSoonCount = licenses.filter((l) => {
        const st = calculateStatus(l.expiry_date);
        return st.type === 'expiring_soon';
    }).length;
    const expiredCount = licenses.filter((l) => {
        const st = calculateStatus(l.expiry_date);
        return st.type === 'expired';
    }).length;

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <span>Manajemen Langganan & Lisensi</span>
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                        Pusat pemantauan jangka waktu langganan, jatuh tempo perpanjangan (renewal), kapasitas kursi, dan biaya vendor (Apple, Microsoft, Cloud, SaaS).
                    </p>
                </div>
                <button
                    onClick={handleOpenCreate}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-2 transition-all cursor-pointer hover:shadow"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Registrasi Langganan Baru</span>
                </button>
            </div>

            {/* Banner Peringatan jika ada yang segera jatuh tempo */}
            {expiringSoonCount > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500 text-white rounded-xl shrink-0">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-amber-900">
                                Perhatian: Ada {expiringSoonCount} Layanan / Lisensi Mendekati Jatuh Tempo (H-30)
                            </h4>
                            <p className="text-[11px] text-amber-700 mt-0.5">
                                Segera lakukan perpanjangan atau koordinasikan alokasi anggaran dengan Finance untuk mencegah gangguan layanan.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setStatusFilter('EXPIRING')}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-lg shrink-0 transition-colors cursor-pointer"
                    >
                        Tampilkan Data
                    </button>
                </div>
            )}

            {/* Ringkasan Indikator */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <span className="text-slate-400 text-xs block font-medium">Total Langganan Terdata</span>
                    <div className="flex items-baseline justify-between mt-1">
                        <p className="text-2xl font-black text-slate-900">{licenses.length}</p>
                        <span className="text-[11px] font-medium text-slate-500">Layanan Aktif</span>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <span className="text-slate-400 text-xs block font-medium">Masa Berlaku Kritis</span>
                    <div className="flex items-baseline justify-between mt-1">
                        <p className={`text-2xl font-black ${expiringSoonCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                            {expiringSoonCount}
                        </p>
                        <span className="text-[11px] font-medium text-amber-600">Jatuh Tempo &le; 30 Hari</span>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <span className="text-slate-400 text-xs block font-medium">Total Kapasitas Kursi (Seats)</span>
                    <div className="flex items-baseline justify-between mt-1">
                        <p className="text-2xl font-black text-blue-600">{totalSeats}</p>
                        <span className="text-[11px] font-medium text-slate-500">Alokasi User</span>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <span className="text-slate-400 text-xs block font-medium">Estimasi Biaya / Tahun</span>
                    <div className="flex items-baseline justify-between mt-1">
                        <p className="text-xl font-black text-emerald-600">
                            Rp {totalAnnualCost.toLocaleString('id-ID')}
                        </p>
                        <span className="text-[10px] text-slate-400">Total Komitmen</span>
                    </div>
                </div>
            </div>

            {/* Filter & Bar Pencarian */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between text-xs">
                <div className="flex-1 relative">
                    <input
                        type="text"
                        placeholder="Cari software, vendor (Apple, MS), email admin, atau key..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                    <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 cursor-pointer"
                    >
                        <option value="ALL">Semua Kategori</option>
                        <option value="Software">Software Desktop</option>
                        <option value="Developer Platform">Developer Platform</option>
                        <option value="Cloud Infrastructure">Cloud Infrastructure</option>
                        <option value="SaaS">SaaS & Produktivitas</option>
                        <option value="AI Agent">AI Agent / API</option>
                        <option value="Database">Database</option>
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 cursor-pointer"
                    >
                        <option value="ALL">Semua Status Waktu</option>
                        <option value="ACTIVE">Status Aktif</option>
                        <option value="EXPIRING">Segera Jatuh Tempo (H-30)</option>
                        <option value="EXPIRED">Kedaluwarsa (Expired)</option>
                    </select>

                    {(searchTerm || categoryFilter !== 'ALL' || statusFilter !== 'ALL') && (
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setCategoryFilter('ALL');
                                setStatusFilter('ALL');
                            }}
                            className="px-2.5 py-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                        >
                            Reset
                        </button>
                    )}
                </div>
            </div>

            {/* Tabel Data Lisensi */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                            <tr>
                                <th className="py-3.5 px-4">Software & Akun Admin</th>
                                <th className="py-3.5 px-4">Kategori & Vendor</th>
                                <th className="py-3.5 px-4">Key / Order ID</th>
                                <th className="py-3.5 px-4 text-center">Kapasitas</th>
                                <th className="py-3.5 px-4">Biaya & Siklus</th>
                                <th className="py-3.5 px-4">Jangka Waktu</th>
                                <th className="py-3.5 px-4 text-center">Status Waktu</th>
                                <th className="py-3.5 px-4 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="py-12 text-center text-slate-400">
                                        <div className="inline-block animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full mb-2" />
                                        <p>Memuat data lisensi dan siklus langganan...</p>
                                    </td>
                                </tr>
                            ) : filteredLicenses.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-12 text-center text-slate-400 italic">
                                        {licenses.length === 0
                                            ? 'Belum ada langganan atau lisensi software yang terdaftar.'
                                            : 'Tidak ada data langganan yang cocok dengan filter pencarian.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredLicenses.map((item) => {
                                    const st = calculateStatus(item.expiry_date);
                                    const isKeyRevealed = Boolean(revealedKeys[item.id]);

                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50/75 transition-colors">
                                            {/* Software Name & Admin */}
                                            <td className="py-3.5 px-4 max-w-[220px]">
                                                <div className="font-bold text-slate-900 text-sm">
                                                    {item.software_name}
                                                </div>
                                                {item.admin_email ? (
                                                    <div className="text-[11px] text-blue-600 flex items-center gap-1 mt-0.5 font-mono truncate" title={item.admin_email}>
                                                        <span>@</span>
                                                        <span>{item.admin_email}</span>
                                                    </div>
                                                ) : (
                                                    <div className="text-[10px] text-slate-400 italic">Tanpa email admin</div>
                                                )}
                                                {item.notes && (
                                                    <div className="text-[10px] text-slate-500 mt-1 line-clamp-1" title={item.notes}>
                                                        📝 {item.notes}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Kategori & Provider */}
                                            <td className="py-3.5 px-4">
                                                <div className="font-medium text-slate-800">{item.category}</div>
                                                <div className="text-[11px] text-slate-500 mt-0.5">
                                                    {item.provider || 'Vendor Umum'}
                                                </div>
                                                {item.auto_renew && (
                                                    <span className="inline-block mt-1 px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[9px] font-semibold">
                                                        Auto-Renew CC
                                                    </span>
                                                )}
                                            </td>

                                            {/* License Key / ID */}
                                            <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 max-w-[170px]">
                                                {item.license_key ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="truncate">
                                                            {isKeyRevealed
                                                                ? item.license_key
                                                                : '••••••••••••••••'}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleKeyVisibility(item.id)}
                                                            className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
                                                            title={isKeyRevealed ? 'Sembunyikan' : 'Tampilkan'}
                                                        >
                                                            {isKeyRevealed ? '🙈' : '👁️'}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => copyToClipboard(item.license_key!, 'License Key')}
                                                            className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors cursor-pointer"
                                                            title="Salin Key"
                                                        >
                                                            📋
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="italic text-slate-400 text-[10px]">N/A</span>
                                                )}
                                            </td>

                                            {/* Kapasitas Seats */}
                                            <td className="py-3.5 px-4 text-center font-medium text-slate-700">
                                                <span className="px-2 py-1 bg-slate-100 rounded-lg text-slate-800 font-bold">
                                                    {item.total_seats}
                                                </span>
                                                <span className="block text-[10px] text-slate-400 mt-0.5">Kursi</span>
                                            </td>

                                            {/* Biaya & Siklus */}
                                            <td className="py-3.5 px-4">
                                                <div className="font-mono font-bold text-slate-800 text-[12px]">
                                                    {Number(item.cost_per_year) > 0
                                                        ? `Rp ${Number(item.cost_per_year).toLocaleString('id-ID')}`
                                                        : 'Gratis'}
                                                </div>
                                                <div className="text-[10px] text-slate-500 font-medium">
                                                    {item.billing_cycle}
                                                </div>
                                            </td>

                                            {/* Jangka Waktu */}
                                            <td className="py-3.5 px-4 text-[11px]">
                                                {item.start_date && (
                                                    <div className="text-slate-500">
                                                        Mulai: <span className="font-medium text-slate-700">{new Date(item.start_date).toLocaleDateString('id-ID')}</span>
                                                    </div>
                                                )}
                                                <div>
                                                    Tempo: {item.expiry_date ? (
                                                        <span className="font-bold text-slate-900">{new Date(item.expiry_date).toLocaleDateString('id-ID')}</span>
                                                    ) : (
                                                        <span className="text-slate-400 font-medium">Lifetime</span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Status & Sisa Waktu */}
                                            <td className="py-3.5 px-4 text-center">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] border ${st.badgeClass} block whitespace-nowrap`}>
                                                    {st.label}
                                                </span>
                                            </td>

                                            {/* Aksi */}
                                            <td className="py-3.5 px-4 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    {/* Tombol Perpanjang Cepat */}
                                                    <button
                                                        onClick={() => handleQuickRenew(item)}
                                                        title="Perpanjang +1 Tahun"
                                                        className="px-2 py-1 text-[10px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer border border-emerald-200"
                                                    >
                                                        +1 Thn
                                                    </button>

                                                    {/* Tombol Edit */}
                                                    <button
                                                        onClick={() => handleOpenEdit(item)}
                                                        title="Edit Langganan"
                                                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>

                                                    {/* Tombol Hapus */}
                                                    <button
                                                        onClick={() => handleDelete(item.id, item.software_name)}
                                                        title="Hapus Lisensi"
                                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Tambah / Edit */}
            <LicenseModal
                key={editingItem?.id ? `edit-${editingItem.id}` : (isModalOpen ? 'create' : 'closed')}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchLicenses}
                initialData={editingItem}
            />
        </div>
    );
}
