import { useEffect, useRef, useState } from 'react';
import { buildPreview, mapShaderError, PreviewMessage } from '../runtime/preview';
import type { LineError } from './CodeEditor';

interface Props {
  files: Record<string, string>;
  /** Cambia cuando se guarda: la vista previa se recarga. */
  version: number;
  onShaderErrors: (errs: Record<string, LineError[]>) => void;
}

const SPEEDS = [0.25, 0.5, 1];

/** Vista previa en vivo: iframe con sandbox, recarga al guardar, Repetir y velocidad. */
export function Preview({ files, version, onShaderErrors }: Props) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [html, setHtml] = useState('');
  const [empty, setEmpty] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [logs, setLogs] = useState<{ level: string; text: string }[]>([]);
  const [reload, setReload] = useState(0);
  const filesRef = useRef(files);
  filesRef.current = files;
  const wgsl = Object.keys(files).some((p) => p.endsWith('.wgsl'));

  useEffect(() => {
    let alive = true;
    const t = setTimeout(async () => {
      const p = await buildPreview(filesRef.current, speed);
      if (!alive) return;
      setEmpty(p.empty);
      setLogs(p.errors.map((e) => ({ level: 'error', text: `${e.path}${e.line ? `:${e.line}` : ''} — ${e.message}` })));
      onShaderErrors({});
      setHtml(p.html);
    }, 250);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [version, reload]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const on = (e: MessageEvent<PreviewMessage>) => {
      if (e.source !== frame.current?.contentWindow || !e.data || typeof e.data !== 'object' || !('ach' in e.data)) return;
      const m = e.data;
      if (m.ach === 'log') setLogs((l) => [...l.slice(-100), { level: m.level, text: m.text }]);
      else if (m.ach === 'error') {
        setLogs((l) => [...l.slice(-100), { level: 'error', text: `${m.message}${m.file ? ` (${m.file}${m.line ? `, línea ${m.line}` : ''})` : ''}` }]);
      } else if (m.ach === 'shader') {
        const r = mapShaderError(filesRef.current, m.source, m.log);
        setLogs((l) => [...l.slice(-100), { level: 'error', text: `Shader: ${r.message}${r.path ? ` (${r.path}${r.line ? `, línea ${r.line}` : ''})` : ''}` }]);
        if (r.path && r.line) onShaderErrors({ [r.path]: [{ line: r.line, message: r.message }] });
      }
    };
    window.addEventListener('message', on);
    return () => window.removeEventListener('message', on);
  }, [onShaderErrors]);

  const changeSpeed = (v: number) => {
    setSpeed(v);
    frame.current?.contentWindow?.postMessage({ ach: 'speed', value: v }, '*');
  };

  return (
    <div className="preview">
      <div className="preview-bar">
        <button className="btn small" onClick={() => { setLogs([]); setReload((r) => r + 1); }}>
          Repetir
        </button>
        <span style={{ fontSize: 14, color: 'var(--ink-2)', marginLeft: 6 }}>Velocidad</span>
        <div className="seg" role="radiogroup" aria-label="Velocidad">
          {SPEEDS.map((s) => (
            <button key={s} className="chip" role="radio" aria-checked={speed === s} aria-pressed={speed === s} onClick={() => changeSpeed(s)}>
              {s}×
            </button>
          ))}
        </div>
      </div>
      {wgsl && !(navigator as any).gpu && (
        <div className="callout" style={{ margin: 8 }}>
          Este navegador no tiene WebGPU. Funciona en Chrome y Edge actuales (y en Safari 26). La teoría y los tests siguen funcionando.
        </div>
      )}
      {empty ? (
        <div className="empty">Todavía no hay nada para ver: falta index.html o src/main. Completa esos pasos y vuelve.</div>
      ) : (
        <iframe key={reload} ref={frame} title="Vista previa del proyecto" sandbox="allow-scripts allow-modals" srcDoc={html} />
      )}
      {logs.length > 0 && (
        <div className="console" aria-label="Consola de la vista previa">
          {logs.map((l, i) => (
            <div key={i} className={l.level === 'error' ? 'err' : ''}>
              {l.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
