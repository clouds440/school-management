'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: ReactNode;
    subtitle?: ReactNode;
    children: ReactNode;
    maxWidth?: string;
    /** If true, the modal won't render the default header, allowing custom headers to be passed as children instead */
    customHeader?: ReactNode;
    className?: string; // For the inner modal card
}

export function ModalOverlay({
    isOpen,
    children,
    maxWidth = 'max-w-4xl',
    className = ''
}: {
    isOpen: boolean;
    children: ReactNode;
    maxWidth?: string;
    className?: string;
}) {
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 backdrop-blur-[2px] transition-all duration-300 p-3">
            <div className={`bg-card text-card-text backdrop-blur-2xl rounded-sm shadow-[0_30px_70px_rgba(0,0,0,0.2)] w-full ${maxWidth} transform transition-all border border-white/50 animate-scale-in flex flex-col max-h-[90vh] overflow-hidden ${className}`}>
                {children}
            </div>
        </div>,
        document.body
    );
}

export function Modal({
    isOpen,
    onClose,
    title,
    subtitle,
    children,
    maxWidth = 'max-w-4xl',
    customHeader,
    className = ''
}: ModalProps) {
    return (
        <ModalOverlay isOpen={isOpen} maxWidth={maxWidth} className={className}>
            {customHeader !== undefined ? (
                customHeader
            ) : (
                title && (
                    <div className="flex justify-between items-start p-4 pb-2 shrink-0">
                        <div>
                            {typeof title === 'string' ? <h2 className="text-3xl md:text-4xl font-black italic tracking-tighter uppercase leading-none">{title}</h2> : title}
                            {subtitle && <p className="text-xs font-bold text-card-text/40 mt-2 uppercase tracking-widest">{subtitle}</p>}
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-card-text/40 hover:text-red-500 hover:bg-white/5 p-2 rounded-sm transition-all active:scale-95 shrink-0"
                        >
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )
            )}

            <div className="overflow-y-auto px-8 pb-8 custom-scrollbar flex-1 relative">
                {children}
            </div>
        </ModalOverlay>
    );
}
