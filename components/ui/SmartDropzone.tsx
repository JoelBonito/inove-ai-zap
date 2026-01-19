import React, { useCallback, useState } from 'react';

interface SmartDropzoneProps {
    onFileSelect: (file: File) => void;
    accept?: string;
    maxSizeMB?: number;
    isLoading?: boolean;
    className?: string;
}

/**
 * SmartDropzone - Componente de upload de arquivos via drag-and-drop
 * 
 * Story 3.1 - Importação de Contatos:
 * - Suporta arrastar arquivos CSV ou Excel
 * - Validação de tipo e tamanho
 * - Feedback visual durante drag
 * 
 * Design System: Stitch Native com cores do tema
 */
export const SmartDropzone: React.FC<SmartDropzoneProps> = ({
    onFileSelect,
    accept = '.csv,.xlsx,.xls',
    maxSizeMB = 10,
    isLoading = false,
    className = '',
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
        setError(null);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const validateFile = useCallback((file: File): string | null => {
        // Validar extensão
        const extension = file.name.split('.').pop()?.toLowerCase();
        const allowedExtensions = accept.split(',').map(ext => ext.replace('.', '').trim());

        if (!extension || !allowedExtensions.includes(extension)) {
            return `Formato não suportado. Use: ${accept}`;
        }

        // Validar tamanho
        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > maxSizeMB) {
            return `Arquivo muito grande. Máximo: ${maxSizeMB}MB`;
        }

        return null;
    }, [accept, maxSizeMB]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length === 0) return;

        const file = files[0];
        const validationError = validateFile(file);

        if (validationError) {
            setError(validationError);
            return;
        }

        setError(null);
        onFileSelect(file);
    }, [validateFile, onFileSelect]);

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];
        const validationError = validateFile(file);

        if (validationError) {
            setError(validationError);
            return;
        }

        setError(null);
        onFileSelect(file);

        // Reset input para permitir selecionar o mesmo arquivo novamente
        e.target.value = '';
    }, [validateFile, onFileSelect]);

    return (
        <div
            className={`
        relative border-2 border-dashed rounded-xl transition-all duration-200
        ${isDragging
                    ? 'border-primary bg-primary/5 scale-[1.02]'
                    : error
                        ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10'
                        : 'border-slate-200 dark:border-slate-700 hover:border-primary/50 bg-slate-50/50 dark:bg-slate-800/30'
                }
        ${isLoading ? 'pointer-events-none opacity-60' : 'cursor-pointer'}
        ${className}
      `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <input
                type="file"
                accept={accept}
                onChange={handleFileInput}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isLoading}
            />

            <div className="p-8 flex flex-col items-center justify-center text-center">
                {isLoading ? (
                    <>
                        <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-3xl text-primary animate-spin">
                                progress_activity
                            </span>
                        </div>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                            Processando arquivo...
                        </p>
                    </>
                ) : error ? (
                    <>
                        <div className="size-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-3xl text-red-500">
                                error
                            </span>
                        </div>
                        <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
                            {error}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Tente novamente com outro arquivo
                        </p>
                    </>
                ) : (
                    <>
                        <div className={`
              size-16 rounded-full flex items-center justify-center mb-4 transition-all
              ${isDragging
                                ? 'bg-primary/20 scale-110'
                                : 'bg-slate-100 dark:bg-slate-800'
                            }
            `}>
                            <span className={`
                material-symbols-outlined text-3xl transition-colors
                ${isDragging ? 'text-primary' : 'text-slate-400'}
              `}>
                                {isDragging ? 'file_download' : 'upload_file'}
                            </span>
                        </div>

                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                            {isDragging ? (
                                <span className="text-primary">Solte o arquivo aqui</span>
                            ) : (
                                <>
                                    Arraste um arquivo ou <span className="text-primary underline">clique para selecionar</span>
                                </>
                            )}
                        </p>

                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Suporta CSV, Excel (.xlsx, .xls) • Máximo {maxSizeMB}MB
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};

/**
 * Dropzone compacto para uso inline (dentro de cards menores)
 */
interface CompactDropzoneProps {
    onFileSelect: (file: File) => void;
    accept?: string;
    label?: string;
}

export const CompactDropzone: React.FC<CompactDropzoneProps> = ({
    onFileSelect,
    accept = '.csv,.xlsx,.xls',
    label = 'Importar arquivo',
}) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            onFileSelect(files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            onFileSelect(files[0]);
        }
    };

    return (
        <label
            className={`
        flex items-center gap-3 px-4 py-3 rounded-lg border-2 border-dashed cursor-pointer transition-all
        ${isDragging
                    ? 'border-primary bg-primary/5'
                    : 'border-slate-200 dark:border-slate-700 hover:border-primary/50'
                }
      `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <input
                type="file"
                accept={accept}
                onChange={handleChange}
                className="hidden"
            />
            <span className={`material-symbols-outlined text-xl ${isDragging ? 'text-primary' : 'text-slate-400'}`}>
                {isDragging ? 'file_download' : 'add_circle'}
            </span>
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {label}
            </span>
        </label>
    );
};

export default SmartDropzone;
