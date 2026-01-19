---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - Docs/02-Especificacoes/prd.md
  - Docs/01-Arquitetura/architecture.md
  - Docs/planning-artifacts/ux-design-specification.md
project_name: inove-ai-zap
user_name: Joel
date: 2026-01-14
updated: 2026-01-15
---

# inove-ai-zap - Epic Breakdown

## Overview

Este documento contém a decomposição completa de Epics e Stories para o **inove-ai-zap**, transformando os requisitos do PRD, decisões de Arquitetura e especificações de UX Design em tarefas de desenvolvimento acionáveis.

## Requirements Inventory

### Functional Requirements

- **RF1:** O Administrador (Joel) pode criar contas de clientes manualmente no sistema.
- **RF2:** O Usuário (Dono) pode realizar login e logout com segurança.
- **RF3:** O Usuário (Dono) pode cadastrar um perfil para sua secretária com permissões restritas.
- **RF4:** O Sistema deve isolar completamente os dados entre diferentes clientes (Multi-tenancy).
- **RF5:** O Usuário pode visualizar o status da sua instância de WhatsApp (Conectado/Desconectado).
- **RF6:** O Usuário pode gerar e visualizar o QR Code para conectar seu celular à instância.
- **RF7:** O Sistema deve detectar automaticamente quando a conexão com o celular é perdida.
- **RF8:** O Usuário pode importar listas de contatos a partir de arquivos CSV ou Excel.
- **RF9:** O Sistema deve normalizar automaticamente os números de telefone importados (adicionar +55, tratar nono dígito).
- **RF10:** O Usuário pode criar, editar e excluir "Categorias" (Tags) para organizar seus contatos.
- **RF11:** O Usuário pode atribuir uma ou mais categorias a um contato ou grupo de contatos.
- **RF12:** O Usuário pode adicionar, editar ou excluir contatos individualmente (Dono apenas).
- **RF13:** O Usuário pode redigir mensagens de texto para envio em massa.
- **RF14:** O Usuário pode inserir variações manuais via sintaxe `{A|B}` OU clicar em "Gerar Variações" para Spintax assistido (via Gemini API).
- **RF15:** O Usuário pode fazer upload de uma imagem (JPG/PNG) para acompanhar a mensagem de texto.
- **RF16:** O Usuário pode visualizar uma prévia (preview) da mensagem antes do disparo.
- **RF17:** O Usuário pode agendar a data e hora para o início de um disparo de mensagens.
- **RF18:** O Usuário pode selecionar uma ou mais categorias de contatos como alvo de uma campanha.
- **RF18b:** O Usuário pode selecionar contatos individuais (avulsos) como alvo de uma campanha, independentemente de categoria.
- **RF18c:** O Usuário pode arrastar/colar uma lista de contatos (CSV/Texto) diretamente no modal de nova campanha, sem precisar importar formalmente antes.
- **RF19:** O Usuário pode visualizar o progresso de uma campanha em tempo real (barra de progresso).
- **RF20:** O Usuário pode visualizar o histórico de campanhas realizadas e seus resultados.
- **RF21:** O Sistema deve processar os envios em segundo plano (background), permitindo que o usuário feche o navegador.
- **RF22:** O Sistema deve aplicar delays aleatórios entre as mensagens de uma campanha.
- **RF23:** O Sistema deve realizar pausas longas automáticas após um determinado volume de envios.
- **RF24:** O Sistema deve pausar automaticamente um envio caso a conexão com o WhatsApp seja perdida.
- **RF25:** O Sistema deve registrar o status de entrega (Enviado/Falha) para cada contato da campanha.
- **RF26:** Antes de iniciar qualquer lote de envio, o Worker deve consultar o endpoint de status da UAZAPI. Se a bateria estiver < 15% ou desconectado, o envio é adiado e o usuário notificado.
- **RF27:** O Frontend deve validar a sintaxe `{}` em tempo real. Se houver chaves desbalanceadas, o botão de agendamento deve ser bloqueado.
- **RF28:** O Sistema deve sincronizar contatos na agenda da instância WhatsApp antes do envio (via `POST /contact/add` da Uazapi).
- **RF29:** O Sistema deve simular o comportamento "Digitando..." (`composing`) antes de cada envio de mensagem.
- **RF30:** O Sistema deve monitorar respostas dos leads (via webhook `onMessage`) e calcular um Score de Engajamento.
- **RF31:** Ao iniciar nova campanha para categorias com leads "inativos" (sem resposta), o sistema deve alertar o usuário sobre o risco de banimento.

