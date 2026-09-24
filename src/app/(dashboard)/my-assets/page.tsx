'use client';

import React, { useState, useEffect } from 'react';
import MaintenanceModal from '@/components/modals/MaintenanceModal';

interface MyAssetItem {
    id: number;
    asset_tag: string;
    serial_number: string;
    brand: string;
    model: string;
    specs: { cpu?: string; ram?: string; storage?: string } | null;
    status: string;
    warranty_expiry: string | null;
    category_name: string;
    assignment_id: number;
    assigned_date: string;
    condition_notes: string | null;
}

interface UserProfile {
    id: number;
    name: string;
    employee_id: string;
    department: string | null;
    email: string;
    role: string;
}

export default function MyAssetsPage() {
    const [assets, setAssets] = useState<MyAssetItem[]>([]);
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedAsset, setSelectedAsset] = useState<MyAssetItem | null>(null);
    const [isMaintenanceOpen, setIsMaintenanceOpen] = useState(false);

    const loadMyAssets = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/user/my-assets');
            const data = await res.json();
            if (data.success) {
                setAssets(data.data || []);
                setUser(data.user || null);
            }
        } catch (err) {
            console.error('Failed to load my assets:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMyAssets();
    }, []);

    const handleReportIssue = (asset: MyAssetItem) => {
        setSelectedAsset(asset);
        setIsMaintenanceOpen(true);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header Profil Karyawan */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white font-bold text-xl flex items-center justify-center shadow-md">
                        {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold text-slate-900">{user?.name || 'Karyawan'}</h1>
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                {user?.employee_id || 'ID Pegawai'}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                            {user?.department || 'Departemen'} • {user?.email || 'email@company.com'}
                        </p>
                    </div>
                </div>

                <div className="bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 text-right">
                    <span className="text-[11px] text-slate-400 block font-medium">Unit Dipegang</span>
                    <span className="text-lg font-bold text-slate-900 font-mono">
                        {assets.length} Perangkat
                    </span>
                </div>
            </div>

            {/* List Aset yang Dipegang */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-sm font-bold text-slate-800">
                        Daftar Perangkat Operasional yang Anda Pegang
                    </h2>
                    <span className="text-xs text-slate-400">Status: Aktif</span>
                </div>

                {loading ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
                        Memuat data perangkat Anda...
                    </div>
                ) : assets.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-2">
                        <div className="text-3xl">💻</div>
                        <h3 className="font-semibold text-slate-800 text-sm">Belum Ada Unit yang Diserahkan</h3>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto">
                            Saat ini belum ada perangkat operasional IT yang tercatat aktif diserahkan kepada Anda.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {assets.map((item) => (
                            <div
                                key={item.assignment_id || item.id}
                                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 hover:border-blue-300 transition-colors"
                            >
                                <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                                    <div>
                                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                            {item.category_name}
                                        </span>
                                        <h3 className="font-bold text-slate-900 text-base mt-1">
                                            {item.brand} {item.model}
                                        </h3>
                                        <p className="text-xs font-mono text-slate-500 font-semibold">
                                            Tag: {item.asset_tag}
                                        </p>
                                    </div>
                                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        Aktif Digunakan
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl">
                                    <div>
                                        <span className="text-slate-400 block text-[11px]">Serial Number</span>
                                        <span className="font-mono font-medium text-slate-700">{item.serial_number}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block text-[11px]">Tanggal Serah Terima</span>
                                        <span className="font-medium text-slate-700">
                                            {new Date(item.assigned_date).toLocaleDateString('id-ID')}
                                        </span>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-slate-400 block text-[11px]">Spesifikasi Teknis</span>
                                        <span className="font-medium text-slate-700">
                                            {item.specs?.cpu || '-'} • RAM: {item.specs?.ram || '-'} • Storage: {item.specs?.storage || '-'}
                                        </span>
                                    </div>
                                    {item.condition_notes && (
                                        <div className="col-span-2 pt-1 border-t border-slate-200/60">
                                            <span className="text-slate-400 block text-[10px]">Catatan Kondisi Fisik</span>
                                            <span className="text-slate-600 text-[11px] italic">{item.condition_notes}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Tombol Aksi BAST & Lapor Kendala */}
                                <div className="flex gap-2 pt-1">
                                    <a
                                        href={`/api/assets/bast/${item.assignment_id}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex-1 py-2 px-3 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold text-center flex items-center justify-center gap-1.5 transition-colors"
                                    >
                                        <span>📄</span> Dokumen BAST
                                    </a>
                                    <button
                                        onClick={() => handleReportIssue(item)}
                                        className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold text-center flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                                    >
                                        <span>⚠️</span> Laporkan Kendala
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal Lapor Kendala Servis */}
            {selectedAsset && (
                <MaintenanceModal
                    asset={selectedAsset}
                    isOpen={isMaintenanceOpen}
                    onClose={() => {
                        setIsMaintenanceOpen(false);
                        setSelectedAsset(null);
                    }}
                    onSuccess={() => {
                        setIsMaintenanceOpen(false);
                        setSelectedAsset(null);
                        loadMyAssets();
                    }}
                />
            )}
        </div>
    );
}
