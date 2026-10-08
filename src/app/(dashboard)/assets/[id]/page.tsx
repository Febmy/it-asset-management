'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import CheckoutModal from '@/components/modals/CheckoutModal';
import CheckinModal from '@/components/modals/CheckinModal';
import MaintenanceModal from '@/components/modals/MaintenanceModal';
import CompleteMaintenanceModal from '@/components/modals/CompleteMaintenanceModal';
import DisposalModal from '@/components/modals/DisposalModal';
import UploadProofModal from '@/components/modals/UploadProofModal';

interface AssetDetailData {
    asset: {
        id: number;
        asset_tag: string;
        serial_number: string;
        brand: string;
        model: string;
        category_name: string;
        status: string;
        specs: { cpu?: string; ram?: string; storage?: string } | null;
        purchase_date: string | null;
        warranty_expiry: string | null;
        current_user_name: string | null;
        current_user_emp_id: string | null;
        current_user_dept: string | null;
        image_url?: string | null;
        proof_doc_url?: string | null;
        proof_notes?: string | null;
    };
    assignments: Array<{
        id: number;
        assigned_date: string;
        returned_date: string | null;
        condition_notes: string | null;
        bast_file_url?: string | null;
        return_proof_url?: string | null;
        status: string;
        user_name: string;
        employee_id: string;
        department: string | null;
    }>;
    maintenance: Array<{
        id: number;
        issue_description: string;
        vendor_name: string | null;
        cost: number;
        start_date: string;
        completion_date: string | null;
        action_taken: string | null;
        invoice_proof_url?: string | null;
        status: string;
    }>;
    disposal?: {
        id: number;
        disposal_type: string;
        disposal_date: string;
        residual_value: number;
        data_wiped: boolean;
        wipe_method: string | null;
        reason: string;
        approved_by_name: string | null;
    } | null;
}

