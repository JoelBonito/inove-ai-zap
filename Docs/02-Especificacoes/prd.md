---
stepsCompleted: [step-01-init, step-02-discovery, step-03-success, step-04-journeys, step-05-domain, step-06-innovation, step-07-project-type, step-08-scoping, step-09-functional, step-10-nonfunctional, step-11-polish]
inputDocuments: ['docs/02-Especificacoes/product-brief-inove-ai-zap-2026-01-12.md']
workflowType: 'prd'
project_name: 'inove-ai-zap'
classification:
  projectType: saas_b2b
  domain: marketing_automation
  complexity: low_medium
  projectContext: greenfield
---

# Product Requirements Document - inove-ai-zap

**Author:** Joel
**Date:** 2026-01-12

<!-- Content will be appended sequentially through collaborative workflow steps -->

## Success Criteria

### User Success
- **Time to First Message (TTFM):** O usuário deve conseguir iniciar o primeiro disparo em menos de 180 segundos após o login (incluindo importação e agendamento).
- **Independência de Hardware:** O usuário deve ser capaz de agendar um envio, fechar o navegador e desligar o computador, com 100% de confiança de que o envio ocorrerá conforme planejado.
- **Feedback de Sanitização:** 100% de transparência sobre contatos inválidos ou corrigidos automaticamente durante a importação.

### Business Success
- **Retenção Alpha:** 0% de cancelamento dos clientes iniciais durante o período de validação do MVP.
- **Escalabilidade Comercial:** Validar que o custo da instância UAZAPI é absorvido pelo valor gerado para o cliente final (MEI/Pequena Empresa).

### Technical Success
- **Resiliência de Conexão:** O sistema deve detectar quedas de conexão com a UAZAPI e notificar o usuário em tempo real, pausando o envio e retomando do ponto exato após a reconexão.
- **Consumo de Recursos:** Worker de envio operando de forma otimizada (baixo consumo de CPU/Memória no Firebase Functions).
- **Recuperação de Erros:** Persistência do cursor de envio; se o processo for interrompido, ele retoma sem duplicar mensagens.

### Measurable Outcomes
- **Taxa de Sucesso de Campanha:** >95% de campanhas concluídas com sucesso.
- **Jitter de Envio:** Delays entre mensagens variando estritamente entre 45s e 90s para evitar padrões robóticos detectáveis.

## Product Scope

### MVP - Minimum Viable Product
- **Autenticação:** Login simples via Firebase Auth.
- **Gestão de Contatos:** Upload CSV/XLSX, sanitização automática e categorização por Tags (ex: "Saúde").
- **Composer de Mensagem:** Input de texto com suporte a Spintax `{Olá|Oi}` e upload de 1 imagem (JPG/PNG).
- **Agendamento (Scheduler):** Interface para definir data/hora de disparo futuro via Cloud Functions (Cron).
- **Backend Worker:** Motor de envio com lógica de delays aleatórios e pausas longas automáticas.
- **Dashboard de Acompanhamento:** Barra de progresso amigável ("O robô está trabalhando...") e status da instância WhatsApp.

### Growth Features (Post-MVP)
- **Múltiplas Mídias:** Envio de PDFs, vídeos e múltiplos arquivos por mensagem.
- **Webhooks de Engajamento:** Detecção de respostas dos clientes e alerta no dashboard.
- **Relatórios Analíticos:** Taxas de leitura e cliques em links.

### Vision (Future)
- **AI Marketing Assistant:** Sugestão de cópias de vendas baseadas em IA.
- **Integrações de CRM:** Sincronização automática com bases externas.

## User Journeys

### Jornada 1: O "Aha! Moment" do Carlos (Dono/MEI)
- **Cenário:** Sábado de manhã, Carlos tem uma hora livre e uma planilha bruta de 2.000 leads antigos.
- **Ação:** Ele acessa o inove-ai-zap, arrasta o arquivo Excel. O sistema processa em 5s e informa: "1.980 contatos válidos prontos". Ele cria uma categoria "Recuperação 2025".
- **Composer:** Escreve uma mensagem com variações `{Olá|Oi|E aí}` para evitar spam e anexa uma imagem da promoção.
- **Clímax:** Ele agenda para Segunda-feira às 09:00. O sistema exibe: "Agendado com sucesso. Pode desligar seu computador, nós assumimos daqui."
- **Resultado:** Carlos sente alívio imediato (Fire and Forget) e volta para sua família, sabendo que a prospecção está garantida.

