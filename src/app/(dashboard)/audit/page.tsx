'use client';

import { useState, useEffect } from 'react';

interface AuditLog {
    id: number;
    scanned_at: string;
    physical_location: string;
    condition: string;
    notes: string | null;
    asset_tag: string;
    brand: string;
    model: string;
    scanned_by_name: string | null;
}

interface AuditSession {
    id: number;
    name: string;
    start_date: string;
    status: string;
}

export default function AuditPage() {
    const [session, setSession] = useState<AuditSession | null>(null);
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [sessionName, setSessionName] = useState('');
    const [assetTagInput, setAssetTagInput] = useState('');
    const [locationInput, setLocationInput] = useState('Lantai 2 - Ruang IT');
    const [conditionInput, setConditionInput] = useState('good');
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

    const fetchAuditData = async () => {
        try {
            const res = await fetch('/api/audit');
            const data = await res.json();
            if (data.success) {
                setSession(data.session);
                setLogs(data.logs || []);
            }
        } catch {
            console.error('Gagal mengambil data audit');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAuditData();
    }, []);

    const handleStartSession = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sessionName.trim()) return;

        const res = await fetch('/api/audit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: sessionName }),
        });

        const data = await res.json();
        if (data.success) {
            setSession(data.data);
            setLogs([]);
            setSessionName('');
        }
    };

    const handleCompleteSession = async () => {
        if (!session) return;
        if (!window.confirm(`Tutup sesi audit "${session.name}" sekarang?`)) return;

        try {
            const res = await fetch('/api/audit', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id: session.id }),
            });

            const data = await res.json();
            if (data.success) {
                setMessage({ text: 'Sesi audit berhasil diselesaikan dan diarsipkan.', error: false });
                fetchAuditData();
            } else {
                setMessage({ text: data.message || 'Gagal menyelesaikan sesi audit', error: true });
            }
        } catch {
            setMessage({ text: 'Terjadi kendala jaringan', error: true });
        }
    };

    const handleScanSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!assetTagInput.trim() || !session) return;

        setMessage(null);

        try {
            const res = await fetch('/api/assets/audit/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: session.id,
                    asset_tag: assetTagInput.trim(),
                    physical_location: locationInput,
                    condition: conditionInput,
                }),
            });

            const data = await res.json();
            if (data.success) {
                setMessage({ text: data.message, error: false });
                setAssetTagInput('');
                fetchAuditData(); // Refresh list log
            } else {
                setMessage({ text: data.message || 'Gagal scan unit', error: true });
            }
        } catch {
            setMessage({ text: 'Kendala jaringan', error: true });
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-slate-400 text-xs">Memuat data audit...</div>;
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Stock Opname & Audit Fisik</h1>
                <p className="text-xs text-slate-500">Verifikasi keberadaan fisik perangkat IT langsung di lapangan</p>
            </div>

            {!session ? (
                /* Form Mulai Sesi Baru jika belum ada sesi aktif */
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-md space-y-4">
                    <h2 className="text-sm font-bold text-slate-800">Belum Ada Sesi Audit yang Aktif</h2>
                    <form onSubmit={handleStartSession} className="space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Nama Sesi Audit</label>
                            <input
                                type="text"
                                required
                                placeholder="Contoh: Audit Rutin Q3 2026"
                                value={sessionName}
                                onChange={(e) => setSessionName(e.target.value)}
                                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer"
                        >
                            Mulai Sesi Audit Baru
                        </button>
                    </form>
                </div>
            ) : (
                /* Layout Verifikasi Audit Aktif */
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Kolom Kiri: Form Scanner / Input Cepat */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 h-fit">
                        <div className="border-b pb-3 flex justify-between items-start">
                            <div>
                                <span className="text-[10px] font-bold text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                    Sesi Berjalan
                                </span>
                                <h2 className="text-base font-bold text-slate-900 mt-1">{session.name}</h2>
                                <p className="text-[11px] text-slate-400">
                                    Mulai: {new Date(session.start_date).toLocaleDateString('id-ID')}
                                </p>
                            </div>
                            <button
                                onClick={handleCompleteSession}
                                className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold border border-rose-200 hover:bg-rose-50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                            >
                                Selesaikan Sesi
                            </button>
                        </div>

                        {message && (
                            <div
                                className={`p-3 rounded-xl text-xs font-medium border ${
                                    message.error
                                        ? 'bg-rose-50 border-rose-200 text-rose-700'
                                        : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                }`}
                            >
                                {message.text}
                            </div>
                        )}

                        <form onSubmit={handleScanSubmit} className="space-y-3 text-xs">
                            <div>
                                <label className="block font-medium text-slate-700 mb-1">
                                    Tag Aset (Ketik / Scan Barcode)
                                </label>
                                <input
                                    type="text"
                                    required
                                    autoFocus
                                    placeholder="Contoh: IT-NB-2026-0001"
                                    value={assetTagInput}
                                    onChange={(e) => setAssetTagInput(e.target.value)}
                                    className="w-full p-2.5 border-2 border-blue-500 rounded-xl font-mono text-xs outline-none font-bold uppercase focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block font-medium text-slate-700 mb-1">Lokasi Fisik Ditemukan</label>
                                <input
                                    type="text"
                                    required
                                    value={locationInput}
                                    onChange={(e) => setLocationInput(e.target.value)}
                                    className="w-full p-2 border border-slate-300 rounded-xl outline-none"
                                />
                            </div>

                            <div>
                                <label className="block font-medium text-slate-700 mb-1">Kondisi Fisik</label>
                                <select
                                    value={conditionInput}
                                    onChange={(e) => setConditionInput(e.target.value)}
                                    className="w-full p-2 border border-slate-300 rounded-xl bg-white outline-none"
                                >
                                    <option value="good">Baik / Berfungsi Normal</option>
                                    <option value="fair">Cukup / Baret Wajar</option>
                                    <option value="damaged">Rusak / Perlu Perbaikan</option>
                                    <option value="missing_parts">Kelengkapan Kurang</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-2.5 bg-slate-900 hover:bg-black text-white font-semibold rounded-xl shadow-sm transition-colors cursor-pointer"
                            >
                                Simpan Verifikasi Unit
                            </button>
                        </form>
                    </div>

                    {/* Kolom Kanan: Tabel Log Audit yang Masuk */}
                    <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                        <div className="flex justify-between items-center border-b pb-3">
                            <h2 className="text-sm font-bold text-slate-800">
                                Rekap Verifikasi Opname Sesi Ini ({logs.length} Unit)
                            </h2>
                            <span className="text-xs text-slate-400">Terurut dari yang terakhir di-scan</span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                                    <tr>
                                        <th className="py-2.5 px-3">Tag Aset</th>
                                        <th className="py-2.5 px-3">Perangkat</th>
                                        <th className="py-2.5 px-3">Lokasi</th>
                                        <th className="py-2.5 px-3">Kondisi</th>
                                        <th className="py-2.5 px-3">Waktu Scan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700">
                                    {logs.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                                                Belum ada unit yang di-scan pada sesi ini.
                                            </td>
                                        </tr>
                                    ) : (
                                        logs.map((log) => (
                                            <tr key={log.id} className="hover:bg-slate-50">
                                                <td className="py-2.5 px-3 font-mono font-bold text-blue-600">
                                                    {log.asset_tag}
                                                </td>
                                                <td className="py-2.5 px-3 font-medium">
                                                    {log.brand} {log.model}
                                                </td>
                                                <td className="py-2.5 px-3 text-slate-600">
                                                    {log.physical_location}
                                                </td>
                                                <td className="py-2.5 px-3">
                                                    <span
                                                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                            log.condition === 'good'
                                                                ? 'bg-emerald-50 text-emerald-700'
                                                                : 'bg-rose-50 text-rose-700'
                                                        }`}
                                                    >
                                                        {log.condition.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                                                    {new Date(log.scanned_at).toLocaleTimeString('id-ID', {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}