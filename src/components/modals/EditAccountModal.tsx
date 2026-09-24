'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { SYSTEM_ACCOUNT_ROLES, SystemAccountRole, User } from '@/types/user';

interface EditAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    user: User | null;
}

interface Department {
    id: number;
    name: string;
    code: string;
}

export default function EditAccountModal({
    isOpen,
    onClose,
    onSuccess,
    user,
}: EditAccountModalProps) {
    const [employeeId, setEmployeeId] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [department, setDepartment] = useState('');
    const [role, setRole] = useState<SystemAccountRole>('it_asset_manager');
    const [isActive, setIsActive] = useState(true);
    const [newPassword, setNewPassword] = useState('');

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

    // Populate data saat user dipilih
    useEffect(() => {
        if (user) {
            setEmployeeId(user.employee_id || '');
            setName(user.name || '');
            setEmail(user.email || '');
            setDepartment(user.department || '');
            if (
                ['director', 'it_asset_manager', 'head_it', 'finance', 'lead_it_gov'].includes(
                    user.role
                )
            ) {
                setRole(user.role as SystemAccountRole);
            }
            setIsActive(user.is_active ?? true);
            setNewPassword('');
            setError(null);
        }
    }, [user]);

    if (!user) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!employeeId.trim() || !name.trim() || !email.trim()) {
            setError('NIK, Nama, dan Email wajib diisi');
            return;
        }

        if (newPassword && newPassword.length < 6) {
            setError('Password baru minimal 6 karakter');
            return;
        }

        setLoading(true);
        try {
            const bodyPayload: any = {
                id: user.id,
                employee_id: employeeId.trim(),
                name: name.trim(),
                email: email.trim(),
                department: department.trim() || null,
                role,
                is_active: isActive,
            };

            if (newPassword.trim()) {
                bodyPayload.new_password = newPassword.trim();
            }

            const res = await fetch('/api/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyPayload),
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Gagal memperbarui akun');
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
            title={`Edit Akun: ${user.name}`}
            maxWidth="xl"
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
                            NIK / ID Akun <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={employeeId}
                            onChange={(e) => setEmployeeId(e.target.value)}
                            required
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono uppercase"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Role / Hak Akses <span className="text-rose-500">*</span>
                        </label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value as SystemAccountRole)}
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white font-medium text-slate-800"
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
                            required
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
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
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Divisi / Departemen
                        </label>
                        <select
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            <option value="">Pilih Divisi...</option>
                            {departments.map((dept) => (
                                <option key={dept.id} value={dept.name}>
                                    {dept.name} {dept.code ? `(${dept.code})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Status Akun
                        </label>
                        <select
                            value={isActive ? 'active' : 'inactive'}
                            onChange={(e) => setIsActive(e.target.value === 'active')}
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            <option value="active">Aktif (Dapat Login)</option>
                            <option value="inactive">Nonaktif (Akses Dinonaktifkan)</option>
                        </select>
                    </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Reset / Ubah Password (Opsional)
                    </label>
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Kosongkan jika tidak ingin mengubah password"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                        Isi kolom di atas hanya jika Anda ingin mereset password akun ini (minimal 6 karakter).
                    </p>
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
