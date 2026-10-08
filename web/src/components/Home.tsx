import { useEffect, useRef, useState } from 'react';
import { START_BOXES } from '@core/start';
import type { StartKind } from '@core/start';
import { useApp } from '../store/app';
import { listProjects, ProjectSummary } from '../lib/projectIndex';

/** Empezar: tres caminos, cada uno con su caja de texto. */
export function Home() {
  const { kind, setKind, flows, setLearn, setProjectFlow, setStep, openProject } = useApp();
  const [last, setLast] = useState<ProjectSummary | undefined>();
  const ta = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    void listProjects().then((l) => setLast(l[0]));
  }, []);

  const text = kind === 'project' ? flows.project.text : flows[kind].text;
  const setText = (v: string) => {
    if (kind === 'project') setProjectFlow({ text: v }, 'text');
    else setLearn(kind, { text: v }, 'text');
  };
  // Lo escrito arranca el camino saltando los pasos ya respondidos.
  const go = () => setStep(kind, text.trim() ? 2 : 1);
  const box = START_BOXES.find((b) => b.kind === kind)!;

  const onTabKey = (e: React.KeyboardEvent, i: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const next = START_BOXES[(i + (e.key === 'ArrowRight' ? 1 : START_BOXES.length - 1)) % START_BOXES.length];
    setKind(next.kind as StartKind);
    document.getElementById(`tab-${next.kind}`)?.focus();
  };

  return (
    <div className="home">
      <div className="home-inner">
        <h1>Aprende a programar escribiendo cada línea.</h1>
        <div className="model-line" aria-hidden="true">
          <span className="typed">const total = gastos.re</span>
          <span className="caret">d</span>uce((s, g) =&gt; s + g.monto, 0);
        </div>
        <p className="lead">El código aparece en gris, una línea a la vez, con su explicación arriba. Tú lo escribes encima. Tab no completa nada.</p>

        <div className="tabs" role="tablist" aria-label="Cómo quieres empezar">
          {START_BOXES.map((b, i) => (
            <button
              key={b.kind}
              id={`tab-${b.kind}`}
              role="tab"
              className="tab"
              aria-selected={kind === b.kind}
              aria-controls="start-pane"
              tabIndex={kind === b.kind ? 0 : -1}
              onClick={() => setKind(b.kind as StartKind)}
              onKeyDown={(e) => onTabKey(e, i)}
              title={b.titulo}
            >
              {b.tab.replace(/^\S+\s/, '')}
            </button>
          ))}
        </div>
        <section className="pane" id="start-pane" role="tabpanel" aria-labelledby={`tab-${kind}`}>
          <p>{box.ayuda}</p>
          <textarea
            ref={ta}
            className="notebook"
            rows={3}
            placeholder={box.placeholder}
            aria-label={box.titulo}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                go();
              }
            }}
          />
          <div className="chips" aria-label="Ejemplos">
            {box.ejemplos.map((ex) => (
              <button key={ex} className="chip" onClick={() => { setText(ex); ta.current?.focus(); }}>
                {ex}
              </button>
            ))}
          </div>
          <button className="btn primary" onClick={go}>
            {box.boton.replace(/\s*→$/, '')}
          </button>
        </section>

        {last && (
          <div className="resume">
            <span className="t">
              Seguir con <b>{last.name}</b> · {last.done} de {last.total} pasos
            </span>
            <button className="btn small" onClick={() => openProject(last.id)}>
              Abrir
            </button>
          </div>
        )}
        <p className="home-foot">En los tres caminos todo se completa escribiendo: el código y la teoría.</p>
      </div>
    </div>
  );
}
