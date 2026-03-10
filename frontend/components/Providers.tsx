'use client';

import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { UIProvider } from '@/context/UIContext';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ToastProvider>
            <UIProvider>
                <AuthProvider>{children}</AuthProvider>
            </UIProvider>
        </ToastProvider>
    );
}
