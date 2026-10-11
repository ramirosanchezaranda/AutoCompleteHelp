/**
 * Vista previa: arma una página autocontenida (srcdoc) con el index.html del
 * proyecto y su código, para un iframe con sandbox y origen aislado (el
 * código del proyecto no puede tocar la app). Incluye un «puente» que manda a
 * la app la consola, los errores y los errores de compilación de shaders, y
 * que permite cambiar la velocidad para estudiar el movimiento.
 */
import { LOADER_SOURCE, buildGraph, joinPath } from './graph';

export interface PreviewBuild {
  html: string;
  errors: { path: string; line?: number; message: string }[];
  /** No hay nada para mostrar (sin index.html ni src/main). */
  empty: boolean;
  /** El proyecto dibuja con WebGPU: la vista previa avisa si el navegador lo tiene. */
  webgpu: boolean;
}

/** Mensajes que manda el iframe. */
export type PreviewMessage =
  | { ach: 'log'; level: 'log' | 'warn' | 'error'; text: string }
  | { ach: 'error'; message: string; file?: string; line?: number }
  | { ach: 'shader'; source: string; log: string }
  | { ach: 'gpu'; ok: boolean; reason: string; adapter: string }
  | { ach: 'ready' };

const BRIDGE = String.raw`
(function () {
  var post = function (m) { try { parent.postMessage(m, '*'); } catch (e) {} };
  var fmt = function (v) { if (typeof v === 'string') return v; if (v instanceof Error) return v.stack || v.message; try { return JSON.stringify(v); } catch (e) { return String(v); } };
  ['log', 'info', 'warn', 'error'].forEach(function (lvl) {
    var orig = console[lvl];
    console[lvl] = function () {
      var args = [].slice.call(arguments);
      post({ ach: 'log', level: lvl === 'info' ? 'log' : lvl, text: args.map(fmt).join(' ') });
      return orig.apply(console, args);
    };
  });
  var report = function (err, fallback) { var w = __achWhere(err) || {}; post({ ach: 'error', message: String((err && err.message) || fallback || err), file: w.achFile, line: w.achLine }); };
  window.__achReport = report;
  window.addEventListener('error', function (e) { report(e.error, e.message); });
  window.addEventListener('unhandledrejection', function (e) { report(e.reason); });

  // Shaders: si uno no compila, el error de la GPU llega a la app con el código.
  [window.WebGL2RenderingContext, window.WebGLRenderingContext].forEach(function (C) {
    if (!C) return;
    var P = C.prototype, src = new WeakMap();
    var shaderSource = P.shaderSource, compile = P.compileShader;
    P.shaderSource = function (sh, s) { src.set(sh, s); return shaderSource.call(this, sh, s); };
    P.compileShader = function (sh) {
      var r = compile.call(this, sh);
      if (!this.getShaderParameter(sh, this.COMPILE_STATUS)) post({ ach: 'shader', source: src.get(sh) || '', log: this.getShaderInfoLog(sh) || '' });
      return r;
    };
  });

  // Velocidad (0.25×, 0.5×, 1×): un reloj virtual para requestAnimationFrame,
  // performance.now, las animaciones CSS/WAAPI y GSAP.
  var speed = 1, raf = window.requestAnimationFrame.bind(window), realNow = performance.now.bind(performance);
  var lastReal = realNow(), virt = lastReal;
  var clock = function () { var r = realNow(); virt += (r - lastReal) * speed; lastReal = r; return virt; };
  performance.now = clock;
  window.requestAnimationFrame = function (cb) { return raf(function () { cb(clock()); }); };
  var applySpeed = function () {
    if (document.getAnimations) document.getAnimations().forEach(function (a) { a.playbackRate = speed; });
    if (window.__achGsap) window.__achGsap.globalTimeline.timeScale(speed);
  };
  setInterval(applySpeed, 250);
  window.addEventListener('message', function (e) {
    if (e.data && e.data.ach === 'speed') { clock(); speed = Number(e.data.value) || 1; applySpeed(); }
  });
  window.__achSpeed = function () { return speed; };
})();
`;

/**
 * WebGPU dentro de la vista previa: si el navegador no lo tiene, librerías como
 * Shaders dejan el lienzo transparente sin avisar. Se pregunta en el iframe
 * (que es donde corre el código) y la app muestra el resultado.
 */
const GPU_PROBE = String.raw`
(function () {
  var post = function (m) { try { parent.postMessage(m, '*'); } catch (e) {} };
  var done = function (ok, reason, adapter) { post({ ach: 'gpu', ok: ok, reason: reason, adapter: adapter || '' }); };
  if (!window.isSecureContext) return done(false, 'insecure');
  if (!navigator.gpu) return done(false, 'unsupported');
  navigator.gpu.requestAdapter().then(function (a) {
    if (!a) return done(false, 'no-adapter');
    var i = a.info || {};
    done(true, '', [i.vendor, i.architecture].filter(Boolean).join(' '));
  }, function (e) { done(false, 'error: ' + (e && e.message)); });
})();
`;

