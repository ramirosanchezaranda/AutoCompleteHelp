import * as vscode from 'vscode';
import { PROJECT_FILE, ProjectFile, parseProjectFile } from './core/project';
export * from './core/project';


/**
 * autocompletehelp.json — la fuente de verdad del proyecto, versionada con el
 * código: el prompt, el stack con versiones, las convenciones y el plan.
 * Antes el prompt vivía en el estado interno del IDE: invisible, sin versiones
 * y perdido al abrir el proyecto en otra máquina.
 */

/** Clave antigua (v0.1–0.2): el prompt guardado en workspaceState. */
const LEGACY_PROMPT_KEY = 'autocompletehelp.projectPrompt';


let cached: ProjectFile | undefined;
let legacyPrompt = '';

// Perezoso: fuera del IDE (pruebas unitarias) no existe vscode.EventEmitter.
let changed: vscode.EventEmitter<void> | undefined;
const emitter = () => (changed ??= new vscode.EventEmitter<void>());

/** Se dispara cuando el proyecto cambia: guardado por la extensión o editado a mano. */
export const onDidChangeProject: vscode.Event<void> = (listener, thisArgs, disposables) =>
  emitter().event(listener, thisArgs, disposables);

function projectUri(): vscode.Uri | undefined {
  const folder = vscode.workspace.workspaceFolders?.[0];
  return folder ? vscode.Uri.joinPath(folder.uri, PROJECT_FILE) : undefined;
}


/** Escribe un autocompletehelp.json completo en una carpeta (proyecto nuevo). */
export async function writeProjectFileAt(folder: vscode.Uri, project: ProjectFile): Promise<void> {
  const uri = vscode.Uri.joinPath(folder, PROJECT_FILE);
  await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(JSON.stringify(project, null, 2) + '\n'));
  if (projectRoot()?.toString() === folder.toString()) {
    await reload();
  }
}

async function reload(): Promise<void> {
  const uri = projectUri();
  if (!uri) {
    cached = undefined;
    return;
  }
  try {
    const bytes = await vscode.workspace.fs.readFile(uri);
    cached = parseProjectFile(new TextDecoder().decode(bytes));
  } catch {
    cached = undefined; // no existe todavía
  }
  changed?.fire();
}

/** Carga el archivo al activar y lo mantiene sincronizado si se edita a mano. */
export async function initProjectFile(context: vscode.ExtensionContext): Promise<void> {
  legacyPrompt = context.workspaceState.get<string>(LEGACY_PROMPT_KEY, '');
  await reload();
  const watcher = vscode.workspace.createFileSystemWatcher(`**/${PROJECT_FILE}`);
  watcher.onDidChange(() => reload());
  watcher.onDidCreate(() => reload());
  watcher.onDidDelete(() => reload());
  context.subscriptions.push(watcher, emitter());
}

export function getProject(): ProjectFile | undefined {
  if (cached) {
    return cached;
  }
  return legacyPrompt ? { prompt: legacyPrompt } : undefined;
}

/**
 * Mezcla los cambios con lo existente y escribe el archivo. Sin carpeta de
 * trabajo abierta, cae al almacenamiento antiguo (solo el prompt).
 */
export async function saveProject(
  context: vscode.ExtensionContext,
  changes: Partial<ProjectFile>
): Promise<boolean> {
  const next: ProjectFile = { ...(getProject() ?? { prompt: '' }), ...changes };
  const uri = projectUri();
  if (!uri) {
    legacyPrompt = next.prompt;
    await context.workspaceState.update(LEGACY_PROMPT_KEY, next.prompt);
    return false;
  }
  const text = JSON.stringify(next, null, 2) + '\n';
  await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(text));
  cached = next;
  changed?.fire();
  return true;
}

/** Marca un paso del plan como hecho o pendiente. */
export async function markStep(
  context: vscode.ExtensionContext,
  index: number,
  hecho: boolean
): Promise<void> {
  const plan = getProject()?.plan;
  if (!plan || !plan[index]) {
    return;
  }
  const next = plan.map((s, i) => (i === index ? { ...s, hecho } : s));
  await saveProject(context, { plan: next });
}

export function projectRoot(): vscode.Uri | undefined {
  return vscode.workspace.workspaceFolders?.[0]?.uri;
}

export async function openProjectFile(): Promise<void> {
  const uri = projectUri();
  if (uri) {
    await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(uri));
  }
}

