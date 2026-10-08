import type React from 'react';
import { useApp } from '../store/app';
import { TopicStep, InterestStep, LevelStep, IdeasStep, DesignStep } from './FlowLearn';
import { ProjectPromptStep, StackStep, ArchStep } from './FlowProject';

interface StepDef {
  label: string;
  todo: string;
  done: boolean;
  render?: () => React.ReactNode;
}

/** Recorrido por pestañas: cada parte se superpone a la anterior, con ← Atrás. */
export function Flow() {
  const { kind, step, flows, setStep, openProject } = useApp();
  const n = step[kind];

  let defs: StepDef[];
  if (kind === 'project') {
    const f = flows.project;
    defs = [
      { label: 'Empezar', todo: 'elegir un camino', done: true },
      { label: 'Tu proyecto', todo: 'describe qué construyes', done: !!f.text.trim(), render: () => <ProjectPromptStep /> },
      { label: 'Stack', todo: 'elige con qué lo construyes', done: !!f.stack, render: () => <StackStep /> },
      { label: 'Arquitectura', todo: 'responde y crea el proyecto', done: !!f.projectId, render: () => <ArchStep /> },
      { label: 'Completar código', todo: 'escribir', done: false }
    ];
  } else {
    const f = flows[kind];
    const learn = kind === 'learn';
    defs = [
      { label: 'Empezar', todo: 'elegir un camino', done: true },
      learn
        ? { label: 'Tema', todo: 'escribe o elige qué aprender', done: !!f.text.trim(), render: () => <TopicStep /> }
        : { label: 'Tu interés', todo: 'cuéntame qué te interesa', done: !!f.text.trim(), render: () => <InterestStep /> },
      { label: 'Tu nivel', todo: 'elige desde dónde arrancas', done: !!f.nivel, render: () => <LevelStep k={kind} /> },
      { label: 'Proyecto', todo: 'elige un proyecto', done: !!f.idea, render: () => <IdeasStep k={kind} /> },
      { label: 'Diseño', todo: 'revisa el diseño y créalo', done: !!f.projectId, render: () => <DesignStep k={kind} /> },
      { label: 'Completar código', todo: 'escribir', done: false }
    ];
  }

  const last = defs.length - 1;
  const projectId = kind === 'project' ? flows.project.projectId : flows[kind].projectId;
  // Una pestaña está habilitada solo si las anteriores están completas.
  const enabled = (i: number) => defs.slice(1, i).every((d) => d.done);
  const goTo = (i: number) => {
    if (i === last) {
      if (projectId) openProject(projectId);
      return;
    }
    setStep(kind, i);
  };
  const cur = defs[n] ?? defs[1];

  return (
    <div className="flow">
      <nav className="steps" role="tablist" aria-label="Pasos">
        {defs.map((d, i) => (
          <button
            key={d.label}
            role="tab"
            className={`steptab${d.done && i > 0 && i < last ? ' done' : ''}`}
            aria-selected={i === n}
            disabled={i > 0 && (!enabled(i) || (i === last && !projectId))}
            onClick={() => goTo(i)}
          >
            {i > 0 && <span className="n">{d.done && i < last ? '✓' : i}</span>}
            {d.label}
          </button>
        ))}
      </nav>
      <div className="panel" role="tabpanel" aria-label={cur.label}>
        <div className="panel-inner">{cur.render?.()}</div>
      </div>
      <div className="bottombar">
        <button className="btn ghost" onClick={() => goTo(n - 1)}>
          ← Atrás
        </button>
        <span className="where">
          Paso {n} de {last} · {cur.done && n < last - 1 ? 'listo' : cur.todo}
        </span>
        <button className="btn primary" disabled={!cur.done || (n + 1 === last && !projectId)} onClick={() => goTo(n + 1)}>
          Siguiente →
        </button>
      </div>
    </div>
  );
}
