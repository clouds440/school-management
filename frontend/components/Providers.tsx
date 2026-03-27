'use client';

import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { UIProvider } from "@/context/UIContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { GlobalProvider } from "@/context/GlobalContext";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <GlobalProvider>
            <ToastProvider>
                <AuthProvider>
                    <ThemeProvider>
                        <UIProvider>
                            {children}
                        </UIProvider>
                    </ThemeProvider>
                </AuthProvider>
            </ToastProvider>
        </GlobalProvider>
    );
}
