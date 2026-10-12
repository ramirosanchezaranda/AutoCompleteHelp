/**
 * Ejercicios: un archivo con el enunciado que resuelve la persona, escribiendo.
 * Los tests (otro paso, escrito antes) dicen si está bien. Si se traba, las
 * pistas salen de los comentarios de la solución de referencia, y la solución
 * se puede escribir guiada, línea por línea, como cualquier otro paso.
 * Puro: lo comparten la extensión y la web app.
 */
import { commentSyntax } from './context';
import { languageForPath } from './instructions';
import { getLesson } from './lessons';
import type { PlanStep, ProjectFile } from './project';
import { commentPrefixes, isSummaryLine, SUMMARY_MARK } from './typing';

function isComment(line: string, prefixes: string[]): boolean {
  const t = line.trim();
  return t !== '' && prefixes.some((p) => t.startsWith(p));
}

function strip(line: string, prefixes: string[]): string {
  let t = line.trim();
  for (const p of [...prefixes].sort((a, b) => b.length - a.length)) {
    if (t.startsWith(p)) {
      t = t.slice(p.length);
      break;
    }
  }
  return t.replace(/(\*\/|-->)\s*$/, '').trim();
}

const FN_JS = /^(\s*)export\s+(async\s+)?function\s+[\w$]+\s*\(.*\)\s*\{\s*$/;
const FN_PY = /^(\s*)def\s+\w+\s*\(.*\)\s*(->\s*[^:]+)?:\s*$/;

/** La regla de los ejercicios: cada línea de código lleva su comentario arriba. */
export const COMMENT_RULE = 'Regla: arriba de cada línea de código, un comentario que diga qué hace.';

/**
 * El archivo con el que empieza un ejercicio, armado desde la solución: el
 * enunciado (los comentarios del principio), la regla de los comentarios y
 * cada función exportada vacía, con su comentario de arriba y el de cierre.
 * Las funciones vacías devuelven undefined (o None): los tests dan rojo.
 */
export function exerciseStarter(solution: string, path: string): string {
  const lang = languageForPath(path) ?? 'javascript';
  const prefixes = commentPrefixes(lang);
  const { open } = commentSyntax(lang);
  const lines = solution.split('\n');
  const out: string[] = [];
  let i = 0;
  for (; i < lines.length && isComment(lines[i], prefixes); i++) {
    out.push(lines[i]);
  }
  if (!out.some((l) => l.includes('Regla:'))) {
    out.push(`${open} ${COMMENT_RULE}`);
  }
  out.push('');
  const rest = lines.slice(i);
  rest.forEach((line, k) => {
    const js = line.match(FN_JS);
    const py = js ? null : line.match(FN_PY);
    if (!js && !py) {
      return;
    }
    // El comentario de arriba de la firma (el «Declara …»), sin pistas.
    const above: string[] = [];
    for (let j = k - 1; j >= 0 && isComment(rest[j], prefixes) && !isSummaryLine(rest[j], prefixes); j--) {
      above.unshift(rest[j]);
    }
    const start = above.findIndex((l) => /^Pista:/.test(strip(l, prefixes)));
    out.push(...(start >= 0 ? above.slice(0, start) : above));
    const name = line.match(/(?:function|def)\s+([\w$]+)/)?.[1] ?? '';
    if (js) {
      out.push(line, `${js[1]}  ${open} Tu código va acá: una línea de comentario y abajo su línea de código.`, `${js[1]}${open} Cierra la función ${name}.`, `${js[1]}}`, '');
    } else if (py) {
      out.push(line, `${py[1]}    ${open} Tu código va acá: una línea de comentario y abajo su línea de código.`, `${py[1]}    pass`, '');
    }
  });
  return out.join('\n').replace(/\n+$/, '\n');
}

/**
 * Pistas de un ejercicio, en orden: cada bloque de comentarios de la solución
 * que empieza con «Pista:».
 */
export function exerciseHints(solution: string, path: string): string[] {
  const prefixes = commentPrefixes(languageForPath(path) ?? 'javascript');
  const hints: string[] = [];
  let block: string[] | null = null;
  for (const line of solution.split('\n')) {
    const comment = isComment(line, prefixes) && !isSummaryLine(line, prefixes);
    const text = comment ? strip(line, prefixes) : '';
    if (comment && /^Pista:/.test(text)) {
      if (block) {
        hints.push(block.join(' '));
      }
      block = [text.replace(/^Pista:\s*/, '')];
    } else if (comment && block) {
      block.push(text);
    } else if (block) {
      hints.push(block.join(' '));
      block = null;
    }
  }
  if (block) {
    hints.push(block.join(' '));
  }
  return hints.filter((h) => h && !h.startsWith(SUMMARY_MARK));
}

/** Corta un texto en líneas de hasta `width` caracteres. */
export function wrapText(text: string, width = 76): string[] {
  const out: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (line && line.length + 1 + word.length > width) {
      out.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) {
    out.push(line);
  }
  return out;
}

/**
 * Enunciado de un ejercicio diseñado por la IA (no hay solución escrita): el
 * paso y su explicación como comentarios. Sin «ach:»: el archivo es para
 * escribir libre, no para dictar.
 */
export function aiExerciseStarter(step: PlanStep, path: string): string {
  const lang = languageForPath(path) ?? 'javascript';
  const { open, close } = commentSyntax(lang);
  const c = (t: string) => `${open} ${t}${close}`;
  return [
    c(`Ejercicio: ${step.paso.replace(/^Ejercicio:\s*/i, '')}`),
    ...wrapText(step.explicacion ?? '').map(c),
    c('Escribe tu solución aquí abajo. Los tests dicen qué tiene que hacer.'),
    c(COMMENT_RULE),
    ''
  ].join('\n');
}

/** El archivo con el que empieza el ejercicio de un paso. */
export function starterFor(project: ProjectFile | undefined, step: PlanStep): string {
  const path = step.archivo ?? '';
  const lesson = getLesson(project?.leccion);
  const given = lesson?.enunciados?.[path];
  if (given) {
    return given.join('\n') + '\n';
  }
  // «Arreglá esto» de la IA: el código con errores viene en el plan.
  if (step.tipo === 'arreglar' && step.codigo) {
    return step.codigo;
  }
  const solution = lesson?.archivos[path];
  if (solution) {
    return exerciseStarter(solution.join('\n'), path);
  }
  return aiExerciseStarter(step, path);
}

/** Pistas de la solución escrita, si el ejercicio es de una lección. */
export function hintsFor(project: ProjectFile | undefined, path: string): string[] {
  const solution = getLesson(project?.leccion)?.archivos[path];
  return solution ? exerciseHints(solution.join('\n'), path) : [];
}

/**
 * El comando de tests en «modo vigía»: queda mirando y vuelve a correr al
 * guardar. Vitest lo hace sin «run»; si el comando no tiene modo vigía, nada.
 */
export function watchCommand(verificar: string): string | undefined {
  const v = verificar.trim();
  if (/^npx vitest run\b/.test(v)) return v.replace(/^npx vitest run\b/, 'npx vitest');
  if (/^npx vitest\b/.test(v)) return v;
  if (/^npm (run )?test$/.test(v)) return 'npx vitest';
  return undefined;
}

/** Filtros de archivo de un comando de tests («npx vitest run ejercicios/01» → ["ejercicios/01"]). */
export function testFilter(verificar: string): string[] {
  return verificar
    .trim()
    .split(/\s+/)
    .filter((w, i, all) => !w.startsWith('-') && !(i < 3 && ['npx', 'vitest', 'run', 'npm', 'test'].includes(w)) && all[0] === 'npx');
}

/** Instrucción para escribir la solución guiada (dictada por la IA). */
export function solutionInstruction(step: PlanStep): string {
  return `solución del ejercicio «${step.paso}»: ${step.explicacion ?? ''}`.trim();
}

/** Prompt para pedirle a la IA UNA pista, sin la solución. */
export function buildHintSystemPrompt(): string {
  return [
    'Eres un mentor de programación. El alumno está resolviendo un ejercicio y pidió una pista.',
    'Responde en español, con UNA pista corta (2 o 3 frases) que lo acerque al siguiente paso.',
    'NO escribas la solución ni código que la resuelva. Puedes nombrar una función, un operador o la idea que le falta.',
    'Si su código tiene un error concreto, señala dónde mirar sin corregirlo.'
  ].join('\n');
}

export function buildHintUserPrompt(enunciado: string, code: string, tests: string, hintsGiven: string[]): string {
  return [
    `Enunciado: ${enunciado}`,
    '<TESTS>',
    tests.slice(0, 4000),
    '</TESTS>',
    '<SU CÓDIGO>',
    code.slice(0, 4000),
    '</SU CÓDIGO>',
    hintsGiven.length ? `Pistas que ya recibió (no las repitas): ${hintsGiven.join(' | ')}` : ''
  ]
    .filter(Boolean)
    .join('\n');
}
