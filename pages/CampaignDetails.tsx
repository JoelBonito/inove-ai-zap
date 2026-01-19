import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, onSnapshot, collection, query, orderBy, limit } from 'firebase/firestore';

interface Campaign {
    id: string;
    name: string;
    status: string;
    content: string;
    stats: {
        total: number;
        sent: number;
        failed: number;
    };
    startedAt?: any;
    completedAt?: any;
    lastContactIndex?: number;
}

interface SendLog {
    id: string;
    contactName: string;
    contactPhone: string;
    status: 'sent' | 'failed';
    messageId?: string;
    errorMessage?: string;
    sentAt: any;
}

export const CampaignDetails: React.FC = () => {
    const { campaignId } = useParams<{ campaignId: string }>();
    const navigate = useNavigate();

    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [logs, setLogs] = useState<SendLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'logs'>('overview');

    // Subscribe to campaign updates
    useEffect(() => {
        if (!campaignId) return;

        const unsubCampaign = onSnapshot(
            doc(db, 'campaigns', campaignId),
            (doc) => {
                if (doc.exists()) {
                    setCampaign({ id: doc.id, ...doc.data() } as Campaign);
                }
                setIsLoading(false);
            }
        );

        // Subscribe to send logs (latest 100)
        const logsQuery = query(
            collection(db, 'campaigns', campaignId, 'send_logs'),
            orderBy('sentAt', 'desc'),
            limit(100)
        );

        const unsubLogs = onSnapshot(logsQuery, (snapshot) => {
            const logsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as SendLog));
            setLogs(logsData);
        });

        return () => {
            unsubCampaign();
            unsubLogs();
        };
    }, [campaignId]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!campaign) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                <span className="material-symbols-outlined text-6xl mb-4">search_off</span>
                <p className="text-lg">Campanha não encontrada</p>
                <button
                    onClick={() => navigate('/campaigns')}
                    className="mt-4 text-primary hover:underline"
                >
                    Voltar para Campanhas
                </button>
            </div>
        );
    }

    const progress = campaign.stats?.total > 0
        ? Math.round((campaign.stats.sent / campaign.stats.total) * 100)
        : 0;

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            'sending': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            'completed': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
            'paused': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
            'scheduled': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
            'failed': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        };

        const labels: Record<string, string> = {
            'sending': 'Enviando',
            'completed': 'Concluído',
            'paused': 'Pausado',
            'scheduled': 'Agendado',
            'failed': 'Erro',
        };

        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${styles[status] || styles['scheduled']}`}>
                {status === 'sending' && (
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                )}
                {labels[status] || status}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/campaigns')}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <span className="material-symbols-outlined text-slate-500">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{campaign.name}</h1>
                        <div className="flex items-center gap-3 mt-1">
                            {getStatusBadge(campaign.status)}
                            <span className="text-sm text-slate-500">
                                {campaign.stats?.total || 0} contatos
                            </span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    {campaign.status === 'sending' && (
                        <button className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg flex items-center gap-2 transition-colors">
                            <span className="material-symbols-outlined text-lg">pause</span>
                            Pausar
                        </button>
                    )}
                    {campaign.status === 'paused' && (
                        <button className="px-4 py-2 bg-primary hover:bg-primary-dark text-slate-900 font-semibold rounded-lg flex items-center gap-2 transition-colors">
                            <span className="material-symbols-outlined text-lg">play_arrow</span>
                            Retomar
                        </button>
                    )}
                </div>
            </div>

            {/* Progress Card */}
            <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Progresso</h2>
                    <span className="text-2xl font-bold text-primary">{progress}%</span>
                </div>

                {/* Progress Bar */}
                <div className="relative h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-4">
                    <div
                        className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${campaign.status === 'sending'
                                ? 'bg-gradient-to-r from-blue-500 to-blue-400 animate-pulse'
                                : campaign.status === 'completed'
                                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                                    : 'bg-gradient-to-r from-amber-500 to-amber-400'
                            }`}
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                            {campaign.stats?.sent || 0}
                        </p>
                        <p className="text-xs text-slate-500 uppercase tracking-wider mt-1">Enviados</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-red-500">
                            {campaign.stats?.failed || 0}
                        </p>
                        <p className="text-xs text-slate-500 uppercase tracking-wider mt-1">Falhas</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-slate-400">
                            {(campaign.stats?.total || 0) - (campaign.stats?.sent || 0) - (campaign.stats?.failed || 0)}
                        </p>
                        <p className="text-xs text-slate-500 uppercase tracking-wider mt-1">Pendentes</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'overview'
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                >
                    Visão Geral
                </button>
                <button
                    onClick={() => setActiveTab('logs')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${activeTab === 'logs'
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                >
                    Logs de Envio
                    {logs.length > 0 && (
                        <span className="bg-primary/20 text-primary text-xs px-1.5 py-0.5 rounded-full font-bold">
                            {logs.length}
                        </span>
                    )}
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' ? (
                <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Mensagem</h3>
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                        <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                            {campaign.content}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                            Histórico de Envios (Últimos 100)
                        </h3>
                    </div>

                    {logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                            <span className="material-symbols-outlined text-4xl mb-2">inbox</span>
                            <p className="text-sm">Nenhum envio registrado ainda</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[500px] overflow-y-auto">
                            {logs.map((log) => (
                                <div
                                    key={log.id}
                                    className={`flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${log.status === 'failed' ? 'bg-red-50/50 dark:bg-red-900/10' : ''
                                        }`}
                                >
                                    {/* Status Icon */}
                                    <div className={`p-2 rounded-full ${log.status === 'sent'
                                            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                                            : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                        }`}>
                                        <span className="material-symbols-outlined text-lg">
                                            {log.status === 'sent' ? 'check_circle' : 'error'}
                                        </span>
                                    </div>

                                    {/* Contact Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-slate-900 dark:text-white truncate">
                                            {log.contactName}
                                        </p>
                                        <p className="text-sm text-slate-500 truncate">
                                            {log.contactPhone}
                                        </p>
                                    </div>

                                    {/* Error Message (if failed) */}
                                    {log.status === 'failed' && log.errorMessage && (
                                        <p className="text-xs text-red-500 max-w-[200px] truncate" title={log.errorMessage}>
                                            {log.errorMessage}
                                        </p>
                                    )}

                                    {/* Timestamp */}
                                    <span className="text-xs text-slate-400 whitespace-nowrap">
                                        {log.sentAt?.toDate?.()?.toLocaleTimeString('pt-BR', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        }) || '--:--'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CampaignDetails;
