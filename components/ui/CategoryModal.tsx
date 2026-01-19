import React, { useState, useEffect } from 'react';
import { Category, CategoryColor } from '../../types';
import { CATEGORY_COLORS } from '../../hooks/useCategories';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './dialog';
import { CATEGORY_COLOR_CLASSES, DEFAULT_BADGE_CLASSES } from '../../lib/categoryColors';

interface CategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, color: CategoryColor) => Promise<void>;
    category?: Category; // Se fornecido, é modo edição
    isLoading?: boolean;
    error?: string | null;
}

/**
 * Modal para criar/editar categorias
 * 
 * Story 3.3 - CRUD de Categorias:
 * - Modo criação: nome e cor
 * - Modo edição: preenche com dados existentes
 * - Validação de nome obrigatório
 */
export const CategoryModal: React.FC<CategoryModalProps> = ({
    isOpen,
    onClose,
    onSave,
    category,
    isLoading = false,
    error,
}) => {
    const [name, setName] = useState('');
    const [color, setColor] = useState<CategoryColor>('blue');
    const [localError, setLocalError] = useState<string | null>(null);

    const isEditMode = !!category;

    // Preenche dados no modo edição
    useEffect(() => {
        if (category) {
            setName(category.name);
            setColor(category.color);
        } else {
            setName('');
            setColor('blue');
        }
        setLocalError(null);
    }, [category, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);

        const trimmedName = name.trim();
        if (!trimmedName) {
            setLocalError('Nome da categoria é obrigatório');
            return;
        }

        try {
            await onSave(trimmedName, color);
            onClose();
        } catch (err) {
            // Erro já tratado no hook
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md p-0 overflow-hidden">
                <DialogHeader className="p-6 border-b border-slate-100 dark:border-slate-800">
                    <DialogTitle>
                        {isEditMode ? 'Editar Categoria' : 'Nova Categoria'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditMode ? 'Altere os dados da categoria' : 'Crie uma categoria para organizar seus contatos'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-5">
                        {/* Nome */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                                Nome da categoria
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ex: Clientes VIP, Leads Quentes..."
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                autoFocus
                            />
                        </div>

                        {/* Cor */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-3">
                                Cor da etiqueta
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {CATEGORY_COLORS.map((c) => (
                                    <button
                                        key={c.value}
                                        type="button"
                                        onClick={() => setColor(c.value)}
                                        className={`
                      size-8 rounded-full ${c.class} transition-all
                      ${color === c.value
                                                ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-white scale-110'
                                                : 'hover:scale-110 opacity-70 hover:opacity-100'
                                            }
                    `}
                                        title={c.label}
                                        aria-label={`Selecionar cor ${c.label}`}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Preview */}
                        <div className="pt-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                                Prévia
                            </label>
                            <div className="flex items-center gap-2">
                                <span className={`size-3 rounded-full ${CATEGORY_COLOR_CLASSES[color]?.dot || 'bg-slate-500'}`}></span>
                                <span className={`
                  inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border
                  ${CATEGORY_COLOR_CLASSES[color]?.badge || DEFAULT_BADGE_CLASSES}
                `}>
                                    {name.trim() || 'Nome da categoria'}
                                </span>
                            </div>
                        </div>

                        {/* Error */}
                        {(localError || error) && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                <p className="text-sm text-red-600 dark:text-red-400">
                                    {localError || error}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <DialogFooter className="p-6 border-t border-slate-100 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 text-slate-600 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-dark text-slate-900 font-bold rounded-lg transition-colors disabled:opacity-50 shadow-md shadow-primary/20"
                        >
                            {isLoading ? (
                                <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                            ) : (
                                <span className="material-symbols-outlined text-lg">
                                    {isEditMode ? 'save' : 'add'}
                                </span>
                            )}
                            {isEditMode ? 'Salvar' : 'Criar Categoria'}
                        </button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

/**
 * Modal de confirmação para exclusão
 */
interface DeleteCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    category: Category | null;
    isLoading?: boolean;
}

export const DeleteCategoryModal: React.FC<DeleteCategoryModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    category,
    isLoading = false,
}) => {
    const handleConfirm = async () => {
        await onConfirm();
        onClose();
    };

    return (
        <Dialog open={isOpen && Boolean(category)} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-sm p-0 overflow-hidden">
                <div className="p-6 text-center">
                    <div className="mx-auto size-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-3xl text-red-600 dark:text-red-400">
                            delete
                        </span>
                    </div>
                    <DialogTitle className="text-lg mb-2">Excluir categoria?</DialogTitle>
                    <DialogDescription className="mb-2">
                        A categoria <span className="font-semibold text-slate-700 dark:text-slate-200">"{category?.name}"</span> será excluída permanentemente.
                    </DialogDescription>

                    {category && category.contactCount > 0 && (
                        <p className="text-sm text-amber-600 dark:text-amber-400">
                            <span className="font-semibold">{category.contactCount}</span> contatos serão desassociados (não serão excluídos).
                        </p>
                    )}
                </div>

                <DialogFooter className="p-4 bg-slate-50 dark:bg-slate-800/50 justify-center">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                    >
                        {isLoading ? (
                            <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                        ) : (
                            <span className="material-symbols-outlined text-lg">delete</span>
                        )}
                        Excluir
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CategoryModal;
