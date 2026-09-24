'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Button from '@/components/ui/Button';

export default function ReportsPage() {
    const [reportType, setReportType] = useState('assignments');
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setMonth(d.getMonth() - 6);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState<any[]>([]);
    const [summary, setSummary] = useState<Record<string, any>>({});

    const fetchReport = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                type: reportType,
                startDate,
                endDate,
            });
            const res = await fetch(`/api/reports?${params.toString()}`);
            const json = await res.json();
            if (json.success) {
                setReportData(json.data || []);
                setSummary(json.summary || {});
            }
        } catch (error) {
            console.error('Failed to load report:', error);
        } finally {
            setLoading(false);
        }
    }, [reportType, startDate, endDate]);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    const handleDownloadCSV = () => {
        const params = new URLSearchParams({
            type: reportType,
            startDate,
            endDate,
            format: 'csv',
        });
        window.open(`/api/reports?${params.toString()}`, '_blank');
    };

    const handlePrint = () => {
        window.print();
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const getReportTitle = () => {
        switch (reportType) {
            case 'assignments':
                return 'Rekapitulasi Serah Terima & Mutasi Aset (BAST)';
            case 'maintenance':
                return 'Rekapitulasi Biaya & Pemeliharaan Perangkat (Maintenance)';
            case 'disposal':
                return 'Rekapitulasi Pemusnahan & Penghapusan Unit (Disposal)';
            case 'assets':
                return 'Laporan Master Inventaris Fisik Hardware';
            case 'licenses':
                return 'Laporan Utilisasi & Alokasi Lisensi Software';
            case 'audit':
                return 'Laporan Hasil Stock Opname & Audit Fisik';
            default:
                return 'Laporan Rekapitulasi';
        }
    };

    return (
        <div className="space-y-6 pb-12 print:p-0 print:m-0 print:space-y-4">
            {/* Header / Filter Toolbar (Hidden on print) */}
            <div className="print:hidden space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                    <div className="space-y-1">
                        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                            Pusat Rekapitulasi & Pelaporan Eksekutif
                        </div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                            Rekap Laporan Berdasarkan Rentang Waktu
                        </h1>
                        <p className="text-xs text-slate-500">
                            Pilih periode tanggal dan kategori untuk mengekspor data ke Excel/CSV atau cetak berkas pengesahan resmi
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <Button
                            variant="outline"
                            onClick={handleDownloadCSV}
                            className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                        >
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Unduh CSV (Excel)
                        </Button>
                        <Button variant="primary" onClick={handlePrint}>
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            Cetak Dokumen Resmi
                        </Button>
                    </div>
                </div>

                {/* Filter Control Box */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Kategori Laporan
                        </label>
                        <select
                            value={reportType}
                            onChange={(e) => setReportType(e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white font-medium text-slate-800"
                        >
                            <option value="assignments">Mutasi & Serah Terima Aset (BAST)</option>
                            <option value="maintenance">Biaya & Pemeliharaan (Maintenance)</option>
                            <option value="disposal">Pemusnahan & Penghapusan (Disposal)</option>
                            <option value="assets">Master Inventaris Fisik (Hardware)</option>
                            <option value="licenses">Lisensi Software & Utilisasi Kursi</option>
                            <option value="audit">Hasil Stock Opname / Audit Fisik</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Tanggal Mulai (Start Date)
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Tanggal Selesai (End Date)
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                    </div>

                    <div className="flex items-end">
                        <Button
                            variant="outline"
                            onClick={fetchReport}
                            isLoading={loading}
                            className="w-full"
                        >
                            Perbarui Data
                        </Button>
                    </div>
                </div>
            </div>

            {/* Print Header (Visible ONLY when printing or in formal view) */}
            <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-wide text-slate-900">
                            PT ENTERPRISE TEKNOLOGI UTAMA
                        </h2>
                        <p className="text-xs text-slate-600">
                            Divisi Information Technology & IT Governance • Portal IT Asset Management
                        </p>
                        <p className="text-[11px] text-slate-500">
                            Gedung IT Tower Lt. 8, Jl. Jendral Sudirman Kav. 24, Jakarta Pusat
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-xs font-bold text-slate-900">DOKUMEN RESMI</div>
                        <div className="text-[10px] text-slate-500">
                            Dicetak: {new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}
                        </div>
                    </div>
                </div>
                <div className="mt-4 pt-2 border-t border-slate-300 flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-800 uppercase">{getReportTitle()}</span>
                    <span className="font-medium text-slate-600">
                        Periode: {startDate} s/d {endDate}
                    </span>
                </div>
            </div>

            {/* Summary KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 print:grid-cols-4 print:gap-2">
                {reportType === 'maintenance' && (
                    <>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs print:p-2 print:border-slate-400">
                            <div className="text-[11px] font-medium text-slate-500">Total Biaya Pemeliharaan</div>
                            <div className="text-lg font-bold text-rose-600 mt-1">
                                {formatCurrency(summary.total_cost || 0)}
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs print:p-2 print:border-slate-400">
                            <div className="text-[11px] font-medium text-slate-500">Total Transaksi Servis</div>
                            <div className="text-lg font-bold text-slate-900 mt-1">
                                {summary.total_maintenance_events || 0} Kali
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs print:p-2 print:border-slate-400">
                            <div className="text-[11px] font-medium text-slate-500">Servis Selesai</div>
                            <div className="text-lg font-bold text-emerald-600 mt-1">
                                {summary.completed_events || 0} Unit
                            </div>
                        </div>
                    </>
                )}

                {reportType === 'assignments' && (
                    <>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs print:p-2 print:border-slate-400">
                            <div className="text-[11px] font-medium text-slate-500">Total Mutasi Unit</div>
                            <div className="text-lg font-bold text-slate-900 mt-1">
                                {summary.total_transactions || 0} Rekaman
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs print:p-2 print:border-slate-400">
                            <div className="text-[11px] font-medium text-slate-500">Status Aktif Dipegang</div>
                            <div className="text-lg font-bold text-blue-600 mt-1">
                                {summary.active_assignments || 0} Unit
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs print:p-2 print:border-slate-400">
                            <div className="text-[11px] font-medium text-slate-500">Telah Dikembalikan</div>
                            <div className="text-lg font-bold text-slate-600 mt-1">
                                {summary.returned_assignments || 0} Unit
                            </div>
                        </div>
                    </>
                )}

                {reportType === 'disposal' && (
                    <>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs print:p-2 print:border-slate-400">
                            <div className="text-[11px] font-medium text-slate-500">Total Unit Dimusnahkan</div>
                            <div className="text-lg font-bold text-rose-600 mt-1">
                                {summary.total_disposed_units || 0} Unit
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs print:p-2 print:border-slate-400">
                            <div className="text-[11px] font-medium text-slate-500">Total Nilai Residu/Salvage</div>
                            <div className="text-lg font-bold text-emerald-600 mt-1">
                                {formatCurrency(summary.total_salvage_value || 0)}
                            </div>
                        </div>
                    </>
                )}

                {reportType === 'assets' && (
                    <>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs print:p-2 print:border-slate-400">
                            <div className="text-[11px] font-medium text-slate-500">Total Inventaris</div>
                            <div className="text-lg font-bold text-slate-900 mt-1">
                                {summary.total_assets || 0} Unit
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs print:p-2 print:border-slate-400">
                            <div className="text-[11px] font-medium text-slate-500">In Stock (Tersedia)</div>
                            <div className="text-lg font-bold text-emerald-600 mt-1">
                                {summary.in_stock || 0} Unit
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs print:p-2 print:border-slate-400">
                            <div className="text-[11px] font-medium text-slate-500">Deployed (Digunakan)</div>
                            <div className="text-lg font-bold text-blue-600 mt-1">
                                {summary.deployed || 0} Unit
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs print:p-2 print:border-slate-400">
                            <div className="text-[11px] font-medium text-slate-500">Maintenance</div>
                            <div className="text-lg font-bold text-amber-600 mt-1">
                                {summary.maintenance || 0} Unit
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Report Data Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden print:border-none print:shadow-none">
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between print:hidden">
                    <div className="font-bold text-sm text-slate-900">
                        {getReportTitle()} ({reportData.length} Baris Data)
                    </div>
                    <div className="text-xs text-slate-500">
                        Periode: <span className="font-semibold text-slate-700">{startDate}</span> s/d <span className="font-semibold text-slate-700">{endDate}</span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs print:text-[10px]">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 font-bold uppercase tracking-wider text-slate-600 print:bg-slate-100">
                                {reportType === 'assignments' && (
                                    <>
                                        <th className="px-4 py-3">Tag Aset</th>
                                        <th className="px-4 py-3">Perangkat</th>
                                        <th className="px-4 py-3">Penerima (Karyawan)</th>
                                        <th className="px-4 py-3">Divisi</th>
                                        <th className="px-4 py-3">Tgl Penyerahan</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Catatan Kondisi</th>
                                    </>
                                )}
                                {reportType === 'maintenance' && (
                                    <>
                                        <th className="px-4 py-3">Tag Aset</th>
                                        <th className="px-4 py-3">Nama Perangkat</th>
                                        <th className="px-4 py-3">Vendor / Tempat Servis</th>
                                        <th className="px-4 py-3">Tipe Servis</th>
                                        <th className="px-4 py-3">Tanggal Servis</th>
                                        <th className="px-4 py-3 text-right">Biaya Servis</th>
                                        <th className="px-4 py-3">Status</th>
                                    </>
                                )}
                                {reportType === 'disposal' && (
                                    <>
                                        <th className="px-4 py-3">Tag Aset</th>
                                        <th className="px-4 py-3">Perangkat</th>
                                        <th className="px-4 py-3">Tanggal Pemusnahan</th>
                                        <th className="px-4 py-3">Metode</th>
                                        <th className="px-4 py-3">Disetujui Oleh</th>
                                        <th className="px-4 py-3 text-right">Nilai Residu</th>
                                        <th className="px-4 py-3">Alasan / Catatan</th>
                                    </>
                                )}
                                {reportType === 'assets' && (
                                    <>
                                        <th className="px-4 py-3">Tag Aset</th>
                                        <th className="px-4 py-3">Kategori</th>
                                        <th className="px-4 py-3">Brand & Model</th>
                                        <th className="px-4 py-3">Serial Number</th>
                                        <th className="px-4 py-3">Status Fisik</th>
                                        <th className="px-4 py-3">Pemegang Saat Ini</th>
                                        <th className="px-4 py-3">Tgl Pembelian</th>
                                    </>
                                )}
                                {reportType === 'licenses' && (
                                    <>
                                        <th className="px-4 py-3">Nama Software</th>
                                        <th className="px-4 py-3">Vendor</th>
                                        <th className="px-4 py-3">Tipe Lisensi</th>
                                        <th className="px-4 py-3">Total Kursi</th>
                                        <th className="px-4 py-3">Terpakai</th>
                                        <th className="px-4 py-3">Sisa Kursi</th>
                                        <th className="px-4 py-3">Tgl Kadaluarsa</th>
                                    </>
                                )}
                                {reportType === 'audit' && (
                                    <>
                                        <th className="px-4 py-3">Tanggal Audit</th>
                                        <th className="px-4 py-3">Tag Aset</th>
                                        <th className="px-4 py-3">Nama Aset</th>
                                        <th className="px-4 py-3">Kondisi Fisik</th>
                                        <th className="px-4 py-3">Lokasi Terdata</th>
                                        <th className="px-4 py-3">Auditor</th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                                        Memproses rekap data laporan...
                                    </td>
                                </tr>
                            ) : reportData.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                                        Tidak ada data yang tercatat dalam rentang waktu yang dipilih.
                                    </td>
                                </tr>
                            ) : (
                                reportData.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 print:border-b print:border-slate-300">
                                        {reportType === 'assignments' && (
                                            <>
                                                <td className="px-4 py-2.5 font-mono font-semibold text-slate-900">{row.asset_tag}</td>
                                                <td className="px-4 py-2.5 font-medium">{row.asset_name}</td>
                                                <td className="px-4 py-2.5 font-semibold text-blue-900">{row.employee_name} ({row.employee_id})</td>
                                                <td className="px-4 py-2.5">{row.department}</td>
                                                <td className="px-4 py-2.5">{row.assigned_date?.split('T')[0]}</td>
                                                <td className="px-4 py-2.5">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                        row.assignment_status === 'active'
                                                            ? 'bg-blue-100 text-blue-800'
                                                            : 'bg-slate-100 text-slate-700'
                                                    }`}>
                                                        {row.assignment_status === 'active' ? 'Aktif Dipegang' : 'Telah Kembali'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5 text-slate-500">{row.condition_notes || '-'}</td>
                                            </>
                                        )}
                                        {reportType === 'maintenance' && (
                                            <>
                                                <td className="px-4 py-2.5 font-mono font-semibold text-slate-900">{row.asset_tag}</td>
                                                <td className="px-4 py-2.5 font-medium">{row.asset_name}</td>
                                                <td className="px-4 py-2.5">{row.vendor || '-'}</td>
                                                <td className="px-4 py-2.5 capitalize">{row.maintenance_type}</td>
                                                <td className="px-4 py-2.5">{row.maintenance_date?.split('T')[0]}</td>
                                                <td className="px-4 py-2.5 text-right font-semibold text-slate-900">
                                                    {formatCurrency(parseFloat(row.cost) || 0)}
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                                        {row.status}
                                                    </span>
                                                </td>
                                            </>
                                        )}
                                        {reportType === 'disposal' && (
                                            <>
                                                <td className="px-4 py-2.5 font-mono font-semibold text-slate-900">{row.asset_tag}</td>
                                                <td className="px-4 py-2.5 font-medium">{row.asset_name}</td>
                                                <td className="px-4 py-2.5">{row.disposal_date?.split('T')[0]}</td>
                                                <td className="px-4 py-2.5 capitalize">{row.method}</td>
                                                <td className="px-4 py-2.5 font-semibold">{row.approved_by || '-'}</td>
                                                <td className="px-4 py-2.5 text-right font-semibold text-emerald-700">
                                                    {formatCurrency(parseFloat(row.disposal_value) || 0)}
                                                </td>
                                                <td className="px-4 py-2.5 text-slate-500">{row.reason}</td>
                                            </>
                                        )}
                                        {reportType === 'assets' && (
                                            <>
                                                <td className="px-4 py-2.5 font-mono font-semibold text-slate-900">{row.asset_tag}</td>
                                                <td className="px-4 py-2.5">{row.category_name}</td>
                                                <td className="px-4 py-2.5 font-medium">{row.brand} {row.model}</td>
                                                <td className="px-4 py-2.5 font-mono">{row.serial_number}</td>
                                                <td className="px-4 py-2.5">
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 uppercase">
                                                        {row.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5 font-semibold text-slate-800">
                                                    {row.current_holder ? `${row.current_holder} (${row.current_department})` : '-'}
                                                </td>
                                                <td className="px-4 py-2.5">{row.purchase_date?.split('T')[0] || '-'}</td>
                                            </>
                                        )}
                                        {reportType === 'licenses' && (
                                            <>
                                                <td className="px-4 py-2.5 font-semibold text-slate-900">{row.software_name}</td>
                                                <td className="px-4 py-2.5">{row.vendor}</td>
                                                <td className="px-4 py-2.5 capitalize">{row.license_type}</td>
                                                <td className="px-4 py-2.5 text-center">{row.seats_total}</td>
                                                <td className="px-4 py-2.5 text-center font-bold text-blue-700">{row.seats_allocated}</td>
                                                <td className="px-4 py-2.5 text-center font-bold text-emerald-700">{row.seats_available}</td>
                                                <td className="px-4 py-2.5">{row.expiry_date?.split('T')[0] || 'Seumur Hidup'}</td>
                                            </>
                                        )}
                                        {reportType === 'audit' && (
                                            <>
                                                <td className="px-4 py-2.5">{row.scan_date?.split('T')[0]}</td>
                                                <td className="px-4 py-2.5 font-mono font-semibold text-slate-900">{row.asset_tag}</td>
                                                <td className="px-4 py-2.5 font-medium">{row.asset_name}</td>
                                                <td className="px-4 py-2.5 uppercase font-bold text-emerald-700">{row.condition}</td>
                                                <td className="px-4 py-2.5">{row.scanned_location || '-'}</td>
                                                <td className="px-4 py-2.5 font-semibold text-slate-800">{row.auditor_name || '-'}</td>
                                            </>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Official Signature Blocks (Visible in print for official documentation) */}
            <div className="hidden print:block pt-8 mt-8 border-t border-slate-400">
                <div className="text-center font-bold text-xs uppercase tracking-wider text-slate-900 mb-6">
                    LEMBAR PENGESAHAN DOKUMEN REKAPITULASI ASET
                </div>
                <div className="grid grid-cols-4 gap-4 text-center text-[10px]">
                    <div>
                        <div className="text-slate-500 mb-14">Dibuat Oleh,</div>
                        <div className="font-bold underline text-slate-900">Dimas Pratama</div>
                        <div className="text-slate-600">IT Asset Manager</div>
                    </div>
                    <div>
                        <div className="text-slate-500 mb-14">Diperiksa Oleh,</div>
                        <div className="font-bold underline text-slate-900">Hendra Wijaya</div>
                        <div className="text-slate-600">Head of IT</div>
                    </div>
                    <div>
                        <div className="text-slate-500 mb-14">Diketahui Oleh,</div>
                        <div className="font-bold underline text-slate-900">Ratna Sari</div>
                        <div className="text-slate-600">Finance Manager</div>
                    </div>
                    <div>
                        <div className="text-slate-500 mb-14">Disetujui Oleh,</div>
                        <div className="font-bold underline text-slate-900">Budi Hartono</div>
                        <div className="text-slate-600">Direktur Perusahaan</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
