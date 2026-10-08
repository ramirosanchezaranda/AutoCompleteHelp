import { useMemo, useState } from 'react';
import { PROFILES, getProfile, matchProfile, packageName } from '@core/stackProfiles';
import {
  ARCHITECTURES,
  AppKind,
  ArchAnswers,
  Architecture,
  appKindForProfile,
  architectureDoc,
  explainArchitecture,
  getArchitecture,
  recommendArchitecture
} from '@core/architectures';
import { buildStackSystemPrompt } from '@core/prompts';
import { mergeWithProfile, splitStackAnswer } from '@core/stack';
import type { ProjectFile } from '@core/project';
import { useApp } from '../store/app';
import { MissingKeyError, hasAI, llm } from '../lib/ai';
import { createProjectWith } from '../lib/projects';
import { Markdown } from './Markdown';

export function ProjectPromptStep() {
  const { flows, setProjectFlow, setStep } = useApp();
  const f = flows.project;
  return (
    <>
      <h2>¿Qué proyecto quieres construir?</h2>
      <p className="help">Qué construyes y cómo quieres que te expliquen. No hace falta saber de tecnología.</p>
      <textarea
        className="notebook"
        rows={4}
        placeholder="Ej: e-commerce completa, explica cada código que agregues y por qué elegiste esa metodología"
        value={f.text}
        aria-label="Tu proyecto"
        onChange={(e) => setProjectFlow({ text: e.target.value }, 'text')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && f.text.trim()) {
            e.preventDefault();
            setStep('project', 2);
          }
        }}
      />
    </>
  );
}

export function StackStep() {
  const { flows, setProjectFlow, setStep, ai, openAIDialog } = useApp();
  const f = flows.project;
  const [other, setOther] = useState(f.stack?.preferred && !f.stack.profileId ? f.stack.preferred : '');
  const withAI = hasAI(ai);
  const choose = (stack: NonNullable<typeof f.stack>) => {
    setProjectFlow({ stack }, 'stack');
    setStep('project', 3);
  };
  return (
    <>
      <h2>¿Con qué lo construyes?</h2>
      <p className="help">Stacks curados para aprender (traen su plan base y funcionan sin IA), el que tú quieras, o una recomendación.</p>
      <div className="choices" role="radiogroup" aria-label="Stack">
        {PROFILES.map((p) => (
          <button key={p.id} className="choice" role="radio" aria-checked={f.stack?.profileId === p.id} onClick={() => choose({ profileId: p.id, preferred: p.nombre })}>
            <span className="t">{p.nombre}</span>
            <span className="d">{p.para}</span>
            <span className="d">{p.porQue}</span>
          </button>
        ))}
        <button className="choice" role="radio" aria-checked={!!f.stack?.recommend} onClick={() => (withAI ? choose({ recommend: true }) : openAIDialog())}>
          <span className="t">No sé, recomiéndame uno</span>
          <span className="d">según tu proyecto, pensado para aprender</span>
          {!withAI && <span className="meta"><span className="tag needs">necesita IA</span></span>}
        </button>
      </div>
      <div className="field">
        <label htmlFor="other">Otro stack</label>
        <div className="row" style={{ flexWrap: 'nowrap' }}>
          <input id="other" className="input" value={other} placeholder="Ej: Go con Gin y PostgreSQL, Vue 3 con Vite" onChange={(e) => setOther(e.target.value)} />
          <button
            className="btn"
            disabled={!other.trim()}
            onClick={() => {
              const profile = matchProfile(other);
              if (!withAI && !profile) {
                openAIDialog();
                return;
              }
              choose({ preferred: other.trim(), profileId: profile?.id });
            }}
          >
            Usar
          </button>
        </div>
        {!withAI && <span style={{ fontSize: 14, color: 'var(--ink-2)' }}>Sin IA, otro stack solo funciona si coincide con un perfil curado.</span>}
      </div>
    </>
  );
}

const TIPOS: { v: AppKind; t: string; d: string }[] = [
  { v: 'api', t: 'API o backend', d: 'datos para una app web, móvil u otro sistema' },
  { v: 'web-servidor', t: 'Web con páginas del servidor', d: 'el servidor arma el HTML (Django, Rails, Laravel)' },
  { v: 'frontend', t: 'Frontend', d: 'interfaz que corre en el navegador (React, Vue…)' },
  { v: 'otra', t: 'Otra', d: 'escritorio, CLI, videojuego, script…' }
];

