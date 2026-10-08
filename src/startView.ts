import * as vscode from 'vscode';
import { resolveActiveConfig } from './providers/catalog';
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
    const label = provider.kind === 'ninguna' ? 'Sin IA' : `${provider.label} · ${model}${provider.kind === 'local' ? ' (local)' : ''}`;
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
export const START_BOXES: { kind: StartKind; titulo: string; ayuda: string; placeholder: string; boton: string; ejemplos: string[] }[] = [
  {
    kind: 'project',
    titulo: '🚀 Tengo un proyecto',
    ayuda: 'Qué construyes + cómo quieres que te expliquen.',
    placeholder: 'Ej: e-commerce completa, explica cada código que agregues y por qué elegiste esa metodología',
    boton: 'Elegir stack y arquitectura →',
    ejemplos: ['una app para reservar canchas con mis amigos', 'una API de tareas, explica cada capa']
  },
  {
    kind: 'learn',
    titulo: '🎓 Quiero aprender',
    ayuda: 'Un lenguaje, una librería, la nube, patrones, IA… lo que sea.',
    placeholder: 'Ej: TypeScript, three.js, patrones de API, configurar AWS',
    boton: 'Ver proyectos para aprenderlo →',
    ejemplos: ['TypeScript', 'arquitectura hexagonal', 'patrones de API', 'entrenar una IA']
  },
  {
    kind: 'recommend',
    titulo: '💡 Recomiéndame un proyecto',
    ayuda: 'Qué te interesa o para qué quieres aprender.',
    placeholder: 'Ej: quiero trabajar de backend, me gustan los videojuegos',
    boton: 'Recomiéndame →',
    ejemplos: ['quiero trabajar en la nube', 'automatizar mi trabajo con Excel']
  }
];

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
}

export function startHtml(n: string): string {
  const boxes = START_BOXES.map(
    (b) => `<section class="box" data-kind="${b.kind}">
  <h3>${esc(b.titulo)}</h3>
  <p>${esc(b.ayuda)}</p>
  <textarea rows="2" placeholder="${esc(b.placeholder)}" aria-label="${esc(b.titulo)}"></textarea>
  <div class="ex">${b.ejemplos.map((e) => `<button class="chip" data-ex="${esc(e)}">${esc(e)}</button>`).join('')}</div>
  <button class="go">${esc(b.boton)}</button>
</section>`
  ).join('\n');
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${n}'; script-src 'nonce-${n}';">
<style nonce="${n}">
  body { padding: 4px 8px 12px; font-family: var(--vscode-font-family); font-size: var(--vscode-font-size); color: var(--vscode-foreground); }
  .box { border: 1px solid var(--vscode-widget-border, var(--vscode-panel-border)); border-radius: 6px; padding: 8px 10px 10px; margin: 0 0 10px; }
  .box:focus-within { border-color: var(--vscode-focusBorder); }
  h3 { margin: 0 0 2px; font-size: 1em; }
  p { margin: 0 0 6px; opacity: .8; }
  textarea { width: 100%; box-sizing: border-box; resize: vertical; font: inherit; color: var(--vscode-input-foreground); background: var(--vscode-input-background); border: 1px solid var(--vscode-input-border, transparent); border-radius: 3px; padding: 4px 6px; }
  textarea:focus { outline: 1px solid var(--vscode-focusBorder); }
  .ex { display: flex; flex-wrap: wrap; gap: 4px; margin: 6px 0; }
  .chip { font: inherit; font-size: .9em; cursor: pointer; border: none; border-radius: 10px; padding: 1px 8px; color: var(--vscode-badge-foreground); background: var(--vscode-badge-background); }
  .go { width: 100%; font: inherit; cursor: pointer; border: none; border-radius: 3px; padding: 5px 8px; color: var(--vscode-button-foreground); background: var(--vscode-button-background); }
  .go:hover { background: var(--vscode-button-hoverBackground); }
  .foot { opacity: .85; line-height: 1.5; }
  .link { font: inherit; background: none; border: none; padding: 0; cursor: pointer; color: var(--vscode-textLink-foreground); text-decoration: underline; }
</style></head>
<body>
${boxes}
<p class="foot">En los tres casos completamos juntos: el código y los apuntes aparecen en gris, una línea a la vez, con su explicación, y los escribes tú.<br>
IA: <strong id="ai">…</strong> · <button class="link" id="aiBtn">cambiar (API key, local o sin IA)</button></p>
<script nonce="${n}">
  const vscode = acquireVsCodeApi();
  const state = vscode.getState() || {};
  document.querySelectorAll('.box').forEach((box) => {
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
  document.getElementById('aiBtn').addEventListener('click', () => vscode.postMessage({ cmd: 'ai' }));
  window.addEventListener('message', (e) => { if (e.data && e.data.cmd === 'ai') document.getElementById('ai').textContent = e.data.label; });
  vscode.postMessage({ cmd: 'ready' });
</script>
</body></html>`;
}
