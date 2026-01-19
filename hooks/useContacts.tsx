import { useState, useCallback, useEffect } from 'react';
import { Contact } from '../types';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDocs, writeBatch } from 'firebase/firestore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';

// Tipos específicos para importação
export interface ImportedContact {
    name: string;
    phone: string;
    email?: string;
    rawPhone: string; // Telefone original antes da sanitização
    isValid: boolean;
    validationError?: string;
}

export interface ImportResult {
    total: number;
    valid: number;
    invalid: number;
    contacts: ImportedContact[];
    invalidContacts: ImportedContact[];
    errors: string[];
}

export interface ParseProgress {
    stage: 'reading' | 'parsing' | 'validating' | 'complete' | 'error';
    percent: number;
    message: string;
}

interface UseContactsReturn {
    contacts: Contact[];
    isLoading: boolean;
    error: string | null;
    // Importação
    importResult: ImportResult | null;
    parseProgress: ParseProgress | null;
    parseFile: (file: File) => Promise<ImportResult>;
    confirmImport: (categoryId?: string) => Promise<void>;
    cancelImport: () => void;
    // CRUD
    addContact: (contact: Omit<Contact, 'id' | 'initials' | 'color'>) => Promise<void>;
    updateContact: (id: string, data: Partial<Contact>) => Promise<void>;
    deleteContact: (id: string) => Promise<void>;
    // Story 3.4 - Atribuição de categorias
    assignCategory: (contactIds: string[], categoryId: string) => Promise<void>;
    removeCategory: (contactIds: string[], categoryId: string) => Promise<void>;
    setCategoryForContacts: (contactIds: string[], categoryIds: string[]) => Promise<void>;
    // Seleção
    selectedContacts: string[];
    toggleContactSelection: (contactId: string) => void;
    selectAllContacts: () => void;
    clearSelection: () => void;
}

/**
 * Sanitiza número de telefone para formato E.164
 * Story 3.2 - Critérios de Aceite:
 * - Mantém números internacionais que já têm DDI
 * - Converte formatos brasileiros para +5511999887766
 * - Marca inválidos (menos de 10 dígitos, letras)
 */
export function sanitizePhone(phone: string): { formatted: string; isValid: boolean; error?: string } {
    // Limpa espaços extras
    const cleaned = phone.trim();

    // Se vazio
    if (!cleaned) {
        return { formatted: phone, isValid: false, error: 'Número vazio' };
    }

    // Verifica se contém letras (exceto os símbolos comuns)
    const hasLetters = /[a-zA-Z]/.test(cleaned.replace(/[\s\-\(\)\+\.]/g, ''));
    if (hasLetters) {
        return { formatted: phone, isValid: false, error: 'Contém caracteres inválidos' };
    }

    // Se já começa com + e tem formato internacional, mantém (números de outros países)
    if (cleaned.startsWith('+')) {
        const digits = cleaned.replace(/\D/g, '');
        // Número internacional válido: pelo menos 10 dígitos após limpar
        if (digits.length >= 10 && digits.length <= 15) {
            return { formatted: `+${digits}`, isValid: true };
        }
        return { formatted: cleaned, isValid: false, error: 'Formato internacional inválido' };
    }

    // Remove tudo que não é número
    let digits = cleaned.replace(/\D/g, '');

    // Verifica tamanho mínimo
    if (digits.length < 10) {
        return { formatted: phone, isValid: false, error: 'Número muito curto (mínimo 10 dígitos)' };
    }

    // Se começar com 55, assume já ter DDI Brasil
    if (digits.startsWith('55') && digits.length >= 12) {
        return { formatted: `+${digits}`, isValid: true };
    }

    // Se tiver 11 dígitos (DDD + 9 dígitos), adiciona +55
    if (digits.length === 11) {
        return { formatted: `+55${digits}`, isValid: true };
    }

    // Se tiver 10 dígitos (DDD + 8 dígitos - formato antigo), adiciona 9
    if (digits.length === 10) {
        const ddd = digits.substring(0, 2);
        const number = digits.substring(2);
        // Adiciona o 9 na frente para celulares
        return { formatted: `+55${ddd}9${number}`, isValid: true };
    }

    // Se tiver mais de 15 dígitos, está muito longo
    if (digits.length > 15) {
        return { formatted: phone, isValid: false, error: 'Número muito longo' };
    }

    // Fallback: assume número internacional sem +
    return { formatted: `+${digits}`, isValid: true };
}