function Question<T extends string>(props: { title: string; value?: T; options: { v: T; t: string; d?: string }[]; onPick: (v: T) => void }) {
  return (
    <div className="field">
      <label>{props.title}</label>
      <div className="seg" role="radiogroup" aria-label={props.title}>
        {props.options.map((o) => (
          <button key={o.v} className="chip" role="radio" aria-checked={props.value === o.v} aria-pressed={props.value === o.v} title={o.d} onClick={() => props.onPick(o.v)}>
            {o.t}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Arquitectura: preguntas → recomendación por reglas (sin IA) → crear el proyecto. */
export function ArchStep() {
  const { flows, setProjectFlow, ai, openAIDialog, openProject, notify } = useApp();
  const f = flows.project;
  const profile = getProfile(f.stack?.profileId) ?? matchProfile(f.stack?.preferred);
  const fixedTipo = appKindForProfile(profile?.id);
  const a = { ...f.answers, tipo: fixedTipo ?? f.answers?.tipo };
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [stackMd, setStackMd] = useState('');

  const complete = !!a.tipo && (a.tipo === 'frontend' || (!!a.equipo && !!a.areas && !!a.objetivo));
  const answers: ArchAnswers | undefined = complete
    ? { tipo: a.tipo!, equipo: a.equipo ?? 'solo', areas: a.areas ?? 'pocas', objetivo: a.objetivo ?? 'fundamentos' }
    : undefined;
  const rec = useMemo(() => (answers ? recommendArchitecture(answers) : undefined), [JSON.stringify(answers)]); // eslint-disable-line react-hooks/exhaustive-deps
  const chosen = getArchitecture(f.archId) ?? getArchitecture(rec?.recomendada);
  const order = rec ? [rec.recomendada, ...rec.alternativas] : [];
  const others = answers ? ARCHITECTURES.filter((x) => x.tipos.includes(answers.tipo) && !order.includes(x.id)) : [];

  const setA = (changes: Partial<ArchAnswers>) => setProjectFlow({ answers: { ...f.answers, ...changes } }, 'answers');

  const create = async () => {
    if (!chosen || !rec) return;
    const withAI = hasAI(ai);
    if (!withAI && !profile) {
      openAIDialog();
      return;
    }
    setBusy(true);
    setErr('');
    let markdown = '';
    let proposal: Omit<ProjectFile, 'prompt'> | undefined;
    let usedProfile = profile;
    if (withAI) {
      try {
        const answer = await llm(
          ai,
          buildStackSystemPrompt(f.stack?.recommend ? undefined : f.stack?.preferred, profile, chosen),
          `Mi proyecto: ${f.text.trim()}\n\n${f.stack?.recommend ? 'Recomiéndame el stack.' : 'Concreta y planifica mi stack.'}`,
          2500
        );
        const split = splitStackAnswer(answer);
        markdown = split.markdown;
        proposal = split.proposal;
        usedProfile ??= matchProfile([proposal?.stack?.resumen, proposal?.stack?.framework].filter(Boolean).join(' '));
      } catch (e: any) {
        if (!profile) {
          setErr(e instanceof MissingKeyError ? `${e.message} Escríbela en «Cambiar IA».` : `No pude consultar a la IA: ${e?.message ?? e}`);
          setBusy(false);
          return;
        }
        notify(`No pude consultar a la IA; uso el plan base de ${profile.nombre}.`, 'warn');
      }
    }
    const merged = mergeWithProfile(proposal, usedProfile);
    if (!merged) {
      setErr('No pude leer el stack estructurado de la respuesta. Vuelve a intentarlo.');
      setStackMd(markdown);
      setBusy(false);
      return;
    }
    const razones = chosen.id === rec.recomendada ? rec.razones : [`Elección propia en lugar de ${getArchitecture(rec.recomendada)!.nombre}.`];
    const project: ProjectFile = {
      prompt: f.text.trim(),
      ...merged,
      arquitectura: { estilo: chosen.id, nombre: chosen.nombre, razones, carpetas: [...chosen.carpetas], reglas: [...chosen.reglas] }
    };
    const fecha = new Date().toISOString().slice(0, 10);
    const docs: Record<string, string> = {
      'docs/ARQUITECTURA.md': architectureDoc(chosen, {
        prompt: project.prompt,
        stack: project.stack?.resumen,
        razones,
        alternativas: order.filter((id) => id !== chosen.id).slice(0, 3),
        fecha
      }),
      'docs/STACK.md': markdown
        ? `# Stack del proyecto\n\n${markdown}\n`
        : `# Stack del proyecto\n\n**${usedProfile!.nombre}**: ${usedProfile!.para}.\n\n${usedProfile!.porQue}\n\n## Convenciones\n${usedProfile!.convenciones.map((c) => `- ${c}`).join('\n')}\n`
    };
    const name = packageName(f.text.trim().split(/\s+/).slice(0, 4).join('-'));
    const p = await createProjectWith(name, project, docs);
    setProjectFlow({ projectId: p.id });
    setBusy(false);
    if (!withAI && !['capas', 'mvc', 'componentes'].includes(chosen.id)) {
      notify(`Ojo: el plan base sigue la estructura del perfil, no ${chosen.nombre}. Ajusta las rutas en autocompletehelp.json o diséñalo con IA.`, 'warn');
    }
    openProject(p.id);
  };

  const item = (x: Architecture, star: boolean) => (
    <button key={x.id} className="choice" role="radio" aria-checked={chosen?.id === x.id} onClick={() => setProjectFlow({ archId: x.id }, 'archId')}>
      <span className="t">{star ? '★ Recomendada: ' : ''}{x.nombre}</span>
      <span className="d">{x.resumen}</span>
      <span className="meta"><span className="tag">complejidad {'●'.repeat(x.complejidad)}{'○'.repeat(5 - x.complejidad)}</span></span>
    </button>
  );

  return (
    <>
      <h2>¿Cómo se organiza el código?</h2>
      <p className="help">Antes de escribir se decide dónde vive cada pieza. La recomendación sale de reglas, sin IA. La decisión queda en docs/ARQUITECTURA.md.</p>
      {!fixedTipo && <Question title="¿Qué tipo de aplicación es?" value={a.tipo} options={TIPOS} onPick={(v) => setA({ tipo: v })} />}
      {a.tipo && a.tipo !== 'frontend' && (
        <>
          <Question
            title="¿Quiénes van a trabajar en el proyecto?"
            value={a.equipo}
            options={[{ v: 'solo', t: 'Solo yo' }, { v: 'pequeno', t: 'Un equipo pequeño' }, { v: 'varios', t: 'Varios equipos' }]}
            onPick={(v) => setA({ equipo: v })}
          />
          <Question
            title="¿Cuántas áreas del negocio tiene?"
            value={a.areas}
            options={[{ v: 'pocas', t: 'Pocas (1 o 2)', d: 'un blog, una lista de tareas' }, { v: 'varias', t: 'Varias que crecen por separado', d: 'catálogo, carrito, pagos' }]}
            onPick={(v) => setA({ areas: v })}
          />
          <Question
            title="¿Qué quieres aprender con este proyecto?"
            value={a.objetivo}
            options={[{ v: 'fundamentos', t: 'Los fundamentos' }, { v: 'diseno', t: 'Diseño de software' }]}
            onPick={(v) => setA({ objetivo: v })}
          />
        </>
      )}
      {rec && (
        <>
          <div className="row">
            <button className="btn primary" disabled={busy} onClick={create}>
              {busy ? 'Creando…' : 'Crear el proyecto'}
            </button>
            {busy && <span className="loading"><span className="spinner" /> {hasAI(ai) ? 'La IA concreta el stack y el plan…' : ''}</span>}
          </div>
          <div className="choices" role="radiogroup" aria-label="Arquitectura">
            {item(getArchitecture(rec.recomendada)!, true)}
            {rec.alternativas.map(getArchitecture).filter((x): x is Architecture => !!x).map((x) => item(x, false))}
            {others.map((x) => item(x, false))}
          </div>
          {err && <div className="callout bad">{err}</div>}
          {stackMd && <Markdown text={stackMd} />}
          {chosen && <Markdown text={explainArchitecture(chosen, chosen.id === rec.recomendada ? rec.razones : [])} />}
        </>
      )}
    </>
  );
}
