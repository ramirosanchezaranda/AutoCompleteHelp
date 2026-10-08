import { ProviderInfo, parseModelList } from './providers';

/** Cliente de los LLM con fetch (puro: corre en el extension host y en el navegador). */

export interface CompletionRequest {
  provider: ProviderInfo;
  baseUrl: string;
  model: string;
  apiKey: string | undefined;
  system: string;
  user: string;
  maxTokens: number;
  /** Cancela la petición. */
  signal?: AbortSignal;
  /**
   * Llamada desde el navegador: Anthropic exige el encabezado
   * anthropic-dangerous-direct-browser-access para permitir CORS.
   */
  browser?: boolean;
  /** URL de un proxy sin estado (opcional) que reenvía la petición al proveedor. */
  proxy?: string;
}

export interface StreamHandlers {
  /** Se invoca con cada fragmento recibido y el texto acumulado. */
  onDelta?: (delta: string, total: string) => void;
  /** Devuelve true para cortar el stream anticipadamente (la sugerencia ya es suficiente). */
  shouldStop?: (total: string) => boolean;
}

/**
 * Llama al LLM configurado y devuelve el texto generado.
 * Usa fetch nativo (Node 18+ del extension host) — sin dependencias.
 */
export async function complete(req: CompletionRequest): Promise<string> {
  assertAI(req.provider);
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  req.signal?.addEventListener('abort', onAbort);
  try {
    switch (req.provider.style) {
      case 'anthropic':
        return await completeAnthropic(req, controller.signal);
      case 'gemini':
        return await completeGemini(req, controller.signal);
      case 'openai':
      default:
        return await completeOpenAiStyle(req, controller.signal);
    }
  } finally {
    req.signal?.removeEventListener('abort', onAbort);
  }
}

// --- Anthropic Messages API (POST /v1/messages) ---
// Nota: los modelos Claude 4.7+ rechazan temperature/top_p, por eso no se envían.
async function completeAnthropic(req: CompletionRequest, signal: AbortSignal): Promise<string> {
  const res = await send(req, `${req.baseUrl}/v1/messages`, {
    method: 'POST',
    signal,
    headers: anthropicHeaders(req),
    body: JSON.stringify({
      model: req.model,
      max_tokens: req.maxTokens,
      system: cachedSystem(req.system),
      messages: [{ role: 'user', content: req.user }]
    })
  });
  const data = await parseJsonOrThrow(res, 'Anthropic');
  const blocks: Array<{ type: string; text?: string }> = data.content ?? [];
  return blocks
    .filter((b) => b.type === 'text')
    .map((b) => b.text ?? '')
    .join('');
}

// --- Chat Completions (OpenAI, Mistral, DeepSeek, xAI, Groq, OpenRouter, Ollama, custom) ---
async function completeOpenAiStyle(req: CompletionRequest, signal: AbortSignal): Promise<string> {
  if (!req.baseUrl) {
    throw new Error('El proveedor "custom" requiere configurar autocompletehelp.customBaseUrl.');
  }
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (req.apiKey) {
    headers['authorization'] = `Bearer ${req.apiKey}`;
  }
  const body: Record<string, unknown> = {
    model: req.model,
    messages: [
      { role: 'system', content: req.system },
      { role: 'user', content: req.user }
    ]
  };
  // Los modelos gpt-5.x de OpenAI usan max_completion_tokens; el resto max_tokens.
  if (req.provider.id === 'openai') {
    body['max_completion_tokens'] = req.maxTokens;
  } else {
    body['max_tokens'] = req.maxTokens;
  }
  const res = await send(req, `${req.baseUrl}/chat/completions`, {
    method: 'POST',
    signal,
    headers,
    body: JSON.stringify(body)
  });
  const data = await parseJsonOrThrow(res, req.provider.label);
  return data.choices?.[0]?.message?.content ?? '';
}

