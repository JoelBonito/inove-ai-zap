import React, { createContext, useContext, useState, ReactNode } from 'react';

/**
 * Interface para os estados de UI globais
 */
interface UIContextType {
    // Modais
    isNewCampaignModalOpen: boolean;
    setIsNewCampaignModalOpen: (open: boolean) => void;

    isNewContactModalOpen: boolean;
    setIsNewContactModalOpen: (open: boolean) => void;

    isImportContactsModalOpen: boolean;
    setIsImportContactsModalOpen: (open: boolean) => void;

    isCategoryModalOpen: boolean;
    setIsCategoryModalOpen: (open: boolean) => void;

    // Sidebar
    isSidebarCollapsed: boolean;
    setIsSidebarCollapsed: (collapsed: boolean) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

/**
 * Provider para o estado de UI global
 */
export function UIProvider({ children }: { children: ReactNode }) {
    const [isNewCampaignModalOpen, setIsNewCampaignModalOpen] = useState(false);
    const [isNewContactModalOpen, setIsNewContactModalOpen] = useState(false);
    const [isImportContactsModalOpen, setIsImportContactsModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const value = {
        isNewCampaignModalOpen,
        setIsNewCampaignModalOpen,
        isNewContactModalOpen,
        setIsNewContactModalOpen,
        isImportContactsModalOpen,
        setIsImportContactsModalOpen,
        isCategoryModalOpen,
        setIsCategoryModalOpen,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
    };

    return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

/**
 * Hook para acessar o contexto de UI
 */
export function useUI() {
    const context = useContext(UIContext);
    if (context === undefined) {
        throw new Error('useUI deve ser usado dentro de um UIProvider');
    }
    return context;
}
