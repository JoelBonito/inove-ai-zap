import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ConnectionStatus, CampaignPauseInfo } from '../../types';

interface DisconnectionBannerProps {
    status: ConnectionStatus;
    pausedCampaigns: CampaignPauseInfo[];
    onReconnect?: () => void;
    className?: string;
}

/**
 * Banner de alerta global de desconexão - Story 2.3
 * 
 * Exibe quando o WhatsApp está desconectado e há campanhas pausadas.
 * Mostra:
 * - Mensagem clara: "WhatsApp desconectado. Envio pausado."
 * - Lista de campanhas afetadas
 * - Botão para reconectar
 */
export const DisconnectionBanner: React.FC<DisconnectionBannerProps> = ({
    status,
    pausedCampaigns,
    onReconnect,
    className = '',
}) => {
    const navigate = useNavigate();

    // Só mostra se desconectado e há campanhas pausadas por desconexão
    if (status !== 'disconnected' || pausedCampaigns.length === 0) {
        return null;
    }

    const handleReconnect = () => {
        if (onReconnect) {
            onReconnect();
        }
        navigate('/connection');
    };

    return (
        <div
            className={`
        bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800
        rounded-xl p-4 animate-pulse-slow
        ${className}
      `}
            role="alert"
            aria-live="assertive"
        >
            <div className="flex items-start gap-4">
                {/* Ícone */}
                <div className="flex-shrink-0 p-2 bg-red-100 dark:bg-red-900/40 rounded-lg">
                    <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-2xl">
                        wifi_off
                    </span>
                </div>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                    <h4 className="text-red-800 dark:text-red-200 font-bold text-base mb-1">
                        WhatsApp desconectado. Envio pausado.
                    </h4>
                    <p className="text-red-600 dark:text-red-300 text-sm mb-3">
                        {pausedCampaigns.length === 1
                            ? 'Uma campanha foi pausada automaticamente para proteger seus envios.'
                            : `${pausedCampaigns.length} campanhas foram pausadas automaticamente para proteger seus envios.`
                        }
                    </p>

                    {/* Lista de campanhas pausadas */}
                    <div className="space-y-2 mb-4">
                        {pausedCampaigns.map((campaign) => (
                            <div
                                key={campaign.campaignId}
                                className="flex items-center justify-between bg-white/60 dark:bg-slate-800/60 rounded-lg px-3 py-2"
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="material-symbols-outlined text-amber-500 text-[18px]">
                                        pause_circle
                                    </span>
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                                        {campaign.campaignName}
                                    </span>
                                </div>
                                <span className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0 ml-2">
                                    {campaign.lastContactIndex} / {campaign.totalContacts} enviados
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleReconnect}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-sm transition-colors shadow-lg shadow-red-200 dark:shadow-none"
                        >
                            <span className="material-symbols-outlined text-[18px]">qr_code_2</span>
                            Reconectar Agora
                        </button>
                        <span className="text-xs text-red-500 dark:text-red-400">
                            Os envios serão retomados automaticamente após reconexão.
                        </span>
                    </div>
                </div>

                {/* Badge de contagem */}
                <div className="flex-shrink-0 flex flex-col items-center">
                    <div className="size-12 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                        <span className="text-red-600 dark:text-red-300 font-bold text-lg">
                            {pausedCampaigns.length}
                        </span>
                    </div>
                    <span className="text-xs text-red-500 dark:text-red-400 mt-1">
                        pausada{pausedCampaigns.length > 1 ? 's' : ''}
                    </span>
                </div>
            </div>
        </div>
    );
};

/**
 * Toast de notificação de desconexão - aparece brevemente quando detecta desconexão
 */
interface DisconnectionToastProps {
    show: boolean;
    pausedCount: number;
    onDismiss: () => void;
}

export const DisconnectionToast: React.FC<DisconnectionToastProps> = ({
    show,
    pausedCount,
    onDismiss,
}) => {
    if (!show) return null;

    return (
        <div
            className={`
        fixed bottom-6 right-6 z-50
        bg-red-600 text-white rounded-xl shadow-2xl p-4
        flex items-center gap-3 max-w-md
        animate-slide-up
      `}
            role="alert"
        >
            <span className="material-symbols-outlined text-2xl animate-pulse">wifi_off</span>
            <div className="flex-1">
                <p className="font-bold">Conexão perdida!</p>
                <p className="text-sm text-red-100">
                    {pausedCount > 0
                        ? `${pausedCount} campanha(s) pausada(s) automaticamente.`
                        : 'Reconecte para continuar enviando.'
                    }
                </p>
            </div>
            <button
                onClick={onDismiss}
                className="p-1 hover:bg-red-500 rounded-full transition-colors"
                aria-label="Fechar"
            >
                <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
        </div>
    );
};

/**
 * Indicador compacto para o header quando há campanhas pausadas por desconexão
 */
interface PausedCampaignsBadgeProps {
    count: number;
    onClick?: () => void;
}

export const PausedCampaignsBadge: React.FC<PausedCampaignsBadgeProps> = ({
    count,
    onClick,
}) => {
    if (count === 0) return null;

    return (
        <button
            onClick={onClick}
            className="flex items-center gap-1.5 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-full hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
            title={`${count} campanha(s) pausada(s)`}
        >
            <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-[16px]">
                pause_circle
            </span>
            <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                {count}
            </span>
        </button>
    );
};

export default DisconnectionBanner;
