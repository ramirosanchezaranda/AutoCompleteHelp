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

export type StepKind = 'codigo' | 'test' | 'config' | 'docker' | 'comando';
export const STEP_KINDS: StepKind[] = ['codigo', 'test', 'config', 'docker', 'comando'];

export interface PlanStep {
  paso: string;
  archivo?: string;
  concepto?: string;
  /** Qué tipo de paso es: escribir código, un test, configuración, Docker o correr un comando. */
  tipo?: StepKind;
  /** Pasos de tipo «comando»: lo que se escribe en la terminal (nunca se ejecuta solo). */
  comando?: string;
  explicacion?: string;
  /** Comando que comprueba el paso al terminarlo (ej: npm test). */
  verificar?: string;
  hecho?: boolean;
}

/** Un comando de terminal con su porqué. */
export interface EnvCommand {
  comando: string;
  /** Variante para Windows, si cambia. */
  windows?: string;
  explicacion: string;
}

/** Cómo se prepara, ejecuta y testea el proyecto (y Docker, si hace falta). */
export interface ProjectEnvironment {
  instalar?: EnvCommand[];
  ejecutar?: EnvCommand;
  testear?: EnvCommand;
  docker?: { porQue: string; comandos: EnvCommand[] };
}

/** Proyecto generado por «Quiero aprender». */
export interface LearnInfo {
  tema: string;
  nivel?: string;
  objetivos?: string[];
}

/** Arquitectura elegida (src/architectures.ts) y lo que el código debe respetar. */
export interface ProjectArchitecture {
  estilo: string;
  nombre: string;
  razones?: string[];
  carpetas?: string[];
  reglas?: string[];
}

export interface ProjectFile {
  prompt: string;
  /** Id del perfil de stack curado (src/stackProfiles.ts), si corresponde. */
  perfil?: string;
  stack?: StackInfo;
  convenciones?: string[];
  arquitectura?: ProjectArchitecture;
  entorno?: ProjectEnvironment;
  aprender?: LearnInfo;
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
  const a = data.arquitectura;
  if (a && typeof a === 'object' && typeof a.estilo === 'string' && a.estilo.trim()) {
    const strings = (x: unknown) => (Array.isArray(x) ? x.filter((v): v is string => typeof v === 'string') : undefined);
    project.arquitectura = {
      estilo: a.estilo.trim(),
      nombre: typeof a.nombre === 'string' && a.nombre.trim() ? a.nombre.trim() : a.estilo.trim(),
      razones: strings(a.razones),
      carpetas: strings(a.carpetas),
      reglas: strings(a.reglas)
    };
  }
  const entorno = parseEnvironment(data.entorno);
  if (entorno) {
    project.entorno = entorno;
  }
  if (data.aprender && typeof data.aprender === 'object' && typeof data.aprender.tema === 'string' && data.aprender.tema.trim()) {
    project.aprender = {
      tema: data.aprender.tema.trim(),
      nivel: str(data.aprender.nivel),
      objetivos: Array.isArray(data.aprender.objetivos)
        ? data.aprender.objetivos.filter((o: unknown): o is string => typeof o === 'string')
        : undefined
    };
  }
  if (Array.isArray(data.plan)) {
    project.plan = data.plan.map(parseStep).filter((s: PlanStep | undefined): s is PlanStep => !!s);
  }
  return project;
}

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

/** Un paso del plan validado. Rutas fuera del proyecto se descartan. */
export function parseStep(s: any): PlanStep | undefined {
  if (!s || typeof s.paso !== 'string' || !s.paso.trim()) {
    return undefined;
  }
  let archivo = str(s.archivo)?.replace(/^\.?\//, '');
  if (archivo && (/(^|\/)\.\.(\/|$)/.test(archivo) || archivo.startsWith('/') || /^[a-z]:/i.test(archivo))) {
    archivo = undefined;
  }
  const tipo = STEP_KINDS.includes(s.tipo) ? (s.tipo as StepKind) : undefined;
  const step: PlanStep = { paso: s.paso.trim(), hecho: s.hecho === true };
  if (archivo) step.archivo = archivo;
  if (str(s.concepto)) step.concepto = str(s.concepto);
  if (tipo) step.tipo = tipo;
  if (str(s.comando)) step.comando = str(s.comando);
  if (str(s.explicacion)) step.explicacion = str(s.explicacion);
  if (str(s.verificar)) step.verificar = str(s.verificar);
  return step;
}

function parseCommand(c: any): EnvCommand | undefined {
  const comando = c && str(c.comando);
  if (!comando) {
    return undefined;
  }
  return { comando, windows: str(c.windows), explicacion: str(c.explicacion) ?? '' };
}

export function parseEnvironment(e: any): ProjectEnvironment | undefined {
  if (!e || typeof e !== 'object') {
    return undefined;
  }
  const list = (x: unknown) =>
    Array.isArray(x) ? x.map(parseCommand).filter((c): c is EnvCommand => !!c) : [];
  const env: ProjectEnvironment = {};
  const instalar = list(e.instalar);
  if (instalar.length) env.instalar = instalar;
  const ejecutar = parseCommand(e.ejecutar);
  if (ejecutar) env.ejecutar = ejecutar;
  const testear = parseCommand(e.testear);
  if (testear) env.testear = testear;
  if (e.docker && typeof e.docker === 'object') {
    const comandos = list(e.docker.comandos);
    if (comandos.length) {
      env.docker = { porQue: str(e.docker.porQue) ?? '', comandos };
    }
  }
  return Object.keys(env).length ? env : undefined;
}

/**
 * Comandos del entorno en el orden en que se usan: instalar → (Docker) →
 * ejecutar → testear. Lo que lista «Preparar el entorno».
 */
export function environmentSteps(env: ProjectEnvironment | undefined): (EnvCommand & { grupo: string })[] {
  if (!env) {
    return [];
  }
  return [
    ...(env.instalar ?? []).map((c) => ({ ...c, grupo: 'Instalar' })),
    ...(env.docker?.comandos ?? []).map((c) => ({ ...c, grupo: 'Docker' })),
    ...(env.ejecutar ? [{ ...env.ejecutar, grupo: 'Ejecutar' }] : []),
    ...(env.testear ? [{ ...env.testear, grupo: 'Tests' }] : [])
  ];
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
  if (project.aprender) {
    lines.push(
      `Proyecto para APRENDER ${project.aprender.tema}` +
        (project.aprender.nivel ? ` (punto de partida: ${project.aprender.nivel})` : '') +
        (project.aprender.objetivos?.length ? `. Objetivos: ${project.aprender.objetivos.join('; ')}` : '')
    );
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
  if (project.arquitectura) {
    const a = project.arquitectura;
    lines.push(`Arquitectura: ${a.nombre}`);
    if (a.carpetas?.length) {
      lines.push(`  Estructura: ${a.carpetas.join('; ')}`);
    }
    if (a.reglas?.length) {
      lines.push(`  Reglas: ${a.reglas.join(' ')}`);
    }
  }
  if (project.plan?.length) {
    const done = project.plan.filter((s) => s.hecho).length;
    lines.push(`Plan: ${done}/${project.plan.length} pasos hechos.`);
    const next = nextStep(project);
    if (next) {
      lines.push(
        `Paso actual del plan: ${next.paso}` +
          (next.tipo ? ` [${next.tipo}]` : '') +
          (next.archivo ? ` (archivo ${next.archivo})` : '') +
          (next.concepto ? ` — concepto a enseñar: ${next.concepto}` : '') +
          (next.verificar ? ` — se comprueba con: ${next.verificar}` : '')
      );
    }
  }
  return lines.join('\n');
}
