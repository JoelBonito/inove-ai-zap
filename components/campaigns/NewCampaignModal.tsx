import React, { useState, useEffect, useRef } from 'react';
import { useCategories } from '../../hooks/useCategories';
import { useContacts } from '../../hooks/useContacts'; // Story 5.1
import { useCampaignsContext } from '../../hooks/useCampaigns';
import { SpintaxGeneratorModal } from './SpintaxGeneratorModal';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { CATEGORY_COLOR_CLASSES } from '../../lib/categoryColors';

interface NewCampaignModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Step = 1 | 2 | 3;

export const NewCampaignModal: React.FC<NewCampaignModalProps> = ({
    isOpen,
    onClose,
}) => {
    const { categories } = useCategories();
    const { contacts } = useContacts(); // Story 5.1
    const { addCampaign } = useCampaignsContext();

    const [step, setStep] = useState<Step>(1);
    const [name, setName] = useState('');
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
    const [message, setMessage] = useState('');
    const [media, setMedia] = useState<File | null>(null);
    const [mediaPreview, setMediaPreview] = useState<string | null>(null);
    const [scheduledAt, setScheduledAt] = useState<string>('');

    // Story 4.3 - IA Modal State
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);

    // Story 5.5 - Quick List & Story 5.1 - Manual Selection
    const [audienceType, setAudienceType] = useState<'categories' | 'quick-list' | 'manual'>('categories');
    const [quickListText, setQuickListText] = useState('');
    const [parsedQuickContacts, setParsedQuickContacts] = useState<{ name: string; phone: string }[]>([]);
    const [quickListFile, setQuickListFile] = useState<File | null>(null);

    // Story 5.1 - Manual Selection State
    const [manualSearch, setManualSearch] = useState('');
    const [selectedManualContactIds, setSelectedManualContactIds] = useState<string[]>([]);

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Reset state on close
    useEffect(() => {
        if (!isOpen) {
            setStep(1);
            setName('');
            setSelectedCategoryIds([]);
            setMessage('');
            setMedia(null);
            setMediaPreview(null);
            setQuickListFile(null);
            setManualSearch('');
            setSelectedManualContactIds([]);
            setScheduledAt('');
            setIsAiModalOpen(false);
        }
    }, [isOpen]);

    const handleNext = () => {
        if (step === 1) {
            if (!name) return;
            if (audienceType === 'categories' && selectedCategoryIds.length === 0) return;
            if (audienceType === 'quick-list' && parsedQuickContacts.length === 0) return;
            if (audienceType === 'manual' && selectedManualContactIds.length === 0) return;
        }
        if (step === 2 && !message) return;

        setStep((prev) => (prev + 1) as Step);
    };

    const handleBack = () => {
        setStep((prev) => (prev - 1) as Step);
    };

    const toggleCategory = (id: string) => {
        setSelectedCategoryIds((prev) =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    const toggleManualContact = (id: string) => {
        setSelectedManualContactIds((prev) =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    // Filter contacts for manual selection
    const filteredContacts = contacts.filter(c =>
        c.name.toLowerCase().includes(manualSearch.toLowerCase()) ||
        c.phone.includes(manualSearch)
    );

    const insertVariable = (variable: string) => {
        if (textareaRef.current) {
            const start = textareaRef.current.selectionStart;
            const end = textareaRef.current.selectionEnd;
            const newMessage = message.substring(0, start) + variable + message.substring(end);
            setMessage(newMessage);

            // Reposition cursor after variable
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + variable.length;
                    textareaRef.current.focus();
                }
            }, 0);
        } else {
            setMessage(prev => prev + variable);
        }
    };

    // Handler para inserção via IA
    const handleAiInsert = (text: string) => {
        setMessage(text);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setMedia(file);
            const url = URL.createObjectURL(file);
            setMediaPreview(url);
        }
    };

    const removeMedia = () => {
        setMedia(null);
        if (mediaPreview) URL.revokeObjectURL(mediaPreview);
        setMediaPreview(null);
    }

    const handleSave = async () => {
        let finalTotalContacts = 0;

        if (audienceType === 'categories') {
            finalTotalContacts = contacts.filter(c =>
                selectedCategoryIds.some(catId => c.categoryIds?.includes(catId))
            ).length;
        } else if (audienceType === 'manual') {
            finalTotalContacts = selectedManualContactIds.length;
        } else {
            finalTotalContacts = parsedQuickContacts.length;
        }


        if (finalTotalContacts === 0) {
            alert('Selecione pelo menos um contato, categoria ou lista válida para envio.');
            return;
        }

        addCampaign({
            name,
            targetCategoryIds: audienceType === 'categories' ? selectedCategoryIds : undefined,
            targetContactList: audienceType === 'quick-list' ? parsedQuickContacts : undefined,
            targetContactIds: audienceType === 'manual' ? selectedManualContactIds : undefined, // Story 5.1
            content: message,
            mediaUrl: mediaPreview || undefined,
            mediaType: media ? (media.type.startsWith('image/') ? 'image' : 'video') : undefined,
            total: finalTotalContacts,
            status: scheduledAt ? 'Agendado' : 'Agendado', // Default
            scheduledAt: scheduledAt || undefined
        });

        onClose();
    };

    if (!isOpen) return null;

    const getEstimatedContacts = () => {
        if (audienceType === 'categories') {
            return contacts.filter(c =>
                selectedCategoryIds.some(catId => c.categoryIds?.includes(catId))
            ).length;
        }
        if (audienceType === 'manual') {
            return selectedManualContactIds.length;
        }
        return parsedQuickContacts.length;
    };

    const processQuickList = (text: string) => {
        const lines = text.split('\n');
        const contacts: { name: string; phone: string }[] = [];

        lines.forEach(line => {
            const parts = line.split(/[;,]/); // Split by comma or semicolon
            let phone = '';
            let name = 'Sem Nome';

            // Heuristic: Find the part that looks like a phone number
            for (const part of parts) {
                const clean = part.replace(/\D/g, '');
                if (clean.length >= 10) { // Basic length check for phone
                    phone = clean;
                } else if (part.trim().length > 0) {
                    name = part.trim();
                }
            }

            if (phone) {
                contacts.push({ name, phone });
            }
        });
        setParsedQuickContacts(contacts);
    };

    const handleQuickListTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const text = e.target.value;
        setQuickListText(text);
        processQuickList(text);
    };

    const handleQuickListFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setQuickListFile(file);
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    const text = event.target.result as string;
                    setQuickListText(text);
                    processQuickList(text);
                }
            };
            reader.readAsText(file);
        }
    };

    const totalContacts = getEstimatedContacts();

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl h-[90vh] p-0 overflow-hidden flex flex-col">
                <DialogHeader className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between space-y-0 bg-white dark:bg-surface-dark shrink-0">
                    <div>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">campaign</span>
                            Nova Campanha
                        </DialogTitle>
                        <DialogDescription className="mt-0.5">
                            Etapa {step} de 3: {step === 1 ? 'Configuração' : step === 2 ? 'Mensagem' : 'Revisão'}
                        </DialogDescription>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                        aria-label="Fechar modal"
                    >
                        <span className="material-symbols-outlined text-[24px]">close</span>
                    </button>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50 dark:bg-[#0B1120]">

                    {/* STEP 1: CONFIGURAÇÃO */}
                    {step === 1 && (
                        <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-right-4 duration-300">

                            <div className="space-y-4">
                                <label className="block text-sm font-semibold text-slate-900 dark:text-white">
                                    Nome da Campanha
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ex: Oferta Black Friday 2024"
                                    className={`w-full px-4 py-3 bg-white dark:bg-slate-800 border rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm ${!name && step === 1 ? 'border-primary' : 'border-slate-200 dark:border-slate-700'}`}
                                    autoFocus
                                />
                                {!name && step === 1 && (
                                    <p className="text-xs text-primary font-medium mt-1 animate-pulse">
                                        * Dê um nome para sua campanha para continuar
                                    </p>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="block text-sm font-semibold text-slate-900 dark:text-white">
                                        Defina o Público Alvo
                                    </label>
                                    <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                                        {totalContacts} contatos estimados
                                    </span>
                                </div>

                                {/* Tabs Navigation */}
                                <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg mb-4">
                                    <button
                                        onClick={() => setAudienceType('categories')}
                                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${audienceType === 'categories'
                                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                            }`}
                                    >
                                        Por Categorias
                                    </button>
                                    <button
                                        onClick={() => setAudienceType('manual')}
                                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${audienceType === 'manual'
                                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                            }`}
                                    >
                                        Selecionar Contatos
                                    </button>
                                    <button
                                        onClick={() => setAudienceType('quick-list')}
                                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${audienceType === 'quick-list'
                                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                            }`}
                                    >
                                        Lista Rápida (Upload)
                                    </button>
                                </div>

                                {audienceType === 'categories' ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {categories.map(category => {
                                            const realCount = contacts.filter(c => c.categoryIds?.includes(category.id)).length;
                                            return (
                                                <label
                                                    key={category.id}
                                                    className={`
                            relative flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all hover:bg-white dark:hover:bg-slate-800
                            ${selectedCategoryIds.includes(category.id)
                                                            ? 'border-primary bg-primary/5 dark:bg-primary/10'
                                                            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-primary/50'}
                          `}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only"
                                                        checked={selectedCategoryIds.includes(category.id)}
                                                        onChange={() => toggleCategory(category.id)}
                                                    />
                                                    <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedCategoryIds.includes(category.id)
                                                        ? 'bg-primary border-primary'
                                                        : 'border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-900'
                                                        }`}>
                                                        {selectedCategoryIds.includes(category.id) && (
                                                            <span className="material-symbols-outlined text-[16px] text-slate-900 font-bold">check</span>
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`size-2.5 rounded-full ${CATEGORY_COLOR_CLASSES[category.color]?.dot || 'bg-slate-500'}`}></span>
                                                            <span className="font-semibold text-sm text-slate-900 dark:text-white">{category.name}</span>
                                                        </div>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                                            {realCount} contatos
                                                        </p>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                ) : audienceType === 'manual' ? (
                                    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200 h-[400px] flex flex-col">
                                        {/* Search Bar */}
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                                            <input
                                                type="text"
                                                value={manualSearch}
                                                onChange={(e) => setManualSearch(e.target.value)}
                                                placeholder="Buscar por nome ou telefone..."
                                                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                            />
                                        </div>

                                        {/* Select All / Deselect All */}
                                        <div className="flex justify-between items-center text-xs text-slate-500">
                                            <span>{filteredContacts.length} contatos encontrados</span>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setSelectedManualContactIds(contacts.map(c => c.id))}
                                                    className="text-primary hover:underline"
                                                >
                                                    Selecionar Todos
                                                </button>
                                                <button
                                                    onClick={() => setSelectedManualContactIds([])}
                                                    className="text-red-500 hover:underline"
                                                >
                                                    Limpar Seleção
                                                </button>
                                            </div>
                                        </div>

                                        {/* Contact List */}
                                        <div className="flex-1 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900">
                                            {filteredContacts.length > 0 ? (
                                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                                    {filteredContacts.map(contact => (
                                                        <label
                                                            key={contact.id}
                                                            className={`flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors ${selectedManualContactIds.includes(contact.id) ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''
                                                                }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedManualContactIds.includes(contact.id)}
                                                                onChange={() => toggleManualContact(contact.id)}
                                                                className="rounded border-slate-300 text-primary focus:ring-primary"
                                                            />
                                                            <div className="size-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                                                                {contact.initials}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{contact.name}</p>
                                                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{contact.phone}</p>
                                                            </div>
                                                            {selectedManualContactIds.includes(contact.id) && (
                                                                <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                                                            )}
                                                        </label>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center h-full text-slate-400 p-4">
                                                    <span className="material-symbols-outlined text-4xl mb-2">person_off</span>
                                                    <p className="text-sm">Nenhum contato encontrado</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/50 rounded-lg p-4 mb-4">
                                            <div className="flex gap-2">
                                                <span className="material-symbols-outlined text-amber-600 dark:text-amber-500">lightbulb</span>
                                                <div className="text-sm text-amber-800 dark:text-amber-200">
                                                    <p className="font-semibold mb-1">Campanha Relâmpago</p>
                                                    <p>Cole uma lista de números ou arraste um arquivo CSV/TXT. O sistema irá identificar nomes e telefones automaticamente.</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="relative">
                                            <textarea
                                                value={quickListText}
                                                onChange={handleQuickListTextChange}
                                                placeholder={`Exemplo:\nJoão Silva, 11999887766\nMaria Santos, 21988776655\n11977665544`}
                                                className="w-full h-40 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm font-mono text-sm"
                                            />
                                            <div className="absolute bottom-3 right-3">
                                                <label className="cursor-pointer bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors">
                                                    <span className="material-symbols-outlined text-[16px]">upload_file</span>
                                                    Carregar CSV/TXT
                                                    <input type="file" className="hidden" accept=".csv,.txt" onChange={handleQuickListFileChange} />
                                                </label>
                                            </div>
                                        </div>

                                        {parsedQuickContacts.length > 0 && (
                                            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/50 rounded-lg p-3 flex justify-between items-center">
                                                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-sm font-medium">
                                                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                                                    {parsedQuickContacts.length} contatos válidos identificados
                                                </div>
                                                <button
                                                    onClick={() => { setQuickListText(''); setParsedQuickContacts([]); setQuickListFile(null); }}
                                                    className="text-xs text-slate-500 hover:text-red-500 underline"
                                                >
                                                    Limpar
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* STEP 2: EDITOR */}
                    {step === 2 && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full animate-in slide-in-from-right-4 duration-300">

                            {/* Editor Column */}
                            <div className="flex flex-col gap-4 h-full">
                                <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col overflow-hidden">

                                    {/* Toolbar */}
                                    <div className="p-3 border-b border-slate-100 dark:border-slate-700 flex flex-wrap gap-2 items-center bg-slate-50/50 dark:bg-slate-800/50">
                                        <div className="flex items-center gap-1 border-r border-slate-200 dark:border-slate-700 pr-2 mr-1">
                                            <button
                                                onClick={() => insertVariable('*')}
                                                className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                                                title="Negrito"
                                                aria-label="Inserir negrito"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">format_bold</span>
                                            </button>
                                            <button
                                                onClick={() => insertVariable('_')}
                                                className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                                                title="Itálico"
                                                aria-label="Inserir italico"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">format_italic</span>
                                            </button>
                                            <button
                                                onClick={() => insertVariable('~')}
                                                className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                                                title="Tachado"
                                                aria-label="Inserir tachado"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">format_strikethrough</span>
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Variáveis:</span>
                                            <button
                                                onClick={() => insertVariable('{nome}')}
                                                className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary-dark dark:text-primary hover:bg-primary/20 rounded border border-primary/20 transition-colors"
                                            >
                                                Nome
                                            </button>
                                            <button
                                                onClick={() => insertVariable('{saudacao}')}
                                                className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary-dark dark:text-primary hover:bg-primary/20 rounded border border-primary/20 transition-colors"
                                            >
                                                Saudação
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-2 ml-auto">
                                            <button
                                                onClick={() => setIsAiModalOpen(true)}
                                                className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700 rounded border border-transparent transition-all shadow-sm"
                                                title="Gerar com IA"
                                            >
                                                <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                                                IA Mágica
                                            </button>
                                            <button
                                                onClick={() => insertVariable('{Oi|Olá|E aí}')}
                                                className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded border border-purple-200 dark:border-purple-800 transition-colors"
                                                title="Inserir Spintax para variação de texto"
                                            >
                                                <span className="material-symbols-outlined text-[14px]">shuffle</span>
                                                Spintax
                                            </button>
                                        </div>
                                    </div>

                                    {/* Textarea */}
                                    <textarea
                                        ref={textareaRef}
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Digite sua mensagem aqui... Use variáveis como {nome} para personalizar."
                                        className="flex-1 w-full p-4 bg-transparent border-none focus:ring-0 resize-none text-slate-700 dark:text-slate-200 leading-relaxed font-sans"
                                    />

                                    {/* Footer Stats */}
                                    <div className="p-3 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center text-xs text-slate-400 bg-slate-50/30 dark:bg-slate-800/30">
                                        <span>{message.length} caracteres</span>
                                        <span>Aproximadamente {Math.ceil(message.length / 160)} segmento(s) SMS</span>
                                    </div>
                                </div>

                                {/* Media Upload */}
                                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
                                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-slate-400">image</span>
                                        Mídia (Opcional)
                                    </h3>

                                    {!mediaPreview ? (
                                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 dark:hover:border-primary dark:hover:bg-primary/5 transition-all group">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <span className="material-symbols-outlined text-3xl text-slate-400 group-hover:text-primary mb-2 transition-colors">cloud_upload</span>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 group-hover:text-primary transition-colors">Clique para upload ou arraste</p>
                                                <p className="text-xs text-slate-400 mt-1">PNG, JPG ou MP4 (MAX. 5MB)</p>
                                            </div>
                                            <input type="file" className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
                                        </label>
                                    ) : (
                                        <div className="relative w-full h-48 bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center group">
                                            <img src={mediaPreview} alt="Preview" className="max-h-full max-w-full object-contain" />
                                            <button
                                                onClick={removeMedia}
                                                className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
                                                aria-label="Remover midia"
                                            >
                                                <span className="material-symbols-outlined text-sm">close</span>
                                            </button>
                                            <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 to-transparent text-white text-xs truncate opacity-0 group-hover:opacity-100 transition-opacity">
                                                {media?.name}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Preview Column */}
                            <div className="flex flex-col h-full bg-[#E5DDD5] dark:bg-[#0b141a] rounded-3xl border-[8px] border-slate-800 dark:border-slate-900 shadow-2xl overflow-hidden relative max-w-[400px] mx-auto lg:mx-0 w-full">
                                {/* WhatsApp Header */}
                                <div className="bg-[#008069] dark:bg-[#1f2c34] p-3 px-4 flex items-center justify-between text-white shrink-0 z-10">
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined -ml-1">arrow_back</span>
                                        <div className="flex items-center gap-2">
                                            <div className="size-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                                                <span className="material-symbols-outlined text-lg">person</span>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm leading-tight">Cliente Exemplo</p>
                                                <p className="text-[10px] opacity-80">Online hoje às 14:30</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <span className="material-symbols-outlined">videocam</span>
                                        <span className="material-symbols-outlined">call</span>
                                        <span className="material-symbols-outlined">more_vert</span>
                                    </div>
                                </div>

                                {/* Chat Background */}
                                <div className="flex-1 p-4 overflow-y-auto bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat opacity-90 dark:opacity-20 relative">
                                    <div className="flex flex-col gap-3">

                                        <div className="self-center bg-[#FFF5C4] dark:bg-[#1f2c34] text-slate-800 dark:text-slate-300 text-[10px] px-2 py-1 rounded shadow-sm opacity-90 mb-4">
                                            Hoje
                                        </div>

                                        {/* Message Bubble */}
                                        <div className="self-end bg-[#E7FFDB] dark:bg-[#005c4b] p-[3px] rounded-lg shadow-sm max-w-[90%] min-w-[120px]">
                                            {mediaPreview && (
                                                <div className="rounded-md overflow-hidden mb-1 relative">
                                                    <img src={mediaPreview} alt="Mídia" className="w-full h-auto object-cover max-h-[200px]" />
                                                </div>
                                            )}
                                            <div className="px-2 pb-1 pt-1">
                                                <p className="text-sm text-slate-900 dark:text-slate-100 whitespace-pre-wrap leading-relaxed">
                                                    {message || <span className="text-slate-400 italic">Sua mensagem aparecerá aqui...</span>}
                                                </p>
                                                <div className="flex justify-end items-center gap-1 mt-1">
                                                    <span className="text-[10px] text-slate-500 dark:text-slate-300/70">19:00</span>
                                                    <span className="material-symbols-outlined text-[14px] text-blue-500">done_all</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* WhatsApp Footer Mock */}
                                <div className="bg-[#f0f2f5] dark:bg-[#1f2c34] p-2 flex items-center gap-2 shrink-0">
                                    <span className="material-symbols-outlined text-slate-500 text-2xl p-1">sentiment_satisfied</span>
                                    <span className="material-symbols-outlined text-slate-500 text-2xl p-1">add</span>
                                    <div className="flex-1 bg-white dark:bg-[#2a3942] rounded-full h-9"></div>
                                    <span className="material-symbols-outlined text-slate-500 text-2xl p-1">mic</span>
                                </div>
                            </div>

                        </div>
                    )}

                    {/* STEP 3: REVIEW */}
                    {step === 3 && (
                        <div className="max-w-xl mx-auto text-center py-6 animate-in fade-in duration-300">
                            <div className="size-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="material-symbols-outlined text-3xl">check_circle</span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Tudo pronto!</h3>
                            <p className="text-slate-500 dark:text-slate-400 mb-6">
                                Sua campanha <strong>"{name}"</strong> está pronta para ser enviada para <strong>{totalContacts} contatos</strong>.
                            </p>

                            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 text-left mb-6 border border-slate-100 dark:border-slate-700">
                                <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Resumo</h4>
                                <ul className="space-y-3 text-sm">
                                    <li className="flex justify-between">
                                        <span className="text-slate-500">Público:</span>
                                        <span className="font-medium text-slate-900 dark:text-white">
                                            {audienceType === 'categories'
                                                ? `${selectedCategoryIds.length} categoria(s)`
                                                : audienceType === 'manual'
                                                    ? 'Seleção Manual'
                                                    : 'Lista Rápida (Upload)'}
                                        </span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span className="text-slate-500">Total de Contatos:</span>
                                        <span className="font-medium text-slate-900 dark:text-white">{totalContacts}</span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span className="text-slate-500">Tamanho da Mensagem:</span>
                                        <span className="font-medium text-slate-900 dark:text-white">{message.length} chars</span>
                                    </li>
                                </ul>
                            </div>

                            {/* Scheduling Section */}
                            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4 text-left mb-8">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                        <span className="material-symbols-outlined text-xl">event_upcoming</span>
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-1">
                                            Agendar Disparo (Opcional)
                                        </label>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                                            Deixe em branco para enviar imediatamente ou selecione uma data futura.
                                        </p>
                                        <input
                                            type="datetime-local"
                                            value={scheduledAt}
                                            onChange={(e) => setScheduledAt(e.target.value)}
                                            min={new Date().toISOString().slice(0, 16)}
                                            className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                <DialogFooter className="p-5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-surface-dark flex justify-between items-center shrink-0">
                    <button
                        onClick={handleBack}
                        disabled={step === 1}
                        className="px-6 py-2.5 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-0"
                    >
                        Voltar
                    </button>

                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-6 py-2.5 text-slate-500 dark:text-slate-400 font-bold hover:text-slate-700 dark:hover:text-white transition-colors">
                            Cancelar
                        </button>

                        {step < 3 ? (
                            <button
                                onClick={handleNext}
                                disabled={
                                    (step === 1 && (
                                        !name ||
                                        (audienceType === 'categories' && selectedCategoryIds.length === 0) ||
                                        (audienceType === 'quick-list' && parsedQuickContacts.length === 0) ||
                                        (audienceType === 'manual' && selectedManualContactIds.length === 0)
                                    )) ||
                                    (step === 2 && !message)
                                }
                                className="px-8 py-2.5 bg-primary hover:bg-primary-dark text-slate-900 font-bold rounded-lg transition-all shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                Próximo
                                <span className="material-symbols-outlined text-lg">arrow_forward</span>
                            </button>
                        ) : (
                            <button
                                onClick={handleSave}
                                className="px-8 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg transition-all shadow-md shadow-emerald-500/20 flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-lg">
                                    {scheduledAt ? 'schedule_send' : 'send'}
                                </span>
                                {scheduledAt ? 'Agendar Campanha' : 'Disparar Agora'}
                            </button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>

            <SpintaxGeneratorModal
                isOpen={isAiModalOpen}
                onClose={() => setIsAiModalOpen(false)}
                onInsert={handleAiInsert}
                baseText={message}
            />
        </Dialog>
    );
};
