/** Contexto del archivo y de las instrucciones ach: (puro, compartido con la web app). */

export const MAX_FILE_CHARS = 2500;

/** Rutas de import locales del archivo (ignora paquetes de npm/pip). */
export function parseLocalImports(text: string, languageId: string): string[] {
  const found = new Set<string>();
  if (languageId === 'python') {
    for (const m of text.matchAll(/^\s*from\s+([.\w]+)\s+import\b/gm)) {
      found.add(m[1]);
    }
    for (const m of text.matchAll(/^\s*import\s+([\w.]+)/gm)) {
      found.add(m[1]);
    }
    return [...found];
  }
  const patterns = [
    /require\(\s*['"](\.{1,2}\/[^'"]+)['"]\s*\)/g,
    /\bfrom\s+['"](\.{1,2}\/[^'"]+)['"]/g,
    /\bimport\s+['"](\.{1,2}\/[^'"]+)['"]/g,
    /\bimport\(\s*['"](\.{1,2}\/[^'"]+)['"]\s*\)/g
  ];
  for (const re of patterns) {
    for (const m of text.matchAll(re)) {
      found.add(m[1]);
    }
  }
  return [...found];
}

/**
 * Un archivo chico va completo (así se ven los campos de un esquema, que es
 * justo lo que la IA necesita para no inventarlos). Uno grande se resume a
 * sus declaraciones de nivel superior.
 */
export function summarizeFile(text: string, languageId: string): string {
  if (text.length <= MAX_FILE_CHARS) {
    return text.trimEnd();
  }
  const lines = text.split('\n');
  const keep =
    languageId === 'python'
      ? /^(async\s+def |def |class |[A-Z_][A-Z0-9_]*\s*=)/
      : /^\s*(export\b|module\.exports|exports\.\w+\s*=|(async\s+)?function\b|class\b|const\s+\w+\s*=\s*(new\s+)?[\w.]*Schema\b)/;
  const signatures = lines.filter((l) => keep.test(l)).map((l) => l.trimEnd());
  const summary = signatures.length ? signatures.join('\n') : lines.slice(0, 40).join('\n');
  return `${summary.slice(0, MAX_FILE_CHARS)}\n(… archivo resumido a sus declaraciones)`;
}

/** Comentario que abre una instrucción en línea, por lenguaje. */
export function commentSyntax(languageId: string): { open: string; close: string } {
  if (
    [
      'python', 'ruby', 'shellscript', 'yaml', 'r', 'perl', 'toml', 'dockerfile',
      'makefile', 'elixir', 'powershell', 'coffeescript', 'julia', 'nim'
    ].includes(languageId)
  ) {
    return { open: '#', close: '' };
  }
  if (['sql', 'lua', 'haskell', 'ada'].includes(languageId)) {
    return { open: '--', close: '' };
  }
  if (['html', 'xml', 'markdown', 'vue-html', 'svg'].includes(languageId)) {
    return { open: '<!--', close: ' -->' };
  }
  if (['css', 'scss', 'less'].includes(languageId)) {
    return { open: '/*', close: ' */' };
  }
  return { open: '//', close: '' };
}

const INSTRUCTION_LINE =
  /^\s*(?:\/\/|#|--|\/\*|<!--)\s*ach:\s*(.+?)\s*(?:\*\/|-->)?\s*$/i;

/**
 * Detecta una instrucción `ach:` justo encima del cursor: la última línea no
 * vacía del texto previo, con solo espacios entre ella y el cursor.
 * Es el gesto más directo de "prompt → código" dentro del editor.
 *
 * Exige que el cursor esté en una línea nueva (el usuario pulsó Enter): si
 * sigue escribiendo la instrucción, no se dispara con un pedido a medias.
 */
export function detectInstruction(prefix: string): string | undefined {
  const lines = prefix.split('\n');
  if (lines.length < 2 || lines[lines.length - 1].trim() !== '') {
    return undefined;
  }
  for (let i = lines.length - 2; i >= 0 && i >= lines.length - 3; i--) {
    const line = lines[i];
    if (!line.trim()) {
      continue;
    }
    const m = line.match(INSTRUCTION_LINE);
    return m ? m[1].trim() : undefined;
  }
  return undefined;
}
