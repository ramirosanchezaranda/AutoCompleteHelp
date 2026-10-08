/**
 * Proyectos en el dispositivo. Cada proyecto es un mapa ruta → texto que
 * incluye autocompletehelp.json con el MISMO esquema que la extensión: se
 * exporta como .zip y se abre en VS Code, y al revés.
 */
import { PROJECT_FILE, ProjectFile, parseProjectFile } from '@core/project';
import { Lesson, lessonProjectFile } from '@core/lessons';
import { learnProjectDocs, folderNameFor } from '@core/learnTopics';
import { scaffoldEntries, ScaffoldEntry } from '@core/scaffold';
import { getProfile } from '@core/stackProfiles';
import { db } from './db';

export interface StoredProject {
  id: string;
  name: string;
  files: Record<string, string>;
  createdAt: number;
  updatedAt: number;
}

import { INDEX, ProjectSummary, listProjects } from './projectIndex';
export { listProjects };
export type { ProjectSummary };

export async function loadProject(id: string): Promise<StoredProject | undefined> {
  return db.get<StoredProject>(`project:${id}`);
}

export async function saveProject(p: StoredProject): Promise<void> {
  await db.set(`project:${p.id}`, p);
  const index = (await db.get<ProjectSummary[]>(INDEX)) ?? [];
  const plan = projectJson(p)?.plan ?? [];
  const summary: ProjectSummary = {
    id: p.id,
    name: p.name,
    updatedAt: p.updatedAt,
    done: plan.filter((s) => s.hecho).length,
    total: plan.length
  };
  await db.set(INDEX, [...index.filter((x) => x.id !== p.id), summary]);
}

export async function deleteProject(id: string): Promise<void> {
  await db.del(`project:${id}`);
  const index = (await db.get<ProjectSummary[]>(INDEX)) ?? [];
  await db.set(INDEX, index.filter((x) => x.id !== id));
}

export function projectJson(p: StoredProject | undefined): ProjectFile | undefined {
  const text = p?.files[PROJECT_FILE];
  return text ? parseProjectFile(text) : undefined;
}

export function withProjectJson(p: StoredProject, changes: Partial<ProjectFile>): StoredProject {
  const next: ProjectFile = { ...(projectJson(p) ?? { prompt: '' }), ...changes };
  return touch({ ...p, files: { ...p.files, [PROJECT_FILE]: JSON.stringify(next, null, 2) + '\n' } });
}

export function withFile(p: StoredProject, path: string, text: string): StoredProject {
  return touch({ ...p, files: { ...p.files, [path]: text } });
}

export function markStep(p: StoredProject, index: number, hecho: boolean): StoredProject {
  const plan = projectJson(p)?.plan;
  if (!plan?.[index]) {
    return p;
  }
  return withProjectJson(p, { plan: plan.map((s, i) => (i === index ? { ...s, hecho } : s)) });
}

function touch(p: StoredProject): StoredProject {
  return { ...p, updatedAt: Date.now() };
}

function newId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

/** Nombre único entre los proyectos existentes: «aprender-gsap», «aprender-gsap-2»… */
export async function uniqueName(base: string): Promise<string> {
  const names = new Set((await listProjects()).map((p) => p.name));
  if (!names.has(base)) {
    return base;
  }
  let n = 2;
  while (names.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

/** Un proyecto nuevo con su autocompletehelp.json y sus documentos. */
export async function createProject(name: string, project: ProjectFile, guide: string, tema: string): Promise<StoredProject> {
  const fecha = new Date().toISOString().slice(0, 10);
  const files: Record<string, string> = {
    ...learnProjectDocs(project, guide, tema, fecha),
    [PROJECT_FILE]: JSON.stringify(project, null, 2) + '\n'
  };
  const now = Date.now();
  const p: StoredProject = { id: newId(), name: await uniqueName(name), files, createdAt: now, updatedAt: now };
  await saveProject(p);
  return p;
}

/** Un proyecto nuevo con documentos propios (camino «Tengo un proyecto»). */
export async function createProjectWith(name: string, project: ProjectFile, docs: Record<string, string>): Promise<StoredProject> {
  const files: Record<string, string> = { ...docs, [PROJECT_FILE]: JSON.stringify(project, null, 2) + '\n' };
  const now = Date.now();
  const p: StoredProject = { id: newId(), name: await uniqueName(name), files, createdAt: now, updatedAt: now };
  await saveProject(p);
  return p;
}

export async function createFromLesson(lesson: Lesson): Promise<StoredProject> {
  return createProject(folderNameFor(lesson.tema), lessonProjectFile(lesson), lesson.guia, lesson.tema);
}

/** Archivos que crearía «Crear estructura» y que todavía no existen. */
export function pendingStructure(p: StoredProject): ScaffoldEntry[] {
  const project = projectJson(p);
  if (!project) {
    return [];
  }
  return scaffoldEntries(project, getProfile(project.perfil), p.name).filter((e) => !(e.archivo in p.files));
}

export function applyStructure(p: StoredProject, entries: ScaffoldEntry[]): StoredProject {
  const files = { ...p.files };
  for (const e of entries) {
    if (!(e.archivo in files)) {
      files[e.archivo] = e.contenido;
    }
  }
  return touch({ ...p, files });
}
