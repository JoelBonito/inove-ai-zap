# Story 5.2: Agendamento de Data e Hora do Disparo

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Usuário,
I want definir quando minha campanha deve iniciar,
so that eu possa planejar envios para horários estratégicos.

## Acceptance Criteria

1. **Given** o usuário preencheu mensagem e selecionou audiência
   **When** ele escolhe data/hora no DatePicker e clica em "Agendar"
   **Then** uma Cloud Task é criada (via Cloud Function) com `scheduleTime` exato
   **And** um documento é criado em `campaigns/{campId}` com `scheduledAt`, `status: 'scheduled'`, e `taskId`
   **And** o usuário vê confirmação: "Campanha agendada para Segunda, 09:00"

2. **Given** o usuário seleciona uma data/hora no passado
   **When** ele tenta agendar
   **Then** uma validação bloqueia: "Selecione um horário futuro"

3. **Given** a data/hora agendada chega
   **When** o Cloud Tasks aciona a Cloud Function (trigger)
   **Then** a campanha muda para `status: 'sending'` e o Worker inicia o processamento

## Tasks / Subtasks

- [x] Task 1: Backend - Configurar Cloud Tasks Integration
  - [x] Subtask 1.1: Configurar Queue `whatsapp-standard-queue` (250/min) e `whatsapp-safety-queue` (12/min) no GCP (usar Terraform/gcloud script simulado ou instruções manuais)
  - [x] Subtask 1.2: Implementar Cloud Function `scheduleCampaign` que cria a Task
  - [x] Subtask 1.3: Atualizar Cloud Function `createCampaign` para suportar agendamento (chamar `scheduleCampaign` se `scheduledAt` presente)
  - [x] Subtask 1.4: Implementar Cloud Function `startCampaignWorker` (HTTP Trigger) que será chamada pela Task

- [x] Task 2: Frontend - UI de Agendamento
  - [x] Subtask 2.1: Adicionar componente `DatePicker` (shadcn/ui) no `NewCampaignModal` (Wizard Step 3?)
  - [x] Subtask 2.2: Adicionar validação de data futura (Zod/date-fns)
  - [x] Subtask 2.3: Integrar chamada `addCampaign` com `scheduledAt` para o Backend (Cloud Function, não mock)
  - [x] Subtask 2.4: Exibir feedback de sucesso ("Agendada")

## Dev Notes

### Architecture Requirements (Cloud Tasks Hybrid Trigger)
- **Primary Trigger:** Cloud Tasks para precisão de início.
- **Throttling:** O Worker não deve fazer sleep manual. Ele deve enfileirar tarefas de envio nas filas configuradas (`whatsapp-standard` ou `whatsapp-safety`).
- **Resilience:** O campo `taskId` deve ser salvo na campanha para permitir cancelamento futuro (Feature futura).

### Project Structure Notes
- Backend: `functions/src/campaigns/scheduler.ts` (nova)
- Frontend: `web/src/components/campaigns/CampaignScheduler.tsx` (novo)

### References
- [Architecture Decision: Hybrid Queue Trigger](docs/01-Arquitetura/architecture.md#3.3-worker-design-hybrid-queue-trigger)
- [Design System](docs/04-UI-UX/ux-design-specification.md)

## Dev Agent Record

### Agent Model Used
BMad PM Agent

### Debug Log References
- No debug logs yet.

### Completion Notes List
- Initial story creation following architecture update.
- Implemented Cloud Functions: `createCampaign` (with scheduling) and `startCampaignWorker`.
- Implemented `scheduler.ts` with Cloud Tasks integration.
- Updated Frontend `NewCampaignModal` with DatePicker and state management.
- Added Unit Tests for `createCampaign`.
- Created setup script for Cloud Tasks queues.

### File List
- docs/implementation-artifacts/story-5-2-agendamento-de-data-e-hora-do-disparo.md
