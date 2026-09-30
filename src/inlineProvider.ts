import * as vscode from 'vscode';
import { resolveActiveConfig } from './providers/catalog';
import { complete, streamComplete } from './providers/client';
import { getApiKey } from './secrets';
import {
  LearningLevel,
  buildSystemPrompt,
  buildUserPrompt,
  extractConcepts,
  getProjectPrompt,
  sanitizeCompletion
} from './prompts';
import { knownConcepts } from './conceptLedger';

const MAX_PREFIX_CHARS = 6000;
const MAX_SUFFIX_CHARS = 2000;
// Corte temprano del stream: con esto ya hay una sugerencia útil en pantalla.
const STREAM_MAX_LINES = 18;
const STREAM_MAX_CHARS = 1600;

export class AutoCompleteHelpProvider implements vscode.InlineCompletionItemProvider {
  private lastKey = '';
  private lastResult = '';
  private lastConcepts: string[] = [];
  private keyWarned = false;
  private promptNudged = false;
  private readonly progress: vscode.StatusBarItem;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly output: vscode.OutputChannel
  ) {
    this.progress = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 99);
    context.subscriptions.push(this.progress);
  }

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

    // Caché trivial: mismo punto de inserción → misma sugerencia.
    const cacheKey = `${document.uri.toString()}#${prefix}#${suffix.slice(0, 200)}`;
    if (cacheKey === this.lastKey && this.lastResult) {
      return [this.buildItem(this.lastResult, this.lastConcepts, cfg)];
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

    // El prompt del proyecto es el corazón de la extensión: si falta, sugerimos definirlo.
    const projectPrompt = getProjectPrompt(this.context);
    if (!projectPrompt && !this.promptNudged) {
      this.promptNudged = true;
      vscode.window
        .showInformationMessage(
          'AutoCompleteHelp: define el prompt del proyecto para que el autocompletado te guíe archivo a archivo.',
          'Definir prompt'
        )
        .then((action) => {
          if (action === 'Definir prompt') {
            vscode.commands.executeCommand('autocompletehelp.setProjectPrompt');
          }
        });
    }

    const level = cfg.get<LearningLevel>('learningLevel', 'guiado');
    const guidance = cfg.get<boolean>('projectGuidance', true);
    const fading = cfg.get<boolean>('fadingScaffolding', true);
    const system = buildSystemPrompt(
      level,
      projectPrompt,
      guidance,
      fading ? knownConcepts(this.context) : []
    );
    const user = buildUserPrompt(
      document.languageId,
      vscode.workspace.asRelativePath(document.uri),
      prefix,
      suffix
    );

    const request = {
      provider,
      baseUrl,
      model,
      apiKey,
      system,
      user,
      maxTokens: cfg.get<number>('maxTokens', 400),
      token
    };

    try {
      let raw: string;
      if (cfg.get<boolean>('streaming', true)) {
        this.progress.text = '$(loading~spin) ACH generando…';
        this.progress.show();
        raw = await streamComplete(request, {
          onDelta: (_d, total) => {
            this.progress.text = `$(loading~spin) ACH streaming… ${total.length}`;
          },
          // Corte temprano: suficientes líneas o un bloque cerrado al final.
          shouldStop: (total) =>
            total.length >= STREAM_MAX_CHARS ||
            countLines(total) >= STREAM_MAX_LINES
        });
        this.progress.hide();
      } else {
        raw = await complete(request);
      }
      if (token.isCancellationRequested) {
        return undefined;
      }
      const { text: body, concepts } = extractConcepts(raw);
      const text = sanitizeCompletion(body, prefix);
      if (!text.trim()) {
        return undefined;
      }
      this.lastKey = cacheKey;
      this.lastResult = text;
      this.lastConcepts = concepts;
      return [this.buildItem(text, concepts, cfg)];
    } catch (err: any) {
      this.progress.hide();
      if (err?.name === 'AbortError') {
        return undefined;
      }
      this.output.appendLine(`[${new Date().toISOString()}] Error de ${provider.label}: ${err?.message ?? err}`);
      return undefined;
    }
  }

  /**
   * El `command` de un InlineCompletionItem se ejecuta al ACEPTAR la
   * sugerencia: es nuestra única señal fiable de que el concepto entró de
   * verdad al código del usuario (y no de que el fantasma pasó por pantalla).
   */
  private buildItem(
    text: string,
    concepts: string[],
    cfg: vscode.WorkspaceConfiguration
  ): vscode.InlineCompletionItem {
    const item = new vscode.InlineCompletionItem(text);
    if (concepts.length && cfg.get<boolean>('fadingScaffolding', true)) {
      item.command = {
        command: 'autocompletehelp.recordAccepted',
        title: 'AutoCompleteHelp: registrar conceptos aprendidos',
        arguments: [concepts, cfg.get<LearningLevel>('learningLevel', 'guiado')]
      };
    }
    return item;
  }
}

function countLines(text: string): number {
  let n = 1;
  for (let i = 0; i < text.length; i++) {
    if (text.charCodeAt(i) === 10) {
      n++;
    }
  }
  return n;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
