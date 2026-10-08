import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { environmentSteps, ProjectFile } from '@core/project';
import { runProgram, runTests, TestSummary } from '../runtime/runner';

export interface TermLine {
  id: number;
  kind: 'cmd' | 'out' | 'err' | 'ok' | 'warn' | 'note' | 'actions';
  text: string;
  actions?: { label: string; run: () => void }[];
}

export interface TerminalHandle {
  /** Escribe un comando en la entrada SIN ejecutarlo: lo lanza la persona. */
  prefill: (cmd: string, explanation?: string) => void;
  run: (cmd: string) => Promise<void>;
  print: (text: string, kind?: TermLine['kind']) => void;
}

interface Props {
  files: Record<string, string>;
  project?: ProjectFile;
  onPreview: () => void;
  onTests: (s: TestSummary) => void;
  onExplain?: (output: string) => void;
  onExport: () => void;
  hasAI: boolean;
}

let seq = 0;

/** Lo que el navegador no ejecuta: se explica y se copia. */
const LOCAL_ONLY = /^(python3?|py|pip3?|pytest|uv|poetry|docker|docker-compose|kubectl|helm|terraform|aws|az|gcloud|go|cargo|rustc|java|javac|mvn|gradle|dotnet|php|composer|ruby|rails|bundle|psql|mysql|mongosh|redis-cli|git|ssh|sudo|brew|apt|winget)\b/;

