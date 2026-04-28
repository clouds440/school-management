'use client';

import { AuthProvider } from "@/context/AuthContext";
import { UIProvider } from "@/context/UIContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { GlobalProvider } from "@/context/GlobalContext";
import { SWRProvider } from "@/components/providers/SWRProvider";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <GlobalProvider>
            <AuthProvider>
                <SWRProvider>
                    <ThemeProvider>
                        <UIProvider>
                            {children}
                        </UIProvider>
                    </ThemeProvider>
                </SWRProvider>
            </AuthProvider>
        </GlobalProvider>
    );
}
