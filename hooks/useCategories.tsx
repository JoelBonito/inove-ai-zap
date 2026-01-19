import { useState, useCallback, createContext, useContext, ReactNode } from 'react';
import { Category, CategoryColor } from '../types';

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

// Dados mock iniciais
const mockCategories: Category[] = [
    {
        id: 'cat_vendas',
        name: 'Vendas',
        color: 'blue',
        contactCount: 3240,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
    },
    {
        id: 'cat_suporte',
        name: 'Suporte',
        color: 'emerald',
        contactCount: 1102,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
    },
    {
        id: 'cat_lead_quente',
        name: 'Lead Quente',
        color: 'purple',
        contactCount: 856,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
    },
    {
        id: 'cat_vip',
        name: 'VIP',
        color: 'amber',
        contactCount: 210,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
    },
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
    const [categories, setCategories] = useState<Category[]>(mockCategories);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Gera ID único para nova categoria
     */
    const generateId = () => `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    /**
     * Gera cor aleatória para nova categoria
     */
    const getRandomColor = (): CategoryColor => {
        const usedColors = new Set(categories.map(c => c.color));
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

        // Validação
        const trimmedName = name.trim();
        if (!trimmedName) {
            setError('Nome da categoria é obrigatório');
            setIsLoading(false);
            throw new Error('Nome da categoria é obrigatório');
        }

        // Verifica duplicata
        if (categories.some(c => c.name.toLowerCase() === trimmedName.toLowerCase())) {
            setError('Já existe uma categoria com este nome');
            setIsLoading(false);
            throw new Error('Já existe uma categoria com este nome');
        }

        const now = new Date().toISOString();
        const newCategory: Category = {
            id: generateId(),
            name: trimmedName,
            color: color || getRandomColor(),
            contactCount: 0,
            createdAt: now,
            updatedAt: now,
        };

        // Optimistic UI: adiciona imediatamente
        setCategories(prev => [...prev, newCategory]);

        // TODO: Em produção, sincronizar com Firestore
        // await addDoc(collection(db, `clients/${clientId}/categories`), newCategory);

        console.log('[Story 3.3] Categoria criada:', newCategory);
        setIsLoading(false);

        return newCategory;
    }, [categories]);

    /**
     * Atualiza categoria existente
     * Optimistic UI: atualiza imediatamente
     */
    const updateCategory = useCallback(async (id: string, data: Partial<Pick<Category, 'name' | 'color'>>) => {
        setIsLoading(true);
        setError(null);

        // Validação de nome
        if (data.name !== undefined) {
            const trimmedName = data.name.trim();
            if (!trimmedName) {
                setError('Nome da categoria é obrigatório');
                setIsLoading(false);
                throw new Error('Nome da categoria é obrigatório');
            }

            // Verifica duplicata (excluindo a própria categoria)
            if (categories.some(c => c.id !== id && c.name.toLowerCase() === trimmedName.toLowerCase())) {
                setError('Já existe uma categoria com este nome');
                setIsLoading(false);
                throw new Error('Já existe uma categoria com este nome');
            }

            data.name = trimmedName;
        }

        // Optimistic UI: atualiza imediatamente
        setCategories(prev => prev.map(cat =>
            cat.id === id
                ? { ...cat, ...data, updatedAt: new Date().toISOString() }
                : cat
        ));

        // TODO: Em produção, sincronizar com Firestore
        // await updateDoc(doc(db, `clients/${clientId}/categories/${id}`), data);

        console.log('[Story 3.3] Categoria atualizada:', id, data);
        setIsLoading(false);
    }, [categories]);

    /**
     * Exclui categoria
     * Nota: Contatos são desassociados mas NÃO deletados (RF conforme epics.md)
     */
    const deleteCategory = useCallback(async (id: string) => {
        setIsLoading(true);
        setError(null);

        const categoryToDelete = categories.find(c => c.id === id);
        if (!categoryToDelete) {
            setError('Categoria não encontrada');
            setIsLoading(false);
            throw new Error('Categoria não encontrada');
        }

        // Optimistic UI: remove imediatamente
        setCategories(prev => prev.filter(cat => cat.id !== id));

        // TODO: Em produção:
        // 1. Remover categoria do Firestore
        // 2. Atualizar contatos que tinham esta categoria (remover do array categories)
        // await deleteDoc(doc(db, `clients/${clientId}/categories/${id}`));

        console.log('[Story 3.3] Categoria excluída:', categoryToDelete.name);
        setIsLoading(false);
    }, [categories]);

    /**
     * Busca categoria por ID
     */
    const getCategoryById = useCallback((id: string): Category | undefined => {
        return categories.find(c => c.id === id);
    }, [categories]);

    /**
     * Atualiza contagem de contatos de uma categoria
     */
    const updateContactCount = useCallback((id: string, delta: number) => {
        setCategories(prev => prev.map(cat =>
            cat.id === id
                ? { ...cat, contactCount: Math.max(0, cat.contactCount + delta) }
                : cat
        ));
    }, []);

    return {
        categories,
        isLoading,
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
