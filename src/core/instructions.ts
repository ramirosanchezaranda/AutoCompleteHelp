import { commentSyntax } from './context';
import type { PlanStep } from './project';

/** Instrucciones ach: de los pasos del plan (puro, compartido con la web app). */

/** Texto de la instrucción `ach:` que construye un paso del plan. */
export function stepInstruction(step: PlanStep): string {
  return step.concepto ? `${step.paso} (enseña: ${step.concepto})` : step.paso;
}

const EXT_LANG: Record<string, string> = {
  js: 'javascript', mjs: 'javascript', cjs: 'javascript', jsx: 'javascriptreact',
  ts: 'typescript', tsx: 'typescriptreact', py: 'python', rb: 'ruby', go: 'go',
  rs: 'rust', java: 'java', kt: 'kotlin', cs: 'csharp', php: 'php', swift: 'swift',
  c: 'c', h: 'c', cpp: 'cpp', html: 'html', htm: 'html', css: 'css', scss: 'scss',
  sql: 'sql', sh: 'shellscript', yml: 'yaml', yaml: 'yaml', toml: 'toml',
  md: 'markdown', vue: 'vue', svelte: 'svelte', lua: 'lua', tf: 'terraform', bicep: 'bicep',
  dart: 'dart', hcl: 'terraform', ps1: 'powershell',
  glsl: 'glsl', frag: 'glsl', vert: 'glsl', wgsl: 'wgsl'
};

/** Identificador de lenguaje del IDE a partir de la extensión del archivo. */
export function languageForPath(path: string): string | undefined {
  const name = path.split('/').pop() ?? '';
  // Archivos sin extensión que se reconocen por el nombre.
  if (/^dockerfile(\..+)?$/i.test(name) || /\.dockerfile$/i.test(name)) {
    return 'dockerfile';
  }
  if (/^makefile$/i.test(name)) {
    return 'makefile';
  }
  if (/^\.env(\..+)?$/i.test(name)) {
    return 'shellscript';
  }
  const ext = name.includes('.') ? name.split('.').pop()?.toLowerCase() : undefined;
  return ext ? EXT_LANG[ext] : undefined;
}

/**
 * Busca en un archivo la instrucción `ach:` de un paso. Distingue si el paso
 * está sin empezar (la instrucción es lo último del archivo) o si ya tiene
 * código debajo. Así, abrir un paso cuyo archivo creó «Crear estructura» no
 * vuelve a insertar la misma instrucción.
 */
export function findStepLine(
  text: string,
  step: PlanStep
): { line: number; hasCodeAfter: boolean } | undefined {
  const target = `ach: ${stepInstruction(step)}`;
  const lines = text.split('\n');
  const line = lines.findIndex((l) => l.includes(target));
  if (line < 0) {
    return undefined;
  }
  const hasCodeAfter = lines.slice(line + 1).some((l) => l.trim() !== '');
  return { line, hasCodeAfter };
}

/**
 * Contenido inicial del archivo de un paso: vacío salvo la instrucción del
 * paso, con una línea en blanco debajo donde se dispara la sugerencia. El
 * código lo escribes tú con la ayuda del autocompletado, no aparece de golpe.
 * Devuelve '' para formatos sin comentarios (JSON).
 */
export function stepFileContent(path: string, step: PlanStep): string {
  const lang = languageForPath(path);
  if (!lang || path.endsWith('.json')) {
    return '';
  }
  const { open, close } = commentSyntax(lang);
  return `${open} ach: ${stepInstruction(step)}${close}\n`;
}
