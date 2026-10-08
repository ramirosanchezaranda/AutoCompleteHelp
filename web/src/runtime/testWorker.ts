/// <reference lib="webworker" />
/**
 * Worker que corre los tests (con un vitest mínimo compatible) y los
 * programas de terminal (npx tsx archivo.ts) del proyecto, aislado de la
 * página. Si algo se cuelga, la página lo termina.
 */
import { LOADER_SOURCE, Graph } from './graph';

declare function __achLoad(graph: Graph, entry: string, ctx: unknown): unknown;
declare function __achWhere(err: unknown): any;
// eslint-disable-next-line no-new-func
const [achLoad, achWhere] = new Function(`${LOADER_SOURCE}; return [__achLoad, __achWhere];`)() as [typeof __achLoad, typeof __achWhere];

export type WorkerRequest =
  | { kind: 'test'; graph: Graph; entries: string[]; externals: string[] }
  | { kind: 'run'; graph: Graph; entry: string; externals: string[]; argv: string[] };

export interface TestResult {
  file: string;
  name: string;
  ok: boolean;
  error?: string;
  /** Línea del archivo donde falló (si se pudo saber). */
  line?: number;
}

export type WorkerMessage =
  | { type: 'log'; level: 'log' | 'error' | 'warn'; text: string }
  | { type: 'test'; result: TestResult }
  | { type: 'fileError'; file: string; error: string; line?: number }
  | { type: 'done'; exitCode: number };

const post = (m: WorkerMessage) => (self as unknown as Worker).postMessage(m);

function fmt(v: unknown): string {
  if (typeof v === 'string') return v;
  if (v instanceof Error) return v.stack ?? v.message;
  try {
    return JSON.stringify(v, (_k, x) => (x === undefined ? 'undefined' : typeof x === 'bigint' ? `${x}n` : x), 2)?.replace(/"undefined"/g, 'undefined') ?? String(v);
  } catch {
    return String(v);
  }
}

for (const level of ['log', 'info', 'warn', 'error', 'debug'] as const) {
  (console as any)[level] = (...args: unknown[]) =>
    post({ type: 'log', level: level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log', text: args.map(fmt).join(' ') });
}

/** Línea del archivo donde ocurrió el error (si fue en ese archivo). */
function lineOf(err: any, file: string): number | undefined {
  const e = achWhere(err);
  return e?.achFile === file ? e.achLine : undefined;
}

// ---------------------------------------------------------------------------
// expect
// ---------------------------------------------------------------------------

function equals(a: any, b: any, strict = false): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || !a || !b) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  if (a instanceof Map && b instanceof Map) return equals([...a], [...b], strict);
  if (a instanceof Set && b instanceof Set) return equals([...a], [...b], strict);
  const keys = (o: any) => Object.keys(o).filter((k) => strict || o[k] !== undefined);
  const ka = keys(a);
  const kb = keys(b);
  if (ka.length !== kb.length) return false;
  if (strict && Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return false;
  return ka.every((k) => equals(a[k], b[k], strict));
}

class AssertionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AssertionError';
  }
}