/**
 * Gera iniciais a partir do nome
 */
function generateInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

/**
 * Gera cor aleatória consistente baseada no nome
 */
function generateColor(name: string): string {
    const colors = ['blue', 'emerald', 'amber', 'indigo', 'purple', 'pink', 'red', 'teal'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

/**
 * Parse CSV RFC 4180 compliant - suporta campos com aspas e vírgulas
 * Também detecta automaticamente ponto-vírgula como separador
 */
function parseCSVLine(line: string, separator: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                // Escaped quote
                current += '"';
                i++;
            } else {
                // Toggle quote mode
                inQuotes = !inQuotes;
            }
        } else if (char === separator && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    // Push last field
    result.push(current.trim());

    return result;
}

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (lines.length === 0) {
        return { headers: [], rows: [] };
    }

    // Detecta separador baseado na primeira linha
    const firstLine = lines[0];
    // Conta ocorrências fora de aspas
    let commaCount = 0, semicolonCount = 0;
    let inQuotes = false;
    for (const char of firstLine) {
        if (char === '"') inQuotes = !inQuotes;
        if (!inQuotes) {
            if (char === ',') commaCount++;
            if (char === ';') semicolonCount++;
        }
    }
    const separator = semicolonCount > commaCount ? ';' : ',';

    const headers = parseCSVLine(firstLine, separator).map(h => h.toLowerCase().trim());
    const rows = lines.slice(1).map(line => parseCSVLine(line, separator));

    return { headers, rows };
}

/**
 * Detecta formato Google Contacts e retorna mapeamento de colunas
 */
interface ColumnMapping {
    type: 'google' | 'simple';
    nameColumns: number[];
    phoneColumns: number[];
    emailColumn: number;
}

function detectColumnMapping(headers: string[]): ColumnMapping {
    // Detecta formato Google Contacts
    const hasGoogleFormat = headers.some(h => h.includes('first name') || h.includes('phone 1 - value'));

    if (hasGoogleFormat) {
        const nameColumns: number[] = [];
        const phoneColumns: number[] = [];
        let emailColumn = -1;

        headers.forEach((h, idx) => {
            // Colunas de nome
            if (h === 'first name' || h === 'middle name' || h === 'last name') {
                nameColumns.push(idx);
            }
            // Colunas de telefone (Phone 1 - Value até Phone 5 - Value)
            if (h.match(/phone \d+ - value/)) {
                phoneColumns.push(idx);
            }
            // Email
            if (h === 'e-mail 1 - value' || h === 'email 1 - value') {
                emailColumn = idx;
            }
        });

        return { type: 'google', nameColumns, phoneColumns, emailColumn };
    }

    // Formato simples (nome, telefone, email)
    const nameColumn = headers.findIndex(h =>
        h.includes('nome') || h.includes('name') || h === 'contato'
    );
    const phoneColumn = headers.findIndex(h =>
        h.includes('telefone') || h.includes('phone') || h.includes('celular') || h.includes('whatsapp')
    );
    const emailColumn = headers.findIndex(h =>
        h.includes('email') || h.includes('e-mail')
    );

    return {
        type: 'simple',
        nameColumns: nameColumn >= 0 ? [nameColumn] : [],
        phoneColumns: phoneColumn >= 0 ? [phoneColumn] : [],
        emailColumn,
    };
}

