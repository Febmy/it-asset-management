'use client';

import React, { useEffect } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    children: React.ReactNode;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export default function Modal({
    isOpen,
    onClose,
    title,
    description,
    children,
    maxWidth = 'md',
}: ModalProps) {
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') onClose();
        }

        if (isOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleKeyDown);
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const maxWidthClass = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
    }[maxWidth];

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div
                className={`w-full ${maxWidthClass} bg-white rounded-2xl p-5 sm:p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-4">
                    <div>
                        <h3 className="font-bold text-slate-900 text-sm sm:text-base">{title}</h3>
                        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-700 text-xl leading-none p-1 rounded-lg hover:bg-slate-100 transition-colors"
                        aria-label="Tutup modal"
                    >
                        &times;
                    </button>
                </div>
                <div>{children}</div>
            </div>
        </div>
    );
}
