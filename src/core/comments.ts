/**
 * La regla de AutoCompleteHelp: CADA línea de código tiene justo encima su
 * propio comentario, que dice qué hace esa línea (aunque sea repetitivo), y
 * ese comentario también se escribe. Este módulo lo verifica y prepara los
 * archivos que no admiten comentarios (JSON) para guardarlos.
 * Puro: lo comparten la extensión y la web app.
 */
import { languageForPath } from './instructions';
import { commentPrefixes, isSummaryLine } from './typing';

function isComment(line: string, prefixes: string[]): boolean {
  const t = line.trim();
  return t !== '' && prefixes.some((p) => t.startsWith(p));
}

/** Lenguaje de un archivo (JSON incluido, que languageForPath no conoce). */
export function languageOfPath(path: string): string {
  return languageForPath(path) ?? (/\.json$/i.test(path) ? 'json' : 'plaintext');
}

const CLOSER = /^[\]\)\}]+[;,)]*$/;

/**
 * Líneas (desde 1) que no tienen su comentario justo encima. Un resumen «↑»
 * no cuenta como comentario de la línea siguiente: explica el bloque de arriba.
 * Con `strict: false` se perdonan las líneas que solo cierran (}, });, ]).
 *
 * En los apuntes (.md): cada línea que se escribe fuera de un bloque de código
 * va debajo de una explicación (>), y cada línea de código dentro de un bloque
 * va debajo de su comentario en el lenguaje del bloque. Las líneas ``` son
 * sintaxis de Markdown y no se cuentan.
 */
export function uncommentedLines(text: string, path: string, opts: { strict?: boolean } = {}): number[] {
  const strict = opts.strict ?? true;
  const lang = languageOfPath(path);
  const lines = text.split('\n');
  const missing: number[] = [];
  if (lang === 'markdown') {
    let fence: string | undefined;
    lines.forEach((line, i) => {
      const t = line.trim();
      if (t.startsWith('```')) {
        fence = fence === undefined ? t.slice(3).trim() || 'text' : undefined;
        return;
      }
      if (!t) return;
      const prev = lines[i - 1] ?? '';
      if (fence !== undefined) {
        const prefixes = commentPrefixes(languageForPath(`x.${fence}`) ?? fence);
        if (isComment(line, prefixes)) return;
        if (!isComment(prev, prefixes) && !(strict === false && CLOSER.test(t))) missing.push(i + 1);
        return;
      }
      if (t.startsWith('>') || t.startsWith('<!--')) return;
      if (!prev.trim().startsWith('>')) missing.push(i + 1);
    });
    return missing;
  }
  const prefixes = commentPrefixes(lang);
  lines.forEach((line, i) => {
    const t = line.trim();
    if (!t || isComment(line, prefixes)) return;
    // La declaración del documento HTML va antes de cualquier comentario.
    if (lang === 'html' && /^<!doctype/i.test(t)) return;
    if (!strict && CLOSER.test(t)) return;
    const prev = lines[i - 1] ?? '';
    if (!isComment(prev, prefixes) || isSummaryLine(prev, prefixes)) missing.push(i + 1);
  });
  return missing;
}

/**
 * Lo que se guarda en el archivo. JSON no admite comentarios: se escriben
 * para entender cada línea y se quitan al guardar. tsconfig y jsconfig sí los
 * admiten (JSONC) y quedan.
 */
export function textForSave(path: string, text: string): string {
  const name = path.split('/').pop() ?? '';
  if (!/\.json$/i.test(name) || /^(tsconfig|jsconfig)(\..*)?\.json$/i.test(name) || path.includes('.vscode/')) {
    return text;
  }
  return text
    .split('\n')
    .filter((l) => !/^\s*\/\//.test(l))
    .join('\n');
}

/** ¿Se quitan los comentarios de este archivo al guardarlo? */
export function stripsComments(path: string): boolean {
  return textForSave(path, '// x\n') !== '// x\n';
}
