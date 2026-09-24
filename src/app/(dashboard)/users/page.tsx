'use client';

import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import CreateAccountModal from '@/components/modals/CreateAccountModal';
import EditAccountModal from '@/components/modals/EditAccountModal';
import type { User, SystemAccountRole } from '@/types/user';

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedUserForEdit, setSelectedUserForEdit] = useState<User | null>(null);
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/users?type=accounts');
            const json = await res.json();
            if (json.success) {
                setUsers(json.data || []);
            }
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const toggleUserStatus = async (user: User) => {
        if (
            !confirm(
                `Apakah Anda yakin ingin ${user.is_active ? 'menonaktifkan' : 'mengaktifkan'} akun ${user.name}?`
            )
        ) {
            return;
        }

        setActionLoading(user.id);
        try {
            const res = await fetch('/api/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: user.id,
                    is_active: !user.is_active,
                }),
            });
            const data = await res.json();
            if (data.success) {
                fetchUsers();
            } else {
                alert(data.message || 'Gagal mengubah status akun');
            }
        } catch (err) {
            console.error(err);
            alert('Terjadi kesalahan sistem');
        } finally {
            setActionLoading(null);
        }
    };

    const filteredUsers = users.filter((u) => {
        const matchesSearch =
            u.name.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase()) ||
            u.employee_id.toLowerCase().includes(search.toLowerCase());

        const matchesRole = roleFilter === 'all' || u.role === roleFilter;

        return matchesSearch && matchesRole;
    });

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'director':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                        Direktur
                    </span>
                );
            case 'it_asset_manager':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                        IT Asset Manager
                    </span>
                );
            case 'head_it':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                        Head of IT
                    </span>
                );
            case 'finance':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                        Finance
                    </span>
                );
            case 'lead_it_gov':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        Lead IT Gov
                    </span>
                );
            case 'super_admin':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-white">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Super Admin
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                        {role}
                    </span>
                );
        }
    };

    return (
        <div className="space-y-6 pb-12">
            {/* Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                        Portal Manajemen Akses
                    </div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                        Pendaftaran & Manajemen Akun Sistem
                    </h1>
                    <p className="text-xs text-slate-500">
                        Kelola akun pengguna berwenang yang memiliki hak akses login ke sistem portal IT Asset Management
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="primary"
                        onClick={() => setIsCreateModalOpen(true)}
                        className="shadow-sm"
                    >
                        <svg
                            className="w-4 h-4 mr-1.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 4v16m8-8H4"
                            />
                        </svg>
                        Daftarkan Akun Baru
                    </Button>
                </div>
            </div>

            {/* Role Rules Info Callout */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                            />
                        </svg>
                        Otoritas Hak Akses Sistem
                    </div>
                    <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
                        Akun login ke sistem portal <span className="text-white font-semibold">hanya diberikan untuk 5 peran resmi</span>: Direktur, IT Asset Manager, Head of IT, Finance, dan Lead IT Gov. Karyawan biasa diatur terpisah pada menu <span className="text-indigo-200 font-semibold">Data Karyawan</span> dan tidak memiliki akses login.
                    </p>
                </div>
                <div className="flex flex-wrap gap-1.5 shrink-0">
                    <span className="px-2 py-1 rounded-md text-[10px] font-medium bg-purple-500/20 text-purple-200 border border-purple-400/30">
                        Director
                    </span>
                    <span className="px-2 py-1 rounded-md text-[10px] font-medium bg-blue-500/20 text-blue-200 border border-blue-400/30">
                        IT Asset Manager
                    </span>
                    <span className="px-2 py-1 rounded-md text-[10px] font-medium bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">
                        Head of IT
                    </span>
                    <span className="px-2 py-1 rounded-md text-[10px] font-medium bg-amber-500/20 text-amber-200 border border-amber-400/30">
                        Finance
                    </span>
                    <span className="px-2 py-1 rounded-md text-[10px] font-medium bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                        Lead IT Gov
                    </span>
                </div>
            </div>

            {/* Filter and Search */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80">
                <div className="relative w-full sm:w-80">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                    </span>
                    <input
                        type="text"
                        placeholder="Cari nama, email, NIK..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <label className="text-xs text-slate-500 font-medium whitespace-nowrap">
                        Filter Role:
                    </label>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">Semua Role Akun</option>
                        <option value="director">Direktur</option>
                        <option value="it_asset_manager">IT Asset Manager</option>
                        <option value="head_it">Head of IT</option>
                        <option value="finance">Finance</option>
                        <option value="lead_it_gov">Lead IT Gov</option>
                    </select>
                </div>
            </div>

            {/* Accounts Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                <th className="px-5 py-3.5">ID / NIK</th>
                                <th className="px-5 py-3.5">Nama & Email</th>
                                <th className="px-5 py-3.5">Role / Jabatan</th>
                                <th className="px-5 py-3.5">Departemen</th>
                                <th className="px-5 py-3.5">Status Akun</th>
                                <th className="px-5 py-3.5 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                                        <div className="inline-block animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mb-2" />
                                        <p>Memuat daftar akun pengguna...</p>
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                                        <svg
                                            className="w-10 h-10 mx-auto text-slate-300 mb-2"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="1.5"
                                                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                            />
                                        </svg>
                                        <p className="font-medium text-slate-600">Tidak ada akun yang sesuai kriteria</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr
                                        key={user.id}
                                        className="hover:bg-slate-50/80 transition-colors duration-150"
                                    >
                                        <td className="px-5 py-4 font-mono font-medium text-slate-900">
                                            {user.employee_id}
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="font-semibold text-slate-900">{user.name}</div>
                                            <div className="text-[11px] text-slate-400">{user.email}</div>
                                        </td>
                                        <td className="px-5 py-4">{getRoleBadge(user.role)}</td>
                                        <td className="px-5 py-4 text-slate-600 font-medium">
                                            {user.department || '-'}
                                        </td>
                                        <td className="px-5 py-4">
                                            {user.is_active ? (
                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                    Aktif
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                                    Nonaktif
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setSelectedUserForEdit(user)}
                                                    className="px-3 py-1 rounded-lg text-xs font-medium text-blue-600 border border-blue-200 hover:bg-blue-50 transition-colors"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => toggleUserStatus(user)}
                                                    disabled={actionLoading === user.id}
                                                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors border ${
                                                        user.is_active
                                                            ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                                                            : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                                                    }`}
                                                >
                                                    {actionLoading === user.id
                                                        ? 'Memproses...'
                                                        : user.is_active
                                                        ? 'Nonaktifkan'
                                                        : 'Aktifkan'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Account Modal */}
            <CreateAccountModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => fetchUsers()}
            />

            {/* Edit Account Modal */}
            <EditAccountModal
                isOpen={!!selectedUserForEdit}
                user={selectedUserForEdit}
                onClose={() => setSelectedUserForEdit(null)}
                onSuccess={() => fetchUsers()}
            />
        </div>
    );
}
