'use client';

import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import CreateEmployeeModal from '@/components/modals/CreateEmployeeModal';
import EditEmployeeModal from '@/components/modals/EditEmployeeModal';

interface Employee {
    id: number;
    employee_id: string;
    name: string;
    email: string;
    department: string;
    role: string;
    is_active: boolean;
    created_at: string;
    active_assets_count: number;
    assigned_assets?: {
        id: number;
        asset_tag: string;
        brand: string;
        model: string;
        category_name: string;
        assigned_date: string;
    }[];
}

export default function EmployeesPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [deptFilter, setDeptFilter] = useState('all');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedEmpForEdit, setSelectedEmpForEdit] = useState<Employee | null>(null);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/employees');
            const json = await res.json();
            if (json.success) {
                setEmployees(json.data || []);
            }
        } catch (error) {
            console.error('Error fetching employees:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    const filteredEmployees = employees.filter((emp) => {
        const matchesSearch =
            emp.name.toLowerCase().includes(search.toLowerCase()) ||
            emp.email.toLowerCase().includes(search.toLowerCase()) ||
            emp.employee_id.toLowerCase().includes(search.toLowerCase());

        const matchesDept = deptFilter === 'all' || emp.department === deptFilter;

        return matchesSearch && matchesDept;
    });

    const uniqueDepts = Array.from(
        new Set(employees.map((e) => e.department).filter(Boolean))
    );

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Master Data Karyawan
                    </div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                        Data Karyawan & Divisi
                    </h1>
                    <p className="text-xs text-slate-500">
                        Direktori seluruh staf & karyawan perusahaan sebagai penerima perangkat dan penanggung jawab BAST
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
                                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                            />
                        </svg>
                        Registrasi Karyawan Baru
                    </Button>
                </div>
            </div>

            {/* Notice Callout */}
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex items-center gap-3 text-xs text-amber-900">
                <svg className="w-5 h-5 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
                <div>
                    <span className="font-semibold text-amber-950">Catatan Kebijakan Akses:</span> Seluruh karyawan di halaman ini terdaftar murni sebagai database penerima aset kantor. Karyawan <span className="font-semibold underline">tidak memiliki akun login</span>. Untuk pendaftaran akun pengelola atau pimpinan, gunakan menu <span className="font-semibold">Pendaftaran Akun</span>.
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
                        placeholder="Cari nama, email, NIK karyawan..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <label className="text-xs text-slate-500 font-medium whitespace-nowrap">
                        Divisi:
                    </label>
                    <select
                        value={deptFilter}
                        onChange={(e) => setDeptFilter(e.target.value)}
                        className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    >
                        <option value="all">Semua Divisi</option>
                        {uniqueDepts.map((d) => (
                            <option key={d} value={d}>
                                {d}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                <th className="px-5 py-3.5">ID / NIK</th>
                                <th className="px-5 py-3.5">Nama Karyawan</th>
                                <th className="px-5 py-3.5">Email Kantor</th>
                                <th className="px-5 py-3.5">Divisi / Departemen</th>
                                <th className="px-5 py-3.5">Unit Yang Dipegang</th>
                                <th className="px-5 py-3.5">Status Akun</th>
                                <th className="px-5 py-3.5 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                                        <div className="inline-block animate-spin w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full mb-2" />
                                        <p>Memuat data karyawan...</p>
                                    </td>
                                </tr>
                            ) : filteredEmployees.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                                        <p className="font-medium text-slate-600">
                                            Belum ada data karyawan terdaftar
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filteredEmployees.map((emp) => (
                                    <tr
                                        key={emp.id}
                                        className="hover:bg-slate-50/80 transition-colors duration-150"
                                    >
                                        <td className="px-5 py-4 font-mono font-medium text-slate-900">
                                            {emp.employee_id}
                                        </td>
                                        <td className="px-5 py-4 font-semibold text-slate-900">
                                            {emp.name}
                                        </td>
                                        <td className="px-5 py-4 text-slate-500">{emp.email}</td>
                                        <td className="px-5 py-4">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
                                                {emp.department}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            {emp.active_assets_count > 0 ? (
                                                <div className="flex items-center gap-1.5">
                                                    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                                        {emp.active_assets_count} Unit Aktif
                                                    </span>
                                                    {emp.assigned_assets && emp.assigned_assets.length > 0 && (
                                                        <span className="text-[11px] text-slate-400">
                                                            ({emp.assigned_assets.map(a => a.asset_tag).join(', ')})
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 text-[11px]">
                                                    Tidak memegang unit
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600">
                                                Master Pegawai (No Login)
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <button
                                                onClick={() => setSelectedEmpForEdit(emp)}
                                                className="px-3 py-1 rounded-lg text-xs font-medium text-emerald-700 border border-emerald-200 hover:bg-emerald-50 transition-colors"
                                            >
                                                Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Employee Modal */}
            <CreateEmployeeModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => fetchEmployees()}
            />

            {/* Edit Employee Modal */}
            <EditEmployeeModal
                isOpen={!!selectedEmpForEdit}
                employee={selectedEmpForEdit}
                onClose={() => setSelectedEmpForEdit(null)}
                onSuccess={() => fetchEmployees()}
            />
        </div>
    );
}