### Non-Functional Requirements

- **NFR1:** O tempo de carregamento inicial (LCP) do dashboard deve ser inferior a 2 segundos em conexões 4G.
- **NFR2:** O processamento interno de um lote de mensagens deve ocorrer em menos de 500ms.
- **NFR3:** Todos os dados sensíveis (contatos e mensagens) devem ser criptografados em repouso no Firestore.
- **NFR4:** Tokens e Instance IDs da UAZAPI devem ser armazenados em coleções protegidas, nunca expostos no frontend.
- **NFR5:** O Worker deve implementar retentativas automáticas com backoff exponencial para falhas de rede.
- **NFR6:** O estado da campanha (cursor de envio) deve ser persistido atomicamente após cada mensagem.
- **NFR7:** A arquitetura deve suportar até 100 clientes simultâneos sem degradação de performance.
- **NFR8:** Logs detalhados de envio devem ser automaticamente deletados após 30 dias (TTL Policy).

### Additional Requirements

**From Architecture:**
- **Starter Template:** Vite 7 + React 19 + shadcn/ui (`npm create vite@latest web -- --template react-ts`)
- **Worker Pattern:** Short-Batch Cron (Cloud Scheduler a cada 5 minutos)
- **Monorepo Structure:** `functions/` (Backend) + `web/` (Frontend) na mesma raiz
- **Naming Conventions:** snake_case para Firestore Collections, PascalCase para React Components
- **Security:** Firebase Auth + Firestore Security Rules para Multi-tenancy

**From UX Design:**
- **Design System:** Stitch Native (Tailwind CSS v4 + shadcn/ui com skin customizada)
- **Responsive Strategy:** Desktop-First, Mobile como "Companion" para monitoramento
- **Accessibility:** WCAG 2.1 AA (Keyboard Navigation, aria-live para status)
- **Custom Components:** StatsCard, SmartDropzone, SidebarNav, SpintaxComposer
- **Feedback Patterns:** Toast Notifications (Sonner), Inline Validation, Optimistic UI

### FR Coverage Map

| FR | Epic | Descrição |
|---|---|---|
| RF1 | Epic 1 | Admin cria clientes |
| RF2 | Epic 1 | Login/Logout |
| RF3 | Epic 1 | Cadastro Secretária |
| RF4 | Epic 1 | Multi-tenancy |
| RF5 | Epic 2 | Status WhatsApp |
| RF6 | Epic 2 | QR Code |
| RF7 | Epic 2 | Detecção desconexão |
| RF8 | Epic 3 | Importar CSV/Excel |
| RF9 | Epic 3 | Normalizar telefones |
| RF10 | Epic 3 | CRUD Categorias |
| RF11 | Epic 3 | Atribuir categorias |
| RF12 | Epic 3 | CRUD Contatos |
| RF13 | Epic 4 | Redigir mensagem |
| RF14 | Epic 4 | Spintax Assistido |
| RF15 | Epic 4 | Upload imagem |
| RF16 | Epic 4 | Preview mensagem |
| RF17 | Epic 5 | Agendar disparo |
| RF18 | Epic 5 | Selecionar categorias |
| RF18b | Epic 5 | Selecionar contatos avulsos |
| RF18c | Epic 5 | Upload rápido no modal |
| RF19 | Epic 5 | Progresso tempo real |
| RF20 | Epic 5 | Histórico campanhas |
| RF21 | Epic 6 | Background processing |
| RF22 | Epic 6 | Delays aleatórios |
| RF23 | Epic 6 | Pausas longas |
| RF24 | Epic 6 | Pausar ao desconectar |
| RF25 | Epic 6 | Status por contato |
| RF26 | Epic 6 | Health Check |
| RF27 | Epic 4 | Validação Spintax |
| RF28 | Epic 6 | Sync Contatos na Instância |
| RF29 | Epic 6 | Simular Digitando |
| RF30 | Epic 6 | Score de Engajamento |
| RF31 | Epic 5 | Alerta de Risco |

## Epic List

### Epic 1: Fundação do Projeto e Autenticação
O administrador pode provisionar clientes e usuários podem acessar o sistema com segurança.
**FRs cobertos:** RF1, RF2, RF3, RF4
**Notas:** Inclui setup do monorepo (Vite + Functions), Firebase Auth, e Firestore Security Rules para Multi-tenancy.

