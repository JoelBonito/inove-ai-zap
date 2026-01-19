# Lista Global de Tarefas

**Última Atualização:** 2026-01-18 10:52
**Status Geral:** Epic 1 DONE | Epic 2 DONE | Epic 3 DONE | Epic 4 DONE | Epic 5 DONE | Epic 6 DONE

---

## Epic 1: Fundação do Projeto e Autenticação ✅ DONE

- [x] **Story 1.1:** Setup do Monorepo e Infraestrutura Base
- [x] **Story 1.2:** Autenticação de Usuário (Login/Logout)
- [x] **Story 1.3:** Criação Manual de Clientes (Admin Only)
- [x] **Story 1.4:** Cadastro de Secretária com Permissões Restritas

---

## Epic 2: Conexão com WhatsApp ✅ DONE

- [x] **Story 2.1:** Exibição do QR Code para Conexão ✅ *(UI completa, aguardando integração UAZAPI)*
- [x] **Story 2.2:** Exibição do Status da Instância em Tempo Real ✅ *(UI + hooks prontos, aguardando webhooks)*
- [x] **Story 2.3:** Detecção Automática de Perda de Conexão ✅ *(UI + lógica de pausa implementada)*

### Subtarefas de Integração Backend 🔧
> 📄 **Documentação completa:** [EPIC-2-SUBTAREFAS-INTEGRACAO.md](../03-Implementacao/EPIC-2-SUBTAREFAS-INTEGRACAO.md)

- [ ] **INT-2.1:** Integração QR Code com UAZAPI
  - [ ] Cloud Function `getQRCode`
  - [ ] Armazenar credenciais UAZAPI (Secret Manager)
  - [ ] Atualizar `Connection.tsx` para QR real
- [ ] **INT-2.2:** Status em Tempo Real via Firestore
  - [ ] Coleção `instance_status` no Firestore
  - [ ] `onSnapshot` no hook `useInstanceStatus`
  - [ ] Cloud Function `receiveWebhook`
  - [ ] Configurar webhook na UAZAPI
- [ ] **INT-2.3:** Health Check Endpoint
  - [ ] Cloud Function `checkInstanceHealth`
  - [ ] Flag `instanceHealthy` no Firestore

---


## Epic 3: Gestão de Contatos e Audiência ✅ DONE

- [x] **Story 3.1:** Importação de Contatos via CSV/Excel ✅ *(SmartDropzone + Modal implementados)*
- [x] **Story 3.2:** Sanitização Automática de Telefones ✅ *(Função sanitizePhone com E.164)*
- [x] **Story 3.3:** CRUD de Categorias (Tags) ✅ *(Hook + Modal + Sidebar integrada)*
- [x] **Story 3.4:** Atribuição de Categorias a Contatos ✅ *(Seleção múltipla + Ação em lote)*
- [x] **Story 3.5:** CRUD de Contatos Individuais ✅ *(Modais de Criação/Edição/Exclusão implementados)*

---

## Epic 4: Composição de Mensagens ✅ DONE

- [x] **Story 4.1:** Editor de Mensagem de Texto
- [x] **Story 4.2:** Suporte a Spintax Manual com Validação
- [x] **Story 4.3:** Geração de Spintax Assistido (IA) ✅ *(Modal funcional com mock, integração Gemini em deploy)*
- [x] **Story 4.4:** Upload de Imagem para Campanha
- [x] **Story 4.5:** Preview da Mensagem Antes do Disparo

---

## Epic 5: Agendamento e Monitoramento de Campanhas ✅ DONE

- [x] **Story 5.1:** Seleção de Audiência (Categorias + Contatos Avulsos) ✅ *(Tabs no NewCampaignModal)*
- [x] **Story 5.2:** Agendamento de Data e Hora do Disparo ✅ *(datetime-local no Step 3)*
- [x] **Story 5.3:** Dashboard de Progresso em Tempo Real ✅ *(CampaignDetails.tsx com onSnapshot)*
- [x] **Story 5.4:** Histórico de Campanhas e Resultados ✅ *(Campaigns.tsx com lista)*
- [x] **Story 5.5:** Campanha Relâmpago (Upload CSV/Lista Rápida) ✅ *(Quick List no Modal)*

---

## Epic 6: Envio Automático e Seguro (Worker) ✅ DONE

- [x] **Story 6.1:** Worker de Envio em Background (Fire and Forget) ✅ *(Cloud Function startCampaignWorker)*
- [x] **Story 6.2:** Delays Aleatórios Anti-Ban ✅ *(Gaussian Jitter 45-120s)*
- [x] **Story 6.3:** Pausas Longas Automáticas ✅ *(Batch processing pattern)*
- [x] **Story 6.4:** Pausa Automática ao Perder Conexão ✅ *(Check status before send)*
- [x] **Story 6.5:** Registro de Status por Contato ✅ *(send_logs subcollection)*
- [x] **Story 6.6:** Health Check Pré-Envio ✅ *(Instance config validation)*
- [x] **Story 6.7:** Sincronização de Contatos na Agenda ✅ *(POST /contact/add)*
- [x] **Story 6.8:** Simular Digitação ✅ *(POST /presence composing)*
- [x] **Story 6.9:** Cron Scheduler ✅ *(checkScheduledCampaigns Pub/Sub)*

---

## Epic 7: Dashboard de Campanhas ✅ DONE

- [x] **Story 7.1:** Página de Detalhes da Campanha ✅ *(CampaignDetails.tsx)*
- [x] **Story 7.2:** Progress Bar em Tempo Real ✅ *(onSnapshot stats)*
- [x] **Story 7.3:** Logs de Envio (Sent/Failed) ✅ *(send_logs list)*
- [x] **Story 7.4:** Navegação da Lista para Detalhes ✅ *(Row click navigation)*

---

## Resumo de Progresso

| Epic | Stories | Concluídas | Status |
|------|---------|------------|--------|
| Epic 1 | 4 | 4 | ✅ DONE (100%) |
| Epic 2 | 3 | 3 | ✅ DONE (100%) |
| Epic 3 | 5 | 5 | ✅ DONE (100%) |
| Epic 4 | 5 | 5 | ✅ DONE (100%) |
| Epic 5 | 5 | 5 | ✅ DONE (100%) |
| Epic 6 | 9 | 9 | ✅ DONE (100%) |
| Epic 7 | 4 | 4 | ✅ DONE (100%) |
| **TOTAL** | **35** | **35** | **100%** |

---

## Notas de Decisão

### Aba "Automação"
- **Decisão:** A aba de Automação não faz parte do escopo MVP conforme PRD.
- **Status:** Placeholder visual apenas. Funcionalidade prevista para Post-MVP (Phase 2).
- **Opção:** Pode ser removida/ocultada para simplificar a UI do MVP.

### Aba "API" em Configurações
- **Decisão:** Visível apenas para usuários com role `admin`.
- **Implementação:** O administrador (Joel) configura as credenciais UAZAPI antes de entregar ao cliente.

---

## ✅ Web App Frontend CONCLUÍDO

**Próximos passos para produção:**
1. Deploy das Cloud Functions (Plano Blaze)
2. Configurar credenciais UAZAPI em produção
3. Ativar webhooks de status
