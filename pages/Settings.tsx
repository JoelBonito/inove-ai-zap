import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { updateProfile } from 'firebase/auth';
import { auth } from '../lib/firebase';

type SettingsTab = 'profile' | 'api' | 'notifications' | 'security';

interface TabConfig {
  id: SettingsTab;
  label: string;
  icon: string;
  adminOnly?: boolean;
}

const Settings = () => {
  const { isAdmin, user } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  // Estado do formulário de perfil
  const [profileForm, setProfileForm] = useState({
    displayName: '',
    email: '',
    phone: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Carrega dados do usuário ao montar
  useEffect(() => {
    if (user) {
      setProfileForm({
        displayName: user.displayName || '',
        email: user.email || '',
        phone: '', // Firestore field (to be implemented)
      });
    }
  }, [user]);

  // Salva alterações do perfil
  const handleSaveProfile = async () => {
    if (!auth.currentUser) return;

    setIsSaving(true);
    setSaveMessage(null);

    try {
      await updateProfile(auth.currentUser, {
        displayName: profileForm.displayName,
      });
      setSaveMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'Erro ao salvar alterações. Tente novamente.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Configuração das tabs - API só aparece para admin
  const tabs: TabConfig[] = [
    { id: 'profile', label: 'Perfil', icon: 'person' },
    { id: 'api', label: 'API', icon: 'api', adminOnly: true },
    { id: 'notifications', label: 'Notificações', icon: 'notifications' },
    { id: 'security', label: 'Segurança', icon: 'lock' },
  ];

  // Filtra tabs baseado em permissões
  const visibleTabs = tabs.filter(tab => !tab.adminOnly || isAdmin);

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
      {/* Tabs Navigation */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav aria-label="Tabs" className="-mb-px flex space-x-8">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium flex items-center gap-2 transition-colors ${activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                }`}
            >
              <span className="material-symbols-outlined text-[20px]">
                {tab.icon}
              </span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex flex-col gap-6">
        {/* Profile Tab Content */}
        {activeTab === 'profile' && (
          <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Informações do Perfil
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Atualize os detalhes pessoais da sua conta.
              </p>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div
                    className="size-20 rounded-full bg-slate-200 dark:bg-slate-700 bg-cover bg-center ring-4 ring-slate-50 dark:ring-slate-800 flex items-center justify-center text-2xl font-bold text-slate-500 dark:text-slate-400"
                    style={user?.avatarUrl ? {
                      backgroundImage: `url('${user.avatarUrl}')`,
                    } : undefined}
                  >
                    {!user?.avatarUrl && (user?.displayName?.[0]?.toUpperCase() || 'U')}
                  </div>
                </div>
                <div>
                  <h4 className="text-base font-semibold text-slate-900 dark:text-white">
                    Sua Foto
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    A foto é importada da sua conta Google.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label
                    className="text-sm font-semibold text-slate-700 dark:text-slate-300"
                    htmlFor="fullName"
                  >
                    Nome Completo
                  </label>
                  <input
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:border-primary focus:ring-primary shadow-sm text-sm px-3 py-2"
                    id="fullName"
                    type="text"
                    value={profileForm.displayName}
                    onChange={(e) => setProfileForm({ ...profileForm, displayName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label
                    className="text-sm font-semibold text-slate-700 dark:text-slate-300"
                    htmlFor="email"
                  >
                    Endereço de E-mail
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <span className="material-symbols-outlined text-[18px]">
                        mail
                      </span>
                    </span>
                    <input
                      className="w-full pl-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 cursor-not-allowed shadow-sm text-sm px-3 py-2"
                      id="email"
                      type="email"
                      value={profileForm.email}
                      disabled
                      title="O email não pode ser alterado"
                    />
                  </div>
                  <p className="text-xs text-slate-400">
                    O email está vinculado à sua conta Google e não pode ser alterado.
                  </p>
                </div>
              </div>

              {/* Mensagem de feedback */}
              {saveMessage && (
                <div className={`p-3 rounded-lg flex items-center gap-2 ${saveMessage.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                  }`}>
                  <span className="material-symbols-outlined text-[18px]">
                    {saveMessage.type === 'success' ? 'check_circle' : 'error'}
                  </span>
                  {saveMessage.text}
                </div>
              )}
            </div>
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
              <button
                onClick={() => {
                  if (user) {
                    setProfileForm({
                      displayName: user.displayName || '',
                      email: user.email || '',
                      phone: '',
                    });
                  }
                  setSaveMessage(null);
                }}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-slate-900 dark:bg-primary rounded-lg hover:bg-slate-800 dark:hover:bg-primary-dark transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving && (
                  <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                )}
                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        )}

        {/* API Tab Content - Admin Only */}
        {activeTab === 'api' && isAdmin && (
          <div
            className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
            id="api-section"
          >
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Credenciais da API (Admin)
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Configure as chaves UAZAPI para cada cliente.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-100 dark:border-amber-800">
                <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
                <span className="text-xs font-bold">Admin Only</span>
              </span>
            </div>
            <div className="p-6 space-y-6">
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 flex gap-3">
                <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 flex-shrink-0">
                  info
                </span>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Esta seção é visível apenas para administradores. Configure as credenciais UAZAPI dos clientes aqui.
                </p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    ID da Instância UAZAPI
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        className="w-full font-mono text-sm rounded-lg border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 focus:ring-0 focus:border-slate-300"
                        readOnly
                        type="text"
                        value="inst_8293_vendas_01"
                      />
                    </div>
                    <button
                      className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 hover:text-primary hover:border-primary dark:hover:border-primary transition-all group"
                      title="Copiar"
                    >
                      <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">
                        content_copy
                      </span>
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Token de Acesso UAZAPI
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1 group">
                      <input
                        className="w-full font-mono text-sm rounded-lg border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 focus:ring-0 focus:border-slate-300 tracking-widest"
                        readOnly
                        type="password"
                        value="wh_1234567890abcdefghijklmnopqrstuvwxyz"
                      />
                      <button className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                        <span className="material-symbols-outlined text-[18px]">
                          visibility
                        </span>
                      </button>
                    </div>
                    <button
                      className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 hover:text-primary hover:border-primary dark:hover:border-primary transition-all group"
                      title="Copiar"
                    >
                      <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">
                        content_copy
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab Content */}
        {activeTab === 'notifications' && (
          <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Preferências de Notificação
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Configure como e quando receber alertas do sistema.
              </p>
            </div>
            <div className="p-6 space-y-6">
              {[
                { id: 'campaign_start', label: 'Início de Campanha', desc: 'Ser notificado quando uma campanha iniciar', enabled: true },
                { id: 'campaign_end', label: 'Fim de Campanha', desc: 'Alerta ao concluir o envio de mensagens', enabled: true },
                { id: 'disconnection', label: 'Desconexão do WhatsApp', desc: 'Alerta imediato se o celular desconectar', enabled: true },
                { id: 'low_battery', label: 'Bateria Baixa', desc: 'Aviso quando a bateria estiver abaixo de 15%', enabled: false },
                { id: 'error_alert', label: 'Erros de Envio', desc: 'Notificar quando houver falhas na campanha', enabled: true },
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">{item.label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked={item.enabled} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-primary"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Security Tab Content */}
        {activeTab === 'security' && (
          <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Segurança da Conta
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Gerencie sua senha e configurações de segurança.
              </p>
            </div>
            <div className="p-6 space-y-6">
              {/* Alterar Senha */}
              <div className="space-y-4">
                <h4 className="font-semibold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-slate-400">key</span>
                  Alterar Senha
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Senha Atual</label>
                    <input type="password" className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:border-primary focus:ring-primary shadow-sm text-sm" placeholder="••••••••" />
                  </div>
                  <div></div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Nova Senha</label>
                    <input type="password" className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:border-primary focus:ring-primary shadow-sm text-sm" placeholder="••••••••" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Confirmar Nova Senha</label>
                    <input type="password" className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:border-primary focus:ring-primary shadow-sm text-sm" placeholder="••••••••" />
                  </div>
                </div>
                <button className="px-4 py-2 text-sm font-medium text-white bg-slate-900 dark:bg-primary rounded-lg hover:bg-slate-800 dark:hover:bg-primary-dark transition-colors shadow-sm">
                  Atualizar Senha
                </button>
              </div>

              <hr className="border-slate-100 dark:border-slate-800" />

              {/* Sessões Ativas */}
              <div className="space-y-4">
                <h4 className="font-semibold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-slate-400">devices</span>
                  Sessões Ativas
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-emerald-500">computer</span>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">Este dispositivo</p>
                        <p className="text-xs text-slate-500">Chrome no macOS • Ativo agora</p>
                      </div>
                    </div>
                    <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded">Atual</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;