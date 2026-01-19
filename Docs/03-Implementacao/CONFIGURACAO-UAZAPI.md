# Configuração UAZAPI

Este documento descreve como configurar as credenciais da UAZAPI para cada cliente no Inove AI Zap.

## Estrutura no Firestore

```
instances/{ownerId}
├── apiUrl: string        // URL da instância UAZAPI
├── apikey: string        // Chave de API
├── instanceName: string  // Nome amigável (opcional)
├── createdAt: Timestamp
└── updatedAt: Timestamp
```

## Obter Credenciais UAZAPI

1. Acesse o painel da UAZAPI: https://app.uazapi.com
2. Crie uma nova instância (se ainda não tiver)
3. Copie:
   - **API URL**: URL da instância (ex: `https://api.uazapi.com/instance/abc123`)
   - **API Key**: Token de autenticação

## Métodos de Configuração

### Opção 1: Script CLI (Recomendado para Setup Inicial)

```bash
cd functions

# Baixe o service-account.json do Console Firebase:
# Console > Configurações > Contas de Serviço > Gerar nova chave privada

npx ts-node scripts/setup-uazapi.ts <owner_id> <api_url> <api_key> [instance_name]

# Exemplo:
npx ts-node scripts/setup-uazapi.ts "user_abc123" "https://api.uazapi.com/instance/xyz" "minha-api-key" "Clínica Dr. João"
```

### Opção 2: Interface Admin no Web App

1. Faça login como **Admin** (email contendo "admin" ou "joel")
2. Vá em **Configurações** → aba **API**
3. Selecione o cliente
4. Preencha URL e API Key
5. Clique em **Salvar**

### Opção 3: Firebase Console (Manual)

1. Acesse: https://console.firebase.google.com/project/inove-ai-zap-2026/firestore
2. Crie um documento em `instances/{ownerId}` com:
   ```json
   {
     "apiUrl": "https://api.uazapi.com/instance/xyz",
     "apikey": "sua-api-key-aqui",
     "instanceName": "Nome do Cliente",
     "createdAt": timestamp,
     "updatedAt": timestamp
   }
   ```

## Verificar Configuração

Para verificar se está funcionando:

```bash
curl -X GET "https://YOUR_API_URL/instance/status" \
  -H "apikey: YOUR_API_KEY"
```

Resposta esperada:
```json
{
  "instance": "abc123",
  "state": "connected",
  "phone": "5511999887766"
}
```

## Segurança

- ⚠️ **Nunca exponha a API Key no frontend**
- As credenciais são acessadas apenas pelas Cloud Functions
- As Firestore Rules devem bloquear leitura direta da coleção `instances`

### Firestore Rules (Recomendadas)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Bloqueia acesso direto às instâncias
    match /instances/{ownerId} {
      allow read, write: if false; // Apenas Cloud Functions acessam
    }
  }
}
```

## Troubleshooting

| Erro | Causa | Solução |
|------|-------|---------|
| `Instância UAZAPI não configurada` | Documento não existe | Crie o documento na coleção `instances` |
| `401 Unauthorized` | API Key inválida | Verifique a apikey no painel UAZAPI |
| `Connection refused` | URL incorreta | Verifique a apiUrl |
| `Instance disconnected` | WhatsApp desconectado | Escaneie o QR Code novamente |

## Endpoints UAZAPI Utilizados

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/message/sendText` | POST | Envio de mensagem de texto |
| `/contact/add` | POST | Sincronizar contato na agenda |
| `/presence` | POST | Simular "digitando..." |
| `/instance/status` | GET | Verificar status da conexão |
| `/instance/qrcode` | GET | Obter QR Code para conexão |

---

**Última Atualização:** 2026-01-18
