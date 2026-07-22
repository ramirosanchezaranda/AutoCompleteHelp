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

export interface ProviderInfo {
  id: string;
  label: string;
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
    label: 'Ollama (local, sin API key)',
    style: 'openai',
    baseUrl: 'http://localhost:11434/v1',
    needsKey: false,
    keyUrl: 'https://ollama.com/',
    models: ['qwen2.5-coder', 'llama3.1', 'deepseek-coder-v2', 'codellama'],
    defaultModel: 'qwen2.5-coder'
  },
  {
    id: 'custom',
    label: 'Personalizado (OpenAI-compatible)',
    style: 'openai',
    baseUrl: '',
    needsKey: true,
    keyUrl: '',
    models: [],
    defaultModel: ''
  }
];

export function getProvider(id: string): ProviderInfo {
  return PROVIDERS.find((p) => p.id === id) ?? PROVIDERS[0];
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
  }
  return { provider, model, baseUrl };
}
