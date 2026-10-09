'use client';

import { useState, useEffect } from 'react';
import CreateLicenseModal from '@/components/modals/CreateLicenseModal';

interface LicenseItem {
    id: number;
    software_name: string;
    category: string;
    provider: string | null;
    license_key: string | null;
    total_seats: number;
    billing_cycle: string;
    expiry_date: string | null;
    cost_per_year: number;
}

export default function LicensesPage() {
    const [licenses, setLicenses] = useState<LicenseItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

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
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLicenses();
    }, []);

    const handleDelete = async (id: number, name: string) => {
        if (!window.confirm(`Hapus lisensi "${name}" dari sistem?`)) return;

        try {
            const res = await fetch(`/api/licenses?id=${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                fetchLicenses();
            } else {
                alert(data.message || 'Gagal menghapus lisensi');
            }
        } catch {
            alert('Terjadi kendala jaringan saat menghapus lisensi');
        }
    };

    // Hitung total pengeluaran per tahun & seats
    const totalAnnualCost = licenses.reduce((sum, item) => sum + Number(item.cost_per_year || 0), 0);
    const totalSeats = licenses.reduce((sum, item) => sum + Number(item.total_seats || 0), 0);

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Manajemen Layanan & Lisensi</h1>
                    <p className="text-xs text-slate-500">
                        Monitor kuota pemakaian, biaya, dan renewal untuk Software, Database, AWS, AI Agent, dll.
                    </p>
                </div>
                <button
                    onClick={() => setIsCreateOpen(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                    <span>+</span> Registrasi Lisensi Baru
                </button>
            </div>

            {/* Ringkasan Biaya & Seats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <span className="text-slate-400 text-xs block font-medium">Total Layanan Aktif</span>
                    <p className="text-2xl font-black text-slate-900 mt-1">{licenses.length} Layanan</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <span className="text-slate-400 text-xs block font-medium">Total Kapasitas Kursi (Seats)</span>
                    <p className="text-2xl font-black text-blue-600 mt-1">{totalSeats} User Seat</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <span className="text-slate-400 text-xs block font-medium">Estimasi Pengeluaran / Tahun</span>
                    <p className="text-2xl font-black text-emerald-600 mt-1">
                        Rp {totalAnnualCost.toLocaleString('id-ID')}
                    </p>
                </div>
            </div>

            {/* Tabel Data Lisensi */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                            <tr>
                                <th className="py-3.5 px-4">Nama Layanan</th>
                                <th className="py-3.5 px-4">Kategori & Provider</th>
                                <th className="py-3.5 px-4">Key / API</th>
                                <th className="py-3.5 px-4">Kapasitas</th>
                                <th className="py-3.5 px-4">Biaya</th>
                                <th className="py-3.5 px-4">Kedaluwarsa</th>
                                <th className="py-3.5 px-4 text-center">Status</th>
                                <th className="py-3.5 px-4 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-slate-400">
                                        Memuat data lisensi...
                                    </td>
                                </tr>
                            ) : licenses.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                                        Belum ada lisensi software yang terdaftar.
                                    </td>
                                </tr>
                            ) : (
                                licenses.map((item) => {
                                    const isExpired =
                                        item.expiry_date && new Date(item.expiry_date) < new Date();

                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50/75 transition-colors">
                                            <td className="py-3.5 px-4">
                                                <div className="font-semibold text-slate-900">{item.software_name}</div>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="font-medium text-slate-700">{item.category}</div>
                                                {item.provider && (
                                                    <div className="text-[10px] text-slate-500">{item.provider}</div>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 font-mono text-[10px] text-slate-500 truncate max-w-[150px]">
                                                {item.license_key || (
                                                    <span className="italic text-slate-400">N/A</span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 font-medium text-slate-700">
                                                {item.total_seats}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="font-mono font-medium text-slate-800">
                                                    {Number(item.cost_per_year) > 0
                                                        ? `Rp ${Number(item.cost_per_year).toLocaleString('id-ID')}`
                                                        : 'Gratis'}
                                                </div>
                                                <div className="text-[10px] text-slate-500">{item.billing_cycle}</div>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                {item.expiry_date ? (
                                                    new Date(item.expiry_date).toLocaleDateString('id-ID')
                                                ) : (
                                                    <span className="text-slate-400">Lifetime</span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 text-center">
                                                <span
                                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                                        isExpired
                                                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                                                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                    }`}
                                                >
                                                    {isExpired ? 'EXPIRED' : 'ACTIVE'}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-center">
                                                <button
                                                    onClick={() =>
                                                        handleDelete(item.id, item.software_name)
                                                    }
                                                    title="Hapus Lisensi"
                                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                                >
                                                    <svg
                                                        className="w-4 h-4"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth="2"
                                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                        />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <CreateLicenseModal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onSuccess={fetchLicenses}
            />
        </div>
    );
}