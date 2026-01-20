import { useState, useCallback, useEffect, useMemo } from 'react';
import { Campaign, CampaignPauseInfo } from '../types';
import { db, functions } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, Timestamp, where, getDocs, deleteDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';

interface UseCampaignsReturn {
    campaigns: Campaign[];
    activeCampaigns: Campaign[];
    pausedByDisconnection: CampaignPauseInfo[];
    pauseActiveCampaigns: (reason: Campaign['pauseReason']) => CampaignPauseInfo[];
    resumePausedCampaigns: () => void;
    addCampaign: (data: Partial<Campaign>) => void;
    toggleCampaignStatus: (id: string, currentStatus: string) => void;
    deleteCampaign: (id: string) => Promise<void>;
    isProcessing: boolean;
    error: string | null;
}

/**
 * Hook para gerenciar campanhas com integração Realtime ao Firestore.
 */
export function useCampaigns(): UseCampaignsReturn {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [pausedByDisconnection, setPausedByDisconnection] = useState<CampaignPauseInfo[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Helper: Map status
    const mapFirebaseStatusToUi = (status: string): Campaign['status'] => {
        const map: Record<string, Campaign['status']> = {
            'draft': 'Agendado', // UI treats draft as pre-launch usually
            'scheduled': 'Agendado',
            'sending': 'Enviando',
            'paused': 'Pausado',
            'completed': 'Concluído',
            'failed': 'Erro'
        };
        return map[status] || 'Agendado';
    };

    const calculateProgress = (stats: { total?: number; sent?: number } | undefined): number => {
        if (!stats || !stats.total || stats.total === 0) return 0;
        return Math.round((stats.sent / stats.total) * 100);
    };

    const mapCampaign = (id: string, data: Record<string, unknown>): Campaign => {
        const createdAt = data.createdAt as { toDate?: () => Date } | undefined;
        const scheduledAt = data.scheduledAt as { toDate?: () => Date } | undefined;
        const stats = data.stats as { total?: number; sent?: number; failed?: number } | undefined;
        const total = stats?.total || (data.total as number) || 0;
        const sent = stats?.sent || 0;
        const failed = stats?.failed || (data.failed as number) || 0;
        const pending = Math.max(0, total - sent - failed);

        return {
            id,
            name: data.name as string,
            status: mapFirebaseStatusToUi(data.status as string),
            date: createdAt?.toDate
                ? createdAt.toDate().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
                : 'N/A',
            progress: calculateProgress(stats),
            total: total,
            sent: sent,
            failed: failed,
            pending: pending,
            scheduledAt: scheduledAt?.toDate ? scheduledAt.toDate().toISOString() : undefined,
            pauseReason: data.pauseReason as Campaign['pauseReason'],
            targetCategoryIds: data.targetCategoryIds as string[] | undefined,
            content: data.content as string | undefined,
        };
    };

    const campaignsQuery = useQuery({
        queryKey: ['campaigns', user?.id],
        enabled: Boolean(user?.id),
        queryFn: async () => {
            if (!user?.id) return [];
            const q = query(
                collection(db, 'campaigns'),
                where('ownerId', '==', user.id),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map((docSnapshot) => mapCampaign(docSnapshot.id, docSnapshot.data()));
        },
        initialData: [],
    });

    useEffect(() => {
        if (!user?.id) return;

        const q = query(
            collection(db, 'campaigns'),
            where('ownerId', '==', user.id),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const campaignsData = snapshot.docs.map((docSnapshot) =>
                mapCampaign(docSnapshot.id, docSnapshot.data())
            );
            queryClient.setQueryData(['campaigns', user.id], campaignsData);
        }, () => {
            setError('Falha ao carregar campanhas.');
        });

        return () => unsubscribe();
    }, [queryClient, user?.id]);

    const activeCampaigns = useMemo(
        () => campaignsQuery.data.filter(c => c.status === 'Enviando'),
        [campaignsQuery.data]
    );

    /**
     * Pausa todas as campanhas ativas localmente e no backend (se desconexão)
     */
    const pauseActiveCampaigns = useCallback((reason: Campaign['pauseReason']): CampaignPauseInfo[] => {
        setIsProcessing(true);
        setError(null);
        const pausedInfo: CampaignPauseInfo[] = [];

        // Pause in backend
        activeCampaigns.forEach(async (campaign) => {
            try {
                await updateDoc(doc(db, 'campaigns', campaign.id), {
                    status: 'paused',
                    pauseReason: reason,
                    pausedAt: Timestamp.now()
                });

                pausedInfo.push({
                    campaignId: campaign.id,
                    campaignName: campaign.name,
                    pausedAt: new Date().toISOString(),
                    lastContactIndex: campaign.sent,
                    totalContacts: campaign.total,
                    reason,
                });
            } catch (err) {
                setError('Falha ao pausar campanhas.');
            }
        });

        setPausedByDisconnection(pausedInfo);
        setIsProcessing(false);
        return pausedInfo;
    }, [activeCampaigns]);

    /**
     * Retoma campanhas pausadas
     */
    const resumePausedCampaigns = useCallback(() => {
        setIsProcessing(true);
        setError(null);
        pausedByDisconnection.forEach(async (info) => {
            try {
                await updateDoc(doc(db, 'campaigns', info.campaignId), {
                    status: 'sending',
                    pauseReason: null,
                    pausedAt: null
                });
            } catch (err) {
                setError('Falha ao retomar campanhas.');
            }
        });
        setPausedByDisconnection([]);
        setIsProcessing(false);
    }, [pausedByDisconnection]);

    /**
     * Pausar/Retomar manual (Dashboard)
     */
    const toggleCampaignStatus = useCallback(async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'Enviando' ? 'paused' : 'sending'; // Firebase status keys
        try {
            await updateDoc(doc(db, 'campaigns', id), {
                status: newStatus,
                pauseReason: newStatus === 'paused' ? 'manual' : null
            });
        } catch (err) {
            setError('Erro ao atualizar status da campanha.');
        }
    }, []);

    /**
     * Adiciona nova campanha via Cloud Function
     */
    const addCampaign = useCallback(async (data: Partial<Campaign>) => {
        setIsProcessing(true);
        setError(null);
        try {
            const createCampaignFn = httpsCallable(functions, 'createCampaign');
            const payload = {
                name: data.name,
                content: data.content,
                targetCategoryIds: data.targetCategoryIds,
                targetContactList: data.targetContactList, // Story 5.5
                targetContactIds: data.targetContactIds, // Story 5.1
                scheduledAt: data.scheduledAt ? new Date(data.scheduledAt).toISOString() : null,
                mediaUrl: data.mediaUrl,
                mediaType: data.mediaType,
                total: data.total,
                status: data.status // Enviar status explicito (sending/scheduled)
            };

            await createCampaignFn(payload);
            // No need to update state manually, onSnapshot will handle it
        } catch (error) {
            setError('Erro ao criar campanha.');
        } finally {
            setIsProcessing(false);
        }
    }, []);

    /**
     * Exclui campanha
     */
    const deleteCampaign = useCallback(async (id: string) => {
        setIsProcessing(true);
        setError(null);
        try {
            await deleteDoc(doc(db, 'campaigns', id));
        } catch (err) {
            setError('Erro ao excluir campanha.');
            console.error(err);
        } finally {
            setIsProcessing(false);
        }
    }, []);

    return {
        campaigns: campaignsQuery.data,
        activeCampaigns,
        pausedByDisconnection,
        pauseActiveCampaigns,
        resumePausedCampaigns,
        addCampaign,
        toggleCampaignStatus,
        deleteCampaign,
        isProcessing,
        error,
    };
}

// Context Boilerplate
import { createContext, useContext, ReactNode } from 'react';

interface CampaignsContextType extends UseCampaignsReturn { }

const CampaignsContext = createContext<CampaignsContextType | null>(null);

interface CampaignsProviderProps {
    children: ReactNode;
}

export function CampaignsProvider({ children }: CampaignsProviderProps) {
    const campaignsState = useCampaigns();

    return (
        <CampaignsContext.Provider value={campaignsState}>
            {children}
        </CampaignsContext.Provider>
    );
}

export function useCampaignsContext(): CampaignsContextType {
    const context = useContext(CampaignsContext);
    if (!context) {
        throw new Error('useCampaignsContext deve ser usado dentro de CampaignsProvider');
    }
    return context;
}
