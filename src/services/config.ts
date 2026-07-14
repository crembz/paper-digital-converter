export interface AppConfig {
  provider: 'openai' | 'anthropic' | 'openai-compatible' | 'lmstudio';
  model: string;
  apiKey: string;
  baseUrl: string;
  useApiKey: boolean;
}

const PROVIDER_DEFAULTS: Record<string, Omit<AppConfig, 'apiKey'>> = {
  openai: {
    provider: 'openai',
    model: 'gpt-4o',
    baseUrl: 'https://api.openai.com',
    useApiKey: true,
  },
  anthropic: {
    provider: 'anthropic',
    model: 'claude-sonnet-4-20250514',
    baseUrl: 'https://api.anthropic.com',
    useApiKey: true,
  },
  'openai-compatible': {
    provider: 'openai-compatible',
    model: '',
    baseUrl: '',
    useApiKey: true,
  },
  lmstudio: {
    provider: 'lmstudio',
    model: '',
    baseUrl: 'http://localhost:1234/v1',
    useApiKey: false,
  },
};

export function getDefaultConfig(provider: string): AppConfig {
  const defaults = PROVIDER_DEFAULTS[provider];
  if (!defaults) {
    return {
      provider: 'openai-compatible' as const,
      model: '',
      apiKey: '',
      baseUrl: '',
      useApiKey: true,
    };
  }
  return { ...defaults, apiKey: '' };
}

export async function loadConfig(): Promise<AppConfig | null> {
  const envProvider = import.meta.env.VITE_LLM_PROVIDER;
  const envModel = import.meta.env.VITE_LLM_MODEL;
  const envApiKey = import.meta.env.VITE_LLM_API_KEY;
  const envBaseUrl = import.meta.env.VITE_LLM_BASE_URL;

  const hasEnvConfig = envProvider && envModel && envApiKey;

  if (hasEnvConfig) {
    return {
      provider: envProvider as AppConfig['provider'],
      model: envModel,
      apiKey: envApiKey,
      baseUrl: envBaseUrl || '',
      useApiKey: true,
    };
  }

  try {
    if (typeof window.electronAPI === 'undefined') return null;
    const fileConfig = await window.electronAPI.loadConfig();

    if (fileConfig && fileConfig.provider) {
      const defaults = getDefaultConfig(fileConfig.provider);

      return {
        provider: fileConfig.provider as AppConfig['provider'],
        model: fileConfig.model || defaults.model,
        apiKey: fileConfig.apiKey || envApiKey || '',
        baseUrl: fileConfig.baseUrl || defaults.baseUrl || envBaseUrl || '',
        useApiKey: fileConfig.useApiKey ?? defaults.useApiKey,
      };
    }
  } catch {
    // File-based config unavailable
  }

  return getDefaultConfig('openai');
}

export async function saveConfig(config: AppConfig): Promise<void> {
  if (typeof window.electronAPI === 'undefined') return;
  await window.electronAPI.saveConfig(config);
}

export function isConfigured(config: AppConfig | null): boolean {
  if (!config) return false;

  if (!config.useApiKey) {
    return !!(config.provider && config.model);
  }

  return !!(config.provider && config.model && config.apiKey);
}
