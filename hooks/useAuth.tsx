import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, UserRole } from '../types';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    isAdmin: boolean;
    isOwner: boolean;
    isSecretary: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Provider de Autenticação
 * Mock para desenvolvimento - será substituído por Firebase Auth em produção
 */
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Mock: Simula verificação de sessão ao carregar
    useEffect(() => {
        const storedUser = localStorage.getItem('inove_user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch {
                localStorage.removeItem('inove_user');
            }
        }
        setIsLoading(false);
    }, []);

    // Mock: Login simulado
    const login = async (email: string, _password: string) => {
        setIsLoading(true);

        // Simula delay de rede
        await new Promise(resolve => setTimeout(resolve, 800));

        // Mock: Define role baseado no email para testes
        let role: UserRole = 'owner';
        if (email.includes('admin') || email.includes('joel')) {
            role = 'admin';
        } else if (email.includes('secretary') || email.includes('secretaria')) {
            role = 'secretary';
        }

        const mockUser: User = {
            id: 'usr_' + Date.now(),
            email,
            displayName: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            role,
            clientId: role === 'admin' ? undefined : 'client_default',
            createdAt: new Date().toISOString(),
        };

        setUser(mockUser);
        localStorage.setItem('inove_user', JSON.stringify(mockUser));
        setIsLoading(false);
    };

    const logout = async () => {
        setUser(null);
        localStorage.removeItem('inove_user');
    };

    // Helpers de permissão
    const isAuthenticated = user !== null;
    const isAdmin = user?.role === 'admin';
    const isOwner = user?.role === 'owner' || isAdmin;
    const isSecretary = user?.role === 'secretary';

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated,
                isAdmin,
                isOwner,
                isSecretary,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth deve ser usado dentro de um AuthProvider');
    }
    return context;
}
