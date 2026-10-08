import * as vscode from 'vscode';
import { resolveActiveConfig } from './providers/catalog';
import { buildErrorSystemPrompt, buildErrorUserPrompt } from './core/errors';
export * from './core/errors';
import { complete } from './providers/client';
import { ensureApiKey, prepareAI } from './secrets';
import { getProjectBlock } from './prompts';
import { needsAI, showMarkdownPanel } from './explain';

/**
 * «Entender este error»: aparece como acción rápida (la bombita) sobre los
 * errores del editor. Explica qué dice el error, por qué ocurre en ESA línea y
 * cómo encontrar la solución, sin darte el código corregido: leer errores es
 * una habilidad, y se aprende resolviéndolos.
 */

const CONTEXT_LINES = 8;

export class ErrorHelpProvider implements vscode.CodeActionProvider {
  static get kinds(): vscode.CodeActionKind[] {
    return [vscode.CodeActionKind.QuickFix];
  }

  provideCodeActions(
    document: vscode.TextDocument,
    _range: vscode.Range,
    context: vscode.CodeActionContext
  ): vscode.CodeAction[] {
    return context.diagnostics
      .filter((d) => d.severity === vscode.DiagnosticSeverity.Error || d.severity === vscode.DiagnosticSeverity.Warning)
      .slice(0, 3)
      .map((d) => {
        const action = new vscode.CodeAction(
          `AutoCompleteHelp: entender este ${d.severity === vscode.DiagnosticSeverity.Error ? 'error' : 'aviso'}`,
          vscode.CodeActionKind.QuickFix
        );
        action.diagnostics = [d];
        action.command = {
          command: 'autocompletehelp.explainError',
          title: 'Entender este error',
          arguments: [document.uri, d.range, d.message, diagnosticSource(d)]
        };
        return action;
      });
  }
}

function diagnosticSource(d: vscode.Diagnostic): string {
  const code = typeof d.code === 'object' ? d.code.value : d.code;
  return [d.source, code].filter((x) => x !== undefined && x !== '').join(' ');
}

/** Comando: con argumentos (desde la bombita) o el error bajo el cursor. */
export async function explainError(
  context: vscode.ExtensionContext,
  uri?: vscode.Uri,
  range?: vscode.Range,
  message?: string,
  source?: string
): Promise<void> {
  if (!uri || !range || !message) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }
    const at = editor.selection.active;
    const diags = vscode.languages
      .getDiagnostics(editor.document.uri)
      .filter((d) => d.severity <= vscode.DiagnosticSeverity.Warning)
      .sort((a, b) => Math.abs(a.range.start.line - at.line) - Math.abs(b.range.start.line - at.line));
    const d = diags[0];
    if (!d) {
      vscode.window.showInformationMessage('AutoCompleteHelp: este archivo no tiene errores ni avisos que explicar.');
      return;
    }
    uri = editor.document.uri;
    range = d.range;
    message = d.message;
    source = diagnosticSource(d);
  }

  const document = await vscode.workspace.openTextDocument(uri);
  const from = Math.max(0, range.start.line - CONTEXT_LINES);
  const to = Math.min(document.lineCount - 1, range.end.line + CONTEXT_LINES);
  const lines: string[] = [];
  for (let i = from; i <= to; i++) {
    lines.push(document.lineAt(i).text);
  }

  if (!(await prepareAI()) || await needsAI('explicar el error')) {
    return;
  }
  const { provider, model, baseUrl } = resolveActiveConfig();
  const apiKey = await ensureApiKey(context, provider);
  if (provider.needsKey && !apiKey) {
    return;
  }
  const file = vscode.workspace.asRelativePath(uri);

  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'AutoCompleteHelp: leyendo el error contigo…' },
    async () => {
      try {
        const markdown = await complete({
          provider,
          baseUrl,
          model,
          apiKey,
          system: buildErrorSystemPrompt(getProjectBlock()),
          user: buildErrorUserPrompt(document.languageId, file, message!, source ?? '', from, lines, range!.start.line, range!.end.line),
          maxTokens: 1200
        });
        showMarkdownPanel('AutoCompleteHelp — Entender el error', markdown, `${file}:${range!.start.line + 1} · ${message}`);
      } catch (err: any) {
        vscode.window.showErrorMessage(`AutoCompleteHelp: ${err?.message ?? err}`);
      }
    }
  );
}

