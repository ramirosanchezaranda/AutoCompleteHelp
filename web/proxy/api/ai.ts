/**
 * Proxy sin estado para proveedores de IA que no aceptan llamadas desde el
 * navegador (CORS). Reenvía la petición tal cual al proveedor indicado en
 * x-ach-target, con la clave que manda el navegador. No guarda ni registra
 * nada. Solo acepta los hosts de la lista: no es un proxy abierto.
 *
 * Autohospedarlo: `cd web/proxy && npx vercel deploy` (Edge Function) y pegar
 * la URL (…/api/ai) en «Cambiar IA» › Avanzado.
 */
export const config = { runtime: 'edge' };

const ALLOWED = new Set([
  'api.anthropic.com',
  'api.openai.com',
  'generativelanguage.googleapis.com',
  'api.mistral.ai',
  'api.deepseek.com',
  'api.x.ai',
  'api.groq.com',
  'openrouter.ai'
]);

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': '*',
  'access-control-max-age': '86400'
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'POST') return new Response('Solo POST', { status: 405, headers: CORS });
  let target: URL;
  try {
    target = new URL(req.headers.get('x-ach-target') ?? '');
  } catch {
    return new Response('Falta x-ach-target', { status: 400, headers: CORS });
  }
  if (target.protocol !== 'https:' || !ALLOWED.has(target.hostname)) {
    return new Response('Destino no permitido', { status: 403, headers: CORS });
  }
  const headers = new Headers();
  for (const [k, v] of req.headers) {
    if (/^(content-type|authorization|x-api-key|anthropic-version|anthropic-beta|x-goog-api-key)$/i.test(k)) headers.set(k, v);
  }
  const res = await fetch(target, { method: 'POST', headers, body: req.body, // @ts-expect-error duplex es necesario para cuerpos en stream
    duplex: 'half' });
  const out = new Headers(CORS);
  out.set('content-type', res.headers.get('content-type') ?? 'application/json');
  return new Response(res.body, { status: res.status, headers: out });
}
