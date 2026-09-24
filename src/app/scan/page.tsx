'use client';

import { useState } from 'react';
import Link from 'next/link';
import AssetScanner from '@/components/scanner/AssetScanner';
import CheckinModal from '@/components/modals/CheckinModal';
import CheckoutModal from '@/components/modals/CheckoutModal';
import MaintenanceModal from '@/components/modals/MaintenanceModal';
import DisposalModal from '@/components/modals/DisposalModal';

interface AssetDetail {
    id: number;
    asset_tag: string;
    category: string;
    brand: string;
    model: string;
    serial_number: string;
    specs: {
        cpu?: string;
        ram?: string;
        storage?: string;
    } | null;
    status: 'in_stock' | 'deployed' | 'repair' | 'disposed';
    warranty_expiry: string;
    current_user_name: string | null;
    current_user_email: string | null;
    current_user_dept: string | null;
    assigned_date: string | null;
    handover_condition: string | null;
}

export default function ScanPage() {
    const [assetTag, setAssetTag] = useState('');
    const [asset, setAsset] = useState<AssetDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [isCheckinOpen, setIsCheckinOpen] = useState(false);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [isMaintenanceOpen, setIsMaintenanceOpen] = useState(false);
    const [isDisposalOpen, setIsDisposalOpen] = useState(false);

    const fetchAsset = async (tag: string) => {
        if (!tag.trim()) return;
        setLoading(true);
        setErrorMessage('');

        try {
            const res = await fetch(`/api/assets/scan?tag=${encodeURIComponent(tag.trim())}`);
            const result = await res.json();

            if (result.success) {
                setAsset(result.data);
            } else {
                setAsset(null);
                setErrorMessage(result.message || 'Aset tidak ditemukan');
            }
        } catch {
            setErrorMessage('Terjadi kendala koneksi ke server');
        } finally {
            setLoading(false);
        }
    };

    const handleScanSuccess = (scannedTag: string) => {
        setAssetTag(scannedTag);
        fetchAsset(scannedTag);
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 max-w-lg mx-auto space-y-4">
            {/* Header with back navigation */}
            <div className="flex items-center justify-between py-2 border-b border-slate-200">
                <Link
                    href="/dashboard"
                    className="text-xs text-slate-500 hover:text-slate-900 font-semibold flex items-center gap-1"
                >
                    &larr; Dashboard
                </Link>
                <span className="text-[11px] font-mono text-slate-400">Scanner Fisik</span>
            </div>

            <header className="text-center">
                <h1 className="text-xl font-bold text-slate-900">Scan Fisik Aset IT</h1>
                <p className="text-xs text-slate-500">Pindai kode QR atau masukkan nomor tag unit</p>
            </header>

            {/* Komponen Kamera */}
            <AssetScanner onScanSuccess={handleScanSuccess} />

            {/* Input Manual / Fallback */}
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    fetchAsset(assetTag);
                }}
                className="flex gap-2"
            >
                <input
                    type="text"
                    value={assetTag}
                    onChange={(e) => setAssetTag(e.target.value)}
                    placeholder="Contoh: IT-NB-2026-0001"
                    className="flex-1 px-3 py-2 text-sm border rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl disabled:opacity-50 cursor-pointer"
                >
                    {loading ? 'Mencari...' : 'Cari'}
                </button>
            </form>

            {/* Pesan Error */}
            {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                    {errorMessage}
                </div>
            )}

            {/* Kartu Detail Aset */}
            {asset && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                    <div className="flex justify-between items-start border-b pb-3">
                        <div>
                            <span className="text-[10px] font-bold tracking-wider uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                {asset.category}
                            </span>
                            <h2 className="text-base font-bold text-slate-900 mt-1">
                                {asset.brand} {asset.model}
                            </h2>
                            <p className="text-xs font-mono text-slate-500">Tag: {asset.asset_tag}</p>
                        </div>
                        <span
                            className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${asset.status === 'deployed'
                                ? 'bg-blue-100 text-blue-800'
                                : asset.status === 'in_stock'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : asset.status === 'repair'
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-rose-100 text-rose-800'
                                }`}
                        >
                            {asset.status.replace('_', ' ')}
                        </span>
                    </div>

                    {/* Rincian Hardware */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl">
                        <div>
                            <span className="text-slate-400 block">Serial Number</span>
                            <span className="font-mono font-medium text-slate-700">{asset.serial_number}</span>
                        </div>
                        <div>
                            <span className="text-slate-400 block">Garansi s/d</span>
                            <span className="font-medium text-slate-700">
                                {asset.warranty_expiry
                                    ? new Date(asset.warranty_expiry).toLocaleDateString('id-ID')
                                    : '-'}
                            </span>
                        </div>
                        <div className="col-span-2">
                            <span className="text-slate-400 block">Spesifikasi</span>
                            <span className="font-medium text-slate-700">
                                {asset.specs?.cpu || '-'} | RAM: {asset.specs?.ram || '-'} | Storage:{' '}
                                {asset.specs?.storage || '-'}
                            </span>
                        </div>
                    </div>

                    {/* Pemegang Saat Ini */}
                    {asset.status === 'deployed' && asset.current_user_name ? (
                        <div className="bg-blue-50/50 border border-blue-100 p-3 rounded-xl text-xs space-y-1">
                            <span className="text-blue-600 font-semibold block">Pemegang Perangkat</span>
                            <p className="font-bold text-slate-800 text-sm">{asset.current_user_name}</p>
                            <p className="text-slate-600">
                                {asset.current_user_dept} • {asset.current_user_email}
                            </p>
                            <p className="text-[11px] text-slate-500 pt-1">
                                Catatan Serah Terima: {asset.handover_condition || '-'}
                            </p>
                        </div>
                    ) : (
                        <div className="text-center p-3 bg-slate-50 rounded-xl text-xs text-slate-500">
                            Unit berada di gudang penyimpanan (Ready to deploy).
                        </div>
                    )}

                    {/* Tombol Tindakan Operasional */}
                    <div className="grid grid-cols-2 gap-2 pt-2">
                        {asset.status === 'deployed' ? (
                            <button
                                onClick={() => setIsCheckinOpen(true)}
                                className="py-2.5 px-3 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 shadow-sm cursor-pointer"
                            >
                                Tarik Unit (Check-in)
                            </button>
                        ) : asset.status === 'in_stock' ? (
                            <button
                                onClick={() => setIsCheckoutOpen(true)}
                                className="py-2.5 px-3 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 shadow-sm cursor-pointer"
                            >
                                Serahkan Unit (Check-out)
                            </button>
                        ) : null}

                        {asset.status !== 'repair' && asset.status !== 'disposed' && (
                            <button
                                onClick={() => setIsMaintenanceOpen(true)}
                                className="py-2.5 px-3 border border-amber-300 bg-amber-50 text-amber-800 rounded-xl text-xs font-semibold hover:bg-amber-100 cursor-pointer"
                            >
                                Laporkan Servis
                            </button>
                        )}

                        {asset.status !== 'disposed' && (
                            <button
                                onClick={() => setIsDisposalOpen(true)}
                                className="py-2.5 px-3 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold hover:bg-rose-50 cursor-pointer"
                            >
                                Disposal
                            </button>
                        )}
                    </div>

                    {/* Link ke Halaman Detail Lengkap */}
                    <div className="text-center pt-2 border-t">
                        <Link
                            href={`/assets/${asset.id}`}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                        >
                            Buka Halaman Detail Lengkap & Riwayat &rarr;
                        </Link>
                    </div>
                </div>
            )}

            {/* Modals */}
            {asset && (
                <>
                    <CheckinModal
                        asset={asset}
                        isOpen={isCheckinOpen}
                        onClose={() => setIsCheckinOpen(false)}
                        onSuccess={() => fetchAsset(asset.asset_tag)}
                    />
                    <CheckoutModal
                        asset={asset}
                        isOpen={isCheckoutOpen}
                        onClose={() => setIsCheckoutOpen(false)}
                        onSuccess={() => fetchAsset(asset.asset_tag)}
                    />
                    <MaintenanceModal
                        asset={asset}
                        isOpen={isMaintenanceOpen}
                        onClose={() => setIsMaintenanceOpen(false)}
                        onSuccess={() => fetchAsset(asset.asset_tag)}
                    />
                    <DisposalModal
                        asset={asset}
                        isOpen={isDisposalOpen}
                        onClose={() => setIsDisposalOpen(false)}
                        onSuccess={() => fetchAsset(asset.asset_tag)}
                    />
                </>
            )}
        </div>
    );
}