'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import TopNavbar from '@/components/layout/TopNavbar';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main Area */}
            <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
                <TopNavbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
                <main className="flex-1 p-4 sm:p-6 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
