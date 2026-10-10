import { textForSave } from '@core/comments';
/**
 * Del proyecto (ruta → texto) a un grafo de módulos que el navegador puede
 * ejecutar: cada archivo TS/JS se transforma con Sucrase a CommonJS (rápido,
 * sin wasm, conserva los números de línea) y cada import se resuelve:
 * a otro archivo del proyecto, a texto (?raw, shaders), a CSS, a JSON, a un
 * paquete de npm (servido por esm.sh) o a un módulo simulado (vitest).
 */
import type { Transform } from 'sucrase';

export type Dep =
  | { t: 'mod'; path: string }
  | { t: 'raw'; text: string }
  | { t: 'css'; text: string; path: string }
  | { t: 'json'; value: unknown }
  | { t: 'ext'; url: string }
  | { t: 'shim'; name: string }
  | { t: 'missing'; message: string };

export interface ModuleRecord {
  code: string;
  deps: Record<string, Dep>;
}

export type Graph = Record<string, ModuleRecord>;

export interface CompileError {
  path: string;
  line?: number;
  message: string;
}

export interface BuildResult {
  graph: Graph;
  externals: string[];
  errors: CompileError[];
}

const CODE_EXT = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.mts', '.cts'];
const TEXT_EXT = ['.frag', '.vert', '.glsl', '.wgsl', '.txt', '.md', '.svg', '.html'];
const NODE_BUILTINS = new Set([
  'fs', 'path', 'os', 'child_process', 'http', 'https', 'net', 'crypto', 'url', 'util', 'stream', 'events',
  'readline', 'zlib', 'worker_threads', 'buffer', 'assert', 'fs/promises', 'timers', 'tty', 'module'
]);

export const SHIMS = new Set(['vitest', 'process', 'node:process']);

export function isCode(path: string): boolean {
  return CODE_EXT.some((e) => path.endsWith(e)) && !path.endsWith('.d.ts');
}

export function isTest(path: string): boolean {
  return /\.(test|spec)\.(m?[jt]sx?)$/.test(path);
}

function dirname(p: string): string {
  const i = p.lastIndexOf('/');
  return i < 0 ? '' : p.slice(0, i);
}

export function joinPath(base: string, rel: string): string {
  const out: string[] = [];
  for (const part of `${base}/${rel}`.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') out.pop();
    else out.push(part);
  }
  return out.join('/');
}

/** Versión de un paquete según package.json (para fijarla en esm.sh). */
function versionOf(files: Record<string, string>, name: string): string | undefined {
  try {
    const pkg = JSON.parse(textForSave('package.json', files['package.json'] ?? '{}'));
    const v = pkg.dependencies?.[name] ?? pkg.devDependencies?.[name];
    return typeof v === 'string' && /^[~^]?\d/.test(v) ? v : undefined;
  } catch {
    return undefined;
  }
}

export function esmUrl(files: Record<string, string>, spec: string): string {
  const parts = spec.split('/');
  const name = spec.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
  const rest = spec.slice(name.length);
  const v = versionOf(files, name);
  return `https://esm.sh/${name}${v ? `@${v}` : ''}${rest}`;
}

/** Resuelve un import desde un archivo del proyecto. */
export function resolveSpec(files: Record<string, string>, from: string, spec: string): Dep {
  const [bare, query] = spec.split('?');
  if (SHIMS.has(bare)) {
    return { t: 'shim', name: bare.replace(/^node:/, '') };
  }
  if (bare.startsWith('node:') || NODE_BUILTINS.has(bare)) {
    return {
      t: 'missing',
      message: `«${spec}» es un módulo de Node: en el navegador no existe. Este paso se corre en tu computadora (exporta el proyecto).`
    };
  }
  const local = bare.startsWith('.') ? joinPath(dirname(from), bare) : bare.startsWith('/') ? joinPath('', bare) : undefined;
  if (local === undefined) {
    return { t: 'ext', url: esmUrl(files, bare) };
  }
  const candidates = [local, ...CODE_EXT.map((e) => local + e), `${local}/index.ts`, `${local}/index.js`];
  // TypeScript permite importar «./x.js» refiriéndose a x.ts.
  if (/\.js$/.test(local)) candidates.push(local.replace(/\.js$/, '.ts'));
  const found = candidates.find((c) => c in files);
  if (!found) {
    return {
      t: 'missing',
      message: `No se encontró «${spec}» (importado desde ${from}): ese archivo todavía no existe o no tiene ese nombre.`
    };
  }
  const text = files[found];
  if (query === 'raw' || TEXT_EXT.some((e) => found.endsWith(e))) {
    return { t: 'raw', text };
  }
  if (found.endsWith('.css')) {
    return { t: 'css', text, path: found };
  }
  if (found.endsWith('.json')) {
    try {
      return { t: 'json', value: JSON.parse(textForSave(found, text)) };
    } catch {
      return { t: 'missing', message: `${found} no es JSON válido.` };
    }
  }
  return { t: 'mod', path: found };
}

