# Epic 2 - Subtarefas de Integração Backend

**Criado em:** 2026-01-14  
**Status:** 🚧 Pendente  
**Dependências:** Cloud Functions, UAZAPI Account  

---

## Visão Geral

As Stories 2.1 e 2.2 têm a **UI 100% implementada**. Este documento detalha as subtarefas técnicas necessárias para integrar o frontend com a UAZAPI e o Firestore, finalizando o Epic 2.

---

## 📋 Subtarefas de Integração

### 🔗 INT-2.1: Integração do QR Code com UAZAPI

**Objetivo:** Substituir o mock do QR Code por chamada real à API da UAZAPI.

#### Tasks:

- [ ] **INT-2.1.1:** Criar Cloud Function `getQRCode`
  - Endpoint: `POST /api/instance/qrcode`
  - Recebe: `clientId` (do token JWT)
  - Retorna: Base64 da imagem do QR Code
  - Chama: `UAZAPI /instance/qrcode`

- [ ] **INT-2.1.2:** Armazenar credenciais UAZAPI de forma segura
  - Usar Firebase Secret Manager ou `clients/{clientId}/uazapi_config` (criptografado)
  - Campos: `instance_id`, `token`
  - Nunca expor no frontend

- [ ] **INT-2.1.3:** Atualizar `pages/Connection.tsx`
  - Substituir `generateQRCode()` mock por chamada à Cloud Function
  - Exibir imagem Base64 real no `<img src="data:image/png;base64,...">`

- [ ] **INT-2.1.4:** Implementar refresh automático
  - Timer de 30s para polling (fallback se webhook falhar)
  - Cleanup ao desmontar componente

---

### 🔗 INT-2.2: Status em Tempo Real via Firestore

**Objetivo:** Conectar o hook `useInstanceStatus` ao Firestore para updates em tempo real.

#### Tasks:

- [ ] **INT-2.2.1:** Criar coleção Firestore `clients/{clientId}/instance_status`
  - Campos: `status`, `phone`, `battery`, `isCharging`, `lastSync`, `updatedAt`
  - Security Rules: apenas owner e secretárias podem ler

- [ ] **INT-2.2.2:** Atualizar `hooks/useInstanceStatus.tsx`
  - Substituir estado local por `onSnapshot` do Firestore
  - Implementar cleanup do listener
  - Manter `simulateStatusChange` apenas em DEV (`process.env.NODE_ENV`)

- [ ] **INT-2.2.3:** Criar Cloud Function `receiveWebhook`
  - Endpoint: `POST /api/webhooks/uazapi`
  - Recebe: payload do webhook UAZAPI
  - Valida: `instance_id` corresponde a cliente válido
  - Atualiza: documento `instance_status` no Firestore

- [ ] **INT-2.2.4:** Configurar webhook na UAZAPI
  - URL: `https://{project-id}.cloudfunctions.net/receiveWebhook`
  - Eventos: `connection_update`, `qr_code`, `disconnected`
  - Segredo: token de validação no header

---

### 🔗 INT-2.3: Health Check Endpoint

**Objetivo:** Endpoint para Worker verificar saúde da instância antes de enviar.

#### Tasks:

- [ ] **INT-2.3.1:** Criar Cloud Function `checkInstanceHealth`
  - Endpoint: `GET /api/instance/health`
  - Parâmetros: `clientId`
  - Retorna: `{ healthy: boolean, reason?: string, battery?: number }`
  - Lógica: `healthy = connected && battery > 15`

- [ ] **INT-2.3.2:** Atualizar `instance_status` com flag `instanceHealthy`
  - Calculado automaticamente no webhook de status
  - Usado pelo Worker antes de processar lote

---

## 🗂️ Arquivos a Criar/Modificar

### Novos Arquivos:
```
functions/
├── src/
│   ├── webhooks/
│   │   └── uazapi.ts           # Receiver do webhook
│   ├── instance/
│   │   ├── getQRCode.ts        # Busca QR Code da UAZAPI
│   │   └── checkHealth.ts      # Health check endpoint
│   └── index.ts                # Export das functions
```

### Arquivos a Modificar:
```
web/
├── pages/Connection.tsx        # Integrar chamada real de QR Code
├── hooks/useInstanceStatus.tsx # Usar onSnapshot do Firestore
└── types.ts                    # Possíveis ajustes de tipos
```

---

## 🔐 Security Considerations

1. **Tokens UAZAPI:** Armazenados em Secret Manager ou criptografados no Firestore
2. **Webhook Validation:** Verificar header de autenticação da UAZAPI
3. **Firestore Rules:** Apenas usuários autenticados do cliente podem ler `instance_status`
4. **Rate Limiting:** Limitar chamadas ao endpoint de QR Code (1 por 5 segundos)

---

## ⏱️ Estimativa de Esforço

| Subtarefa | Complexidade | Estimativa |
|-----------|--------------|------------|
| INT-2.1 (QR Code) | Média | 3-4 horas |
| INT-2.2 (Status Real-time) | Média | 3-4 horas |
| INT-2.3 (Health Check) | Baixa | 1-2 horas |
| **TOTAL** | | **7-10 horas** |

---

## 📝 Notas

- A **Story 2.3** (Detecção de Perda de Conexão) depende do **Worker (Epic 6)** para pausar campanhas
- As subtarefas INT-2.1 e INT-2.2 podem ser implementadas agora
- INT-2.3 é pré-requisito para o Worker, mas pode ser criado antes

---

## 🔗 Referências

- [UAZAPI Documentação](https://docs.uazapi.com)
- [Firestore Security Rules](./firestore.rules)
- [PRD - NFR4](../02-Especificacoes/prd.md#nfr4)
- [Architecture - Worker Pattern](../01-Arquitetura/architecture.md)
