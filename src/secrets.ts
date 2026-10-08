import * as vscode from 'vscode';
import { allProviders, ProviderInfo, getProvider } from './providers/catalog';

export const keyFor = (providerId: string) => `autocompletehelp.apiKey.${providerId}`;

export async function getApiKey(
  context: vscode.ExtensionContext,
  provider: ProviderInfo
): Promise<string | undefined> {
  // Siempre consultamos el SecretStorage: las IAs propias y Ollama remoto
  // pueden tener clave aunque needsKey sea false (se envía solo si existe).
  return context.secrets.get(keyFor(provider.id));
}

/** Pide y guarda la API key de un proveedor en el almacenamiento seguro del IDE. */
export async function setApiKeyCommand(
  context: vscode.ExtensionContext,
  providerId?: string
): Promise<boolean> {
  let provider: ProviderInfo;
  if (providerId) {
    provider = getProvider(providerId);
  } else {
    const pick = await vscode.window.showQuickPick(
      allProviders()
        // Solo los que usan clave: en la nube o tus IAs propias (las locales no la necesitan).
        .filter((p) => p.needsKey || p.kind === 'propia')
        .map((p) => ({ label: p.label, id: p.id })),
      { title: '¿De qué proveedor quieres configurar la API key?' }
    );
    if (!pick) {
      return false;
    }
    provider = getProvider(pick.id);
  }

  const value = await vscode.window.showInputBox({
    title: `API key de ${provider.label}`,
    prompt: provider.keyUrl ? `Consigue tu clave en ${provider.keyUrl}` : 'Introduce tu API key',
    password: true,
    ignoreFocusOut: true
  });
  if (value === undefined) {
    return false;
  }
  if (value === '') {
    await context.secrets.delete(keyFor(provider.id));
    vscode.window.showInformationMessage(`AutoCompleteHelp: API key de ${provider.label} eliminada.`);
    return false;
  }
  await context.secrets.store(keyFor(provider.id), value);
  vscode.window.showInformationMessage(
    `AutoCompleteHelp: API key de ${provider.label} guardada de forma segura.`
  );
  return true;
}

/** ¿La persona ya eligió cómo usar la IA? (si no, se usa el valor por defecto sin haberlo decidido). */
export function aiChosen(): boolean {
  const i = vscode.workspace.getConfiguration('autocompletehelp').inspect<string>('provider');
  return i?.globalValue !== undefined || i?.workspaceValue !== undefined || i?.workspaceFolderValue !== undefined;
}

/**
 * Antes de la primera tarea con IA: si nunca se eligió cómo usarla, abre
 * «Elegir la IA» (API key de cualquier proveedor, IA local o sin IA) en vez de
 * pedir directamente una clave del proveedor por defecto. Devuelve false si la
 * persona cancela.
 */
export async function prepareAI(): Promise<boolean> {
  if (aiChosen()) {
    return true;
  }
  await vscode.commands.executeCommand('autocompletehelp.selectModel');
  return aiChosen();
}

/**
 * Garantiza que haya API key para el proveedor activo. Si falta, deja elegir:
 * escribir la clave de ese proveedor, o elegir otra IA (otro proveedor, una
 * IA local o sin IA). Si se elige otra, devuelve undefined: la tarea se vuelve
 * a lanzar con la IA nueva.
 */
export async function ensureApiKey(
  context: vscode.ExtensionContext,
  provider: ProviderInfo
): Promise<string | undefined> {
  if (!provider.needsKey) {
    return undefined;
  }
  const existing = await getApiKey(context, provider);
  if (existing) {
    return existing;
  }
  const pick = await vscode.window.showQuickPick(
    [
      { label: `$(key) Escribir la API key de ${provider.label}`, description: provider.keyUrl ?? '', id: 'key' },
      { label: '$(sparkle) Elegir otra IA', description: 'otro proveedor con su API key, una IA local (gratis) o sin IA', id: 'otra' }
    ],
    { title: `AutoCompleteHelp: falta la API key de ${provider.label}`, ignoreFocusOut: true }
  );
  if (pick?.id === 'otra') {
    await vscode.commands.executeCommand('autocompletehelp.selectModel');
    vscode.window.showInformationMessage('AutoCompleteHelp: listo. Vuelve a lanzar lo que estabas haciendo para usar la IA elegida.');
    return undefined;
  }
  if (pick?.id !== 'key') {
    return undefined;
  }
  const stored = await setApiKeyCommand(context, provider.id);
  return stored ? getApiKey(context, provider) : undefined;
}