function makeExpect() {
  const build = (actual: any, negate: boolean): any => {
    const check = (pass: boolean, msg: string, msgNot: string) => {
      if (pass === negate) throw new AssertionError(negate ? msgNot : msg);
    };
    const show = (v: unknown) => fmt(v).replace(/\s*\n\s*/g, ' ');
    const m: any = {
      toBe: (e: any) => check(Object.is(actual, e), `esperaba ${show(e)}, llegó ${show(actual)}`, `esperaba algo distinto de ${show(e)}`),
      toEqual: (e: any) => check(equals(actual, e), `esperaba ${show(e)}, llegó ${show(actual)}`, `esperaba algo distinto de ${show(e)}`),
      toStrictEqual: (e: any) => check(equals(actual, e, true), `esperaba exactamente ${show(e)}, llegó ${show(actual)}`, `esperaba algo distinto de ${show(e)}`),
      toBeCloseTo: (e: number, digits = 2) =>
        check(Math.abs(actual - e) < Math.pow(10, -digits) / 2, `esperaba un valor cercano a ${e}, llegó ${show(actual)}`, `esperaba un valor lejos de ${e}`),
      toBeTruthy: () => check(!!actual, `esperaba un valor verdadero, llegó ${show(actual)}`, `esperaba un valor falso, llegó ${show(actual)}`),
      toBeFalsy: () => check(!actual, `esperaba un valor falso, llegó ${show(actual)}`, `esperaba un valor verdadero, llegó ${show(actual)}`),
      toBeUndefined: () => check(actual === undefined, `esperaba undefined, llegó ${show(actual)}`, 'esperaba un valor definido'),
      toBeDefined: () => check(actual !== undefined, 'esperaba un valor definido, llegó undefined', `esperaba undefined, llegó ${show(actual)}`),
      toBeNull: () => check(actual === null, `esperaba null, llegó ${show(actual)}`, 'esperaba algo distinto de null'),
      toBeNaN: () => check(Number.isNaN(actual), `esperaba NaN, llegó ${show(actual)}`, 'esperaba un número'),
      toBeGreaterThan: (e: number) => check(actual > e, `esperaba más que ${e}, llegó ${show(actual)}`, `esperaba como mucho ${e}`),
      toBeGreaterThanOrEqual: (e: number) => check(actual >= e, `esperaba ${e} o más, llegó ${show(actual)}`, `esperaba menos que ${e}`),
      toBeLessThan: (e: number) => check(actual < e, `esperaba menos que ${e}, llegó ${show(actual)}`, `esperaba ${e} o más`),
      toBeLessThanOrEqual: (e: number) => check(actual <= e, `esperaba ${e} o menos, llegó ${show(actual)}`, `esperaba más que ${e}`),
      toBeInstanceOf: (c: any) => check(actual instanceof c, `esperaba una instancia de ${c?.name}`, `esperaba algo que no sea ${c?.name}`),
      toContain: (e: any) =>
        check(typeof actual === 'string' ? actual.includes(e) : [...(actual ?? [])].includes(e), `esperaba que contenga ${show(e)}`, `esperaba que no contenga ${show(e)}`),
      toContainEqual: (e: any) => check([...(actual ?? [])].some((x) => equals(x, e)), `esperaba que contenga ${show(e)}`, `esperaba que no contenga ${show(e)}`),
      toHaveLength: (n: number) => check(actual?.length === n, `esperaba largo ${n}, llegó ${actual?.length}`, `esperaba un largo distinto de ${n}`),
      toHaveProperty: (k: string, ...rest: any[]) => {
        const val = k.split('.').reduce((o: any, p) => (o == null ? undefined : o[p]), actual);
        check(val !== undefined && (rest.length === 0 || equals(val, rest[0])), `esperaba la propiedad «${k}»`, `no esperaba la propiedad «${k}»`);
      },
      toMatch: (re: RegExp | string) => check(typeof re === 'string' ? String(actual).includes(re) : re.test(String(actual)), `esperaba que coincida con ${re}`, `esperaba que no coincida con ${re}`),
      toThrow: (e?: string | RegExp) => {
        let threw = false;
        let message = '';
        try {
          actual();
        } catch (err: any) {
          threw = true;
          message = String(err?.message ?? err);
        }
        const matches = !e || (typeof e === 'string' ? message.includes(e) : e instanceof RegExp ? e.test(message) : true);
        check(threw && matches, threw ? `el error fue «${message}», no ${show(e)}` : 'esperaba que lance un error', 'no esperaba un error');
      },
      toHaveBeenCalled: () => check(actual?.mock?.calls.length > 0, 'esperaba que la función se llame', 'no esperaba que la función se llame'),
      toHaveBeenCalledTimes: (n: number) => check(actual?.mock?.calls.length === n, `esperaba ${n} llamadas, hubo ${actual?.mock?.calls.length}`, `no esperaba ${n} llamadas`),
      toHaveBeenCalledWith: (...args: any[]) =>
        check(actual?.mock?.calls.some((c: any[]) => equals(c, args)), `esperaba una llamada con ${show(args)}`, `no esperaba una llamada con ${show(args)}`)
    };
    m.toThrowError = m.toThrow;
    if (!negate) m.not = build(actual, true);
    m.resolves = new Proxy({}, { get: (_t, k: string) => async (...a: any[]) => build(await actual, negate)[k](...a) });
    m.rejects = new Proxy({}, {
      get: (_t, k: string) => async (...a: any[]) => {
        try {
          await actual;
        } catch (err) {
          return build(() => { throw err; }, negate)[k](...a);
        }
        throw new AssertionError('esperaba que la promesa falle');
      }
    });
    return m;
  };
  return (actual: any) => build(actual, false);
}

// ---------------------------------------------------------------------------
// Un vitest mínimo
// ---------------------------------------------------------------------------

interface Suite {
  name: string;
  tests: { name: string; fn: () => unknown; skip?: boolean }[];
  suites: Suite[];
  before: (() => unknown)[];
  after: (() => unknown)[];
  beforeAll: (() => unknown)[];
  afterAll: (() => unknown)[];
}

const newSuite = (name: string): Suite => ({ name, tests: [], suites: [], before: [], after: [], beforeAll: [], afterAll: [] });

