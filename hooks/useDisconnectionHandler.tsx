import { useEffect, useState, useCallback } from 'react';
import { useInstanceStatusContext } from './useInstanceStatus';
import { useCampaignsContext } from './useCampaigns';
import { CampaignPauseInfo } from '../types';

interface UseDisconnectionHandlerReturn {
    // Estado
    isDisconnected: boolean;
    pausedCampaigns: CampaignPauseInfo[];
    showToast: boolean;

    // Ações
    dismissToast: () => void;
    handleReconnect: () => void;
}

/**
 * Hook que orquestra a detecção de desconexão e pausa automática de campanhas.
 * 
 * Story 2.3 - Implementação dos Critérios de Aceite:
 * 
 * ✅ Given: Uma campanha está em andamento
 * ✅ When: O Webhook da UAZAPI envia status `disconnected`
 * ✅ Then: O Worker pausa a campanha no contato atual
 * ✅ And: O Dashboard exibe alerta: "WhatsApp desconectado. Envio pausado."
 * ✅ And: O campo `lastContactIndex` no Firestore marca o ponto de pausa
 * 
 * Este hook integra:
 * - useInstanceStatusContext: Detecta mudanças de status da instância
 * - useCampaignsContext: Gerencia pausa/retomada de campanhas
 */
export function useDisconnectionHandler(): UseDisconnectionHandlerReturn {
    const {
        status,
        previousStatus,
        wasRecentlyDisconnected,
        clearDisconnectionFlag,
        simulateStatusChange,
    } = useInstanceStatusContext();

    const {
        activeCampaigns,
        pausedByDisconnection,
        pauseActiveCampaigns,
        resumePausedCampaigns,
    } = useCampaignsContext();

    const [showToast, setShowToast] = useState(false);

    /**
     * Efeito que detecta transição para desconectado e pausa campanhas.
     * Este é o coração da Story 2.3.
     */
    useEffect(() => {
        // Detecta transição para desconectado
        if (status === 'disconnected' && previousStatus === 'connected') {
            // Verifica se há campanhas ativas para pausar
            if (activeCampaigns.length > 0) {
                const paused = pauseActiveCampaigns('disconnected');

                if (paused.length > 0) {
                    // Mostra toast de notificação
                    setShowToast(true);

                    // Auto-dismiss após 10 segundos
                    setTimeout(() => setShowToast(false), 10000);
                }
            }
        }
    }, [status, previousStatus, activeCampaigns.length, pauseActiveCampaigns]);

    /**
     * Efeito que detecta reconexão e oferece retomada de campanhas.
     */
    useEffect(() => {
        // Detecta reconexão
        if (status === 'connected' && previousStatus === 'disconnected') {
            if (pausedByDisconnection.length > 0) {
                resumePausedCampaigns();

                // Limpa flag de desconexão
                clearDisconnectionFlag();
            }
        }
    }, [status, previousStatus, pausedByDisconnection.length, resumePausedCampaigns, clearDisconnectionFlag]);

    const dismissToast = useCallback(() => {
        setShowToast(false);
    }, []);

    const handleReconnect = useCallback(() => {
        // Navega para página de conexão (a navegação real é feita pelo componente)
        setShowToast(false);
    }, []);

    return {
        isDisconnected: status === 'disconnected',
        pausedCampaigns: pausedByDisconnection,
        showToast,
        dismissToast,
        handleReconnect,
    };
}

export default useDisconnectionHandler;
