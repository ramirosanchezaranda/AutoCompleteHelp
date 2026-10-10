import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PlanStep, environmentSteps } from '@core/project';
import { findStepLine, stepFileContent, stepInstruction } from '@core/instructions';
import { detectInstruction } from '@core/context';
import { Ledger, applyReview, dueConcepts, knownIn, progressMarkdown, reviewAdvanced, reviewInstruction, reviewLanguage, withAccepted } from '@core/concepts';
import { buildErrorSystemPrompt } from '@core/errors';
import { formatProjectForPrompt, parseProjectFile, PROJECT_FILE } from '@core/project';
import { buildHintSystemPrompt, buildHintUserPrompt, hintsFor, solutionInstruction, starterFor } from '@core/exercises';
import { getLesson } from '@core/lessons';
import { useApp } from '../store/app';
import { useWidth } from '../lib/hooks';
import { MissingKeyError, hasAI, llm, NoAIError } from '../lib/ai';
import { db } from '../lib/db';
import { StoredProject, applyStructure, loadProject, markStep, pendingStructure, projectJson, saveProject, withFile } from '../lib/projects';
import { exportZip } from '../lib/zip';
import { fromAI, fromLesson, reviewFromLessons } from '../lib/dictate';
import { stripsComments, textForSave, uncommentedLines } from '@core/comments';
import { Session, back, completeRest, dictateLine, feed, isDone, lastSummary, startSession, typedCount, viewOf } from '../engine/session';
import { CodeEditor, CodeEditorHandle, DictationMarks, LineError } from './CodeEditor';
import { Terminal, TerminalHandle } from './Terminal';
import { Preview } from './Preview';
import { Markdown } from './Markdown';
import { Dialog } from './Dialog';
import type { TestSummary } from '../runtime/runner';

type Tab = 'plan' | 'code' | 'terminal' | 'guide' | 'preview';

interface Live {
  session: Session;
  before: string;
  after: string;
}

interface Finished {
  path: string;
  how: 'escrito' | 'completado';
  typed: number;
  errors: number;
  helped: number;
  summary: string;
  stepIndex?: number;
  review?: { advanced: boolean };
}

const KIND_LABEL: Record<string, string> = { teoria: 'teoría', codigo: 'código', test: 'test', config: 'configuración', docker: 'Docker', comando: 'comando' };
const SENTINEL = ' ';
const LEDGER = 'ledger';

