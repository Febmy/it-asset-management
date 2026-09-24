'use client';

import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import CreateDepartmentModal from '@/components/modals/CreateDepartmentModal';
import EditDepartmentModal from '@/components/modals/EditDepartmentModal';

interface Department {
    id: number;
    name: string;
    code: string | null;
    description: string | null;
    created_at: string;
    members_count: string;
    account_holders_count: string;
    employees_count: string;
}

export default function DepartmentsPage() {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedDeptForEdit, setSelectedDeptForEdit] = useState<Department | null>(null);
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    const fetchDepartments = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/departments');
            const json = await res.json();
            if (json.success && Array.isArray(json.data)) {
                setDepartments(json.data);
            }
        } catch (error) {
            console.error('Error loading departments:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDepartments();
    }, []);

    const handleDelete = async (dept: Department) => {
        const memberCount = parseInt(dept.members_count, 10);
        if (memberCount > 0) {
            alert(
                `Divisi "${dept.name}" masih memiliki ${memberCount} anggota/akun. Pindahkan atau hapus anggota terkait terlebih dahulu sebelum menghapus divisi.`
            );
            return;
        }

        if (!confirm(`Apakah Anda yakin ingin menghapus divisi "${dept.name}"?`)) {
            return;
        }

        setActionLoading(dept.id);
        try {
            const res = await fetch(`/api/departments/${dept.id}`, {
                method: 'DELETE',
            });
            const data = await res.json();
            if (data.success) {
                fetchDepartments();
            } else {
                alert(data.message || 'Gagal menghapus divisi');
            }
        } catch (err) {
            console.error(err);
            alert('Terjadi kesalahan sistem');
        } finally {
            setActionLoading(null);
        }
    };

    const filteredDepartments = departments.filter((d) => {
        const matchesName = d.name.toLowerCase().includes(search.toLowerCase());
        const matchesCode = d.code?.toLowerCase().includes(search.toLowerCase()) || false;
        const matchesDesc = d.description?.toLowerCase().includes(search.toLowerCase()) || false;
        return matchesName || matchesCode || matchesDesc;
    });

    return (
        <div className="space-y-6 pb-12">
            {/* Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                        Struktur Organisasi & Divisi
                    </div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                        Data Divisi & Departemen Perusahaan
                    </h1>
                    <p className="text-xs text-slate-500">
                        Kelola master divisi perusahaan yang digunakan untuk pemetaan akun sistem, penyerahan unit kerja, dan pelaporan
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
                        Tambah Divisi Baru
                    </Button>
                </div>
            </div>

            {/* Quick Filter & Search */}
            <div className="flex items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80">
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
                        placeholder="Cari nama divisi, kode singkatan..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    />
                </div>

                <div className="text-xs text-slate-500 font-medium">
                    Total: <span className="font-bold text-slate-800">{departments.length} Divisi</span> Terdaftar
                </div>
            </div>

            {/* Departments Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                <th className="px-5 py-3.5">Kode</th>
                                <th className="px-5 py-3.5">Nama Divisi / Departemen</th>
                                <th className="px-5 py-3.5">Deskripsi / Peran</th>
                                <th className="px-5 py-3.5 text-center">Anggota Aktif</th>
                                <th className="px-5 py-3.5 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-10 text-center text-slate-400">
                                        <div className="inline-block animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full mb-2" />
                                        <p>Memuat data divisi...</p>
                                    </td>
                                </tr>
                            ) : filteredDepartments.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-12 text-center text-slate-400">
                                        <p className="font-medium text-slate-600">Belum ada divisi yang cocok</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredDepartments.map((dept) => {
                                    const totalMembers = parseInt(dept.members_count, 10) || 0;
                                    const totalEmployees = parseInt(dept.employees_count, 10) || 0;
                                    const totalAccounts = parseInt(dept.account_holders_count, 10) || 0;

                                    return (
                                        <tr
                                            key={dept.id}
                                            className="hover:bg-slate-50/80 transition-colors duration-150"
                                        >
                                            <td className="px-5 py-4">
                                                <span className="font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-md text-xs">
                                                    {dept.code || '-'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 font-bold text-slate-900">
                                                {dept.name}
                                            </td>
                                            <td className="px-5 py-4 text-slate-500 max-w-sm">
                                                {dept.description || '-'}
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                {totalMembers > 0 ? (
                                                    <div className="inline-flex flex-col items-center">
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                                            {totalMembers} Orang
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 mt-0.5">
                                                            {totalAccounts} Akun • {totalEmployees} Karyawan
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 text-[11px]">
                                                        0 Anggota
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        onClick={() => setSelectedDeptForEdit(dept)}
                                                        className="px-3 py-1 text-xs font-medium text-blue-600 border border-blue-200 hover:bg-blue-50 rounded-lg transition-colors"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(dept)}
                                                        disabled={actionLoading === dept.id}
                                                        className="px-2.5 py-1 text-xs font-medium text-rose-600 border border-rose-200 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                                                    >
                                                        {actionLoading === dept.id ? '...' : 'Hapus'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Department Modal */}
            <CreateDepartmentModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => fetchDepartments()}
            />

            {/* Edit Department Modal */}
            <EditDepartmentModal
                isOpen={!!selectedDeptForEdit}
                department={selectedDeptForEdit}
                onClose={() => setSelectedDeptForEdit(null)}
                onSuccess={() => fetchDepartments()}
            />
        </div>
    );
}
