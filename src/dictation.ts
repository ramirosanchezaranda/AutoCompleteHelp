import { stripsComments, textForSave } from './core/comments';
import * as vscode from 'vscode';
import { noAI, resolveActiveConfig } from './providers/catalog';
import { lessonCode } from './lessons';
import { complete, streamComplete } from './providers/client';
import { getApiKey, prepareAI } from './secrets';
import {
  buildDictationSystemPrompt,
  buildUserPrompt,
  extractConcepts,
  getProjectBlock,
  sanitizeCompletion
} from './prompts';
import { knownConcepts, recordAccepted } from './conceptLedger';
import { REVIEW_DAYS, recordReview } from './review';
import { ProjectContext, detectInstruction } from './projectContext';
import { getProject, markStep } from './projectFile';
import { writeCommand } from './terminal';
import {
  autoMask,
  Range2,
  backPos,
  chooseGaps,
  clipRanges,
  commentPrefixes,
  inGap,
  explanationAt,
  summaryAt,
  lineEnd,
  progressOf,
  revealEnd,
  skipAuto,
  subtractRanges,
  typeKeys
} from './typing';

/**
 * «COMPLETAMOS JUNTOS»: el único modo. La IA no autocompleta, dicta. Se ve en
 * gris UNA línea de código a la vez, con los comentarios que la explican
 * justo arriba, y la escribes encima, carácter a carácter. Al terminarla
 * (Enter) aparece la siguiente. Los comentarios y la indentación avanzan
 * solos; cada carácter de código y cada Enter los tecleas tú.
 *
 * El código se inserta en el archivo a medida que avanzas: nunca hay en el
 * archivo más que lo que escribiste y la línea en curso. Para escribir
 * «encima» del gris se toma el comando `type` del editor mientras dura la
 * sesión (como hacen las extensiones de Vim) y se devuelve al terminar.
 */

const CONTEXT_KEY = 'autocompletehelp.dictating';
const TIP_KEY = 'autocompletehelp.dictationTipShown';
const MAX_PREFIX_CHARS = 6000;
const MAX_SUFFIX_CHARS = 2000;

let manager: DictationManager | undefined;

/** Construye la instrucción `ach:` que está sobre el cursor. Lo usan el plan y «Construir aquí». */
export async function buildHere(
  editor: vscode.TextEditor,
  instruction: string,
  stepIndex?: number
): Promise<void> {
  await manager?.start(editor, instruction, stepIndex);
}

interface Generated {
  text: string;
  concepts: string[];
}

export interface DictationOptions {
  /** Repaso espaciado: id del concepto que se repasa. */
  reviewConcept?: string;
  /** Proporción de huecos. Solo los repasos tienen huecos. */
  gapRatio?: number;
}

interface Session {
  doc: vscode.TextDocument;
  text: string;
  mask: boolean[];
  prefixes: string[];
  /** Índice en `text` hasta donde escribiste. */
  pos: number;
  /** Índice en `text` hasta donde el código ya está en el archivo. */
  shown: number;
  /** Offsets en el documento: inicio del gris y fin de lo insertado. */
  pendingStart: number;
  end: number;
  errors: number;
  misses: number;
  lastExpected?: string;
  helped: number;
  concepts: string[];
  instruction: string;
  stepIndex?: number;
  /** Palabras que no se muestran (índices en `text`): se escriben de memoria. */
  gaps: Range2[];
  options: DictationOptions;
  typeReg: vscode.Disposable;
  /** Se activó el ajuste de línea para esta sesión: se devuelve al terminar. */
  wrapped: boolean;
}