/** Completar código: plan, editor «Completamos juntos», terminal, guía y vista previa. */
export function Workspace() {
  const { projectId, ai, openAIDialog, notify, go } = useApp();
  const width = useWidth();
  const cols = width > 1100 ? 3 : width >= 700 ? 2 : 1;
  const [p, setP] = useState<StoredProject>();
  const [path, setPath] = useState<string>();
  const [live, setLive] = useState<Live>();
  const [preparing, setPreparing] = useState<{ instruction: string; lines: number; abort: AbortController }>();
  const [finished, setFinished] = useState<Finished>();
  const [tab, setTab] = useState<Tab>('code');
  const [sideTab, setSideTab] = useState<'guide' | 'preview'>('guide');
  const [errorAt, setErrorAt] = useState<number>();
  const [menu, setMenu] = useState(false);
  const [dialog, setDialog] = useState<'structure' | 'env' | 'review' | 'progress' | 'explain'>();
  const [explanation, setExplanation] = useState('');
  const [ledger, setLedger] = useState<Ledger>({});
  const [previewVersion, setPreviewVersion] = useState(0);
  const [lineErrors, setLineErrors] = useState<Record<string, LineError[]>>({});
  const [shaderErrors, setShaderErrors] = useState<Record<string, LineError[]>>({});
  const [announce, setAnnounce] = useState('');
  /** Pistas que ya se mostraron, por archivo de ejercicio. */
  const [hints, setHints] = useState<Record<string, string[]>>({});
  const [hintBusy, setHintBusy] = useState(false);
  const ledgerRef = useRef<Ledger>({});
  const editor = useRef<CodeEditorHandle>(null);
  const term = useRef<TerminalHandle>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const liveRef = useRef<Live | undefined>(undefined);
  liveRef.current = live;
  const pRef = useRef<StoredProject | undefined>(undefined);
  pRef.current = p;
  const started = useRef(new Set<string>());
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!projectId) return;
    void loadProject(projectId).then((loaded) => {
      if (!loaded) {
        notify('Ese proyecto ya no está en este dispositivo.', 'warn');
        go('projects');
        return;
      }
      setP(loaded);
      const plan = projectJson(loaded)?.plan ?? [];
      const next = plan.find((s) => !s.hecho && s.archivo && s.archivo in loaded.files);
      setPath(next?.archivo ?? (loaded.files['docs/APRENDER.md'] !== undefined ? undefined : Object.keys(loaded.files)[0]));
      if (cols === 1) setTab('plan');
    });
    void db.get<Ledger>(LEDGER).then((l) => setLedger(l ?? {}));
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Cambia el proyecto y lo guarda (con un respiro mientras se escribe). */
  const update = useCallback((fn: (p: StoredProject) => StoredProject, immediate = false) => {
    setP((prev) => {
      if (!prev) return prev;
      const next = fn(prev);
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => void saveProject(next), immediate ? 0 : 700);
      return next;
    });
  }, []);
  useEffect(() => () => {
    clearTimeout(saveTimer.current);
    if (pRef.current) void saveProject(pRef.current);
  }, []);

  ledgerRef.current = ledger;
  const saveLedger = (l: Ledger) => {
    ledgerRef.current = l;
    setLedger(l);
    void db.set(LEDGER, l);
  };

  const project = useMemo(() => projectJson(p), [p]);
  const plan = project?.plan ?? [];
  const nextIdx = plan.findIndex((s) => !s.hecho);
  const files = p?.files ?? {};
  const show = (t: Tab) => {
    if (cols === 3 && (t === 'guide' || t === 'preview')) setSideTab(t);
    else if (cols === 3 && t === 'terminal') { /* siempre visible */ }
    else setTab(t);
  };

  // -------------------------------------------------------------------------
  // Sesión de dictado
  // -------------------------------------------------------------------------

  const docText = live ? live.before + live.session.text.slice(0, live.session.shown) + live.after : path !== undefined ? files[path] ?? '' : '';
  const cursor = live ? live.before.length + live.session.pos : undefined;
  const view = live ? viewOf(live.session) : undefined;

  const marks: DictationMarks | undefined = useMemo(() => {
    if (!live) return undefined;
    const s = live.session;
    const base = live.before.length;
    const pending: [number, number][] = [];
    let cur = s.pos;
    for (const [a, b] of s.gaps) {
      if (b <= cur || a >= s.shown) continue;
      if (a > cur) pending.push([base + cur, base + a]);
      cur = Math.max(cur, b);
    }
    if (cur < s.shown) pending.push([base + cur, base + s.shown]);
    const gaps = s.gaps.map(([a, b]) => [base + Math.max(a, s.pos), base + Math.min(b, s.shown)] as [number, number]).filter(([a, b]) => a < b);
    const expectsEnter = s.text[s.pos] === '\n';
    const inGapNow = view?.inGap;
    return {
      pending,
      gaps,
      next: !expectsEnter && !inGapNow && s.pos < s.text.length ? base + s.pos : undefined,
      enterAt: expectsEnter ? base + s.pos : undefined,
      error: errorAt !== undefined && Date.now() - errorAt < 700 ? base + s.pos : undefined
    };
  }, [live, errorAt]); // eslint-disable-line react-hooks/exhaustive-deps

  const persistTyped = (l: Live) => {
    // En el archivo queda solo lo que escribiste (nunca el gris).
    update((prev) => withFile(prev, l.session.path, textForSave(l.session.path, l.before + l.session.text.slice(0, l.session.pos) + l.after)));
  };

  const finish = (l: Live, how: 'escrito' | 'completado') => {
    const s = l.session;
    update((prev) => withFile(prev, s.path, textForSave(s.path, l.before + s.text + l.after)), true);
    setLive(undefined);
    liveRef.current = undefined;
    if (stripsComments(s.path) && /^\s*\/\//m.test(s.text)) notify('JSON no admite comentarios: los que escribiste explican cada línea y se quitaron del archivo al guardar.');
    let review: Finished['review'];
    if (s.reviewConcept) {
      const stat = ledger[s.reviewConcept];
      if (stat) {
        const after = applyReview(stat, how === 'escrito' ? { errors: s.errors, helped: s.helped, gaps: s.gaps.length } : { errors: Infinity, helped: Infinity, gaps: s.gaps.length });
        saveLedger({ ...ledger, [s.reviewConcept]: after });
        review = { advanced: reviewAdvanced(stat, after) };
      }
    } else {
      saveLedger(withAccepted(ledger, s.concepts, how === 'escrito' ? 'dictado' : 'aceptado'));
    }
    setFinished({ path: s.path, how, typed: typedCount(s), errors: s.errors, helped: s.helped, summary: lastSummary(s), stepIndex: s.stepIndex, review });
    setPreviewVersion((v) => v + 1);
    setAnnounce(how === 'escrito' ? `Terminado. ${s.errors} errores.` : 'Completado sin escribirlo.');
  };

  const focusInput = () => {
    const el = input.current;
    if (!el) return;
    const c = editor.current?.cursorCoords();
    if (c) {
      el.style.left = `${Math.max(0, c.left)}px`;
      el.style.top = `${Math.max(0, c.top)}px`;
    }
    if (!composing.current) {
      el.value = SENTINEL;
      fed.current = { text: '', ok: [] };
    }
    el.focus({ preventScroll: true });
    if (!composing.current) el.setSelectionRange(1, 1);
  };

  const apply = (fn: (s: Session) => Session) => {
    const l = liveRef.current;
    if (!l) return;
    const s = fn(l.session);
    const next = { ...l, session: s };
    if (s.errorAt && s.errorAt !== l.session.errorAt) setErrorAt(s.errorAt);
    if (isDone(s)) {
      finish(next, 'escrito');
      return;
    }
    setLive(next);
    liveRef.current = next;
    if (s.pos !== l.session.pos && s.text.slice(l.session.pos, s.pos).includes('\n')) persistTyped(next);
    const v = viewOf(s);
    setAnnounce(v.hint || (s.text[l.session.pos] === '\n' && s.pos !== l.session.pos ? `Línea siguiente: ${v.line.trim()}` : ''));
  };

  const typeChars = (chars: string) => {
    for (const ch of chars) apply((s) => feed(s, ch));
  };

  const begin = async (o: { path: string; content: string; insertAt: number; instruction: string; stepIndex?: number; reviewConcept?: string; gapRatio?: number; reviewText?: { text: string; concepts: string[] } }) => {
    if (liveRef.current || preparing) {
      notify('Ya estamos completando algo juntos. Termínalo o pulsa Esc para ver las opciones.', 'warn');
      return;
    }
    setFinished(undefined);
    setPath(o.path);
    show('code');
    let generated = o.reviewText ? { ...o.reviewText, fromLesson: true } : fromLesson(project, o.path);
    if (!generated) {
      if (!hasAI(ai)) {
        if (!ai.chosen) openAIDialog(() => void begin(o));
        else notify('Estás en modo sin IA y este paso no es de una lección escrita. Puedes escribirlo tú (el plan y la guía siguen), elegir una lección sin IA o activar una IA.', 'warn');
        return;
      }
      const abort = new AbortController();
      setPreparing({ instruction: o.instruction, lines: 0, abort });
      try {
        generated = await fromAI(ai, {
          project,
          files,
          path: o.path,
          content: o.content,
          insertAt: o.insertAt,
          instruction: o.instruction,
          known: knownIn(ledger),
          signal: abort.signal,
          onLines: (n) => setPreparing((pr) => (pr ? { ...pr, lines: n } : pr))
        });
      } catch (e: any) {
        setPreparing(undefined);
        if (e?.name === 'AbortError') return;
        if (e instanceof MissingKeyError) openAIDialog(() => void begin(o));
        else if (!(e instanceof NoAIError)) notify(`No se pudo preparar el código: ${e?.message ?? e}`, 'error');
        return;
      }
      setPreparing(undefined);
      if (!generated.text.trim()) {
        notify('La IA no devolvió código. Prueba de nuevo o reformula la instrucción.', 'warn');
        return;
      }
    }
    const before = o.content.slice(0, o.insertAt);
    const after = o.content.slice(o.insertAt);
    const session = startSession({
      path: o.path,
      instruction: o.instruction,
      text: generated.text,
      concepts: generated.concepts,
      insertAt: before.length,
      stepIndex: o.stepIndex,
      reviewConcept: o.reviewConcept,
      gapRatio: o.gapRatio
    });
    const l = { session, before, after };
    update((prev) => withFile(prev, o.path, o.content), true);
    if (isDone(session)) {
      finish(l, 'escrito');
      return;
    }
    setLive(l);
    liveRef.current = l;
    setTimeout(focusInput, 60);
  };

  /** Abrir un paso del plan (como en la extensión). */
  const openStep = (i: number) => {
    const step = plan[i];
    if (!step || !p) return;
    if (step.comando && !step.archivo) {
      show('terminal');
      setTimeout(() => term.current?.prefill(step.comando!, step.explicacion), 30);
      notify('El comando quedó escrito en la terminal, sin ejecutar: lánzalo tú con Enter.');
      return;
    }
    if (!step.archivo) {
      notify(`Este paso no indica archivo. Escribe «ach: ${stepInstruction(step)}» donde quieras construirlo.`, 'warn');
      return;
    }
    const file = step.archivo;
    const existing = p.files[file];
    // Ejercicio: el archivo nace con el enunciado y se resuelve escribiendo libre.
    if (step.tipo === 'ejercicio') {
      if (liveRef.current) {
        notify('Termina el dictado (o Esc › opciones) antes de abrir otro paso.', 'warn');
        return;
      }
      if (existing === undefined) update((prev) => withFile(prev, file, starterFor(project, step)), true);
      setFinished(undefined);
      setPath(file);
      show('code');
      return;
    }
    if (existing === undefined) {
      const content = stepFileContent(file, step);
      void begin({ path: file, content, insertAt: content.length, instruction: stepInstruction(step), stepIndex: i });
      return;
    }
    const found = findStepLine(existing, step);
    if (found && !found.hasCodeAfter) {
      // Sin empezar: debajo de la instrucción solo hay líneas en blanco.
      const content = existing.split('\n').slice(0, found.line + 1).join('\n') + '\n';
      void begin({ path: file, content, insertAt: content.length, instruction: stepInstruction(step), stepIndex: i });
      return;
    }
    if (!existing.trim() && file.endsWith('.json')) {
      void begin({ path: file, content: '', insertAt: 0, instruction: stepInstruction(step), stepIndex: i });
      return;
    }
    setPath(file);
    show('code');
    if (found) notify(`Paso ${i + 1}: ya tiene código debajo de su instrucción. Si lo terminaste, márcalo como hecho.`);
    else {
      // Archivo existente sin la instrucción: se agrega al final y se construye ahí.
      const sep = existing.endsWith('\n') || !existing ? '' : '\n';
      const ins = stepFileContent(file, step);
      if (!ins) {
        notify(`Paso ${i + 1}: ${file} ya existe. Edítalo a mano o márcalo como hecho.`, 'warn');
        return;
      }
      const content = existing + sep + (existing ? '\n' : '') + ins;
      void begin({ path: file, content, insertAt: content.length, instruction: stepInstruction(step), stepIndex: i });
    }
  };

  // Edición libre (sin sesión): «// ach: …» + Enter arranca una sesión con esa instrucción.
  const onEditorChange = (value: string, inserted: string, cur: number) => {
    if (liveRef.current || path === undefined) return;
    update((prev) => withFile(prev, path, value));
    setPreviewVersion((v) => v + 1);
    setLineErrors((e) => ({ ...e, [path]: [] }));
    setShaderErrors((e) => ({ ...e, [path]: [] }));
    if (!inserted.includes('\n')) return;
    const instruction = detectInstruction(value.slice(0, cur).slice(-6000));
    const key = `${path}#${instruction}`;
    if (instruction && !started.current.has(key)) {
      started.current.add(key);
      const lineStart = value.lastIndexOf('\n', cur - 1) + 1;
      const insertAt = value.slice(lineStart, cur).trim() === '' ? lineStart : cur;
      void begin({ path, content: value.slice(0, insertAt) + value.slice(cur), insertAt, instruction });
    }
  };

  // Teclado del dictado: un campo invisible recibe lo que se escribe (también en el celular).
  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!liveRef.current) return;
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault();
      syncField(e.currentTarget);
      typeChars('\n');
      resetField(e.currentTarget);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      notify('Tab no completa nada: cada palabra la escribes tú. Si te trabas, Esc › opciones.', 'warn');
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setMenu(true);
    } else if (e.key === 'Backspace' && e.currentTarget.value === SENTINEL) {
      e.preventDefault();
      apply(back);
      fed.current = { text: '', ok: [] };
    }
  };
  /**
   * Lo que hay en el campo invisible se compara con lo que ya se le pasó al
   * dictado (no se borra en cada tecla). Así los teclados del celular, que
   * escriben y corrigen palabras enteras mientras se compone (Gboard, iOS),
   * no duplican letras ni cuentan errores fantasma: si el teclado reemplaza
   * «hla» por «hola», solo se deshace lo que cambió y se escribe lo nuevo.
   */
  const fed = useRef<{ text: string; ok: boolean[] }>({ text: '', ok: [] });
  const composing = useRef(false);
  const resetField = (el: HTMLTextAreaElement) => {
    el.value = SENTINEL;
    el.setSelectionRange(1, 1);
    fed.current = { text: '', ok: [] };
  };
  const syncField = (el: HTMLTextAreaElement) => {
    if (!liveRef.current) return;
    if (!el.value.startsWith(SENTINEL)) {
      // Se borró el separador: con el campo vacío, retroceso es volver un carácter.
      apply(back);
      resetField(el);
      return;
    }
    const now = el.value.slice(SENTINEL.length).replace(/\r\n?/g, '\n');
    const { text: was, ok } = fed.current;
    let k = 0;
    while (k < was.length && k < now.length && was[k] === now[k]) k++;
    // Lo que el teclado quitó: se deshace solo lo que había avanzado.
    for (let i = was.length - 1; i >= k; i--) if (ok[i]) apply(back);
    const nextOk = ok.slice(0, k);
    for (const ch of now.slice(k)) {
      const before = liveRef.current?.session.pos;
      apply((x) => feed(x, ch));
      nextOk.push(liveRef.current !== undefined && liveRef.current.session.pos !== before);
    }
    fed.current = { text: now, ok: nextOk };
    // Sin composición en curso, después de un Enter o de mucho texto, se vacía el campo.
    if (!composing.current && (now.includes('\n') || now.length > 40)) resetField(el);
  };
  const onInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const native = e.nativeEvent as InputEvent;
    if (native.inputType === 'insertLineBreak' || native.inputType === 'insertParagraph') {
      // Algunos teclados mandan el Enter sin \n en el valor.
      if (!e.currentTarget.value.includes('\n')) {
        syncField(e.currentTarget);
        typeChars('\n');
        resetField(e.currentTarget);
        return;
      }
    }
    syncField(e.currentTarget);
  };
  const onCompositionStart = () => {
    composing.current = true;
  };
  const onCompositionEnd = (e: React.CompositionEvent<HTMLTextAreaElement>) => {
    composing.current = false;
    syncField(e.currentTarget);
  };
  useEffect(() => {
    if (live) {
      const c = editor.current?.cursorCoords();
      if (c && input.current) {
        input.current.style.left = `${Math.max(0, c.left)}px`;
        input.current.style.top = `${Math.max(0, c.top)}px`;
      }
    }
  }, [live]);
  useEffect(() => {
    if (errorAt === undefined) return;
    const t = setTimeout(() => setErrorAt(undefined), 700);
    return () => clearTimeout(t);
  }, [errorAt]);

  const menuAction = (a: 'seguir' | 'linea' | 'completar' | 'borrar') => {
    setMenu(false);
    const l = liveRef.current;
    if (!l) return;
    if (a === 'linea') apply(dictateLine);
    else if (a === 'completar') finish({ ...l, session: completeRest(l.session) }, 'completado');
    else if (a === 'borrar') {
      update((prev) => withFile(prev, l.session.path, l.before + l.session.text.slice(0, l.session.pos) + l.after), true);
      setLive(undefined);
      notify('Terminado: en el archivo quedó solo lo que escribiste.');
    }
    setTimeout(focusInput, 30);
  };

  // -------------------------------------------------------------------------
  // Tests, errores, estructura, entorno, repaso
  // -------------------------------------------------------------------------

  const onTests = (s: TestSummary) => {
    const errs: Record<string, LineError[]> = {};
    for (const r of s.results) if (!r.ok && r.line) (errs[r.file] ??= []).push({ line: r.line, message: r.error ?? 'falló' });
    for (const e of s.compileErrors) if (e.line) (errs[e.path] ??= []).push({ line: e.line, message: e.message });
    setLineErrors(errs);
    // Un ejercicio está resuelto cuando todos sus tests pasan: se marca solo.
    const current = pRef.current;
    const pj = current && parseProjectFile(current.files[PROJECT_FILE] ?? '');
    pj?.plan?.forEach((st, i) => {
      if (st.tipo !== 'ejercicio' || st.hecho || !st.verificar || !st.archivo) return;
      const filter = st.verificar.split(/\s+/).slice(3).filter((w) => !w.startsWith('-'));
      const mine = s.results.filter((r) => (filter.length ? filter.some((f) => r.file.includes(f)) : true));
      if (!mine.length || !mine.every((r) => r.ok)) return;
      // Verde no alcanza: cada línea de la solución lleva su comentario arriba.
      const missing = uncommentedLines(current!.files[st.archivo] ?? '', st.archivo, { strict: false });
      if (missing.length) {
        for (const line of missing) (errs[st.archivo] ??= []).push({ line, message: 'Falta el comentario de esta línea: arriba, en una línea, qué hace.' });
        setLineErrors({ ...errs });
        notify(`Los tests pasan, pero ${missing.length === 1 ? 'a 1 línea le falta' : `a ${missing.length} líneas les falta`} su comentario arriba (línea ${missing.slice(0, 3).join(', ')}${missing.length > 3 ? '…' : ''}). Escríbelo y vuelve a correr los tests.`, 'warn');
        return;
      }
      update((prev) => markStep(prev, i, true), true);
      const concepts = getLesson(pj.leccion)?.conceptos[st.archivo] ?? (st.concepto ? [st.concepto] : []);
      saveLedger(withAccepted(ledgerRef.current, concepts, 'dictado'));
      notify(`✓ Ejercicio resuelto: ${st.paso.replace(/^Ejercicio:\s*/, '')}. Lo escribiste tú.`);
    });
  };

  // -------------------------------------------------------------------------
  // Ejercicios: pistas y solución guiada
  // -------------------------------------------------------------------------

  const nextHint = async (step: PlanStep) => {
    const file = step.archivo!;
    const shown = hints[file] ?? [];
    const written = hintsFor(project, file);
    if (written.length) {
      if (shown.length >= written.length) {
        notify('No hay más pistas. Si sigues trabado, escribe la solución guiada: también se aprende escribiéndola.', 'warn');
        return;
      }
      setHints({ ...hints, [file]: [...shown, written[shown.length]] });
      return;
    }
    if (!hasAI(ai)) {
      notify('Este ejercicio no trae pistas escritas: con una IA, te da una pista sin la solución.', 'warn');
      openAIDialog();
      return;
    }
    const tests = Object.entries(files).filter(([f, t]) => /\.(test|spec)\.|(^|\/)test_/.test(f) && t.includes(file.split('/').pop()!.replace(/\.[^.]+$/, ''))).map(([, t]) => t).join('\n\n');
    setHintBusy(true);
    try {
      const hint = await llm(ai, buildHintSystemPrompt(), buildHintUserPrompt(step.explicacion ?? step.paso, files[file] ?? '', tests, shown), 400);
      setHints({ ...hints, [file]: [...shown, hint.trim()] });
    } catch (e: any) {
      notify(e instanceof MissingKeyError ? `${e.message} Escríbela en «Cambiar IA».` : `No llegó la pista: ${e?.message ?? e}`, 'error');
    } finally {
      setHintBusy(false);
    }
  };

  const guidedSolution = (i: number, step: PlanStep) => {
    const file = step.archivo!;
    const current = files[file] ?? '';
    const starter = starterFor(project, step);
    if (current.trim() !== starter.trim() && !confirm('La solución guiada reemplaza lo que escribiste en este archivo. ¿Seguir?')) return;
    // Lección: se dicta la solución escrita. IA: se dicta lo que piden el enunciado y los tests.
    void begin({ path: file, content: '', insertAt: 0, instruction: solutionInstruction(step), stepIndex: i });
  };

  const verify = (step: PlanStep) => {
    show('terminal');
    setTimeout(() => void term.current?.run(step.verificar!), 30);
  };

  const explainError = async (output: string) => {
    setDialog('explain');
    setExplanation('');
    try {
      const answer = await llm(ai, buildErrorSystemPrompt(formatProjectForPrompt(project)), `Salida de la terminal:\n${output}\n\nArchivos del proyecto: ${Object.keys(files).join(', ')}`, 1500, {
        onDelta: (_d, total) => setExplanation(total)
      });
      setExplanation(answer);
    } catch (e: any) {
      setExplanation(`No se pudo explicar: ${e?.message ?? e}`);
    }
  };

  const startReview = (conceptId: string) => {
    setDialog(undefined);
    const stat = ledger[conceptId];
    if (!stat) return;
    const fromL = reviewFromLessons(conceptId);
    const lang = reviewLanguage(JSON.stringify(project?.stack ?? {}));
    if (fromL) {
      const file = `repaso/${conceptId}${fromL.path.slice(fromL.path.lastIndexOf('.'))}`;
      void begin({ path: file, content: '', insertAt: 0, instruction: `repaso de «${stat.label}»`, reviewConcept: conceptId, gapRatio: 0.5, reviewText: { text: fromL.text, concepts: fromL.concepts } });
      return;
    }
    const ext = lang.languageId === 'python' ? 'py' : lang.languageId === 'typescript' ? 'ts' : 'js';
    const instruction = reviewInstruction(stat.label);
    const content = `${lang.comment} ach: ${instruction}\n`;
    void begin({ path: `repaso/${conceptId}.${ext}`, content, insertAt: content.length, instruction, reviewConcept: conceptId, gapRatio: 0.5 });
  };

  if (!p) {
    return <div className="empty">Cargando el proyecto…</div>;
  }

  const allErrors = path ? [...(lineErrors[path] ?? []), ...(shaderErrors[path] ?? [])] : [];
  const due = dueConcepts(ledger);
  const practiced = Object.entries(ledger).filter(([, s]) => s.practiced > 0);
  const finishedStep = finished?.stepIndex !== undefined ? plan[finished.stepIndex] : undefined;
  const exIdx = path ? plan.findIndex((st) => st.tipo === 'ejercicio' && st.archivo === path) : -1;
  const guide = files['docs/APRENDER.md'] ?? files['docs/STACK.md'] ?? '';

  // ------------------------------- Paneles -------------------------------

  const planPanel = (
    <>
      <div className="section-h">
        <span className="grow">{p.name}</span>
      </div>
      <div className="row" style={{ padding: '0 10px 8px', gap: 6 }}>
        <button className="btn small" onClick={() => setDialog('structure')}>Crear estructura</button>
        <button className="btn small" onClick={() => setDialog('env')}>Preparar el entorno</button>
        <button className="btn small" onClick={() => setDialog('review')}>Repaso{due.length ? ` (${due.length})` : ''}</button>
        <button className="btn small ghost" onClick={() => exportZip(p)}>Exportar .zip</button>
      </div>
      <div className="section-h">Plan · {plan.filter((s) => s.hecho).length} de {plan.length}</div>
      <ol className="plan">
        {plan.map((s, i) => (
          <li key={i} className={`${s.hecho ? 'done' : ''}${i === nextIdx ? ' current' : ''}${live?.session.stepIndex === i ? ' active' : ''}`}>
            <input type="checkbox" checked={!!s.hecho} aria-label={`Paso ${i + 1} hecho`} onChange={(e) => update((prev) => markStep(prev, i, e.target.checked), true)} />
            <button className="step" onClick={() => openStep(i)}>
              <span className="s">
                {i === nextIdx && <span className="arrow">➜ </span>}
                {i + 1}. {s.paso}
              </span>
              <span className="k">
                {KIND_LABEL[s.tipo ?? 'codigo'] ?? s.tipo}
                {s.archivo ? ` · ${s.archivo}` : s.comando ? ` · $ ${s.comando}` : ''}
              </span>
            </button>
          </li>
        ))}
      </ol>
      <div className="section-h">Archivos</div>
      <ul className="files">
        {Object.keys(files).sort().map((f) => (
          <li key={f}>
            <button aria-current={f === path} onClick={() => { if (!live) { setPath(f); show('code'); } else notify('Termina el dictado (o Esc › opciones) antes de cambiar de archivo.', 'warn'); }}>
              {f}
            </button>
          </li>
        ))}
      </ul>
    </>
  );

  const editorPanel = (
    <div className="editor-wrap">
      <div className="editor-head">
        <span className="path">{path ?? 'Elige un paso del plan'}</span>
        {live && <span>{view?.pct}%</span>}
      </div>
      {path === undefined ? (
        <div className="empty">
          <p>Abre un paso del plan: el archivo empieza con su instrucción y el código aparece en gris, una línea a la vez, con su explicación arriba.</p>
          {nextIdx >= 0 && (
            <button className="btn primary" onClick={() => openStep(nextIdx)}>
              Empezar el paso {nextIdx + 1}: {plan[nextIdx].paso}
            </button>
          )}
        </div>
      ) : (
        <div style={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex' }}>
          <CodeEditor
            ref={editor}
            path={path}
            value={docText}
            readOnly={!!live}
            marks={marks}
            cursor={cursor}
            lineErrors={allErrors}
            onChange={onEditorChange}
            onTap={() => live && focusInput()}
          />
          <textarea
            ref={input}
            className="typing-input"
            aria-label={live ? `Escribe la línea en gris. ${view?.explanation ?? ''}` : 'Teclado del dictado'}
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="enter"
            defaultValue={SENTINEL}
            onKeyDown={onKeyDown}
            onInput={onInput}
            onCompositionStart={onCompositionStart}
            onCompositionEnd={onCompositionEnd}
            tabIndex={live ? 0 : -1}
          />
          {preparing && (
            <div className="ach-preparing" role="status">
              <span className="spinner" />
              <span style={{ flex: 1 }}>Preparando «{preparing.instruction}»… {preparing.lines > 1 ? `${preparing.lines} líneas` : ''}</span>
              <button className="btn small ghost" onClick={() => preparing.abort.abort()}>Cancelar</button>
            </div>
          )}
        </div>
      )}
      <div className="sr-only" aria-live="assertive">{announce}</div>
      {live && view && (
        <div className="dbar">
          {view.summary && <div className="sum">↑ Lo que acabas de escribir: {view.summary}</div>}
          {view.explanation && (
            <div className="why">
              <b>Por qué:</b> {view.explanation}
            </div>
          )}
          <div className="controls">
            <div className="progress">
              <span className="meter" aria-hidden="true"><i style={{ width: `${view.pct}%` }} /></span>
              <span>{view.pct}% · {live.session.errors} {live.session.errors === 1 ? 'error' : 'errores'}</span>
              {view.hint && <span className="hint">{view.hint}</span>}
            </div>
            <button className="btn small" onClick={() => { apply(back); focusInput(); }} aria-label="Volver un carácter">⌫</button>
            <button className="btn small" onClick={() => { apply(dictateLine); focusInput(); }}>Díctame la línea</button>
            <button className="btn small" onClick={() => setMenu(true)}>Esc</button>
            {cols === 1 && <button className="btn small primary" onClick={focusInput}>Teclado</button>}
          </div>
        </div>
      )}
      {!live && finished && (
        <div className="dbar">
          <div className="finish">
            {finished.review ? (
              <span className="ok">
                {finished.review.advanced
                  ? `✓ Repaso superado (${finished.errors} errores, ${finished.helped} ayudas). El concepto vuelve más adelante.`
                  : `Este repaso costó (${finished.errors} errores, ${finished.helped} ayudas): vuelve mañana. Repetirlo pronto es lo que lo fija.`}
              </span>
            ) : finished.how === 'escrito' ? (
              <span className="ok">
                ✓ Lo escribiste tú: {finished.typed} caracteres, {finished.errors} {finished.errors === 1 ? 'error' : 'errores'}, {finished.helped} {finished.helped === 1 ? 'ayuda' : 'ayudas'}.
              </span>
            ) : (
              <span>Completado sin escribirlo. Repasa los comentarios: explican cada decisión.</span>
            )}
            {finished.summary && <span className="sum" style={{ color: 'var(--teal)' }}>↑ {finished.summary}</span>}
            <div className="row">
              {finishedStep?.verificar && (
                <button className="btn" onClick={() => verify(finishedStep)}>{finishedStep.tipo === 'test' || finishedStep.tipo === 'ejercicio' ? 'Correr los tests' : 'Comprobarlo'}</button>
              )}
              {finished.stepIndex !== undefined && !plan[finished.stepIndex]?.hecho && (
                <button
                  className="btn primary"
                  onClick={() => {
                    update((prev) => markStep(prev, finished.stepIndex!, true), true);
                    notify('Paso hecho.');
                  }}
                >
                  Marcar el paso como hecho
                </button>
              )}
              {finished.stepIndex !== undefined && plan[finished.stepIndex]?.hecho && nextIdx >= 0 && (
                <button className="btn primary" onClick={() => openStep(nextIdx)}>Siguiente paso: {plan[nextIdx].paso}</button>
              )}
              <button className="btn ghost" onClick={() => setFinished(undefined)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
      {!live && !finished && exIdx >= 0 && (
        <div className="dbar exercise">
          <div className="ex-head">
            <b>{plan[exIdx].hecho ? '✓ Resuelto' : 'Ejercicio'}:</b> {plan[exIdx].paso.replace(/^Ejercicio:\s*/, '')}. Escribe tu solución en el archivo y corre los tests: en verde, está resuelto.
          </div>
          {(hints[plan[exIdx].archivo!] ?? []).map((h, n) => (
            <div key={n} className="why">
              <b>Pista {n + 1}:</b> {h}
            </div>
          ))}
          <div className="controls">
            {plan[exIdx].verificar && (
              <button className="btn small primary" onClick={() => verify(plan[exIdx])}>Correr los tests</button>
            )}
            <button className="btn small" disabled={hintBusy} onClick={() => void nextHint(plan[exIdx])}>
              {hintBusy ? 'Pensando…' : (hints[plan[exIdx].archivo!] ?? []).length ? 'Otra pista' : 'Pista'}
            </button>
            <button className="btn small" onClick={() => guidedSolution(exIdx, plan[exIdx])}>Solución guiada</button>
            {plan[exIdx].hecho && nextIdx >= 0 && (
              <button className="btn small primary" onClick={() => openStep(nextIdx)}>Siguiente: {plan[nextIdx].paso}</button>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const terminal = (
    <Terminal
      ref={term}
      files={files}
      project={project}
      hasAI={hasAI(ai)}
      onPreview={() => show('preview')}
      onTests={onTests}
      onExplain={explainError}
      onExport={() => exportZip(p)}
    />
  );
  const guidePanel = (
    <div className="scroll guide">
      {guide ? <Markdown text={guide} /> : <p>Este proyecto no tiene guía.</p>}
      {files['docs/ARQUITECTURA.md'] && guide !== files['docs/ARQUITECTURA.md'] && (
        <details style={{ marginTop: 16 }}>
          <summary>Arquitectura (docs/ARQUITECTURA.md)</summary>
          <Markdown text={files['docs/ARQUITECTURA.md']} />
        </details>
      )}
      <button className="btn small" style={{ marginTop: 16 }} onClick={() => setDialog('progress')}>Ver mi progreso</button>
    </div>
  );
  const previewPanel = <Preview files={files} version={previewVersion} onShaderErrors={setShaderErrors} />;

  const tabsFor: Tab[] = cols === 1 ? ['plan', 'code', 'terminal', 'guide', 'preview'] : ['code', 'terminal', 'guide', 'preview'];
  const TAB_LABEL: Record<Tab, string> = { plan: 'Plan', code: 'Código', terminal: 'Terminal', guide: 'Guía', preview: 'Vista previa' };
  const activeTab = cols === 2 && tab === 'plan' ? 'code' : tab;
  const subtabs = (list: Tab[], current: Tab, set: (t: Tab) => void) => (
    <div className="subtabs" role="tablist">
      {list.map((t) => (
        <button key={t} role="tab" className="subtab" aria-selected={current === t} onClick={() => set(t)}>
          {TAB_LABEL[t]}
          {t === 'code' && live && cols === 1 && <span className="badge">{view?.pct}%</span>}
        </button>
      ))}
    </div>
  );
  const panelFor = (t: Tab) =>
    t === 'plan' ? <div className="scroll">{planPanel}</div> : t === 'code' ? editorPanel : t === 'terminal' ? terminal : t === 'guide' ? guidePanel : previewPanel;

  return (
    <>
      {cols === 3 ? (
        <div className="ws cols-3">
          <aside className="col">
            <div className="scroll">{planPanel}</div>
          </aside>
          <section className="col center">
            <div style={{ flex: 3, minHeight: 0, display: 'flex', flexDirection: 'column' }}>{editorPanel}</div>
            <div style={{ flex: 2, minHeight: 160, display: 'flex', flexDirection: 'column', borderTop: '1px solid var(--rule-strong)' }}>{terminal}</div>
          </section>
          <aside className="col">
            {subtabs(['guide', 'preview'], sideTab, (t) => setSideTab(t as 'guide' | 'preview'))}
            {sideTab === 'guide' ? guidePanel : previewPanel}
          </aside>
        </div>
      ) : (
        <div className={`ws cols-${cols}`}>
          {cols === 2 && (
            <aside className="col">
              <div className="scroll">{planPanel}</div>
            </aside>
          )}
          <section className="col center">
            {subtabs(tabsFor, activeTab, setTab)}
            {/* Los paneles quedan montados: la terminal y la vista previa no pierden su estado. */}
            {tabsFor.map((t) => (
              <div key={t} style={{ display: t === activeTab ? 'flex' : 'none', flex: 1, minHeight: 0, flexDirection: 'column' }}>
                {panelFor(t)}
              </div>
            ))}
          </section>
        </div>
      )}

      {menu && live && (
        <Dialog title={`Completamos juntos: ${live.session.instruction}`} crumbs={`${view?.pct}% escrito`} onClose={() => menuAction('seguir')}>
          <div className="choices">
            <button className="choice" onClick={() => menuAction('seguir')}><span className="t">Seguir escribiendo</span></button>
            <button className="choice" onClick={() => menuAction('linea')}><span className="t">Díctame la línea actual</span><span className="d">la completa por ti (cuenta como ayuda)</span></button>
            <button className="choice" onClick={() => menuAction('completar')}><span className="t">Completar el resto sin escribirlo</span><span className="d">el código queda, pero no cuenta como practicado</span></button>
            <button className="choice" onClick={() => menuAction('borrar')}><span className="t">Terminar y borrar lo que falta</span><span className="d">queda solo lo que escribiste</span></button>
          </div>
        </Dialog>
      )}

      {dialog === 'structure' && <StructureDialog p={p} onClose={() => setDialog(undefined)} onApply={(entries) => { update((prev) => applyStructure(prev, entries), true); notify(`${entries.length} ${entries.length === 1 ? 'archivo creado' : 'archivos creados'}.`); setDialog(undefined); }} />}
      {dialog === 'env' && (
        <Dialog title="Preparar el entorno" onClose={() => setDialog(undefined)} footer={<button className="btn" onClick={() => setDialog(undefined)}>Cerrar</button>}>
          <p className="help" style={{ margin: 0 }}>Cada comando se escribe en la terminal sin ejecutarse: lo lanzas tú. En el navegador corren los tests de JS/TS, los programas con tsx y la vista previa; lo demás, en tu computadora.</p>
          {(() => {
            const env = environmentSteps(project?.entorno);
            if (!env.length) return <div className="callout">Este proyecto no indica comandos de entorno.</div>;
            const groups = [...new Set(env.map((c) => c.grupo))];
            return groups.map((g) => (
              <div key={g} className="field">
                <label>{g}</label>
                {env.filter((c) => c.grupo === g).map((c) => (
                  <div key={c.comando} className="choice" style={{ cursor: 'default' }}>
                    <code style={{ fontFamily: 'var(--mono)', fontSize: 14 }}>$ {c.comando}</code>
                    {c.windows && <span className="d">Windows: {c.windows}</span>}
                    <span className="d">{c.explicacion}</span>
                    <span className="row" style={{ marginTop: 4 }}>
                      <button className="btn small" onClick={() => { setDialog(undefined); show('terminal'); setTimeout(() => term.current?.prefill(c.comando, c.explicacion), 30); }}>Escribirlo en la terminal</button>
                    </span>
                  </div>
                ))}
              </div>
            ));
          })()}
          {project?.entorno?.docker && <div className="callout info">Docker: {project.entorno.docker.porQue} Se corre en tu computadora: exporta el proyecto.</div>}
        </Dialog>
      )}
      {dialog === 'review' && (
        <Dialog title={due.length ? `Repaso espaciado: ${due.length} para hoy` : 'Repaso espaciado'} onClose={() => setDialog(undefined)} footer={<button className="btn" onClick={() => setDialog(undefined)}>Cerrar</button>}>
          {!practiced.length ? (
            <div className="callout info">Todavía no hay conceptos para repasar. Escribe algún paso y vuelve: lo que escribas entra al repaso (al día siguiente, a los 3, 7, 14 y 30 días).</div>
          ) : (
            <div className="choices">
              {[...due.map((d) => ({ id: d.id, label: d.stat.label, d: d.overdue ? `vencido hace ${d.overdue} ${d.overdue === 1 ? 'día' : 'días'}` : 'toca hoy' })),
                ...practiced.filter(([id]) => !due.some((d) => d.id === id)).map(([id, s]) => ({ id, label: s.label, d: 'repasar antes de tiempo' }))].map((c) => (
                <button key={c.id} className="choice" onClick={() => startReview(c.id)}>
                  <span className="t">{c.label}</span>
                  <span className="d">{c.d} · {reviewFromLessons(c.id) ? 'con huecos, sin IA' : 'ejercicio de la IA, con huecos'}</span>
                </button>
              ))}
            </div>
          )}
        </Dialog>
      )}
      {dialog === 'progress' && (
        <Dialog title="Tu progreso" onClose={() => setDialog(undefined)} footer={<button className="btn" onClick={() => setDialog(undefined)}>Cerrar</button>}>
          <Markdown text={progressMarkdown(ledger).replace(/^# Tu progreso\n+/, '')} />
        </Dialog>
      )}
      {dialog === 'explain' && (
        <Dialog title="Entender este error" onClose={() => setDialog(undefined)} footer={<button className="btn" onClick={() => setDialog(undefined)}>Cerrar</button>}>
          {explanation ? <Markdown text={explanation} /> : <div className="loading"><span className="spinner" /> Leyendo el error…</div>}
        </Dialog>
      )}
    </>
  );
}

function StructureDialog({ p, onClose, onApply }: { p: StoredProject; onClose: () => void; onApply: (e: ReturnType<typeof pendingStructure>) => void }) {
  const pending = pendingStructure(p);
  const [picked, setPicked] = useState(() => new Set(pending.map((e) => e.archivo)));
  return (
    <Dialog
      title="Crear estructura"
      onClose={onClose}
      footer={
        <>
          <button className="btn ghost" onClick={onClose}>Cancelar</button>
          <button className="btn primary" disabled={!picked.size} onClick={() => onApply(pending.filter((e) => picked.has(e.archivo)))}>
            Crear {picked.size} {picked.size === 1 ? 'archivo' : 'archivos'}
          </button>
        </>
      }
    >
      <p className="help" style={{ margin: 0 }}>Los archivos del plan nacen vacíos salvo su instrucción ach:. Los que ya existen no se tocan.</p>
      {!pending.length && <div className="callout info">La estructura ya está completa: no hay nada que crear.</div>}
      {pending.map((e) => (
        <label key={e.archivo} className="choice" style={{ gridTemplateColumns: 'auto 1fr', alignItems: 'start', columnGap: 10 }}>
          <input
            type="checkbox"
            checked={picked.has(e.archivo)}
            onChange={(ev) => {
              const n = new Set(picked);
              if (ev.target.checked) n.add(e.archivo);
              else n.delete(e.archivo);
              setPicked(n);
            }}
          />
          <span>
            <span className="t" style={{ fontFamily: 'var(--mono)', fontSize: 14 }}>{e.archivo}</span>
            <br />
            <span className="d">{e.motivo}</span>
          </span>
        </label>
      ))}
    </Dialog>
  );
}

