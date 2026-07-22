import * as vscode from 'vscode';
import { resolveActiveConfig } from './providers/catalog';
import { complete } from './providers/client';
import { getApiKey } from './secrets';
import {
  LearningLevel,
  buildSystemPrompt,
  buildUserPrompt,
  getProjectPrompt,
  sanitizeCompletion
} from './prompts';

const MAX_PREFIX_CHARS = 6000;
const MAX_SUFFIX_CHARS = 2000;

export class AutoCompleteHelpProvider implements vscode.InlineCompletionItemProvider {
  private lastKey = '';
  private lastResult = '';
  private keyWarned = false;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly output: vscode.OutputChannel
  ) {}

  async provideInlineCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    _ctx: vscode.InlineCompletionContext,
    token: vscode.CancellationToken
  ): Promise<vscode.InlineCompletionItem[] | undefined> {
    const cfg = vscode.workspace.getConfiguration('autocompletehelp');
    if (!cfg.get<boolean>('enabled', true)) {
      return undefined;
    }

    // Debounce: esperar a que el usuario deje de teclear.
    const debounceMs = cfg.get<number>('debounceMs', 350);
    await delay(debounceMs);
    if (token.isCancellationRequested) {
      return undefined;
    }

    const prefix = document.getText(
      new vscode.Range(new vscode.Position(0, 0), position)
    ).slice(-MAX_PREFIX_CHARS);
    const suffix = document
      .getText(
        new vscode.Range(position, document.lineAt(document.lineCount - 1).range.end)
      )
      .slice(0, MAX_SUFFIX_CHARS);

    if (prefix.trim().length < 3) {
      return undefined;
    }

    // Caché trivial: mismo punto de inserción → misma sugerencia.
    const cacheKey = `${document.uri.toString()}#${prefix}#${suffix.slice(0, 200)}`;
    if (cacheKey === this.lastKey && this.lastResult) {
      return [new vscode.InlineCompletionItem(this.lastResult)];
    }

    const { provider, model, baseUrl } = resolveActiveConfig();
    const apiKey = await getApiKey(this.context, provider);
    if (provider.needsKey && !apiKey) {
      if (!this.keyWarned) {
        this.keyWarned = true;
        const action = await vscode.window.showWarningMessage(
          `AutoCompleteHelp: falta la API key de ${provider.label}.`,
          'Configurar'
        );
        if (action === 'Configurar') {
          vscode.commands.executeCommand('autocompletehelp.setApiKey');
        }
      }
      return undefined;
    }

    const level = cfg.get<LearningLevel>('learningLevel', 'guiado');
    const system = buildSystemPrompt(level, getProjectPrompt(this.context));
    const user = buildUserPrompt(
      document.languageId,
      vscode.workspace.asRelativePath(document.uri),
      prefix,
      suffix
    );

    try {
      const raw = await complete({
        provider,
        baseUrl,
        model,
        apiKey,
        system,
        user,
        maxTokens: cfg.get<number>('maxTokens', 400),
        token
      });
      if (token.isCancellationRequested) {
        return undefined;
      }
      const text = sanitizeCompletion(raw, prefix);
      if (!text.trim()) {
        return undefined;
      }
      this.lastKey = cacheKey;
      this.lastResult = text;
      return [new vscode.InlineCompletionItem(text)];
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return undefined;
      }
      this.output.appendLine(`[${new Date().toISOString()}] Error de ${provider.label}: ${err?.message ?? err}`);
      return undefined;
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
