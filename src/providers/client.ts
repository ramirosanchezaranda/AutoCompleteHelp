import * as vscode from 'vscode';
import { ProviderInfo } from './catalog';

export interface CompletionRequest {
  provider: ProviderInfo;
  baseUrl: string;
  model: string;
  apiKey: string | undefined;
  system: string;
  user: string;
  maxTokens: number;
  token?: vscode.CancellationToken;
}

/**
 * Llama al LLM configurado y devuelve el texto generado.
 * Usa fetch nativo (Node 18+ del extension host) — sin dependencias.
 */
export async function complete(req: CompletionRequest): Promise<string> {
  const controller = new AbortController();
  const sub = req.token?.onCancellationRequested(() => controller.abort());
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
    sub?.dispose();
  }
}

// --- Anthropic Messages API (POST /v1/messages) ---
// Nota: los modelos Claude 4.7+ rechazan temperature/top_p, por eso no se envían.
async function completeAnthropic(req: CompletionRequest, signal: AbortSignal): Promise<string> {
  const res = await fetch(`${req.baseUrl}/v1/messages`, {
    method: 'POST',
    signal,
    headers: {
      'content-type': 'application/json',
      'x-api-key': req.apiKey ?? '',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: req.model,
      max_tokens: req.maxTokens,
      system: req.system,
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
  const res = await fetch(`${req.baseUrl}/chat/completions`, {
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
  const res = await fetch(url, {
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
