import React, { useEffect, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import { useInstanceStatusContext } from '../hooks/useInstanceStatus';

interface QRCodeResponse {
  success: boolean;
  qrcode?: string;
  paircode?: string;
  status: 'disconnected' | 'connecting' | 'connected';
  error?: string;
}

interface InstanceStatusResponse {
  success: boolean;
  status: 'disconnected' | 'connecting' | 'connected';
  qrcode?: string;
  paircode?: string;
  profileName?: string;
  profilePicUrl?: string;
  isBusiness?: boolean;
  error?: string;
}

const Connection = () => {
  const { status, instanceInfo, refresh } = useInstanceStatusContext();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [pairCode, setPairCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // Função para gerar QR Code
  const handleConnect = async () => {
    setIsLoading(true);
    setError(null);
    setQrCode(null);
    setPairCode(null);

    try {
      const generateQRCode = httpsCallable<unknown, QRCodeResponse>(functions, 'generateQRCode');
      const result = await generateQRCode({});

      if (result.data.success) {
        if (result.data.qrcode) {
          setQrCode(result.data.qrcode);
          startPolling();
        }
        if (result.data.paircode) {
          setPairCode(result.data.paircode);
        }
      } else {
        setError(result.data.error || 'Erro ao gerar QR Code');
      }
    } catch (err) {
      setError('Falha ao conectar. Tente novamente.');
      console.error('Erro:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Polling para verificar status da conexão
  const startPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    const interval = setInterval(async () => {
      try {
        const getInstanceStatus = httpsCallable<unknown, InstanceStatusResponse>(functions, 'getInstanceStatus');
        const result = await getInstanceStatus({});

        if (result.data.status === 'connected') {
          // Conexão estabelecida!
          clearInterval(interval);
          setPollingInterval(null);
          setQrCode(null);
          setPairCode(null);
          refresh(); // Atualiza o contexto
        } else if (result.data.status === 'connecting' && result.data.qrcode) {
          // QR Code atualizado
          setQrCode(result.data.qrcode);
          if (result.data.paircode) {
            setPairCode(result.data.paircode);
          }
        }
      } catch (err) {
        console.error('Erro no polling:', err);
      }
    }, 3000); // Poll a cada 3 segundos

    setPollingInterval(interval);
  };

  // Limpar polling ao desmontar
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  // Status badges
  const getStatusBadge = () => {
    switch (status) {
      case 'connected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-sm font-semibold">
            <span className="size-2 bg-emerald-500 rounded-full animate-pulse"></span>
            Conectado
          </span>
        );
      case 'connecting':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-sm font-semibold">
            <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
            Conectando...
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm font-semibold">
            <span className="size-2 bg-red-500 rounded-full"></span>
            Desconectado
          </span>
        );
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Card Principal */}
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Conexão WhatsApp
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Conecte seu WhatsApp para enviar campanhas
            </p>
          </div>
          {getStatusBadge()}
        </div>

        {/* Conteúdo */}
        <div className="p-6">
          {/* Estado: Conectado */}
          {status === 'connected' && (
            <div className="flex flex-col items-center gap-6">
              {/* Avatar do perfil */}
              <div className="relative">
                <div
                  className="size-24 rounded-full bg-slate-200 dark:bg-slate-700 bg-cover bg-center ring-4 ring-emerald-100 dark:ring-emerald-900/30 flex items-center justify-center text-3xl font-bold text-slate-500 dark:text-slate-400"
                  style={instanceInfo.profilePicUrl ? {
                    backgroundImage: `url('${instanceInfo.profilePicUrl}')`,
                  } : undefined}
                >
                  {!instanceInfo.profilePicUrl && (instanceInfo.name?.[0]?.toUpperCase() || 'W')}
                </div>
                <div className="absolute -bottom-1 -right-1 p-1.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-800">
                  <span className="material-symbols-outlined text-white text-[16px]">check</span>
                </div>
              </div>

              {/* Informações */}
              <div className="text-center">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {instanceInfo.name || 'WhatsApp Conectado'}
                </h3>
                {instanceInfo.phone && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {instanceInfo.phone}
                  </p>
                )}
                {instanceInfo.lastSync && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                    Última sinc.: {new Date(instanceInfo.lastSync).toLocaleString('pt-BR')}
                  </p>
                )}
              </div>

              {/* Ações */}
              <div className="flex gap-3">
                <button
                  onClick={refresh}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
                >
                  <span className="material-symbols-outlined text-[18px]">refresh</span>
                  Atualizar
                </button>
              </div>
            </div>
          )}

          {/* Estado: Desconectado ou Conectando */}
          {status !== 'connected' && (
            <div className="flex flex-col items-center gap-6">
              {/* QR Code */}
              {qrCode ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-white rounded-xl shadow-md border border-slate-200">
                    <img
                      src={qrCode}
                      alt="QR Code WhatsApp"
                      className="size-64"
                    />
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 text-center max-w-sm">
                    Abra o <strong>WhatsApp</strong> no seu celular, vá em{' '}
                    <strong>Dispositivos Conectados</strong> e escaneie o código acima.
                  </p>

                  {pairCode && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      <span className="text-sm text-slate-500">Código de pareamento:</span>
                      <span className="font-mono font-bold text-lg text-slate-900 dark:text-white">{pairCode}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 py-8">
                  {/* Ícone grande */}
                  <div className="size-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <span className="material-symbols-outlined text-5xl text-slate-400">
                      smartphone
                    </span>
                  </div>

                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Conecte seu WhatsApp
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                      Clique no botão abaixo para gerar um QR Code e conectar seu WhatsApp ao sistema.
                    </p>
                  </div>

                  {/* Botão Conectar */}
                  <button
                    onClick={handleConnect}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
                        Gerando QR Code...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[20px]">qr_code_2</span>
                        Conectar WhatsApp
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Erro */}
              {error && (
                <div className="w-full p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
                  <span className="material-symbols-outlined text-red-600 dark:text-red-400">error</span>
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer com dicas */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-blue-500 text-[20px] flex-shrink-0 mt-0.5">info</span>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              <strong>Dica:</strong> Use uma conta do <strong>WhatsApp Business</strong> para melhor estabilidade.
              O número conectado aqui será usado para enviar suas campanhas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Connection;