### Jornada 2: A Recuperação de Crise da Juliana (Operadora)
- **Cenário:** Durante o envio de uma campanha, o celular da clínica perde a conexão Wi-Fi.
- **Conflito:** O Worker detecta falha de comunicação com a UAZAPI via Webhook de estado.
- **Resposta do Sistema:** O envio é pausado imediatamente no contato #450 para evitar erros. O dashboard exibe alerta vermelho: "WhatsApp Desconectado".
- **Resolução:** Juliana vê o alerta, reconecta o celular. O sistema valida a conexão e retoma automaticamente do contato #451.
- **Valor:** Nenhuma mensagem perdida, nenhuma duplicada, zero estresse para a operadora.

### Jornada 3: O Administrador (Suporte/Dev)
- **Cenário:** Joel percebe uma taxa de banimento crescendo no mercado de WhatsApp.
- **Ação:** Acessa o painel administrativo global do inove-ai-zap.
- **Intervenção:** Altera a configuração global `MIN_DELAY` de 45s para 60s para todas as instâncias.
- **Resultado:** Todos os workers ativos se adaptam ao novo ritmo na próxima mensagem, protegendo a base de clientes proativamente.

### Journey Requirements Summary
- **Importador Resiliente:** Deve aceitar planilhas "sujas" e sanitizar sem travar.
- **Stateful Worker:** O progresso do envio deve ser salvo a cada mensagem (cursor) para permitir pausas e retomadas perfeitas.
- **Real-time Feedback:** WebSockets/Snapshot listeners para alertar o frontend sobre status da UAZAPI.
- **Global Config:** Feature flags ou Remote Config para ajustes de segurança em tempo real.

## Domain-Specific Requirements (Marketing Automation & Compliance)

### Platform Compliance (Meta/WhatsApp)
- **Anti-Spam Throttling:** O sistema deve impor limites rígidos de envio (ex: máximo 500 msgs/hora por instância nova) para evitar o "flag" de spam.
- **Media Sanitization:** Imagens devem ser comprimidas automaticamente para < 1MB (formato JPEG/WEBP) para evitar sobrecarga e timeouts na API.

### Legal & Privacy (LGPD)
- **Opt-out Automático:** (Post-MVP) O sistema deve reconhecer palavras-chave como "SAIR", "STOP", "NÃO QUERO" e adicionar o número a uma "Blacklist" interna daquele cliente, impedindo envios futuros.
- **Data Residency:** Dados dos contatos (nome/telefone) devem ser armazenados com segurança e criptografia em repouso no Firestore.

### Risk Mitigation
- **Burner Numbers Strategy:** Alertar o usuário para NÃO utilizar seu número pessoal principal para disparos em massa a frio ("Cold Messaging"), sugerindo o uso de chips dedicados.

## SaaS B2B Specific Requirements

### Project-Type Overview: Premium Managed SaaS
O **inove-ai-zap** opera como um modelo de software como serviço (SaaS) de "alto toque". Diferente de plataformas massivas, cada instância é personalizada e configurada manualmente pelo administrador (Joel), garantindo uma experiência premium para MEIs e pequenas empresas que buscam exclusividade e suporte próximo.

### Technical Architecture Considerations (Multi-tenancy)
- **Tenant Isolation:** Utilizaremos o **Firestore Security Rules** para garantir o isolamento lógico dos dados. Cada documento no banco será atrelado a um `client_id`.
- **Instance Management:** As credenciais da UAZAPI (`instance_id` e `token`) serão armazenadas de forma criptografada no perfil de cada cliente no banco de dados, sendo injetadas pelo Backend Worker apenas no momento do disparo.

### RBAC & Permission Matrix (Matriz de Acessos)
Para o MVP, definimos dois níveis de acesso distintos:

