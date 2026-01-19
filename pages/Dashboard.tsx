import React from 'react';
import { Campaign } from '../types';
import { useInstanceStatusContext } from '../hooks/useInstanceStatus';
import { useCampaignsContext } from '../hooks/useCampaigns';
import { DisconnectionBanner, DisconnectionToast } from '../components/ui/DisconnectionAlert';
import { useDisconnectionHandler } from '../hooks/useDisconnectionHandler';

const Dashboard = () => {
  // Hooks para detecção de desconexão (Story 2.3)
  const { status } = useInstanceStatusContext();
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

        {[
          {
            title: 'Mensagens Enviadas',
            value: '12,450',
            icon: 'send',
            color: 'blue',
            change: '+12%',
            trend: 'up',
          },
          {
            title: 'Fila Pendente',
            value: '340',
            icon: 'hourglass_top',
            color: 'amber',
            change: '+2%',
            trend: 'up',
          },
          {
            title: 'Taxa de Entrega',
            value: '98.5%',
            icon: 'done_all',
            color: 'primary',
            change: '+0.5%',
            trend: 'up',
          },
          {
            title: 'Falhas',
            value: '15',
            icon: 'error',
            color: 'red',
            change: '-1%',
            trend: 'down',
          },
        ].map((stat, i) => (
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
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800">
              <div className="size-2 bg-primary rounded-full animate-pulse"></div>
              <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-400">
                Conectado
              </span>
            </div>
          </div>
          <div className="p-6 flex flex-col items-center justify-center flex-1 gap-6 bg-slate-50/50 dark:bg-slate-800/20">
            <div className="relative size-32 bg-white p-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center">
              <div
                className="w-full h-full bg-contain bg-center bg-no-repeat opacity-20"
                style={{
                  backgroundImage:
                    "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDFdp_pHN2djc1ImWF6uCpPXTutOKbabz8ey3mYJL7d9zoIT_Nsvvujg5KysHIUwBMnVKSnoqm2BqPUyBC5ss0X_JboVlZczCvF5xZbB_XqcbH30KoRBwba2-xYTGlJD577lgzMScQno4uuNZHFhAB5-lb9abI5kGtq3crfq_Jjt833S0ovxIEKhFfMF9s1ZZ5g9umy0xYgI2p3LEJ5ajaiyS8Aa37KqG8Pl5FIhGMjR26vEjhDReS7rjH_LLaoex6G3qOzNADLgJPj')",
                }}
              ></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-emerald-600">
                  check_circle
                </span>
              </div>
            </div>
            <div className="text-center">
              <p className="font-semibold text-slate-900 dark:text-white text-lg">
                Vendas_Time_01
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Última sinc.: há 2 min
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                +55 (11) 98765-4321
              </p>
            </div>
          </div>
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-white border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              <span className="material-symbols-outlined text-[18px]">
                refresh
              </span>{' '}
              Sincronizar
            </button>
            <button className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-white border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
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