import { create } from 'zustand';

/**
 * Interface para os estados de UI globais
 */
interface UIState {
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

    // Mobile
    isMobileNavOpen: boolean;
    setIsMobileNavOpen: (open: boolean) => void;

    // Theme - Arquitetura Dark Mode
    theme: 'light' | 'dark' | 'system';
    setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

/**
 * Store global de UI (Zustand)
 */
export const useUI = create<UIState>((set) => ({
    isNewCampaignModalOpen: false,
    setIsNewCampaignModalOpen: (open) => set({ isNewCampaignModalOpen: open }),
    isNewContactModalOpen: false,
    setIsNewContactModalOpen: (open) => set({ isNewContactModalOpen: open }),
    isImportContactsModalOpen: false,
    setIsImportContactsModalOpen: (open) => set({ isImportContactsModalOpen: open }),
    isCategoryModalOpen: false,
    setIsCategoryModalOpen: (open) => set({ isCategoryModalOpen: open }),
    isSidebarCollapsed: false,
    setIsSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
    isMobileNavOpen: false,
    setIsMobileNavOpen: (open) => set({ isMobileNavOpen: open }),

    // Inicialização do Tema
    theme: (localStorage.getItem('inove-theme') as 'light' | 'dark' | 'system') || 'system',
    setTheme: (theme) => {
        localStorage.setItem('inove-theme', theme);
        set({ theme });
    },
}));