### Epic 2: Conexão com WhatsApp
O usuário pode conectar seu celular ao sistema via QR Code e monitorar o status da conexão em tempo real.
**FRs cobertos:** RF5, RF6, RF7
**Notas:** Integração com UAZAPI (Webhooks de estado). Endpoint de Health Check para o Worker.

### Epic 3: Gestão de Contatos e Audiência
O usuário pode importar, organizar e gerenciar sua base de leads com categorias.
**FRs cobertos:** RF8, RF9, RF10, RF11, RF12
**Notas:** SmartDropzone para upload, Sanitização automática de telefones, CRUD de categorias.

### Epic 4: Composição de Mensagens
O usuário pode criar mensagens de texto com variações (Spintax), anexar imagens e pré-visualizar o resultado.
**FRs cobertos:** RF13, RF14, RF15, RF16, RF27
**Notas:** SpintaxComposer com validação em tempo real, Upload de imagem, Preview.

### Epic 5: Agendamento e Monitoramento de Campanhas
O usuário pode agendar envios, selecionar audiências (categorias OU lista rápida) e acompanhar o progresso em tempo real.
**FRs cobertos:** RF17, RF18, RF18b, RF18c, RF19, RF20, RF31
**Notas:** Dashboard com StatsCards, Barra de Progresso, Histórico de Campanhas. Suporta "Campanha Relâmpago" (upload direto de CSV no modal).

### Epic 6: Motor de Envio Resiliente e Humanizado (Worker Anti-Ban Pro)
O sistema processa envios em background de forma segura, simulando comportamento humano com delays avançados, sincronização de contatos na agenda, e monitoramento de engajamento para evitar banimentos.
**FRs cobertos:** RF21, RF22, RF23, RF24, RF25, RF26, RF28, RF29, RF30
**Notas:** Short-Batch Cron (5min), Cursor atômico, Health Check pré-lote, Sync de Contatos via API, Simular "Digitando", Score de Engajamento.

---

## Epic 1: Fundação do Projeto e Autenticação

O administrador pode provisionar clientes e usuários podem acessar o sistema com segurança.

### Story 1.1: Setup do Monorepo e Infraestrutura Base

**Como** Desenvolvedor,
**Eu quero** inicializar o projeto com a estrutura monorepo definida na arquitetura,
**Para que** o desenvolvimento possa começar com a fundação técnica correta.

**Acceptance Criteria:**

**Given** o repositório está vazio
**When** eu executo os comandos de setup (`npm create vite@latest web`, `firebase init`)
**Then** a estrutura `web/` e `functions/` existe na raiz
**And** o projeto roda localmente com Firebase Emulators

### Story 1.2: Autenticação de Usuário (Login/Logout)

**Como** Usuário (Dono ou Secretária),
**Eu quero** fazer login com email e senha,
**Para que** eu possa acessar minha conta de forma segura.

**Acceptance Criteria:**

**Given** o usuário tem credenciais válidas
**When** ele submete o formulário de login
**Then** ele é redirecionado para o Dashboard
**And** o token de sessão é armazenado de forma segura

**Given** o usuário está logado
**When** ele clica em "Sair"
**Then** a sessão é encerrada e ele é redirecionado para a tela de Login

### Story 1.3: Criação Manual de Clientes (Admin Only)

**Como** Administrador (Joel),
**Eu quero** criar contas de clientes manualmente via Firebase Console ou Script,
**Para que** eu possa provisionar novos clientes de forma premium.

**Acceptance Criteria:**

**Given** o admin tem acesso ao Firebase Console
**When** ele cria um documento em `clients/{clientId}`
**Then** o documento contém `ownerId`, `name`, e placeholder para `uazapiConfig`
**And** as Security Rules permitem que apenas o owner e suas secretárias acessem os dados

### Story 1.4: Cadastro de Secretária com Permissões Restritas

**Como** Usuário (Dono),
**Eu quero** adicionar uma secretária à minha conta,
**Para que** ela possa operar o sistema com permissões limitadas.

**Acceptance Criteria:**

**Given** o Dono está logado
**When** ele acessa "Configurações > Equipe" e adiciona um email
**Then** um documento é criado em `clients/{clientId}/team_members/{memberId}` com `role: 'secretary'`
**And** a secretária pode fazer login e ver apenas os recursos permitidos (RF3)
**And** a secretária NÃO consegue deletar contatos ou acessar configurações de API

---

## Epic 2: Conexão com WhatsApp

