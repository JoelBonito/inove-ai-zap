# Plano de Correcoes — Auditoria de Sistema, Seguranca e UX

Data: 2026-01-19
Projeto: inove-ai-zap

## Objetivo
Atualizar o diagnostico de riscos e UX e definir correcoes priorizadas para aplicacao imediata e rastreavel.

## Escopo
- Sistema (arquitetura, estado, integracoes, multi-tenant)
- Seguranca (Functions, Firestore Rules, webhooks, dados sensiveis)
- UI/UX (acessibilidade, responsividade, design system)

---

## Achados Principais

### Sistema
- Estado global nao usa Zustand e estado de servidor nao usa React Query.
- Autenticacao ainda mockada no frontend; rotas protegidas nao estao acopladas ao Firebase Auth.
- Tailwind via CDN e tokens fora do build pipeline (risco de classes dinamicas nao gerarem CSS).
- Componentes UI sao customizados e nao padronizados em @/components/ui (violacao do design system).

### Seguranca
- `startCampaignWorker` e `uazapiWebhook` expostos sem validacao de origem/assinatura.
- `startCampaignWorker` confia no `ownerId` do payload (risco de acesso indevido).
- Falta validacao de payload (Zod) nas Functions expostas.
- Cache `_resolvedContacts` armazena PII em campanha (telefone/nome).
- Logs e erros com `console.*` em codigo de producao.

### UI/UX
- Modais customizados sem foco/ESC e sem `aria-*` (acessibilidade incompleta).
- Sidebar fixa sem comportamento responsivo (drawer no mobile).
- Botoes de icone sem `aria-label` em fluxos criticos.
- Estados de erro dependem de `alert()` e sem feedback visual consistente.

---

## Plano de Correcoes (Atualizado)

### Fase 1 — Seguranca Critica e Integridade de Dados
**Prioridade:** Critica

- [x] Validar origem de `startCampaignWorker` (OIDC/secret) e rejeitar chamadas nao autorizadas.
- [x] Validar assinatura/token no `uazapiWebhook`.
- [x] Garantir `ownerId` derivado do documento da campanha (nao do payload).
- [x] Adicionar validacao de payload com Zod nas Functions expostas.
- [x] Remover cache `_resolvedContacts` e usar apenas IDs (ou processamento por lote) para evitar PII.

**Entrega:** Functions protegidas e validações robustas.

---

### Fase 2 — Sistema e Estado
**Prioridade:** Alta

- [x] Substituir Auth mock por Firebase Auth (email/senha + Google opcional).
- [x] Adicionar React Query para estado de servidor (campanhas/contatos/categorias).
- [x] Migrar estado de UI para Zustand.
- [x] Ajustar queries por `ownerId` (multi-tenant) no frontend.

**Entrega:** estado previsivel, multi-tenant consistente e auth real.

---

### Fase 3 — UI/UX e Acessibilidade
**Prioridade:** Alta

- [x] Migrar modais para componentes `@/components/ui` com foco/ESC.
- [x] Adicionar `aria-label` em botoes de icone e estados de foco visiveis.
- [x] Implementar sidebar responsiva (drawer no mobile).
- [x] Padronizar feedback de erro (evitar `alert`).

**Entrega:** UI acessivel, responsiva e consistente.

---

### Fase 4 — Design System e Build
**Prioridade:** Media

- [x] Migrar Tailwind do CDN para build com `tailwind.config.*`.
- [x] Consolidar tokens e padronizar `@/components/ui`.
- [x] Remover classes dinamicas que nao sao detectadas no build (cores de categorias).

**Entrega:** base visual consistente e escalavel.

---

## Observacoes
- As mudancas devem respeitar `AGENTS.md`.
- Evitar `console.log` e codigo comentado nas entregas finais.
- Priorizar commits separados por fase.
