import { useState, useEffect, useCallback, useRef } from 'react';
import { ConnectionStatus, InstanceInfo, DisconnectionEvent } from '../types';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './useAuth';

interface UseInstanceStatusReturn {
  status: ConnectionStatus;
  previousStatus: ConnectionStatus | null;
  instanceInfo: InstanceInfo;
  isLoading: boolean;
  error: string | null;
  // Story 2.3 - Detecção de desconexão
  lastDisconnection: DisconnectionEvent | null;
  wasRecentlyDisconnected: boolean;
  // Ações
  refresh: () => Promise<void>;
  disconnect: () => void;
  clearDisconnectionFlag: () => void;
  // Callbacks para integração
  onStatusChange?: (newStatus: ConnectionStatus, oldStatus: ConnectionStatus) => void;
  // Função para simular mudança de status (será substituída por webhook real)
  simulateStatusChange: (newStatus: ConnectionStatus) => void;
}

// Estado inicial da instância (vazio até carregar do Firestore)
const initialInstanceInfo: InstanceInfo = {
  id: '',
  name: '',
  phone: null,
  status: 'disconnected',
  lastSync: null,
  battery: undefined,
  isCharging: undefined,
};

/**
 * Hook para gerenciar o status da instância WhatsApp em tempo real.
 * 
 * Story 2.3 - Detecção Automática de Perda de Conexão:
 * - Detecta quando status muda para 'disconnected'
 * - Mantém histórico do último evento de desconexão
 * - Permite callbacks para reagir à mudança de status
 *
 * Em produção, este hook irá:
 * 1. Conectar-se ao Firestore para ouvir mudanças no documento da instância
 * 2. Receber atualizações via webhooks da UAZAPI
 * 3. Atualizar o estado automaticamente quando o status mudar
 */
export function useInstanceStatus(): UseInstanceStatusReturn {
  const { user } = useAuth();
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [previousStatus, setPreviousStatus] = useState<ConnectionStatus | null>(null);
  const [instanceInfo, setInstanceInfo] = useState<InstanceInfo>(initialInstanceInfo);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Story 2.3 - Estado de desconexão
  const [lastDisconnection, setLastDisconnection] = useState<DisconnectionEvent | null>(null);
  const [wasRecentlyDisconnected, setWasRecentlyDisconnected] = useState(false);

  // Ref para callbacks externos
  const statusChangeCallbackRef = useRef<((newStatus: ConnectionStatus, oldStatus: ConnectionStatus) => void) | undefined>();

  /**
   * Detecta transição para desconectado e registra evento.
   * Esta é a implementação central da Story 2.3.
   */
  const handleStatusTransition = useCallback((newStatus: ConnectionStatus, oldStatus: ConnectionStatus) => {
    // Detecta desconexão (transição de connected/connecting para disconnected)
    if (newStatus === 'disconnected' && oldStatus !== 'disconnected') {
      const disconnectionEvent: DisconnectionEvent = {
        timestamp: new Date().toISOString(),
        reason: 'webhook', // Em produção, virá do tipo de evento
        lastKnownStatus: oldStatus,
        affectedCampaigns: [], // Será preenchido pelo useCampaigns
      };

      setLastDisconnection(disconnectionEvent);
      setWasRecentlyDisconnected(true);

    }

    // Detecta reconexão
    if (newStatus === 'connected' && oldStatus === 'disconnected') {
      // Não limpa wasRecentlyDisconnected aqui - permite UI mostrar status de recuperação
    }

    // Chama callback externo se registrado
    if (statusChangeCallbackRef.current) {
      statusChangeCallbackRef.current(newStatus, oldStatus);
    }
  }, []);

  // Atualiza o status e informações relacionadas
  const updateStatus = useCallback((newStatus: ConnectionStatus, additionalInfo?: Partial<InstanceInfo>) => {
    setStatus(prevStatus => {
      // Só processa se houve mudança real
      if (prevStatus !== newStatus) {
        setPreviousStatus(prevStatus);
        handleStatusTransition(newStatus, prevStatus);
      }
      return newStatus;
    });

    setInstanceInfo(prev => ({
      ...prev,
      status: newStatus,
      lastSync: newStatus === 'connected' ? 'agora' : prev.lastSync,
      ...additionalInfo,
    }));
  }, [handleStatusTransition]);

  // Busca status atual da instância (será chamada da UAZAPI)
  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Substituir por chamada real à UAZAPI
      // const response = await fetch(`${UAZAPI_BASE_URL}/instance/status`);
      // const data = await response.json();

      // Simula delay de API
      await new Promise(resolve => setTimeout(resolve, 800));

      // Mock: mantém status atual (em produção virá da API)
      setInstanceInfo(prev => ({
        ...prev,
        lastSync: 'agora',
      }));
    } catch (err) {
      setError('Falha ao verificar status da instância');
      console.error('Erro ao buscar status:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Desconecta a instância
  const disconnect = useCallback(() => {
    updateStatus('disconnected', {
      phone: null,
      battery: undefined,
      isCharging: undefined,
    });
  }, [updateStatus]);

  // Limpa flag de desconexão recente (após usuário ver o alerta)
  const clearDisconnectionFlag = useCallback(() => {
    setWasRecentlyDisconnected(false);
  }, []);

  // Função para simular mudança de status (desenvolvimento)
  const simulateStatusChange = useCallback((newStatus: ConnectionStatus) => {
    if (newStatus === 'connected') {
      updateStatus('connected', {
        phone: '+55 (11) 98765-4321',
        battery: 85,
        isCharging: false,
      });
    } else if (newStatus === 'connecting') {
      updateStatus('connecting');
    } else {
      disconnect();
    }
  }, [updateStatus, disconnect]);

  useEffect(() => {
    if (!user?.id) return;

    // Escutar coleção 'instances' (onde os dados UAZAPI são salvos)
    const unsubscribe = onSnapshot(doc(db, 'instances', user.id), (snapshot) => {
      const data = snapshot.data();
      if (!data) return;

      // Mapear campos do Firestore para o estado local
      const newStatus = (data.status as ConnectionStatus) || 'disconnected';

      updateStatus(newStatus, {
        id: snapshot.id,
        name: data.name || data.instanceName || '',
        phone: data.phone || null,
        profilePicUrl: data.profilePicUrl || undefined,
        lastSync: data.lastSync?.toDate ? data.lastSync.toDate().toISOString() : 'agora',
      });
    });

    return () => unsubscribe();
  }, [updateStatus, user?.id]);

  return {
    status,
    previousStatus,
    instanceInfo,
    isLoading,
    error,
    lastDisconnection,
    wasRecentlyDisconnected,
    refresh,
    disconnect,
    clearDisconnectionFlag,
    simulateStatusChange,
  };
}

// Contexto para compartilhar status globalmente
import { createContext, useContext, ReactNode } from 'react';

interface InstanceStatusContextType extends UseInstanceStatusReturn { }

const InstanceStatusContext = createContext<InstanceStatusContextType | null>(null);

interface InstanceStatusProviderProps {
  children: ReactNode;
}

export function InstanceStatusProvider({ children }: InstanceStatusProviderProps) {
  const instanceStatus = useInstanceStatus();

  return (
    <InstanceStatusContext.Provider value={instanceStatus}>
      {children}
    </InstanceStatusContext.Provider>
  );
}

export function useInstanceStatusContext(): InstanceStatusContextType {
  const context = useContext(InstanceStatusContext);
  if (!context) {
    throw new Error('useInstanceStatusContext deve ser usado dentro de InstanceStatusProvider');
  }
  return context;
}
