import * as vscode from 'vscode';
import { resolveActiveConfig } from './providers/catalog';
import { complete, streamComplete } from './providers/client';
import { getApiKey } from './secrets';
import {
  LearningLevel,
  buildDictationSystemPrompt,
  buildUserPrompt,
  extractConcepts,
  getProjectBlock,
  sanitizeCompletion
} from './prompts';
import { knownConcepts, recordAccepted, stagesFor } from './conceptLedger';
import { REVIEW_DAYS, recordReview } from './review';
import { ProjectContext } from './projectContext';
import { markStep } from './projectFile';
import {
  autoMask,
  Range2,
  backPos,
  chooseGaps,
  clipRanges,
  commentPrefixes,
  gapRatio,
  inGap,
  explanationAt,
  lineEnd,
  nextWordEnd,
  progressOf,
  skipAuto,
  subtractRanges,
  typeKeys
} from './typing';

/**
 * MODO DICTADO: la IA no autocompleta, dicta. El código del paso aparece en
 * gris y lo escribes encima, carácter a carácter. Los comentarios (que dicen
 * qué escribir y por qué esa metodología) y la indentación avanzan solos;
 * cada carácter de código y cada Enter los tecleas tú.
 *
 * Para escribir «encima» del gris se toma el comando `type` del editor
 * mientras dura el dictado (como hacen las extensiones de Vim) y se devuelve
 * al terminar. Un acierto no edita el archivo: solo avanza el punto que separa
 * lo escrito del gris. Si terminas antes, se borra lo que falta: en el archivo
 * queda solo lo que escribiste.
 */

const CONTEXT_KEY = 'autocompletehelp.dictating';
const TIP_KEY = 'autocompletehelp.dictationTipShown';
const MAX_PREFIX_CHARS = 6000;
const MAX_SUFFIX_CHARS = 2000;

export type InteractionMode = 'dictado' | 'autocompletar';

/** ¿Se construye dictando? En nivel «pista» no: ahí la IA no da código. */
export function usesDictation(cfg = vscode.workspace.getConfiguration('autocompletehelp')): boolean {
  return (
    cfg.get<InteractionMode>('interactionMode', 'dictado') === 'dictado' &&
    cfg.get<LearningLevel>('learningLevel', 'guiado') !== 'pista'
  );
}

let manager: DictationManager | undefined;

/**
 * Construye la instrucción `ach:` que está sobre el cursor: la dicta o pide la
 * sugerencia inline, según el modo. Lo usan el plan y «Construir aquí».
 */
export async function buildHere(
  editor: vscode.TextEditor,
  instruction: string,
  stepIndex?: number
): Promise<void> {
  if (manager && usesDictation()) {
    await manager.start(editor, instruction, stepIndex);
    return;
  }
  await vscode.commands.executeCommand('editor.action.inlineSuggest.trigger');
}

interface Generated {
  text: string;
  concepts: string[];
  level: LearningLevel;
}

export interface DictationOptions {
  /** Repaso espaciado: id del concepto que se repasa. */
  reviewConcept?: string;
  /** Proporción de huecos fija (si no, se calcula por lo practicado). */
  gapRatio?: number;
}

interface Session {
  doc: vscode.TextDocument;
  text: string;
  mask: boolean[];
  prefixes: string[];
  /** Índice en `text` hasta donde escribiste. */
  pos: number;
  /** Offsets en el documento: inicio del gris y fin del bloque dictado. */
  pendingStart: number;
  end: number;
  errors: number;
  misses: number;
  lastExpected?: string;
  helped: number;
  concepts: string[];
  level: LearningLevel;
  instruction: string;
  stepIndex?: number;
  /** Palabras que no se dictan (índices en `text`): se escriben de memoria. */
  gaps: Range2[];
  options: DictationOptions;
  typeReg: vscode.Disposable;
}

