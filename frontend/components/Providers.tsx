'use client';

import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { UIProvider } from "@/context/UIContext";
import { ThemeProvider } from "@/context/ThemeContext";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ToastProvider>
            <AuthProvider>
                <ThemeProvider>
                    <UIProvider>
                        {children}
                    </UIProvider>
                </ThemeProvider>
            </AuthProvider>
        </ToastProvider>
    );
}