/**
 * Extrai nome das colunas do Google Contacts
 */
function extractGoogleName(row: string[], nameColumns: number[]): string {
    const parts = nameColumns
        .map(idx => row[idx] || '')
        .filter(part => part.trim())
        .map(part => part.trim());

    return parts.join(' ') || 'Sem nome';
}

/**
 * Hook para gerenciar contatos e importação
 * 
 * Story 3.1 - Importação de Contatos via CSV/Excel
 * Story 3.2 - Sanitização Automática de Telefones
 */
export function useContacts(): UseContactsReturn {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [isBusy, setIsBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);
    const [parseProgress, setParseProgress] = useState<ParseProgress | null>(null);

    const contactsQuery = useQuery({
        queryKey: ['contacts', user?.id],
        enabled: Boolean(user?.id),
        queryFn: async () => {
            if (!user?.id) return [];
            const q = query(collection(db, 'clients', user.id, 'contacts'), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map((docSnapshot) => {
                const data = docSnapshot.data() as Contact;
                return {
                    ...data,
                    id: docSnapshot.id,
                    initials: data.initials || generateInitials(data.name),
                    color: data.color || generateColor(data.name),
                };
            });
        },
        initialData: [],
    });

    useEffect(() => {
        if (!user?.id) return;

        const q = query(collection(db, 'clients', user.id, 'contacts'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loadedContacts = snapshot.docs.map((docSnapshot) => {
                const data = docSnapshot.data() as Contact;
                return {
                    ...data,
                    id: docSnapshot.id,
                    initials: data.initials || generateInitials(data.name),
                    color: data.color || generateColor(data.name),
                };
            });
            queryClient.setQueryData(['contacts', user.id], loadedContacts);
        }, () => {
            setError('Erro ao carregar contatos.');
        });

        return () => unsubscribe();
    }, [queryClient, user?.id]);

    /**
     * Parse e valida arquivo de contatos
     */
    const parseFile = useCallback(async (file: File): Promise<ImportResult> => {
        setIsBusy(true);
        setError(null);
        setParseProgress({ stage: 'reading', percent: 10, message: 'Lendo arquivo...' });

        try {
            // Ler arquivo
            const text = await file.text();

            setParseProgress({ stage: 'parsing', percent: 30, message: 'Analisando dados...' });

            // Parse CSV com suporte a RFC 4180
            const { headers, rows } = parseCSV(text);

            if (headers.length === 0 || rows.length === 0) {
                throw new Error('Arquivo vazio ou formato inválido');
            }

            // Detectar formato e mapear colunas
            const mapping = detectColumnMapping(headers);


            if (mapping.phoneColumns.length === 0) {
                throw new Error('Coluna de telefone não encontrada. Colunas disponíveis: ' + headers.slice(0, 10).join(', '));
            }

            setParseProgress({ stage: 'validating', percent: 50, message: 'Validando números...' });

            // Processar cada linha
            const importedContacts: ImportedContact[] = [];
            const errors: string[] = [];
            const seenPhones = new Set<string>(); // Para evitar duplicatas

            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];

                // Extrair nome
                const name = mapping.type === 'google'
                    ? extractGoogleName(row, mapping.nameColumns)
                    : (row[mapping.nameColumns[0]] || `Contato ${i + 1}`);

                // Extrair email
                const email = mapping.emailColumn >= 0 ? row[mapping.emailColumn] : undefined;

                // Processar cada coluna de telefone (Google pode ter até 5)
                for (const phoneIdx of mapping.phoneColumns) {
                    const rawPhone = row[phoneIdx];

                    // Pular se vazio
                    if (!rawPhone || !rawPhone.trim()) continue;

                    const { formatted, isValid, error: validationError } = sanitizePhone(rawPhone);

                    // Evitar duplicatas
                    if (seenPhones.has(formatted)) continue;
                    seenPhones.add(formatted);

                    importedContacts.push({
                        name: name || 'Sem nome',
                        phone: formatted,
                        rawPhone: rawPhone.trim(),
                        email,
                        isValid,
                        validationError,
                    });
                }

                // Atualizar progresso
                if (i % 100 === 0) {
                    setParseProgress({
                        stage: 'validating',
                        percent: 50 + Math.floor((i / rows.length) * 40),
                        message: `Validando ${i + 1} de ${rows.length} linhas...`,
                    });
                }
            }

            const validContacts = importedContacts.filter(c => c.isValid);
            const invalidContacts = importedContacts.filter(c => !c.isValid);

            const result: ImportResult = {
                total: importedContacts.length,
                valid: validContacts.length,
                invalid: invalidContacts.length,
                contacts: validContacts,
                invalidContacts,
                errors,
            };

            setImportResult(result);
            setParseProgress({ stage: 'complete', percent: 100, message: 'Análise concluída!' });
            setIsBusy(false);


            return result;

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao processar arquivo';
            setError(errorMessage);
            setParseProgress({ stage: 'error', percent: 0, message: errorMessage });
            setIsBusy(false);
            throw err;
        }
    }, []);

    /**
     * Confirma importação e adiciona contatos à lista
     */
    const confirmImport = useCallback(async (categoryId?: string) => {
        if (!importResult || !user?.id) return;

        setIsBusy(true);

        try {
            const batch = writeBatch(db);
            const contactsRef = collection(db, 'clients', user.id, 'contacts');

            importResult.contacts.forEach((imported) => {
                const docRef = doc(contactsRef);
                batch.set(docRef, {
                    name: imported.name,
                    phone: imported.phone,
                    email: imported.email || '',
                    initials: generateInitials(imported.name),
                    color: generateColor(imported.name),
                    tags: [],
                    categoryIds: categoryId ? [categoryId] : [],
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });
            });

            await batch.commit();

            // Limpar estado de importação
            setImportResult(null);
            setParseProgress(null);


        } finally {
            setIsBusy(false);
        }
    }, [importResult, user?.id]);

    /**
     * Cancela importação em andamento
     */
    const cancelImport = useCallback(() => {
        setImportResult(null);
        setParseProgress(null);
        setError(null);
    }, []);

    /**
     * Adiciona contato individual
     */
    const addContact = useCallback(async (contactData: Omit<Contact, 'id' | 'initials' | 'color'>) => {
        if (!user?.id) return;

        try {
            // Remove campos undefined (Firestore não aceita)
            const cleanData = Object.fromEntries(
                Object.entries(contactData).filter(([, v]) => v !== undefined)
            );

            await addDoc(collection(db, 'clients', user.id, 'contacts'), {
                ...cleanData,
                initials: generateInitials(contactData.name),
                color: generateColor(contactData.name),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
        } catch (err) {
            setError('Erro ao adicionar contato.');
            throw err;
        }
    }, [user?.id]);

    /**
     * Atualiza contato existente
     */
    const updateContact = useCallback(async (id: string, data: Partial<Contact>) => {
        if (!user?.id) return;
        try {
            // Remove campos undefined (Firestore não aceita)
            const cleanData = Object.fromEntries(
                Object.entries(data).filter(([, v]) => v !== undefined)
            );

            await updateDoc(doc(db, 'clients', user.id, 'contacts', id), {
                ...cleanData,
                updatedAt: serverTimestamp()
            });
        } catch (err) {
            setError('Erro ao atualizar contato.');
            throw err;
        }
    }, [user?.id]);

    /**
     * Remove contato
     */
    const deleteContact = useCallback(async (id: string) => {
        if (!user?.id) return;
        try {
            await deleteDoc(doc(db, 'clients', user.id, 'contacts', id));
        } catch (err) {
            setError('Erro ao excluir contato.');
            throw err;
        }
    }, [user?.id]);

    // Story 3.4 - Estado de seleção
    const [selectedContacts, setSelectedContacts] = useState<string[]>([]);

    /**
     * Toggle seleção de um contato
     */
    const toggleContactSelection = useCallback((contactId: string) => {
        setSelectedContacts(prev =>
            prev.includes(contactId)
                ? prev.filter(id => id !== contactId)
                : [...prev, contactId]
        );
    }, []);

    /**
     * Seleciona todos os contatos
     */
    const selectAllContacts = useCallback(() => {
        setSelectedContacts(contactsQuery.data.map(c => c.id));
    }, [contactsQuery.data]);

    /**
     * Limpa seleção
     */
    const clearSelection = useCallback(() => {
        setSelectedContacts([]);
    }, []);

    /**
     * Story 3.4 - Atribui categoria a contatos
     * Adiciona categoryId ao array de categoryIds dos contatos selecionados
     */
    const assignCategory = useCallback(async (contactIds: string[], categoryId: string) => {
        if (!user?.id) return;
        const batch = writeBatch(db);

        contactIds.forEach((contactId) => {
            const contactRef = doc(db, 'clients', user.id, 'contacts', contactId);
            const existing = contactsQuery.data.find((contact) => contact.id === contactId);
            const currentCategories = existing?.categoryIds || [];
            if (currentCategories.includes(categoryId)) return;

            batch.update(contactRef, {
                categoryIds: [...currentCategories, categoryId],
                updatedAt: serverTimestamp(),
            });
        });

        await batch.commit();
    }, [contactsQuery.data, user?.id]);

    /**
     * Story 3.4 - Remove categoria de contatos
     */
    const removeCategory = useCallback(async (contactIds: string[], categoryId: string) => {
        if (!user?.id) return;
        const batch = writeBatch(db);

        contactIds.forEach((contactId) => {
            const contactRef = doc(db, 'clients', user.id, 'contacts', contactId);
            const existing = contactsQuery.data.find((contact) => contact.id === contactId);
            const currentCategories = existing?.categoryIds || [];

            batch.update(contactRef, {
                categoryIds: currentCategories.filter((id) => id !== categoryId),
                updatedAt: serverTimestamp(),
            });
        });

        await batch.commit();
    }, [contactsQuery.data, user?.id]);

    /**
     * Story 3.4 - Define categorias de contatos (substitui todas)
     */
    const setCategoryForContacts = useCallback(async (contactIds: string[], categoryIds: string[]) => {
        if (!user?.id) return;
        const batch = writeBatch(db);

        contactIds.forEach((contactId) => {
            const contactRef = doc(db, 'clients', user.id, 'contacts', contactId);
            batch.update(contactRef, {
                categoryIds,
                updatedAt: serverTimestamp(),
            });
        });

        await batch.commit();
    }, [user?.id]);

    return {
        contacts: contactsQuery.data,
        isLoading: contactsQuery.isLoading || isBusy,
        error,
        importResult,
        parseProgress,
        parseFile,
        confirmImport,
        cancelImport,
        addContact,
        updateContact,
        deleteContact,
        // Story 3.4
        assignCategory,
        removeCategory,
        setCategoryForContacts,
        selectedContacts,
        toggleContactSelection,
        selectAllContacts,
        clearSelection,
    };
}

// Contexto para compartilhar estado globalmente
import { createContext, useContext, ReactNode } from 'react';

interface ContactsContextType extends UseContactsReturn { }

const ContactsContext = createContext<ContactsContextType | null>(null);

interface ContactsProviderProps {
    children: ReactNode;
}

export function ContactsProvider({ children }: ContactsProviderProps) {
    const contactsState = useContacts();

    return (
        <ContactsContext.Provider value={contactsState}>
            {children}
        </ContactsContext.Provider>
    );
}

export function useContactsContext(): ContactsContextType {
    const context = useContext(ContactsContext);
    if (!context) {
        throw new Error('useContactsContext deve ser usado dentro de ContactsProvider');
    }
    return context;
}