O usuário pode conectar seu celular ao sistema via QR Code e monitorar o status da conexão em tempo real.

### Story 2.1: Exibição do QR Code para Conexão

**Como** Usuário (Dono),
**Eu quero** visualizar um QR Code para conectar meu WhatsApp,
**Para que** eu possa vincular meu celular à instância de envio.

**Acceptance Criteria:**

**Given** a instância UAZAPI está configurada para o cliente
**When** o usuário acessa a página "Conexão"
**Then** um QR Code é exibido na tela (via API UAZAPI `/instance/qrcode`)
**And** há instrução clara: "Abra o WhatsApp > Aparelhos Conectados > Escanear"

**Given** o QR Code expira (timeout UAZAPI)
**When** o usuário clica em "Gerar Novo"
**Then** um novo QR Code é exibido sem reload da página

### Story 2.2: Exibição do Status da Instância em Tempo Real

**Como** Usuário,
**Eu quero** ver se meu WhatsApp está conectado ou desconectado,
**Para que** eu saiba se posso agendar envios com segurança.

**Acceptance Criteria:**

**Given** o usuário está no Dashboard ou na página de Conexão
**When** o status da instância muda (via Webhook UAZAPI)
**Then** o indicador visual atualiza em tempo real (Verde = Online, Vermelho = Offline)
**And** se desconectado, um alerta contextual sugere "Reconectar"

### Story 2.3: Detecção Automática de Perda de Conexão

**Como** Sistema,
**Eu quero** detectar quando a conexão com o celular é perdida,
**Para que** eu possa pausar envios e notificar o usuário imediatamente.

**Acceptance Criteria:**

**Given** uma campanha está em andamento
**When** o Webhook da UAZAPI envia status `disconnected`
**Then** o Worker pausa a campanha no contato atual
**And** o Dashboard exibe alerta: "WhatsApp desconectado. Envio pausado."
**And** o campo `lastContactIndex` no Firestore marca o ponto de pausa

---

## Epic 3: Gestão de Contatos e Audiência

O usuário pode importar, organizar e gerenciar sua base de leads com categorias.

### Story 3.1: Importação de Contatos via CSV/Excel

**Como** Usuário,
**Eu quero** importar minha lista de contatos arrastando um arquivo,
**Para que** eu possa ter minha base de leads pronta rapidamente.

**Acceptance Criteria:**

**Given** o usuário está na página "Contatos"
**When** ele arrasta um arquivo CSV ou XLSX para o SmartDropzone
**Then** o sistema faz o parsing do arquivo e exibe um resumo: "1.500 contatos encontrados"
**And** se houver erros de formato, uma mensagem clara indica as linhas problemáticas

### Story 3.2: Sanitização Automática de Telefones

**Como** Sistema,
**Eu quero** normalizar automaticamente os números importados,
**Para que** os envios não falhem por formato incorreto.

**Acceptance Criteria:**

**Given** o usuário importou um arquivo com números variados ("11999887766", "(11) 99988-7766", "99988-7766")
**When** o parsing é concluído
**Then** todos os números são convertidos para o formato E.164 (`+5511999887766`)
**And** números inválidos (menos de 10 dígitos, letras) são marcados como "Inválidos" e excluídos da contagem final
**And** o usuário vê: "1.480 válidos, 20 inválidos (removidos)"

### Story 3.3: CRUD de Categorias (Tags)

**Como** Usuário,
**Eu quero** criar categorias para organizar meus contatos,
**Para que** eu possa segmentar meus envios por público-alvo.

**Acceptance Criteria:**

**Given** o usuário está na página "Categorias"
**When** ele clica em "Nova Categoria" e digita "Saúde"
**Then** um documento é criado em `clients/{clientId}/categories/{catId}`
**And** a categoria aparece na lista imediatamente (Optimistic UI)

**Given** o usuário quer editar uma categoria
**When** ele clica no menu "Editar" e muda o nome
**Then** o documento é atualizado e a UI reflete a mudança

**Given** o usuário quer excluir uma categoria (Dono apenas)
**When** ele clica em "Excluir" e confirma
**Then** a categoria é removida mas os contatos NÃO são deletados (apenas desassociados)

### Story 3.4: Atribuição de Categorias a Contatos

**Como** Usuário,
**Eu quero** atribuir categorias aos meus contatos durante ou após a importação,
**Para que** eu possa organizar minha audiência.

**Acceptance Criteria:**

