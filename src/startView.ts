import * as vscode from 'vscode';
import { resolveActiveConfig } from './providers/catalog';
import { aiChosen } from './secrets';
import { StartKind, startWith } from './learn';

/**
 * Sección «Empezar» de la barra lateral: tres cajas para escribir —tu
 * proyecto, lo que quieres aprender o lo que te interesa— y un botón en cada
 * una. Lo escrito arranca el asistente paso a paso de ese camino, ya con el
 * texto cargado.
 */
export class StartViewProvider implements vscode.WebviewViewProvider {
  static readonly id = 'autocompletehelp.start';
  private view?: vscode.WebviewView;

  constructor(private readonly context: vscode.ExtensionContext) {
    context.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('autocompletehelp')) {
          this.postAI();
        }
      })
    );
  }

  resolveWebviewView(view: vscode.WebviewView): void {
    this.view = view;
    view.webview.options = { enableScripts: true };
    view.webview.html = startHtml(nonce());
    view.webview.onDidReceiveMessage(async (m: { cmd: string; kind?: StartKind; text?: string }) => {
      if (m.cmd === 'go' && m.kind) {
        await startWith(this.context, m.kind, String(m.text ?? '').slice(0, 2000));
      } else if (m.cmd === 'ai') {
        await vscode.commands.executeCommand('autocompletehelp.selectModel');
      } else if (m.cmd === 'ready') {
        this.postAI();
      }
    });
  }

  private postAI(): void {
    if (!this.view) {
      return;
    }
    const { provider, model } = resolveActiveConfig();
    const label = !aiChosen()
      ? 'sin elegir todavía'
      : provider.kind === 'ninguna'
        ? 'Sin IA'
        : `${provider.label} · ${model}${provider.kind === 'local' ? ' (local)' : ''}`;
    void this.view.webview.postMessage({ cmd: 'ai', label });
  }
}

function nonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let n = '';
  for (let i = 0; i < 32; i++) {
    n += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return n;
}

/** Las tres cajas: qué se escribe en cada una y ejemplos para tocar. */
export const START_BOXES: { kind: StartKind; tab: string; titulo: string; ayuda: string; placeholder: string; boton: string; ejemplos: string[] }[] = [
  {
    kind: 'project',
    tab: '🚀 Proyecto',
    titulo: '🚀 Tengo un proyecto',
    ayuda: 'Qué construyes + cómo quieres que te expliquen.',
    placeholder: 'Ej: e-commerce completa, explica cada código que agregues y por qué elegiste esa metodología',
    boton: 'Elegir stack y arquitectura →',
    ejemplos: ['una app para reservar canchas con mis amigos', 'una API de tareas, explica cada capa']
  },
  {
    kind: 'learn',
    tab: '🎓 Aprender',
    titulo: '🎓 Quiero aprender',
    ayuda: 'Un lenguaje, una librería, la nube, patrones, IA… lo que sea.',
    placeholder: 'Ej: TypeScript, three.js, patrones de API, configurar AWS',
    boton: 'Ver proyectos para aprenderlo →',
    ejemplos: ['TypeScript', 'arquitectura hexagonal', 'patrones de API', 'entrenar una IA']
  },
  {
    kind: 'recommend',
    tab: '💡 Ideas',
    titulo: '💡 Recomiéndame un proyecto',
    ayuda: 'Recomiéndame un proyecto: qué te interesa o para qué quieres aprender.',
    placeholder: 'Ej: quiero trabajar de backend, me gustan los videojuegos',
    boton: 'Recomiéndame →',
    ejemplos: ['quiero trabajar en la nube', 'automatizar mi trabajo con Excel']
  }
];

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
}