export default function AssetDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [data, setData] = useState<AssetDetailData | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');

    // Modal state controls
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [isCheckinOpen, setIsCheckinOpen] = useState(false);
    const [isMaintenanceOpen, setIsMaintenanceOpen] = useState(false);
    const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
    const [isDisposalOpen, setIsDisposalOpen] = useState(false);
    const [isProofModalOpen, setIsProofModalOpen] = useState(false);
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);
    const [selectedMaintenanceId, setSelectedMaintenanceId] = useState<number | null>(null);

    async function loadDetail() {
        try {
            const res = await fetch(`/api/assets/${params.id}`);
            const result = await res.json();
            if (result.success) {
                setData(result.data);
            } else {
                setErrorMsg(result.message || 'Gagal mengambil data aset');
            }
        } catch {
            setErrorMsg('Terjadi kendala jaringan');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (params.id) {
            loadDetail();
        }
    }, [params.id]);

    if (loading) {
        return <div className="p-8 text-center text-slate-400 text-xs">Memuat detail aset...</div>;
    }

    if (errorMsg || !data) {
        return (
            <div className="p-8 max-w-lg mx-auto text-center space-y-3">
                <p className="text-rose-600 text-sm font-semibold">{errorMsg || 'Aset tidak ditemukan'}</p>
                <button
                    onClick={() => router.back()}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
                >
                    Kembali
                </button>
            </div>
        );
    }

    const { asset, assignments, maintenance, disposal } = data;

    const activeMaintenance = maintenance.find((m) => m.status === 'in_progress');

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => router.back()}
                            className="text-xs text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
                        >
                            &larr; Kembali
                        </button>
                        <span className="text-slate-300">/</span>
                        <span className="text-xs font-mono font-bold text-blue-600">{asset.asset_tag}</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mt-1">
                        {asset.brand} {asset.model}
                    </h1>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <Badge status={asset.status} />

                    <Link
                        href="/assets/print-labels"
                        className="px-3 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                    >
                        <span>🖨️</span> Cetak Label
                    </Link>

                    <button
                        onClick={() => setIsProofModalOpen(true)}
                        className="px-3 py-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                        <span>📸</span> Bukti & Dokumen
                    </button>

                    {/* Operational Action Buttons */}
                    {asset.status === 'in_stock' && (
                        <button
                            onClick={() => setIsCheckoutOpen(true)}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                            <span>📤</span> Serahkan Unit (Check-out)
                        </button>
                    )}

                    {asset.status === 'deployed' && (
                        <button
                            onClick={() => setIsCheckinOpen(true)}
                            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                            <span>📥</span> Tarik Unit (Check-in)
                        </button>
                    )}

                    {asset.status === 'repair' && (
                        <button
                            onClick={() => {
                                setSelectedMaintenanceId(activeMaintenance ? activeMaintenance.id : null);
                                setIsCompleteModalOpen(true);
                            }}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                            <span>✅</span> Selesai Perbaikan
                        </button>
                    )}

                    {asset.status !== 'repair' && asset.status !== 'disposed' && (
                        <button
                            onClick={() => setIsMaintenanceOpen(true)}
                            className="px-3 py-1.5 border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                            <span>🔧</span> Lapor Servis
                        </button>
                    )}

                    {asset.status !== 'disposed' && (
                        <button
                            onClick={() => setIsDisposalOpen(true)}
                            className="px-3 py-1.5 border border-rose-300 hover:bg-rose-50 text-rose-700 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                            <span>🗑️</span> Disposal
                        </button>
                    )}
                </div>
            </div>

            {/* Disposal Warning Banner if asset is disposed */}
            {asset.status === 'disposed' && disposal && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">🛑</span>
                        <h3 className="text-sm font-bold text-rose-800">
                            Unit Telah Di-disposal / Dihapus dari Operasional
                        </h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-rose-900 pt-1">
                        <div>
                            <span className="text-rose-500 block text-[11px]">Metode</span>
                            <span className="font-semibold capitalize">{disposal.disposal_type}</span>
                        </div>
                        <div>
                            <span className="text-rose-500 block text-[11px]">Tanggal Pemusnahan</span>
                            <span className="font-semibold">
                                {new Date(disposal.disposal_date).toLocaleDateString('id-ID')}
                            </span>
                        </div>
                        <div>
                            <span className="text-rose-500 block text-[11px]">Nilai Residu / Jual</span>
                            <span className="font-mono font-semibold">
                                Rp {Number(disposal.residual_value).toLocaleString('id-ID')}
                            </span>
                        </div>
                        <div>
                            <span className="text-rose-500 block text-[11px]">Penghapusan Data</span>
                            <span className="font-semibold">
                                {disposal.data_wiped ? `Ya (${disposal.wipe_method || 'Clear'})` : 'Tidak'}
                            </span>
                        </div>
                        <div className="col-span-2 sm:col-span-4 border-t border-rose-200 pt-2">
                            <span className="text-rose-500 block text-[11px]">Alasan Pemusnahan:</span>
                            <p className="text-xs font-medium">{disposal.reason}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Grid Informasi Hardware, Bukti Fisik, & Pemegang */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Kolom 1 & 2: Spesifikasi Perangkat & Bukti Fisik */}
                <div className="md:col-span-2 space-y-6">
                    {/* Card Bukti & Foto Fisik Aset */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                        <div className="flex justify-between items-center border-b pb-2">
                            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                                <span>📷</span> Bukti Fisik & Dokumen Pembelian
                            </h2>
                            <button
                                onClick={() => setIsProofModalOpen(true)}
                                className="text-blue-600 hover:text-blue-800 font-semibold text-xs flex items-center gap-1 cursor-pointer"
                            >
                                <span>✏️</span> {asset.image_url || asset.proof_doc_url ? 'Perbarui Bukti' : 'Unggah Bukti'}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Foto Fisik */}
                            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 flex flex-col justify-between">
                                <span className="text-slate-500 font-medium text-[11px] block mb-2">Foto Fisik Unit</span>
                                {asset.image_url ? (
                                    <div className="relative group rounded-lg overflow-hidden border border-slate-300 bg-white">
                                        <img
                                            src={asset.image_url}
                                            alt="Foto Fisik Aset"
                                            className="w-full h-36 object-cover object-center cursor-pointer hover:scale-105 transition-transform"
                                            onClick={() => setZoomedImage(asset.image_url || null)}
                                        />
                                        <div
                                            onClick={() => setZoomedImage(asset.image_url || null)}
                                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold cursor-pointer"
                                        >
                                            🔍 Klik untuk perbesar
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => setIsProofModalOpen(true)}
                                        className="h-36 border border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-center p-3 cursor-pointer hover:bg-slate-100 transition-colors"
                                    >
                                        <span className="text-2xl mb-1">📷</span>
                                        <p className="text-xs font-medium text-slate-600">Belum ada foto unit</p>
                                        <span className="text-[10px] text-blue-600 mt-1 font-semibold">+ Unggah Foto</span>
                                    </div>
                                )}
                            </div>

                            {/* Dokumen / Faktur Pembelian */}
                            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 flex flex-col justify-between">
                                <span className="text-slate-500 font-medium text-[11px] block mb-2">Dokumen / Faktur Pembelian</span>
                                {asset.proof_doc_url ? (
                                    <div className="h-36 border border-emerald-200 bg-emerald-50/60 rounded-lg p-3 flex flex-col justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">📄</span>
                                            <div className="overflow-hidden">
                                                <p className="font-bold text-emerald-950 text-xs truncate">Dokumen Pembelian</p>
                                                <p className="text-[10px] text-emerald-700">Terverifikasi & Tersimpan</p>
                                            </div>
                                        </div>
                                        <a
                                            href={asset.proof_doc_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-center text-xs font-semibold shadow-xs transition-colors"
                                        >
                                            Lihat / Unduh Dokumen ↗
                                        </a>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => setIsProofModalOpen(true)}
                                        className="h-36 border border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-center p-3 cursor-pointer hover:bg-slate-100 transition-colors"
                                    >
                                        <span className="text-2xl mb-1">📑</span>
                                        <p className="text-xs font-medium text-slate-600">Belum ada faktur terlampir</p>
                                        <span className="text-[10px] text-blue-600 mt-1 font-semibold">+ Unggah Faktur / PDF</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {asset.proof_notes && (
                            <div className="pt-2 border-t border-slate-100 text-xs">
                                <span className="text-slate-400 block text-[11px]">Catatan Pengadaan / Bukti:</span>
                                <p className="text-slate-700 font-medium mt-0.5">{asset.proof_notes}</p>
                            </div>
                        )}
                    </div>

                    {/* Informasi Spesifikasi */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                        <h2 className="text-sm font-bold text-slate-800 border-b pb-2">Informasi Spesifikasi</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                        <div>
                            <span className="text-slate-400 block text-[11px]">Kategori</span>
                            <p className="font-semibold text-slate-700 mt-0.5">{asset.category_name}</p>
                        </div>
                        <div>
                            <span className="text-slate-400 block text-[11px]">Serial Number</span>
                            <p className="font-mono font-semibold text-slate-700 mt-0.5">{asset.serial_number}</p>
                        </div>
                        <div>
                            <span className="text-slate-400 block text-[11px]">Processor (CPU)</span>
                            <p className="font-medium text-slate-700 mt-0.5">{asset.specs?.cpu || '-'}</p>
                        </div>
                        <div>
                            <span className="text-slate-400 block text-[11px]">RAM</span>
                            <p className="font-medium text-slate-700 mt-0.5">{asset.specs?.ram || '-'}</p>
                        </div>
                        <div>
                            <span className="text-slate-400 block text-[11px]">Penyimpanan</span>
                            <p className="font-medium text-slate-700 mt-0.5">{asset.specs?.storage || '-'}</p>
                        </div>
                        <div>
                            <span className="text-slate-400 block text-[11px]">Tanggal Beli</span>
                            <p className="font-medium text-slate-700 mt-0.5">
                                {asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString('id-ID') : '-'}
                            </p>
                        </div>
                        <div>
                            <span className="text-slate-400 block text-[11px]">Masa Garansi</span>
                            <p className="font-medium text-slate-700 mt-0.5">
                                {asset.warranty_expiry ? new Date(asset.warranty_expiry).toLocaleDateString('id-ID') : '-'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

                {/* Kolom 3: Status Pemegang Saat Ini */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                    <h2 className="text-sm font-bold text-slate-800 border-b pb-2">Pemegang Saat Ini</h2>
                    {asset.current_user_name ? (
                        <div className="space-y-1 text-xs">
                            <p className="text-base font-bold text-slate-900">{asset.current_user_name}</p>
                            <p className="font-mono text-slate-500">{asset.current_user_emp_id}</p>
                            <p className="text-slate-600">{asset.current_user_dept || 'Departemen tidak diatur'}</p>
                            {asset.status === 'deployed' && (
                                <div className="pt-2">
                                    <button
                                        onClick={() => setIsCheckinOpen(true)}
                                        className="w-full py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl font-semibold text-xs border border-rose-200 transition-colors cursor-pointer"
                                    >
                                        Tarik Unit dari User
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="py-6 text-center space-y-2">
                            <span className="text-slate-400 text-xs italic block">
                                {asset.status === 'disposed'
                                    ? 'Unit telah dimusnahkan / nonaktif'
                                    : 'Unit berada di gudang IT (In Stock)'}
                            </span>
                            {asset.status === 'in_stock' && (
                                <button
                                    onClick={() => setIsCheckoutOpen(true)}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                                >
                                    Serahkan ke Karyawan
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Tabel Riwayat Serah Terima (Assignments) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                    <h2 className="text-sm font-bold text-slate-800">Riwayat Penggunaan (Assignments)</h2>
                    <span className="text-xs text-slate-400">{assignments.length} Riwayat</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                            <tr>
                                <th className="py-2.5 px-3">Karyawan</th>
                                <th className="py-2.5 px-3">Tgl Diserahkan</th>
                                <th className="py-2.5 px-3">Tgl Dikembalikan</th>
                                <th className="py-2.5 px-3">Catatan Kondisi</th>
                                <th className="py-2.5 px-3">Status</th>
                                <th className="py-2.5 px-3 text-center">BAST</th>
                                <th className="py-2.5 px-3 text-center">Bukti Kembali</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {assignments.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-4 text-center text-slate-400 italic">
                                        Belum ada riwayat penyerahan.
                                    </td>
                                </tr>
                            ) : (
                                assignments.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50">
                                        <td className="py-2.5 px-3">
                                            <p className="font-semibold text-slate-900">{item.user_name}</p>
                                            <p className="text-[11px] text-slate-400">
                                                {item.employee_id} - {item.department}
                                            </p>
                                        </td>
                                        <td className="py-2.5 px-3">
                                            {new Date(item.assigned_date).toLocaleDateString('id-ID')}
                                        </td>
                                        <td className="py-2.5 px-3">
                                            {item.returned_date
                                                ? new Date(item.returned_date).toLocaleDateString('id-ID')
                                                : '-'}
                                        </td>
                                        <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">
                                            {item.condition_notes || '-'}
                                        </td>
                                        <td className="py-2.5 px-3">
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                    item.status === 'active'
                                                        ? 'bg-blue-50 text-blue-700'
                                                        : 'bg-slate-100 text-slate-600'
                                                }`}
                                            >
                                                {item.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-3 text-center">
                                            <a
                                                href={`/api/assets/bast/${item.id}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-blue-600 hover:text-blue-800 font-semibold underline text-[11px]"
                                            >
                                                Cetak BAST
                                            </a>
                                        </td>
                                        <td className="py-2.5 px-3 text-center">
                                            {item.return_proof_url ? (
                                                <a
                                                    href={item.return_proof_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="px-2 py-0.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md font-semibold text-[10px]"
                                                >
                                                    Lihat Bukti ↗
                                                </a>
                                            ) : (
                                                <span className="text-slate-400">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Tabel Riwayat Pemeliharaan / Servis */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                    <h2 className="text-sm font-bold text-slate-800">Log Servis & Maintenance</h2>
                    <span className="text-xs text-slate-400">{maintenance.length} Riwayat</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                            <tr>
                                <th className="py-2.5 px-3">Tgl Mulai</th>
                                <th className="py-2.5 px-3">Kendala / Masalah</th>
                                <th className="py-2.5 px-3">Vendor</th>
                                <th className="py-2.5 px-3">Tindakan</th>
                                <th className="py-2.5 px-3">Biaya</th>
                                <th className="py-2.5 px-3 text-center">Nota / Bukti</th>
                                <th className="py-2.5 px-3 text-center">Status / Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {maintenance.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-4 text-center text-slate-400 italic">
                                        Unit belum pernah mengalami kendala servis.
                                    </td>
                                </tr>
                            ) : (
                                maintenance.map((m) => (
                                    <tr key={m.id} className="hover:bg-slate-50">
                                        <td className="py-2.5 px-3">
                                            {new Date(m.start_date).toLocaleDateString('id-ID')}
                                        </td>
                                        <td className="py-2.5 px-3 font-medium text-slate-900">
                                            {m.issue_description}
                                        </td>
                                        <td className="py-2.5 px-3">{m.vendor_name || '-'}</td>
                                        <td className="py-2.5 px-3">{m.action_taken || '-'}</td>
                                        <td className="py-2.5 px-3 font-mono">
                                            {Number(m.cost) > 0
                                                ? `Rp ${Number(m.cost).toLocaleString('id-ID')}`
                                                : 'Rp 0'}
                                        </td>
                                        <td className="py-2.5 px-3 text-center">
                                            {m.invoice_proof_url ? (
                                                <a
                                                    href={m.invoice_proof_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="px-2 py-0.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md font-semibold text-[10px]"
                                                >
                                                    Lihat Nota ↗
                                                </a>
                                            ) : (
                                                <span className="text-slate-400">-</span>
                                            )}
                                        </td>
                                        <td className="py-2.5 px-3 text-center">
                                            {m.status === 'in_progress' ? (
                                                <button
                                                    onClick={() => {
                                                        setSelectedMaintenanceId(m.id);
                                                        setIsCompleteModalOpen(true);
                                                    }}
                                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold shadow-xs cursor-pointer transition-colors"
                                                >
                                                    ✓ Selesaikan Servis
                                                </button>
                                            ) : (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                                                    SELESAI
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Dialogs Connected */}
            <CheckoutModal
                asset={asset}
                isOpen={isCheckoutOpen}
                onClose={() => setIsCheckoutOpen(false)}
                onSuccess={() => {
                    setIsCheckoutOpen(false);
                    loadDetail();
                }}
            />

            <CheckinModal
                asset={asset}
                isOpen={isCheckinOpen}
                onClose={() => setIsCheckinOpen(false)}
                onSuccess={() => {
                    setIsCheckinOpen(false);
                    loadDetail();
                }}
            />

            <MaintenanceModal
                asset={asset}
                isOpen={isMaintenanceOpen}
                onClose={() => setIsMaintenanceOpen(false)}
                onSuccess={() => {
                    setIsMaintenanceOpen(false);
                    loadDetail();
                }}
            />

            <CompleteMaintenanceModal
                isOpen={isCompleteModalOpen}
                maintenanceId={selectedMaintenanceId}
                assetId={asset.id}
                onClose={() => setIsCompleteModalOpen(false)}
                onSuccess={() => {
                    setIsCompleteModalOpen(false);
                    loadDetail();
                }}
            />

            <DisposalModal
                asset={asset}
                isOpen={isDisposalOpen}
                onClose={() => setIsDisposalOpen(false)}
                onSuccess={() => {
                    setIsDisposalOpen(false);
                    loadDetail();
                }}
            />

            <UploadProofModal
                asset={asset}
                isOpen={isProofModalOpen}
                onClose={() => setIsProofModalOpen(false)}
                onSuccess={() => {
                    setIsProofModalOpen(false);
                    loadDetail();
                }}
            />

            {/* Modal Zoom Gambar */}
            {zoomedImage && (
                <div
                    onClick={() => setZoomedImage(null)}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm cursor-zoom-out"
                >
                    <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden p-2 shadow-2xl">
                        <img src={zoomedImage} alt="Perbesar Foto Aset" className="max-w-full max-h-[85vh] object-contain rounded-xl" />
                        <button
                            onClick={() => setZoomedImage(null)}
                            className="absolute top-4 right-4 bg-black/70 hover:bg-black text-white px-3 py-1 rounded-full text-xs font-bold"
                        >
                            Tutup &times;
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}