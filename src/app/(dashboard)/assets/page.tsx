'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import CreateAssetModal from '@/components/modals/CreateAssetModal';
import ImportAssetModal from '@/components/modals/ImportAssetModal';

interface AssetItem {
    id: number;
    asset_tag: string;
    serial_number: string;
    brand: string;
    model: string;
    specs: { cpu?: string; ram?: string; storage?: string } | null;
    status: string;
    warranty_expiry: string | null;
    image_url?: string | null;
    proof_doc_url?: string | null;
    category_name: string;
    assigned_to: string | null;
    user_department: string | null;
}

export default function AssetsPage() {
    const [assets, setAssets] = useState<AssetItem[]>([]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [categories, setCategories] = useState<{ id: number, name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);

    // Initial load from URL search params
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const status = params.get('status');
            const q = params.get('q');
            const category = params.get('category');
            if (status) setStatusFilter(status);
            if (q) setSearch(q);
            if (category) setCategoryFilter(category);
        }

        // Fetch categories for filter
        async function fetchCategories() {
            try {
                const res = await fetch('/api/categories');
                const data = await res.json();
                if (data.success) {
                    setCategories(data.data);
                }
            } catch (err) {
                console.error('Failed to fetch categories', err);
            }
        }
        fetchCategories();
    }, []);

    const loadAssets = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('q', search);
            if (statusFilter) params.append('status', statusFilter);
            if (categoryFilter) params.append('category', categoryFilter);

            const res = await fetch(`/api/assets?${params.toString()}`);
            const data = await res.json();
            if (data.success) {
                setAssets(data.data);
            }
        } catch (err) {
            console.error('Failed to load assets', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(() => {
            loadAssets();
        }, 300);
        return () => clearTimeout(timeout);
    }, [search, statusFilter, categoryFilter]);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header & Aksi Cepat */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Master Inventaris Aset</h1>
                    <p className="text-sm text-slate-500">Kelola dan pantau seluruh perangkat hardware perusahaan</p>
                </div>
                <div className="flex items-center gap-2.5">
                    <Link
                        href="/assets/print-labels"
                        className="px-3.5 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors"
                    >
                        <span>🖨️</span> Cetak Label QR
                    </Link>
                    <button
                        onClick={() => setIsImportOpen(true)}
                        className="px-3.5 py-2 border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                        <span>📊</span> Import Excel
                    </button>
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                        <span>+</span> Registrasi Unit Baru
                    </button>
                </div>
            </div>

            {/* Category Filter Pills / Cards */}
            <div className="flex flex-wrap gap-2.5">
                <button
                    onClick={() => setCategoryFilter('')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                        !categoryFilter
                            ? 'bg-blue-600 text-white shadow-blue-200'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                >
                    Semua Jenis Aset
                </button>
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setCategoryFilter(cat.id.toString())}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                            categoryFilter === cat.id.toString()
                                ? 'bg-blue-600 text-white shadow-blue-200'
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>

            {/* Bar Filter & Pencarian */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder="Cari Tag ID, Serial Number, Model, atau Nama Karyawan..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
                    >
                        <option value="">Semua Status</option>
                        <option value="in_stock">In Stock</option>
                        <option value="deployed">Deployed</option>
                        <option value="repair">In Repair</option>
                        <option value="disposed">Disposed</option>
                    </select>
                </div>
            </div>

            {/* Tabel Data Aset */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                            <tr>
                                <th className="py-3.5 px-4">Tag ID</th>
                                <th className="py-3.5 px-4">Perangkat & Model</th>
                                <th className="py-3.5 px-4">Serial Number</th>
                                <th className="py-3.5 px-4">Status</th>
                                <th className="py-3.5 px-4">Pemegang (User)</th>
                                <th className="py-3.5 px-4">Garansi</th>
                                <th className="py-3.5 px-4 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-slate-400">
                                        Memuat data inventaris...
                                    </td>
                                </tr>
                            ) : assets.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-slate-400">
                                        Tidak ada unit aset yang cocok dengan filter.
                                    </td>
                                </tr>
                            ) : (
                                assets.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/75 transition-colors">
                                        <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                                            {item.asset_tag}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="flex items-center gap-2.5">
                                                {item.image_url ? (
                                                    <img
                                                        src={item.image_url}
                                                        alt={`${item.brand} ${item.model}`}
                                                        className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs shrink-0">
                                                        💻
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                                                        <span>{item.brand} {item.model}</span>
                                                        {item.proof_doc_url && (
                                                            <span title="Faktur / Dokumen Terlampir" className="text-emerald-600 text-[11px]">
                                                                📄
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-[11px] text-slate-400">{item.category_name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 font-mono text-slate-600">
                                            {item.serial_number}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <Badge status={item.status} />
                                        </td>
                                        <td className="py-3.5 px-4">
                                            {item.assigned_to ? (
                                                <div>
                                                    <p className="font-medium text-slate-800">{item.assigned_to}</p>
                                                    <p className="text-[10px] text-slate-400">{item.user_department || 'No Dept'}</p>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 italic">Di Gudang IT</span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            {item.warranty_expiry ? (
                                                new Date(item.warranty_expiry).toLocaleDateString('id-ID')
                                            ) : (
                                                <span className="text-slate-400">-</span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                            <Link
                                                href={`/assets/${item.id}`}
                                                className="text-blue-600 hover:text-blue-800 font-semibold text-xs px-2.5 py-1 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                                            >
                                                Detail
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <CreateAssetModal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onSuccess={loadAssets}
            />
            <ImportAssetModal
                isOpen={isImportOpen}
                onClose={() => setIsImportOpen(false)}
                onSuccess={loadAssets}
            />
        </div>
    );
}