import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, onSnapshot, collection, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';

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
    startedAt?: Timestamp | null;
    completedAt?: Timestamp | null;
    lastContactIndex?: number;
}

interface SendLog {
    id: string;
    contactName: string;
    contactPhone: string;
    status: 'sent' | 'failed';
    messageId?: string;
    errorMessage?: string;
    sentAt: Timestamp | null;
}

export const CampaignDetails: React.FC = () => {
    const { campaignId } = useParams<{ campaignId: string }>();
    const navigate = useNavigate();

    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [logs, setLogs] = useState<SendLog[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'logs'>('overview');
    const [selectedLog, setSelectedLog] = useState<SendLog | null>(null);

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
                                    onClick={() => setSelectedLog(log)}
                                    className={`flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${log.status === 'failed' ? 'bg-red-50/50 dark:bg-red-900/10' : ''
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
            {/* Dialog Log Detalhes - Redesign Premium */}
            <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
                <DialogContent className="p-0 overflow-hidden max-w-md bg-white dark:bg-surface-dark border-0 shadow-2xl rounded-2xl">

                    {/* Header Colorido */}
                    <div className={`p-6 flex flex-col items-center justify-center text-center gap-3 ${selectedLog?.status === 'sent'
                        ? 'bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-900/20 dark:to-surface-dark'
                        : 'bg-gradient-to-b from-red-50 to-white dark:from-red-900/20 dark:to-surface-dark'
                        }`}>
                        <div className={`size-16 rounded-full flex items-center justify-center shadow-sm mb-1 ${selectedLog?.status === 'sent'
                            ? 'bg-emerald-100/80 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400'
                            : 'bg-red-100/80 text-red-600 dark:bg-red-900/50 dark:text-red-400'
                            }`}>
                            <span className="material-symbols-outlined text-3xl">
                                {selectedLog?.status === 'sent' ? 'check_circle' : 'warning'}
                            </span>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                {selectedLog?.status === 'sent' ? 'Mensagem Enviada' : 'Falha no Envio'}
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                {selectedLog?.sentAt?.toDate?.()?.toLocaleString('pt-BR', {
                                    dateStyle: 'full',
                                    timeStyle: 'medium'
                                }) || 'Data desconhecida'}
                            </p>
                        </div>
                    </div>

                    <div className="px-6 pb-6 space-y-6">
                        {/* Info Contato */}
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 flex items-center gap-4 border border-slate-100 dark:border-slate-800">
                            <div className="size-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 font-bold text-sm">
                                {selectedLog?.contactName.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-slate-900 dark:text-white truncate">
                                    {selectedLog?.contactName}
                                </p>
                                <p className="text-sm text-slate-500 font-mono">
                                    {selectedLog?.contactPhone}
                                </p>
                            </div>
                        </div>

                        {/* Diagnóstico de Erro (Se houver falha) */}
                        {selectedLog?.status === 'failed' && (
                            <div className="space-y-3">
                                <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-xl p-4">
                                    <div className="flex items-start gap-3">
                                        <span className="material-symbols-outlined text-red-500 mt-0.5">
                                            manage_search
                                        </span>
                                        <div>
                                            <h4 className="font-semibold text-red-900 dark:text-red-300 text-sm">
                                                Diagnóstico
                                            </h4>
                                            <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                                                {(() => {
                                                    const err = (selectedLog.errorMessage || '').toLowerCase();
                                                    if (err.includes('not on whatsapp') || err.includes('exists: false')) return 'Este número não possui uma conta de WhatsApp válida.';
                                                    if (err.includes('timeout')) return 'O envio demorou muito e expirou. Pode ser instabilidade na conexão.';
                                                    if (err.includes('disconnected') || err.includes('closed')) return 'A instância estava desconectada no momento do envio.';
                                                    if (err.includes('invalid_jid') || err.includes('invalid jid')) return 'O formato do número (JID) está inválido.';
                                                    if (err.includes('rate-limit') || err.includes('rate limit')) return 'Limite de envio excedido. O sistema aguardará antes de tentar novamente.';
                                                    if (err.includes('block') || err.includes('spam')) return 'Possível bloqueio ou denúncia de spam detectado.';
                                                    return 'Ocorreu um erro técnico não identificado durante o processamento.';
                                                })()}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Erro Técnico (Expansível ou Pequeno) */}
                                <div className="group">
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                                        Log Técnico Original
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(selectedLog.errorMessage || '');
                                            }}
                                            className="text-primary hover:text-primary-dark transition-colors flex items-center gap-1 text-[10px] normal-case bg-primary/10 px-2 py-0.5 rounded-full"
                                        >
                                            <span className="material-symbols-outlined text-[12px]">content_copy</span>
                                            Copiar
                                        </button>
                                    </p>
                                    <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-3 font-mono text-xs text-slate-600 dark:text-slate-400 break-all border border-slate-200 dark:border-slate-800 max-h-24 overflow-y-auto">
                                        {selectedLog.errorMessage || 'Sem detalhes técnicos.'}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ID da Mensagem (Se sucesso) */}
                        {selectedLog?.status === 'sent' && selectedLog.messageId && (
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    ID da Transação
                                </label>
                                <p className="font-mono text-xs bg-slate-50 dark:bg-slate-800 p-2 rounded mt-1 text-slate-600 break-all border border-slate-100 dark:border-slate-700">
                                    {selectedLog.messageId}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 flex justify-between items-center border-t border-slate-100 dark:border-slate-800">
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">info</span>
                            ID: {selectedLog?.id.substring(0, 8)}...
                        </span>
                        <button
                            onClick={() => setSelectedLog(null)}
                            className="px-6 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-white rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 font-medium transition-colors shadow-sm"
                        >
                            Fechar Detalhes
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CampaignDetails;
