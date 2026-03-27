'use client';

import React from 'react';
import { ModalOverlay } from './Modal';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: React.ReactNode;
    description: React.ReactNode;
    confirmText?: string;
    isDestructive?: boolean;
}

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Confirm',
    isDestructive = false,
}: ConfirmDialogProps) {
    return (
        <ModalOverlay isOpen={isOpen} maxWidth="max-w-md" className="p-10 animate-scale-in">
            <h3 className="text-2xl font-black mb-4 leading-tight">{title}</h3>
            <p className="opacity-70 text-lg mb-10 leading-relaxed font-medium">{description}</p>

            <div className="flex gap-4 justify-end shrink-0">
                <button
                    onClick={onClose}
                    className="px-8 py-3.5 text-sm font-bold text-secondary-text bg-secondary border border-gray-200/50 hover:bg-secondary-hover rounded-sm transition-all hover:scale-105 active:scale-95 shadow-sm"
                >
                    Cancel
                </button>
                <button
                    onClick={() => {
                        onConfirm();
                        onClose();
                    }}
                    className={`px-8 py-3.5 text-sm font-bold text-white rounded-sm transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 ${isDestructive
                        ? 'bg-red-600 hover:bg-red-700 shadow-red-500/30'
                        : 'bg-primary text-primary-text hover:bg-primary-hover shadow-[0_8px_16px_var(--shadow-color)]'
                        }`}
                >
                    {confirmText}
                </button>
            </div>
        </ModalOverlay>
    );
}
