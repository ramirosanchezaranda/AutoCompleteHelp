/**
 * Motor del modo dictado, sin dependencias del IDE (se prueba aislado).
 *
 * El código que dicta la IA queda en el archivo en gris y el usuario lo
 * escribe encima. No todo se teclea: la indentación al empezar una línea, las
 * líneas en blanco y los comentarios (que son la explicación, se leen) avanzan
 * solos. Lo demás —incluido cada Enter— lo escribe la persona.
 */

/** Prefijos de comentario de línea completa, por lenguaje. */
export function commentPrefixes(languageId: string): string[] {
  if (
    [
      'python', 'ruby', 'shellscript', 'yaml', 'r', 'perl', 'toml', 'dockerfile',
      'makefile', 'elixir', 'powershell', 'coffeescript', 'julia', 'nim'
    ].includes(languageId)
  ) {
    return ['#'];
  }
  if (['sql', 'lua', 'haskell', 'ada'].includes(languageId)) {
    return ['--'];
  }
  if (['html', 'xml', 'vue-html', 'svg'].includes(languageId)) {
    return ['<!--'];
  }
  // Apuntes de teoría: las citas (>) son la explicación que se lee; lo demás se escribe.
  if (languageId === 'markdown') {
    return ['>', '<!--'];
  }
  if (['css', 'scss', 'less'].includes(languageId)) {
    return ['/*', '*'];
  }
  // JS/TS y familia C: // y los bloques /** … */ línea a línea.
  return ['//', '/*', '*'];
}

function isCommentLine(line: string, prefixes: string[]): boolean {
  const t = line.trim();
  return t !== '' && prefixes.some((p) => t.startsWith(p));
}

/**
 * Para cada carácter del texto dictado: true si avanza solo (no se teclea).
 * Se calcula una vez por dictado.
 */
export function autoMask(text: string, prefixes: string[], typeComments = false): boolean[] {
  const mask = new Array<boolean>(text.length).fill(false);
  let start = 0;
  while (start <= text.length) {
    const nl = text.indexOf('\n', start);
    const end = nl < 0 ? text.length : nl; // fin de línea (sin el \n)
    const line = text.slice(start, end);
    const whole = line.trim() === '' || (!typeComments && isCommentLine(line, prefixes));
    // Línea en blanco o comentario: avanza entera, con su salto de línea.
    // Línea de código: solo avanza su indentación.
    const autoUntil = whole ? (nl < 0 ? end : end + 1) : start + (line.length - line.trimStart().length);
    for (let i = start; i < autoUntil; i++) {
      mask[i] = true;
    }
    if (nl < 0) {
      break;
    }
    start = nl + 1;
  }
  return mask;
}

/** Salta lo que avanza solo desde `pos`. */
export function skipAuto(mask: boolean[], pos: number): number {
  while (pos < mask.length && mask[pos]) {
    pos++;
  }
  return pos;
}

export type KeyResult =
  | { ok: true; pos: number }
  | { ok: false; pos: number; expected: string };

/**
 * Procesa lo tecleado (normalmente un carácter; Enter llega como "\n").
 * Se detiene en el primer error: el cursor no avanza sobre lo que no escribiste.
 */
export function typeKeys(text: string, mask: boolean[], pos: number, typed: string): KeyResult {
  pos = skipAuto(mask, pos);
  for (const ch of typed.replace(/\r\n?/g, '\n')) {
    if (pos >= text.length) {
      break;
    }
    if (ch !== text[pos] && base(ch) !== base(text[pos])) {
      return { ok: false, pos, expected: text[pos] };
    }
    pos = skipAuto(mask, pos + 1);
  }
  return { ok: true, pos };
}

/**
 * Las tildes no son la lección: «a» vale por «á». Además, con teclas muertas
 * algunos sistemas componen el acento fuera del comando de tipeo.
 */
