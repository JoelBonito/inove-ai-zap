---
project_name: 'inove-ai-zap'
user_name: 'Joel'
date: '2026-01-13'
sections_completed: ['technology_stack', 'patterns']
existing_patterns_found: 15
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

### Frontend
- **Core:** React 19.2.0 + Vite 7.2.5 (Rolldown)
- **Language:** TypeScript 5.9.3 (`strict: true`)
- **Styling:** Tailwind CSS 4.1.18 + Shadcn/ui (Radix Primitives)
- **State Management:** Zustand 5.0 + TanStack Query 5.90
- **Routing:** React Router Dom 7.12
- **Icons:** Lucide React

### Backend (Serverless)
- **Platform:** Firebase Functions v2 (Node.js 20)
- **Database:** Cloud Firestore (NoSQL)
- **Auth:** Firebase Authentication
- **Validation:** Zod 4.3.5

### Development & Tools
- **Package Manager:** NPM
- **Linting:** ESLint 9.39 + TypeScript-ESLint
- **Formatting:** Prettier (Implied)
- **Aliases:** `@/*` -> `./src/*` (Web)

## Critical Implementation Rules

### 1. General Governance (GEMS 4.0)
- **Language:** Code in English (variables, functions). **Docs, Comments, UI strings in PT-BR (Brazilian Portuguese)**.
- **Directories:** Technical docs must reside in `docs/`.
- **Validation:** All inputs must be validated with **Zod** schemas.
- **Strictness:** `noImplicitAny` is ON. No `any` allowed without a very strong justification comment.

### 2. Frontend Patterns
- **Components:** Use `PascalCase.tsx`. Place in `web/src/components`.
- **UI Lib:** Use **only** components from `@/components/ui` (Shadcn). Do not invent new CSS classes if utility classes suffice.
- **Hooks:** Prefix with `use` (e.g., `useCampaignStatus`).
- **Data Fetching:** Use `useQuery` / `useMutation` for server state. Use `store` (Zod) for global client state.

### 3. Backend Patterns
- **Functions:** Located in `functions/src`. Use ESM (`import/export`).
- **Security:** Never trust the client. Validate auth token and inputs in every Function.
- **Naming:** Firestore Collections = `snake_case` (plural). Fields = `camelCase`.

### 4. Testing & Reliability
- **Emulators:** Code must handle `import.meta.env.DEV` to connect to local emulators (Auth: 9099, Firestore: 8080, Functions: 5001).
- **Secrets:** Never commit API keys or secrets. Use environment variables.
