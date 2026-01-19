import React from 'react';
import { Contact } from '../../types';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from './dialog';

interface DeleteContactModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    contact: Contact | null;
    isLoading?: boolean;
}

/**
 * Modal para confirmar exclusão de contatos
 * Story 3.5 - CRUD de Contatos
 */
export const DeleteContactModal: React.FC<DeleteContactModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    contact,
    isLoading = false,
}) => {
    const handleConfirm = async () => {
        await onConfirm();
        onClose();
    };

    return (
        <Dialog open={isOpen && Boolean(contact)} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-sm p-0 overflow-hidden">
                <div className="p-6 text-center">
                    <div className="mx-auto size-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-3xl text-red-600 dark:text-red-400">
                            person_remove
                        </span>
                    </div>
                    <DialogTitle className="text-lg mb-2">Excluir contato?</DialogTitle>
                    <DialogDescription className="mb-2">
                        O contato <span className="font-semibold text-slate-700 dark:text-slate-200">"{contact?.name}"</span> será removido permanentemente.
                    </DialogDescription>
                    <p className="text-xs text-slate-400">
                        Esta ação não pode ser desfeita.
                    </p>
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
