# 🔒 Firestore Security Rules - inove-ai-zap

## Visão Geral

As Security Rules implementam isolamento multi-tenant com suporte a roles (owner/secretary).

## Estrutura de Dados

```
clients/{clientId}                    # Tenant Root
├── secrets/{secretId}                # 🔐 NUNCA acessível via Client SDK
├── users/{userId}                    # Usuários do tenant (owner, secretary)
├── contacts/{contactId}              # Base de leads
├── categories/{catId}                # Tags de segmentação
└── settings/{settingId}              # Configurações

campaigns/{campaignId}                # Campanhas (coleção raiz)
└── send_logs/{logId}                 # Histórico de envio (write pelo Worker apenas)
```

## Roles

| Role | Descrição | Permissões |
|------|-----------|------------|
| `owner` | Dono da conta | Tudo |
| `secretary` | Assistente | Leitura + escrita de contatos/categorias |

## Validação de Schema

### Contact
```typescript
{
  phone: string (8-20 chars),
  createdAt: timestamp,
  // campos opcionais: name, tags, etc
}
```

### Campaign
```typescript
{
  clientId: string,
  name: string (min 1 char),
  status: 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'PAUSED' | 'COMPLETED' | 'FAILED',
  createdAt: timestamp
}
```

### User
```typescript
{
  role: 'owner' | 'secretary'
}
```

## Regras de Acesso Resumidas

| Recurso | Read | Create | Update | Delete |
|---------|------|--------|--------|--------|
| `/clients/{clientId}` | owner/secretary | owner | owner | owner |
| `/clients/{clientId}/secrets/*` | ❌ | ❌ | ❌ | ❌ |
| `/clients/{clientId}/users/*` | self/owner | owner | owner | owner |
| `/clients/{clientId}/contacts/*` | owner/secretary | owner/secretary | owner/secretary | owner |
| `/clients/{clientId}/categories/*` | owner/secretary | owner/secretary | owner/secretary | owner/secretary |
| `/campaigns/{campaignId}` | owner | owner | owner | owner |
| `/campaigns/{campaignId}/send_logs/*` | owner | ❌ (Worker) | ❌ | ❌ |

## Changelog

| Data | Versão | Mudanças |
|------|--------|----------|
| 2026-01-13 | 2.0 | Regras robustas com validação de schema e roles |
| 2026-01-13 | 1.0 | Regras simplificadas de desenvolvimento |

## Deploy

```bash
firebase deploy --only firestore:rules
```