export class DictationManager implements vscode.Disposable {
  private session?: Session;
  private preparing?: string;
  private readonly started = new Set<string>();
  private errorTimer?: ReturnType<typeof setTimeout>;
  private readonly status: vscode.StatusBarItem;
  private readonly pendingDeco = vscode.window.createTextEditorDecorationType({
    color: new vscode.ThemeColor('editorGhostText.foreground'),
    fontStyle: 'normal'
  });
  private readonly nextDeco = vscode.window.createTextEditorDecorationType({
    borderStyle: 'solid',
    borderWidth: '0 0 2px 0',
    borderColor: new vscode.ThemeColor('editorCursor.foreground')
  });
  private readonly enterDeco = vscode.window.createTextEditorDecorationType({
    after: { contentText: ' ⏎', color: new vscode.ThemeColor('editorCursor.foreground') }
  });
  private readonly gapDeco = vscode.window.createTextEditorDecorationType({
    color: 'transparent',
    borderStyle: 'dotted',
    borderWidth: '0 0 1px 0',
    borderColor: new vscode.ThemeColor('editorGhostText.foreground')
  });
  /** Se llama tras cada dictado terminado (el registro de conceptos cambió). */
  afterFinish?: () => void;
  private readonly errorDeco = vscode.window.createTextEditorDecorationType({
    backgroundColor: new vscode.ThemeColor('inputValidation.errorBackground'),
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: new vscode.ThemeColor('inputValidation.errorBorder')
  });
  private readonly disposables: vscode.Disposable[] = [];

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly output: vscode.OutputChannel,
    private readonly project: ProjectContext
  ) {
    manager = this;
    this.status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 50);
    this.status.command = 'autocompletehelp.dictation.menu';
    this.disposables.push(
      this.status,
      this.pendingDeco,
      this.nextDeco,
      this.enterDeco,
      this.gapDeco,
      this.errorDeco,
      vscode.workspace.onDidChangeTextDocument((e) => this.onDocumentChange(e)),
      vscode.workspace.onDidCloseTextDocument((doc) => {
        if (this.session?.doc === doc) {
          this.end();
        }
      }),
      vscode.window.onDidChangeActiveTextEditor(() => this.render(false)),
      vscode.window.onDidChangeVisibleTextEditors(() => this.render(false)),
      vscode.commands.registerCommand('autocompletehelp.dictation.back', () => this.back()),
      vscode.commands.registerCommand('autocompletehelp.dictation.tab', () => this.tab()),
      vscode.commands.registerCommand('autocompletehelp.dictation.enter', () => this.enter()),
      vscode.commands.registerCommand('autocompletehelp.dictation.menu', () => this.menu())
    );
  }

  /** ¿Este documento está en dictado o preparándolo? El autocompletado se aparta. */
  owns(doc: vscode.TextDocument): boolean {
    return this.preparing === doc.uri.toString() || this.session?.doc === doc;
  }

  /** Desde el autocompletado: «ach: …» + Enter. Una vez por instrucción. */
  autoStart(document: vscode.TextDocument, position: vscode.Position, instruction: string): void {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document !== document || this.started.has(keyOf(document, position, instruction))) {
      return;
    }
    void this.start(editor, instruction);
  }

  async start(
    editor: vscode.TextEditor,
    instruction: string,
    stepIndex?: number,
    options: DictationOptions = {}
  ): Promise<void> {
    if (this.session || this.preparing) {
      vscode.window.showInformationMessage(
        'AutoCompleteHelp: ya hay un dictado en curso. Termínalo, o pulsa Esc en el editor para ver las opciones.'
      );
      return;
    }
    const document = editor.document;
    const position = editor.selection.active;
    const version = document.version;
    this.started.add(keyOf(document, position, instruction));
    this.preparing = document.uri.toString();
    try {
      const generated = await this.generate(document, position, instruction);
      if (!generated || document.isClosed) {
        return;
      }
      if (document.version !== version) {
        vscode.window.showWarningMessage(
          'AutoCompleteHelp: el archivo cambió mientras preparaba el dictado. Vuelve a abrir el paso para empezar.'
        );
        return;
      }
      const target =
        vscode.window.visibleTextEditors.find((e) => e.document === document) ??
        (await vscode.window.showTextDocument(document));
      await this.begin(target, position, generated, instruction, stepIndex, options);
    } finally {
      this.preparing = undefined;
    }
  }

  private async generate(
    document: vscode.TextDocument,
    position: vscode.Position,
    instruction: string
  ): Promise<Generated | undefined> {
    const cfg = vscode.workspace.getConfiguration('autocompletehelp');
    const { provider, model, baseUrl } = resolveActiveConfig();
    const apiKey = await getApiKey(this.context, provider);
    if (provider.needsKey && !apiKey) {
      const action = await vscode.window.showWarningMessage(
        `AutoCompleteHelp: falta la API key de ${provider.label} para preparar el dictado.`,
        'Configurar'
      );
      if (action) {
        vscode.commands.executeCommand('autocompletehelp.setApiKey');
      }
      return undefined;
    }

    const level = cfg.get<LearningLevel>('learningLevel', 'guiado');
    const prefix = document
      .getText(new vscode.Range(new vscode.Position(0, 0), position))
      .slice(-MAX_PREFIX_CHARS);
    const suffix = document
      .getText(new vscode.Range(position, document.lineAt(document.lineCount - 1).range.end))
      .slice(0, MAX_SUFFIX_CHARS);
    const [snapshot, related] = cfg.get<boolean>('projectContext', true)
      ? await Promise.all([this.project.snapshot(), this.project.relatedFiles(document)])
      : ['', ''];
    const system = buildDictationSystemPrompt(
      level,
      getProjectBlock(),
      cfg.get<boolean>('projectGuidance', true),
      cfg.get<boolean>('fadingScaffolding', true) ? knownConcepts(this.context) : [],
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

    return vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `AutoCompleteHelp: preparando el dictado de «${instruction}»`,
        cancellable: true
      },
      async (progress, token) => {
        const request = {
          provider,
          baseUrl,
          model,
          apiKey,
          system,
          user,
          maxTokens: Math.max(cfg.get<number>('maxTokens', 400), 2400),
          token
        };
        try {
          const raw = cfg.get<boolean>('streaming', true)
            ? await streamComplete(request, {
                onDelta: (_d, total) => progress.report({ message: `${total.split('\n').length} líneas…` })
              })
            : await complete(request);
          if (token.isCancellationRequested) {
            return undefined;
          }
          const { text: body, concepts } = extractConcepts(raw);
          const text = sanitizeCompletion(body, prefix).replace(/\s+$/, '');
          if (!text.trim()) {
            vscode.window.showWarningMessage(
              'AutoCompleteHelp: la IA no devolvió código para dictar. Prueba de nuevo o reformula la instrucción.'
            );
            return undefined;
          }
          return { text, concepts, level };
        } catch (err: any) {
          if (err?.name !== 'AbortError') {
            this.output.appendLine(`[${new Date().toISOString()}] Dictado, error de ${provider.label}: ${err?.message ?? err}`);
            vscode.window.showErrorMessage(
              `AutoCompleteHelp: no se pudo preparar el dictado con ${provider.label}. Detalle en el panel Salida › AutoCompleteHelp.`
            );
          }
          return undefined;
        }
      }
    );
  }

  private async begin(
    editor: vscode.TextEditor,
    position: vscode.Position,
    generated: Generated,
    instruction: string,
    stepIndex: number | undefined,
    options: DictationOptions
  ): Promise<void> {
    const doc = editor.document;
    let typeReg: vscode.Disposable;
    try {
      typeReg = vscode.commands.registerCommand('type', (args: { text: string }) => this.onType(args));
    } catch {
      vscode.window.showWarningMessage(
        'AutoCompleteHelp: otra extensión (por ejemplo, Vim) controla el teclado y el dictado no puede escribir encima del código. Cambia el modo a «autocompletar» con el comando «Elegir modo».'
      );
      return;
    }

    // Si el cursor está en una línea vacía (quizá con espacios), el bloque
    // reemplaza esos espacios: el modelo ya indenta según el contexto.
    const line = doc.lineAt(position.line);
    const before = line.text.slice(0, position.character);
    const insertAt = before.trim() === '' ? line.range.start : position;
    let text = generated.text;
    if (line.text.slice(position.character).trim() !== '') {
      text += '\n';
    }
    const ok = await editor.edit((e) => e.replace(new vscode.Range(insertAt, position), text));
    if (!ok) {
      typeReg.dispose();
      return;
    }

    const cfg = vscode.workspace.getConfiguration('autocompletehelp');
    const prefixes = commentPrefixes(doc.languageId);
    const mask = autoMask(text, prefixes, cfg.get<boolean>('dictation.typeComments', false));
    const start = doc.offsetAt(insertAt);
    const pos = skipAuto(mask, 0);
    const gaps = chooseGaps(text, mask, this.gapRatioFor(generated.concepts, options), start + 1);
    this.session = {
      doc,
      text,
      mask,
      prefixes,
      pos,
      pendingStart: start + pos,
      end: start + text.length,
      errors: 0,
      misses: 0,
      helped: 0,
      concepts: generated.concepts,
      level: generated.level,
      instruction,
      stepIndex,
      gaps,
      options,
      typeReg
    };
    this.render(true);
    if (pos >= text.length) {
      await this.finish('escrito');
      return;
    }
    if (gaps.length) {
      vscode.window.setStatusBarMessage(
        `AutoCompleteHelp: ${gaps.length} ${gaps.length === 1 ? 'palabra queda' : 'palabras quedan'} como hueco: ya las practicaste, escríbelas de memoria (Tab las revela).`,
        8000
      );
    }
    if (!this.context.globalState.get<boolean>(TIP_KEY)) {
      void this.context.globalState.update(TIP_KEY, true);
      vscode.window.showInformationMessage(
        'Dictado: escribe encima del código gris. Lee cada comentario antes de su bloque: dice qué escribir y por qué. Tab: te dicto una palabra · Retroceso: volver · Esc: opciones.'
      );
    }
  }

  /**
   * Huecos según lo practicado: en un concepto nuevo se dicta todo; en lo que
   * ya escribiste varias veces, algunas palabras se completan de memoria.
   */
  private gapRatioFor(concepts: string[], options: DictationOptions): number {
    if (options.gapRatio !== undefined) {
      return options.gapRatio;
    }
    const mode = vscode.workspace.getConfiguration('autocompletehelp').get<string>('dictation.gaps', 'auto');
    if (mode === 'off') {
      return 0;
    }
    const st = stagesFor(this.context, concepts);
    const ratio = gapRatio({
      nuevos: st.nuevos.length,
      enPractica: st.enPractica.length,
      conocidos: st.conocidos.length
    });
    return mode === 'always' ? Math.max(ratio, 0.3) : ratio;
  }

  // ---------------------------------------------------------------------------
  // Teclado
  // ---------------------------------------------------------------------------

  /** El editor activo está en el punto de escritura del dictado. */
  private writingEditor(): vscode.TextEditor | undefined {
    const s = this.session;
    const editor = vscode.window.activeTextEditor;
    if (!s || !editor || editor.document !== s.doc || !editor.selection.isEmpty) {
      return undefined;
    }
    const at = s.doc.offsetAt(editor.selection.active);
    // Dentro del gris también cuenta: el cursor vuelve al punto de escritura.
    return at >= s.pendingStart && at <= s.end ? editor : undefined;
  }

  private onType(args: { text: string }): Thenable<unknown> | void {
    const s = this.session;
    if (!s || !this.writingEditor()) {
      return vscode.commands.executeCommand('default:type', args);
    }
    this.advance(typeKeys(s.text, s.mask, s.pos, args.text));
  }

  private advance(result: { ok: boolean; pos: number; expected?: string }, helped = false): void {
    const s = this.session;
    if (!s) {
      return;
    }
    s.pendingStart += result.pos - s.pos;
    s.pos = result.pos;
    if (helped) {
      s.helped++;
    }
    if (result.ok) {
      s.misses = 0;
      s.lastExpected = undefined;
    } else {
      s.errors++;
      s.misses++;
      s.lastExpected = result.expected;
      this.flashError();
    }
    this.render(true);
    if (s.pos >= s.text.length) {
      void this.finish('escrito');
    }
  }

  private back(): Thenable<unknown> | void {
    const s = this.session;
    if (!s || !this.writingEditor() || s.doc.offsetAt(vscode.window.activeTextEditor!.selection.active) !== s.pendingStart) {
      return vscode.commands.executeCommand('deleteLeft');
    }
    const pos = backPos(s.mask, s.pos);
    s.pendingStart -= s.pos - pos;
    s.pos = pos;
    s.misses = 0;
    s.lastExpected = undefined;
    this.render(true);
  }

  private tab(): Thenable<unknown> | void {
    const s = this.session;
    if (!s || !this.writingEditor()) {
      return vscode.commands.executeCommand('tab');
    }
    const pos = nextWordEnd(s.text, s.mask, s.pos);
    if (pos === s.pos) {
      vscode.window.setStatusBarMessage('AutoCompleteHelp: fin de línea, pulsa Enter.', 2500);
      return;
    }
    this.advance({ ok: true, pos: skipAuto(s.mask, pos) }, true);
  }

  private enter(): Thenable<unknown> | void {
    if (!this.session || !this.writingEditor()) {
      return vscode.commands.executeCommand('default:type', { text: '\n' });
    }
    this.onType({ text: '\n' });
  }

  private async menu(): Promise<void> {
    const s = this.session;
    if (!s) {
      return;
    }
    const pick = await vscode.window.showQuickPick(
      [
        { label: '$(edit) Seguir escribiendo', id: 'seguir' },
        { label: '$(eye) Díctame la línea actual', description: 'la completa por ti (cuenta como ayuda)', id: 'linea' },
        {
          label: '$(check-all) Completar el resto sin escribirlo',
          description: 'el código queda, pero no cuenta como practicado',
          id: 'completar'
        },
        { label: '$(trash) Terminar y borrar lo que falta', description: 'queda solo lo que escribiste', id: 'borrar' }
      ],
      { title: `Dictado: ${s.instruction} — ${progressOf(s.mask, s.pos)}%` }
    );
    if (!pick || this.session !== s) {
      return;
    }
    if (pick.id === 'linea') {
      const end = Math.min(s.text.length, lineEnd(s.text, s.pos) + 1);
      this.advance({ ok: true, pos: skipAuto(s.mask, end) }, true);
    } else if (pick.id === 'completar') {
      await this.finish('completado');
    } else if (pick.id === 'borrar') {
      await this.stopAndDelete();
    } else {
      this.render(true);
    }
  }

  // ---------------------------------------------------------------------------
  // Cambios en el documento
  // ---------------------------------------------------------------------------

  private onDocumentChange(e: vscode.TextDocumentChangeEvent): void {
    const s = this.session;
    if (!s || e.document !== s.doc) {
      return;
    }
    for (const c of e.contentChanges) {
      const from = c.rangeOffset;
      const to = c.rangeOffset + c.rangeLength;
      if (to <= s.pendingStart) {
        // Edición antes del gris (en lo ya escrito o más arriba): se desplaza.
        const delta = c.text.length - c.rangeLength;
        s.pendingStart += delta;
        s.end += delta;
      } else if (from < s.end) {
        this.abort();
        return;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Fin del dictado
  // ---------------------------------------------------------------------------

  /** Cierra la sesión: devuelve el teclado, quita el gris de la vista. */
  private end(): Session | undefined {
    const s = this.session;
    if (!s) {
      return undefined;
    }
    this.session = undefined;
    s.typeReg.dispose();
    clearTimeout(this.errorTimer);
    void vscode.commands.executeCommand('setContext', CONTEXT_KEY, false);
    for (const editor of vscode.window.visibleTextEditors) {
      if (editor.document === s.doc) {
        for (const deco of [this.pendingDeco, this.nextDeco, this.enterDeco, this.gapDeco, this.errorDeco]) {
          editor.setDecorations(deco, []);
        }
      }
    }
    this.status.hide();
    return s;
  }

  private async finish(how: 'escrito' | 'completado'): Promise<void> {
    const s = this.end();
    if (!s) {
      return;
    }
    if (s.options.reviewConcept) {
      await this.finishReview(s, how);
      return;
    }
    if (vscode.workspace.getConfiguration('autocompletehelp').get<boolean>('fadingScaffolding', true)) {
      await recordAccepted(this.context, s.concepts, how === 'escrito' ? 'dictado' : s.level);
    }
    this.afterFinish?.();
    const typed = s.mask.filter((auto) => !auto).length;
    const message =
      how === 'escrito'
        ? `✓ Lo escribiste tú: ${typed} caracteres, ${s.errors} ${s.errors === 1 ? 'error' : 'errores'}` +
          (s.helped ? `, ${s.helped} ${s.helped === 1 ? 'ayuda' : 'ayudas'}.` : '.')
        : 'Dictado completado sin escribirlo. Repasa los comentarios: explican cada decisión.';
    const actions = s.stepIndex !== undefined ? ['Marcar el paso como hecho'] : [];
    const action = await vscode.window.showInformationMessage(message, ...actions);
    if (action && s.stepIndex !== undefined) {
      await markStep(this.context, s.stepIndex, true);
    }
  }

  private async finishReview(s: Session, how: 'escrito' | 'completado'): Promise<void> {
    const id = s.options.reviewConcept!;
    // Completarlo sin escribir no es un repaso: cuenta como que costó.
    const result =
      how === 'escrito'
        ? { errors: s.errors, helped: s.helped, gaps: s.gaps.length }
        : { errors: Infinity, helped: Infinity, gaps: s.gaps.length };
    const advanced = await recordReview(this.context, id, result);
    this.afterFinish?.();
    vscode.window.showInformationMessage(
      advanced
        ? `✓ Repaso superado (${s.errors} ${s.errors === 1 ? 'error' : 'errores'}, ${s.helped} ${s.helped === 1 ? 'ayuda' : 'ayudas'}). El concepto vuelve más adelante: cada repaso bien hecho alarga el intervalo.`
        : `Este repaso costó (${s.errors} ${s.errors === 1 ? 'error' : 'errores'}, ${s.helped} ${s.helped === 1 ? 'ayuda' : 'ayudas'}): el concepto vuelve en ${REVIEW_DAYS[0]} día. Es normal; repetirlo pronto es lo que lo fija.`
    );
  }

  private async stopAndDelete(): Promise<void> {
    const s = this.session;
    if (!s) {
      return;
    }
    const range = new vscode.Range(s.doc.positionAt(s.pendingStart), s.doc.positionAt(s.end));
    this.end();
    const editor = vscode.window.visibleTextEditors.find((e) => e.document === s.doc);
    if (editor) {
      await editor.edit((e) => e.delete(range));
    }
    vscode.window.showInformationMessage('Dictado terminado: en el archivo quedó solo lo que escribiste.');
  }

  private abort(): void {
    if (!this.end()) {
      return;
    }
    vscode.window.showWarningMessage(
      'AutoCompleteHelp: el dictado se detuvo porque cambió el código en gris (al pegar, deshacer o editar ahí). Lo que quede de él es ahora texto normal: revísalo o bórralo.'
    );
  }

  // ---------------------------------------------------------------------------
  // Vista
  // ---------------------------------------------------------------------------

  private flashError(): void {
    const s = this.session;
    if (!s) {
      return;
    }
    const range = new vscode.Range(s.doc.positionAt(s.pendingStart), s.doc.positionAt(s.pendingStart + 1));
    for (const editor of vscode.window.visibleTextEditors) {
      if (editor.document === s.doc) {
        editor.setDecorations(this.errorDeco, [range]);
      }
    }
    clearTimeout(this.errorTimer);
    this.errorTimer = setTimeout(() => {
      for (const editor of vscode.window.visibleTextEditors) {
        editor.setDecorations(this.errorDeco, []);
      }
    }, 600);
  }

  private render(moveCursor: boolean): void {
    const s = this.session;
    const active = vscode.window.activeTextEditor;
    void vscode.commands.executeCommand('setContext', CONTEXT_KEY, !!s && active?.document === s.doc);
    if (!s) {
      return;
    }
    const at = s.doc.positionAt(s.pendingStart);
    // Offset del inicio del bloque en el documento (se desplaza con ediciones previas).
    const base = s.pendingStart - s.pos;
    const toRange = ([a, b]: Range2) => new vscode.Range(s.doc.positionAt(base + a), s.doc.positionAt(base + b));
    const pending = subtractRanges(s.pos, s.text.length, s.gaps).map(toRange);
    const gaps = clipRanges(s.pos, s.text.length, s.gaps).map(toRange);
    const expectsEnter = s.text[s.pos] === '\n';
    const next = new vscode.Range(at, s.doc.positionAt(s.pendingStart + 1));
    for (const editor of vscode.window.visibleTextEditors) {
      if (editor.document !== s.doc) {
        continue;
      }
      editor.setDecorations(this.pendingDeco, pending);
      editor.setDecorations(this.gapDeco, gaps);
      editor.setDecorations(this.nextDeco, expectsEnter ? [] : [next]);
      editor.setDecorations(this.enterDeco, expectsEnter ? [new vscode.Range(at, at)] : []);
    }
    if (moveCursor && active?.document === s.doc) {
      active.selection = new vscode.Selection(at, at);
      active.revealRange(new vscode.Range(at, at), vscode.TextEditorRevealType.InCenterIfOutsideViewport);
    }

    const pct = progressOf(s.mask, s.pos);
    // En un hueco no se dice qué carácter falta: se trata de recordarlo.
    const hint =
      s.lastExpected === undefined
        ? ''
        : inGap(s.gaps, s.pos)
          ? ' · hueco: recuérdalo (Tab lo revela)'
          : ` · esperaba ${showChar(s.lastExpected)}`;
    this.status.text = `$(pencil) Dictado ${pct}% · ${s.errors} ${s.errors === 1 ? 'error' : 'errores'}${hint}`;
    const explanation = explanationAt(s.text, s.pos, s.prefixes);
    this.status.tooltip = new vscode.MarkdownString(
      [
        `**${s.options.reviewConcept ? 'Repaso' : 'Dictado'}:** ${s.instruction}`,
        s.gaps.length ? `Huecos: ${s.gaps.length} palabras para escribir de memoria.` : '',
        explanation ? `> ${explanation}` : '',
        'Escribe encima del gris. **Tab**: te dicto una palabra · **Retroceso**: volver · **Esc** o clic aquí: opciones.'
      ]
        .filter(Boolean)
        .join('\n\n')
    );
    this.status.show();
  }

  dispose(): void {
    this.end();
    for (const d of this.disposables) {
      d.dispose();
    }
    if (manager === this) {
      manager = undefined;
    }
  }
}

function keyOf(doc: vscode.TextDocument, position: vscode.Position, instruction: string): string {
  return `${doc.uri.toString()}#${position.line}#${instruction}`;
}

function showChar(ch: string): string {
  if (ch === '\n') {
    return 'Enter';
  }
  if (ch === ' ') {
    return 'un espacio';
  }
  return `«${ch}»`;
}
