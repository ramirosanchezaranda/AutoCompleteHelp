/** Índice liviano de proyectos (para el inicio, sin cargar el catálogo ni las lecciones). */
import { db } from './db';

export interface ProjectSummary {
  id: string;
  name: string;
  updatedAt: number;
  done: number;
  total: number;
}

export const INDEX = 'projects:index';

export async function listProjects(): Promise<ProjectSummary[]> {
  return ((await db.get<ProjectSummary[]>(INDEX)) ?? []).sort((a, b) => b.updatedAt - a.updatedAt);
}
