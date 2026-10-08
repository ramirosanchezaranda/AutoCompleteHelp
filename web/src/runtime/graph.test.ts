import { describe, expect, it } from 'vitest';
import { LESSONS } from '@core/lessons';
import { LOADER_SOURCE, buildGraph, resolveSpec } from './graph';
import { buildPreview, mapShaderError } from './preview';

const filesOf = (id: string) => {
  const l = LESSONS.find((x) => x.id === id)!;
  return Object.fromEntries(Object.entries(l.archivos).map(([p, lines]) => [p, lines.join('\n') + '\n']));
};
const load = new Function(`${LOADER_SOURCE}; return __achLoad;`)() as (g: any, e: string, ctx: any) => any;

describe('grafo de módulos', () => {
  it('resuelve imports locales, ?raw, paquetes y vitest', () => {
    const files = { 'src/a.ts': '', 'src/s/x.frag': 'void main(){}', 'package.json': '{"dependencies":{"gsap":"^3.12.5"}}' };
    expect(resolveSpec(files, 'src/b.ts', './a')).toEqual({ t: 'mod', path: 'src/a.ts' });
    expect(resolveSpec(files, 'src/b.ts', './s/x.frag?raw')).toEqual({ t: 'raw', text: 'void main(){}' });
    expect(resolveSpec(files, 'src/b.ts', 'gsap')).toEqual({ t: 'ext', url: 'https://esm.sh/gsap@^3.12.5' });
    expect(resolveSpec(files, 'src/b.ts', 'vitest')).toEqual({ t: 'shim', name: 'vitest' });
    expect(resolveSpec(files, 'src/b.ts', './falta').t).toBe('missing');
    expect(resolveSpec(files, 'src/b.ts', 'node:fs').t).toBe('missing');
  });

  it('la lección de TypeScript: rojo sin gastos.ts, verde con él', async () => {
    const all = filesOf('typescript-gastos');
    const run = async (files: Record<string, string>) => {
      const { graph } = await buildGraph(files, ['src/gastos.test.ts']);
      const results: [string, boolean][] = [];
      const tests: [string, () => void][] = [];
      const vitest = {
        describe: (_n: string, f: () => void) => f(),
        it: (n: string, f: () => void) => tests.push([n, f]),
        expect: (a: unknown) => ({
          toBe: (b: unknown) => { if (a !== b) throw new Error('distinto'); },
          toEqual: (b: unknown) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error('distinto'); }
        })
      };
      load(graph, 'src/gastos.test.ts', { externals: {}, shims: { vitest }, globals: {} });
      for (const [n, f] of tests) {
        try { f(); results.push([n, true]); } catch { results.push([n, false]); }
      }
      return results;
    };
    const { 'src/gastos.ts': _sin, ...sinGastos } = all;
    await expect(run(sinGastos)).rejects.toThrow(/gastos/);
    expect((await run(all)).every(([, ok]) => ok)).toBe(true);
  });

  it('la lección del atardecer arma la vista previa con los shaders como texto', async () => {
    const files = filesOf('shader-atardecer');
    const p = await buildPreview(files);
    expect(p.empty).toBe(false);
    expect(p.errors).toEqual([]);
    expect(p.html).toContain('__achLoad');
    expect(p.html).toContain('uniform');
  });

  it('un error del shader apunta a la línea del archivo', () => {
    const frag = '// comentario\n// otro\nvoid main() {\n  gl_FragColor = vec4(1.0)\n}\n';
    const source = '#version 300 es\n' + frag;
    const r = mapShaderError({ 'src/shaders/a.frag': frag }, source, "ERROR: 0:5: '}' : syntax error");
    expect(r).toEqual({ path: 'src/shaders/a.frag', line: 4, message: "'}' : syntax error" });
  });
});
