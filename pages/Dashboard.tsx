import React from 'react';
import { Campaign } from '../types';
import { useInstanceStatusContext } from '../hooks/useInstanceStatus';
import { useCampaignsContext } from '../hooks/useCampaigns';
import { DisconnectionBanner, DisconnectionToast } from '../components/ui/DisconnectionAlert';
import { useDisconnectionHandler } from '../hooks/useDisconnectionHandler';

const Dashboard = () => {
  // Hooks para detecção de desconexão (Story 2.3)
  const { status, instanceInfo, refresh: refreshInstance, isLoading: instanceLoading } = useInstanceStatusContext();
  const { campaigns, pausedByDisconnection } = useCampaignsContext();
  const { showToast, dismissToast } = useDisconnectionHandler();

  // Usa campanhas do context (em vez de dados locais)
  const recentCampaigns = campaigns.slice(0, 3);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Enviando':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'Concluído':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'Pausado':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-8">
      {/* Story 2.3 - Banner de desconexão com campanhas pausadas */}
      <DisconnectionBanner
        status={status}
        pausedCampaigns={pausedByDisconnection}
      />

      {/* Story 2.3 - Toast de notificação de desconexão */}
      <DisconnectionToast
        show={showToast}
        pausedCount={pausedByDisconnection.length}
        onDismiss={dismissToast}
      />

      {/* Header removido para cleanup visual */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

        {/* Stats calculados a partir das campanhas reais */}
        {(() => {
          // Calcula estatísticas reais das campanhas
          const totalSent = campaigns.reduce((acc, c) => acc + (c.sent || 0), 0);
          const totalPending = campaigns.reduce((acc, c) => acc + (c.pending || 0), 0);
          const totalFailed = campaigns.reduce((acc, c) => acc + (c.failed || 0), 0);
          const deliveryRate = totalSent > 0 ? ((totalSent - totalFailed) / totalSent * 100).toFixed(1) : '0';

          return [
            {
              title: 'Mensagens Enviadas',
              value: totalSent.toLocaleString('pt-BR'),
              icon: 'send',
              color: 'blue',
              change: campaigns.length > 0 ? `${campaigns.length} campanhas` : 'Nenhuma campanha',
              trend: 'up',
            },
            {
              title: 'Fila Pendente',
              value: totalPending.toLocaleString('pt-BR'),
              icon: 'hourglass_top',
              color: 'amber',
              change: totalPending > 0 ? 'Em processamento' : 'Fila vazia',
              trend: totalPending > 0 ? 'up' : 'down',
            },
            {
              title: 'Taxa de Entrega',
              value: `${deliveryRate}%`,
              icon: 'done_all',
              color: 'primary',
              change: totalSent > 0 ? 'Calculado' : 'Sem dados',
              trend: 'up',
            },
            {
              title: 'Falhas',
              value: totalFailed.toLocaleString('pt-BR'),
              icon: 'error',
              color: 'red',
              change: totalFailed === 0 ? 'Nenhuma falha' : 'Requer atenção',
              trend: totalFailed === 0 ? 'down' : 'up',
            },
          ];
        })().map((stat, i) => (
          <div
            key={i}
            className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4 group hover:border-primary/50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div
                className={`p-2 rounded-lg ${stat.color === 'primary'
                  ? 'bg-primary/10 text-primary-dark'
                  : `bg-${stat.color}-50 dark:bg-${stat.color}-900/20 text-${stat.color}-600 dark:text-${stat.color}-400`
                  }`}
              >
                <span className="material-symbols-outlined">{stat.icon}</span>
              </div>
              <span
                className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${stat.trend === 'up' && stat.color !== 'red'
                  ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
                  : 'text-red-600 bg-red-50 dark:bg-red-900/20'
                  }`}
              >
                <span className="material-symbols-outlined text-[14px] mr-1">
                  {stat.trend === 'up' ? 'trending_up' : 'trending_down'}
                </span>
                {stat.change}
              </span>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">
                {stat.title}
              </p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                {stat.value}
              </h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* QR Code Card */}
        <div className="lg:col-span-1 bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">
              Status da Instância
            </h3>
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${status === 'connected'
              ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800'
              : status === 'connecting'
                ? 'bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800'
                : 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800'
              }`}>
              <div className={`size-2 rounded-full ${status === 'connected' ? 'bg-primary animate-pulse' :
                status === 'connecting' ? 'bg-amber-500 animate-pulse' : 'bg-red-500'
                }`}></div>
              <span className={`text-xs font-semibold ${status === 'connected' ? 'text-emerald-800 dark:text-emerald-400' :
                status === 'connecting' ? 'text-amber-800 dark:text-amber-400' :
                  'text-red-800 dark:text-red-400'
                }`}>
                {status === 'connected' ? 'Conectado' : status === 'connecting' ? 'Conectando...' : 'Desconectado'}
              </span>
            </div>
          </div>
          <div className="p-6 flex flex-col items-center justify-center flex-1 gap-6 bg-slate-50/50 dark:bg-slate-800/20">
            <div className="relative size-32 bg-white dark:bg-slate-800 p-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`material-symbols-outlined text-4xl ${status === 'connected' ? 'text-emerald-600' :
                  status === 'connecting' ? 'text-amber-500 animate-spin' : 'text-red-500'
                  }`}>
                  {status === 'connected' ? 'check_circle' : status === 'connecting' ? 'sync' : 'error'}
                </span>
              </div>
            </div>
            <div className="text-center">
              <p className="font-semibold text-slate-900 dark:text-white text-lg">
                {instanceInfo.name || 'Instância não configurada'}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Última sinc.: {instanceInfo.lastSync
                  ? new Date(instanceInfo.lastSync).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                  : 'Nunca'
                }
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                {instanceInfo.phone || 'Sem número vinculado'}
              </p>
            </div>
          </div>
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3">
            <button
              onClick={refreshInstance}
              disabled={instanceLoading}
              className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-[18px] ${instanceLoading ? 'animate-spin' : ''}`}>
                refresh
              </span>{' '}
              Sincronizar
            </button>
            <button className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              <span className="material-symbols-outlined text-[18px]">
                settings
              </span>{' '}
              Gerenciar
            </button>
          </div>
        </div>

        {/* Recent Campaigns Table */}
        <div className="lg:col-span-2 bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-wrap justify-between items-center gap-4">
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                Campanhas Recentes
              </h3>
              <p className="text-sm text-slate-500">
                Monitore suas transmissões de mensagens ativas
              </p>
            </div>

          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <th className="p-4 pl-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Nome da Campanha
                  </th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-1/3">
                    Progresso
                  </th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right pr-6">
                    Ação
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentCampaigns.map((campaign) => (
                  <tr
                    key={campaign.id}
                    className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="p-4 pl-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          {campaign.name}
                        </span>
                        <span className="text-xs text-slate-400">
                          Criado: {campaign.date}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${getStatusStyle(
                          campaign.status
                        )}`}
                      >
                        {campaign.status === 'Enviando' && (
                          <span className="size-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                        )}
                        {campaign.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-slate-700 dark:text-slate-300">
                            {campaign.sent} / {campaign.total}
                          </span>
                          <span
                            className={
                              campaign.status === 'Pausado'
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-primary-dark dark:text-primary'
                            }
                          >
                            {campaign.progress}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                          <div
                            className={`${campaign.status === 'Concluído'
                              ? 'bg-emerald-500'
                              : campaign.status === 'Pausado'
                                ? 'bg-amber-400'
                                : 'bg-primary'
                              } h-2 rounded-full`}
                            style={{ width: `${campaign.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <button className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                        <span className="material-symbols-outlined text-[20px]">
                          more_vert
                        </span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-center">
            <button className="text-sm font-medium text-slate-500 hover:text-primary transition-colors flex items-center gap-1">
              Ver Todas as Campanhas{' '}
              <span className="material-symbols-outlined text-[16px]">
                arrow_forward
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;