/**
 * El editor: CodeMirror 6 sobre una hoja rayada. El motor (src/core/typing)
 * decide qué se muestra; CodeMirror solo pinta: el gris pendiente, el
 * carácter siguiente, el error, los huecos y las líneas con error de un test
 * o de un shader. Ajuste de línea siempre activo: nunca hay scroll horizontal.
 */
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { Annotation, Compartment, EditorState, Extension, RangeSetBuilder, StateEffect, StateField, Transaction } from '@codemirror/state';
import {
  Decoration,
  DecorationSet,
  EditorView,
  MatchDecorator,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
  drawSelection,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { HighlightStyle, bracketMatching, indentOnInput, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
import { javascript } from '@codemirror/lang-javascript';
import { markdown } from '@codemirror/lang-markdown';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { python } from '@codemirror/lang-python';
import { json } from '@codemirror/lang-json';
import type { Range2 } from '@core/typing';

export interface DictationMarks {
  /** Tramos en gris (offsets del documento). */
  pending: Range2[];
  gaps: Range2[];
  /** Carácter siguiente (offset) o undefined. */
  next?: number;
  /** Se espera Enter en ese offset. */
  enterAt?: number;
  /** Error: el carácter en rojo. */
  error?: number;
}

export interface LineError {
  line: number;
  message: string;
}

export interface CodeEditorHandle {
  view: () => EditorView | undefined;
  cursorCoords: () => { left: number; top: number; height: number } | undefined;
  focus: () => void;
}

interface Props {
  path: string;
  value: string;
  readOnly: boolean;
  marks?: DictationMarks;
  cursor?: number;
  lineErrors?: LineError[];
  onChange: (value: string, inserted: string, cursor: number) => void;
  onTap?: () => void;
}

const external = Annotation.define<boolean>();
const setMarks = StateEffect.define<DecorationSet>();
const setErrors = StateEffect.define<DecorationSet>();

const marksField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(deco, tr) {
    for (const e of tr.effects) if (e.is(setMarks)) return e.value;
    return deco.map(tr.changes);
  },
  provide: (f) => EditorView.decorations.from(f)
});

const errorsField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(deco, tr) {
    for (const e of tr.effects) if (e.is(setErrors)) return e.value;
    return deco.map(tr.changes);
  },
  provide: (f) => EditorView.decorations.from(f)
});

class EnterWidget extends WidgetType {
  toDOM() {
    const s = document.createElement('span');
    s.className = 'ach-enter';
    s.textContent = '⏎';
    s.setAttribute('aria-hidden', 'true');
    return s;
  }
}

class ErrorWidget extends WidgetType {
  constructor(readonly message: string) {
    super();
  }
  eq(o: ErrorWidget) {
    return o.message === this.message;
  }
  toDOM() {
    const s = document.createElement('span');
    s.className = 'ach-errwidget';
    s.textContent = `✗ ${this.message}`;
    return s;
  }
}

/** Instrucciones ach: en ámbar; resúmenes ↑ en verde agua. */
const achLines = new MatchDecorator({
  regexp: /^[ \t]*(?:\/\/|#|--|\/\*|<!--|>)[ \t]*(ach:|↑).*$/gm,
  decoration: (m) => Decoration.mark({ class: m[1] === 'ach:' ? 'ach-instruction' : 'ach-summary' })
});
const achPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = achLines.createDeco(view);
    }
    update(u: ViewUpdate) {
      this.decorations = achLines.updateDeco(u, this.decorations);
    }
  },
  { decorations: (v) => v.decorations }
);

const highlight = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.moduleKeyword, t.operatorKeyword], color: 'var(--hl-keyword, #7a3eb1)' },
  { tag: [t.string, t.special(t.string), t.regexp], color: 'var(--hl-string, #2a7a2a)' },
  { tag: [t.number, t.bool, t.null, t.atom], color: 'var(--hl-number, #b4521b)' },
  { tag: [t.comment, t.lineComment, t.blockComment], color: 'var(--ink-2)', fontStyle: 'italic' },
  { tag: [t.typeName, t.className, t.namespace], color: 'var(--hl-type, #1f6fb2)' },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], color: 'var(--hl-fn, #8a5a00)' },
  { tag: [t.heading], fontWeight: '700', color: 'var(--ink)' },
  { tag: [t.quote], color: 'var(--ink-2)' },
  { tag: [t.tagName], color: 'var(--hl-keyword, #7a3eb1)' },
  { tag: [t.attributeName, t.propertyName], color: 'var(--ink)' }
]);

export function languageExtension(path: string): Extension {
  const p = path.toLowerCase();
  if (/\.(ts|mts|cts)$/.test(p)) return javascript({ typescript: true });
  if (/\.tsx$/.test(p)) return javascript({ typescript: true, jsx: true });
  if (/\.jsx$/.test(p)) return javascript({ jsx: true });
  if (/\.(js|mjs|cjs)$/.test(p)) return javascript();
  if (/\.md$/.test(p)) return markdown();
  if (/\.html?$/.test(p)) return html();
  if (/\.(css|scss)$/.test(p)) return css();
  if (/\.py$/.test(p)) return python();
  if (/\.json$/.test(p)) return json();
  // GLSL y WGSL: la sintaxis de C se parece lo suficiente para colorear.
  if (/\.(frag|vert|glsl|wgsl)$/.test(p)) return javascript();
  return [];
}