// --- Google Gemini (POST /models/{model}:generateContent) ---
async function completeGemini(req: CompletionRequest, signal: AbortSignal): Promise<string> {
  const url = `${req.baseUrl}/models/${encodeURIComponent(req.model)}:generateContent`;
  const res = await send(req, url, {
    method: 'POST',
    signal,
    headers: {
      'content-type': 'application/json',
      'x-goog-api-key': req.apiKey ?? ''
    },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: req.system }] },
      contents: [{ role: 'user', parts: [{ text: req.user }] }],
      generationConfig: { maxOutputTokens: req.maxTokens }
    })
  });
  const data = await parseJsonOrThrow(res, 'Google Gemini');
  const parts: Array<{ text?: string }> = data.candidates?.[0]?.content?.parts ?? [];
  return parts.map((p) => p.text ?? '').join('');
}

/**
 * Igual que complete() pero en streaming (SSE): entrega los fragmentos a medida
 * que el modelo los genera y permite corte temprano. Devuelve el texto acumulado.
 */
export async function streamComplete(
  req: CompletionRequest,
  handlers: StreamHandlers = {}
): Promise<string> {
  assertAI(req.provider);
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  req.signal?.addEventListener('abort', onAbort);
  let total = '';

  const push = (delta: string): boolean => {
    if (!delta) {
      return false;
    }
    total += delta;
    handlers.onDelta?.(delta, total);
    if (handlers.shouldStop?.(total)) {
      controller.abort();
      return true;
    }
    return false;
  };

  try {
    switch (req.provider.style) {
      case 'anthropic': {
        const res = await send(req, `${req.baseUrl}/v1/messages`, {
          method: 'POST',
          signal: controller.signal,
          headers: anthropicHeaders(req),
          body: JSON.stringify({
            model: req.model,
            max_tokens: req.maxTokens,
            system: cachedSystem(req.system),
            stream: true,
            messages: [{ role: 'user', content: req.user }]
          })
        });
        await ensureOk(res, 'Anthropic');
        await readSse(res, (ev) =>
          ev.type === 'content_block_delta' && ev.delta?.type === 'text_delta'
            ? push(ev.delta.text ?? '')
            : false
        );
        break;
      }
      case 'gemini': {
        const url = `${req.baseUrl}/models/${encodeURIComponent(req.model)}:streamGenerateContent?alt=sse`;
        const res = await send(req, url, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'content-type': 'application/json',
            'x-goog-api-key': req.apiKey ?? ''
          },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: req.system }] },
            contents: [{ role: 'user', parts: [{ text: req.user }] }],
            generationConfig: { maxOutputTokens: req.maxTokens }
          })
        });
        await ensureOk(res, 'Google Gemini');
        await readSse(res, (ev) => {
          const parts: Array<{ text?: string }> = ev.candidates?.[0]?.content?.parts ?? [];
          return push(parts.map((p) => p.text ?? '').join(''));
        });
        break;
      }
      case 'openai':
      default: {
        if (!req.baseUrl) {
          throw new Error('El proveedor "custom" requiere configurar autocompletehelp.customBaseUrl.');
        }
        const headers: Record<string, string> = { 'content-type': 'application/json' };
        if (req.apiKey) {
          headers['authorization'] = `Bearer ${req.apiKey}`;
        }
        const body: Record<string, unknown> = {
          model: req.model,
          stream: true,
          messages: [
            { role: 'system', content: req.system },
            { role: 'user', content: req.user }
          ]
        };
        if (req.provider.id === 'openai') {
          body['max_completion_tokens'] = req.maxTokens;
        } else {
          body['max_tokens'] = req.maxTokens;
        }
        const res = await send(req, `${req.baseUrl}/chat/completions`, {
          method: 'POST',
          signal: controller.signal,
          headers,
          body: JSON.stringify(body)
        });
        await ensureOk(res, req.provider.label);
        await readSse(res, (ev) => push(ev.choices?.[0]?.delta?.content ?? ''));
        break;
      }
    }
  } catch (err: any) {
    // El corte temprano y la cancelación del IDE llegan como AbortError:
    // devolvemos lo acumulado en vez de propagar el error.
    if (err?.name !== 'AbortError') {
      throw err;
    }
  } finally {
    req.signal?.removeEventListener('abort', onAbort);
  }
  return total;
}

