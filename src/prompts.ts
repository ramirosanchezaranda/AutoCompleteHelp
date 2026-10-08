import * as vscode from 'vscode';
import {
  PROJECT_FILE,
  formatProjectForPrompt,
  getProject,
  openProjectFile,
  saveProject
} from './projectFile';
export * from './core/prompts';

/** El prompt del proyecto (texto libre). Vive en autocompletehelp.json. */
export function getProjectPrompt(_context?: vscode.ExtensionContext): string {
  return getProject()?.prompt ?? '';
}

/** Proyecto completo formateado para los prompts: objetivo, stack, convenciones, plan. */
export function getProjectBlock(): string {
  return formatProjectForPrompt(getProject());
}

export async function saveProjectPrompt(
  context: vscode.ExtensionContext,
  value: string
): Promise<void> {
  await saveProject(context, { prompt: value });
}

export async function setProjectPrompt(context: vscode.ExtensionContext, preset?: string): Promise<void> {
  // Escrito en «Empezar»: se guarda y se sigue directo a elegir el stack.
  if (typeof preset === 'string' && preset.trim()) {
    await saveProject(context, { prompt: preset.trim() });
    await vscode.commands.executeCommand('autocompletehelp.recommendStack');
    return;
  }
  const value = await vscode.window.showInputBox({
    title: 'Prompt del proyecto',
    prompt:
      'Qué construyes + cómo quieres que te explique. Ej: "e-commerce completa, explica cada código que agregues y por qué elegiste esa metodología".',
    placeHolder: 'e-commerce completa, explica cada código que agregues y por qué elegiste esa metodología',
    value: getProjectPrompt(),
    ignoreFocusOut: true
  });
  if (value === undefined) {
    return;
  }
  const inFile = await saveProject(context, { prompt: value });
  if (!inFile) {
    vscode.window.showInformationMessage(
      'AutoCompleteHelp: prompt guardado. Abre una carpeta para guardarlo en autocompletehelp.json y versionarlo con tu código.'
    );
    return;
  }
  const action = await vscode.window.showInformationMessage(
    `AutoCompleteHelp: prompt guardado en ${PROJECT_FILE}.`,
    'Abrir archivo',
    'Elegir stack'
  );
  if (action === 'Abrir archivo') {
    await openProjectFile();
  } else if (action === 'Elegir stack') {
    await vscode.commands.executeCommand('autocompletehelp.recommendStack');
  }
}
