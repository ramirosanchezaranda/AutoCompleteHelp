/**
 * Sesión de «Completamos juntos» en la web. La lógica de tipeo es la del
 * núcleo compartido (src/core/typing.ts, la misma de la extensión); aquí solo
 * se guarda el estado de una sesión y se derivan los textos de la barra.
 * Puro: sin DOM ni CodeMirror, se prueba aislado.
 */
import {
  Range2,
  autoMask,
  backPos,
  chooseGaps,
  commentPrefixes,
  explanationAt,
  inGap,
  lineEnd,
  progressOf,
  revealEnd,
  skipAuto,
  summaryAt,
  typeKeys
} from '@core/typing';
import { languageForPath } from '@core/instructions';

export interface Session {
  path: string;
  instruction: string;
  stepIndex?: number;
  /** Código dictado completo. */
  text: string;
  mask: boolean[];
  prefixes: string[];
  /** Hasta dónde escribiste (índice en text). */
  pos: number;
  /** Hasta dónde el código ya está en el documento. */
  shown: number;
  /** Offset en el documento donde empieza el bloque dictado. */
  insertAt: number;
  errors: number;
  helped: number;
  /** Errores seguidos en el mismo carácter. */
  misses: number;
  lastExpected?: string;
  /** Instante del último error (para pintarlo en rojo un momento). */
  errorAt?: number;
  concepts: string[];
  gaps: Range2[];
  /** Repaso espaciado: id del concepto. */
  reviewConcept?: string;
  startedAt: number;
}

export interface StartOptions {
  path: string;
  instruction: string;
  text: string;
  concepts: string[];
  insertAt: number;
  stepIndex?: number;
  reviewConcept?: string;
  gapRatio?: number;
  typeComments?: boolean;
}

export function languageOf(path: string): string {
  return languageForPath(path) ?? (path.endsWith('.json') ? 'json' : 'plaintext');
}

export function startSession(o: StartOptions): Session {
  const prefixes = commentPrefixes(languageOf(o.path));
  const text = o.text.replace(/\r\n?/g, '\n');
  const mask = autoMask(text, prefixes, o.typeComments ?? true);
  const pos = skipAuto(mask, 0);
  return {
    path: o.path,
    instruction: o.instruction,
    stepIndex: o.stepIndex,
    text,
    mask,
    prefixes,
    pos,
    shown: revealEnd(text, pos),
    insertAt: o.insertAt,
    errors: 0,
    helped: 0,
    misses: 0,
    concepts: o.concepts,
    gaps: chooseGaps(text, mask, o.gapRatio ?? 0, o.insertAt + 1),
    reviewConcept: o.reviewConcept,
    startedAt: Date.now()
  };
}

function settle(s: Session, pos: number): Session {
  return { ...s, pos, shown: Math.max(s.shown, revealEnd(s.text, pos)) };
}

/** Lo tecleado (un carácter, o "\n" para Enter). Un error no avanza. */
export function feed(s: Session, typed: string, now = Date.now()): Session {
  const r = typeKeys(s.text, s.mask, s.pos, typed);
  if (r.ok) {
    return { ...settle(s, r.pos), misses: 0, lastExpected: undefined };
  }
  return { ...settle(s, r.pos), errors: s.errors + 1, misses: s.misses + 1, lastExpected: r.expected, errorAt: now };
}

/** Retroceso: vuelve al último carácter que tecleaste. */
export function back(s: Session): Session {
  return { ...s, pos: backPos(s.mask, s.pos), misses: 0, lastExpected: undefined };
}

/** «Díctame la línea»: la completa (cuenta como ayuda). */
export function dictateLine(s: Session): Session {
  const end = Math.min(s.text.length, lineEnd(s.text, s.pos) + 1);
  return { ...settle(s, skipAuto(s.mask, end)), helped: s.helped + 1, misses: 0, lastExpected: undefined };
}

/** «Completar el resto»: el código queda, pero no cuenta como practicado. */
export function completeRest(s: Session): Session {
  return { ...s, pos: s.text.length, shown: s.text.length };
}

export function isDone(s: Session): boolean {
  return s.pos >= s.text.length;
}

/** Caracteres que se teclean (sin comentarios, líneas en blanco ni indentación). */
export function typedCount(s: Session): number {
  return s.mask.filter((auto) => !auto).length;
}

export function showChar(ch: string): string {
  if (ch === '\n') return 'Enter';
  if (ch === ' ') return 'un espacio';
  if (ch === '\t') return 'una tabulación';
  return `«${ch}»`;
}

export interface SessionView {
  pct: number;
  /** «Por qué»: los comentarios que explican lo que estás escribiendo. */
  explanation: string;
  /** ↑ del bloque que acabas de cerrar. */
  summary: string;
  /** Aviso del último error, si lo hay. */
  hint: string;
  /** Próximo carácter esperado (para lectores de pantalla). */
  next: string;
  /** La línea en curso, completa (para lectores de pantalla). */
  line: string;
  inGap: boolean;
}

export function viewOf(s: Session): SessionView {
  const gap = inGap(s.gaps, s.pos);
  const hint =
    s.lastExpected === undefined
      ? ''
      : gap
        ? 'hueco: recuérdalo (Esc › díctame la línea si no sale)'
        : `esperaba ${showChar(s.lastExpected)}`;
  const start = s.text.lastIndexOf('\n', s.pos - 1) + 1;
  return {
    pct: progressOf(s.mask, s.pos),
    explanation: explanationAt(s.text, s.pos, s.prefixes),
    summary: summaryAt(s.text, s.pos, s.prefixes),
    hint,
    next: s.pos < s.text.length ? (gap ? 'una palabra de memoria' : showChar(s.text[s.pos])) : '',
    line: s.text.slice(start, lineEnd(s.text, s.pos)),
    inGap: gap
  };
}

/** El ↑ del último bloque del archivo (para el mensaje final). */
export function lastSummary(s: Session): string {
  // Una línea vacía al final: así el ↑ de la última línea queda «arriba» del cursor.
  return summaryAt(s.text + '\n', s.text.length + 1, s.prefixes);
}
