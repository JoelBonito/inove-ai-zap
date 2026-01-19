import { useEffect } from 'react';
import { useUI } from '../hooks/useUI';

/**
 * Hook responsável por aplicar a classe 'dark' ao elemento HTML root
 * baseado na preferência do usuário ou do sistema.
 */
export function useThemeEffect() {
    const { theme } = useUI();

    useEffect(() => {
        const root = window.document.documentElement;

        // Remove classes anteriores para evitar conflitos
        root.classList.remove('light', 'dark');

        if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
                ? 'dark'
                : 'light';
            root.classList.add(systemTheme);
            return;
        }

        root.classList.add(theme);
    }, [theme]);
}
