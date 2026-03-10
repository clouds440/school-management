'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface UIContextType {
    isExpanded: boolean;
    isMobileOpen: boolean;
    toggleSidebar: () => void;
    toggleMobileSidebar: () => void;
    setIsMobileOpen: (open: boolean) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: React.ReactNode }) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const pathname = usePathname();

    // Close mobile sidebar on navigation
    useEffect(() => {
        setIsMobileOpen(false);
    }, [pathname]);

    const toggleSidebar = () => setIsExpanded(!isExpanded);
    const toggleMobileSidebar = () => setIsMobileOpen(!isMobileOpen);

    return (
        <UIContext.Provider value={{
            isExpanded,
            isMobileOpen,
            toggleSidebar,
            toggleMobileSidebar,
            setIsMobileOpen
        }}>
            {children}
        </UIContext.Provider>
    );
}

export function useUI() {
    const context = useContext(UIContext);
    if (context === undefined) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
}
