import * as vscode from 'vscode';
import { resolveActiveConfig } from './providers/catalog';
import { complete, streamComplete } from './providers/client';
import { getApiKey } from './secrets';
import {
  LearningLevel,
  buildSystemPrompt,
  buildUserPrompt,
  extractConcepts,
  getProjectBlock,
  getProjectPrompt,
  sanitizeCompletion
} from './prompts';
import { knownConcepts } from './conceptLedger';
import { ProjectContext, detectInstruction } from './projectContext';

const MAX_PREFIX_CHARS = 6000;
const MAX_SUFFIX_CHARS = 2000;
// Corte temprano del stream: con esto ya hay una sugerencia útil en pantalla.
const STREAM_MAX_LINES = 18;
const STREAM_MAX_CHARS = 1600;
// Una instrucción `ach:` pide una pieza completa (una ruta, una función):
// se le da más margen antes del corte temprano.
const INSTRUCTION_MAX_LINES = 45;
const INSTRUCTION_MAX_CHARS = 3600;

export class AutoCompleteHelpProvider implements vscode.InlineCompletionItemProvider {
  private lastKey = '';
  private lastResult = '';
  private lastConcepts: string[] = [];
  private keyWarned = false;
  private promptNudged = false;
  private readonly progress: vscode.StatusBarItem;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly output: vscode.OutputChannel,
    private readonly project: ProjectContext
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
    const useContext = cfg.get<boolean>('projectContext', true);
    const instruction = detectInstruction(prefix);

    // Contexto del proyecto: árbol + dependencias (estable, va al sistema) y
    // lo que exportan los archivos que este importa (va al mensaje).
    const [snapshot, related] = useContext
      ? await Promise.all([this.project.snapshot(), this.project.relatedFiles(document)])
      : ['', ''];
    if (token.isCancellationRequested) {
      return undefined;
    }

    const system = buildSystemPrompt(
      level,
      getProjectBlock(),
      guidance,
      fading ? knownConcepts(this.context) : [],
      snapshot
    );
    const user = buildUserPrompt(
      document.languageId,
      vscode.workspace.asRelativePath(document.uri),
      prefix,
      suffix,
      related,
      instruction
    );

    const baseTokens = cfg.get<number>('maxTokens', 400);
    const request = {
      provider,
      baseUrl,
      model,
      apiKey,
      system,
      user,
      maxTokens: instruction ? Math.max(baseTokens, 1200) : baseTokens,
      token
    };
    const maxLines = instruction ? INSTRUCTION_MAX_LINES : STREAM_MAX_LINES;
    const maxChars = instruction ? INSTRUCTION_MAX_CHARS : STREAM_MAX_CHARS;

    try {
      let raw: string;
      if (cfg.get<boolean>('streaming', true)) {
        const label = instruction ? 'ACH siguiendo tu instrucción' : 'ACH';
        this.progress.text = `$(loading~spin) ${label} generando…`;
        this.progress.show();
        raw = await streamComplete(request, {
          onDelta: (_d, total) => {
            this.progress.text = `$(loading~spin) ${label} streaming… ${total.length}`;
          },
          // Corte temprano: con suficientes líneas ya hay una sugerencia útil.
          shouldStop: (total) => total.length >= maxChars || countLines(total) >= maxLines
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
