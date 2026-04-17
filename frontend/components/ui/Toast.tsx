'use client';

import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
    onClose: (id: string) => void;
}

export function Toast({ id, message, type, duration = 2000, onClose }: ToastProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger enter animation
        requestAnimationFrame(() => setIsVisible(true));

        const timer = setTimeout(() => {
            setIsVisible(false);
            // Wait for exit animation to complete before removing
            setTimeout(() => onClose(id), 300);
        }, duration);

        return () => clearTimeout(timer);
    }, [id, duration, onClose]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => onClose(id), 200);
    };

    const icons = {
        success: <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-emerald-600" />,
        error: <XCircle className="w-5 h-5 md:w-6 md:h-6 text-red-600" />,
        info: <Info className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
    };

    const backgrounds = {
        success: 'bg-linear-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/50 dark:to-emerald-900/30 border-emerald-200 dark:border-emerald-700/50 text-emerald-900 dark:text-emerald-100',
        error: 'bg-linear-to-br from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/30 border-red-200 dark:border-red-700/50 text-red-900 dark:text-red-100',
        info: 'bg-linear-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/30 border-blue-200 dark:border-blue-700/50 text-blue-900 dark:text-blue-100'
    };

    return (
        <div
            className={`flex items-center z-999 gap-3 md:gap-4 p-3 md:p-4 mb-3 rounded-xl border shadow-2xl backdrop-blur-xl transition-all duration-500 pointer-events-auto max-w-sm w-full ${backgrounds[type]} ${isVisible ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-12 opacity-0 scale-95'
                }`}
        >
            <div className="shrink-0 p-2 bg-foreground/5 rounded-xl shadow-sm">{icons[type]}</div>
            <p className="font-semibold text-sm md:text-base flex-1 wrap-break-word">{message}</p>
            <button
                onClick={handleClose}
                className="shrink-0 p-1.5 hover:bg-foreground/10 rounded-xl transition-all active:scale-90"
                title="Dismiss"
            >
                <X className="w-4 h-4 md:w-5 md:h-5 opacity-60" />
            </button>
        </div>
    );
}
