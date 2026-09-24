'use client';

import React from 'react';

interface Column<T> {
    header: string;
    accessor?: keyof T | ((item: T) => React.ReactNode);
    className?: string;
    align?: 'left' | 'center' | 'right';
}

interface TableProps<T> {
    columns: Column<T>[];
    data: T[];
    keyExtractor: (item: T) => string | number;
    isLoading?: boolean;
    emptyMessage?: string;
}

export default function Table<T>({
    columns,
    data,
    keyExtractor,
    isLoading = false,
    emptyMessage = 'Tidak ada data ditemukan.',
}: TableProps<T>) {
    return (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                        <tr>
                            {columns.map((col, idx) => (
                                <th
                                    key={idx}
                                    className={`py-3.5 px-4 ${
                                        col.align === 'center'
                                            ? 'text-center'
                                            : col.align === 'right'
                                            ? 'text-right'
                                            : 'text-left'
                                    } ${col.className || ''}`}
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                        {isLoading ? (
                            <tr>
                                <td colSpan={columns.length} className="py-8 text-center text-slate-400">
                                    Memuat data...
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="py-8 text-center text-slate-400 italic">
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            data.map((item) => (
                                <tr
                                    key={keyExtractor(item)}
                                    className="hover:bg-slate-50/75 transition-colors"
                                >
                                    {columns.map((col, cIdx) => (
                                        <td
                                            key={cIdx}
                                            className={`py-3.5 px-4 ${
                                                col.align === 'center'
                                                    ? 'text-center'
                                                    : col.align === 'right'
                                                    ? 'text-right'
                                                    : 'text-left'
                                            } ${col.className || ''}`}
                                        >
                                            {typeof col.accessor === 'function'
                                                ? col.accessor(item)
                                                : col.accessor
                                                ? (item[col.accessor] as React.ReactNode)
                                                : null}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
