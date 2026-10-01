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
        .filter((p) => p.id !== 'ollama')
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

/** Garantiza que haya API key para el proveedor activo; si falta, la pide. */
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
  const stored = await setApiKeyCommand(context, provider.id);
  return stored ? getApiKey(context, provider) : undefined;
}
