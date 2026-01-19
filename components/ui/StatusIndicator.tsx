import React from 'react';
import { ConnectionStatus } from '../../types';

interface StatusIndicatorProps {
  status: ConnectionStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showPulse?: boolean;
  className?: string;
}

interface StatusConfig {
  label: string;
  icon: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  dotClass: string;
}

const statusConfigs: Record<ConnectionStatus, StatusConfig> = {
  connected: {
    label: 'Conectado',
    icon: 'check_circle',
    bgClass: 'bg-emerald-100 dark:bg-emerald-900/30',
    borderClass: 'border-emerald-200 dark:border-emerald-800',
    textClass: 'text-emerald-800 dark:text-emerald-400',
    dotClass: 'bg-emerald-500',
  },
  connecting: {
    label: 'Conectando...',
    icon: 'sync',
    bgClass: 'bg-blue-100 dark:bg-blue-900/30',
    borderClass: 'border-blue-200 dark:border-blue-800',
    textClass: 'text-blue-800 dark:text-blue-400',
    dotClass: 'bg-blue-500',
  },
  disconnected: {
    label: 'Desconectado',
    icon: 'link_off',
    bgClass: 'bg-red-100 dark:bg-red-900/30',
    borderClass: 'border-red-200 dark:border-red-800',
    textClass: 'text-red-800 dark:text-red-400',
    dotClass: 'bg-red-500',
  },
};

const sizeClasses = {
  sm: {
    container: 'px-2 py-0.5',
    dot: 'size-1.5',
    text: 'text-xs',
    icon: 'text-[14px]',
  },
  md: {
    container: 'px-2.5 py-1',
    dot: 'size-2',
    text: 'text-xs',
    icon: 'text-[16px]',
  },
  lg: {
    container: 'px-3 py-1.5',
    dot: 'size-2.5',
    text: 'text-sm',
    icon: 'text-[18px]',
  },
};

/**
 * Componente StatusIndicator - Indicador visual do status da conexão WhatsApp
 *
 * Segue o Design System Stitch:
 * - Verde (emerald): Conectado
 * - Azul (blue): Conectando
 * - Vermelho (red): Desconectado
 *
 * Usado em:
 * - Header global (tamanho sm)
 * - Página de Conexão (tamanho md)
 * - Dashboard cards (tamanho sm/md)
 */
export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  size = 'md',
  showLabel = true,
  showPulse = true,
  className = '',
}) => {
  const config = statusConfigs[status];
  const sizeConfig = sizeClasses[size];

  return (
    <div
      className={`
        inline-flex items-center gap-1.5 rounded-full border
        ${config.bgClass} ${config.borderClass} ${sizeConfig.container}
        ${className}
      `}
      role="status"
      aria-live="polite"
      aria-label={`Status: ${config.label}`}
    >
      {/* Dot indicator com pulse animado */}
      <div
        className={`
          rounded-full ${config.dotClass} ${sizeConfig.dot}
          ${showPulse && status === 'connected' ? 'animate-pulse' : ''}
          ${status === 'connecting' ? 'animate-spin' : ''}
        `}
      />

      {/* Label de texto */}
      {showLabel && (
        <span className={`font-semibold ${config.textClass} ${sizeConfig.text}`}>
          {config.label}
        </span>
      )}
    </div>
  );
};

/**
 * Componente StatusBadge - Versão compacta apenas com ícone
 * Para uso em espaços menores como células de tabela
 */
interface StatusBadgeProps {
  status: ConnectionStatus;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const config = statusConfigs[status];

  return (
    <div
      className={`
        inline-flex items-center justify-center size-6 rounded-full
        ${config.bgClass} ${className}
      `}
      title={config.label}
      role="status"
      aria-label={`Status: ${config.label}`}
    >
      <span className={`material-symbols-outlined text-[14px] ${config.textClass}`}>
        {config.icon}
      </span>
    </div>
  );
};

/**
 * Componente ConnectionAlert - Alerta contextual quando desconectado
 * Exibe mensagem sugerindo reconexão
 */
interface ConnectionAlertProps {
  status: ConnectionStatus;
  onReconnect?: () => void;
  className?: string;
}

export const ConnectionAlert: React.FC<ConnectionAlertProps> = ({
  status,
  onReconnect,
  className = '',
}) => {
  if (status === 'connected') return null;

  const isConnecting = status === 'connecting';

  return (
    <div
      className={`
        p-4 rounded-xl border flex items-start gap-3
        ${isConnecting
          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800'
          : 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800'
        }
        ${className}
      `}
      role="alert"
    >
      <span
        className={`
          material-symbols-outlined flex-shrink-0
          ${isConnecting
            ? 'text-blue-600 dark:text-blue-400 animate-spin'
            : 'text-amber-600 dark:text-amber-400'
          }
        `}
      >
        {isConnecting ? 'sync' : 'warning'}
      </span>
      <div className="flex-1">
        <p
          className={`
            text-sm font-medium mb-1
            ${isConnecting
              ? 'text-blue-800 dark:text-blue-200'
              : 'text-amber-800 dark:text-amber-200'
            }
          `}
        >
          {isConnecting ? 'Conectando ao WhatsApp...' : 'WhatsApp Desconectado'}
        </p>
        <p
          className={`
            text-xs
            ${isConnecting
              ? 'text-blue-600 dark:text-blue-300'
              : 'text-amber-600 dark:text-amber-300'
            }
          `}
        >
          {isConnecting
            ? 'Aguarde enquanto estabelecemos a conexão com seu dispositivo.'
            : 'Reconecte seu dispositivo para continuar enviando mensagens.'}
        </p>
        {!isConnecting && onReconnect && (
          <button
            onClick={onReconnect}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-800/30 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-800/50 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">qr_code_2</span>
            Reconectar
          </button>
        )}
      </div>
    </div>
  );
};

export default StatusIndicator;
