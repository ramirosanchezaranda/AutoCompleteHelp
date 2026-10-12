import { describe, expect, it } from 'vitest';
import { LESSONS } from '@core/lessons';
import { exerciseStarter } from '@core/exercises';
import { LOADER_SOURCE, buildGraph } from './graph';

const load = new Function(`${LOADER_SOURCE}; return __achLoad;`)() as (g: any, e: string, ctx: any) => any;

/** Corre los tests de un curso con el cargador de la web y un vitest mínimo. */
async function run(files: Record<string, string>) {
  const tests = Object.keys(files).filter((f) => f.endsWith('.test.js'));
  const { graph, errors } = await buildGraph(files, tests);
  expect(errors).toEqual([]);
  const results: boolean[] = [];
  for (const t of tests) {
    const cases: (() => void)[] = [];
    const exp = (a: any) => ({
      toBe: (b: any) => { if (!Object.is(a, b)) throw new Error(`${a} !== ${b}`); },
      toEqual: (b: any) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error('distinto'); },
      toBeCloseTo: (b: number) => { if (!(Math.abs(a - b) < 0.005)) throw new Error(`${a} no es ~${b}`); }
    });
    const vitest = { describe: (_n: string, f: () => void) => f(), it: (_n: string, f: () => void) => cases.push(f), expect: exp };
    load(graph, t, { externals: {}, shims: { vitest }, globals: {} });
    for (const c of cases) {
      try { c(); results.push(true); } catch { results.push(false); }
    }
  }
  return results;
}

describe('cursos de teoría y ejercicios, en el cargador de la web', () => {
  for (const l of LESSONS.filter((x) => x.tipo === 'curso')) {
    const solution = Object.fromEntries(Object.entries(l.archivos).map(([p, lines]) => [p, lines.join('\n') + '\n']));
    const starter = Object.fromEntries(
      Object.entries(solution).map(([p, t]) => {
        const tipo = l.plan.find((s) => s.archivo === p)?.tipo;
        return [p, tipo === 'ejercicio' ? exerciseStarter(t, p) : tipo === 'arreglar' ? l.enunciados![p].join('\n') + '\n' : t];
      })
    );
    it(`${l.id}: con las soluciones todo en verde`, async () => {
      const r = await run(solution);
      expect(r.length).toBeGreaterThan(10);
      expect(r.every(Boolean)).toBe(true);
    });
    it(`${l.id}: con los enunciados, los ejercicios en rojo; el código para arreglar falla en cada función`, async () => {
      const ex = Object.fromEntries(Object.entries(starter).filter(([p]) => !p.includes('arreglar')));
      expect((await run(ex)).some(Boolean)).toBe(false);
      const arr = Object.fromEntries(Object.entries(starter).filter(([p]) => p.includes('arreglar')));
      const r = await run(arr);
      // 3 funciones con 2 casos cada una: al menos un caso rojo por función.
      expect([r.length, [0, 2, 4].every((i) => !r[i] || !r[i + 1])]).toEqual([6, true]);
    });
  }
});
