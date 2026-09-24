'use client';

import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

interface CreateDepartmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateDepartmentModal({
    isOpen,
    onClose,
    onSuccess,
}: CreateDepartmentModalProps) {
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!name.trim()) {
            setError('Nama divisi wajib diisi');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/departments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name.trim(),
                    code: code.trim() || null,
                    description: description.trim() || null,
                }),
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Gagal mendaftarkan divisi');
            }

            setName('');
            setCode('');
            setDescription('');
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Terjadi kesalahan sistem');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Daftarkan Divisi / Departemen Baru"
            maxWidth="md"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
                        <svg
                            className="w-4 h-4 text-rose-500 shrink-0 mt-0.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nama Divisi / Departemen <span className="text-rose-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Contoh: Research & Development"
                        required
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Kode Singkatan Divisi (Opsional)
                    </label>
                    <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Contoh: RND"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono uppercase"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                        Digunakan untuk singkatan pada label aset dan kode penomoran internal.
                    </p>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Deskripsi / Tanggung Jawab
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        placeholder="Jelaskan peran divisi ini dalam organisasi perusahaan..."
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                    <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                        Batal
                    </Button>
                    <Button type="submit" variant="primary" isLoading={loading}>
                        Simpan Divisi
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
