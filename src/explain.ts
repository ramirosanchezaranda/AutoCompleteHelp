import * as vscode from 'vscode';
import { resolveActiveConfig } from './providers/catalog';
import { complete } from './providers/client';
import { ensureApiKey } from './secrets';
import { buildExplainSystemPrompt, getProjectPrompt } from './prompts';

/**
 * Comando "Explicar código seleccionado": pide al LLM una explicación
 * pedagógica en español y la muestra en un panel lateral.
 */
export async function explainSelection(context: vscode.ExtensionContext): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.selection.isEmpty) {
    vscode.window.showInformationMessage('Selecciona el código que quieres que te explique.');
    return;
  }
  const code = editor.document.getText(editor.selection);
  const { provider, model, baseUrl } = resolveActiveConfig();
  const apiKey = await ensureApiKey(context, provider);
  if (provider.needsKey && !apiKey) {
    return;
  }

  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'AutoCompleteHelp: explicando el código…' },
    async () => {
      try {
        const markdown = await complete({
          provider,
          baseUrl,
          model,
          apiKey,
          system: buildExplainSystemPrompt(getProjectPrompt(context)),
          user: `Lenguaje: ${editor.document.languageId}\n\nExplícame este código:\n\n${code}`,
          maxTokens: 1500
        });
        showExplanationPanel(markdown, editor.document.languageId);
      } catch (err: any) {
        vscode.window.showErrorMessage(`AutoCompleteHelp: ${err?.message ?? err}`);
      }
    }
  );
}

function showExplanationPanel(markdown: string, languageId: string): void {
  const panel = vscode.window.createWebviewPanel(
    'autocompletehelp.explain',
    'AutoCompleteHelp — Explicación',
    vscode.ViewColumn.Beside,
    {}
  );
  panel.webview.html = renderHtml(markdown, languageId);
}

/** Render mínimo de Markdown (títulos, listas, negrita, código) sin dependencias. */
function renderHtml(markdown: string, languageId: string): string {
  const escaped = markdown
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const withCode = escaped.replace(
    /```[\w-]*\n([\s\S]*?)```/g,
    (_m, code) => `<pre><code>${code}</code></pre>`
  );

  const html = withCode
    .split('\n')
    .map((line) => {
      if (line.startsWith('### ')) return `<h3>${inline(line.slice(4))}</h3>`;
      if (line.startsWith('## ')) return `<h2>${inline(line.slice(3))}</h2>`;
      if (line.startsWith('# ')) return `<h1>${inline(line.slice(2))}</h1>`;
      if (/^\s*[-*] /.test(line)) return `<li>${inline(line.replace(/^\s*[-*] /, ''))}</li>`;
      if (/^\s*\d+[.)] /.test(line)) return `<li>${inline(line.replace(/^\s*\d+[.)] /, ''))}</li>`;
      if (line.trim() === '') return '';
      if (line.startsWith('<pre>') || line.startsWith('</pre>')) return line;
      return `<p>${inline(line)}</p>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><style>
  body { font-family: var(--vscode-font-family); color: var(--vscode-foreground); padding: 1rem 1.5rem; line-height: 1.55; max-width: 52rem; }
  code, pre { font-family: var(--vscode-editor-font-family); background: var(--vscode-textCodeBlock-background); border-radius: 4px; }
  code { padding: 0 4px; }
  pre { padding: 10px 12px; overflow-x: auto; }
  h1, h2, h3 { color: var(--vscode-textLink-foreground); }
  li { margin: 4px 0; }
</style></head>
<body>
  <p><em>Lenguaje: ${languageId}</em></p>
  ${html}
</body>
</html>`;
}

function inline(text: string): string {
  return text
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}
