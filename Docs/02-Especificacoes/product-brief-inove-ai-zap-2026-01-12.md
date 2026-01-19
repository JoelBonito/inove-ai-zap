---
stepsCompleted: [1, 2, 3, 4, 5]
inputDocuments: []
date: 2026-01-12
author: Joel
project_name: inove-ai-zap
---

# Product Brief: inove-ai-zap

<!-- Content will be appended sequentially through collaborative workflow steps -->

## Executive Summary

O **inove-ai-zap** é um dashboard web focado em simplicidade para automação de marketing via WhatsApp, desenhado especificamente para Microempreendedores (MEI) e Pequenas Empresas. O sistema resolve a complexidade do envio em massa para bases de leads (900 a 2000 contatos), oferecendo uma interface intuitiva de duas abas: Gestão de Contatos (com categorização inteligente) e Disparo de Mensagens. Diferente de ferramentas complexas de CRM, nossa solução prioriza a facilidade de uso ("Upload, Categorizar, Enviar") e a segurança operacional, implementando estratégias para mitigar riscos de bloqueio (ban) do WhatsApp.

---

## Core Vision

### Problem Statement
Pequenas empresas e MEIs possuem listas de leads valiosas (ex: 2000 contatos), mas enfrentam barreiras técnicas e operacionais para ativar esses clientes. O envio manual é inviável nessa escala, as Listas de Transmissão nativas exigem que o cliente tenha o número salvo, e as ferramentas de mercado atuais são complexas ou inseguras, gerando medo de banimento do número.

### Problem Impact
- **Perda de Receita:** Bases de leads estagnadas não geram vendas.
- **Risco Operacional:** Tentativas manuais ou uso de ferramentas amadoras resultam em banimento de números vitais para o negócio.
- **Ineficiência:** Tempo excessivo gasto selecionando contatos manualmente sem critérios de segmentação claros.

### Why Existing Solutions Fall Short
- **Complexidade:** CRMs completos são "canhões para matar moscas" no contexto de um disparo simples.
- **API Oficial (Meta):** Custo elevado por mensagem e burocracia de templates para marketing.
- **Ferramentas "Cinzas":** Muitas não oferecem gestão de contatos ou controle de cadência para evitar bans.

### Proposed Solution
Um Web App (React/Vite) integrado à API Uazapi (ou similar baseada em Baileys) com foco total em UX:
1.  **Aba Contatos:** Upload simples (CSV/Excel), edição rápida e sistema de Tags/Categorias (ex: "Saúde", "Vendas Jan").
2.  **Aba Mensagens:** Conexão via QR Code, compositor de mensagens e seletor de audiência por Categoria.
3.  **Motor de Envio:** Lógica de fila com delays aleatórios para simular comportamento humano e reduzir riscos.

### Key Differentiators
- **Facilidade Extrema:** Fluxo de trabalho linear pensado para usuários não-técnicos.
- **Gestão por Categorias:** Segmentação rápida (ex: enviar apenas para "Categoria Saúde") sem queries complexas.
- **Segurança Anti-Ban:** Implementação nativa de boas práticas de envio (delays, aquecimento) transparente para o usuário.

## Strategic & Technical Analysis

### API Infrastructure Decision: UAZAPI (SaaS)
Optamos pela **UAZAPI (v2/Go)** como motor de envio devido à estabilidade da infraestrutura gerenciada e facilidade de integração via REST/Webhooks.
- **Modelo:** SaaS Premium (instância por cliente).
- **Vantagem:** Elimina manutenção de infraestrutura de WhatsApp (Docker/Baileys).
- **Integração:** Webhooks para status de entrega e QR Code.

### Anti-Ban Architecture: Backend Worker Pattern
Para mitigar o risco crítico de banimento ao enviar para 2000 leads:
- **NÃO** usaremos controle via Frontend (frágil a fechamento de aba).
- **Arquitetura Escolhida:**
    1.  **Frontend:** Usuário cria a "Campanha" e o sistema gera registros de envio no banco de dados com status `PENDING`.
    2.  **Backend Worker (Firebase/Node):** Um processo em background consome a fila respeitando rigorosamente os limites (ex: 1 msg a cada 45-90s, pausas longas a cada 50 envios).
    3.  **Segurança:** O worker desacopla a ação do usuário do envio real, garantindo consistência mesmo se o computador for desligado.

## Target Users

### Primary Users

#### 1. "O Empreendedor Faz-Tudo" (Dono/MEI)
- **Nome Fictício:** Carlos
- **Perfil:** 45 anos, dono de uma corretora de seguros pequena.
- **Contexto Tecnológico:** Usa WhatsApp intensamente para fechar negócios, mas tem dificuldade com Excel e ferramentas complexas. Não sabe o que é API ou Webhook.
- **Dor Principal:** Tem uma planilha com 2.000 ex-clientes "parados" e sente que está deixando dinheiro na mesa, mas não tem tempo de mandar mensagem um por um.
- **Necessidade de UX:** Botão gigante de "Enviar", zero configurações técnicas, feedback visual amigável ("O robô está entregando suas mensagens...").
- **Momento de Uso:** Sábado de manhã ou finais de tarde, quando o escritório acalma.

