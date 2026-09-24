'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

interface Employee {
    id: number;
    employee_id: string;
    name: string;
    email: string;
    department: string;
}

interface Department {
    id: number;
    name: string;
    code: string;
}

interface EditEmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    employee: Employee | null;
}

export default function EditEmployeeModal({
    isOpen,
    onClose,
    onSuccess,
    employee,
}: EditEmployeeModalProps) {
    const [employeeId, setEmployeeId] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [department, setDepartment] = useState('');
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Ambil daftar divisi dinamis
    useEffect(() => {
        if (isOpen) {
            fetch('/api/departments')
                .then((res) => res.json())
                .then((json) => {
                    if (json.success && Array.isArray(json.data)) {
                        setDepartments(json.data);
                    }
                })
                .catch(() => {});
        }
    }, [isOpen]);

    useEffect(() => {
        if (employee) {
            setEmployeeId(employee.employee_id || '');
            setName(employee.name || '');
            setEmail(employee.email || '');
            setDepartment(employee.department || '');
            setError(null);
        }
    }, [employee]);

    if (!employee) return null;

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
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: employee.id,
                    employee_id: employeeId.trim(),
                    name: name.trim(),
                    email: email.trim(),
                    department: department.trim(),
                }),
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Gagal memperbarui data karyawan');
            }

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
            title={`Edit Data Karyawan: ${employee.name}`}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                            NIK / ID Karyawan <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={employeeId}
                            onChange={(e) => setEmployeeId(e.target.value)}
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
                            <option value="">Pilih Divisi...</option>
                            {departments.map((dept) => (
                                <option key={dept.id} value={dept.name}>
                                    {dept.name} {dept.code ? `(${dept.code})` : ''}
                                </option>
                            ))}
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
                        required
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Email Kantor Resmi <span className="text-rose-500">*</span>
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                    <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                        Batal
                    </Button>
                    <Button type="submit" variant="primary" isLoading={loading}>
                        Simpan Perubahan
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
