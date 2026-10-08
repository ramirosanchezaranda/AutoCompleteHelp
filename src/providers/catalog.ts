import * as vscode from 'vscode';
import { CustomProviderConfig, PROVIDERS, ProviderInfo, customProviderInfo } from '../core/providers';
export * from '../core/providers';

export function customProviders(): ProviderInfo[] {
  const cfg = vscode.workspace.getConfiguration('autocompletehelp');
  const list = cfg.get<CustomProviderConfig[]>('customProviders', []);
  return list.filter((p) => p && p.name && p.baseUrl).map(customProviderInfo);
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