**Given** o usuário está finalizando uma importação
**When** ele seleciona uma categoria no dropdown "Categorizar como"
**Then** todos os contatos importados recebem essa categoria

**Given** o usuário está visualizando um contato individual
**When** ele adiciona/remove uma tag
**Then** o campo `categories[]` do documento é atualizado

### Story 3.5: CRUD de Contatos Individuais

**Como** Usuário (Dono),
**Eu quero** adicionar, editar ou excluir contatos manualmente,
**Para que** eu possa corrigir dados ou adicionar leads avulsos.

**Acceptance Criteria:**

**Given** o usuário está na lista de contatos
**When** ele clica em "Novo Contato" e preenche nome/telefone
**Then** o contato é salvo em `clients/{clientId}/contacts/{contactId}`

**Given** o usuário é Secretária
**When** ela tenta excluir um contato
**Then** o botão "Excluir" está desabilitado ou oculto (RF3 - permissão restrita)

---

## Epic 4: Composição de Mensagens

O usuário pode criar mensagens de texto com variações (Spintax), anexar imagens e pré-visualizar o resultado.

### Story 4.1: Editor de Mensagem de Texto

**Como** Usuário,
**Eu quero** redigir uma mensagem de texto para minha campanha,
**Para que** eu possa comunicar minha oferta aos clientes.

**Acceptance Criteria:**

**Given** o usuário está na página "Nova Campanha"
**When** ele digita no campo de mensagem
**Then** um contador de caracteres exibe o tamanho atual
**And** o texto é salvo como rascunho automaticamente a cada 10 segundos (ícone de nuvem)

### Story 4.2: Suporte a Spintax Manual com Validação

**Como** Usuário,
**Eu quero** inserir variações de texto usando a sintaxe `{Olá|Oi|E aí}`,
**Para que** minhas mensagens pareçam mais naturais e evitem detecção de spam.

**Acceptance Criteria:**

**Given** o usuário digita `{Olá|Oi}` no editor
**When** a sintaxe está correta (chaves balanceadas)
**Then** o texto é destacado visualmente (highlight verde)
**And** o botão de agendamento permanece habilitado

**Given** o usuário digita `{Olá|Oi` (chave não fechada)
**When** o validador detecta o erro
**Then** o texto é destacado em vermelho
**And** o botão de agendamento é desabilitado com tooltip: "Corrija a sintaxe de variação"

### Story 4.3: Geração de Spintax Assistido (IA)

**Como** Usuário,
**Eu quero** clicar em "Gerar Variações" e receber sugestões automáticas,
**Para que** eu não precise pensar em todas as alternativas manualmente.

**Acceptance Criteria:**

**Given** o usuário escreveu "Olá, tudo bem? Temos uma promoção..."
**When** ele clica em "Gerar Variações" (ícone de varinha mágica)
**Then** o sistema chama a Gemini API e retorna uma versão Spintax: `{Olá|Oi|E aí}, {tudo bem|como vai}?...`
**And** o usuário pode aceitar, editar ou rejeitar a sugestão

### Story 4.4: Upload de Imagem para Campanha

**Como** Usuário,
**Eu quero** anexar uma imagem à minha mensagem,
**Para que** eu possa enviar material visual junto com o texto.

**Acceptance Criteria:**

**Given** o usuário está no editor de mensagem
**When** ele clica em "Anexar Imagem" e seleciona um arquivo JPG/PNG
**Then** a imagem é exibida como preview na área do composer
**And** se a imagem for > 1MB, ela é comprimida automaticamente para WEBP (NFR - Media Sanitization)

### Story 4.5: Preview da Mensagem Antes do Disparo

**Como** Usuário,
**Eu quero** visualizar como minha mensagem vai aparecer no WhatsApp,
**Para que** eu possa revisar antes de enviar.

**Acceptance Criteria:**

**Given** o usuário preencheu texto e/ou imagem
**When** ele clica em "Pré-visualizar"
**Then** um modal exibe a mensagem em um mockup de conversa de WhatsApp
**And** se houver Spintax, o preview alterna automaticamente entre as variações a cada 2 segundos

---

## Epic 5: Agendamento e Monitoramento de Campanhas

O usuário pode agendar envios, selecionar audiências e acompanhar o progresso em tempo real.

### Story 5.1: Seleção de Audiência (Categorias + Contatos Avulsos)

**Como** Usuário,
**Eu quero** selecionar categorias e/ou contatos individuais como alvo da minha campanha,
**Para que** eu tenha flexibilidade total na definição da audiência.

