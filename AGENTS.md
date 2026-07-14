# Paper → Digital Converter

Electron + React desktop app. Converts paper notes to markdown via LLM vision models.

## Commands

- `npm run dev` — Starts Vite + Electron together (vite-plugin-electron). No separate electron command.
- `npm run build` — `tsc && vite build && electron-builder`. Runs in order.
- No test or lint commands exist.

## Critical Gotchas

- **LLM SDKs run in the renderer** — OpenAI/Anthropic clients are instantiated in `src/services/llm.ts` (browser env). Both constructors must include `dangerouslyAllowBrowser: true` or the SDKs throw on startup.
- **Config lives in Electron's userData** — `config.json` is read/written via IPC to `app.getPath('userData')`, never the project root. It's `.gitignore`d.
- **Env vars override file config** — `LLM_PROVIDER`, `LLM_MODEL`, `LLM_API_KEY`, `LLM_BASE_URL` in `.env` take precedence over the saved `config.json` (`src/services/config.ts:39-54`).
- **Frameless window** — `electron/main.ts:20` sets `frame: false`. No native title bar or close button.

## Architecture

- `electron/main.ts` — Main process, IPC handlers (config CRUD, file dialogs, file read/write).
- `electron/preload.ts` — Exposes `window.electronAPI` via `contextBridge` (contextIsolation: true).
- `src/electron.d.ts` — TypeScript declarations for `window.electronAPI`. Keep in sync with preload.
- `src/services/llm.ts` — LLM client abstraction. Anthropic and OpenAI/openai-compatible paths.
- `src/services/config.ts` — Config loading with env → file → defaults cascade.
- `src/utils/prompt.ts` — OCR system prompt template.

## Conventions

- **Path alias**: `@/` → `./src/` (tsconfig + vite both configured).
- **TypeScript**: strict mode, `noUnusedLocals`, `noUnusedParameters` enabled.
- **CSS**: BEM-like naming (`component__element--modifier`). Dark theme colors hardcoded in `src/styles.css` — no CSS framework or design tokens.
- **No monaco editor** — Despite AGENTS.md mentioning it, the markdown editor is a plain `<textarea>` (`src/components/MarkdownEditor.tsx`).
- **Service layer**: business logic in `src/services/`, UI in `src/components/`.

## Subagents

Defined in `.opencode/agents/`. Use for domain-specific work:

| Subagent | Domain | Use when |
|---|---|---|
| `electron` | Main process, IPC, preload, dialogs, file system | Working on `electron/main.ts`, `electron/preload.ts`, or Electron-specific functionality |
| `frontend` | React components, UI, CSS, state management | Building/modifying components under `src/components/`, `App.tsx`, `styles.css` |
| `infra` | Build config, deps, TypeScript, Vite, config loading | Working on `package.json`, `tsconfig`, `vite.config.ts`, `src/services/config.ts` |
| `llm` | LLM client, streaming, OCR prompts, providers | Working on `src/services/llm.ts`, `src/utils/prompt.ts`, or LLM/AI integration |

## Skills

Defined in `.opencode/skills/`. Auto-load for matching tasks:

| Skill | Triggers on |
|---|---|
| `component-scaffold` | "add component", "new component", "create component" |
| `config-extension` | "add config field", "new setting", "config option" |
| `dark-theme` | "style", "CSS", "theme", "color", "dark mode" |
| `provider-integration` | "add provider", "new provider", "provider support" |
