'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!identifier.trim()) {
            setErrorMessage('Masukkan email atau ID karyawan');
            return;
        }

        if (!password) {
            setErrorMessage('Masukkan password akun Anda');
            return;
        }

        setLoading(true);
        setErrorMessage('');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    identifier: identifier.trim(),
                    password: password,
                }),
            });

            const data = await res.json();

            if (data.success) {
                window.location.href = '/dashboard';
            } else {
                setErrorMessage(data.message || 'Login gagal, periksa email/ID dan password Anda');
            }
        } catch {
            setErrorMessage('Gagal menghubungi server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 sm:p-6">
            <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
                {/* Brand */}
                <div className="text-center space-y-1.5">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-xl mx-auto shadow-md">
                        IT
                    </div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                        IT Asset Management Portal
                    </h1>
                    <p className="text-xs text-slate-500">
                        Masuk dengan akun terdaftar untuk mengakses sistem
                    </p>
                </div>

                {errorMessage && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                        {errorMessage}
                    </div>
                )}

                {/* Form Input */}
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Email atau Employee ID
                        </label>
                        <input
                            type="text"
                            required
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            placeholder="admin.it@company.com atau EMP-0001"
                            className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-xs font-semibold text-slate-700">
                                Password
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="text-[11px] text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                            >
                                {showPassword ? 'Sembunyikan' : 'Tampilkan'}
                            </button>
                        </div>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Masukkan password Anda"
                                className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md transition-all disabled:opacity-50 cursor-pointer"
                    >
                        {loading ? 'Memverifikasi...' : 'Masuk ke Sistem'}
                    </button>
                </form>

                {/* Footer */}
                <div className="pt-2 border-t border-slate-100 text-center">
                    <p className="text-[11px] text-slate-400">
                        Sistem Inventaris Operasional IT Enterprise v1.0
                    </p>
                </div>
            </div>
        </div>
    );
}
