import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { GoogleAuthProvider, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { User, UserRole } from '../types';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    error: string | null;
    isAdmin: boolean;
    isOwner: boolean;
    isSecretary: boolean;
    login: (email: string, password: string) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
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
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                const role: UserRole = 'owner';
                setUser({
                    id: firebaseUser.uid,
                    email: firebaseUser.email || '',
                    displayName: firebaseUser.displayName || 'Usuario',
                    role,
                    clientId: firebaseUser.uid,
                    avatarUrl: firebaseUser.photoURL || undefined,
                    createdAt: new Date().toISOString(),
                });
            } else {
                setUser(null);
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        setError(null);

        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            setError('Falha ao entrar. Verifique suas credenciais.');
        } finally {
            setIsLoading(false);
        }
    };

    const loginWithGoogle = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
        } catch (err) {
            setError('Falha ao entrar com Google.');
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await signOut(auth);
        } finally {
            setIsLoading(false);
        }
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
                error,
                isAdmin,
                isOwner,
                isSecretary,
                login,
                loginWithGoogle,
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
