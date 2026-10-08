import * as vscode from 'vscode';
import { ProviderInfo, ProviderKind, allProviders, getProvider, resolveActiveConfig } from './providers/catalog';
import { listModels } from './providers/client';
import { getApiKey, setApiKeyCommand } from './secrets';
import { BACK, Item, inputStep, pickStep, runSteps } from './wizard';

/**
 * «Elegir la IA», paso a paso con ← Atrás:
 *   1. ¿Cómo? — con API key (en la nube), IA local (gratis, en tu PC), una IA
 *      tuya, o sin IA.
 *   2. Proveedor.
 *   3. Modelo — en las locales, los que tienes instalados (se detectan).
 */
export async function selectModel(context: vscode.ExtensionContext): Promise<void> {
  const cfg = vscode.workspace.getConfiguration('autocompletehelp');
  const active = resolveActiveConfig();
  let kind = active.provider.kind as ProviderKind | 'agregar' | undefined;
  let provider: ProviderInfo | undefined;
  let model: string | undefined;

  const steps = [
    // 1 · cómo
    async () => {
      const r = await pickStep<ProviderKind | 'agregar'>(
        [
          { label: '$(cloud) Con API key', description: 'Claude, ChatGPT, Gemini, Mistral, DeepSeek, Grok, Groq, OpenRouter', detail: 'Los modelos más capaces. Pagas por uso a cada empresa (algunas tienen nivel gratuito).', value: 'nube' },
          { label: '$(device-desktop) IA local', description: 'Ollama, LM Studio, llama.cpp, Jan', detail: 'Gratis y privada: corre en tu PC, sin internet ni API key. Necesita un modelo descargado.', value: 'local' },
          ...(allProviders().some((p) => p.id.startsWith('custom:'))
            ? [{ label: '$(plug) Tus IAs', description: 'las que agregaste', value: 'propia' as const }]
            : []),
          { label: '$(add) Agregar una IA', description: 'otro endpoint, en la nube o local', value: 'agregar' },
          { label: '$(circle-slash) Sin IA', description: 'lecciones escritas, perfiles curados, arquitectura, repaso', detail: 'Todo lo que no necesita un modelo: gratis, sin conexión. Las lecciones sin IA se completan juntos igual.', value: 'ninguna' }
        ],
        { title: 'Elegir la IA — ¿Cómo quieres usarla?', step: 1, total: 3, current: kind }
      );
      if (r === undefined || r === BACK) {
        return r;
      }
      kind = r;
      return 1;
    },
    // 2 · proveedor
    async () => {
      if (kind === 'ninguna' || kind === 'agregar') {
        return 3;
      }
      const list = allProviders().filter((p) => p.kind === kind && p.id !== 'custom');
      const r = await pickStep<string>(
        list.map((p) => ({ label: p.label, description: p.id === active.provider.id ? '(actual)' : p.kind === 'local' ? p.baseUrl : undefined, value: p.id })),
        { title: `Elegir la IA — ${kind === 'local' ? 'IA local' : kind === 'propia' ? 'Tus IAs' : 'Proveedor'}`, step: 2, total: 3, current: provider?.id ?? active.provider.id }
      );
      if (r === undefined || r === BACK) {
        return r;
      }
      provider = getProvider(r);
      return 2;
    },
    // 3 · modelo
    async () => {
      const p = provider!;
      let models = p.models;
      let found = false;
      if (p.kind === 'local' || p.kind === 'propia') {
        const baseUrl = p.id === active.provider.id ? active.baseUrl : p.kind === 'local' ? localUrl(p) : p.baseUrl;
        models = await vscode.window.withProgress(
          { location: vscode.ProgressLocation.Notification, title: `AutoCompleteHelp: buscando modelos en ${p.label}…` },
          async () => listModels(baseUrl, await getApiKey(context, p))
        );
        found = models.length > 0;
        if (!found && p.kind === 'local') {
          vscode.window.showWarningMessage(`AutoCompleteHelp: ${p.label} no respondió en ${baseUrl}. ${p.setup ?? ''} También puedes escribir el modelo a mano.`);
          models = p.models;
        }
      }
      const OTHER = '__otro__';
      const r = await pickStep<string>(
        [
          ...models.map((m) => ({ label: m, description: m === active.model && p.id === active.provider.id ? '(actual)' : found ? 'instalado' : undefined, value: m })),
          { label: '$(edit) Escribir otro modelo…', value: OTHER }
        ],
        { title: `Elegir la IA — Modelo de ${p.label}`, step: 3, total: 3, current: model ?? (p.id === active.provider.id ? active.model : undefined) }
      );
      if (r === undefined || r === BACK) {
        return r;
      }
      if (r === OTHER) {
        const typed = await inputStep({ title: `Modelo de ${p.label}`, step: 3, total: 3, prompt: 'El identificador exacto del modelo, como lo muestra el proveedor o tu IA local.' });
        if (typed === undefined) {
          return undefined;
        }
        if (typed === BACK) {
          return 2;
        }
        model = typed;
      } else {
        model = r;
      }
      return 3;
    }
  ];
  if (!(await runSteps(steps))) {
    return;
  }

  if (kind === 'agregar') {
    await vscode.commands.executeCommand('autocompletehelp.addProvider');
    return;
  }
  if (kind === 'ninguna') {
    await cfg.update('provider', 'none', vscode.ConfigurationTarget.Global);
    vscode.window.showInformationMessage(
      'AutoCompleteHelp: modo sin IA. Funcionan las lecciones sin IA (se completan juntos igual), los perfiles curados con su plan base, la arquitectura, la estructura y el repaso. Lo que necesita un modelo te lo avisa.'
    );
    return;
  }
  if (!provider || !model) {
    return;
  }
  await cfg.update('provider', provider.id, vscode.ConfigurationTarget.Global);
  await cfg.update('model', model, vscode.ConfigurationTarget.Global);
  if (provider.needsKey && !(await getApiKey(context, provider))) {
    await setApiKeyCommand(context, provider.id);
  }
  vscode.window.showInformationMessage(
    `AutoCompleteHelp: usando ${provider.label} → ${model}${provider.kind === 'local' ? ' (local, gratis, en tu PC)' : ''}`
  );
}

function localUrl(p: ProviderInfo): string {
  const cfg = vscode.workspace.getConfiguration('autocompletehelp');
  if (p.id === 'ollama') {
    return cfg.get<string>('ollamaUrl', p.baseUrl) || p.baseUrl;
  }
  return cfg.get<Record<string, string>>('localUrls', {})[p.id] || p.baseUrl;
}