/**
 * Prompt de sistema de Anthropic como bloque cacheable. Lleva el proyecto, el
 * árbol de archivos y las dependencias: cambia poco entre sugerencias, así que
 * las siguientes lo leen de caché (~10% del costo, menos latencia). Si el
 * prompt es más corto que el mínimo cacheable, la API simplemente no lo cachea.
 */
function cachedSystem(system: string) {
  return [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }];
}

/** Lee un cuerpo SSE línea a línea e invoca onData con cada JSON. */
async function readSse(res: Response, onData: (json: any) => boolean): Promise<void> {
  if (!res.body) {
    return;
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      return;
    }
    buffer += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (!line.startsWith('data:')) {
        continue;
      }
      const payload = line.slice(5).trim();
      if (payload === '[DONE]') {
        return;
      }
      let json: any;
      try {
        json = JSON.parse(payload);
      } catch {
        continue;
      }
      if (onData(json)) {
        return;
      }
    }
  }
}

async function ensureOk(res: Response, providerLabel: string): Promise<void> {
  if (!res.ok) {
    let detail = '';
    try {
      detail = (await res.text()).slice(0, 400);
    } catch {
      /* sin cuerpo */
    }
    throw new Error(`${providerLabel} respondió HTTP ${res.status}: ${detail}`);
  }
}

async function parseJsonOrThrow(res: Response, providerLabel: string): Promise<any> {
  if (!res.ok) {
    let detail = '';
    try {
      detail = (await res.text()).slice(0, 400);
    } catch {
      /* sin cuerpo */
    }
    throw new Error(`${providerLabel} respondió HTTP ${res.status}: ${detail}`);
  }
  return res.json();
}

function anthropicHeaders(req: CompletionRequest): Record<string, string> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    'x-api-key': req.apiKey ?? '',
    'anthropic-version': '2023-06-01'
  };
  if (req.browser) {
    headers['anthropic-dangerous-direct-browser-access'] = 'true';
  }
  return headers;
}

/**
 * fetch directo, o a través del proxy opcional (sin estado): el proxy recibe
 * la URL de destino en el encabezado x-ach-target y reenvía la petición tal
 * cual, con la clave que manda el navegador. No la guarda ni la registra.
 */
function send(req: Pick<CompletionRequest, 'proxy'>, url: string, init: RequestInit): Promise<Response> {
  if (!req.proxy) {
    return fetch(url, init);
  }
  const headers = new Headers(init.headers);
  headers.set('x-ach-target', url);
  return fetch(req.proxy, { ...init, headers });
}

/** Error del modo sin IA: quien llama lo convierte en un mensaje útil. */
export class NoAIError extends Error {
  constructor() {
    super('Modo sin IA: esta acción necesita un modelo. Elige uno con API key o una IA local.');
    this.name = 'NoAIError';
  }
}

function assertAI(provider: ProviderInfo): void {
  if (provider.kind === 'ninguna') {
    throw new NoAIError();
  }
}

/**
 * Modelos instalados en una IA local (o en cualquier endpoint
 * OpenAI-compatible). Prueba /models y, para Ollama, /api/tags. Devuelve []
 * si no responde en unos segundos: la IA local no está abierta.
 */
export async function listModels(baseUrl: string, apiKey?: string): Promise<string[]> {
  const base = baseUrl.replace(/\/$/, '');
  const urls = [`${base}/models`];
  if (/\/v1$/.test(base)) {
    urls.push(`${base.replace(/\/v1$/, '')}/api/tags`);
  }
  for (const url of urls) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    try {
      const res = await fetch(url, {
        headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
        signal: controller.signal
      });
      if (res.ok) {
        const ids = parseModelList(await res.json());
        if (ids.length) {
          return ids;
        }
      }
    } catch {
      // no responde: se prueba la siguiente
    } finally {
      clearTimeout(timer);
    }
  }
  return [];
}
