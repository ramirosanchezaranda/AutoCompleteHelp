import type { ProjectFile } from './project';
import { StackProfile, packageName } from './stackProfiles';
import { stepFileContent } from './instructions';

export interface ScaffoldEntry {
  archivo: string;
  contenido: string;
  motivo: string;
}

/**
 * Qué archivos crea «Crear estructura» (antes de descartar los que ya existen).
 * Función pura: se prueba aislada.
 *
 * Los archivos de código nacen VACÍOS salvo la instrucción `ach:` de su paso:
 * si la estructura trajera el código escrito, no habría nada que aprender.
 */
export function scaffoldEntries(
  project: ProjectFile,
  profile: StackProfile | undefined,
  folderName: string
): ScaffoldEntry[] {
  const nombre = packageName(folderName);
  const entries: ScaffoldEntry[] = [];

  for (const base of profile?.base ?? []) {
    entries.push({ ...base, contenido: base.contenido.replace(/\{\{nombre\}\}/g, nombre) });
  }
  if (profile?.gitignore.length) {
    entries.push({
      archivo: '.gitignore',
      contenido: profile.gitignore.join('\n') + '\n',
      motivo: 'archivos que git no debe versionar (dependencias, secretos)'
    });
  }

  if (profile?.crearArchivosDelPlan !== false) {
    const seen = new Set(entries.map((e) => e.archivo));
    for (const step of project.plan ?? []) {
      const archivo = step.archivo?.replace(/^\.?\//, '');
      if (!archivo || seen.has(archivo) || /(^|\/)\.\.(\/|$)/.test(archivo)) {
        continue;
      }
      seen.add(archivo);
      entries.push({
        archivo,
        contenido: stepFileContent(archivo, step),
        motivo: `paso «${step.paso}»: vacío, con su instrucción ach:`
      });
    }
  }
  return entries;
}
