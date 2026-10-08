/**
 * La IA a elección: un proveedor con API key, una IA local, una propia
 * (endpoint OpenAI-compatible) o sin IA. Las llamadas salen directo del
 * navegador al proveedor elegido (o al proxy opcional, sin estado).
 */
import { CustomProviderConfig, PROVIDERS, ProviderInfo, customProviderInfo } from '@core/providers';
import { NoAIError, listModels, streamComplete } from '@core/client';
import { db } from './db';
import { decrypt, encrypt } from './crypto';

export interface AISettings {
  /** Ya se eligió cómo usar la IA (la primera vez se pregunta). */
  chosen: boolean;
  providerId: string;
  model: string;
  /** URL de cada IA local, si no es la de siempre. */
  urls: Record<string, string>;
  custom: CustomProviderConfig[];
  /** Proxy sin estado para proveedores que no permiten CORS (opcional, autohospedable). */
  proxy: string;
  /** false: la clave no se guarda; se pide en cada visita. */
  remember: boolean;
}

const SETTINGS_KEY = 'ach.ai';

export const DEFAULT_AI: AISettings = {
  chosen: false,
  providerId: 'none',
  model: '',
  urls: {},
  custom: [],
  proxy: '',
  remember: true
};

export function loadAISettings(): AISettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_AI, ...JSON.parse(raw) } : DEFAULT_AI;
  } catch {
    return DEFAULT_AI;
  }
}

export function saveAISettings(s: AISettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {
    /* modo privado: queda en memoria */
  }
}

/** Proveedores para la web: el catálogo de la extensión + las IAs propias. */
export function providersFor(s: AISettings): ProviderInfo[] {
  return [...PROVIDERS.filter((p) => p.id !== 'custom'), ...s.custom.map(customProviderInfo)];
}

export function activeAI(s: AISettings): { provider: ProviderInfo; model: string; baseUrl: string } {
  const list = providersFor(s);
  const provider = list.find((p) => p.id === s.providerId) ?? list.find((p) => p.id === 'none')!;
  const model = s.model || provider.defaultModel;
  const baseUrl = (provider.kind === 'local' && s.urls[provider.id]) || provider.baseUrl;
  return { provider, model, baseUrl };
}

export function aiLabel(s: AISettings): string {
  if (!s.chosen) {
    return 'sin elegir todavía';
  }
  const { provider, model } = activeAI(s);
  if (provider.kind === 'ninguna') {
    return 'Sin IA';
  }
  const name = provider.label.replace(/\s*\(.*\)$/, '');
  return `${name} · ${model || 'modelo por defecto'}${provider.kind === 'local' ? ' (local)' : ''}`;
}

export function hasAI(s: AISettings): boolean {
  return s.chosen && activeAI(s).provider.kind !== 'ninguna';
}

// ---------------------------------------------------------------------------
// Claves
// ---------------------------------------------------------------------------

const memoryKeys = new Map<string, string>();

export async function getApiKey(providerId: string): Promise<string | undefined> {
  if (memoryKeys.has(providerId)) {
    return memoryKeys.get(providerId);
  }
  const box = await db.get<{ iv: Uint8Array<ArrayBuffer>; data: ArrayBuffer }>(`key:${providerId}`);
  if (!box) {
    return undefined;
  }
  try {
    const key = await decrypt(box);
    memoryKeys.set(providerId, key);
    return key;
  } catch {
    return undefined;
  }
}

export async function setApiKey(providerId: string, key: string, remember: boolean): Promise<void> {
  memoryKeys.set(providerId, key);
  if (remember) {
    await db.set(`key:${providerId}`, await encrypt(key));
  } else {
    await db.del(`key:${providerId}`);
  }
}

export async function forgetApiKey(providerId: string): Promise<void> {
  memoryKeys.delete(providerId);
  await db.del(`key:${providerId}`);
}

// ---------------------------------------------------------------------------
// Llamadas
// ---------------------------------------------------------------------------

export class MissingKeyError extends Error {
  constructor(readonly providerLabel: string) {
    super(`Falta la API key de ${providerLabel}.`);
    this.name = 'MissingKeyError';
  }
}

export interface LlmOptions {
  signal?: AbortSignal;
  onDelta?: (delta: string, total: string) => void;
}

/** Llama a la IA activa en streaming y devuelve el texto completo. */
export async function llm(s: AISettings, system: string, user: string, maxTokens: number, o: LlmOptions = {}): Promise<string> {
  const { provider, model, baseUrl } = activeAI(s);
  if (provider.kind === 'ninguna' || !s.chosen) {
    throw new NoAIError();
  }
  const apiKey = await getApiKey(provider.id);
  if (provider.needsKey && !apiKey) {
    throw new MissingKeyError(provider.label);
  }
  try {
    return await streamComplete(
      {
        provider,
        baseUrl,
        model,
        apiKey,
        system,
        user,
        maxTokens,
        signal: o.signal,
        browser: true,
        proxy: provider.kind === 'nube' || provider.kind === 'propia' ? s.proxy || undefined : undefined
      },
      { onDelta: o.onDelta }
    );
  } catch (err: any) {
    throw friendlyError(err, provider, baseUrl);
  }
}

/** Errores de red con una explicación de qué hacer (CORS, IA local cerrada). */
function friendlyError(err: any, provider: ProviderInfo, baseUrl: string): Error {
  if (err?.name === 'AbortError' || err instanceof NoAIError) {
    return err;
  }
  const msg = String(err?.message ?? err);
  if (err instanceof TypeError || /Failed to fetch|NetworkError|Load failed/i.test(msg)) {
    if (provider.kind === 'local') {
      return new Error(`${provider.label} no responde en ${baseUrl}. ${localHelp(provider.id)}`);
    }
    return new Error(
      `${provider.label} no aceptó la llamada desde el navegador (CORS) o no hay conexión. Prueba con un proxy sin estado en «Cambiar IA» › Avanzado, o con otro proveedor.`
    );
  }
  return err instanceof Error ? err : new Error(msg);
}

/** Cómo habilitar una IA local para que la web la pueda llamar. */
export function localHelp(id: string): string {
  const origin = typeof location !== 'undefined' ? location.origin : 'esta web';
  switch (id) {
    case 'ollama':
      return `Ábrela y permite este origen: en la terminal, OLLAMA_ORIGINS="${origin}" ollama serve (en Windows: setx OLLAMA_ORIGINS "${origin}" y reinicia Ollama).`;
    case 'lmstudio':
      return 'En LM Studio: pestaña Developer › Start server y activa «Enable CORS».';
    case 'llamacpp':
      return 'Arranca llama-server con --port 8080 (acepta CORS por defecto).';
    case 'jan':
      return 'En Jan: Settings › Local API Server, actívalo y agrega este origen en CORS.';
    default:
      return 'Comprueba que el servidor está abierto y acepta CORS desde este origen.';
  }
}

export { listModels, NoAIError };