function makeVitest(root: Suite) {
  let current = root;
  const describe: any = (name: string, fn: () => void) => {
    const s = newSuite(name);
    current.suites.push(s);
    const prev = current;
    current = s;
    try {
      fn();
    } finally {
      current = prev;
    }
  };
  describe.skip = () => {};
  describe.only = describe;
  const it: any = (name: string, fn: () => unknown) => current.tests.push({ name, fn });
  it.skip = (name: string, fn: () => unknown) => current.tests.push({ name, fn, skip: true });
  it.only = it;
  it.todo = () => {};
  it.each = (rows: any[]) => (name: string, fn: (...a: any[]) => unknown) =>
    rows.forEach((row, i) => it(name.replace('%s', String(row)).replace('%i', String(i)), () => (Array.isArray(row) ? fn(...row) : fn(row))));
  const vi = {
    fn: (impl?: (...a: any[]) => any) => {
      const calls: any[][] = [];
      const f: any = (...a: any[]) => {
        calls.push(a);
        return impl?.(...a);
      };
      f.mock = { calls };
      f.mockReturnValue = (v: any) => ((impl = () => v), f);
      f.mockImplementation = (i: any) => ((impl = i), f);
      return f;
    }
  };
  return {
    __esModule: true,
    describe,
    it,
    test: it,
    expect: makeExpect(),
    vi,
    beforeEach: (fn: () => unknown) => current.before.push(fn),
    afterEach: (fn: () => unknown) => current.after.push(fn),
    beforeAll: (fn: () => unknown) => current.beforeAll.push(fn),
    afterAll: (fn: () => unknown) => current.afterAll.push(fn)
  };
}

async function runSuite(file: string, s: Suite, path: string[], before: (() => unknown)[], after: (() => unknown)[]): Promise<void> {
  const bef = [...before, ...s.before];
  const aft = [...s.after, ...after];
  for (const h of s.beforeAll) await h();
  for (const t of s.tests) {
    const name = [...path, t.name].join(' › ');
    if (t.skip) continue;
    try {
      for (const h of bef) await h();
      await withTimeout(Promise.resolve(t.fn()), 5000);
      for (const h of aft) await h();
      post({ type: 'test', result: { file, name, ok: true } });
    } catch (err: any) {
      post({ type: 'test', result: { file, name, ok: false, error: String(err?.message ?? err), line: lineOf(err, file) } });
    }
  }
  for (const sub of s.suites) await runSuite(file, sub, [...path, sub.name], bef, aft);
  for (const h of s.afterAll) await h();
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`el test tardó más de ${ms / 1000} s`)), ms);
    p.then((v) => (clearTimeout(t), resolve(v)), (e) => (clearTimeout(t), reject(e)));
  });
}

class ExitSignal {
  constructor(readonly code: number) {}
}

async function loadExternals(urls: string[]): Promise<Record<string, unknown>> {
  const out: Record<string, unknown> = {};
  for (const url of urls) {
    out[url] = await import(/* @vite-ignore */ url);
  }
  return out;
}

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const req = e.data;
  let externals: Record<string, unknown> = {};
  try {
    externals = await loadExternals(req.externals);
  } catch (err: any) {
    post({ type: 'log', level: 'error', text: `No se pudieron descargar las dependencias (${err?.message ?? err}). ¿Hay conexión?` });
  }
  if (req.kind === 'test') {
    for (const file of req.entries) {
      const root = newSuite('');
      const vitest = makeVitest(root);
      try {
        const process = makeProcess([]);
        achLoad(req.graph, file, { externals, shims: { vitest, process }, globals: { process } });
      } catch (err: any) {
        post({ type: 'fileError', file, error: String(err?.message ?? err), line: lineOf(err, file) });
        continue;
      }
      await runSuite(file, root, [], [], []);
    }
    post({ type: 'done', exitCode: 0 });
    return;
  }
  // kind: run — un programa de terminal
  const proc = makeProcess(req.argv);
  try {
    achLoad(req.graph, req.entry, { externals, shims: { process: proc }, globals: { process: proc } });
    post({ type: 'done', exitCode: 0 });
  } catch (err: any) {
    if (err instanceof ExitSignal) {
      post({ type: 'done', exitCode: err.code });
    } else {
      post({ type: 'log', level: 'error', text: err?.stack?.split('\n').slice(0, 3).join('\n') ?? String(err) });
      post({ type: 'done', exitCode: 1 });
    }
  }
};

function makeProcess(argv: string[]) {
  return {
    __esModule: false,
    argv: ['node', ...argv],
    env: {},
    platform: 'browser',
    exitCode: 0,
    exit: (code = 0) => {
      throw new ExitSignal(code);
    },
    cwd: () => '/',
    stdout: { write: (s: string) => post({ type: 'log', level: 'log', text: String(s).replace(/\n$/, '') }) },
    stderr: { write: (s: string) => post({ type: 'log', level: 'error', text: String(s).replace(/\n$/, '') }) }
  };
}
