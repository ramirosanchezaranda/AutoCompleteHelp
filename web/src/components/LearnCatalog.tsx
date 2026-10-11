import { useEffect, useMemo, useState } from 'react';
import { LEARN_TOPICS, TOPIC_KINDS } from '@core/learnCatalog';
import { LESSONS } from '@core/lessons';

type Modo = 'proyecto' | 'curso';

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

/** true en pantallas anchas: ahí las áreas arrancan abiertas. */
function useWide(): boolean {
  const q = '(min-width: 900px)';
  const [wide, setWide] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches);
  useEffect(() => {
    const m = window.matchMedia(q);
    const on = () => setWide(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return wide;
}

/**
 * Todo lo que se puede aprender, a la vista: las lecciones listas sin IA
 * (cursos de teoría y ejercicios, y proyectos) y los temas del catálogo por
 * área, con un buscador. En celular las áreas se abren de a una.
 */
export function LearnCatalog({ selected, onPick }: { selected?: { text: string; modo?: Modo }; onPick: (text: string, modo?: Modo) => void }) {
  const wide = useWide();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const query = norm(q.trim());

  const lessons = useMemo(
    () =>
      [...LESSONS.filter((l) => l.tipo === 'curso'), ...LESSONS.filter((l) => l.tipo !== 'curso')].filter(
        (l) => !query || norm(`${l.titulo} ${l.tema} ${l.stack.resumen} ${l.objetivos.join(' ')}`).includes(query)
      ),
    [query]
  );
  const topics = useMemo(
    () => LEARN_TOPICS.filter((t) => !query || norm(`${t.nombre} ${t.stack} ${t.palabras.join(' ')}`).includes(query)),
    [query]
  );
  const withLesson = useMemo(() => new Set(LESSONS.map((l) => l.topicId)), []);
  const areas = TOPIC_KINDS.map((k) => ({ ...k, topics: topics.filter((t) => t.tipo === k.tipo) })).filter((a) => a.topics.length);

  return (
    <section className="catalog" aria-labelledby="catalog-title">
      <div className="catalog-head">
        <h2 id="catalog-title">Qué puedes aprender</h2>
        <p>
          {LESSONS.length} lecciones listas para empezar sin IA y {LEARN_TOPICS.length} temas en {TOPIC_KINDS.length} áreas. Cualquier tema se aprende con un proyecto o con teoría y ejercicios, siempre escribiendo.
        </p>
        <input
          type="search"
          className="catalog-search"
          placeholder="Buscar: shaders, Python, nube, lógica…"
          aria-label="Buscar en el catálogo"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {lessons.length > 0 && (
        <>
          <h3>Listas para empezar, sin IA</h3>
          <div className="lesson-grid">
            {lessons.map((l) => {
              const curso = l.tipo === 'curso';
              const modo: Modo = curso ? 'curso' : 'proyecto';
              return (
                <button
                  key={l.id}
                  className={`lesson-card${curso ? ' curso' : ''}`}
                  aria-pressed={selected?.text === l.tema && (selected.modo ?? 'proyecto') === modo}
                  onClick={() => onPick(l.tema, modo)}
                >
                  <span className="kind">{curso ? 'Teoría y ejercicios' : 'Proyecto'}</span>
                  <span className="t">{curso ? l.tema : l.titulo}</span>
                  <span className="d">{curso ? l.objetivos.slice(0, 4).join(' · ') : `${l.tema} · ${l.objetivos.slice(0, 3).join(' · ')}`}</span>
                  <span className="meta">
                    {l.duracion} · dificultad {l.dificultad}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {areas.length > 0 && (
        <>
          <h3>Con IA, cualquier tema</h3>
          <div className="area-grid">
            {areas.map((a) => {
              const isOpen = query ? true : open[a.tipo] ?? wide;
              return (
                <div key={a.tipo} className={`area${isOpen ? ' open' : ''}`}>
                  <button className="area-head" aria-expanded={isOpen} onClick={() => setOpen((o) => ({ ...o, [a.tipo]: !isOpen }))}>
                    <span className="t">{a.titulo}</span>
                    <span className="n">
                      {a.topics.length} {a.topics.length === 1 ? 'tema' : 'temas'} <span aria-hidden="true">{isOpen ? '▴' : '▾'}</span>
                    </span>
                    {!isOpen && <span className="peek">{a.topics.slice(0, 4).map((t) => t.nombre).join(' · ')}{a.topics.length > 4 ? '…' : ''}</span>}
                  </button>
                  {isOpen && (
                    <div className="chips">
                      {a.topics.map((t) => (
                        <button key={t.id} className="chip" aria-pressed={selected?.text === t.nombre} onClick={() => onPick(t.nombre)} title={t.stack}>
                          {t.nombre}
                          {withLesson.has(t.id) && <span className="badge">sin IA</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {query && !lessons.length && !topics.length && (
        <div className="callout info">
          «{q.trim()}» no está en el catálogo: con una IA se diseña desde cero.{' '}
          <button className="btn small" onClick={() => onPick(q.trim())}>
            Aprender {q.trim()}
          </button>
        </div>
      )}
    </section>
  );
}
