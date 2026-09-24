export default function Badge({ status }: { status: string }) {
    const config: Record<string, { bg: string; label: string }> = {
        in_stock: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'In Stock' },
        deployed: { bg: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Deployed' },
        repair: { bg: 'bg-amber-50 text-amber-700 border-amber-200', label: 'In Repair' },
        disposed: { bg: 'bg-rose-50 text-rose-700 border-rose-200', label: 'Disposed' },
    };

    const current = config[status] || {
        bg: 'bg-slate-50 text-slate-700 border-slate-200',
        label: status,
    };

    return (
        <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${current.bg}`}
        >
            {current.label}
        </span>
    );
}