/** ¿El proyecto usa WebGPU? (shaders WGSL, la librería Shaders, TypeGPU, Three.js con WebGPU o la API directa). */
export function usesWebGPU(files: Record<string, string>): boolean {
  return Object.entries(files).some(
    ([path, text]) =>
      path.endsWith('.wgsl') ||
      (/\.(m?[jt]sx?|html)$/.test(path) && /navigator\.gpu|from\s+["'](shaders(\/[\w-]+)?|typegpu|three\/webgpu|three\/tsl)["']/.test(text))
  );
}

function safeJson(v: unknown): string {
  return JSON.stringify(v).replace(/</g, '\\u003c').replace(/[\u2028\u2029]/g, (c) => (c === '\u2028' ? '\\u2028' : '\\u2029'));
}

function defaultHtml(entry: string): string {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Vista previa</title></head><body><div id="app"></div><script type="module" src="/${entry}"></script></body></html>`;
}

export async function buildPreview(files: Record<string, string>, speed = 1): Promise<PreviewBuild> {
  const entryGuess = ['src/main.ts', 'src/main.js', 'src/main.tsx', 'main.js', 'main.ts', 'script.js', 'js/main.js'].find((p) => p in files);
  const htmlPath = ['index.html', 'public/index.html'].find((p) => p in files);
  if (!htmlPath && !entryGuess) {
    return { html: '', errors: [], empty: true, webgpu: false };
  }
  let html = htmlPath ? files[htmlPath] : defaultHtml(entryGuess!);
  // Una instrucción «ach:» sin código debajo todavía: la página aún no existe.
  if (htmlPath && !/<\w/.test(html.replace(/<!--[\s\S]*?-->/g, ''))) {
    html = entryGuess ? defaultHtml(entryGuess) : '<!doctype html><p style="font:16px system-ui;padding:16px">index.html todavía está vacío: completa su paso para ver la página.</p>';
  }

  // Hojas de estilo locales → en línea.
  html = html.replace(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi, (tag) => {
    const href = tag.match(/href=["']([^"']+)["']/i)?.[1];
    if (!href || /^https?:/.test(href)) return tag;
    const path = joinPath('', href);
    return path in files ? `<style data-file="${path}">\n${files[path]}\n</style>` : tag;
  });

  // Scripts locales: módulos del proyecto (los corre el cargador) o clásicos (en línea).
  const entries: string[] = [];
  html = html.replace(/<script\b([^>]*)\bsrc=["']([^"']+)["']([^>]*)>\s*<\/script>/gi, (tag, a: string, src: string, b: string) => {
    if (/^https?:/.test(src)) return tag;
    const path = joinPath('', src);
    if (!(path in files)) return `<!-- falta ${path} -->`;
    if (/type=["']module["']/i.test(a + b) || /\.tsx?$/.test(path)) {
      entries.push(path);
      return '';
    }
    return `<script>\n${files[path]}\n//# sourceURL=ach:///${path}\n</script>`;
  });

  const { graph, externals, errors } = await buildGraph(files, entries);
  const webgpu = usesWebGPU(files);
  const head = `<script>${BRIDGE}\n${webgpu ? GPU_PROBE : ''}\n${LOADER_SOURCE}</script>`;
  const boot = `<script type="module">
const urls = ${safeJson(externals)};
const graph = ${safeJson(graph)};
const entries = ${safeJson(entries)};
const externals = {};
try {
  for (const u of urls) {
    externals[u] = await import(u);
    const ns = externals[u];
    const g = ns && (ns.gsap || (ns.default && ns.default.globalTimeline ? ns.default : null));
    if (g && g.globalTimeline) window.__achGsap = g;
  }
  const onCss = (text, path) => { const s = document.createElement('style'); s.dataset.file = path; s.textContent = text; document.head.appendChild(s); };
  for (const e of entries) __achLoad(graph, e, { externals, shims: {}, onCss, globals: {} });
} catch (err) {
  window.__achReport(err);
}
parent.postMessage({ ach: 'ready' }, '*');
${speed !== 1 ? `window.postMessage({ ach: 'speed', value: ${speed} }, '*');` : ''}
</script>`;

  if (/<head[^>]*>/i.test(html)) html = html.replace(/<head[^>]*>/i, (m) => `${m}\n${head}`);
  else html = head + html;
  if (/<\/body>/i.test(html)) html = html.replace(/<\/body>/i, `${boot}\n</body>`);
  else html += boot;
  return { html, errors, empty: false, webgpu };
}

/**
 * Error de un shader → archivo y línea del proyecto. WebGL exige #version en
 * la primera línea y el archivo empieza con comentarios: el código que
 * compila lo antepone. Se busca qué archivo forma parte del código compilado
 * y se descuentan las líneas agregadas antes.
 */
export function mapShaderError(files: Record<string, string>, source: string, log: string): { path?: string; line?: number; message: string } {
  const m = log.match(/ERROR:\s*\d+:(\d+):\s*(.*)/);
  const message = m ? m[2].trim() : log.trim();
  const srcLine = m ? Number(m[1]) : undefined;
  for (const [path, text] of Object.entries(files)) {
    if (!/\.(frag|vert|glsl)$/.test(path)) continue;
    const body = text.trim();
    const at = body ? source.indexOf(body) : -1;
    if (at < 0) continue;
    const before = source.slice(0, at).split('\n').length - 1;
    const lead = text.slice(0, text.length - text.trimStart().length).split('\n').length - 1;
    return { path, line: srcLine !== undefined ? Math.max(1, srcLine - before + lead) : undefined, message };
  }
  return { message, line: srcLine };
}
