# Story 5.5: Campanha Relâmpago e Upload Rápido (Quick Send)

Status: ready-for-dev

## Story

As a Usuário (MEI ou Pequena Empresa "sem tempo"),
I want criar uma campanha carregando uma lista de contatos (CSV) ou colando números diretamente,
so that eu não precise cadastrar contatos um a um ou criar categorias formais antes de enviar.

## Contexto (Problem Statement)
Atualmente, o fluxo exige: `Criar Contatos -> Criar Categoria -> Associar -> Criar Campanha`.
Isso cria fricção para usuários que querem apenas "disparar uma promoção de hoje" para uma lista que acabaram de baixar ou exportar de outro lugar. Precisamos suportar o "MEI bagunceiro" e o "Envio Relâmpago".

## Acceptance Criteria

1.  **Given** que estou na Etapa 1 do Modal de Nova Campanha
    **When** visualizo a seleção de público
    **Then** vejo duas opções/abas: "Por Categorias" (fluxo atual) e "Lista Rápida / Upload"

2.  **Given** que seleciono "Lista Rápida"
    **When** faço upload de um arquivo CSV/Excel ou colo uma lista de números
    **Then** o sistema pré-processa essa lista, mostrando a contagem de contatos válidos
    **And** permite avançar para a criação da mensagem

3.  **Given** que disparo uma campanha de "Lista Rápida"
    **When** a campanha é salva no Backend
    **Then** o sistema deve verificar cada contato da lista:
        - Se o telefone já existe no banco: Associa ele à campanha.
        - Se não existe: Cria o contato automaticamente (com tag implícita "Importado {Data}").
    **And** a campanha é salva contendo esses IDs de contatos (campo `targetContactIds` além de `targetCategoryIds`).

4.  **Given** um upload de CSV
    **When** o arquivo contém duplicatas ou números inválidos
    **Then** o sistema deve filtrar automaticamente e informar "X contatos importados, Y inválidos/duplicados".

## UX/UI Guidelines (Stitch Native)
- **Tabs Component**: Usar o padrão de Tabs do Shadcn/UI para alternar entre "Categorias" e "Lista".
- **Dropzone**: Área pontilhada clean para arrastar CSV.
- **Feedback Visual**: Ao carregar, mostrar spinner e depois "✅ 150 contatos prontos".

## Tasks

- [ ] Task 1: Backend Update (Function `createCampaign`)
  - [ ] Support `targetContactIds` (array of strings) in the payload.
  - [ ] Implement logic to process "raw contacts" if sent (check existence -> create if new -> return attributes).
  - [ ] Alternatively (Better): Frontend processes CSV, calls `importContacts` (existing Store 3.1) implicitly, gets IDs, then calls `createCampaign`. *Decision: Let's do implicit import in background or send raw list to `createCampaign` to be atomic?*
  - **Decision**: Frontend parseia CSV -> Envia array de objetos `{name, phone}` para `createCampaign`. A Cloud Function faz a lógica de `getOrCreate` (upsert) para garantir atomicidade e evitar criar contatos se a campanha falhar.

- [ ] Task 2: Frontend UI - Modal Step 1
  - [ ] Refactor `NewCampaignModal.tsx` to include Tabs.
  - [ ] Implement CSV Parser (client-side) to extract Name/Phone.
  - [ ] Implement "Paste List" logic (textarea simple parser).

## Dev Agent Record

### Agent Model Used
BMad PM Agent (John) + UX Designer Collaboration

### File List
- docs/implementation-artifacts/story-5-5-campanha-relampago-e-upload-csv.md
