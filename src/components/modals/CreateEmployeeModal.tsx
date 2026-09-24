'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

interface CreateEmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const DEPARTMENTS = [
    'Finance',
    'Human Resources (HR)',
    'Marketing',
    'Sales',
    'Operations',
    'Information Technology (IT)',
    'General Affairs (GA)',
    'Legal & Compliance',
    'Procurement',
];

export default function CreateEmployeeModal({
    isOpen,
    onClose,
    onSuccess,
}: CreateEmployeeModalProps) {
    const [employeeId, setEmployeeId] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [department, setDepartment] = useState('');
    const [departments, setDepartments] = useState<{ id: number; name: string; code: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetch('/api/departments')
                .then((res) => res.json())
                .then((json) => {
                    if (json.success && Array.isArray(json.data) && json.data.length > 0) {
                        setDepartments(json.data);
                        if (!department) {
                            setDepartment(json.data[0].name);
                        }
                    }
                })
                .catch(() => {});
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!employeeId.trim() || !name.trim() || !email.trim() || !department.trim()) {
            setError('Semua kolom bertanda bintang (*) wajib diisi');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/employees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employee_id: employeeId.trim(),
                    name: name.trim(),
                    email: email.trim(),
                    department: department.trim(),
                }),
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Gagal mendaftarkan karyawan');
            }

            setEmployeeId('');
            setName('');
            setEmail('');
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
            title="Registrasi Karyawan Baru (Master Penerima Aset)"
            maxWidth="lg"
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

                <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3.5 text-xs text-emerald-900 space-y-1">
                    <p className="font-semibold flex items-center gap-1.5 text-emerald-800">
                        <svg
                            className="w-4 h-4 text-emerald-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        Ketentuan Data Karyawan:
                    </p>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                        Data karyawan ini disimpan murni sebagai database penerima aset perangkat kantor (Check-out & BAST). Karyawan <span className="font-semibold text-slate-800">tidak mendapatkan akun dan tidak memiliki hak login</span> ke sistem portal.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                            NIK / ID Karyawan <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={employeeId}
                            onChange={(e) => setEmployeeId(e.target.value)}
                            placeholder="Contoh: EMP-0143"
                            required
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono uppercase"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Divisi / Departemen <span className="text-rose-500">*</span>
                        </label>
                        <select
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                        >
                            {departments.length === 0 ? (
                                <option value="">Memuat data divisi...</option>
                            ) : (
                                departments.map((d) => (
                                    <option key={d.id} value={d.name}>
                                        {d.name} {d.code ? `(${d.code})` : ''}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nama Lengkap Karyawan <span className="text-rose-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Contoh: Febmy"
                        required
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Email Perusahaan <span className="text-rose-500">*</span>
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="nama.karyawan@company.com"
                        required
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                    <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                        Batal
                    </Button>
                    <Button type="submit" variant="primary" isLoading={loading}>
                        Simpan Karyawan
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
