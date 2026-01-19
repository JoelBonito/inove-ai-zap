export interface Campaign {
  id: string;
  name: string;
  status: 'Enviando' | 'Concluído' | 'Pausado' | 'Agendado' | 'Erro';
  date: string;
  progress: number;
  total: number;
  sent: number;
  pending?: number;
  failed?: number;

  // Epic 4 - Conteúdo e Configuração
  content?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'document';
  targetCategoryIds?: string[];
  targetContactList?: { name: string; phone: string }[]; // Story 5.5 - Lista rápida para upload direto
  targetContactIds?: string[]; // Story 5.1 - IDs selecionados manualmente

  // Story 2.3 - Campos para pausa por desconexão
  lastContactIndex?: number;
  pauseReason?: 'manual' | 'disconnected' | 'low_battery' | 'error';
  pausedAt?: string;
  scheduledAt?: string;
}

export interface Contact {
  id: string;
  initials: string;
  name: string;
  email: string;
  phone: string;
  tags: string[]; // Mantido para compatibilidade
  categoryIds?: string[]; // Story 3.4 - IDs das categorias atribuídas
  lastCampaign?: {
    name: string;
    date: string;
  };
  color: string;
}

export interface AutomationRule {
  id: string;
  icon: string;
  colorClass: string;
  title: string;
  description: string;
  active: boolean;
}

export interface NavItem {
  label: string;
  icon: string;
  path: string;
  description?: string;
}

// Story 2.1 - Conexão WhatsApp
export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting';

export interface QRCodeState {
  code: string | null;
  loading: boolean;
  expiresAt: string | null;
  error: string | null;
}

export interface InstanceInfo {
  id: string;
  name: string;
  phone: string | null;
  status: ConnectionStatus;
  lastSync: string | null;
  battery?: number;
  isCharging?: boolean;
  profilePicUrl?: string;
}

// Story 2.3 - Detecção de Perda de Conexão
export interface DisconnectionEvent {
  timestamp: string;
  reason: 'webhook' | 'timeout' | 'manual';
  lastKnownStatus: ConnectionStatus;
  affectedCampaigns: string[]; // IDs das campanhas pausadas
}

export interface CampaignPauseInfo {
  campaignId: string;
  campaignName: string;
  pausedAt: string;
  lastContactIndex: number;
  totalContacts: number;
  reason: Campaign['pauseReason'];
}

// Story 3.3 - Categorias (Tags)
export type CategoryColor = 'blue' | 'emerald' | 'amber' | 'purple' | 'red' | 'pink' | 'indigo' | 'teal' | 'slate';

export interface Category {
  id: string;
  name: string;
  color: CategoryColor;
  contactCount: number;
  createdAt: string;
  updatedAt: string;
}

// Tipos de Usuário e Permissões (PRD RF109-RF119)
export type UserRole = 'admin' | 'owner' | 'secretary';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  clientId?: string; // Tenant ID para multi-tenancy
  avatarUrl?: string;
  createdAt: string;
}