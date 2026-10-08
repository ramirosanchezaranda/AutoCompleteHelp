import * as vscode from 'vscode';

/**
 * Estilo de API que habla cada proveedor:
 *  - anthropic: Messages API de Anthropic (POST /v1/messages)
 *  - openai:    Chat Completions (POST {base}/chat/completions) — lo hablan
 *               OpenAI, Mistral, DeepSeek, xAI, Groq, OpenRouter, Ollama y
 *               casi cualquier endpoint "OpenAI-compatible".
 *  - gemini:    Generative Language API de Google (:generateContent)
 */
export type ApiStyle = 'anthropic' | 'openai' | 'gemini';

/** Cómo funciona la IA: en la nube con API key, local en tu PC, una tuya, o sin IA. */
export type ProviderKind = 'nube' | 'local' | 'propia' | 'ninguna';

export interface ProviderInfo {
  id: string;
  label: string;
  kind: ProviderKind;
  /** Para las IAs locales: cómo ponerla en marcha si no responde. */
  setup?: string;
  style: ApiStyle;
  baseUrl: string;
  needsKey: boolean;
  keyUrl: string;
  models: string[];
  defaultModel: string;
}

export const PROVIDERS: ProviderInfo[] = [
  {
    id: 'anthropic',
    label: 'Anthropic (Claude)',
    kind: 'nube',
    style: 'anthropic',
    baseUrl: 'https://api.anthropic.com',
    needsKey: true,
    keyUrl: 'https://platform.claude.com/',
    models: [
      'claude-opus-4-8',
      'claude-sonnet-5',
      'claude-sonnet-4-6',
      'claude-haiku-4-5'
    ],
    defaultModel: 'claude-opus-4-8'
  },
  {
    id: 'openai',
    label: 'OpenAI (GPT)',
    kind: 'nube',
    style: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    needsKey: true,
    keyUrl: 'https://platform.openai.com/api-keys',
    models: ['gpt-5.1', 'gpt-5', 'gpt-5-mini', 'gpt-4.1', 'gpt-4o'],
    defaultModel: 'gpt-5.1'
  },
  {
    id: 'google',
    label: 'Google (Gemini)',
    kind: 'nube',
    style: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    needsKey: true,
    keyUrl: 'https://aistudio.google.com/apikey',
    models: ['gemini-3-pro-preview', 'gemini-2.5-pro', 'gemini-2.5-flash'],
    defaultModel: 'gemini-2.5-flash'
  },
  {
    id: 'mistral',
    label: 'Mistral AI',
    kind: 'nube',
    style: 'openai',
    baseUrl: 'https://api.mistral.ai/v1',
    needsKey: true,
    keyUrl: 'https://console.mistral.ai/api-keys',
    models: ['codestral-latest', 'mistral-large-latest', 'devstral-medium-latest'],
    defaultModel: 'codestral-latest'
  },
  {
    id: 'deepseek',
    label: 'DeepSeek',
    kind: 'nube',
    style: 'openai',
    baseUrl: 'https://api.deepseek.com/v1',
    needsKey: true,
    keyUrl: 'https://platform.deepseek.com/api_keys',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    defaultModel: 'deepseek-chat'
  },
  {
    id: 'xai',
    label: 'xAI (Grok)',
    kind: 'nube',
    style: 'openai',
    baseUrl: 'https://api.x.ai/v1',
    needsKey: true,
    keyUrl: 'https://console.x.ai/',
    models: ['grok-code-fast-1', 'grok-4'],
    defaultModel: 'grok-code-fast-1'
  },
  {
    id: 'groq',
    label: 'Groq',
    kind: 'nube',
    style: 'openai',
    baseUrl: 'https://api.groq.com/openai/v1',
    needsKey: true,
    keyUrl: 'https://console.groq.com/keys',
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'],
    defaultModel: 'llama-3.3-70b-versatile'
  },
  {
    id: 'openrouter',
    label: 'OpenRouter (multi-modelo)',
    kind: 'nube',
    style: 'openai',
    baseUrl: 'https://openrouter.ai/api/v1',
    needsKey: true,
    keyUrl: 'https://openrouter.ai/keys',
    models: [
      'anthropic/claude-sonnet-5',
      'openai/gpt-5.1',
      'google/gemini-2.5-flash',
      'mistralai/codestral-2501'
    ],
    defaultModel: 'anthropic/claude-sonnet-5'
  },
  {
    id: 'ollama',
    kind: 'local',
    setup: 'Instala Ollama (ollama.com), descarga un modelo con «ollama pull qwen2.5-coder» y déjalo abierto.',
    label: 'Ollama (local, sin API key)',
    style: 'openai',
    baseUrl: 'http://localhost:11434/v1',
    needsKey: false,
    keyUrl: 'https://ollama.com/',
    models: ['qwen2.5-coder', 'llama3.1', 'deepseek-coder-v2', 'codellama'],
    defaultModel: 'qwen2.5-coder'
  },
  {
    id: 'lmstudio',
    label: 'LM Studio',
    kind: 'local',
    setup: 'Abre LM Studio, descarga un modelo y activa el servidor local (pestaña Developer → Start server).',
    style: 'openai',
    baseUrl: 'http://localhost:1234/v1',
    needsKey: false,
    keyUrl: 'https://lmstudio.ai/',
    models: [],
    defaultModel: ''
  },
  {
    id: 'llamacpp',
    label: 'llama.cpp (llama-server)',
    kind: 'local',
    setup: 'Arranca «llama-server -m tu-modelo.gguf --port 8080».',
    style: 'openai',
    baseUrl: 'http://localhost:8080/v1',
    needsKey: false,
    keyUrl: 'https://github.com/ggml-org/llama.cpp',
    models: [],
    defaultModel: 'local'
  },
  {
    id: 'jan',
    label: 'Jan',
    kind: 'local',
    setup: 'Abre Jan, descarga un modelo y activa el Local API Server en la configuración.',
    style: 'openai',
    baseUrl: 'http://localhost:1337/v1',
    needsKey: false,
    keyUrl: 'https://jan.ai/',
    models: [],
    defaultModel: ''
  },
  {
    id: 'none',
    label: 'Sin IA',
    kind: 'ninguna',
    style: 'openai',
    baseUrl: '',
    needsKey: false,
    keyUrl: '',
    models: [],
    defaultModel: ''
  },
  {
    id: 'custom',
    label: 'Personalizado (OpenAI-compatible)',
    kind: 'propia',
    style: 'openai',
    baseUrl: '',
    needsKey: true,
    keyUrl: '',
    models: [],
    defaultModel: ''
  }
];