**Acceptance Criteria:**

**Given** o usuário está criando uma campanha
**When** ele seleciona as categorias "Saúde" e "Premium" no multi-select
**Then** o sistema calcula e exibe: "1.250 contatos selecionados"

**Given** o usuário quer adicionar contatos avulsos
**When** ele clica em "Adicionar Contatos" e busca por nome/telefone
**Then** ele pode selecionar contatos individuais via checkbox
**And** esses contatos são adicionados à audiência mesmo sem categoria

**Given** o usuário selecionou categorias E contatos avulsos
**When** ele visualiza o resumo
**Then** o sistema mostra: "1.250 (por categoria) + 10 (avulsos) = 1.260 contatos"
**And** contatos duplicados (presentes em categoria E selecionados manualmente) são contados apenas uma vez

**Given** o usuário quer criar uma campanha APENAS com contatos avulsos (sem categoria)
**When** ele não seleciona nenhuma categoria, apenas contatos individuais
**Then** a campanha é criada normalmente apenas com os contatos selecionados

### Story 5.2: Agendamento de Data e Hora do Disparo

**Como** Usuário,
**Eu quero** definir quando minha campanha deve iniciar,
**Para que** eu possa planejar envios para horários estratégicos.

**Acceptance Criteria:**

**Given** o usuário preencheu mensagem e selecionou audiência
**When** ele escolhe data/hora no DatePicker e clica em "Agendar"
**Then** um documento é criado em `campaigns/{campId}` com `scheduledAt` e `status: 'scheduled'`
**And** o usuário vê confirmação: "Campanha agendada para Segunda, 09:00"

**Given** o usuário seleciona uma data/hora no passado
**When** ele tenta agendar
**Then** uma validação bloqueia: "Selecione um horário futuro"

### Story 5.3: Dashboard de Progresso em Tempo Real

**Como** Usuário,
**Eu quero** ver o progresso da minha campanha enquanto ela roda,
**Para que** eu tenha paz de espírito de que o sistema está funcionando.

**Acceptance Criteria:**

**Given** uma campanha está com `status: 'running'`
**When** o usuário acessa o Dashboard
**Then** ele vê uma barra de progresso: "450 de 1.250 enviados (36%)"
**And** a barra atualiza em tempo real via Firestore Listener
**And** há um indicador textual: "O robô está trabalhando... próxima mensagem em ~60s"

### Story 5.4: Histórico de Campanhas e Resultados

**Como** Usuário,
**Eu quero** ver o histórico das minhas campanhas passadas,
**Para que** eu possa analisar resultados e reenviar se necessário.

**Acceptance Criteria:**

**Given** o usuário está na página "Campanhas"
**When** ele visualiza a lista
**Then** ele vê todas as campanhas ordenadas por data (mais recente primeiro)
**And** cada item mostra: Título, Data, Total Enviados, Taxa de Sucesso (%)

**Given** o usuário clica em uma campanha específica
**When** a página de detalhes abre
**Then** ele vê a lista de contatos com status individual (Enviado ✅ / Falha ❌)

### Story 5.5: Campanha Relâmpago (Upload Rápido de Lista)

**Como** Usuário (MEI ou PME sem tempo),
**Eu quero** criar uma campanha arrastando um CSV diretamente no modal,
**Para que** eu não precise cadastrar contatos formalmente antes de enviar.

**Acceptance Criteria:**

**Given** o usuário está na Etapa 1 do Modal de Nova Campanha
**When** ele visualiza a seleção de público
**Then** ele vê duas abas: "Por Categorias" (padrão) e "Lista Rápida"

**Given** o usuário seleciona a aba "Lista Rápida"
**When** ele arrasta um CSV ou cola uma lista de números no textarea
**Then** o sistema faz o parsing, sanitização e exibe: "X contatos prontos para envio"

**Given** a campanha é salva
**When** o backend processa a lista
**Then** ele faz Upsert (cria se não existe, reutiliza se existe) dos contatos
**And** a campanha é associada a esses IDs via campo `targetContactIds`

---

## Epic 6: Motor de Envio Resiliente e Humanizado (Worker Anti-Ban Pro)

O sistema processa envios em background de forma segura, simulando comportamento humano com delays avançados, sincronização de contatos na agenda, e monitoramento de engajamento para evitar banimentos.

