import * as vscode from 'vscode';
import { commentSyntax } from './projectContext';
import { buildHere } from './dictation';
export * from './core/instructions';

/**
 * Inserta una instrucción `ach:` como comentario en la línea actual, con la
 * sintaxis del lenguaje, y la construye (dictado o sugerencia, según el modo).
 * Sin `preset`, la pide.
 */
export async function insertInstruction(preset?: string, stepIndex?: number): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }
  const text =
    preset ??
    (await vscode.window.showInputBox({
      title: 'AutoCompleteHelp — ¿Qué quieres construir aquí?',
      prompt:
        'Ej: "ruta para listar productos con paginación". Se inserta como comentario ach: y completamos juntos el código, línea por línea.',
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
  await buildHere(editor, text.trim(), stepIndex);
}

