import React, { useState, useCallback } from 'react';
import { SmartDropzone } from './SmartDropzone';
import { ImportResult, ParseProgress } from '../../hooks/useContacts';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './dialog';
import { toast } from 'sonner';

interface ImportContactsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onFileSelect: (file: File) => Promise<ImportResult>;
    onConfirmImport: (categoryId?: string) => Promise<void>;
    onAddCategory?: (name: string) => Promise<any>; // Nova prop
    importResult: ImportResult | null;
    parseProgress: ParseProgress | null;
    isLoading: boolean;
    error: string | null;
    categories?: { id: string; name: string }[];
}

export const ImportContactsModal: React.FC<ImportContactsModalProps> = ({
    isOpen,
    onClose,
    onFileSelect,
    onConfirmImport,
    onAddCategory,
    importResult,
    parseProgress,
    isLoading,
    error,
    categories = [],
}) => {
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [showInvalid, setShowInvalid] = useState(false);

    // Estados para criação inline de categoria
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isSavingCategory, setIsSavingCategory] = useState(false);

    const handleFileSelect = useCallback(async (file: File) => {
        try {
            await onFileSelect(file);
        } catch (err) {
            // Erro já tratado no hook
        }
    }, [onFileSelect]);

    const handleConfirm = useCallback(async () => {
        await onConfirmImport(selectedCategory || undefined);
        onClose();
    }, [onConfirmImport, selectedCategory, onClose]);

    const handleSaveNewCategory = async () => {
        if (!newCategoryName.trim() || !onAddCategory) return;

        setIsSavingCategory(true);
        try {
            const newCat = await onAddCategory(newCategoryName);
            if (newCat && newCat.id) {
                setSelectedCategory(newCat.id);
            }
            setIsAddingCategory(false);
            setNewCategoryName('');
            toast.success(`Categoria "${newCategoryName}" criada!`);
        } catch (error) {
            console.error('Falha ao criar categoria:', error);
            toast.error('Erro ao criar categoria.');
        } finally {
            setIsSavingCategory(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
                <DialogHeader className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between space-y-0">
                    <div>
                        <DialogTitle>Importar Contatos</DialogTitle>
                        <DialogDescription className="mt-1">
                            Arraste um arquivo CSV ou Excel com sua lista de contatos
                        </DialogDescription>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        aria-label="Fechar modal"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </DialogHeader>

                <div className="p-6 overflow-y-auto flex-1">
                    {!importResult ? (
                        <>
                            {/* Dropzone */}
                            <SmartDropzone
                                onFileSelect={handleFileSelect}
                                isLoading={isLoading}
                                className="mb-6"
                            />

                            {/* Progress */}
                            {parseProgress && parseProgress.stage !== 'complete' && (
                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                            {parseProgress.message}
                                        </span>
                                        <span className="text-sm font-bold text-primary">
                                            {parseProgress.percent}%
                                        </span>
                                    </div>
                                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary transition-all duration-300"
                                            style={{ width: `${parseProgress.percent}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Error */}
                            {error && (
                                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                                    <div className="flex items-start gap-3">
                                        <span className="material-symbols-outlined text-red-500">error</span>
                                        <div>
                                            <p className="font-medium text-red-700 dark:text-red-300">{error}</p>
                                            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                                                Verifique se o arquivo está no formato correto.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Instructions */}
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                                <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-lg">info</span>
                                    Formato esperado
                                </h4>
                                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                                    <li className="flex items-start gap-2">
                                        <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                                        Coluna obrigatória: <code className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-xs">telefone</code> (ou phone, celular, whatsapp)
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                                        Colunas opcionais: <code className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-xs">nome</code>, <code className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-xs">email</code>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                                        Números serão automaticamente normalizados para o formato E.164
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                                        Suporta arquivos CSV e Excel (.xlsx, .xls)
                                    </li>
                                </ul>
                            </div>
                        </>
                    ) : (
                        /* Results */
                        <>
                            {/* Summary Cards */}
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 text-center">
                                    <p className="text-3xl font-bold text-slate-900 dark:text-white">
                                        {importResult.total}
                                    </p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                        Total encontrados
                                    </p>
                                </div>
                                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 text-center border border-emerald-100 dark:border-emerald-800">
                                    <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                                        {importResult.valid}
                                    </p>
                                    <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                                        Válidos
                                    </p>
                                </div>
                                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-center border border-red-100 dark:border-red-800">
                                    <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                                        {importResult.invalid}
                                    </p>
                                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                                        Inválidos (removidos)
                                    </p>
                                </div>
                            </div>

                            {/* Invalid contacts toggle */}
                            {importResult.invalid > 0 && (
                                <div className="mb-6">
                                    <button
                                        onClick={() => setShowInvalid(!showInvalid)}
                                        className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
                                    >
                                        <span className="material-symbols-outlined text-lg">
                                            {showInvalid ? 'expand_less' : 'expand_more'}
                                        </span>
                                        {showInvalid ? 'Ocultar' : 'Ver'} {importResult.invalid} contatos inválidos
                                    </button>

                                    {showInvalid && (
                                        <div className="mt-3 max-h-40 overflow-y-auto bg-red-50 dark:bg-red-900/10 rounded-lg p-3 space-y-2">
                                            {importResult.invalidContacts.map((contact, idx) => (
                                                <div key={idx} className="flex items-center justify-between text-sm">
                                                    <span className="text-red-700 dark:text-red-300 font-mono">
                                                        {contact.rawPhone}
                                                    </span>
                                                    <span className="text-red-500 dark:text-red-400 text-xs">
                                                        {contact.validationError}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Category selection */}
                            {categories.length > 0 && (
                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                                            Categorizar como (opcional)
                                        </label>
                                    </div>

                                    {isAddingCategory ? (
                                        <div className="flex gap-2 animate-in fade-in zoom-in-95">
                                            <input
                                                type="text"
                                                value={newCategoryName}
                                                onChange={(e) => setNewCategoryName(e.target.value)}
                                                placeholder="Nome da categoria"
                                                className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                                                autoFocus
                                            />
                                            <button
                                                onClick={handleSaveNewCategory}
                                                disabled={isSavingCategory}
                                                className="px-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
                                                title="Salvar"
                                            >
                                                {isSavingCategory ? (
                                                    <span className="material-symbols-outlined animate-spin">refresh</span>
                                                ) : (
                                                    <span className="material-symbols-outlined">check</span>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => { setIsAddingCategory(false); setNewCategoryName(''); setSelectedCategory(''); }}
                                                className="px-3 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                                                title="Cancelar"
                                            >
                                                <span className="material-symbols-outlined">close</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <select
                                            value={selectedCategory}
                                            onChange={(e) => {
                                                if (e.target.value === 'new_category_action') {
                                                    setIsAddingCategory(true);
                                                    setSelectedCategory('');
                                                } else {
                                                    setSelectedCategory(e.target.value);
                                                }
                                            }}
                                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent appearance-none"
                                        >
                                            <option value="">Nenhuma categoria</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                            {onAddCategory && (
                                                <option value="new_category_action" className="font-semibold text-primary">
                                                    + Nova Categoria
                                                </option>
                                            )}
                                        </select>
                                    )}
                                </div>
                            )}

                            {/* Preview table */}
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl overflow-hidden">
                                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                                    <h4 className="font-semibold text-slate-700 dark:text-slate-200">
                                        Prévia ({Math.min(5, importResult.contacts.length)} de {importResult.contacts.length})
                                    </h4>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-slate-200 dark:border-slate-700">
                                                <th className="px-4 py-2 text-left text-slate-500 font-medium">Nome</th>
                                                <th className="px-4 py-2 text-left text-slate-500 font-medium">Telefone</th>
                                                <th className="px-4 py-2 text-left text-slate-500 font-medium">Email</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                            {importResult.contacts.slice(0, 5).map((contact, idx) => (
                                                <tr key={idx}>
                                                    <td className="px-4 py-2 text-slate-900 dark:text-white">{contact.name}</td>
                                                    <td className="px-4 py-2 font-mono text-slate-600 dark:text-slate-300">
                                                        {contact.phone}
                                                    </td>
                                                    <td className="px-4 py-2 text-slate-500">{contact.email || '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <DialogFooter className="p-6 border-t border-slate-100 dark:border-slate-800">
                    <button
                        onClick={onClose}
                        className="px-4 py-2.5 text-slate-600 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        Cancelar
                    </button>

                    {importResult && (
                        <button
                            onClick={handleConfirm}
                            disabled={isLoading || importResult.valid === 0}
                            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-dark text-slate-900 font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary/20"
                        >
                            <span className="material-symbols-outlined text-lg">check</span>
                            Importar {importResult.valid} contatos
                        </button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ImportContactsModal;
