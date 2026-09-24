'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface TopNavbarProps {
    onMenuToggle?: () => void;
}

interface CurrentUser {
    id: number;
    name: string;
    email: string;
    employee_id: string;
    department: string | null;
    role: string;
}

export default function TopNavbar({ onMenuToggle }: TopNavbarProps) {
    const router = useRouter();
    const [user, setUser] = useState<CurrentUser | null>(null);

    useEffect(() => {
        // Ambil info session saat ini
        fetch('/api/auth/me')
            .then((res) => res.json())
            .then((res) => {
                if (res.success && res.data) {
                    setUser(res.data);
                }
            })
            .catch(() => {});
    }, []);

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.href = '/login';
        } catch {
            window.location.href = '/login';
        }
    };

    const roleBadge = (role?: string) => {
        switch (role) {
            case 'director':
                return (
                    <span className="bg-purple-100 text-purple-800 border border-purple-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                        Direktur
                    </span>
                );
            case 'it_asset_manager':
                return (
                    <span className="bg-blue-100 text-blue-800 border border-blue-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                        IT Asset Manager
                    </span>
                );
            case 'head_it':
                return (
                    <span className="bg-indigo-100 text-indigo-800 border border-indigo-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                        Head of IT
                    </span>
                );
            case 'finance':
                return (
                    <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                        Finance
                    </span>
                );
            case 'lead_it_gov':
                return (
                    <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                        Lead IT Gov
                    </span>
                );
            case 'super_admin':
                return (
                    <span className="bg-slate-800 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                        Admin IT
                    </span>
                );
            case 'it_technician':
                return (
                    <span className="bg-sky-100 text-sky-700 border border-sky-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                        Teknisi
                    </span>
                );
            default:
                return (
                    <span className="bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {role || 'Pengguna'}
                    </span>
                );
        }
    };

    return (
        <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between shadow-xs">
            {/* Left: Mobile Toggle & Title */}
            <div className="flex items-center gap-3">
                <button
                    onClick={onMenuToggle}
                    className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 focus:outline-none"
                    aria-label="Toggle Menu"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
                <div>
                    <h2 className="text-sm font-bold text-slate-900 hidden sm:block">
                        Sistem Inventaris & Penyerahan Aset
                    </h2>
                    <span className="text-[11px] text-slate-400 hidden sm:block">
                        IT Operations Management
                    </span>
                </div>
            </div>

            {/* Right: Quick Action & User Pill */}
            <div className="flex items-center gap-2 sm:gap-3">
                <Link
                    href="/scan"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                >
                    <span>📷</span>
                    <span className="hidden sm:inline">Scan QR</span>
                </Link>

                {/* User Info */}
                <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                    <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 text-blue-700 font-bold text-xs flex items-center justify-center">
                        {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="hidden md:block text-left">
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-slate-800 leading-tight">
                                {user?.name || 'Pengguna IT'}
                            </span>
                            {roleBadge(user?.role)}
                        </div>
                        <span className="text-[10px] text-slate-400 block">
                            {user?.department || user?.employee_id || 'IT Department'}
                        </span>
                    </div>

                    <button
                        onClick={handleLogout}
                        title="Keluar / Logout"
                        className="ml-1 p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </button>
                </div>
            </div>
        </header>
    );
}
