/**
 * Corre tests y programas del proyecto en un Web Worker. Lo que el navegador
 * no puede correr (Python, Docker, la nube) se explica en la terminal.
 */
import { buildGraph, isCode, isTest } from './graph';
import type { TestResult, WorkerMessage, WorkerRequest } from './testWorker';

export type { TestResult };

export interface RunEvents {
  onLog?: (level: 'log' | 'error' | 'warn', text: string) => void;
  onTest?: (r: TestResult) => void;
  onFileError?: (file: string, error: string, line?: number) => void;
}

export interface TestSummary {
  passed: number;
  failed: number;
  fileErrors: number;
  results: TestResult[];
  compileErrors: { path: string; line?: number; message: string }[];
  timedOut: boolean;
}

const TIMEOUT = 20000;

function spawn(req: WorkerRequest, ev: RunEvents): Promise<{ exitCode: number; timedOut: boolean }> {
  return new Promise((resolve) => {
    const worker = new Worker(new URL('./testWorker.ts', import.meta.url), { type: 'module' });
    const timer = setTimeout(() => {
      worker.terminate();
      ev.onLog?.('error', `Se detuvo: tardó más de ${TIMEOUT / 1000} s (¿un bucle que no termina?).`);
      resolve({ exitCode: 124, timedOut: true });
    }, TIMEOUT);
    worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
      const m = e.data;
      if (m.type === 'log') ev.onLog?.(m.level, m.text);
      else if (m.type === 'test') ev.onTest?.(m.result);
      else if (m.type === 'fileError') ev.onFileError?.(m.file, m.error, m.line);
      else if (m.type === 'done') {
        clearTimeout(timer);
        worker.terminate();
        resolve({ exitCode: m.exitCode, timedOut: false });
      }
    };
    worker.onerror = (e) => {
      clearTimeout(timer);
      worker.terminate();
      ev.onLog?.('error', e.message || 'El worker falló.');
      resolve({ exitCode: 1, timedOut: false });
    };
    worker.postMessage(req);
  });
}

/** Archivos de test JS/TS del proyecto (opcionalmente, solo algunos). */
export function testFiles(files: Record<string, string>, only?: string[]): string[] {
  return Object.keys(files)
    .filter((p) => isTest(p) && !p.startsWith('node_modules/'))
    .filter((p) => !only?.length || only.some((o) => p.includes(o)))
    .sort();
}

export async function runTests(files: Record<string, string>, ev: RunEvents = {}, only?: string[]): Promise<TestSummary> {
  const entries = testFiles(files, only);
  const summary: TestSummary = { passed: 0, failed: 0, fileErrors: 0, results: [], compileErrors: [], timedOut: false };
  if (!entries.length) {
    return summary;
  }
  const { graph, externals, errors } = await buildGraph(files, entries);
  summary.compileErrors = errors;
  const { timedOut } = await spawn(
    { kind: 'test', graph, entries, externals },
    {
      onLog: ev.onLog,
      onTest: (r) => {
        summary.results.push(r);
        if (r.ok) summary.passed++;
        else summary.failed++;
        ev.onTest?.(r);
      },
      onFileError: (f, err, line) => {
        summary.fileErrors++;
        ev.onFileError?.(f, err, line);
      }
    }
  );
  summary.timedOut = timedOut;
  return summary;
}

export async function runProgram(files: Record<string, string>, entry: string, argv: string[], ev: RunEvents = {}): Promise<number> {
  if (!(entry in files) || !isCode(entry)) {
    ev.onLog?.('error', `No existe ${entry} en el proyecto.`);
    return 1;
  }
  const { graph, externals, errors } = await buildGraph(files, [entry]);
  for (const e of errors) ev.onLog?.('error', `${e.path}${e.line ? `:${e.line}` : ''} — ${e.message}`);
  const { exitCode } = await spawn({ kind: 'run', graph, entry, externals, argv: [entry, ...argv] }, ev);
  return exitCode;
}