/** IAs agregadas por el usuario (endpoints OpenAI-compatibles con API key propia). */
export interface CustomProviderConfig {
  name: string;
  baseUrl: string;
  models?: string[];
  /** true si corre en tu PC (sin API key). */
  local?: boolean;
}

export function customProviders(): ProviderInfo[] {
  const cfg = vscode.workspace.getConfiguration('autocompletehelp');
  const list = cfg.get<CustomProviderConfig[]>('customProviders', []);
  return list
    .filter((p) => p && p.name && p.baseUrl)
    .map((p) => ({
      id: `custom:${p.name}`,
      label: `${p.name} (${p.local ? 'tu IA local' : 'tu IA'})`,
      kind: (p.local ? 'local' : 'propia') as ProviderKind,
      style: 'openai' as ApiStyle,
      baseUrl: p.baseUrl.replace(/\/$/, ''),
      // needsKey false: la clave se envía solo si existe, así también
      // funcionan endpoints propios sin autenticación (LM Studio, vLLM local…)
      needsKey: false,
      keyUrl: '',
      models: p.models ?? [],
      defaultModel: p.models?.[0] ?? ''
    }));
}

export function allProviders(): ProviderInfo[] {
  return [...PROVIDERS, ...customProviders()];
}

export function getProvider(id: string): ProviderInfo {
  return allProviders().find((p) => p.id === id) ?? PROVIDERS[0];
}

/** Resuelve proveedor, modelo y URL base según la configuración actual. */
export function resolveActiveConfig(): {
  provider: ProviderInfo;
  model: string;
  baseUrl: string;
} {
  const cfg = vscode.workspace.getConfiguration('autocompletehelp');
  const provider = getProvider(cfg.get<string>('provider', 'anthropic'));
  const model = cfg.get<string>('model', '') || provider.defaultModel;

  let baseUrl = provider.baseUrl;
  if (provider.id === 'ollama') {
    baseUrl = cfg.get<string>('ollamaUrl', baseUrl) || baseUrl;
  } else if (provider.id === 'custom') {
    baseUrl = cfg.get<string>('customBaseUrl', '') || '';
  } else if (provider.kind === 'local') {
    baseUrl = cfg.get<Record<string, string>>('localUrls', {})[provider.id] || baseUrl;
  }
  return { provider, model, baseUrl };
}

/** ¿Está activo el modo sin IA? */
export function noAI(): boolean {
  return resolveActiveConfig().provider.kind === 'ninguna';
}

/**
 * IDs de modelos de una respuesta de /models (formato OpenAI-compatible:
 * { data: [{ id }] }) o de /api/tags de Ollama ({ models: [{ name }] }).
 * Función pura: se prueba aislada.
 */
export function parseModelList(json: unknown): string[] {
  const j = json as any;
  const list: unknown[] = Array.isArray(j?.data) ? j.data : Array.isArray(j?.models) ? j.models : [];
  return list
    .map((m: any) => (typeof m === 'string' ? m : m?.id ?? m?.name ?? m?.model))
    .filter((id: unknown): id is string => typeof id === 'string' && !!id.trim())
    .filter((id, i, all) => all.indexOf(id) === i);
}