**Technical Context (Uazapi Capabilities - Confirmado em docs.uazapi.com):**
- `POST /contact/add`: Adiciona contato ao phonebook da instância (blindagem de confiança).
- `POST /presence`: Envia sinal "composing" (digitando) ou "recording" (gravando áudio).
- `Webhook onMessage`: Recebe mensagens de entrada para calcular Score de Engajamento.

### Story 6.1: Worker de Envio em Background (Fire and Forget)

**Como** Sistema,
**Eu quero** processar envios em segundo plano via Cloud Functions,
**Para que** o usuário possa fechar o navegador sem interromper a campanha.

**Acceptance Criteria:**

**Given** uma campanha tem `status: 'scheduled'` e `scheduledAt <= now`
**When** o Cloud Scheduler aciona o Worker (Cron 5 min)
**Then** o Worker busca campanhas pendentes e inicia o processamento
**And** o `status` é atualizado para `'running'`

**Given** o Worker está processando
**When** o usuário fecha o navegador
**Then** o envio continua normalmente no servidor

### Story 6.2: Delays Aleatórios Humanizados (Anti-Ban - Delays)

**Como** Sistema,
**Eu quero** aplicar delays aleatórios avançados entre cada mensagem,
**Para que** o padrão de envio simule comportamento humano real e evite detecção.

**Acceptance Criteria:**

**Algoritmo de Micro-Delay (Jitter Gaussiano):**
**Given** o Worker está enviando mensagens
**When** uma mensagem é enviada com sucesso
**Then** o Worker aguarda um tempo aleatório baseado em distribuição Gaussiana entre `MIN_DELAY` (45s) e `MAX_DELAY` (120s) antes da próxima
**And** os valores de delay são configuráveis por cliente (Override para "Chip Maturado")

**Given** a hora atual está entre 12:00 e 14:00 (Horário de Almoço) ou entre 18:00 e 20:00 (Horário de Pico)
**When** o algoritmo calcula o delay
**Then** ele adiciona +20% ao tempo base para simular "humano ocupado"

### Story 6.3: Pausas Longas Automáticas ("Pausa para Café")

**Como** Sistema,
**Eu quero** realizar pausas longas e variáveis após um volume de envios,
**Para que** o comportamento simule intervalos naturais de descanso humano.

**Acceptance Criteria:**

**Given** o Worker enviou um número aleatório entre 15 e 25 mensagens (calculado a cada ciclo)
**When** o limite é atingido
**Then** o Worker agenda uma "Pausa para Café" de duração **aleatória** entre 10 e 25 minutos
**And** o sistema persiste `nextResumeAt` no documento da campanha para retomar após a pausa

**Given** a pausa é acionada
**When** o período de pausa termina
**Then** o próximo Cron (ou Cloud Task agendado) retoma do `lastContactIndex`

**Algoritmo Dinâmico:**
- A duração da pausa NÃO é fixa. A cada "Pausa para Café", o sistema sorteia um novo valor no range.
- Exemplo: Pausa 1 = 12min, Pausa 2 = 18min, Pausa 3 = 11min.

### Story 6.4: Pausa Automática ao Perder Conexão

**Como** Sistema,
**Eu quero** pausar imediatamente o envio se o WhatsApp desconectar,
**Para que** nenhuma mensagem seja perdida ou cause erro.

**Acceptance Criteria:**

**Given** uma campanha está `'running'`
**When** o Webhook UAZAPI informa `status: 'disconnected'`
**Then** o Worker atualiza a campanha para `status: 'paused'`
**And** o `pauseReason` é registrado: "WhatsApp desconectado"
**And** o Dashboard exibe alerta imediato ao usuário

**Given** o WhatsApp é reconectado (Webhook `status: 'connected'`)
**When** o próximo Cron roda
**Then** as campanhas pausadas por desconexão são automaticamente retomadas

### Story 6.5: Registro de Status por Contato

**Como** Sistema,
**Eu quero** registrar o resultado de cada envio individual,
**Para que** o usuário possa ver quais mensagens falharam.

**Acceptance Criteria:**

**Given** o Worker envia uma mensagem para um contato
**When** a API UAZAPI retorna sucesso
**Then** um documento é criado em `campaigns/{campId}/send_logs/{logId}` com `status: 'sent'`, `sentAt`

**Given** a API UAZAPI retorna erro
**When** o Worker processa a resposta
**Then** o documento é criado com `status: 'failed'`, `errorMessage`
**And** o Worker continua para o próximo contato (não trava a fila)

### Story 6.6: Health Check Pré-Envio

