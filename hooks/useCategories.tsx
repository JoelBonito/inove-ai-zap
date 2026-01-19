import { useState, useCallback, createContext, useContext, ReactNode, useEffect } from 'react';
import { Category, CategoryColor } from '../types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { collection, query, orderBy, addDoc, updateDoc, deleteDoc, doc, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './useAuth';

interface UseCategoriesReturn {
    categories: Category[];
    isLoading: boolean;
    error: string | null;
    // CRUD
    addCategory: (name: string, color?: CategoryColor) => Promise<Category>;
    updateCategory: (id: string, data: Partial<Pick<Category, 'name' | 'color'>>) => Promise<void>;
    deleteCategory: (id: string) => Promise<void>;
    // Helpers
    getCategoryById: (id: string) => Category | undefined;
    updateContactCount: (id: string, delta: number) => void;
}

// Cores disponíveis para categorias
export const CATEGORY_COLORS: { value: CategoryColor; label: string; class: string }[] = [
    { value: 'blue', label: 'Azul', class: 'bg-blue-500' },
    { value: 'emerald', label: 'Verde', class: 'bg-emerald-500' },
    { value: 'amber', label: 'Amarelo', class: 'bg-amber-500' },
    { value: 'purple', label: 'Roxo', class: 'bg-purple-500' },
    { value: 'red', label: 'Vermelho', class: 'bg-red-500' },
    { value: 'pink', label: 'Rosa', class: 'bg-pink-500' },
    { value: 'indigo', label: 'Índigo', class: 'bg-indigo-500' },
    { value: 'teal', label: 'Turquesa', class: 'bg-teal-500' },
    { value: 'slate', label: 'Cinza', class: 'bg-slate-500' },
];

/**
 * Hook para gerenciar categorias (tags) de contatos
 * 
 * Story 3.3 - CRUD de Categorias:
 * - Criar nova categoria com nome e cor
 * - Editar nome/cor de categoria existente
 * - Excluir categoria (contatos são desassociados, não deletados)
 * - Optimistic UI: mudanças refletem imediatamente
 */
