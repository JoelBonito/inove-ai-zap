import React, { useState, useEffect } from 'react';
import { Contact, Category } from '../../types';
import { sanitizePhone } from '../../hooks/useContacts';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './dialog';
import { CATEGORY_COLOR_CLASSES } from '../../lib/categoryColors';

interface ContactModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<Contact>) => Promise<void>;
    contact?: Contact; // Se fornecido, é modo edição
    categories: Category[];
    isLoading?: boolean;
}

/**
 * Modal para criar/editar contatos manualmente
 * Story 3.5 - CRUD de Contatos
 */
export const ContactModal: React.FC<ContactModalProps> = ({
    isOpen,
    onClose,
    onSave,
    contact,
    categories,
    isLoading = false,
}) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const isEditMode = !!contact;

    // Preenche dados no modo edição ou limpa no modo criação
    useEffect(() => {
        if (contact && isOpen) {
            setName(contact.name);
            setEmail(contact.email);
            setPhone(contact.phone);
            setSelectedCategoryIds(contact.categoryIds || []);
        } else if (isOpen) {
            setName('');
            setEmail('');
            setPhone('');
            setSelectedCategoryIds([]);
        }
        setErrors({});
    }, [contact, isOpen]);

    const validate = (): boolean => {
        const newErrors: { [key: string]: string } = {};

        if (!name.trim()) newErrors.name = 'Nome é obrigatório';
        if (!phone.trim()) newErrors.phone = 'Telefone é obrigatório';
        else {
            const { isValid, error } = sanitizePhone(phone);
            if (!isValid && error) newErrors.phone = error;
        }

        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = 'E-mail inválido';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            const { formatted } = sanitizePhone(phone);
            await onSave({
                name,
                email,
                phone: formatted,
                categoryIds: selectedCategoryIds,
                // Mantemos tags vazias por enquanto, focando em categories
                tags: contact?.tags || [],
            });
            onClose();
        } catch (err) {
            console.error('Erro ao salvar contato:', err);
            // Aqui poderia setar um erro global se houvesse prop para isso
        }
    };

    const toggleCategory = (catId: string) => {
        setSelectedCategoryIds(prev =>
            prev.includes(catId)
                ? prev.filter(id => id !== catId)
                : [...prev, catId]
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-lg p-0 overflow-hidden flex flex-col max-h-[90vh]">
                <DialogHeader className="p-6 border-b border-slate-100 dark:border-slate-800">
                    <DialogTitle>
                        {isEditMode ? 'Editar Contato' : 'Novo Contato'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditMode ? 'Atualize as informações do contato' : 'Adicione um novo contato manualmente'}
                    </DialogDescription>
                </DialogHeader>

                <div className="overflow-y-auto p-6 space-y-5">
                    <form id="contact-form" onSubmit={handleSubmit} className="space-y-5">
                        {/* Nome */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                                Nome Completo *
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ex: João da Silva"
                                className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${errors.name
                                    ? 'border-red-300 focus:ring-red-200'
                                    : 'border-slate-200 dark:border-slate-700'
                                    }`}
                            />
                            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                        </div>

                        {/* Telefone */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                                WhatsApp *
                            </label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="Ex: 11999998888"
                                className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${errors.phone
                                    ? 'border-red-300 focus:ring-red-200'
                                    : 'border-slate-200 dark:border-slate-700'
                                    }`}
                            />
                            {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                            <p className="text-xs text-slate-400 mt-1">Formato: DDD + Número (ex: 11999998888)</p>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                                E-mail (Opcional)
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Ex: joao@email.com"
                                className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${errors.email
                                    ? 'border-red-300 focus:ring-red-200'
                                    : 'border-slate-200 dark:border-slate-700'
                                    }`}
                            />
                            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                        </div>

                        {/* Categorias */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                                Categorias
                            </label>
                            {categories.length === 0 ? (
                                <p className="text-sm text-slate-400 italic">Nenhuma categoria cadastrada.</p>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {categories.map((cat) => {
                                        const isSelected = selectedCategoryIds.includes(cat.id);
                                        const colorClasses = CATEGORY_COLOR_CLASSES[cat.color];
                                        return (
                                            <button
                                                key={cat.id}
                                                type="button"
                                                onClick={() => toggleCategory(cat.id)}
                                                className={`
                          inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
                          ${isSelected
                                ? `${colorClasses.soft} ring-1 ${colorClasses.ring}`
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                            }
                        `}
                                                aria-pressed={isSelected}
                                            >
                                                <span className={`size-2 rounded-full ${colorClasses.dot}`} />
                                                {cat.name}
                                                {isSelected && <span className="material-symbols-outlined text-[14px] ml-0.5">check</span>}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </form>
                </div>

                <DialogFooter className="p-6 border-t border-slate-100 dark:border-slate-800 flex-shrink-0 bg-slate-50/50 dark:bg-slate-800/20">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2.5 text-slate-600 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form="contact-form"
                        disabled={isLoading}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-dark text-slate-900 font-bold rounded-lg transition-colors disabled:opacity-50 shadow-md shadow-primary/20"
                    >
                        {isLoading ? (
                            <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                        ) : (
                            <span className="material-symbols-outlined text-lg">
                                {isEditMode ? 'save' : 'person_add'}
                            </span>
                        )}
                        {isEditMode ? 'Salvar Alterações' : 'Criar Contato'}
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