function marksDeco(m: DictationMarks | undefined, len: number): DecorationSet {
  if (!m) return Decoration.none;
  const items: { from: number; to: number; deco: Decoration }[] = [];
  const clamp = (x: number) => Math.max(0, Math.min(len, x));
  for (const [a, b] of m.pending) if (clamp(b) > clamp(a)) items.push({ from: clamp(a), to: clamp(b), deco: Decoration.mark({ class: 'ach-pending' }) });
  for (const [a, b] of m.gaps) if (clamp(b) > clamp(a)) items.push({ from: clamp(a), to: clamp(b), deco: Decoration.mark({ class: 'ach-gap' }) });
  if (m.next !== undefined && m.next < len) items.push({ from: m.next, to: m.next + 1, deco: Decoration.mark({ class: 'ach-next' }) });
  if (m.error !== undefined && m.error < len) items.push({ from: m.error, to: m.error + 1, deco: Decoration.mark({ class: 'ach-error' }) });
  if (m.enterAt !== undefined) items.push({ from: clamp(m.enterAt), to: clamp(m.enterAt), deco: Decoration.widget({ widget: new EnterWidget(), side: 1 }) });
  items.sort((x, y) => x.from - y.from || x.to - y.to);
  const b = new RangeSetBuilder<Decoration>();
  for (const it of items) b.add(it.from, it.to, it.deco);
  return b.finish();
}

function errorsDeco(state: EditorState, errors: LineError[] | undefined): DecorationSet {
  if (!errors?.length) return Decoration.none;
  const b = new RangeSetBuilder<Decoration>();
  const sorted = [...errors].filter((e) => e.line >= 1 && e.line <= state.doc.lines).sort((x, y) => x.line - y.line);
  for (const e of sorted) {
    const line = state.doc.line(e.line);
    b.add(line.from, line.from, Decoration.line({ class: 'ach-errline' }));
    b.add(line.to, line.to, Decoration.widget({ widget: new ErrorWidget(e.message), side: 1, block: false }));
  }
  return b.finish();
}

export const CodeEditor = forwardRef<CodeEditorHandle, Props>(function CodeEditor(props, ref) {
  const host = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | undefined>(undefined);
  const lang = useRef(new Compartment());
  const ro = useRef(new Compartment());
  const onChange = useRef(props.onChange);
  onChange.current = props.onChange;

  useImperativeHandle(ref, () => ({
    view: () => viewRef.current,
    focus: () => viewRef.current?.focus(),
    cursorCoords: () => {
      const v = viewRef.current;
      const h = host.current;
      if (!v || !h) return undefined;
      const c = v.coordsAtPos(v.state.selection.main.head);
      if (!c) return undefined;
      const r = h.getBoundingClientRect();
      return { left: c.left - r.left, top: c.top - r.top, height: c.bottom - c.top };
    }
  }));

  const makeState = (doc: string, path: string, readOnly: boolean) =>
    EditorState.create({
      doc,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightActiveLine(),
        history(),
        drawSelection(),
        indentOnInput(),
        bracketMatching(),
        syntaxHighlighting(highlight),
        EditorView.lineWrapping,
        EditorState.tabSize.of(2),
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
        lang.current.of(languageExtension(path)),
        ro.current.of([EditorState.readOnly.of(readOnly), EditorView.editable.of(!readOnly)]),
        marksField,
        errorsField,
        achPlugin,
        EditorView.contentAttributes.of({ autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false', 'aria-label': 'Editor de código' }),
        EditorView.updateListener.of((u) => {
          if (!u.docChanged || u.transactions.some((tr) => tr.annotation(external))) return;
          let inserted = '';
          u.changes.iterChanges((_a, _b, _c, _d, text) => (inserted += text.toString()));
          onChange.current(u.state.doc.toString(), inserted, u.state.selection.main.head);
        })
      ]
    });
  const lastPath = useRef(props.path);

  useEffect(() => {
    const view = new EditorView({ parent: host.current!, state: makeState(props.value, props.path, props.readOnly) });
    viewRef.current = view;
    return () => view.destroy();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    viewRef.current?.dispatch({ effects: ro.current.reconfigure([EditorState.readOnly.of(props.readOnly), EditorView.editable.of(!props.readOnly)]) });
  }, [props.readOnly]);

  // Valor controlado: solo se aplica la diferencia (rápido al teclear).
  useEffect(() => {
    const v = viewRef.current;
    if (!v) return;
    // Otro archivo: estado nuevo (sin deshacer hacia el archivo anterior).
    if (lastPath.current !== props.path) {
      lastPath.current = props.path;
      v.setState(makeState(props.value, props.path, props.readOnly));
    }
    const cur = v.state.doc.toString();
    const next = props.value;
    const changes: { from: number; to: number; insert: string }[] = [];
    if (cur !== next) {
      let a = 0;
      while (a < cur.length && a < next.length && cur[a] === next[a]) a++;
      let b = 0;
      while (b < cur.length - a && b < next.length - a && cur[cur.length - 1 - b] === next[next.length - 1 - b]) b++;
      changes.push({ from: a, to: cur.length - b, insert: next.slice(a, next.length - b) });
    }
    const cursor = props.cursor !== undefined ? Math.min(props.cursor, next.length) : undefined;
    v.dispatch({
      changes,
      annotations: [external.of(true), Transaction.addToHistory.of(false)],
      selection: cursor !== undefined ? { anchor: cursor } : undefined,
      effects: [
        setMarks.of(Decoration.none),
        ...(cursor !== undefined ? [EditorView.scrollIntoView(cursor, { y: 'nearest', yMargin: 80 })] : [])
      ]
    });
    v.dispatch({ effects: [setMarks.of(marksDeco(props.marks, next.length)), setErrors.of(errorsDeco(v.state, props.lineErrors))] });
  }, [props.value, props.cursor, props.marks, props.lineErrors, props.path]);

  return <div className="editor-host" ref={host} onPointerUp={() => props.onTap?.()} />;
});