export function useCategories(): UseCategoriesReturn {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const categoriesQuery = useQuery({
        queryKey: ['categories', user?.id],
        enabled: Boolean(user?.id),
        queryFn: async () => {
            if (!user?.id) return [];
            const q = query(collection(db, 'clients', user.id, 'categories'), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map((docSnapshot) => {
                const data = docSnapshot.data() as Category;
                const createdAt = (data.createdAt as unknown as { toDate?: () => Date } | undefined);
                const updatedAt = (data.updatedAt as unknown as { toDate?: () => Date } | undefined);
                return {
                    id: docSnapshot.id,
                    name: data.name,
                    color: data.color,
                    contactCount: data.contactCount ?? 0,
                    createdAt: createdAt?.toDate ? createdAt.toDate().toISOString() : (data.createdAt as string),
                    updatedAt: updatedAt?.toDate ? updatedAt.toDate().toISOString() : (data.updatedAt as string),
                };
            });
        },
        initialData: [],
    });

    useEffect(() => {
        if (!user?.id) return;
        const q = query(collection(db, 'clients', user.id, 'categories'), orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loadedCategories = snapshot.docs.map((docSnapshot) => {
                const data = docSnapshot.data() as Category;
                const createdAt = (data.createdAt as unknown as { toDate?: () => Date } | undefined);
                const updatedAt = (data.updatedAt as unknown as { toDate?: () => Date } | undefined);
                return {
                    id: docSnapshot.id,
                    name: data.name,
                    color: data.color,
                    contactCount: data.contactCount ?? 0,
                    createdAt: createdAt?.toDate ? createdAt.toDate().toISOString() : (data.createdAt as string),
                    updatedAt: updatedAt?.toDate ? updatedAt.toDate().toISOString() : (data.updatedAt as string),
                };
            });
            queryClient.setQueryData(['categories', user.id], loadedCategories);
        }, () => {
            setError('Erro ao carregar categorias.');
        });

        return () => unsubscribe();
    }, [queryClient, user?.id]);

    /**
     * Gera cor aleatória para nova categoria
     */
    const getRandomColor = (): CategoryColor => {
        const usedColors = new Set(categoriesQuery.data.map(c => c.color));
        const availableColors = CATEGORY_COLORS.filter(c => !usedColors.has(c.value));

        if (availableColors.length > 0) {
            return availableColors[Math.floor(Math.random() * availableColors.length)].value;
        }
        return CATEGORY_COLORS[Math.floor(Math.random() * CATEGORY_COLORS.length)].value;
    };

    /**
     * Cria nova categoria
     * Optimistic UI: adiciona imediatamente à lista
     */
    const addCategory = useCallback(async (name: string, color?: CategoryColor): Promise<Category> => {
        setIsLoading(true);
        setError(null);

        if (!user?.id) {
            setIsLoading(false);
            throw new Error('Usuário não autenticado');
        }

        // Validação
        const trimmedName = name.trim();
        if (!trimmedName) {
            setError('Nome da categoria é obrigatório');
            setIsLoading(false);
            throw new Error('Nome da categoria é obrigatório');
        }

        // Verifica duplicata
        if (categoriesQuery.data.some(c => c.name.toLowerCase() === trimmedName.toLowerCase())) {
            setError('Já existe uma categoria com este nome');
            setIsLoading(false);
            throw new Error('Já existe uma categoria com este nome');
        }

        const now = new Date().toISOString();
        const newCategory: Omit<Category, 'id'> = {
            name: trimmedName,
            color: color || getRandomColor(),
            contactCount: 0,
            createdAt: now,
            updatedAt: now,
        };

        const docRef = await addDoc(collection(db, 'clients', user.id, 'categories'), newCategory);
        setIsLoading(false);

        return {
            ...newCategory,
            id: docRef.id,
        };
    }, [categoriesQuery.data, user?.id]);

    /**
     * Atualiza categoria existente
     * Optimistic UI: atualiza imediatamente
     */
    const updateCategory = useCallback(async (id: string, data: Partial<Pick<Category, 'name' | 'color'>>) => {
        setIsLoading(true);
        setError(null);

        if (!user?.id) {
            setIsLoading(false);
            throw new Error('Usuário não autenticado');
        }

        // Validação de nome
        if (data.name !== undefined) {
            const trimmedName = data.name.trim();
            if (!trimmedName) {
                setError('Nome da categoria é obrigatório');
                setIsLoading(false);
                throw new Error('Nome da categoria é obrigatório');
            }

            // Verifica duplicata (excluindo a própria categoria)
            if (categoriesQuery.data.some(c => c.id !== id && c.name.toLowerCase() === trimmedName.toLowerCase())) {
                setError('Já existe uma categoria com este nome');
                setIsLoading(false);
                throw new Error('Já existe uma categoria com este nome');
            }

            data.name = trimmedName;
        }

        await updateDoc(doc(db, 'clients', user.id, 'categories', id), {
            ...data,
            updatedAt: new Date().toISOString(),
        });
        setIsLoading(false);
    }, [categoriesQuery.data, user?.id]);

    /**
     * Exclui categoria
     * Nota: Contatos são desassociados mas NÃO deletados (RF conforme epics.md)
     */
    const deleteCategory = useCallback(async (id: string) => {
        setIsLoading(true);
        setError(null);

        if (!user?.id) {
            setIsLoading(false);
            throw new Error('Usuário não autenticado');
        }

        const categoryToDelete = categoriesQuery.data.find(c => c.id === id);
        if (!categoryToDelete) {
            setError('Categoria não encontrada');
            setIsLoading(false);
            throw new Error('Categoria não encontrada');
        }

        await deleteDoc(doc(db, 'clients', user.id, 'categories', id));

        setIsLoading(false);
    }, [categoriesQuery.data, user?.id]);

    /**
     * Busca categoria por ID
     */
    const getCategoryById = useCallback((id: string): Category | undefined => {
        return categoriesQuery.data.find(c => c.id === id);
    }, [categoriesQuery.data]);

    /**
     * Atualiza contagem de contatos de uma categoria
     */
    const updateContactCount = useCallback((id: string, delta: number) => {
        queryClient.setQueryData<Category[]>(['categories', user?.id], (current) => {
            if (!current) return current;
            return current.map(cat =>
                cat.id === id
                    ? { ...cat, contactCount: Math.max(0, cat.contactCount + delta) }
                    : cat
            );
        });
    }, [queryClient, user?.id]);

    return {
        categories: categoriesQuery.data,
        isLoading: categoriesQuery.isLoading || isLoading,
        error,
        addCategory,
        updateCategory,
        deleteCategory,
        getCategoryById,
        updateContactCount,
    };
}

// Contexto para compartilhar estado globalmente
interface CategoriesContextType extends UseCategoriesReturn { }

const CategoriesContext = createContext<CategoriesContextType | null>(null);

interface CategoriesProviderProps {
    children: ReactNode;
}

export function CategoriesProvider({ children }: CategoriesProviderProps) {
    const categoriesState = useCategories();

    return (
        <CategoriesContext.Provider value={categoriesState}>
            {children}
        </CategoriesContext.Provider>
    );
}

export function useCategoriesContext(): CategoriesContextType {
    const context = useContext(CategoriesContext);
    if (!context) {
        throw new Error('useCategoriesContext deve ser usado dentro de CategoriesProvider');
    }
    return context;
}
