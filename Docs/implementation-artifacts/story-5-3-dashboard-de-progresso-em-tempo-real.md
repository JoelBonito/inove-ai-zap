# Story 5.3: Dashboard de Progresso em Tempo Real

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Usuário Gerente,
I want visualizar o progresso das minhas campanhas em tempo real,
so that eu possa acompanhar o envio, identificar problemas e pausar se necessário.

## Acceptance Criteria

1.  **Given** que existem campanhas criadas (agendadas ou enviando)
    **When** eu acesso a tela de Campanhas
    **Then** eu vejo uma lista de cards/linhas com as campanhas do Firestore
    **And** vejo o status atual (Agendado, Enviando, Pausado, Concluído)
    **And** vejo contadores atualizados (Total, Enviados, Falhas, Pendentes)

2.  **Given** uma campanha em status 'Enviando'
    **When** o backend atualiza o progresso (mudança nos documentos ou contador)
    **Then** a barra de progresso na UI deve atualizar automaticamente sem refresh (Realtime/Subscription)

3.  **Given** uma campanha em andamento
    **When** eu clico em "Pausar"
    **Then** o status da campanha muda para 'paused' no Firestore
    **And** o Worker (Epic 6) deve interromper o processamento (nesta story, apenas a flag no banco é suficiente)

4.  **Given** uma campanha pausada
    **When** eu clico em "Retomar"
    **Then** o status muda para 'sending' ou 'scheduled' (dependendo da lógica) e o envio continua

## Tasks / Subtasks

- [ ] Task 1: Backend Integration (Firestore Hooks)
  - [ ] Subtask 1.1: Criar/Atualizar `useCampaigns` para usar `onSnapshot` do Firestore e escutar a coleção `campaigns`.
  - [ ] Subtask 1.2: Mapear os dados do Firestore para a interface `Campaign` do frontend.
  - [ ] Subtask 1.3: Implementar funções de `pauseCampaign` e `resumeCampaign` (update no Firestore).

- [ ] Task 2: Frontend UI - Lista de Campanhas
  - [ ] Subtask 2.1: Substituir os dados mockados em `Campaigns.tsx` (ou componente equivalente) pelos dados do hook `useCampaigns`.
  - [ ] Subtask 2.2: Refinar o componente de Card/Linha da campanha para exibir barra de progresso real baseada em `stats.sent` / `stats.total`.
  - [ ] Subtask 2.3: Implementar botões de Ação (Pausar/Retomar) conectados ao backend.

## Dev Notes

### Firestore Schema Reference
A estrutura da campanha no Firestore (definida na Story 5.2):
```typescript
interface CampaignData {
  id: string;
  name: string;
  status: 'draft' | 'scheduled' | 'sending' | 'paused' | 'completed' | 'failed';
  stats: {
    total: number;
    sent: number;
    failed: number;
    pending: number;
  };
  scheduledAt: Timestamp;
  createdAt: Timestamp;
}
```

### Realtime Strategy
- Utilizar `onSnapshot` do Firebase SDK client-side.
- Performance: Garantir que o snapshot escute apenas campanhas ativas ou paginate se houver muitas (por enquanto, assumir volume baixo de campanhas ativas).

## Dev Agent Record

### Agent Model Used
BMad PM Agent

### Completion Notes List
- 

### File List
- docs/implementation-artifacts/story-5-3-dashboard-de-progresso-em-tempo-real.md
