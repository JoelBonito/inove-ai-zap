import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConnectionStatus, QRCodeState } from '../types';
import { StatusIndicator, ConnectionAlert } from '../components/ui/StatusIndicator';
import { useInstanceStatusContext } from '../hooks/useInstanceStatus';
import { useCampaignsContext } from '../hooks/useCampaigns';

const Connection: React.FC = () => {
  const navigate = useNavigate();

  // Hook global de status da instância
  const {
    status: connectionStatus,
    instanceInfo,
    isLoading: isRefreshing,
    refresh,
    simulateStatusChange,
  } = useInstanceStatusContext();

  // Story 2.3 - Campanhas pausadas por desconexão
  const { pausedByDisconnection } = useCampaignsContext();

  // Estado do QR Code (local desta página)
  const [qrCodeState, setQrCodeState] = useState<QRCodeState>({
    code: null,
    loading: false,
    expiresAt: null,
    error: null,
  });

  // Simula geração de QR Code (será substituído por chamada real à UAZAPI)
  const generateQRCode = async () => {
    setQrCodeState(prev => ({ ...prev, loading: true, error: null }));

    // Simula delay de API
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock: Em produção, isso virá da UAZAPI /instance/qrcode
    setQrCodeState({
      code: 'MOCK_QR_CODE_BASE64_DATA',
      loading: false,
      expiresAt: new Date(Date.now() + 60000).toISOString(), // Expira em 60s
      error: null,
    });
  };

  // Simula conexão bem sucedida (será substituído por webhook UAZAPI)
  const handleQRCodeScanned = () => {
    simulateStatusChange('connecting');

    // Simula delay de conexão
    setTimeout(() => {
      simulateStatusChange('connected');
      setQrCodeState(prev => ({ ...prev, code: null }));
    }, 2000);
  };

  // Desconecta a instância
  const handleDisconnect = () => {
    simulateStatusChange('disconnected');
    generateQRCode();
  };

  // Gera QR Code ao montar se desconectado
  useEffect(() => {
    if (connectionStatus === 'disconnected' && !qrCodeState.code && !qrCodeState.loading) {
      generateQRCode();
    }
  }, [connectionStatus]);

  // Timer para expiração do QR Code
  useEffect(() => {
    if (!qrCodeState.expiresAt || connectionStatus === 'connected') return;

    const checkExpiration = setInterval(() => {
      if (new Date() > new Date(qrCodeState.expiresAt!)) {
        setQrCodeState(prev => ({
          ...prev,
          code: null,
          error: 'QR Code expirado. Clique para gerar um novo.',
        }));
      }
    }, 1000);

    return () => clearInterval(checkExpiration);
  }, [qrCodeState.expiresAt, connectionStatus]);

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
      {/* Header da Página */}
      {/* Header simplificado */}


      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Card Principal - QR Code */}
        <div className="lg:col-span-3 bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Header do Card */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <span className="material-symbols-outlined text-primary">
                  qr_code_2
                </span>
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  {connectionStatus === 'connected' ? 'Dispositivo Conectado' : 'Escaneie o QR Code'}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {connectionStatus === 'connected'
                    ? 'Seu WhatsApp está pronto para uso'
                    : connectionStatus === 'connecting'
                      ? 'Estabelecendo conexão...'
                      : 'Use o WhatsApp do seu celular para escanear'}
                </p>
              </div>
            </div>
            {/* Badge de Status - Usando componente reutilizável */}
            <StatusIndicator status={connectionStatus} size="md" />
          </div>

          {/* Área do QR Code */}
          <div className="p-8 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-800/20 min-h-[400px]">
            {connectionStatus === 'connected' ? (
              /* Estado Conectado */
              <div className="flex flex-col items-center gap-6 text-center">
                <div className="relative">
                  <div className="size-32 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <span className="material-symbols-outlined text-6xl text-emerald-600 dark:text-emerald-400">
                      check_circle
                    </span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 p-2 bg-white dark:bg-surface-dark rounded-full shadow-lg border border-slate-200 dark:border-slate-700">
                    <span className="material-symbols-outlined text-2xl text-primary">
                      smartphone
                    </span>
                  </div>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    WhatsApp Conectado!
                  </h4>
                  <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-6">
                    Seu dispositivo está sincronizado e pronto para enviar campanhas.
                    Você pode fechar esta página com segurança.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => navigate('/campaigns')}
                      className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 dark:bg-primary text-white dark:text-slate-900 rounded-lg font-semibold text-sm hover:bg-slate-800 dark:hover:bg-primary-dark transition-colors shadow-lg shadow-slate-200 dark:shadow-none"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        send
                      </span>
                      Criar Campanha
                    </button>
                    <button
                      onClick={handleDisconnect}
                      className="flex items-center gap-2 px-4 py-2.5 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg font-semibold text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        link_off
                      </span>
                      Desconectar
                    </button>
                  </div>
                </div>
              </div>
            ) : connectionStatus === 'connecting' ? (
              /* Estado Conectando */
              <div className="flex flex-col items-center gap-6 text-center">
                <div className="relative">
                  <div className="size-32 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <span className="material-symbols-outlined text-6xl text-blue-600 dark:text-blue-400 animate-spin">
                      sync
                    </span>
                  </div>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    Conectando...
                  </h4>
                  <p className="text-slate-500 dark:text-slate-400 max-w-sm">
                    Estabelecendo conexão com seu dispositivo. Isso pode levar alguns segundos.
                  </p>
                </div>
              </div>
            ) : qrCodeState.loading ? (
              /* Estado Loading */
              <div className="flex flex-col items-center gap-4">
                <div className="size-48 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm">
                  <div className="flex flex-col items-center gap-3">
                    <span className="material-symbols-outlined text-4xl text-slate-400 animate-spin">
                      progress_activity
                    </span>
                    <span className="text-sm text-slate-500 font-medium">
                      Gerando QR Code...
                    </span>
                  </div>
                </div>
              </div>
            ) : qrCodeState.error ? (
              /* Estado de Erro/Expirado */
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="size-48 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <span className="material-symbols-outlined text-4xl text-amber-500">
                      timer_off
                    </span>
                    <span className="text-sm text-slate-500 font-medium px-4">
                      {qrCodeState.error}
                    </span>
                  </div>
                </div>
                <button
                  onClick={generateQRCode}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 dark:bg-primary text-white dark:text-slate-900 rounded-lg font-semibold text-sm hover:bg-slate-800 dark:hover:bg-primary-dark transition-colors shadow-lg shadow-slate-200 dark:shadow-none"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    refresh
                  </span>
                  Gerar Novo QR Code
                </button>
              </div>
            ) : (
              /* QR Code Ativo */
              <div className="flex flex-col items-center gap-6">
                {/* Container do QR Code */}
                <div
                  className="relative size-56 bg-white p-4 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 cursor-pointer group"
                  onClick={handleQRCodeScanned}
                  title="[DEV] Clique para simular conexão"
                >
                  {/* QR Code Mock - Em produção será imagem Base64 da UAZAPI */}
                  <div className="w-full h-full bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                    <div className="grid grid-cols-5 gap-1 p-2">
                      {/* Simulação visual de QR Code */}
                      {Array.from({ length: 25 }).map((_, i) => (
                        <div
                          key={i}
                          className={`size-6 rounded-sm ${[0, 1, 2, 3, 4, 5, 9, 10, 14, 15, 19, 20, 21, 22, 23, 24].includes(i)
                            ? 'bg-slate-800 dark:bg-white'
                            : i % 3 === 0 ? 'bg-slate-800 dark:bg-white' : 'bg-transparent'
                            }`}
                        />
                      ))}
                    </div>
                  </div>
                  {/* Overlay hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 dark:group-hover:bg-white/5 rounded-xl transition-colors flex items-center justify-center">
                    <span className="material-symbols-outlined text-4xl text-transparent group-hover:text-primary transition-colors">
                      smartphone
                    </span>
                  </div>
                </div>

                {/* Instruções */}
                <div className="text-center max-w-xs">
                  <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                    Abra o <strong>WhatsApp</strong> no seu celular, vá em{' '}
                    <strong>Aparelhos Conectados</strong> e escaneie este código.
                  </p>
                </div>

                {/* Botão Refresh */}
                <button
                  onClick={generateQRCode}
                  className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-primary border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium hover:border-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    refresh
                  </span>
                  Gerar Novo Código
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Informações e Ajuda */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Card de Informações da Instância */}
          <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                Informações da Instância
              </h4>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 dark:text-slate-400">Nome</span>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  {instanceInfo.name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 dark:text-slate-400">Número</span>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  {instanceInfo.phone || '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 dark:text-slate-400">Última Sinc.</span>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  {instanceInfo.lastSync || '—'}
                </span>
              </div>
              {instanceInfo.battery !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500 dark:text-slate-400">Bateria</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`material-symbols-outlined text-[16px] ${instanceInfo.battery < 20 ? 'text-red-500' : 'text-emerald-500'
                      }`}>
                      {instanceInfo.isCharging ? 'battery_charging_full' :
                        instanceInfo.battery < 20 ? 'battery_alert' : 'battery_full'}
                    </span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {instanceInfo.battery}%
                    </span>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 dark:text-slate-400">Status</span>
                <StatusIndicator status={connectionStatus} size="sm" />
              </div>
            </div>
          </div>

          {/* Card de Instruções */}
          <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                Como Conectar
              </h4>
            </div>
            <div className="p-4">
              <ol className="space-y-3">
                {[
                  { icon: 'smartphone', text: 'Abra o WhatsApp no seu celular' },
                  { icon: 'more_vert', text: 'Toque no menu (três pontos)' },
                  { icon: 'devices', text: 'Selecione "Aparelhos Conectados"' },
                  { icon: 'qr_code_scanner', text: 'Escaneie o QR Code acima' },
                ].map((step, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 size-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">{index + 1}</span>
                    </div>
                    <div className="flex items-center gap-2 pt-0.5">
                      <span className="material-symbols-outlined text-[16px] text-slate-400">
                        {step.icon}
                      </span>
                      <span className="text-sm text-slate-600 dark:text-slate-300">
                        {step.text}
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Alerta Contextual - Usando componente reutilizável */}
          <ConnectionAlert
            status={connectionStatus}
            onReconnect={() => {
              generateQRCode();
            }}
          />

          {/* Card de Info (sempre visível quando conectado) */}
          {connectionStatus === 'connected' && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800">
              <div className="flex gap-3">
                <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                  verified
                </span>
                <div>
                  <p className="text-sm text-emerald-800 dark:text-emerald-200 font-medium mb-1">
                    Tudo pronto!
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-300">
                    Seu WhatsApp está conectado. Você pode criar campanhas e agendar envios com segurança.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Story 2.3 - Campanhas Pausadas aguardando reconexão */}
          {connectionStatus === 'disconnected' && pausedByDisconnection.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800">
              <div className="flex items-start gap-3 mb-3">
                <span className="material-symbols-outlined text-amber-600 dark:text-amber-400">
                  pause_circle
                </span>
                <div>
                  <p className="text-sm text-amber-800 dark:text-amber-200 font-bold">
                    {pausedByDisconnection.length} campanha{pausedByDisconnection.length > 1 ? 's' : ''} aguardando
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-300">
                    Serão retomadas automaticamente após reconexão.
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {pausedByDisconnection.map((campaign) => (
                  <div
                    key={campaign.campaignId}
                    className="flex items-center justify-between bg-white/60 dark:bg-slate-800/40 rounded-lg px-3 py-2 text-sm"
                  >
                    <span className="text-slate-700 dark:text-slate-200 font-medium truncate">
                      {campaign.campaignName}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 text-xs flex-shrink-0 ml-2">
                      {campaign.lastContactIndex}/{campaign.totalContacts}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Card de Info (sempre visível quando desconectado) */}
          {connectionStatus === 'disconnected' && (
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
              <div className="flex gap-3">
                <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 flex-shrink-0">
                  info
                </span>
                <div>
                  <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-1">
                    Mantenha seu celular conectado
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-300">
                    Para enviar mensagens, seu celular precisa estar conectado à internet
                    e com bateria suficiente.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Connection;