| Recurso | Dono (Owner) | Secretária (Secretary) |
| :--- | :---: | :---: |
| Conectar WhatsApp (QR Code) | ✅ Sim | ❌ Não |
| Importar Contatos | ✅ Sim | ✅ Sim |
| Criar/Editar Categorias | ✅ Sim | ✅ Sim |
| **Deletar Contatos/Categorias** | ✅ Sim | 🛑 **Não** |
| Criar/Agendar Campanhas | ✅ Sim | ✅ Sim |
| Configurações de API/Conta | ✅ Sim | ❌ Não |

### Subscription & Implementation
- **Modelo de Receita:** Valor fixo mensal por instância/número conectado.
- **Provisionamento:** O administrador (Joel) cria a conta do cliente e realiza o setup inicial da UAZAPI. O cliente recebe apenas o acesso ao Dashboard pronto para uso.
- **Auditoria Simples:** O sistema deve registrar quem (Dono ou Secretária) agendou cada campanha para fins de controle interno do cliente.

## Project Scoping & Phased Development

### MVP Strategy & Philosophy
**MVP Approach:** *Problem-Solving & Experience MVP*. O foco é resolver a dor do envio em massa com uma experiência de "Fire and Forget" (Agendar e Esquecer), garantindo que o usuário sinta o valor na primeira campanha concluída sem banimentos.
**Resource Requirements:** Desenvolvedor Full-stack (Joel) + Infraestrutura Firebase + API UAZAPI.

### MVP Feature Set (Phase 1)
**Core User Journeys Supported:**
- Carlos: Importação simplificada e agendamento de campanha de reativação.
- Juliana: Monitoramento de envio e recuperação de conexão rápida.

**Must-Have Capabilities:**
- Autenticação via Firebase Auth.
- Importador de contatos com sanitização automática.
- Composer com suporte a Imagem e Spintax `{Olá|Oi}`.
- Scheduler via Cloud Functions (Cron 5min).
- Worker de Envio Seguro (Fila com delays aleatórios).
- Dashboard de Status da Campanha e da Instância.

### Post-MVP Features
**Phase 2 (Growth):**
- Suporte a múltiplos arquivos (PDF, Vídeo).
- Webhooks para notificação de respostas recebidas.
- Relatórios de taxas de entrega e leitura.
- Filtros avançados na base de contatos (Data de inclusão, categoria múltipla).

**Phase 3 (Expansion):**
- IA Generativa para criação de scripts de venda.
- Integração nativa com Google Sheets e CRMs.
- Gestão de múltiplos números de WhatsApp em um único dashboard.

### Risk Mitigation Strategy
- **Technical Risks:** Implementação de um "Global Safe-Mode" onde o administrador pode ajustar o delay de todos os envios em tempo real para reagir a mudanças no algoritmo do WhatsApp.
- **Market Risks:** Foco total em UX simplificada para evitar churn por complexidade (o "Carlos" não deve precisar de manual).
- **Resource Risks:** Provisionamento manual de clientes pelo Joel no início, reduzindo a necessidade de fluxos complexos de self-onboarding e pagamento automatizado no MVP.

## Functional Requirements

### Gestão de Acessos e Clientes (SaaS)
- **RF1:** O Administrador (Joel) pode criar contas de clientes manualmente no sistema.
- **RF2:** O Usuário (Dono) pode realizar login e logout com segurança.
- **RF3:** O Usuário (Dono) pode cadastrar um perfil para sua secretária com permissões restritas.
- **RF4:** O Sistema deve isolar completamente os dados entre diferentes clientes (Multi-tenancy).

### Integração WhatsApp (UAZAPI)
- **RF5:** O Usuário pode visualizar o status da sua instância de WhatsApp (Conectado/Desconectado).
- **RF6:** O Usuário pode gerar e visualizar o QR Code para conectar seu celular à instância.
- **RF7:** O Sistema deve detectar automaticamente quando a conexão com o celular é perdida.

