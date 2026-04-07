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

export function Toast({ id, message, type, duration = 3000, onClose }: ToastProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger enter animation
        requestAnimationFrame(() => setIsVisible(true));

        const timer = setTimeout(() => {
            setIsVisible(false);
            // Wait for exit animation to complete before removing
            setTimeout(() => onClose(id), 400);
        }, duration);

        return () => clearTimeout(timer);
    }, [id, duration, onClose]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => onClose(id), 300);
    };

    const icons = {
        success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
        error: <XCircle className="w-5 h-5 text-red-500" />,
        info: <Info className="w-5 h-5 text-blue-500" />
    };

    const backgrounds = {
        success: 'bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
        error: 'bg-red-500/10 dark:bg-red-500/20 border-red-500/20 text-red-600 dark:text-red-400',
        info: 'bg-blue-500/10 dark:bg-blue-500/20 border-blue-500/20 text-blue-600 dark:text-blue-400'
    };

    return (
        <div
            className={`flex items-center gap-4 p-4 mb-3 rounded-sm border shadow-2xl transition-all duration-500 pointer-events-auto max-w-sm w-full backdrop-blur-xl ${backgrounds[type]} ${isVisible ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-12 opacity-0 scale-95'
                }`}
        >
            <div className="shrink-0 p-2 bg-foreground/5 rounded-sm shadow-sm">{icons[type]}</div>
            <p className="font-bold text-sm flex-1 wrap-break-word">{message}</p>
            <button
                onClick={handleClose}
                className="shrink-0 p-1.5 hover:bg-foreground/5 rounded-sm transition-all active:scale-90"
                title="Dismiss"
            >
                <X className="w-4 h-4 opacity-60" />
            </button>
        </div>
    );
}
