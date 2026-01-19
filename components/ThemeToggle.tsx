import React from 'react';
import { useUI } from '../hooks/useUI';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';

export function ThemeToggle() {
    const { theme, setTheme } = useUI();

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
