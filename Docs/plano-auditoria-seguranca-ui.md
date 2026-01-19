# Plano de Correções — Auditoria de Segurança e UI

Data: 2026-01-18
Projeto: inove-ai-zap

## Objetivo
Organizar as correções prioritárias de segurança e UI/UX para execução em outra sessão, mantendo rastreabilidade e ordem de impacto.

## Escopo
- Segurança (backend, Firestore, autenticação, validação, dados sensíveis)
- UI/UX (acessibilidade, responsividade, consistência visual, design system)

---

## Fase 1 — Segurança Crítica e Base de Regras
**Prioridade:** Crítica

- [ ] Implementar `firestore.rules` conforme `Docs/01-Arquitetura/FIRESTORE-SECURITY-RULES.md`.
- [ ] Implementar `firestore.indexes.json` conforme consultas existentes e regras.
- [ ] Bloquear acesso público ao `startCampaignWorker` e validar origem (OIDC/Cloud Tasks).
- [ ] Validar autenticação e autorização em Functions com base no `ownerId`/tenant.
- [ ] Adicionar validação de payload com Zod em todas as Functions expostas.

**Entrega:** deploy de rules/indexes + Functions com validação e acesso restrito.

---

## Fase 2 — Redução de Exposição de Dados Sensíveis
**Prioridade:** Alta

- [ ] Mover segredos de instância para coleção protegida (`clients/{clientId}/secrets/*`).
- [ ] Criptografar tokens UAZAPI no backend (AES-256) e nunca expor ao frontend.
- [ ] Evitar persistir PII em `_resolvedContacts` (guardar apenas IDs, ou calcular por lote).
- [ ] Implementar filtros multi-tenant no frontend (ex.: campanhas por `ownerId`).

**Entrega:** dados sensíveis isolados e minimizados, front alinhado ao tenant.

---

## Fase 3 — UI/UX Acessível e Responsiva
**Prioridade:** Alta

- [ ] Substituir modais customizados por `@/components/ui` (Dialog/Sheet) com foco e ESC.
- [ ] Garantir `aria-label` em botões de ícone e foco visível em inputs e ações.
- [ ] Implementar sidebar responsiva (drawer no mobile) e header adaptado.
- [ ] Revisar contraste e estados (hover/focus/disabled) em telas críticas.

**Entrega:** UI navegável por teclado, responsiva e com acessibilidade básica OK.

---

## Fase 4 — Design System e Consistência Visual
**Prioridade:** Média

- [ ] Migrar Tailwind do CDN para build pipeline com `tailwind.config.*`.
- [ ] Consolidar tokens do Stitch no config e aplicar via classes utilitárias.
- [ ] Garantir uso estrito de `@/components/ui` (shadcn/ui) onde aplicável.
- [ ] Remover mocks visuais inconsistentes ou sinalizar modo “preview”.

**Entrega:** base visual consistente e compatível com o design system.

---

## Observações
- As mudanças devem respeitar as regras do projeto em `AGENTS.md`.
- Não usar `any` sem justificativa; remover `console.log` e TODOs antes do deploy final.
- Preferir commits separados por fase (segurança / UI).
