'use client';

import React from 'react';
import { ModalOverlay } from './Modal';
import { Button } from './Button';

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
                <Button
                    variant="secondary"
                    onClick={onClose}
                    className="px-8 py-3.5 text-sm font-bold shadow-sm"
                >
                    Cancel
                </Button>
                <Button
                    variant={isDestructive ? 'danger' : 'primary'}
                    onClick={() => {
                        onConfirm();
                        onClose();
                    }}
                    className={`px-8 py-3.5 text-sm font-bold border-none ${!isDestructive ? 'shadow-[0_8px_16px_var(--shadow-color)]' : 'shadow-red-500/30'}`}
                >
                    {confirmText}
                </Button>
            </div>
        </ModalOverlay>
    );
}
