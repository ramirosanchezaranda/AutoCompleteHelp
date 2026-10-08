import { useEffect, useMemo, useRef, useState } from 'react';
import { LEARN_TOPICS, TOPIC_KINDS } from '@core/learnCatalog';
import {
  LearnLevel,
  LearnSize,
  ProjectIdea,
  buildIdeasSystemPrompt,
  buildLearnSystemPrompt,
  curatedIdeas,
  folderNameFor,
  learnProjectFile,
  matchTopic,
  parseIdeas,
  parseLearnAnswer
} from '@core/learnTopics';
import { LESSONS, getLesson, lessonIdea, lessonsForTopic } from '@core/lessons';
import { getArchitecture } from '@core/architectures';
import { useApp } from '../store/app';
import { MissingKeyError, hasAI, llm } from '../lib/ai';
import { createFromLesson, createProject } from '../lib/projects';
import { Markdown } from './Markdown';

type K = 'learn' | 'recommend';

/** Tema: caja de texto arriba y el catálogo debajo, por áreas. */
export function TopicStep() {
  const { flows, setLearn, setStep } = useApp();
  const f = flows.learn;
  const match = f.text.trim() ? matchTopic(f.text) : undefined;
  const pick = (t: string) => {
    setLearn('learn', { text: t }, 'text');
    setStep('learn', 2);
  };
  return (
    <>
      <h2>¿Qué quieres aprender?</h2>
      <textarea
        className="notebook"
        rows={2}
        placeholder="Escribe lo que quieres aprender: Rust, patrones de API, Kubernetes, shaders…"
        value={f.text}
        aria-label="Escribe lo que quieres aprender"
        onChange={(e) => setLearn('learn', { text: e.target.value }, 'text')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && f.text.trim()) {
            e.preventDefault();
            setStep('learn', 2);
          }
        }}
      />
      {f.text.trim() && (
        <p className="help">{match ? `Se usa la semilla del catálogo: ${match.nombre} (${match.stack}).` : 'No está en el catálogo: la IA diseña el proyecto desde cero.'}</p>
      )}
      <div className="group-title">Lecciones sin IA</div>
      <div className="chips">
        {LESSONS.map((l) => (
          <button key={l.id} className="chip lesson" aria-pressed={f.text === l.tema} onClick={() => pick(l.tema)} title={l.titulo}>
            {l.tema}: {l.titulo}
          </button>
        ))}
      </div>
      {TOPIC_KINDS.map((k) => (
        <div key={k.tipo}>
          <div className="group-title">{k.titulo}</div>
          <div className="chips" style={{ marginTop: 6 }}>
            {LEARN_TOPICS.filter((t) => t.tipo === k.tipo).map((t) => (
              <button key={t.id} className="chip" aria-pressed={match?.id === t.id && f.text === t.nombre} onClick={() => pick(t.nombre)} title={t.stack}>
                {t.nombre}
              </button>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

export function InterestStep() {
  const { flows, setLearn, setStep } = useApp();
  const f = flows.recommend;
  return (
    <>
      <h2>¿Qué te interesa?</h2>
      <p className="help">Qué te gusta o para qué quieres aprender. La IA recomienda proyectos de temas distintos según eso.</p>
      <textarea
        className="notebook"
        rows={3}
        placeholder="Ej: quiero trabajar de backend, me gustan los videojuegos"
        value={f.text}
        aria-label="Lo que te interesa"
        onChange={(e) => setLearn('recommend', { text: e.target.value }, 'text')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && f.text.trim()) {
            e.preventDefault();
            setStep('recommend', 2);
          }
        }}
      />
      <div className="chips">
        {['quiero trabajar en la nube', 'automatizar mi trabajo con Excel', 'me gustan los videojuegos', 'diseño y animación web'].map((x) => (
          <button key={x} className="chip" onClick={() => setLearn('recommend', { text: x }, 'text')}>
            {x}
          </button>
        ))}
      </div>
    </>
  );
}

const LEVELS: { v: LearnLevel; t: string; d: string }[] = [
  { v: 'cero', t: 'Desde cero', d: 'nunca programé' },
  { v: 'otro-lenguaje', t: 'Ya programo en otra cosa', d: 'otro lenguaje o herramienta' },
  { v: 'algo', t: 'Lo usé un poco', d: 'quiero entenderlo de verdad' }
];

export function LevelStep({ k }: { k: K }) {
  const { flows, setLearn, setStep } = useApp();
  const f = flows[k];
  return (
    <>
      <h2>{k === 'learn' ? `Aprender ${f.text.trim()}` : 'Recomiéndame un proyecto'}: ¿desde dónde arrancas?</h2>
      <div className="choices" role="radiogroup" aria-label="Tu nivel">
        {LEVELS.map((l) => (
          <button
            key={l.v}
            className="choice"
            role="radio"
            aria-checked={f.nivel === l.v}
            onClick={() => {
              setLearn(k, { nivel: l.v }, 'nivel');
              setStep(k, 3);
            }}
          >
            <span className="t">{l.t}</span>
            <span className="d">{l.d}</span>
          </button>
        ))}
      </div>
    </>
  );
}

const DIF = { baja: 'sencilla', media: 'intermedia', alta: 'ambiciosa' };

/** Proyecto: primero las lecciones sin IA del tema; después, las recomendaciones. */
export function IdeasStep({ k }: { k: K }) {
  const { flows, setLearn, setStep, ai, openAIDialog, notify } = useApp();
  const f = flows[k];
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [own, setOwn] = useState('');
  const asked = useRef(false);
  const loading = useRef('');
  const withAI = hasAI(ai);
  const topic = k === 'learn' ? matchTopic(f.text) : undefined;
  const key = `${f.text.trim()}|${f.nivel}|${withAI ? ai.providerId : 'sin'}`;

  const load = async (previous: string[] = []) => {
    setBusy(true);
    setErr('');
    const lessons = (k === 'recommend' ? LESSONS : lessonsForTopic(topic?.id)).map(lessonIdea);
    let ideas: ProjectIdea[] = [];
    if (withAI) {
      try {
        const answer = await llm(
          ai,
          buildIdeasSystemPrompt({ tema: k === 'recommend' ? undefined : f.text.trim(), nivel: f.nivel ?? 'cero', interes: k === 'recommend' ? f.text.trim() : undefined, topic }),
          previous.length ? `Recomiéndame otros, distintos de: ${previous.join('; ')}` : 'Recomiéndame proyectos.',
          1500
        );
        ideas = parseIdeas(answer);
        if (!ideas.length) setErr('La respuesta no trajo proyectos válidos; quedan los del catálogo.');
      } catch (e: any) {
        setErr(e instanceof MissingKeyError ? `${e.message} Escríbela en «Cambiar IA».` : String(e?.message ?? e));
      }
    }
    if (!ideas.length && topic) ideas = curatedIdeas(topic);
    const lessonTitles = new Set(lessons.map((l) => l.titulo.toLowerCase()));
    setLearn(k, { ideas: [...lessons, ...ideas.filter((i) => !lessonTitles.has(i.titulo.toLowerCase()))], ideasKey: key }, 'ideas');
    setBusy(false);
  };

  useEffect(() => {
    // La primera vez que algo necesita IA se pregunta cómo usarla.
    if (!ai.chosen && !asked.current) {
      asked.current = true;
      openAIDialog();
    }
    if (f.ideasKey !== key && loading.current !== key) {
      loading.current = key;
      void load();
    }
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  const choose = (idea: ProjectIdea) => {
    if (!idea.leccion && !withAI) {
      notify(`«${idea.titulo}» lo diseña la IA. Sin IA están las lecciones ya escritas.`, 'warn');
      openAIDialog();
      return;
    }
    setLearn(k, { idea }, 'idea');
    setStep(k, 4);
  };

  const ideas = f.ideasKey === key ? f.ideas ?? [] : [];
  return (
    <>
      <h2>Proyectos para {k === 'learn' ? `aprender ${f.text.trim()}` : 'ti'}</h2>
      {busy && (
        <div className="loading" role="status">
          <span className="spinner" /> {withAI ? 'La IA está eligiendo proyectos para tu nivel…' : 'Buscando…'}
        </div>
      )}
      {err && <div className="callout bad">{err}</div>}
      {!busy && !ideas.length && (
        <div className="callout">
          {withAI ? 'No llegaron recomendaciones.' : 'Sin IA no hay proyectos para este tema todavía: elige una lección sin IA o activa una IA.'}
        </div>
      )}
      <div className="choices" role="radiogroup" aria-label="Proyectos">
        {ideas.map((i) => (
          <button key={`${i.leccion ?? ''}${i.titulo}`} className="choice" role="radio" aria-checked={f.idea?.titulo === i.titulo} onClick={() => choose(i)}>
            <span className="t">{i.leccion ? '📗 ' : ''}{i.titulo}</span>
            <span className="d">{i.descripcion}</span>
            {i.aprendes.length > 0 && <span className="d">Aprendes: {i.aprendes.join(', ')}.</span>}
            <span className="meta">
              {i.leccion && <span className="tag lesson">sin IA</span>}
              {k === 'recommend' && i.tema && <span className="tag">{i.tema}</span>}
              {i.duracion && <span className="tag">{DIF[i.dificultad]} · {i.duracion}</span>}
              {i.docker && <span className="tag">Docker</span>}
              {i.nube && <span className="tag">nube</span>}
              {!i.leccion && !withAI && <span className="tag needs">necesita IA</span>}
            </span>
          </button>
        ))}
      </div>
      <div className="row">
        {withAI ? (
          <button className="btn" disabled={busy} onClick={() => load(ideas.filter((i) => !i.leccion).map((i) => i.titulo))}>
            Otras recomendaciones
          </button>
        ) : (
          <button className="btn" onClick={() => openAIDialog()}>
            Elegir una IA para recomendaciones
          </button>
        )}
      </div>
      {k === 'learn' && withAI && (
        <div className="field">
          <label htmlFor="own">O escribe tu propia idea de proyecto</label>
          <div className="row" style={{ flexWrap: 'nowrap' }}>
            <input id="own" className="input" value={own} placeholder="Ej: un bot que me recuerde tomar agua" onChange={(e) => setOwn(e.target.value)} />
            <button
              className="btn"
              disabled={!own.trim()}
              onClick={() => choose({ titulo: own.trim(), descripcion: own.trim(), aprendes: [], dificultad: 'media', duracion: '', docker: false, nube: false, tema: f.text.trim() })}
            >
              Usar
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const SIZES: { v: LearnSize; t: string; d: string }[] = [
  { v: 'corto', t: 'Corto', d: '6 a 8 pasos · una o dos horas' },
  { v: 'mediano', t: 'Mediano', d: '10 a 12 pasos · un fin de semana' },
  { v: 'completo', t: 'Completo', d: '14 a 18 pasos · un proyecto entero' }
];

/** Diseño: qué se va a construir, con qué y cómo; y el botón para crearlo. */
export function DesignStep({ k }: { k: K }) {
  const { flows, setLearn, ai, openProject, openAIDialog, notify } = useApp();
  const f = flows[k];
  const idea = f.idea!;
  const lesson = getLesson(idea?.leccion);
  const [busy, setBusy] = useState(false);
  const [lines, setLines] = useState(0);
  const [err, setErr] = useState('');
  const abort = useRef<AbortController | undefined>(undefined);
  useEffect(() => () => abort.current?.abort(), []);

  const tema = k === 'recommend' ? idea?.tema || idea?.titulo : f.text.trim();
  const topic = useMemo(() => matchTopic(k === 'recommend' ? `${idea?.tema ?? ''} ${idea?.titulo ?? ''}` : f.text), [k, idea, f.text]);
  const key = `${idea?.titulo}|${f.tamano}|${f.nivel}`;
  const design = f.designKey === key ? f.design : undefined;

  if (!idea) return <p>Elige un proyecto primero.</p>;

  const create = async () => {
    if (lesson) {
      const p = await createFromLesson(lesson);
      setLearn(k, { projectId: p.id });
      openProject(p.id);
      return;
    }
    if (!design?.proposal || !f.nivel) return;
    const project = learnProjectFile(design.proposal, { tema: tema!, nivel: f.nivel });
    const p = await createProject(folderNameFor(tema!), project, design.markdown, tema!);
    setLearn(k, { projectId: p.id });
    notify('Proyecto creado. Abre un paso del plan para empezar a escribir.');
    openProject(p.id);
  };

  const run = async () => {
    if (!hasAI(ai)) {
      openAIDialog(() => void run());
      return;
    }
    abort.current?.abort();
    abort.current = new AbortController();
    setBusy(true);
    setErr('');
    setLines(0);
    try {
      const answer = await llm(
        ai,
        buildLearnSystemPrompt({ tema: tema!, nivel: f.nivel ?? 'cero', tamano: f.tamano ?? 'corto', topic, idea }),
        `Quiero aprender: ${tema}. Proyecto: ${idea.titulo}`,
        6000,
        { signal: abort.current.signal, onDelta: (_d, total) => setLines(total.split('\n').length) }
      );
      const parsed = parseLearnAnswer(answer);
      setLearn(k, { design: parsed, designKey: key }, 'design');
      if (!parsed.proposal) setErr('La respuesta no trajo un plan válido. Vuelve a intentarlo; la guía quedó abajo.');
    } catch (e: any) {
      if (e?.name !== 'AbortError') setErr(e instanceof MissingKeyError ? `${e.message} Escríbela en «Cambiar IA».` : `No se pudo diseñar el proyecto: ${e?.message ?? e}`);
    } finally {
      setBusy(false);
    }
  };

  if (lesson) {
    const arch = getArchitecture(lesson.arquitectura);
    const tests = lesson.plan.filter((s) => s.tipo === 'test').length;
    return (
      <>
        <h2>{lesson.titulo}</h2>
        <dl className="facts">
          <dt>Tema</dt><dd>{lesson.tema} · lección sin IA (funciona sin conexión)</dd>
          <dt>Stack</dt><dd>{lesson.stack.resumen}</dd>
          <dt>Arquitectura</dt><dd>{arch?.nombre}: {arch?.resumen}</dd>
          <dt>Pasos</dt><dd>{lesson.plan.length} ({tests} de tests) · {lesson.duracion}</dd>
        </dl>
        <button className="btn primary" onClick={create}>Crear el proyecto</button>
        <Markdown text={lesson.guia} />
      </>
    );
  }

  const p = design?.proposal;
  const arch = getArchitecture(p?.arquitectura);
  return (
    <>
      <h2>{idea.titulo}</h2>
      <p className="help">{idea.descripcion}</p>
      <div className="field">
        <label>Tamaño del proyecto</label>
        <div className="choices" role="radiogroup" aria-label="Tamaño">
          {SIZES.map((s) => (
            <button key={s.v} className="choice" role="radio" aria-checked={(f.tamano ?? 'corto') === s.v} onClick={() => setLearn(k, { tamano: s.v }, 'tamano')}>
              <span className="t">{s.t}</span>
              <span className="d">{s.d}</span>
            </button>
          ))}
        </div>
      </div>
      {!design && !busy && (
        <button className="btn primary" onClick={run}>
          Diseñar el proyecto
        </button>
      )}
      {busy && (
        <div className="loading" role="status">
          <span className="spinner" /> Diseñando «{idea.titulo}»… {lines > 1 ? `${lines} líneas` : ''}
          <button className="btn small ghost" onClick={() => abort.current?.abort()}>Cancelar</button>
        </div>
      )}
      {err && <div className="callout bad">{err}</div>}
      {p && (
        <>
          <dl className="facts">
            <dt>Tema</dt><dd>{tema}</dd>
            <dt>Stack</dt><dd>{p.stack.resumen ?? Object.values(p.stack).join(', ')}</dd>
            {arch && (<><dt>Arquitectura</dt><dd>{arch.nombre}. Por qué: {arch.resumen} {arch.cuandoSi[0]}.</dd></>)}
            <dt>Pasos</dt><dd>{p.plan.length} ({p.plan.filter((s) => s.tipo === 'test').length} de tests){p.entorno?.docker ? ' · con Docker' : ''}</dd>
            <dt>Tamaño</dt><dd>{SIZES.find((s) => s.v === (f.tamano ?? 'corto'))?.t}</dd>
          </dl>
          <div className="row">
            <button className="btn primary" onClick={create}>Crear el proyecto</button>
            <button className="btn ghost" onClick={run} disabled={busy}>Diseñar otra vez</button>
          </div>
        </>
      )}
      {design && <Markdown text={design.markdown} />}
    </>
  );
}
