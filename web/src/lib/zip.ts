/** Exportar e importar proyectos como .zip (el mismo formato que abre la extensión en VS Code). */
import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';
import { PROJECT_FILE } from '@core/project';
import type { StoredProject } from './projects';

export function exportZip(p: StoredProject): void {
  const entries: Record<string, Uint8Array> = {};
  for (const [path, text] of Object.entries(p.files)) {
    entries[`${p.name}/${path}`] = strToU8(text);
  }
  const blob = new Blob([zipSync(entries, { level: 6 })], { type: 'application/zip' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${p.name}.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

const SKIP = /(^|\/)(node_modules|\.git|dist|out|\.venv|__pycache__)\//;
const MAX = 2 * 1024 * 1024;

/** Lee un .zip: devuelve los archivos de texto, sin la carpeta raíz común. */
export async function importZip(file: File): Promise<{ name: string; files: Record<string, string>; hasProjectFile: boolean; skipped: number }> {
  const raw = unzipSync(new Uint8Array(await file.arrayBuffer()));
  const paths = Object.keys(raw).filter((p) => !p.endsWith('/'));
  const tops = new Set(paths.map((p) => p.split('/')[0]));
  const strip = tops.size === 1 && paths.every((p) => p.includes('/')) ? `${[...tops][0]}/` : '';
  const files: Record<string, string> = {};
  let skipped = 0;
  for (const p of paths) {
    const rel = p.slice(strip.length);
    const bytes = raw[p];
    if (!rel || SKIP.test(`/${rel}`) || bytes.length > MAX || bytes.includes(0)) {
      skipped++;
      continue;
    }
    files[rel] = strFromU8(bytes);
  }
  const name = (strip.replace(/\/$/, '') || file.name.replace(/\.zip$/i, '')).trim() || 'proyecto';
  return { name, files, hasProjectFile: PROJECT_FILE in files, skipped };
}
