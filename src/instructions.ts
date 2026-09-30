import * as vscode from 'vscode';
import { commentSyntax } from './projectContext';
import type { PlanStep } from './projectFile';

/**
 * Inserta una instrucción `ach:` como comentario en la línea actual, con la
 * sintaxis del lenguaje, y dispara la sugerencia. Sin `preset`, la pide.
 */
export async function insertInstruction(preset?: string): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }
  const text =
    preset ??
    (await vscode.window.showInputBox({
      title: 'AutoCompleteHelp — ¿Qué quieres construir aquí?',
      prompt:
        'Ej: "ruta para listar productos con paginación". Se inserta como comentario ach: y la sugerencia sigue tu nivel de aprendizaje.',
      ignoreFocusOut: true
    }));
  if (!text?.trim()) {
    return;
  }
  const { open, close } = commentSyntax(editor.document.languageId);
  const line = editor.document.lineAt(editor.selection.active.line);
  const indent = line.text.match(/^\s*/)?.[0] ?? '';
  const comment = `${indent}${open} ach: ${text.trim()}${close}\n${indent}`;
  await editor.edit((edit) => {
    if (line.isEmptyOrWhitespace) {
      edit.replace(line.range, comment);
    } else {
      edit.insert(line.range.end, `\n${comment}`);
    }
  });
  // Cursor en la línea en blanco debajo de la instrucción: ahí se detecta.
  const cursorLine = line.lineNumber + (line.isEmptyOrWhitespace ? 1 : 2);
  const cursor = new vscode.Position(cursorLine, indent.length);
  editor.selection = new vscode.Selection(cursor, cursor);
  await vscode.commands.executeCommand('editor.action.inlineSuggest.trigger');
}

// ---------------------------------------------------------------------------
// Funciones puras (sin vscode): se prueban aisladas.
// ---------------------------------------------------------------------------

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
  md: 'markdown', vue: 'vue', svelte: 'svelte', lua: 'lua'
};

/** Identificador de lenguaje del IDE a partir de la extensión del archivo. */
export function languageForPath(path: string): string | undefined {
  const ext = path.split('/').pop()?.split('.').pop()?.toLowerCase();
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
