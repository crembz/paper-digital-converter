# Paper → Digital Converter

Electron + React desktop app. Converts paper notes to markdown via LLM vision models.

## Commands

- `npm run dev` — Starts Vite + Electron together (vite-plugin-electron). No separate electron command.
- `npm run build` — `tsc && vite build && electron-builder --config electron-builder.yml`. Runs in order.
- `npm run preview` — Vite preview server.
- No test or lint commands exist.

## Critical Gotchas

- **LLM SDKs run in the renderer** — OpenAI/Anthropic clients are instantiated in `src/services/llm.ts` (browser env). Both constructors must include `dangerouslyAllowBrowser: true` or the SDKs throw on startup.
- **Config lives in Electron's userData** — `config.json` is read/written via IPC to `app.getPath('userData')`, never the project root. It's `.gitignore`d.
- **Env vars override file config** — `VITE_LLM_PROVIDER`, `VITE_LLM_MODEL`, `VITE_LLM_API_KEY`, `VITE_LLM_BASE_URL` in `.env` take precedence over the saved `config.json` (`src/services/config.ts`).
- **Frameless window** — `electron/main.ts:20` sets `frame: false`. No native title bar or close button.
- **pdfjs-dist worker** — pdfjs-dist worker is loaded from `public/pdf.worker.min.mjs` via local import in `src/utils/pdf.ts`. Vite config excludes `pdfjs-dist` from `optimizeDeps`.
- **Promise.try polyfill** — `src/main.tsx` polyfills `globalThis.Promise.try` for pdfjs-dist compatibility.

## Architecture

- `electron/main.ts` — Main process, IPC handlers (config CRUD, file dialogs, file read/write). Config interface includes `useApiKey` boolean.
- `electron/preload.ts` — Exposes `window.electronAPI` via `contextBridge` (contextIsolation: true). Config interface includes `useApiKey` boolean.
- `src/electron.d.ts` — TypeScript declarations for `window.electronAPI`. Keep in sync with preload. Config types include `useApiKey`.
- `src/services/llm.ts` — LLM client abstraction. Anthropic and OpenAI/openai-compatible paths. API key check uses `config.useApiKey` instead of provider-based check.
- `src/services/config.ts` — Config loading with env → file → defaults cascade. Uses `import.meta.env.VITE_*` (not `process.env.*`). AppConfig includes `useApiKey` boolean.
- `src/utils/prompt.ts` — OCR system prompt template.
- `src/utils/pdf.ts` — PDF rendering via pdfjs-dist. Scale factor 3, uses `canvasContext` option, local worker import.
- `src/main.tsx` — React entry point. Includes `Promise.try` polyfill for pdfjs-dist.
- `electron-builder.yml` — electron-builder config (appId, win signing, nsis).
- `scripts/` — Build helper scripts (`7za-wrap.js`, `prepare-wincodesign.cjs`).

## Conventions

- **Path alias**: `@/` → `./src/` (tsconfig + vite both configured). Note: alias path has trailing slash `./src/`.
- **TypeScript**: strict mode, `noUnusedLocals`, `noUnusedParameters` enabled.
- **CSS**: BEM-like naming (`component__element--modifier`). Dark theme colors hardcoded in `src/styles.css` — no CSS framework or design tokens.
- **No monaco editor** — The markdown editor is a plain `<textarea>` (`src/components/MarkdownEditor.tsx`).
- **Service layer**: business logic in `src/services/`, UI in `src/components/`.
- **Config field `useApiKey`**: Controls whether a provider requires an API key. When `false` (e.g. LM Studio), API key field is optional and validation is skipped.

## Dependencies

- **pdfjs-dist**: `^4.10.38` — downgraded for worker import compatibility. Worker loaded from `public/pdf.worker.min.mjs`.
- **electron-builder.yml**: External build config (not inline in package.json).
- **@anthropic-ai/sdk**: `^0.18.0`
- **openai**: `^4.28.0`

## Agent Delegation

You are the primary orchestrator. For any task falling within a subagent's domain, dispatch it via `Task` instead of editing owned files directly.

### Ownership Table

| Subagent | Owned files | Task types |
|---|---|---|
| `electron` | `electron/main.ts`, `electron/preload.ts`, Electron config | IPC handlers, window creation, dialogs, FS access, tray/menus, preload bridge types |
| `frontend` | `src/components/*`, `src/App.tsx`, `src/main.tsx`, `src/styles.css`, `src/index.html` | React components, UI layout, state management, user interactions, CSS styling |
| `infra` | `package.json`, `tsconfig*.json`, `vite.config.ts`, `.gitignore`, `.env.example`, `config.example.json`, `src/services/config.ts`, `electron-builder.yml`, `scripts/`, `public/` | Dependencies, build config, TypeScript, Vite, packaging, config loading/defaults, CI/CD, pdfjs-dist worker |
| `llm` | `src/services/llm.ts`, `src/utils/prompt.ts` | LLM client abstraction, streaming, OCR prompts, provider logic, model selection |

### Skill Dispatch Matrix

When a task matches a recurring shape, load the matching skill before dispatching the subagent:

| Task shape | Skill | Subagent(s) |
|---|---|---|
| New React component | `component-scaffold` | `frontend` |
| New config field / setting | `config-extension` | `infra` (type, defaults, env) + `frontend` (UI form) |
| Styling / CSS changes | `dark-theme` | `frontend` |
| New LLM provider | `provider-integration` | `llm` (client impl) + `infra` (config defaults) + `frontend` (UI dropdown) |

### Scratch Files

Every dispatched subagent must write its full findings and changes to a scratch file at `.opencode/tmp/<agent>-<task-slug>.md` before returning a summary. Read that file yourself for detail rather than relying on the summary alone.

### Recursion Guard

The built-in `explore` and `general` agents must never dispatch further subagents. They use their own `Read`/`Grep`/`Glob` tools directly. This prevents unbounded recursion.

### Self-Check

Before any tool call, ask: does this file or task belong to one of the domain subagents? If yes, dispatch it via `Task` instead.
