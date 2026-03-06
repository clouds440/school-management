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
            setTimeout(() => onClose(id), 300);
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
        success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
        error: 'bg-red-50 border-red-200 text-red-800',
        info: 'bg-blue-50 border-blue-200 text-blue-800'
    };

    return (
        <div
            className={`flex items-center gap-3 p-4 mb-3 rounded-xl border shadow-lg transition-all duration-300 pointer-events-auto max-w-sm w-full backdrop-blur-md ${backgrounds[type]} ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
                }`}
        >
            <div className="shrink-0">{icons[type]}</div>
            <p className="font-semibold text-sm flex-1 break-words">{message}</p>
            <button
                onClick={handleClose}
                className="shrink-0 p-1 hover:bg-black/5 rounded-lg transition-colors"
                title="Dismiss"
            >
                <X className="w-4 h-4 opacity-70" />
            </button>
        </div>
    );
}
