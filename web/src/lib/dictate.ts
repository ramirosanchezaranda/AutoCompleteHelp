/**
 * De dónde sale el código que se dicta: de una lección sin IA (ya escrito y
 * probado) o de la IA elegida, con las mismas reglas que la extensión.
 */
import { lessonCode, LESSONS } from '@core/lessons';
import { buildDictationSystemPrompt, buildUserPrompt, extractConcepts, sanitizeCompletion } from '@core/prompts';
import { formatProjectForPrompt, ProjectFile } from '@core/project';
import { parseLocalImports, summarizeFile } from '@core/context';
import { normalizeConcept } from '@core/concepts';
import { AISettings, llm } from './ai';
import { languageOf } from '../engine/session';

export interface Generated {
  text: string;
  concepts: string[];
  fromLesson: boolean;
}

const MAX_PREFIX = 6000;
const MAX_SUFFIX = 2000;

/** Árbol de archivos y manifiesto: para que la IA no invente rutas ni dependencias. */
export function projectSnapshot(files: Record<string, string>): string {
  const tree = Object.keys(files).sort().slice(0, 150).join('\n');
  const manifest = ['package.json', 'requirements.txt', 'pyproject.toml']
    .filter((m) => m in files)
    .map((m) => `--- ${m} ---\n${files[m].slice(0, 1500)}`)
    .join('\n');
  return [`Archivos:\n${tree}`, manifest].filter(Boolean).join('\n\n');
}

function relatedFiles(files: Record<string, string>, path: string, text: string): string {
  const dir = path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '';
  const out: string[] = [];
  let size = 0;
  for (const spec of parseLocalImports(text, languageOf(path)).slice(0, 4)) {
    const base = spec.startsWith('.') ? `${dir}/${spec}`.split('/').reduce<string[]>((acc, part) => (part === '..' ? acc.slice(0, -1) : part && part !== '.' ? [...acc, part] : acc), []).join('/') : spec;
    const hit = [base, `${base}.ts`, `${base}.js`, `${base}.tsx`, `${base}.py`].find((c) => c in files);
    if (!hit) continue;
    const block = `--- ${hit} ---\n${summarizeFile(files[hit], languageOf(hit))}`;
    if (size + block.length > 6000) break;
    out.push(block);
    size += block.length;
  }
  // Los tests que importan este archivo: dicen qué tiene que hacer (ejercicios).
  const name = path.split('/').pop()!.replace(/\.[^.]+$/, '');
  for (const [f, text] of Object.entries(files)) {
    if (f === path || !/\.(test|spec)\.[jt]sx?$|(^|\/)test_[^/]*\.py$/.test(f) || !text.includes(name)) continue;
    const block = `--- ${f} (tests que tiene que pasar) ---\n${text.slice(0, 4000)}`;
    if (size + block.length > 9000) break;
    out.push(block);
    size += block.length;
  }
  return out.join('\n\n');
}

export function fromLesson(project: ProjectFile | undefined, path: string): Generated | undefined {
  const code = lessonCode(project?.leccion, path);
  return code ? { ...code, fromLesson: true } : undefined;
}

export async function fromAI(
  ai: AISettings,
  o: { project?: ProjectFile; files: Record<string, string>; path: string; content: string; insertAt: number; instruction: string; known: string[]; signal?: AbortSignal; onLines?: (n: number) => void }
): Promise<Generated> {
  const prefix = o.content.slice(0, o.insertAt).slice(-MAX_PREFIX);
  const suffix = o.content.slice(o.insertAt).slice(0, MAX_SUFFIX);
  const system = buildDictationSystemPrompt(formatProjectForPrompt(o.project), true, o.known, projectSnapshot(o.files));
  const user = buildUserPrompt(languageOf(o.path), o.path, prefix, suffix, relatedFiles(o.files, o.path, o.content), o.instruction);
  const raw = await llm(ai, system, user, 2400, { signal: o.signal, onDelta: (_d, total) => o.onLines?.(total.split('\n').length) });
  const { text: body, concepts } = extractConcepts(raw);
  const text = sanitizeCompletion(body, prefix).replace(/\s+$/, '');
  return { text, concepts, fromLesson: false };
}

/**
 * Repaso sin IA: un archivo de una lección donde aparece el concepto. Se
 * escribe de memoria, con huecos.
 */
export function reviewFromLessons(conceptId: string): { path: string; text: string; concepts: string[] } | undefined {
  for (const l of LESSONS) {
    for (const [path, concepts] of Object.entries(l.conceptos)) {
      if (!/\.(ts|js|py|frag|vert)$/.test(path)) continue;
      if (concepts.some((c) => normalizeConcept(c).id === conceptId) && l.archivos[path]) {
        return { path, text: l.archivos[path].join('\n'), concepts };
      }
    }
  }
  return undefined;
}