export const Terminal = forwardRef<TerminalHandle, Props>(function Terminal(props, ref) {
  const [lines, setLines] = useState<TermLine[]>([
    { id: seq++, kind: 'note', text: 'Terminal del navegador: corre los tests de JavaScript/TypeScript, programas con «npx tsx archivo.ts» y la vista previa con «npx vite». Lo demás (Python, Docker, la nube) se copia y se corre en tu computadora. Escribe «help».' }
  ]);
  const [input, setInput] = useState('');
  const [explain, setExplain] = useState('');
  const [busy, setBusy] = useState(false);
  const history = useRef<string[]>([]);
  const hIdx = useRef(-1);
  const out = useRef<HTMLDivElement>(null);
  const inp = useRef<HTMLInputElement>(null);
  const files = useRef(props.files);
  files.current = props.files;

  const print = (text: string, kind: TermLine['kind'] = 'out', actions?: TermLine['actions']) =>
    setLines((l) => [...l.slice(-400), { id: seq++, kind, text, actions }]);

  useEffect(() => {
    out.current?.scrollTo({ top: out.current.scrollHeight });
  }, [lines]);

  const explainFor = (cmd: string): string | undefined => {
    const env = environmentSteps(props.project?.entorno).find((c) => c.comando === cmd || c.windows === cmd);
    const step = props.project?.plan?.find((s) => s.comando === cmd);
    return env?.explicacion || step?.explicacion || undefined;
  };

  const localOnly = (cmd: string) => {
    const why = explainFor(cmd);
    print(`Esto no corre en el navegador: cópialo y córrelo en una terminal de tu computadora, dentro de la carpeta del proyecto exportado.${why ? `\nQué hace: ${why}` : ''}`, 'warn');
    print('', 'actions', [
      { label: 'Copiar el comando', run: () => void navigator.clipboard?.writeText(cmd) },
      { label: 'Exportar el proyecto (.zip)', run: props.onExport }
    ]);
  };

  const scripts = (): Record<string, string> => {
    try {
      return JSON.parse(files.current['package.json'] ?? '{}').scripts ?? {};
    } catch {
      return {};
    }
  };

  const doTests = async (filter: string[]) => {
    print('Corriendo los tests en el navegador…', 'note');
    const failures: string[] = [];
    const s = await runTests(
      files.current,
      {
        onLog: (lvl, t) => print(t, lvl === 'error' ? 'err' : lvl === 'warn' ? 'warn' : 'out'),
        onTest: (r) => {
          print(`${r.ok ? '✓' : '✗'} ${r.file} › ${r.name}${r.ok ? '' : `\n    ${r.error}${r.line ? ` (línea ${r.line})` : ''}`}`, r.ok ? 'ok' : 'err');
          if (!r.ok) failures.push(`${r.file} › ${r.name}: ${r.error}`);
        },
        onFileError: (f, e, line) => {
          print(`✗ ${f} no se pudo cargar: ${e}${line ? ` (línea ${line})` : ''}`, 'err');
          failures.push(`${f}: ${e}`);
        }
      },
      filter
    );
    for (const e of s.compileErrors) print(`✗ ${e.path}${e.line ? `:${e.line}` : ''} — ${e.message}`, 'err');
    if (!s.results.length && !s.fileErrors && !s.compileErrors.length) {
      const py = Object.keys(files.current).some((p) => /(^|\/)test_.*\.py$|_test\.py$/.test(p));
      print(py ? 'Los tests de Python se corren en tu computadora con pytest (en el navegador llegan más adelante).' : 'No hay archivos de test (*.test.ts) todavía.', 'warn');
    } else {
      const red = s.failed + s.fileErrors + s.compileErrors.length;
      print(red ? `Rojo: ${s.passed} pasaron, ${red} fallaron.` : `Verde: ${s.passed} ${s.passed === 1 ? 'test pasó' : 'tests pasaron'}.`, red ? 'err' : 'ok');
      if (red && props.hasAI && props.onExplain) {
        print('', 'actions', [{ label: 'Entender este error', run: () => props.onExplain!(failures.join('\n').slice(0, 3000)) }]);
      }
    }
    props.onTests(s);
  };

  const run = async (raw: string): Promise<void> => {
    const cmd = raw.trim();
    if (!cmd) return;
    history.current = [cmd, ...history.current.filter((h) => h !== cmd)].slice(0, 50);
    hIdx.current = -1;
    print(cmd, 'cmd');
    setExplain('');
    const words = cmd.split(/\s+/);
    const [a, b] = words;
    setBusy(true);
    try {
      if (cmd === 'clear') {
        setLines([]);
      } else if (cmd === 'help') {
        print(
          [
            'npx vitest run · npm test   corre los tests (rojo → verde)',
            'npx vite · npm run dev      abre la vista previa',
            'npx tsx archivo.ts args     corre un programa (también: node archivo.js)',
            'ls · cat archivo            lista y muestra archivos',
            'clear                       limpia la terminal'
          ].join('\n'),
          'note'
        );
      } else if (a === 'ls') {
        print(Object.keys(files.current).sort().join('\n') || '(vacío)');
      } else if (a === 'cat' && b) {
        print(b in files.current ? files.current[b] : `cat: ${b}: no existe`, b in files.current ? 'out' : 'err');
      } else if (/^(npx\s+)?vitest\b/.test(cmd) || /^npm\s+(run\s+)?test\b/.test(cmd) || (a === 'npm' && b === 'run' && /vitest/.test(scripts()[words[2]] ?? ''))) {
        const filter = /^(npx\s+)?vitest/.test(cmd) ? words.slice(a === 'npx' ? 2 : 1).filter((w) => w !== 'run' && !w.startsWith('-')) : [];
        await doTests(filter);
      } else if (/^(npx\s+)?vite\b/.test(cmd) || /^npm\s+run\s+(dev|preview)\b/.test(cmd) || (/^npm\s+(run\s+)?start$/.test(cmd) && /vite/.test(scripts().start ?? ''))) {
        print('Vista previa abierta: se recarga al guardar. Usa «Repetir» y la velocidad para estudiar el movimiento.', 'ok');
        props.onPreview();
      } else if (/^npx\s+tsx\b/.test(cmd) || a === 'tsx' || a === 'node' || (/^npm\s+(run\s+)?start$/.test(cmd) && /\b(tsx|node)\s/.test(scripts().start ?? ''))) {
        let parts = words;
        if (a === 'npm') parts = (scripts().start ?? '').split(/\s+/);
        if (parts[0] === 'npx') parts = parts.slice(1);
        const [, entry, ...args] = parts;
        if (!entry) {
          print('Falta el archivo: npx tsx src/main.ts', 'err');
        } else {
          const code = await runProgram(files.current, entry.replace(/^\.\//, ''), args, {
            onLog: (lvl, t) => print(t, lvl === 'error' ? 'err' : lvl === 'warn' ? 'warn' : 'out')
          });
          print(`(terminó con código ${code})`, code ? 'err' : 'note');
        }
      } else if (/^(npm|pnpm|yarn|bun)\s+(i|install|add|ci)\b/.test(cmd)) {
        print('En el navegador no hace falta instalar: los paquetes que usa la vista previa se descargan solos (esm.sh) y quedan guardados. En tu computadora sí hace falta.', 'note');
        const why = explainFor(cmd);
        if (why) print(`Qué hace: ${why}`, 'note');
      } else if (/^npm\s+run\s+\S+/.test(cmd)) {
        const s = scripts()[words[2]];
        if (s) await run(s);
        else print(`npm: no hay un script «${words[2]}» en package.json`, 'err');
      } else if (LOCAL_ONLY.test(cmd) || a === 'npx' || a === 'npm') {
        localOnly(cmd);
      } else {
        print(`No conozco «${a}» en el navegador.`, 'warn');
        localOnly(cmd);
      }
    } finally {
      setBusy(false);
    }
  };

  useImperativeHandle(ref, () => ({
    prefill: (cmd, explanation) => {
      setInput(cmd);
      setExplain(explanation ?? explainFor(cmd) ?? '');
      setTimeout(() => inp.current?.focus(), 50);
    },
    run,
    print: (t, k) => print(t, k)
  }));

  return (
    <div className="term">
      <div className="term-out" ref={out} role="log" aria-live="polite" aria-label="Salida de la terminal">
        {lines.map((l) =>
          l.kind === 'actions' ? (
            <div key={l.id} className="actions">
              {l.actions?.map((a) => (
                <button key={a.label} className="btn small" onClick={a.run}>
                  {a.label}
                </button>
              ))}
            </div>
          ) : (
            <div key={l.id} className={l.kind}>
              {l.text}
            </div>
          )
        )}
        {busy && <div className="note">…</div>}
      </div>
      {explain && <div className="term-explain">{explain} Pulsa Enter para correrlo.</div>}
      <form
        className="term-in"
        onSubmit={(e) => {
          e.preventDefault();
          const c = input;
          setInput('');
          void run(c);
        }}
      >
        <span aria-hidden="true">$</span>
        <input
          ref={inp}
          value={input}
          aria-label="Comando"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="go"
          placeholder="npx vitest run"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
              e.preventDefault();
              const h = history.current;
              hIdx.current = Math.max(-1, Math.min(h.length - 1, hIdx.current + (e.key === 'ArrowUp' ? 1 : -1)));
              setInput(hIdx.current < 0 ? '' : h[hIdx.current]);
            }
          }}
        />
      </form>
    </div>
  );
});
