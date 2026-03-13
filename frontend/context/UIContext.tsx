import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export interface DataField {
    label: string;
    value: React.ReactNode;
    icon?: React.ElementType;
    fullWidth?: boolean;
}

interface ModalConfig {
    isOpen: boolean;
    title: string;
    subtitle?: string;
    fields: DataField[];
    actions?: React.ReactNode;
}

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
    const [isExpanded, setIsExpanded] = useState(true);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState<ModalConfig>({
        isOpen: false,
        title: '',
        fields: []
    });
    const pathname = usePathname();

    useEffect(() => {
        setIsMobileOpen(false);
    }, [pathname]);

    const toggleSidebar = () => setIsExpanded(!isExpanded);
    const toggleMobileSidebar = () => setIsMobileOpen(!isMobileOpen);
    
    const openViewModal = (config: Omit<ModalConfig, 'isOpen'>) => {
        setModalConfig({ ...config, isOpen: true });
    };

    const closeViewModal = () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
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
    if (context === undefined) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
}