function base(ch: string): string {
  return ch.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/** Retroceso: vuelve al último carácter que tecleaste (no a la indentación). */
export function backPos(mask: boolean[], pos: number): number {
  let p = pos - 1;
  while (p >= 0 && mask[p]) {
    p--;
  }
  return p < 0 ? pos : p;
}

/**
 * Ayuda con Tab: completa la palabra (o símbolo) actual y el espacio que la
 * sigue, sin cruzar el fin de línea. Es la pista mínima para destrabarse.
 */
export function nextWordEnd(text: string, mask: boolean[], pos: number): number {
  pos = skipAuto(mask, pos);
  if (pos >= text.length || text[pos] === '\n') {
    return pos;
  }
  const isWord = (c: string) => /[\w$áéíóúñÁÉÍÓÚÑ]/.test(c);
  const kind = isWord(text[pos]);
  let p = pos;
  while (p < text.length && text[p] !== '\n' && text[p] !== ' ' && isWord(text[p]) === kind) {
    p++;
  }
  while (p < text.length && text[p] === ' ') {
    p++;
  }
  return p;
}

/** Fin de la línea actual (posición del \n), para «díctame esta línea». */
export function lineEnd(text: string, pos: number): number {
  const nl = text.indexOf('\n', pos);
  return nl < 0 ? text.length : nl;
}

/**
 * Hasta dónde se muestra el código: la línea que estás escribiendo, con los
 * comentarios que la explican arriba, y nada más. La siguiente aparece cuando
 * terminas esta. Al final se muestra todo (los comentarios que cierran).
 */
export function revealEnd(text: string, pos: number): number {
  return pos >= text.length ? text.length : lineEnd(text, pos);
}

/** Porcentaje escrito, contando solo lo que se teclea. */
export function progressOf(mask: boolean[], pos: number): number {
  let total = 0;
  let done = 0;
  for (let i = 0; i < mask.length; i++) {
    if (!mask[i]) {
      total++;
      if (i < pos) {
        done++;
      }
    }
  }
  return total ? Math.round((done / total) * 100) : 100;
}

/**
 * La explicación que corresponde a lo que estás escribiendo: el bloque de
 * comentarios inmediatamente anterior a la línea actual (o al bloque de código
 * en el que está). Es lo que se «dicta» en la barra de estado.
 */
export function explanationAt(text: string, pos: number, prefixes: string[]): string {
  const lines = text.split('\n');
  let idx = text.slice(0, pos).split('\n').length - 1;
  // Subir por el bloque de código actual hasta su comentario.
  while (idx > 0 && !isCommentLine(lines[idx - 1], prefixes) && lines[idx - 1].trim() !== '') {
    idx--;
  }
  const out: string[] = [];
  for (let i = idx - 1; i >= 0 && isCommentLine(lines[i], prefixes); i--) {
    out.unshift(stripComment(lines[i], prefixes));
  }
  return out.filter(Boolean).join(' ');
}

function stripComment(line: string, prefixes: string[]): string {
  let t = line.trim();
  for (const p of [...prefixes].sort((a, b) => b.length - a.length)) {
    if (t.startsWith(p)) {
      t = t.slice(p.length);
      break;
    }
  }
  return t.replace(/(\*\/|-->)\s*$/, '').trim();
}

// ---------------------------------------------------------------------------
// Huecos: palabras que no se dictan y se escriben de memoria.
// ---------------------------------------------------------------------------

export type Range2 = [number, number];

/**
 * Elige qué palabras del código quedan como hueco. Solo identificadores y
 * palabras clave de 3+ letras en líneas de código (nunca en comentarios), sin
 * tocar la primera palabra: así siempre se sabe por dónde empezar. Es
 * determinista con la misma semilla, para que regenerar la vista no cambie
 * los huecos.
 */
export function chooseGaps(text: string, mask: boolean[], ratio: number, seed = 1): Range2[] {
  if (ratio <= 0) {
    return [];
  }
  const words: Range2[] = [];
  const re = /[A-Za-z_$][\w$]*/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const start = m.index;
    const end = start + m[0].length;
    if (m[0].length >= 3 && !mask[start]) {
      words.push([start, end]);
    }
  }
  const candidates = words.slice(1);
  const count = Math.round(candidates.length * Math.min(ratio, 0.9));
  // Mulberry32: un PRNG mínimo con semilla.
  let a = seed >>> 0;
  const rand = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const picked = candidates
    .map((w) => ({ w, r: rand() }))
    .sort((x, y) => x.r - y.r)
    .slice(0, count)
    .map((x) => x.w);
  return picked.sort((x, y) => x[0] - y[0]);
}

/** ¿La posición cae dentro de un hueco? */
export function inGap(gaps: Range2[], pos: number): boolean {
  return gaps.some(([s, e]) => pos >= s && pos < e);
}

/** Tramos de [start, end) que no son hueco (lo que se ve en gris). */
export function subtractRanges(start: number, end: number, gaps: Range2[]): Range2[] {
  const out: Range2[] = [];
  let cur = start;
  for (const [s, e] of gaps) {
    if (e <= cur || s >= end) {
      continue;
    }
    if (s > cur) {
      out.push([cur, s]);
    }
    cur = Math.max(cur, e);
  }
  if (cur < end) {
    out.push([cur, end]);
  }
  return out;
}

/** Huecos (o su parte) que siguen pendientes desde `start`. */
export function clipRanges(start: number, end: number, gaps: Range2[]): Range2[] {
  return gaps
    .map(([s, e]) => [Math.max(s, start), Math.min(e, end)] as Range2)
    .filter(([s, e]) => s < e);
}