### Gestão de Contatos e Audiência
- **RF8:** O Usuário pode importar listas de contatos a partir de arquivos CSV ou Excel.
- **RF9:** O Sistema deve normalizar automaticamente os números de telefone importados (adicionar +55, tratar nono dígito).
- **RF10:** O Usuário pode criar, editar e excluir "Categorias" (Tags) para organizar seus contatos.
- **RF11:** O Usuário pode atribuir uma ou mais categorias a um contato ou grupo de contatos.
- **RF12:** O Usuário pode adicionar, editar ou excluir contatos individualmente (Dono apenas).

### Composição de Mensagens e Mídia
- **RF13:** O Usuário pode redigir mensagens de texto para envio em massa.
- **RF14 (Spintax Assistido):** O Usuário pode inserir variações manuais via sintaxe `{A|B}` OU clicar em "Gerar Variações" para que o sistema sugira automaticamente um modelo Spintax enriquecido (via Gemini API).
- **RF15:** O Usuário pode fazer upload de uma imagem (JPG/PNG) para acompanhar a mensagem de texto.
- **RF16:** O Usuário pode visualizar uma prévia (preview) da mensagem antes do disparo.

### Agendamento e Controle de Campanhas
- **RF17:** O Usuário pode agendar a data e hora para o início de um disparo de mensagens.
- **RF18:** O Usuário pode selecionar uma ou mais categorias de contatos como alvo de uma campanha.
- **RF19:** O Usuário pode visualizar o progresso de uma campanha em tempo real (barra de progresso).
- **RF20:** O Usuário pode visualizar o histórico de campanhas realizadas e seus resultados.

### Motor de Envio e Segurança (Anti-Ban)
- **RF21:** O Sistema deve processar os envios em segundo plano (background), permitindo que o usuário feche o navegador.
- **RF22:** O Sistema deve aplicar delays aleatórios entre as mensagens de uma campanha.
- **RF23:** O Sistema deve realizar pausas longas automáticas após um determinado volume de envios.
- **RF24:** O Sistema deve pausar automaticamente um envio caso a conexão com o WhatsApp seja perdida.
- **RF25:** O Sistema deve registrar o status de entrega (Enviado/Falha) para cada contato da campanha.
- **RF26 (Health Check):** Antes de iniciar qualquer lote de envio, o Worker deve consultar o endpoint de status da UAZAPI. Se a bateria estiver < 15% ou desconectado, o envio é adiado e o usuário notificado.
- **RF27 (Validação Spintax):** O Frontend deve validar a sintaxe `{}` em tempo real. Se houver chaves desbalanceadas, o botão de agendamento deve ser bloqueado com uma mensagem de erro clara.

## Non-Functional Requirements

### Performance
- **NFR1 (Dashboard Responsiveness):** O tempo de carregamento inicial (LCP) do dashboard deve ser inferior a 2 segundos em conexões 4G.
- **NFR2 (Worker Efficiency):** O processamento interno de um lote de mensagens (leitura do banco -> chamada da API) deve ocorrer em menos de 500ms, garantindo que o gargalo seja apenas o delay intencional de segurança.

### Security
- **NFR3 (Data Encryption):** Todos os dados sensíveis (contatos e mensagens) devem ser criptografados em repouso no Firestore.
- **NFR4 (Credential Isolation):** Tokens e Instance IDs da UAZAPI devem ser armazenados em coleções protegidas ou Secret Manager, nunca expostos no código do frontend.

### Reliability (Critical for Anti-Ban)
- **NFR5 (Fault Tolerance):** O Worker deve implementar retentativas automáticas com backoff exponencial para falhas de rede transitórias (erros 5xx da UAZAPI).
- **NFR6 (State Persistence):** O estado da campanha (cursor de envio) deve ser persistido atomicamente após cada mensagem. Em caso de crash, a retomada deve ser exata, sem mensagens duplicadas ou puladas.

### Scalability
- **NFR7 (Multi-Tenant Scale):** A arquitetura deve suportar o escalonamento horizontal para até 100 clientes simultâneos sem degradação na performance de leitura/escrita do banco de dados.

### Cost & Efficiency
- **NFR8 (Data Retention Policy):** Logs detalhados de envio (mensagem a mensagem) devem ser automaticamente deletados ou movidos para "Cold Storage" após 30 dias para evitar custos excessivos de armazenamento no Firestore (TTL Policy).