#### 2. "A Secretária Multitarefa" (Operadora)
- **Nome Fictício:** Juliana
- **Perfil:** 28 anos, recepcionista em Clínica de Estética.
- **Contexto:** Passa o dia agendando consultas e respondendo dúvidas.
- **Dor Principal:** O patrão pede para avisar 900 clientes sobre uma promoção, mas ela tem que fazer isso entre um atendimento e outro. Morre de medo de travar ou ter o número da clínica banido.
- **Necessidade de UX:** Poder fechar o computador e saber que o sistema continua trabalhando. Notificações claras se a conexão com o celular cair.

### Secondary Users

#### 3. "O Consultor de Vendas/Tráfego"
- **Perfil:** Profissional que gera os leads e entrega a planilha para o dono converter.
- **Interesse:** Quer garantir que os leads gerados sejam contactados para provar seu ROI. Ajuda na categorização inicial.

### User Journey & UX Strategy (Refined)

1.  **Importação Sem Atrito:** Carlos não precisa entender de CSV. Ele pode apenas dar um "Ctrl+V" de uma lista de nomes e telefones direto no navegador. O sistema faz a **Sanitização Automática** (corrige DDI +55 e nono dígito) e avisa: *"Lemos 2.000 contatos, 15 estavam incompletos e foram removidos."*
2.  **Categorização Visual:** Juliana cria a tag colorida "Saúde" e arrasta os contatos ou importa direto para aquela categoria.
3.  **Composição e Disparo:** O usuário escreve a mensagem e clica em "Enviar". O sistema calcula o tempo de entrega seguro e informa: *"Iniciando envio para 2.000 pessoas. Previsão de término: 18h30. Você já pode fechar esta aba."*
4.  **Acompanhamento "Fire and Forget":** O sistema envia as mensagens via Backend Worker. Se o WhatsApp desconectar (celular sem bateria), o usuário recebe um alerta para reconectar e o envio retoma de onde parou.

### UX Core Principles
- **Zero Tech-Speak:** Sem termos como "Job", "CSV" ou "Payload".
- **Feedback Humano:** Barras de progresso com tempo estimado de conclusão.
- **Segurança Transparente:** Os delays e pausas ocorrem sozinhos, protegendo o número sem exigir configuração do usuário.

## Success Metrics

### North Star Metric
**"Campanhas Concluídas com Resiliência"**:
- **Meta:** 95% das campanhas atingem >90% de entrega, mesmo que ocorram desconexões temporárias ou pausas preventivas automáticas.
- *Shift Estratégico:* Em vez de prometer "Zero Ban" (impossível de garantir), o sistema promete "Gestão de Risco Automática" (pausa o envio se detectar anomalia).

### User Success Metrics (Valor para o Cliente)
1.  **Independência Operacional:** O usuário realiza todo o fluxo (Upload -> Envio) sem acionar suporte.
2.  **Confiança "Fire and Forget":** O sistema deve ser capaz de retomar um envio interrompido (ex: queda de luz) sem duplicar mensagens, garantindo a integridade da lista.
3.  **Onboarding Relâmpago:** Tempo do login ao primeiro disparo < 3 minutos.

### Business Objectives (inove-ai-zap)
1.  **Validação Técnica:** Provar que o Worker de fila consegue gerenciar 2000 disparos distribuídos em 4 horas sem estourar limites da API.
2.  **Satisfação e Retenção:** NPS > 9 dos dois primeiros clientes.

## MVP Scope

### Core Features (Obrigatório para Lançamento)

#### 1. Gestão de Contatos & Audiência
- **Smart Import:** Upload de CSV/XLSX com sanitização automática de telefones (+55...).
- **Tagging System:** Criação de categorias (ex: "Clientes VIP") e atribuição em massa.

#### 2. Composer de Campanha Rico
- **Multimídia:** Suporte a Texto + 1 Imagem (JPG/PNG).
- **Variação Anti-Ban (Spintax):** Suporte nativo a sintaxe `{Olá|Oi}` para gerar mensagens únicas por contato e evitar detecção de spam.
- **Scheduler:** Agendamento de data/hora para início do disparo.
- **Preview:** Visualização de como a mensagem ficará no celular.

#### 3. Motor de Envio Seguro (Backend)
- **Fila Inteligente:** Worker que processa envios com delays variáveis (45s-90s).
- **Gestão de Conexão:** Alerta visual se a sessão UAZAPI cair.
- **Relatório de Entrega:** Status por contato (Enviado, Falha, Aguardando).

#### 4. Sistema de Acesso
- Login único por cliente (Firebase Auth).
- Painel de configuração da Instância Uazapi (QR Code e Status).

### Out of Scope for MVP (Para v2.0)
- **Chatbot/Respostas Automáticas:** O foco agora é *outbound* (envio), não atendimento.
- **Múltiplos Usuários:** Apenas 1 login por empresa.
- **Áudios/Vídeos Pesados:** Apenas imagens leves no início para poupar banda e reduzir risco de spam.

### Future Vision
- **v2.0:** Funil de vendas automático (se cliente responder, move de categoria).
- **v3.0:** IA Generativa sugerindo textos de marketing baseados no perfil do cliente.
