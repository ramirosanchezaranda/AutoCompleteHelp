import { useEffect, useMemo, useState } from 'react';
import type { ProviderInfo, ProviderKind } from '@core/providers';
import { useApp } from '../store/app';
import { AISettings, getApiKey, listModels, localHelp, providersFor, setApiKey } from '../lib/ai';
import { Dialog } from './Dialog';

type Step = 'como' | 'proveedor' | 'modelo';

const HOW: { kind: ProviderKind; t: string; d: string }[] = [
  { kind: 'nube', t: 'Con tu API key', d: 'Claude, ChatGPT, Gemini, Mistral, DeepSeek, Grok, Groq u OpenRouter. Pagas tu uso al proveedor.' },
  { kind: 'local', t: 'IA local', d: 'Gratis y privada, en tu computadora: Ollama, LM Studio, llama.cpp o Jan.' },
  { kind: 'propia', t: 'Tu propia IA', d: 'Cualquier endpoint compatible con OpenAI: nombre, URL base, modelo y clave opcional.' },
  { kind: 'ninguna', t: 'Sin IA', d: 'Lecciones ya escritas, arquitectura, estructura y repaso. Funciona sin conexión.' }
];

/** «Elegir la IA»: Cómo › Proveedor › Modelo, con ← Atrás. */
export function AIDialog() {
  const { ai, setAI, closeAIDialog, notify } = useApp();
  const [step, setStep] = useState<Step>('como');
  const [kind, setKind] = useState<ProviderKind>(() => (ai.chosen ? providersFor(ai).find((p) => p.id === ai.providerId)?.kind ?? 'nube' : 'nube'));
  const [draft, setDraft] = useState<AISettings>(ai);
  const [providerId, setProviderId] = useState(ai.providerId);
  const [key, setKey] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [models, setModels] = useState<string[] | undefined>();
  const [probe, setProbe] = useState<'idle' | 'busy' | 'fail'>('idle');
  const [model, setModel] = useState(ai.model);
  const [custom, setCustom] = useState({ name: '', baseUrl: '', model: '', key: '' });

  const providers = useMemo(() => providersFor(draft), [draft]);
  const provider: ProviderInfo | undefined = providers.find((p) => p.id === providerId);
  const ofKind = providers.filter((p) => p.kind === kind && p.id !== 'none');
  const url = provider ? draft.urls[provider.id] || provider.baseUrl : '';

  useEffect(() => {
    if (provider) void getApiKey(provider.id).then((k) => setHasKey(!!k));
    setModels(undefined);
    setProbe('idle');
  }, [providerId]); // eslint-disable-line react-hooks/exhaustive-deps

  const finish = async (next: AISettings) => {
    setAI({ ...next, chosen: true });
    notify(next.providerId === 'none' ? 'Modo sin IA: las lecciones escritas funcionan sin conexión.' : 'IA lista.');
    closeAIDialog(true);
  };

  const chooseHow = (k: ProviderKind) => {
    if (k === 'ninguna') {
      void finish({ ...draft, providerId: 'none', model: '' });
      return;
    }
    setKind(k);
    if (!providers.some((p) => p.id === providerId && p.kind === k)) setProviderId('');
    setStep('proveedor');
  };

  const detect = async () => {
    if (!provider) return;
    setProbe('busy');
    const found = await listModels(url, (await getApiKey(provider.id)) || undefined);
    setModels(found);
    setProbe(found.length ? 'idle' : 'fail');
    if (found.length && !found.includes(model)) setModel(found[0]);
  };

  const toModel = async () => {
    if (!provider) return;
    if (provider.needsKey) {
      if (key.trim()) await setApiKey(provider.id, key.trim(), draft.remember);
      else if (!hasKey) return;
    }
    if (provider.kind === 'local' && !models) void detect();
    if (!provider.models.includes(model)) setModel(provider.defaultModel || provider.models[0] || '');
    setStep('modelo');
  };

  const addCustom = async () => {
    const name = custom.name.trim();
    const baseUrl = custom.baseUrl.trim().replace(/\/$/, '');
    if (!name || !/^https?:\/\//.test(baseUrl)) {
      notify('Escribe un nombre y una URL base que empiece con http:// o https://.', 'warn');
      return;
    }
    const cfg = { name, baseUrl, models: custom.model.trim() ? [custom.model.trim()] : [], local: /localhost|127\.0\.0\.1/.test(baseUrl) };
    const next = { ...draft, custom: [...draft.custom.filter((c) => c.name !== name), cfg] };
    setDraft(next);
    if (custom.key.trim()) await setApiKey(`custom:${name}`, custom.key.trim(), draft.remember);
    setProviderId(`custom:${name}`);
    setModel(cfg.models[0] ?? '');
    setStep('modelo');
  };

  const back = () => setStep(step === 'modelo' ? 'proveedor' : 'como');
  const crumbs = ['Cómo', 'Proveedor', 'Modelo'].slice(0, step === 'como' ? 1 : step === 'proveedor' ? 2 : 3).join(' › ');
  const modelList = models?.length ? models : provider?.models ?? [];

  return (
    <Dialog
      title="Elegir la IA"
      crumbs={crumbs}
      onClose={() => closeAIDialog(false)}
      footer={
        <>
          <button className="btn ghost" onClick={step === 'como' ? () => closeAIDialog(false) : back}>
            {step === 'como' ? 'Cancelar' : '← Atrás'}
          </button>
          {step === 'proveedor' && kind !== 'propia' && (
            <button className="btn primary" disabled={!provider || (provider.needsKey && !key.trim() && !hasKey)} onClick={toModel}>
              Siguiente
            </button>
          )}
          {step === 'proveedor' && kind === 'propia' && (
            <button className="btn primary" onClick={addCustom}>
              Siguiente
            </button>
          )}
          {step === 'modelo' && provider && (
            <button className="btn primary" disabled={!model.trim() && !provider.defaultModel} onClick={() => finish({ ...draft, providerId: provider.id, model: model.trim() })}>
              Usar esta IA
            </button>
          )}
        </>
      }
    >
      {step === 'como' && (
        <div className="choices" role="radiogroup" aria-label="Cómo usar la IA">
          {HOW.map((h) => (
            <button key={h.kind} className="choice" role="radio" aria-checked={ai.chosen && kind === h.kind && (h.kind !== 'ninguna' || ai.providerId === 'none')} onClick={() => chooseHow(h.kind)}>
              <span className="t">{h.t}</span>
              <span className="d">{h.d}</span>
            </button>
          ))}
          <p className="help" style={{ margin: 0, color: 'var(--ink-3)', fontSize: 14 }}>
            Las claves se guardan cifradas en este dispositivo y solo se envían al proveedor que elijas.
          </p>
        </div>
      )}

      {step === 'proveedor' && kind !== 'propia' && (
        <>
          <div className="choices" role="radiogroup" aria-label="Proveedor">
            {ofKind.map((p) => (
              <button key={p.id} className="choice" role="radio" aria-checked={p.id === providerId} onClick={() => setProviderId(p.id)}>
                <span className="t">{p.label}</span>
                {p.setup && <span className="d">{p.setup}</span>}
              </button>
            ))}
          </div>
          {provider?.needsKey && (
            <div className="field">
              <label htmlFor="key">API key de {provider.label}</label>
              <input
                id="key"
                className="input"
                type="password"
                autoComplete="off"
                placeholder={hasKey ? 'Ya hay una guardada (escribe otra para reemplazarla)' : 'Pégala aquí'}
                value={key}
                onChange={(e) => setKey(e.target.value)}
              />
              {provider.keyUrl && (
                <a href={provider.keyUrl} target="_blank" rel="noreferrer">
                  Dónde conseguirla
                </a>
              )}
              <label className="row" style={{ fontWeight: 400 }}>
                <input type="checkbox" checked={draft.remember} onChange={(e) => setDraft({ ...draft, remember: e.target.checked })} />
                Guardarla cifrada en este dispositivo (si no, se pide en cada visita)
              </label>
            </div>
          )}
          {provider?.kind === 'local' && (
            <div className="field">
              <label htmlFor="url">Dirección de {provider.label}</label>
              <input id="url" className="input" value={url} onChange={(e) => setDraft({ ...draft, urls: { ...draft.urls, [provider.id]: e.target.value } })} />
              <div className="callout info">
                {localHelp(provider.id)} En Safari, una página https no puede llamar a http://localhost: usa Chrome, Edge o Firefox.
              </div>
            </div>
          )}
          {kind === 'nube' && (
            <details>
              <summary>Avanzado: proxy sin estado</summary>
              <div className="field" style={{ marginTop: 8 }}>
                <label htmlFor="proxy">URL del proxy (opcional)</label>
                <input id="proxy" className="input" placeholder="https://tu-proxy.example/api" value={draft.proxy} onChange={(e) => setDraft({ ...draft, proxy: e.target.value })} />
                <span style={{ fontSize: 14, color: 'var(--ink-2)' }}>
                  Para proveedores que no aceptan llamadas desde el navegador. Reenvía la petición con tu clave sin guardarla. Puedes autohospedarlo.
                </span>
              </div>
            </details>
          )}
        </>
      )}

      {step === 'proveedor' && kind === 'propia' && (
        <>
          {draft.custom.length > 0 && (
            <div className="choices">
              {draft.custom.map((c) => (
                <button key={c.name} className="choice" onClick={() => { setProviderId(`custom:${c.name}`); setModel(c.models?.[0] ?? ''); setStep('modelo'); }}>
                  <span className="t">{c.name}</span>
                  <span className="d">{c.baseUrl}</span>
                </button>
              ))}
            </div>
          )}
          <div className="field"><label htmlFor="cn">Nombre</label><input id="cn" className="input" value={custom.name} onChange={(e) => setCustom({ ...custom, name: e.target.value })} placeholder="Mi servidor" /></div>
          <div className="field"><label htmlFor="cu">URL base (expone /chat/completions)</label><input id="cu" className="input" value={custom.baseUrl} onChange={(e) => setCustom({ ...custom, baseUrl: e.target.value })} placeholder="https://mi-servidor.example/v1" /></div>
          <div className="field"><label htmlFor="cm">Modelo</label><input id="cm" className="input" value={custom.model} onChange={(e) => setCustom({ ...custom, model: e.target.value })} /></div>
          <div className="field"><label htmlFor="ck">API key (opcional)</label><input id="ck" className="input" type="password" autoComplete="off" value={custom.key} onChange={(e) => setCustom({ ...custom, key: e.target.value })} /></div>
        </>
      )}

      {step === 'modelo' && provider && (
        <>
          {provider.kind === 'local' && (
            <div className="row">
              <button className="btn small" onClick={detect} disabled={probe === 'busy'}>
                {probe === 'busy' ? 'Buscando…' : 'Detectar modelos instalados'}
              </button>
              {probe === 'fail' && <span style={{ color: 'var(--bad)' }}>No responde.</span>}
            </div>
          )}
          {probe === 'fail' && <div className="callout bad">{provider.label} no responde en {url}. {localHelp(provider.id)}</div>}
          {modelList.length > 0 && (
            <div className="choices" role="radiogroup" aria-label="Modelo">
              {modelList.map((m) => (
                <button key={m} className="choice" role="radio" aria-checked={m === model} onClick={() => setModel(m)}>
                  <span className="t" style={{ fontFamily: 'var(--mono)', fontSize: 14 }}>{m}</span>
                </button>
              ))}
            </div>
          )}
          <div className="field">
            <label htmlFor="model">Modelo</label>
            <input id="model" className="input" value={model} placeholder={provider.defaultModel || 'id del modelo'} onChange={(e) => setModel(e.target.value)} />
          </div>
        </>
      )}
    </Dialog>
  );
}
