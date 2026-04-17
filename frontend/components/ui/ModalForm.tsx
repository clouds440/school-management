'use client';

import React, { ReactNode } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

interface ModalFormProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    onSubmit: (e: React.FormEvent) => void;
    submitText?: string;
    isSubmitting?: boolean;
    loadingId?: string;
    variant?: 'info' | 'danger' | 'warning' | 'success';
    showCancel?: boolean;
    showSubmit?: boolean;
    maxWidth?: string;
    feedback?: ReactNode;
}

export function ModalForm({
    isOpen,
    onClose,
    title,
    children,
    onSubmit,
    submitText = 'Save',
    isSubmitting = false,
    loadingId,
    variant = 'info',
    showCancel = true,
    showSubmit = true,
    maxWidth = 'max-w-lg',
    feedback
}: ModalFormProps) {
    const footer = (showCancel || showSubmit) ? (
        <div className="flex justify-end gap-3 sm:gap-4 flex-col-reverse sm:flex-row">
            {showCancel && (
                <Button
                    type="button"
                    variant="secondary"
                    onClick={onClose}
                    className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 text-xs sm:text-sm font-semibold uppercase tracking-wider"
                >
                    Cancel
                </Button>
            )}
            {showSubmit && (
                <Button
                    type="submit"
                    form="modal-form"
                    isLoading={isSubmitting}
                    loadingId={loadingId}
                    className={`w-full sm:w-auto px-6 sm:px-10 py-3 sm:py-3.5 text-xs sm:text-sm font-semibold uppercase tracking-wider text-primary-foreground border-none shadow-lg hover:scale-105 active:scale-95 ${
                        variant === 'danger' ? 'bg-destructive hover:bg-destructive/90 shadow-destructive/20' :
                        variant === 'warning' ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20' :
                        variant === 'success' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20' :
                        'bg-primary hover:bg-primary/90 shadow-primary/20'
                    }`}
                >
                    {submitText}
                </Button>
            )}
        </div>
    ) : undefined;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            maxWidth={maxWidth}
            className="animate-scale-in"
            footer={footer}
        >
            <div className="flex flex-col h-full">
                {feedback && (
                    <div className="mb-3 sm:mb-4 shrink-0">
                        {feedback}
                    </div>
                )}

                <form id="modal-form" onSubmit={onSubmit} className="text-foreground">
                    {children}
                </form>
            </div>
        </Modal>
    );
}