**Como** Sistema,
**Eu quero** verificar o estado da instância antes de cada lote,
**Para que** eu não tente enviar quando o celular está com bateria baixa ou offline.

**Acceptance Criteria:**

**Given** o Cron inicia uma execução do Worker
**When** o Worker busca campanhas pendentes
**Then** ele primeiro chama o endpoint `/instance/status` da UAZAPI

**Given** o status retorna `battery < 15%` ou `connected: false`
**When** o Worker avalia a resposta
**Then** ele NÃO processa nenhuma campanha neste ciclo
**And** atualiza a flag `instanceHealthy: false` no documento do cliente
**And** o Dashboard exibe: "Reconecte seu celular ou carregue a bateria"

### Story 6.7: Sincronização de Contatos na Agenda da Instância (Blindagem)

**Como** Sistema,
**Eu quero** adicionar o contato à agenda da instância WhatsApp antes de enviar a primeira mensagem,
**Para que** o algoritmo da Meta reconheça o destinatário como "contato salvo" e aumente a confiança.

**Acceptance Criteria:**

**Given** o Worker está prestes a enviar para um contato pela primeira vez
**When** ele verifica o flag `syncedToInstance` do contato no banco local
**Then** se `false`, ele chama `POST /contact/add` na Uazapi com `{phone, name}`
**And** atualiza `syncedToInstance: true` no documento do contato após sucesso

**Given** o contato já foi sincronizado anteriormente (`syncedToInstance: true`)
**When** o Worker processa esse contato
**Then** ele pula a etapa de sync e segue direto para o envio

### Story 6.8: Simular "Digitando..." Antes do Envio (Anti-Ban - Presence)

**Como** Sistema,
**Eu quero** enviar o sinal de "Digitando..." para o contato antes de cada mensagem,
**Para que** a interação pareça humana e não robótica.

**Acceptance Criteria:**

**Given** o Worker vai enviar uma mensagem
**When** ele inicia o fluxo de envio para um JID (contato)
**Then** ele primeiro chama `POST /presence` com `type: 'composing'` e aguarda um tempo aleatório (3s a 8s)
**And** somente após o delay de presença, ele chama `POST /sendText`

**Sequence (Pseudo-Algoritmo):**
1. `POST /presence { jid, type: 'composing' }`
2. `await sleep(random(3000, 8000))` // Simula digitação
3. `POST /sendText { phone, message }`

### Story 6.9: Score de Engajamento e Listener de Respostas

**Como** Sistema,
**Eu quero** monitorar quais leads respondem às mensagens enviadas,
**Para que** eu possa calcular um Score de Engajamento e alertar o usuário sobre leads inativos de risco.

**Acceptance Criteria:**

**Given** o Webhook da Uazapi (`onMessage`) recebe uma mensagem de entrada
**When** o sistema processa o evento
**Then** ele identifica o remetente (JID), encontra o contato no banco e atualiza `lastReplyAt` e `engagementScore`

**Lógica do Score:**
- 🟢 **Engajado (Score 3):** Respondeu nos últimos 30 dias.
- 🟡 **Neutro (Score 2):** Recebeu e visualizou (Webhook `read`), mas não respondeu.
- 🔴 **Fantasma (Score 1):** Não respondeu a 3+ mensagens consecutivas ou nunca interagiu.

**Given** o usuário inicia uma nova campanha para uma categoria
**When** o sistema analisa a audiência
**Then** ele calcula a % de contatos com Score 1 ("Fantasmas")
**And** se > 30%, exibe alerta: "Atenção: X% dos leads nunca interagiram. Risco de Ban."

### Story 6.10: Warm-up e Fracionamento de Listas Grandes (Smart Queue)

**Como** Sistema,
**Eu quero** fracionar automaticamente campanhas grandes para respeitar um limite diário seguro,
**Para que** chips novos ou envios grandes não sejam bannidos por volume excessivo.

**Acceptance Criteria:**

**Given** o cliente tem uma configuração `dailySendLimit` (ex: 100 para chip novo, 300 para chip maturado)
**And** uma campanha tem 900 contatos
**When** a campanha é criada
**Then** o sistema divide em lotes: Dia 1 = 100, Dia 2 = 150, Dia 3 = 200... até completar
**And** a UI mostra "Campanha em Andamento (Previsão: 5 dias)"

**Given** o usuário marca "Chip Maturado" nas configurações
**When** ele cria uma campanha
**Then** o `dailySendLimit` é aumentado e o fracionamento é menos agressivo

---
