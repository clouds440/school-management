'use client';

import React, { createContext, useContext, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useGlobal, ModalConfig, DataField } from './GlobalContext';

export type { DataField };

interface UIContextType {
    isExpanded: boolean;
    isMobileOpen: boolean;
    toggleSidebar: () => void;
    toggleMobileSidebar: () => void;
    setIsMobileOpen: (open: boolean) => void;
    modalConfig: ModalConfig;
    openViewModal: (config: Omit<ModalConfig, 'isOpen'>) => void;
    closeViewModal: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: React.ReactNode }) {
    const { state, dispatch } = useGlobal();
    const { isSidebarExpanded: isExpanded, isMobileSidebarOpen: isMobileOpen, viewModal: modalConfig } = state.ui;
    
    const pathname = usePathname();

    // Handle route change reset
    React.useEffect(() => {
        dispatch({ type: 'UI_SET_MOBILE_SIDEBAR', payload: false });
    }, [pathname, dispatch]);

    const toggleSidebar = () => dispatch({ type: 'UI_TOGGLE_SIDEBAR' });
    const toggleMobileSidebar = () => dispatch({ type: 'UI_SET_MOBILE_SIDEBAR', payload: !isMobileOpen });
    const setIsMobileOpen = (open: boolean) => dispatch({ type: 'UI_SET_MOBILE_SIDEBAR', payload: open });

    const openViewModal = (config: Omit<ModalConfig, 'isOpen'>) => {
        dispatch({ type: 'UI_OPEN_VIEW_MODAL', payload: config });
    };

    const closeViewModal = () => {
        dispatch({ type: 'UI_CLOSE_VIEW_MODAL' });
    };

    return (
        <UIContext.Provider value={{
            isExpanded,
            isMobileOpen,
            toggleSidebar,
            toggleMobileSidebar,
            setIsMobileOpen,
            modalConfig,
            openViewModal,
            closeViewModal
        }}>
            {children}
        </UIContext.Provider>
    );
}

export function useUI() {
    const context = useContext(UIContext);
    if (!context) throw new Error('useUI must be used within a UIProvider');
    return context;
}