export class DictationManager implements vscode.Disposable {
  private session?: Session;
  private preparing?: string;
  private readonly started = new Set<string>();
  /** Teclas en orden: cada una puede insertar la línea siguiente (asíncrono). */
  private queue: Promise<unknown> = Promise.resolve();
  /** Inserción propia en curso: el listener de cambios no la toma como ajena. */
  private selfEdit = false;
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
  private readonly errorDeco = vscode.window.createTextEditorDecorationType({
    backgroundColor: new vscode.ThemeColor('inputValidation.errorBackground'),
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: new vscode.ThemeColor('inputValidation.errorBorder')
  });
  /** Se llama tras cada sesión terminada (el registro de conceptos cambió). */
  afterFinish?: () => void;
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
      vscode.commands.registerCommand('autocompletehelp.dictation.back', () => this.enqueue(() => this.back())),
      vscode.commands.registerCommand('autocompletehelp.dictation.tab', () => this.enqueue(() => this.tab())),
      vscode.commands.registerCommand('autocompletehelp.dictation.enter', () => this.enqueue(() => this.enter())),
      vscode.commands.registerCommand('autocompletehelp.dictation.menu', () => this.menu())
    );
  }

  private enqueue(fn: () => unknown): Promise<unknown> {
    const run = this.queue.then(fn);
    this.queue = run.catch((err) => this.output.appendLine(`[${new Date().toISOString()}] ${err?.message ?? err}`));
    return run;
  }

  async start(
    editor: vscode.TextEditor,
    instruction: string,
    stepIndex?: number,
    options: DictationOptions = {}
  ): Promise<void> {
    if (this.session || this.preparing) {
      vscode.window.showInformationMessage(
        'AutoCompleteHelp: ya estamos completando algo juntos. Termínalo, o pulsa Esc en el editor para ver las opciones.'
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
          'AutoCompleteHelp: el archivo cambió mientras preparaba el código. Vuelve a abrir el paso para empezar.'
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
    // Lección sin IA: el código del paso ya está escrito y revisado.
    const lesson = lessonCode(getProject()?.leccion, vscode.workspace.asRelativePath(document.uri, false));
    if (lesson) {
      return { text: lesson.text, concepts: lesson.concepts };
    }
    if (!(await prepareAI())) {
      return undefined;
    }
    if (noAI()) {
      const action = await vscode.window.showInformationMessage(
        'AutoCompleteHelp está en modo sin IA y este paso no es de una lección escrita. Puedes escribirlo tú (el plan y la guía siguen), elegir una lección sin IA en «Quiero aprender», o activar una IA con API key o local.',
        'Elegir IA'
      );
      if (action) {
        vscode.commands.executeCommand('autocompletehelp.selectModel');
      }
      return undefined;
    }
    const cfg = vscode.workspace.getConfiguration('autocompletehelp');
    const { provider, model, baseUrl } = resolveActiveConfig();
    const apiKey = await getApiKey(this.context, provider);
    if (provider.needsKey && !apiKey) {
      const action = await vscode.window.showWarningMessage(
        `AutoCompleteHelp: falta la API key de ${provider.label} para preparar el código.`,
        'Escribir la API key',
        'Elegir otra IA'
      );
      if (action === 'Escribir la API key') {
        vscode.commands.executeCommand('autocompletehelp.setApiKey', provider.id);
      } else if (action) {
        vscode.commands.executeCommand('autocompletehelp.selectModel');
      }
      return undefined;
    }

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
        title: `AutoCompleteHelp: preparando «${instruction}»`,
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
          maxTokens: Math.max(cfg.get<number>('maxTokens', 2400), 1200),
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
              'AutoCompleteHelp: la IA no devolvió código. Prueba de nuevo o reformula la instrucción.'
            );
            return undefined;
          }
          return { text, concepts };
        } catch (err: any) {
          if (err?.name !== 'AbortError') {
            this.output.appendLine(`[${new Date().toISOString()}] Error de ${provider.label}: ${err?.message ?? err}`);
            vscode.window.showErrorMessage(
              `AutoCompleteHelp: no se pudo preparar el código con ${provider.label}. Detalle en el panel Salida › AutoCompleteHelp.`
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
      typeReg = vscode.commands.registerCommand('type', (args: { text: string }) =>
        this.enqueue(() => this.onType(args))
      );
    } catch {
      vscode.window.showWarningMessage(
        'AutoCompleteHelp: otra extensión (por ejemplo, Vim) controla el teclado y no puedes escribir encima del código. Desactívala mientras completamos juntos.'
      );
      return;
    }

    const cfg = vscode.workspace.getConfiguration('autocompletehelp');
    const text = generated.text;
    const prefixes = commentPrefixes(doc.languageId);
    const mask = autoMask(text, prefixes, cfg.get<boolean>('dictation.typeComments', true));
    const pos = skipAuto(mask, 0);
    const shown = revealEnd(text, pos);

    // Si el cursor está en una línea vacía (quizá con espacios), el bloque
    // reemplaza esos espacios: el modelo ya indenta según el contexto. Si hay
    // texto después del cursor, queda en su propia línea, debajo.
    const line = doc.lineAt(position.line);
    const insertAt = line.text.slice(0, position.character).trim() === '' ? line.range.start : position;
    const tail = line.text.slice(position.character).trim() !== '' ? '\n' : '';
    this.selfEdit = true;
    const ok = await editor.edit((e) => e.replace(new vscode.Range(insertAt, position), text.slice(0, shown) + tail));
    this.selfEdit = false;
    if (!ok) {
      typeReg.dispose();
      return;
    }

    const start = doc.offsetAt(insertAt);
    this.session = {
      doc,
      text,
      mask,
      prefixes,
      pos,
      shown,
      pendingStart: start + pos,
      end: start + shown,
      errors: 0,
      misses: 0,
      helped: 0,
      concepts: generated.concepts,
      instruction,
      stepIndex,
      gaps: chooseGaps(text, mask, options.gapRatio ?? 0, start + 1),
      options,
      typeReg,
      wrapped: false
    };
    this.render(true);
    // Después de crear la sesión: si se cambia de editor, el teclado ya está tomado por ella.
    const session = this.session;
    session.wrapped = await this.wrapOn(editor, cfg);
    // Si la sesión terminó mientras tanto, se devuelve el ajuste enseguida.
    if (this.session !== session && session.wrapped) {
      await this.wrapOff(doc);
    }
    if (pos >= text.length) {
      await this.finish('escrito');
      return;
    }
    if (!this.context.globalState.get<boolean>(TIP_KEY)) {
      void this.context.globalState.update(TIP_KEY, true);
      vscode.window.showInformationMessage(
        'Completamos juntos: escribe encima de la línea en gris. Lee el comentario de arriba: dice qué escribir y por qué. Al terminar la línea pulsa Enter y aparece la siguiente. Al cerrar un bloque, el comentario ↑ resume lo que hace. Retroceso: volver · Esc: opciones.'
      );
    }
  }

  /**
   * Inserta en el archivo lo que corresponde mostrar ahora: los comentarios y
   * la línea siguiente cuando terminas una, o todo lo que queda al final.
   */
  private async reveal(): Promise<void> {
    const s = this.session;
    if (!s) {
      return;
    }
    const target = revealEnd(s.text, s.pos);
    if (target <= s.shown) {
      return;
    }
    const chunk = s.text.slice(s.shown, target);
    const edit = new vscode.WorkspaceEdit();
    edit.insert(s.doc.uri, s.doc.positionAt(s.end), chunk);
    this.selfEdit = true;
    try {
      await vscode.workspace.applyEdit(edit);
    } finally {
      this.selfEdit = false;
    }
    if (this.session === s) {
      s.shown = target;
      s.end += chunk.length;
    }
  }

  // ---------------------------------------------------------------------------
  // Teclado
  // ---------------------------------------------------------------------------

  /** El editor activo está en el punto de escritura. */
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

  private async onType(args: { text: string }): Promise<unknown> {
    const s = this.session;
    if (!s || !this.writingEditor()) {
      return vscode.commands.executeCommand('default:type', args);
    }
    await this.advance(typeKeys(s.text, s.mask, s.pos, args.text));
  }

  private async advance(result: { ok: boolean; pos: number; expected?: string }, helped = false): Promise<void> {
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
    await this.reveal();
    this.render(true);
    if (s.pos >= s.text.length) {
      await this.finish('escrito');
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

  private async tab(): Promise<unknown> {
    const s = this.session;
    if (!s || !this.writingEditor()) {
      return vscode.commands.executeCommand('tab');
    }
    // Tab no completa nada: cada palabra la escribes tú. La tecla queda tomada
    // para que no inserte una tabulación ni acepte sugerencias del editor.
    vscode.window.setStatusBarMessage('AutoCompleteHelp: Tab está desactivado; escribe tú cada palabra. Si te trabas, Esc › opciones.', 3500);
  }

  private async enter(): Promise<unknown> {
    if (!this.session || !this.writingEditor()) {
      return vscode.commands.executeCommand('default:type', { text: '\n' });
    }
    return this.onType({ text: '\n' });
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
      { title: `${s.options.reviewConcept ? 'Repaso' : 'Completamos juntos'}: ${s.instruction} — ${progressOf(s.mask, s.pos)}%` }
    );
    if (!pick || this.session !== s) {
      return;
    }
    if (pick.id === 'linea') {
      const end = Math.min(s.text.length, lineEnd(s.text, s.pos) + 1);
      await this.enqueue(() => this.advance({ ok: true, pos: skipAuto(s.mask, end) }, true));
    } else if (pick.id === 'completar') {
      await this.enqueue(async () => {
        s.pendingStart += s.text.length - s.pos;
        s.pos = s.text.length;
        await this.reveal();
        await this.finish('completado');
      });
    } else if (pick.id === 'borrar') {
      await this.enqueue(() => this.stopAndDelete());
    } else {
      this.render(true);
    }
  }

  // ---------------------------------------------------------------------------
  // Cambios en el documento
  // ---------------------------------------------------------------------------

  private onDocumentChange(e: vscode.TextDocumentChangeEvent): void {
    const s = this.session;
    if (!s) {
      this.watchInstruction(e);
      return;
    }
    if (e.document !== s.doc || this.selfEdit) {
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

  /**
   * «// ach: …» + Enter en cualquier archivo arranca una sesión con esa
   * instrucción. Una vez por instrucción: si la terminas o la borras, no se
   * vuelve a disparar sola.
   */
  private watchInstruction(e: vscode.TextDocumentChangeEvent): void {
    if (this.preparing || this.selfEdit || !e.contentChanges.some((c) => c.text.includes('\n'))) {
      return;
    }
    if (!vscode.workspace.getConfiguration('autocompletehelp').get<boolean>('enabled', true)) {
      return;
    }
    // El cursor se actualiza después del cambio: se mira en el próximo ciclo.
    setTimeout(() => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.document !== e.document || this.session || this.preparing) {
        return;
      }
      const position = editor.selection.active;
      const prefix = e.document.getText(new vscode.Range(new vscode.Position(0, 0), position)).slice(-MAX_PREFIX_CHARS);
      const instruction = detectInstruction(prefix);
      if (instruction && !this.started.has(keyOf(e.document, position, instruction))) {
        void this.start(editor, instruction);
      }
    }, 0);
  }

  // ---------------------------------------------------------------------------
  // Fin de la sesión
  // ---------------------------------------------------------------------------

  /**
   * Ajuste de línea: lo que no entra en el ancho de la pantalla sigue en la
   * línea de abajo, sin barra horizontal. Así se lee completo el comentario y
   * la línea en gris que vas escribiendo. Solo se cambia en este editor y se
   * devuelve como estaba al terminar.
   */
  private async wrapOn(editor: vscode.TextEditor, cfg: vscode.WorkspaceConfiguration): Promise<boolean> {
    if (!cfg.get<boolean>('dictation.wordWrap', true)) {
      return false;
    }
    if (vscode.workspace.getConfiguration('editor', editor.document).get<string>('wordWrap', 'off') !== 'off') {
      return false;
    }
    if (vscode.window.activeTextEditor !== editor) {
      await vscode.window.showTextDocument(editor.document, editor.viewColumn);
    }
    await vscode.commands.executeCommand('editor.action.toggleWordWrap');
    return true;
  }

  /** Cierra la sesión: devuelve el teclado, quita el gris de la vista. */
  private end(): Session | undefined {
    const s = this.session;
    if (!s) {
      return undefined;
    }
    this.session = undefined;
    s.typeReg.dispose();
    if (s.wrapped) {
      void this.wrapOff(s.doc);
    }
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

  /** Devuelve el ajuste de línea como estaba (toggleWordWrap actúa sobre el editor activo). */
  private async wrapOff(doc: vscode.TextDocument): Promise<void> {
    const editor = vscode.window.visibleTextEditors.find((e) => e.document === doc);
    if (!editor) {
      return;
    }
    if (vscode.window.activeTextEditor !== editor) {
      await vscode.window.showTextDocument(doc, editor.viewColumn);
    }
    await vscode.commands.executeCommand('editor.action.toggleWordWrap');
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
    await this.stripJsonComments(s.doc);
    if (vscode.workspace.getConfiguration('autocompletehelp').get<boolean>('fadingScaffolding', true)) {
      await recordAccepted(this.context, s.concepts, how === 'escrito' ? 'dictado' : 'aceptado');
    }
    this.afterFinish?.();
    const typed = s.mask.filter((auto) => !auto).length;
    const message =
      how === 'escrito'
        ? `✓ Lo escribiste tú: ${typed} caracteres, ${s.errors} ${s.errors === 1 ? 'error' : 'errores'}` +
          (s.helped ? `, ${s.helped} ${s.helped === 1 ? 'ayuda' : 'ayudas'}.` : '.')
        : 'Completado sin escribirlo. Repasa los comentarios: explican cada decisión.';
    const step = s.stepIndex !== undefined ? getProject()?.plan?.[s.stepIndex] : undefined;
    const VERIFY = step?.tipo === 'test' ? 'Correr los tests' : 'Comprobarlo';
    const actions = [...(step?.verificar ? [VERIFY] : []), ...(step ? ['Marcar el paso como hecho'] : [])];
    const action = await vscode.window.showInformationMessage(message, ...actions);
    if (action === VERIFY && step?.verificar) {
      writeCommand(
        { comando: step.verificar, explicacion: '' },
        'Si pasa, marca el paso como hecho en el plan; si falla, la bombita del error te ayuda a entender por qué.'
      );
    } else if (action && s.stepIndex !== undefined) {
      await markStep(this.context, s.stepIndex, true);
    }
  }

  /**
   * En JSON los comentarios se escriben (explican cada línea) pero el formato
   * no los admite: al terminar se quitan y se guarda el archivo limpio.
   */
  private async stripJsonComments(doc: vscode.TextDocument): Promise<void> {
    if (!stripsComments(doc.uri.path)) {
      return;
    }
    const before = doc.getText();
    const after = textForSave(doc.uri.path, before);
    if (after === before) {
      return;
    }
    const edit = new vscode.WorkspaceEdit();
    edit.replace(doc.uri, new vscode.Range(doc.positionAt(0), doc.positionAt(before.length)), after);
    await vscode.workspace.applyEdit(edit);
    await doc.save();
    vscode.window.showInformationMessage('JSON no admite comentarios: los que escribiste explican cada línea y se quitaron del archivo al terminar.');
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
    const edit = new vscode.WorkspaceEdit();
    edit.delete(s.doc.uri, range);
    await vscode.workspace.applyEdit(edit);
    vscode.window.showInformationMessage('Terminado: en el archivo quedó solo lo que escribiste.');
  }

  private abort(): void {
    if (!this.end()) {
      return;
    }
    vscode.window.showWarningMessage(
      'AutoCompleteHelp: la sesión se detuvo porque cambió el código en gris (al pegar, deshacer o editar ahí). Lo que quede de esa línea es ahora texto normal: revísalo o bórralo.'
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
    const pending = subtractRanges(s.pos, s.shown, s.gaps).map(toRange);
    const gaps = clipRanges(s.pos, s.shown, s.gaps).map(toRange);
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
          ? ' · hueco: recuérdalo (Esc › díctame la línea si no sale)'
          : ` · esperaba ${showChar(s.lastExpected)}`;
    const label = s.options.reviewConcept ? 'Repaso' : 'Completamos juntos';
    this.status.text = `$(pencil) ${label} ${pct}% · ${s.errors} ${s.errors === 1 ? 'error' : 'errores'}${hint}`;
    const explanation = explanationAt(s.text, s.pos, s.prefixes);
    const summary = summaryAt(s.text, s.pos, s.prefixes);
    this.status.tooltip = new vscode.MarkdownString(
      [
        `**${label}:** ${s.instruction}`,
        s.gaps.length ? `Huecos: ${s.gaps.length} palabras para escribir de memoria.` : '',
        summary ? `**↑ Lo que acabas de escribir:** ${summary}` : '',
        explanation ? `> ${explanation}` : '',
        'Escribe encima de la línea en gris; Enter muestra la siguiente. Tab no completa: escribes tú cada palabra. **Retroceso**: volver · **Esc** o clic aquí: opciones.'
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
