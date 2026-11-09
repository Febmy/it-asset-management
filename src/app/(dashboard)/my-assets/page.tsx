'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MyAssetsPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/dashboard');
    }, [router]);

    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <p className="text-sm text-slate-500">Mengarahkan ke Dashboard...</p>
        </div>
    );
}
