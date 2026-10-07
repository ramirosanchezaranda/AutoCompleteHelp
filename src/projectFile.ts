import * as vscode from 'vscode';

/**
 * autocompletehelp.json — la fuente de verdad del proyecto, versionada con el
 * código: el prompt, el stack con versiones, las convenciones y el plan.
 * Antes el prompt vivía en el estado interno del IDE: invisible, sin versiones
 * y perdido al abrir el proyecto en otra máquina.
 */
export const PROJECT_FILE = 'autocompletehelp.json';

/** Clave antigua (v0.1–0.2): el prompt guardado en workspaceState. */
const LEGACY_PROMPT_KEY = 'autocompletehelp.projectPrompt';

export interface StackInfo {
  /** Resumen en una frase, ej: "Node.js + Express 5 + MongoDB". */
  resumen?: string;
  lenguaje?: string;
  framework?: string;
  datos?: string;
  tests?: string;
  [clave: string]: string | undefined;
}

export interface PlanStep {
  paso: string;
  archivo?: string;
  concepto?: string;
  hecho?: boolean;
}

export interface ProjectFile {
  prompt: string;
  /** Id del perfil de stack curado (src/stackProfiles.ts), si corresponde. */
  perfil?: string;
  stack?: StackInfo;
  convenciones?: string[];
  plan?: PlanStep[];
}

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

/** Valida y normaliza el JSON leído: un archivo editado a mano no debe romper nada. */
export function parseProjectFile(text: string): ProjectFile | undefined {
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    return undefined;
  }
  if (!data || typeof data !== 'object') {
    return undefined;
  }
  const project: ProjectFile = { prompt: typeof data.prompt === 'string' ? data.prompt : '' };
  if (typeof data.perfil === 'string' && data.perfil.trim()) {
    project.perfil = data.perfil.trim();
  }
  if (data.stack && typeof data.stack === 'object') {
    const stack: StackInfo = {};
    for (const [k, v] of Object.entries(data.stack)) {
      if (typeof v === 'string' && v.trim()) {
        stack[k] = v.trim();
      }
    }
    if (Object.keys(stack).length) {
      project.stack = stack;
    }
  }
  if (Array.isArray(data.convenciones)) {
    project.convenciones = data.convenciones.filter((c: unknown) => typeof c === 'string');
  }
  if (Array.isArray(data.plan)) {
    project.plan = data.plan
      .filter((s: any) => s && typeof s.paso === 'string')
      .map((s: any) => ({
        paso: s.paso,
        archivo: typeof s.archivo === 'string' ? s.archivo : undefined,
        concepto: typeof s.concepto === 'string' ? s.concepto : undefined,
        hecho: s.hecho === true
      }));
  }
  return project;
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

/** Primer paso del plan que falta: es lo que la guía «➜ Siguiente paso» debe señalar. */
export function nextStep(project: ProjectFile | undefined): PlanStep | undefined {
  return project?.plan?.find((s) => !s.hecho);
}

/** Bloque de texto con el proyecto para el prompt de sistema. */
export function formatProjectForPrompt(project: ProjectFile | undefined): string {
  if (!project || (!project.prompt && !project.stack)) {
    return '';
  }
  const lines: string[] = [];
  if (project.prompt) {
    lines.push(`Objetivo: ${project.prompt}`);
  }
  if (project.stack) {
    const parts = Object.entries(project.stack)
      .filter(([k]) => k !== 'resumen')
      .map(([k, v]) => `${k}: ${v}`);
    lines.push(`Stack: ${project.stack.resumen ?? ''}${parts.length ? ` (${parts.join('; ')})` : ''}`.trim());
  }
  if (project.convenciones?.length) {
    lines.push(`Convenciones: ${project.convenciones.join('; ')}`);
  }
  if (project.plan?.length) {
    const done = project.plan.filter((s) => s.hecho).length;
    lines.push(`Plan: ${done}/${project.plan.length} pasos hechos.`);
    const next = nextStep(project);
    if (next) {
      lines.push(
        `Paso actual del plan: ${next.paso}` +
          (next.archivo ? ` (archivo ${next.archivo})` : '') +
          (next.concepto ? ` — concepto a enseñar: ${next.concepto}` : '')
      );
    }
  }
  return lines.join('\n');
}
