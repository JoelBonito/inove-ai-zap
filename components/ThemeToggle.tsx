import React from 'react';
import { useUI } from '../hooks/useUI';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';

interface ThemeToggleProps {
    variant?: 'icon' | 'full';
}

export function ThemeToggle({ variant = 'icon' }: ThemeToggleProps) {
    const { theme, setTheme } = useUI();

    const currentIcon = theme === 'dark' ? 'dark_mode' : theme === 'light' ? 'light_mode' : 'settings_system_daydream';
    const currentLabel = theme === 'dark' ? 'Escuro' : theme === 'light' ? 'Claro' : 'Sistema';

    if (variant === 'full') {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        className="w-full flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Alterar Tema"
                        aria-label="Alternar tema"
                    >
                        <span className="material-symbols-outlined text-[20px]">
                            {currentIcon}
                        </span>
                        <span className="text-sm font-medium flex-1 text-left">Tema: {currentLabel}</span>
                        <span className="material-symbols-outlined text-[16px] text-slate-400">expand_more</span>
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                    <DropdownMenuItem onClick={() => setTheme('light')}>
                        <span className="material-symbols-outlined mr-2 text-sm">light_mode</span>
                        Claro
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme('dark')}>
                        <span className="material-symbols-outlined mr-2 text-sm">dark_mode</span>
                        Escuro
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme('system')}>
                        <span className="material-symbols-outlined mr-2 text-sm">settings_system_daydream</span>
                        Sistema
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    className="relative p-2 text-slate-400 hover:text-primary dark:hover:text-white transition-colors rounded-full hover:bg-slate-50 dark:hover:bg-slate-800"
                    title="Alterar Tema"
                    aria-label="Alternar tema"
                >
                    <span className="material-symbols-outlined text-[20px] transition-all rotate-0 scale-100 dark:-rotate-90 dark:scale-0">
                        light_mode
                    </span>
                    <span className="absolute top-2 left-2 material-symbols-outlined text-[20px] transition-all rotate-90 scale-0 dark:rotate-0 dark:scale-100">
                        dark_mode
                    </span>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme('light')}>
                    <span className="material-symbols-outlined mr-2 text-sm">light_mode</span>
                    Claro
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')}>
                    <span className="material-symbols-outlined mr-2 text-sm">dark_mode</span>
                    Escuro
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('system')}>
                    <span className="material-symbols-outlined mr-2 text-sm">settings_system_daydream</span>
                    Sistema
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
