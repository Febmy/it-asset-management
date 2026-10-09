'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { SYSTEM_ACCOUNT_ROLES, SystemAccountRole } from '@/types/user';

interface CreateAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateAccountModal({
    isOpen,
    onClose,
    onSuccess,
}: CreateAccountModalProps) {
    const [employeeId, setEmployeeId] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [department, setDepartment] = useState('');
    const [role, setRole] = useState<SystemAccountRole>('it_asset_manager');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [departments, setDepartments] = useState<{ id: number; name: string; code: string }[]>([]);

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

        if (!employeeId.trim() || !name.trim() || !email.trim() || !password) {
            setError('Semua kolom bertanda bintang (*) wajib diisi');
            return;
        }

        if (password.length < 6) {
            setError('Password minimal 6 karakter');
            return;
        }

        if (password !== confirmPassword) {
            setError('Konfirmasi password tidak cocok');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employee_id: employeeId.trim(),
                    name: name.trim(),
                    email: email.trim(),
                    department: department.trim(),
                    role,
                    password,
                }),
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Gagal mendaftarkan akun');
            }

            // Reset form
            setEmployeeId('');
            setName('');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
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
            title="Daftarkan Akun Sistem Berwenang"
            maxWidth="xl"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
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

                <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3.5 text-xs text-blue-900 space-y-1">
                    <p className="font-semibold flex items-center gap-1.5 text-blue-800">
                        <svg
                            className="w-4 h-4 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        Aturan Hak Akses Akun:
                    </p>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                        Akun login hanya dapat diberikan kepada jabatan pimpinan dan pengelola sistem (
                        <span className="font-medium text-slate-900">Director</span>,{' '}
                        <span className="font-medium text-slate-900">IT Asset Manager</span>,{' '}
                        <span className="font-medium text-slate-900">Head of IT</span>,{' '}
                        <span className="font-medium text-slate-900">Finance</span>,{' '}
                        <span className="font-medium text-slate-900">Lead IT Gov</span>). Karyawan biasa tidak diberikan akun login.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                            NIK / ID Akun <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={employeeId}
                            onChange={(e) => setEmployeeId(e.target.value)}
                            placeholder="Contoh: ITM-0002"
                            required
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono uppercase"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Role / Hak Akses <span className="text-rose-500">*</span>
                        </label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value as SystemAccountRole)}
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-medium text-slate-800"
                        >
                            {SYSTEM_ACCOUNT_ROLES.map((r) => (
                                <option key={r.value} value={r.value}>
                                    {r.label} ({r.description.split('/')[0].trim()})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Nama Lengkap <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Nama pejabat / penanggung jawab"
                            required
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                            placeholder="nama@yodu.id"
                            required
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Departemen / Divisi
                    </label>
                    <select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Password Akun <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Minimal 6 karakter"
                            required
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Konfirmasi Password <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Ulangi password"
                            required
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                    <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                        Batal
                    </Button>
                    <Button type="submit" variant="primary" isLoading={loading}>
                        Daftarkan Akun
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
