'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ModalFormProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    onSubmit: (e: React.FormEvent) => void;
    submitText?: string;
    isSubmitting?: boolean;
    variant?: 'info' | 'danger' | 'warning' | 'success';
    showCancel?: boolean;
    maxWidth?: string;
}


export function ModalForm({
    isOpen,
    onClose,
    title,
    children,
    onSubmit,
    submitText = 'Save',
    isSubmitting = false,
    variant = 'info',
    showCancel = true,
    maxWidth = 'max-w-lg'
}: ModalFormProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen || !mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-md transition-all duration-300">
            <div className={`bg-card text-card-text backdrop-blur-2xl rounded-sm shadow-[0_30px_70px_rgba(0,0,0,0.2)] w-full ${maxWidth} mx-4 transform transition-all p-10 border border-white/50 animate-scale-in`}>
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-black tracking-tight uppercase">{title}</h2>
                    <button
                        onClick={onClose}
                        className="text-card-text/40 hover:text-card-text p-2 hover:bg-primary/10 rounded-sm transition-all active:scale-95"
                    >
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={onSubmit} className="space-y-6 text-gray-900">
                    <div className="max-h-[70vh] overflow-y-auto px-1 -mx-1 custom-scrollbar">
                        {children}
                    </div>

                    <div className="mt-10 pt-8 border-t border-gray-100 flex justify-end gap-4">
                        {showCancel && (
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-8 py-3.5 text-sm font-bold text-secondary-text bg-secondary border border-gray-200/50 hover:bg-secondary-hover rounded-sm transition-all hover:scale-105 active:scale-95 shadow-sm"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`px-10 py-3.5 text-sm font-bold text-white rounded-sm transition-all shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-3 ${variant === 'danger' ? 'bg-red-600 hover:bg-red-700 shadow-red-500/30' :
                                variant === 'warning' ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/30' :
                                    variant === 'success' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30' :
                                        'bg-primary text-primary-text shadow-[0_8px_16px_var(--shadow-color)]'
                                }`}
                        >

                            {isSubmitting && (
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            )}
                            {submitText}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
