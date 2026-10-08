import * as vscode from 'vscode';
import { CustomProviderConfig } from './providers/catalog';
import { keyFor } from './secrets';
import { listModels } from './providers/client';

/**
 * Comando "Agregar IA": registra cualquier endpoint OpenAI-compatible
 * (vLLM, LM Studio, Azure OpenAI, un proxy corporativo…) con su API key.
 * Queda disponible en el selector de proveedor/modelo como "Nombre (tu IA)".
 */
export async function addProvider(context: vscode.ExtensionContext): Promise<void> {
  const where = await vscode.window.showQuickPick(
    [
      { label: '$(cloud) En la nube, con API key', description: 'Azure OpenAI, un proxy de tu empresa, otro proveedor', local: false },
      { label: '$(device-desktop) Local, en mi PC', description: 'vLLM, LocalAI, Ollama en otra máquina… sin API key', local: true }
    ],
    { title: 'Agregar IA — ¿Dónde corre?' }
  );
  if (!where) {
    return;
  }
  const local = where.local;
  const name = await vscode.window.showInputBox({
    title: 'Agregar IA — Paso 1/4: nombre',
    prompt: 'Un nombre para identificarla (ej: "Mi vLLM", "Azure OpenAI", "LM Studio").',
    ignoreFocusOut: true,
    validateInput: (v) => (v.trim() ? undefined : 'Escribe un nombre.')
  });
  if (!name) {
    return;
  }

  const baseUrl = await vscode.window.showInputBox({
    title: 'Agregar IA — Paso 2/4: URL base',
    prompt: 'Endpoint compatible con OpenAI (debe exponer /chat/completions). Ej: https://mi-servidor.com/v1',
    value: local ? 'http://localhost:8000/v1' : '',
    ignoreFocusOut: true,
    validateInput: (v) =>
      /^https?:\/\/.+/.test(v.trim()) ? undefined : 'Debe empezar con http:// o https://'
  });
  if (!baseUrl) {
    return;
  }

  // Si responde, se ofrecen los modelos que tiene; si no, se escribe a mano.
  const found = await listModels(baseUrl.trim());
  const picked = found.length
    ? await vscode.window.showQuickPick(found, { title: 'Agregar IA — Paso 3/4: modelo (detectados)' })
    : undefined;
  const model = picked ?? await vscode.window.showInputBox({
    title: 'Agregar IA — Paso 3/4: modelo',
    prompt: 'El ID de modelo que espera tu endpoint (ej: "llama-3.3-70b", "gpt-4.1", el nombre de tu deployment…).',
    ignoreFocusOut: true,
    validateInput: (v) => (v.trim() ? undefined : 'Escribe el ID del modelo.')
  });
  if (!model) {
    return;
  }

  const apiKey = local ? '' : await vscode.window.showInputBox({
    title: 'Agregar IA — Paso 4/4: API key',
    prompt: 'Se guarda cifrada en el SecretStorage del IDE. Déjalo vacío si tu endpoint no requiere clave (ej: local).',
    password: true,
    ignoreFocusOut: true
  });
  if (apiKey === undefined) {
    return;
  }

  const cfg = vscode.workspace.getConfiguration('autocompletehelp');
  const cleanName = name.trim();
  const entry: CustomProviderConfig = {
    name: cleanName,
    baseUrl: baseUrl.trim().replace(/\/$/, ''),
    models: [model.trim()],
    local
  };
  const list = cfg
    .get<CustomProviderConfig[]>('customProviders', [])
    .filter((p) => p.name !== cleanName);
  list.push(entry);
  await cfg.update('customProviders', list, vscode.ConfigurationTarget.Global);

  const providerId = `custom:${cleanName}`;
  if (apiKey) {
    await context.secrets.store(keyFor(providerId), apiKey);
  } else {
    await context.secrets.delete(keyFor(providerId));
  }

  // La dejamos activa de inmediato.
  await cfg.update('provider', providerId, vscode.ConfigurationTarget.Global);
  await cfg.update('model', model.trim(), vscode.ConfigurationTarget.Global);

  vscode.window.showInformationMessage(
    `AutoCompleteHelp: "${cleanName}" agregada y activa → ${model.trim()}`
  );
}
