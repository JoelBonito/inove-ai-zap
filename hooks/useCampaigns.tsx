import { useState, useCallback, useEffect } from 'react';
import { Campaign, CampaignPauseInfo } from '../types';
import { db, functions } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

interface UseCampaignsReturn {
    campaigns: Campaign[];
    activeCampaigns: Campaign[];
    pausedByDisconnection: CampaignPauseInfo[];
    pauseActiveCampaigns: (reason: Campaign['pauseReason']) => CampaignPauseInfo[];
    resumePausedCampaigns: () => void;
    addCampaign: (data: Partial<Campaign>) => void;
    toggleCampaignStatus: (id: string, currentStatus: string) => void;
    isProcessing: boolean;
}

/**
 * Hook para gerenciar campanhas com integração Realtime ao Firestore.
 */
export function useCampaigns(): UseCampaignsReturn {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [pausedByDisconnection, setPausedByDisconnection] = useState<CampaignPauseInfo[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    // Initial load & Realtime subscription
    useEffect(() => {
        const q = query(collection(db, 'campaigns'), orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const campaignsData: Campaign[] = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    name: data.name,
                    status: mapFirebaseStatusToUi(data.status),
                    // Format date from Timestamp or fallback
                    date: data.createdAt?.toDate
                        ? data.createdAt.toDate().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
                        : 'N/A',
                    progress: calculateProgress(data.stats),
                    total: data.stats?.total || data.total || 0,
                    sent: data.stats?.sent || 0,
                    scheduledAt: data.scheduledAt?.toDate ? data.scheduledAt.toDate().toISOString() : undefined,
                    pauseReason: data.pauseReason,
                    targetCategoryIds: data.targetCategoryIds,
                    content: data.content,
                } as Campaign;
            });
            setCampaigns(campaignsData);
        }, (error) => {
            console.error("Error listening to campaigns:", error);
        });

        return () => unsubscribe();
    }, []);

    const activeCampaigns = campaigns.filter(c => c.status === 'Enviando');

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

    const calculateProgress = (stats: any): number => {
        if (!stats || !stats.total || stats.total === 0) return 0;
        return Math.round((stats.sent / stats.total) * 100);
    };

    /**
     * Pausa todas as campanhas ativas localmente e no backend (se desconexão)
     */
    const pauseActiveCampaigns = useCallback((reason: Campaign['pauseReason']): CampaignPauseInfo[] => {
        setIsProcessing(true);
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
                console.error(`Failed to pause campaign ${campaign.id}`, err);
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
        pausedByDisconnection.forEach(async (info) => {
            try {
                await updateDoc(doc(db, 'campaigns', info.campaignId), {
                    status: 'sending',
                    pauseReason: null,
                    pausedAt: null
                });
            } catch (err) {
                console.error(`Failed to resume campaign ${info.campaignId}`, err);
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
            console.error("Error toggling status:", err);
            alert("Erro ao atualizar status da campanha.");
        }
    }, []);

    /**
     * Adiciona nova campanha via Cloud Function
     */
    const addCampaign = useCallback(async (data: Partial<Campaign>) => {
        setIsProcessing(true);
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
                total: data.total
            };

            await createCampaignFn(payload);
            // No need to update state manually, onSnapshot will handle it
        } catch (error) {
            console.error('Error creating campaign:', error);
            alert('Erro ao criar campanha. Verifique o console.');
        } finally {
            setIsProcessing(false);
        }
    }, []);

    return {
        campaigns,
        activeCampaigns,
        pausedByDisconnection,
        pauseActiveCampaigns,
        resumePausedCampaigns,
        addCampaign,
        toggleCampaignStatus,
        isProcessing,
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