const REQUIRE = /\brequire\(\s*(['"])([^'"]+)\1\s*\)/g;

type SucraseModule = typeof import('sucrase');
let sucrase: Promise<SucraseModule> | undefined;
const loadSucrase = () => (sucrase ??= import('sucrase'));

/** Construye el grafo desde una o varias entradas. */
export async function buildGraph(files: Record<string, string>, entries: string[]): Promise<BuildResult> {
  const { transform } = await loadSucrase();
  const graph: Graph = {};
  const externals = new Set<string>();
  const errors: CompileError[] = [];
  const queue = [...entries];
  while (queue.length) {
    const path = queue.shift()!;
    if (graph[path] || !(path in files)) continue;
    const source = files[path].replace(/\bimport\.meta\b/g, '__importMeta');
    const transforms: Transform[] = ['imports'];
    if (/\.m?tsx?$|\.cts$/.test(path)) transforms.unshift('typescript');
    if (/x$/.test(path)) transforms.push('jsx');
    let code: string;
    try {
      code = transform(source, { transforms, filePath: path, production: true, jsxRuntime: 'classic' }).code;
    } catch (err: any) {
      const m = String(err?.message ?? err).match(/\((\d+):(\d+)\)/);
      errors.push({ path, line: m ? Number(m[1]) : undefined, message: String(err?.message ?? err) });
      graph[path] = { code: `throw new SyntaxError(${JSON.stringify(`${path}: ${err?.message ?? err}`)});`, deps: {} };
      continue;
    }
    const deps: Record<string, Dep> = {};
    for (const m of code.matchAll(REQUIRE)) {
      const spec = m[2];
      if (deps[spec]) continue;
      const dep = resolveSpec(files, path, spec);
      deps[spec] = dep;
      if (dep.t === 'mod') queue.push(dep.path);
      if (dep.t === 'ext') externals.add(dep.url);
    }
    graph[path] = { code, deps };
  }
  return { graph, externals: [...externals], errors };
}

/**
 * Cargador CommonJS que corre el grafo: el mismo texto se usa en el worker
 * de tests y dentro del iframe de la vista previa.
 */
export const LOADER_SOURCE = String.raw`
function __achOffset() {
  // Líneas que agrega new Function antes del código (cambia entre motores).
  if (__achOffset.v !== undefined) return __achOffset.v;
  try { Function.apply(null, ['a', 'b', 'throw new Error("x")\n//# sourceURL=ach:///__probe'])(); }
  catch (e) { var m = /ach:\/\/\/__probe:(\d+)/.exec(String(e && e.stack)); __achOffset.v = m ? Number(m[1]) - 1 : 2; }
  return __achOffset.v;
}
/** Anota en el error el archivo y la línea del proyecto donde ocurrió. */
function __achWhere(err) {
  if (!err || typeof err !== 'object' || err.achFile) return err;
  var m = /ach:\/\/\/([^:)\s]+):(\d+)/.exec(String(err.stack || ''));
  if (m && m[1] !== '__probe') { try { err.achFile = m[1]; err.achLine = Math.max(1, Number(m[2]) - __achOffset()); } catch (e) {} }
  return err;
}
function __achLoad(graph, entry, ctx) {
  var cache = {};
  function interop(ns) {
    if (ns && ns.__esModule) return ns;
    var o = {};
    if (ns && typeof ns === 'object') for (var k in ns) o[k] = ns[k];
    Object.defineProperty(o, '__esModule', { value: true });
    if (!('default' in o)) o.default = ns;
    return o;
  }
  function load(path) {
    if (cache[path]) return cache[path].exports;
    var m = graph[path];
    var module = { exports: {} };
    cache[path] = module;
    var require = function (spec) {
      var d = m.deps[spec];
      if (!d) throw new Error('No se encontró «' + spec + '» desde ' + path);
      switch (d.t) {
        case 'mod': return load(d.path);
        case 'raw': return { __esModule: true, default: d.text };
        case 'css': if (ctx.onCss) ctx.onCss(d.text, d.path); return { __esModule: true, default: d.text };
        case 'json': return { __esModule: true, default: d.value };
        case 'ext': return interop(ctx.externals[d.url]);
        case 'shim': return ctx.shims[d.name];
        default: var e = new Error(d.message); e.achMissing = true; throw e;
      }
    };
    var meta = { env: { DEV: true, PROD: false, MODE: 'development' }, url: 'ach:///' + path };
    var globals = ctx.globals || {};
    var names = Object.keys(globals);
    var fn = Function.apply(null, ['require', 'module', 'exports', '__importMeta'].concat(names, [m.code + '\n//# sourceURL=ach:///' + path]));
    try {
      fn.apply(globals, [require, module, module.exports, meta].concat(names.map(function (n) { return globals[n]; })));
    } catch (err) {
      throw __achWhere(err);
    }
    return module.exports;
  }
  return load(entry);
}
`;
