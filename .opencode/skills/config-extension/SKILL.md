---
name: config-extension
description: Use when adding new configuration fields to the app. Triggers on "add config field", "new setting", "config option", or when extending AppConfig. Covers type updates, defaults, env vars, UI form fields, and persistence.
---

# Config Extension Skill

Use this skill when adding a new field to the app's configuration system.

## Overview

Config flows through 5 layers. Adding a field means touching all of them:

```
Env var -> Config file -> Default value -> UI form -> Persistence
```

## Step-by-Step

### 1. Update Type

In `src/services/config.ts`:

```ts
export interface AppConfig {
  provider: 'openai' | 'anthropic' | 'openai-compatible';
  model: string;
  apiKey: string;
  baseUrl: string;
  newField: string;  // or appropriate type
}
```

### 2. Add Default

In `src/services/config.ts`, `PROVIDER_DEFAULTS`:

Add the field to each provider's defaults, or to the shared defaults if it's provider-agnostic:

```ts
const PROVIDER_DEFAULTS: Record<string, Omit<AppConfig, 'apiKey'>> = {
  openai: {
    // ...existing
    newField: 'default-value',
  },
  // ...other providers
};
```

### 3. Add Env Var

In `src/services/config.ts`, `loadConfig()`:

```ts
const envNewField = process.env.LLM_NEW_FIELD;
// Merge into returned config
```

Env var naming convention: `LLM_<UPPER_SNAKE_CASE>`.

### 4. Update Preload Bridge

In `electron/preload.ts`, `Config` interface:

```ts
export interface Config {
  provider: string;
  model: string;
  apiKey: string;
  baseUrl: string;
  newField: string;
}
```

In `electron/main.ts`, `Config` interface:

```ts
interface Config {
  // ...existing
  newField: string;
}
```

### 5. Update ConfigPanel UI

In `src/components/ConfigPanel.tsx`:

Add state:
```ts
const [newField, setNewField] = useState('');
```

Sync from config:
```ts
useEffect(() => {
  if (config) {
    // ...existing
    setNewField(config.newField);
  }
}, [config]);
```

Form field:
```tsx
<div className="form-group">
  <label htmlFor="newField">New Field Label</label>
  <input
    id="newField"
    type="text"
    value={newField}
    onChange={(e) => setNewField(e.target.value)}
    placeholder="placeholder text"
  />
</div>
```

Include in save:
```ts
onSave({ provider, model, apiKey, baseUrl, newField });
```

### 6. Update isConfigured

If the field is required, update `isConfigured()` in `src/services/config.ts`:

```ts
export function isConfigured(config: AppConfig | null): boolean {
  if (!config) return false;
  return !!(config.provider && config.model && config.apiKey && config.newField);
}
```

### 7. Update Examples

In `.env.example`:
```
LLM_NEW_FIELD=default-value
```

In `config.example.json`:
```json
{
  // ...existing
  "newField": "default-value"
}
```

### 8. Update AGENTS.md

Document the new field in the config table and env var table.

## Verification Checklist

- [ ] `npx tsc --noEmit` passes
- [ ] Field appears in ConfigPanel
- [ ] Default value auto-fills
- [ ] Env var overrides file config
- [ ] File config overrides default
- [ ] Field persists on save/load round-trip
- [ ] Examples updated
