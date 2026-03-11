'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

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
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md transition-opacity duration-300">
            <div className="bg-card text-card-text backdrop-blur-xl rounded-sm shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] p-10 w-full max-w-md mx-4 transform animate-scale-in border border-white">
                <h3 className="text-2xl font-black mb-4 leading-tight">{title}</h3>
                <p className="opacity-70 text-lg mb-10 leading-relaxed font-medium">{description}</p>

                <div className="flex gap-4 justify-end">
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
            </div>
        </div>,
        document.body
    );
}
