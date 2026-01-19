import React from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { NavItem } from '../types';
import { StatusIndicator } from './ui/StatusIndicator';
import { useInstanceStatusContext } from '../hooks/useInstanceStatus';
import { useUI } from '../hooks/useUI';

const navItems: NavItem[] = [
  {
    label: 'Painel',
    icon: 'dashboard',
    path: '/',
    description: 'Veja o resumo das suas atividades e estatísticas.'
  },
  {
    label: 'Conexão',
    icon: 'qr_code_2',
    path: '/connection',
    description: 'Gerencie o status da conexão da sua instância WhatsApp.'
  },
  {
    label: 'Campanhas',
    icon: 'send',
    path: '/campaigns',
    description: 'Crie e gerencie seus disparos em massa.'
  },
  {
    label: 'Contatos',
    icon: 'contacts',
    path: '/contacts',
    description: 'Organize e segmente sua base de leads e clientes.'
  },
  {
    label: 'Configurações',
    icon: 'settings',
    path: '/settings',
    description: 'Ajuste suas preferências e dados da conta.'
  },
];

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useUI();

  return (
    <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-surface-dark flex flex-col justify-between transition-all duration-300 ease-in-out`}>
      <div className="flex flex-col gap-6 p-4">
        <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-center'} py-2 relative group cursor-pointer`}>
          {/* Logo container with hover effect */}
          <div className="absolute inset-0 bg-primary/10 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <img
            src="/public/logo.jpg"
            alt="Inove AI Zap"
            className={`${isSidebarCollapsed ? 'w-10' : 'w-20'} h-auto rounded-xl shadow-md object-contain relative z-10 transition-all duration-300 group-hover:scale-105`}
          />
        </div>

        <div className="relative -mx-4">
          <hr className="border-slate-200 dark:border-slate-700 mx-4" />
          {/* Botão de toggle posicionado exatamente na borda direita da sidebar e no separador */}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 size-7 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary shadow-sm transition-all hover:scale-110 active:scale-95 z-30"
            title={isSidebarCollapsed ? "Expandir Menu" : "Recolher Menu"}
          >
            <span className="material-symbols-outlined text-[18px]">
              {isSidebarCollapsed ? 'chevron_right' : 'chevron_left'}
            </span>
          </button>
        </div>
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative overflow-hidden ${isActive
                  ? 'bg-gradient-to-r from-primary/10 to-primary/5 text-primary-dark dark:text-primary font-semibold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                  }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full"></div>
                )}
                <span
                  className={`material-symbols-outlined transition-all duration-300 ${isActive ? 'text-primary' : 'text-slate-400 group-hover:text-primary'
                    }`}
                >
                  {item.icon}
                </span>
                {!isSidebarCollapsed && (
                  <span className={`text-sm tracking-wide ${isActive ? 'translate-x-1' : 'group-hover:translate-x-1'} transition-transform duration-300 whitespace-nowrap`}>
                    {item.label}
                  </span>
                )}
                {isSidebarCollapsed && (
                  /* Tooltip manual para quando estiver colapsado */
                  <div className="absolute left-full ml-4 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} w-full group relative`}>
          <div
            className="size-9 rounded-full bg-slate-200 dark:bg-slate-700 bg-cover bg-center ring-2 ring-white dark:ring-slate-800 shadow-sm shrink-0"
            style={{
              backgroundImage:
                "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBqA7lgl7knnTWLEjpYJx1IIZP6588uJuI1q-NHWBkFIJMlDNbsL3cZymzQIyHXl1yRqqijGbhU8qIvHZHgRKcI_3Gfesw-aE8iD0i6SEC8b1zwdOjSu9HyZy61cNEMRGFaYR2vzyjh_wyw4lW5yYBNohVXsZysfjn36ZWW9pN7QNWlg5r6HWpynPAxXNX9xiBpqmeI0IAk78DzkesYpyeAw1eQG_xVXbUJqtqWx1BZ851Atppu9Eadt_oC2lwMGhyyHFwkfwXv2dqf')",
            }}
          ></div>
          {!isSidebarCollapsed && (
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-bold text-slate-900 dark:text-white truncate">Alex Morgan</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 truncate">Líder de Marketing</span>
            </div>
          )}
          {!isSidebarCollapsed && (
            <button
              onClick={() => navigate('/login')}
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors shrink-0"
              title="Sair"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          )}

          {isSidebarCollapsed && (
            <div className="absolute left-full ml-4 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 flex flex-col gap-0.5">
              <span className="font-bold">Alex Morgan</span>
              <span className="text-[10px] text-slate-400">Líder de Marketing</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { status, refresh, isLoading: instanceLoading } = useInstanceStatusContext();
  const {
    setIsNewCampaignModalOpen,
    setIsNewContactModalOpen
  } = useUI();

  const currentItem = navItems.find((item) => item.path === location.pathname);

  const getActionButtons = () => {
    const commonStyle = "flex items-center gap-2 bg-primary hover:bg-primary-dark text-slate-900 px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 shrink-0";

    switch (location.pathname) {
      case '/':
      case '/campaigns':
        return (
          <button onClick={() => setIsNewCampaignModalOpen(true)} className={commonStyle}>
            <span className="material-symbols-outlined text-[20px]">add</span>
            Nova Campanha
          </button>
        );
      case '/connection':
        return (
          <button onClick={refresh} disabled={instanceLoading} className={commonStyle}>
            <span className={`material-symbols-outlined text-[20px] ${instanceLoading ? 'animate-spin' : ''}`}>sync</span>
            Atualizar Status
          </button>
        );
      case '/contacts':
        return (
          <button onClick={() => setIsNewContactModalOpen(true)} className={commonStyle}>
            <span className="material-symbols-outlined text-[20px]">person_add</span>
            Adicionar Contatos
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <header className="h-16 flex items-center justify-between px-8 bg-transparent flex-shrink-0 z-10 border-b border-transparent">
      <div className="flex flex-col justify-center">
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">
            {currentItem?.label || 'Painel'}
          </h1>
          {currentItem?.description && (
            <span className="hidden sm:inline-block text-sm text-slate-400 dark:text-slate-500 italic font-medium border-l-2 border-slate-200 dark:border-slate-700 pl-3">
              {currentItem.description}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Indicador de Status WhatsApp */}
        <button
          onClick={() => navigate('/connection')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
          title={status === 'connected' ? 'WhatsApp conectado' : 'Clique para conectar WhatsApp'}
        >
          <StatusIndicator status={status} size="sm" showLabel={true} />
        </button>

        <button className="relative p-2 text-slate-400 hover:text-primary dark:hover:text-white transition-colors rounded-full hover:bg-slate-50 dark:hover:bg-slate-800">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-1 right-2 size-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
        </button>

        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>

        {/* Botão de Ação Dinâmico - Movido para o final da topbar */}
        <div className="flex items-center">
          {getActionButtons()}
        </div>
      </div>
    </header>
  );
};

export const Layout = () => {
  return (
    <div className="flex h-screen w-full">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <Header />
        <div className="flex-1 overflow-y-auto p-8 bg-background-light dark:bg-background-dark">
          <Outlet />
        </div>
      </main>
    </div>
  );
};