import { useNavigate, useLocation } from 'react-router-dom';
import { useCampaignsContext } from '../hooks/useCampaigns';
import { NewCampaignModal } from '../components/campaigns/NewCampaignModal';
import { useUI } from '../hooks/useUI';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Campaigns = () => {
  const navigate = useNavigate();
  const { isNewCampaignModalOpen, setIsNewCampaignModalOpen } = useUI();
  const { campaigns, toggleCampaignStatus, deleteCampaign } = useCampaignsContext();

  // ... (manter funções auxiliares)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Enviando':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-100 dark:border-blue-800/50">
            <span className="size-1.5 rounded-full bg-blue-500 animate-pulse"></span>{' '}
            Enviando
          </span>
        );
      case 'Concluído':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800/50">
            Concluído
          </span>
        );
      case 'Pausado':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-100 dark:border-amber-800/50">
            Pausado
          </span>
        );
      case 'Agendado':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
            <span className="material-symbols-outlined text-[14px]">event</span>
            Agendado
          </span>
        );
      case 'Erro':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 border border-red-100 dark:border-red-800/50">
            <span className="material-symbols-outlined text-[14px]">error</span>
            Erro
          </span>
        );
      default:
        return null;
    }
  };

  const getProgressBarColor = (status: string) => {
    switch (status) {
      case 'Concluído': return 'bg-emerald-500';
      case 'Pausado': return 'bg-amber-400';
      case 'Agendado': return 'bg-slate-300 dark:bg-slate-600';
      case 'Erro': return 'bg-red-500';
      default: return 'bg-primary';
    }
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6">

      <div className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex gap-3 w-full sm:w-auto flex-1">
          <div className="relative flex-1 max-w-sm">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-[20px]">
              search
            </span>
            <input
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-slate-400"
              placeholder="Buscar por nome..."
              type="text"
            />
          </div>
          <div className="relative">
            <select className="appearance-none pl-4 pr-10 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer min-w-[160px]">
              <option value="all">Status: Todos</option>
              <option value="sending">Enviando</option>
              <option value="completed">Concluído</option>
              <option value="paused">Pausado</option>
              <option value="scheduled">Agendado</option>
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none material-symbols-outlined text-[20px]">
              expand_more
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title="Atualizar"
            aria-label="Atualizar lista de campanhas"
          >
            <span className="material-symbols-outlined text-[20px]">
              refresh
            </span>
          </button>
          <button
            className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title="Exportar"
            aria-label="Exportar campanhas"
          >
            <span className="material-symbols-outlined text-[20px]">
              download
            </span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50">
                <th className="p-4 pl-6 text-xs font-semibold text-slate-500 uppercase tracking-wider w-1/4">
                  Nome
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-[120px]">
                  Status
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-[150px]">
                  Data
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-1/3 min-w-[200px]">
                  Progresso
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right pr-6 w-[80px]">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {campaigns.map((camp) => (
                <tr
                  key={camp.id}
                  onClick={() => navigate(`/campaigns/${camp.id}`)}
                  className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                >
                  <td className="p-4 pl-6">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        {camp.name}
                      </span>
                      <span className="text-xs text-slate-400">ID: {camp.id}</span>
                    </div>
                  </td>
                  <td className="p-4">{getStatusBadge(camp.status)}</td>
                  <td className="p-4">
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      {camp.date}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-700 dark:text-slate-300">
                          {camp.sent} / {camp.total}
                        </span>
                        <span className={camp.progress === 0 ? "text-slate-500" : "text-primary-dark dark:text-primary"}>
                          {camp.progress}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                        <div
                          className={`${getProgressBarColor(camp.status)} h-2 rounded-full transition-all duration-1000`}
                          style={{ width: `${camp.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-2">
                      {(camp.status === 'Enviando' || camp.status === 'Pausado') && (
                        <button
                          onClick={() => toggleCampaignStatus(camp.id, camp.status)}
                          className="p-2 text-slate-400 hover:text-primary dark:hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                          title={camp.status === 'Enviando' ? "Pausar" : "Retomar"}
                          aria-label={camp.status === 'Enviando' ? "Pausar campanha" : "Retomar campanha"}
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            {camp.status === 'Enviando' ? 'pause' : 'play_arrow'}
                          </span>
                        </button>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors outline-none focus:ring-2 focus:ring-primary/20"
                            aria-label="Mais ações"
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              more_vert
                            </span>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[160px]">
                          <DropdownMenuItem onClick={() => navigate(`/campaigns/${camp.id}`)}>
                            <span className="material-symbols-outlined text-[18px] mr-2">visibility</span>
                            Ver detalhes
                          </DropdownMenuItem>

                          {(camp.status === 'Enviando' || camp.status === 'Pausado') && (
                            <DropdownMenuItem onClick={() => toggleCampaignStatus(camp.id, camp.status)}>
                              <span className="material-symbols-outlined text-[18px] mr-2">
                                {camp.status === 'Enviando' ? 'pause' : 'play_arrow'}
                              </span>
                              {camp.status === 'Enviando' ? 'Pausar' : 'Retomar'}
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuItem
                            className="text-red-600 dark:text-red-400 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-900/20"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm('Tem certeza que deseja excluir esta campanha?')) {
                                deleteCampaign(camp.id);
                              }
                            }}
                          >
                            <span className="material-symbols-outlined text-[18px] mr-2">delete</span>
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Mostrando{' '}
            <span className="font-medium text-slate-900 dark:text-white">1</span>{' '}
            a <span className="font-medium text-slate-900 dark:text-white">{campaigns.length > 5 ? 5 : campaigns.length}</span>{' '}
            de{' '}
            <span className="font-medium text-slate-900 dark:text-white">{campaigns.length}</span>{' '}
            resultados
          </span>
          <div className="flex items-center gap-2">
            <button
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled
              aria-label="Pagina anterior"
            >
              <span className="material-symbols-outlined text-[20px]">
                chevron_left
              </span>
            </button>
            <button
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Proxima pagina"
            >
              <span className="material-symbols-outlined text-[20px]">
                chevron_right
              </span>
            </button>
          </div>
        </div>
      </div>

      <NewCampaignModal
        isOpen={isNewCampaignModalOpen}
        onClose={() => setIsNewCampaignModalOpen(false)}
      />
    </div>
  );
};

export default Campaigns;
