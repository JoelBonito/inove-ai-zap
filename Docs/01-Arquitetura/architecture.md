---
stepsCompleted: [step-01-init, step-02-context, step-03-starter, step-04-decisions, step-05-patterns, step-06-structure, step-07-validation]
inputDocuments: ['docs/02-Especificacoes/prd.md', 'docs/04-UI-UX/ux-design-specification.md']
workflowType: 'architecture'
project_name: 'inove-ai-zap'
user_name: 'Joel'
date: '2026-01-12'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## 1. Project Context Analysis

### 1.1 Requirements Overview
O sistema é um SaaS B2B premium focado na orquestração resiliente de mensagens via WhatsApp. A arquitetura deve desacoplar a interface de usuário (React) da lógica de disparo (Backend Worker), tratando a API UAZAPI como uma dependência externa instável que exige gestão de estado rigorosa.

### 1.2 Architectural Implications
- **Stateful Resilience:** Persistência atômica do progresso de envio (cursor) para suportar interrupções de hardware ou conexão.
- **Real-time Synchronization:** Uso de Firestore Listeners para manter o Dashboard atualizado em tempo real.
- **Tenant Isolation:** Garantia de privacidade de dados entre clientes via Security Rules.

## 2. Starter Template Evaluation

### 2.1 Selected Starter: Vite 7 + React 19 + shadcn/ui
**Rationale:** Melhor stack para Dashboards SPA altamente interativos, alinhada ao padrão GEMS 4.0.
**Commands:**
```bash
npm create vite@latest web -- --template react-ts
cd web
npx shadcn@latest init
```

## 3. Core Architectural Decisions

### 3.1 Data Architecture (NoSQL Firestore)
Estrutura otimizada para Multi-tenancy e Performance:
- **`clients/{clientId}`:** Dados de conta e credenciais.
- **`clients/{clientId}/contacts/{contactId}`:** Base de leads categorizada.
- **`clients/{clientId}/categories/{catId}`:** Metadados de categorias.
- **`campaigns/{campId}`:** Configurações de disparo, agendamento e cursor (`last_contact_index`).
- **`campaigns/{campId}/send_logs/{logId}`:** Histórico individual de entrega.

### 3.2 Security & Encryption
- **Backend-only Secrets:** Tokens da UAZAPI são criptografados (AES-256) no backend e nunca trafegam "limpos" para o frontend.
- **Auth:** Firebase Authentication (Email/Senha).

### 3.3 Worker Design (Hybrid Queue Trigger)
- **Primary Trigger (Precision):** Cloud Tasks. Cada campanha agendada cria uma Task com `scheduleTime` exato.
- **Throttling (Rate Limiting):** O worker processa o envio despachando mensagens para uma **Cloud Task Queue** específica configurada com os limites da UAZAPI:
  - *Standard Queue:* 250 requests/min (Planos Pagos).
  - *Safety Queue:* 12 requests/min (Account Protection Mode).
  - Isso remove a complexidade de `sleep()` do código e delega o controle de fluxo para a infraestrutura do Google.
- **Safety Net (Resilience):** Um Cloud Scheduler (Cron a cada 10 min) varre campanhas em estado `SENDING` que pararam de atualizar o `heartbeat` (crash recovery).

### 3.4 Infrastructure Stack
- **Hosting:** Firebase Hosting.
- **Compute:** Firebase Cloud Functions (v2) + Google Cloud Tasks.
- **Database:** Firestore (NoSQL).
- **Storage:** Firebase Storage (Media Assets).

## 4. Implementation Patterns & Consistency Rules

### 4.1 Naming Patterns
Para garantir que múltiplos agentes de IA colaborem sem conflitos, adotamos as seguintes convenções:

**Database (Firestore):**
- **Collections:** `snake_case` e plural (ex: `send_logs`, `client_configs`).
- **Fields:** `camelCase` (ex: `lastContactIndex`, `isPremium`).
- **Document IDs:** Firestore Auto-generated IDs.

**Frontend (React/TS):**
- **Components:** `PascalCase` (ex: `MessageComposer.tsx`).
- **Files:** `kebab-case.ts` para utilitários e `PascalCase.tsx` para componentes.
- **Variables/Functions:** `camelCase` (ex: `handleScheduleCampaign`).
- **Types/Interfaces:** `PascalCase` sem prefixo (ex: `CampaignRecord`).

## 5. Project Structure & Boundaries

### 5.1 Complete Project Directory Structure
Adotamos uma estrutura monorepo simplificada para gerenciar o Frontend e o Backend (Cloud Functions) no mesmo repositório.

```text
inove-ai-zap/
├── firebase.json           # Configuração de Infra (Functions, Hosting, Rules)
├── firestore.rules         # Segurança Multi-tenancy
├── functions/              # Backend (Node.js 20+)
│   ├── src/
│   │   ├── clients/        # Gestão de Instâncias e Clientes
│   │   ├── contacts/       # Gestão de Leads e Higiene de Base
│   │   ├── campaigns/      # Orquestração de Agendamentos
│   │   ├── worker/         # Loop de Envio Seguro (Fila Stateful)
│   │   └── index.ts        # Entry point
├── web/                    # Frontend (React 19 + Vite 7)
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/         # Shadcn base
│   │   │   └── features/   # SpintaxEditor, AudienceSelector
│   │   ├── hooks/          # useCampaignStatus, useAuth
│   │   ├── services/       # Camada de abstração Firebase/UAZAPI
│   │   ├── pages/          # Dashboard, Contatos, Login
│   │   └── App.tsx
```

### 5.2 Architectural Boundaries
- **UAZAPI Isolation:** A comunicação com a API de mensagens é restrita ao domínio `functions/src/worker`. O Frontend não possui permissão nem conhecimento dos tokens da UAZAPI.
- **Data Flow:** Todo o fluxo de escrita de contatos e criação de campanhas é validado por Schemas Zod no Backend antes de persistir no Firestore.
- **State Management:** O estado global da aplicação é gerenciado via Zustand (Client State) e React Query (Server State), garantindo sincronia real-time com o Firestore.

## 6. Architecture Validation & Completion

### 6.1 Validation Summary ✅
- **Coherence:** Todas as decisões tecnológicas (React 19, Firebase v11, Node 20) são compatíveis e integradas via padrão GEMS 4.0.
- **Coverage:** Requisitos críticos de resiliência e anti-ban são endereçados pelo padrão "Short-Batch Worker".
- **Readiness:** A estrutura monorepo e as convenções de código eliminam ambiguidades para a fase de desenvolvimento.

### 6.2 Architecture Readiness Assessment
**Overall Status:** READY FOR IMPLEMENTATION
**Confidence Level:** HIGH
**Key Strengths:** Alta tolerância a falhas na integração com APIs de terceiros e forte isolamento de dados entre clientes premium.

### 6.3 Implementation Handoff
**AI Agent Guidelines:**
- Siga rigorosamente a estrutura de diretórios em `functions/` e `web/`.
- Utilize os Schemas Zod para validar todas as entradas de dados no Backend.
- Garanta que o cursor de envio (`lastContactIndex`) seja atualizado atomicamente após cada mensagem.

**First Priority:** Inicializar o monorepo, configurar o projeto Firebase e ativar os Emuladores Locais.
