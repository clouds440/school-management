'use client';

import { createContext, useContext, useCallback, ReactNode } from 'react';
import { Toast, ToastType } from '@/components/ui/Toast';
import { useGlobal } from './GlobalContext';

interface ToastOptions {
    duration?: number;
}

interface ToastContextType {
    showToast: (message: string, type: ToastType, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const { state, dispatch } = useGlobal();
    const toasts = state.toasts;

    const showToast = useCallback((message: string, type: ToastType, options?: ToastOptions) => {
        dispatch({ type: 'TOAST_ADD', payload: { message, type, ...options } });
    }, [dispatch]);

    const removeToast = useCallback((id: string) => {
        dispatch({ type: 'TOAST_REMOVE', payload: id });
    }, [dispatch]);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {/* Toast Container */}
            <div className="fixed bottom-6 right-6 z-100 flex flex-col items-end pointer-events-none space-y-3">
                {toasts.map(toast => (
                    <Toast
                        key={toast.id}
                        id={toast.id}
                        message={toast.message}
                        type={toast.type}
                        duration={toast.duration}
                        onClose={removeToast}
                    />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within a ToastProvider');
    return context;
}
