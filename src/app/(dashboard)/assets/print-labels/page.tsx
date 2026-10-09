'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';

interface AssetItem {
    id: number;
    asset_tag: string;
    brand: string;
    model: string;
    serial_number: string;
}

interface LabelItem extends AssetItem {
    qrDataUrl: string;
}

export default function PrintLabelsPage() {
    const [labels, setLabels] = useState<LabelItem[]>([]);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadAndGenerateQR() {
            try {
                const res = await fetch('/api/assets');
                const json = await res.json();

                if (json.success) {
                    const itemsWithQR: LabelItem[] = await Promise.all(
                        json.data.map(async (item: AssetItem) => {
                            // Generate QR Code data URL dari asset_tag
                            const qrDataUrl = await QRCode.toDataURL(item.asset_tag, {
                                width: 120,
                                margin: 1,
                                errorCorrectionLevel: 'M',
                            });
                            return { ...item, qrDataUrl };
                        })
                    );
                    setLabels(itemsWithQR);
                    // Default: pilih semua aset untuk dicetak
                    setSelectedIds(itemsWithQR.map((i) => i.id));
                }
            } catch (err) {
                console.error('Gagal membuat QR label', err);
            } finally {
                setLoading(false);
            }
        }

        loadAndGenerateQR();
    }, []);

    const toggleSelect = (id: number) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            {/* Tombol Aksi & Kontrol (Sembunyi saat dicetak printer) */}
            <div className="print:hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Cetak Label Stiker Aset</h1>
                    <p className="text-xs text-slate-500">
                        Pilih unit yang ingin dicetak labelnya (Ukuran stiker dioptimasi untuk kertas label/A4).
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setSelectedIds(labels.map((l) => l.id))}
                        className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50"
                    >
                        Pilih Semua
                    </button>
                    <button
                        onClick={() => setSelectedIds([])}
                        className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50"
                    >
                        Reset
                    </button>
                    <button
                        onClick={handlePrint}
                        disabled={selectedIds.length === 0}
                        className="px-4 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 shadow-sm disabled:opacity-50"
                    >
                        🖨️ Cetak ({selectedIds.length}) Stiker
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12 text-slate-400 text-xs">Menyiapkan barcode aset...</div>
            ) : (
                /* Grid Layout Stiker Aset */
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 print:grid-cols-3 print:gap-3">
                    {labels.map((item) => {
                        const isSelected = selectedIds.includes(item.id);
                        return (
                            <div
                                key={item.id}
                                onClick={() => toggleSelect(item.id)}
                                className={`cursor-pointer border-2 rounded-xl p-3 bg-white flex items-center gap-3 transition-all select-none
                  ${isSelected
                                        ? 'border-blue-600 shadow-sm'
                                        : 'border-slate-200 opacity-40 print:hidden'
                                    }
                  print:border-slate-800 print:shadow-none print:opacity-100 print:break-inside-avoid`}
                            >
                                {/* Gambar QR Code */}
                                <img
                                    src={item.qrDataUrl}
                                    alt={item.asset_tag}
                                    className="w-16 h-16 shrink-0"
                                />

                                {/* Info Teks Stiker */}
                                <div className="overflow-hidden leading-tight">
                                    <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase block">
                                        Property of PT.AKASANET BUMI NUSANTARA
                                    </span>
                                    <p className="text-xs font-mono font-black text-slate-900 mt-0.5">
                                        {item.asset_tag}
                                    </p>
                                    <p className="text-[11px] font-semibold text-slate-700 truncate mt-0.5">
                                        {item.brand} {item.model}
                                    </p>
                                    <p className="text-[10px] font-mono text-slate-500 truncate">
                                        SN: {item.serial_number}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}