export function startHtml(n: string): string {
  const tabs = START_BOXES.map(
    (b, i) => `<button role="tab" class="tab${i === 0 ? ' on' : ''}" data-tab="${b.kind}" aria-selected="${i === 0}" title="${esc(b.titulo)}">${esc(b.tab)}</button>`
  ).join('');
  const panes = START_BOXES.map(
    (b, i) => `<section class="pane" data-kind="${b.kind}"${i === 0 ? '' : ' hidden'} role="tabpanel">
  <p>${esc(b.ayuda)}</p>
  <textarea rows="3" placeholder="${esc(b.placeholder)}" aria-label="${esc(b.titulo)}"></textarea>
  <div class="ex">${b.ejemplos.map((e) => `<button class="chip" data-ex="${esc(e)}">${esc(e)}</button>`).join('')}</div>
  <button class="go">${esc(b.boton)}</button>
</section>`
  ).join('\n');
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${n}'; script-src 'nonce-${n}';">
<style nonce="${n}">
  body { padding: 6px 10px 10px; font-family: var(--vscode-font-family); font-size: var(--vscode-font-size); color: var(--vscode-foreground); }
  .ai { display: flex; align-items: center; gap: 6px; padding: 6px 8px; margin-bottom: 8px; border-radius: 4px; background: var(--vscode-textBlockQuote-background, var(--vscode-editorWidget-background)); }
  .ai .lbl { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .ai .lbl b { font-weight: 600; }
  .small { font: inherit; cursor: pointer; border: none; border-radius: 3px; padding: 3px 8px; color: var(--vscode-button-secondaryForeground); background: var(--vscode-button-secondaryBackground); white-space: nowrap; }
  .small:hover { background: var(--vscode-button-secondaryHoverBackground); }
  .tabs { display: flex; gap: 2px; border-bottom: 1px solid var(--vscode-panel-border, var(--vscode-widget-border)); margin-bottom: 6px; }
  .tab { flex: 1; font: inherit; cursor: pointer; background: none; border: none; border-bottom: 2px solid transparent; color: var(--vscode-descriptionForeground); padding: 4px 2px 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .tab.on { color: var(--vscode-foreground); border-bottom-color: var(--vscode-focusBorder); font-weight: 600; }
  p { margin: 0 0 6px; opacity: .85; }
  textarea { width: 100%; box-sizing: border-box; resize: vertical; font: inherit; color: var(--vscode-input-foreground); background: var(--vscode-input-background); border: 1px solid var(--vscode-input-border, transparent); border-radius: 3px; padding: 4px 6px; }
  textarea:focus { outline: 1px solid var(--vscode-focusBorder); }
  .ex { display: flex; flex-wrap: wrap; gap: 4px; margin: 6px 0; }
  .chip { font: inherit; font-size: .9em; cursor: pointer; border: none; border-radius: 10px; padding: 1px 8px; color: var(--vscode-badge-foreground); background: var(--vscode-badge-background); }
  .go { width: 100%; font: inherit; cursor: pointer; border: none; border-radius: 3px; padding: 5px 8px; color: var(--vscode-button-foreground); background: var(--vscode-button-background); }
  .go:hover { background: var(--vscode-button-hoverBackground); }
  .foot { margin-top: 8px; opacity: .75; font-size: .92em; }
</style></head>
<body>
<div class="ai"><span class="lbl">IA: <b id="ai">…</b></span><button class="small" id="aiBtn" title="Cualquier proveedor con su API key, una IA local o sin IA">Cambiar IA</button></div>
<div class="tabs" role="tablist">${tabs}</div>
${panes}
<p class="foot">En los tres, todo se completa escribiendo: el código y la teoría aparecen en gris, una línea a la vez, con su explicación.</p>
<script nonce="${n}">
  const vscode = acquireVsCodeApi();
  const state = vscode.getState() || {};
  const show = (kind) => {
    document.querySelectorAll('.tab').forEach((t) => { const on = t.dataset.tab === kind; t.classList.toggle('on', on); t.setAttribute('aria-selected', on); });
    document.querySelectorAll('.pane').forEach((p) => { p.hidden = p.dataset.kind !== kind; });
    state.tab = kind; vscode.setState(state);
  };
  document.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => { show(t.dataset.tab); document.querySelector('.pane:not([hidden]) textarea').focus(); }));
  document.querySelectorAll('.pane').forEach((box) => {
    const kind = box.dataset.kind, ta = box.querySelector('textarea');
    ta.value = state[kind] || '';
    const save = () => { state[kind] = ta.value; vscode.setState(state); };
    const go = () => { save(); vscode.postMessage({ cmd: 'go', kind, text: ta.value.trim() }); };
    ta.addEventListener('input', save);
    // Enter envía; Shift+Enter hace un salto de línea.
    ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); go(); } });
    box.querySelector('.go').addEventListener('click', go);
    box.querySelectorAll('[data-ex]').forEach((b) => b.addEventListener('click', () => { ta.value = b.dataset.ex; save(); ta.focus(); }));
  });
  if (state.tab) show(state.tab);
  document.getElementById('aiBtn').addEventListener('click', () => vscode.postMessage({ cmd: 'ai' }));
  window.addEventListener('message', (e) => { if (e.data && e.data.cmd === 'ai') document.getElementById('ai').textContent = e.data.label; });
  vscode.postMessage({ cmd: 'ready' });
</script>
</body></html>`;
}
