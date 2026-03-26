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
    showSubmit?: boolean;
    maxWidth?: string;
    feedback?: ReactNode;
}


import { ModalOverlay } from './Modal';

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
    showSubmit = true,
    maxWidth = 'max-w-lg',
    feedback
}: ModalFormProps) {
    return (
        <ModalOverlay isOpen={isOpen} maxWidth={maxWidth} className="p-5 animate-scale-in">
            <div className="flex justify-between items-center border-b border-gray-100 mb-4 pb-2 shrink-0 text-gray-900">
                <h2 className="text-xl font-black tracking-tight uppercase">{title}</h2>
                <button
                    type="button"
                    onClick={onClose}
                    className="text-card-text/40 hover:text-red-600 p-2 hover:bg-red-50 rounded-sm transition-all active:scale-95"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {feedback && (
                <div className="mb-4 shrink-0">
                    {feedback}
                </div>
            )}

            <form onSubmit={onSubmit} className="flex flex-col flex-1 overflow-hidden text-gray-900">
                <div className="overflow-y-auto px-4 -mx-4 custom-scrollbar [scrollbar-gutter:stable]">
                    {children}
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end gap-3 shrink-0">
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
                    {showSubmit && (
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
                    )}
                </div>
            </form>
        </ModalOverlay>
    );
}
