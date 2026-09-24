'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface DashboardStats {
    counts: {
        total_assets: string;
        deployed_assets: string;
        instock_assets: string;
        repair_assets: string;
        disposed_assets: string;
    };
    expiringWarranty: Array<{
        id: number;
        asset_tag: string;
        brand: string;
        model: string;
        warranty_expiry: string;
    }>;
    recentAssignments: Array<{
        id: number;
        assigned_date: string;
        status: string;
        asset_tag: string;
        brand: string;
        model: string;
        user_name: string;
    }>;
    totalMaintenanceCost: number;
}

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadStats() {
            try {
                const res = await fetch('/api/dashboard/stats');
                const json = await res.json();
                if (json.success) {
                    setStats(json.data);
                }
            } catch (err) {
                console.error('Failed to load dashboard stats', err);
            } finally {
                setLoading(false);
            }
        }

        loadStats();
    }, []);

    if (loading) {
        return <div className="p-8 text-center text-slate-400 text-xs">Menyiapkan ringkasan dashboard...</div>;
    }

    const counts = stats?.counts;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Dashboard IT Asset</h1>
                    <p className="text-xs text-slate-500">Pusat kendali, status unit perangkat, dan pemeliharaan</p>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href="/scan"
                        className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5"
                    >
                        <span>📷</span> Buka Scanner
                    </Link>
                </div>
            </div>

            {/* Grid 4 Kartu Metrik Utama */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <span className="text-xs text-slate-400 font-medium">Total Hardware</span>
                    <p className="text-2xl font-black text-slate-900 mt-1">{counts?.total_assets || 0}</p>
                    <span className="text-[11px] text-slate-500 mt-1 block">Unit terdaftar di sistem</span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm bg-blue-50/20">
                    <span className="text-xs text-blue-600 font-semibold">Aktif Dipakai (Deployed)</span>
                    <p className="text-2xl font-black text-blue-700 mt-1">{counts?.deployed_assets || 0}</p>
                    <span className="text-[11px] text-blue-500 mt-1 block">Dipegang oleh karyawan</span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm bg-emerald-50/20">
                    <span className="text-xs text-emerald-600 font-semibold">Tersedia (In Stock)</span>
                    <p className="text-2xl font-black text-emerald-700 mt-1">{counts?.instock_assets || 0}</p>
                    <span className="text-[11px] text-emerald-500 mt-1 block">Ready di gudang IT</span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-sm bg-amber-50/20">
                    <span className="text-xs text-amber-600 font-semibold">Perbaikan (In Repair)</span>
                    <p className="text-2xl font-black text-amber-700 mt-1">{counts?.repair_assets || 0}</p>
                    <span className="text-[11px] text-amber-600 mt-1 block">Unit dalam kendala/servis</span>
                </div>
            </div>

            {/* Baris Konten Rinci */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Kolom 1 & 2: Aktivitas Penyerahan Terakhir */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                    <div className="flex justify-between items-center border-b pb-3">
                        <h2 className="text-sm font-bold text-slate-900">Serah Terima Terkini</h2>
                        <Link href="/assets" className="text-xs text-blue-600 font-semibold hover:underline">
                            Lihat Semua &rarr;
                        </Link>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                                <tr>
                                    <th className="py-2.5 px-3">Unit</th>
                                    <th className="py-2.5 px-3">Karyawan</th>
                                    <th className="py-2.5 px-3">Tanggal</th>
                                    <th className="py-2.5 px-3 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                                {stats?.recentAssignments.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-6 text-center text-slate-400 italic">
                                            Belum ada transaksi serah terima.
                                        </td>
                                    </tr>
                                ) : (
                                    stats?.recentAssignments.map((asg) => (
                                        <tr key={asg.id} className="hover:bg-slate-50">
                                            <td className="py-2.5 px-3">
                                                <div className="font-mono font-bold text-blue-600">{asg.asset_tag}</div>
                                                <div className="text-[11px] text-slate-500">{asg.brand} {asg.model}</div>
                                            </td>
                                            <td className="py-2.5 px-3 font-medium text-slate-800">{asg.user_name}</td>
                                            <td className="py-2.5 px-3 text-slate-500">
                                                {new Date(asg.assigned_date).toLocaleDateString('id-ID')}
                                            </td>
                                            <td className="py-2.5 px-3 text-center">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${asg.status === 'active' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                    {asg.status.toUpperCase()}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Kolom 3: Peringatan & Rekap Biaya */}
                <div className="space-y-6">
                    {/* Box Total Pengeluaran Servis */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                        <span className="text-xs text-slate-400 font-medium">Akumulasi Biaya Pemeliharaan</span>
                        <p className="text-xl font-bold font-mono text-slate-900">
                            Rp {stats?.totalMaintenanceCost.toLocaleString('id-ID') || 0}
                        </p>
                        <span className="text-[11px] text-slate-400 block">Total biaya servis hardware</span>
                    </div>

                    {/* Box Peringatan Garansi */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                        <div className="border-b pb-2">
                            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                <span>⚠️</span> Garansi Habis Segera (&lt; 60 Hari)
                            </h3>
                        </div>

                        {stats?.expiringWarranty.length === 0 ? (
                            <p className="text-xs text-slate-400 italic py-2">Tidak ada masa garansi yang mendesak.</p>
                        ) : (
                            <div className="space-y-2.5">
                                {stats?.expiringWarranty.map((item) => (
                                    <div key={item.id} className="text-xs border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                                        <div className="flex justify-between items-center">
                                            <span className="font-mono font-bold text-slate-800">{item.asset_tag}</span>
                                            <span className="text-rose-600 font-semibold text-[11px]">
                                                {new Date(item.warranty_expiry).toLocaleDateString('id-ID')}
                                            </span>
                                        </div>
                                        <p className="text-slate-500 text-[11px] mt-0.5">{item.brand} {item.model}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}