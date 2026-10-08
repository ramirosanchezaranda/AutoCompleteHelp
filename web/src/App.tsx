import { Suspense, lazy, useEffect, useState } from 'react';
import { useApp } from './store/app';
import { aiLabel } from './lib/ai';
import { Home } from './components/Home';

// Lo pesado (editor, catálogo, lecciones) se carga al usarse: la primera carga es liviana.
const AIDialog = lazy(() => import('./components/AIDialog').then((m) => ({ default: m.AIDialog })));
const Flow = lazy(() => import('./components/Flow').then((m) => ({ default: m.Flow })));
const Workspace = lazy(() => import('./components/Workspace').then((m) => ({ default: m.Workspace })));
const Projects = lazy(() => import('./components/Projects').then((m) => ({ default: m.Projects })));

const Loading = () => (
  <div className="empty" role="status">
    <span className="spinner" /> Cargando…
  </div>
);

export function App() {
  const { view, ai, aiDialog, openAIDialog, go, theme, setTheme, toast } = useApp();

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);
  }, [theme]);

  const nextTheme = theme === 'system' ? 'dark' : theme === 'dark' ? 'light' : 'system';
  const themeLabel = { system: 'Tema: como el sistema', dark: 'Tema: oscuro', light: 'Tema: claro' }[theme];

  return (
    <div className="app">
      <header className="topbar">
        <button className="brand" onClick={() => go('home')} aria-label="AutoCompleteHelp: inicio">
          <img src="/icon.svg" alt="" />
          <span>AutoCompleteHelp</span>
        </button>
        <button className="icon-btn proj-btn" onClick={() => go('projects')} title="Mis proyectos" aria-label="Mis proyectos">
          <span className="full">Mis proyectos</span>
          <span className="short" aria-hidden="true">▤</span>
        </button>
        <div className="ai-chip" aria-live="polite">
          <span className="lbl">
            IA: <b>{aiLabel(ai)}</b>
          </span>
          <button className="btn small pill" onClick={() => openAIDialog()}>
            Cambiar IA
          </button>
        </div>
        <button className="icon-btn" onClick={() => setTheme(nextTheme)} title={themeLabel} aria-label={themeLabel}>
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
            <circle cx="10" cy="10" r="7.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
            {theme === 'system' && <path d="M10 2.5a7.5 7.5 0 0 1 0 15z" fill="currentColor" />}
            {theme === 'dark' && <circle cx="10" cy="10" r="7.5" fill="currentColor" />}
          </svg>
        </button>
      </header>
      <main className="main">
        <Suspense fallback={<Loading />}>
          {view === 'home' && <Home />}
          {view === 'flow' && <Flow />}
          {view === 'workspace' && <Workspace />}
          {view === 'projects' && <Projects />}
        </Suspense>
      </main>
      {aiDialog && (
        <Suspense fallback={null}>
          <AIDialog />
        </Suspense>
      )}
      {toast && <Toast key={toast.id} text={toast.text} tone={toast.tone} />}
    </div>
  );
}

function Toast({ text, tone }: { text: string; tone?: string }) {
  const [shown, setShown] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShown(false), Math.min(9000, 2500 + text.length * 45));
    return () => clearTimeout(t);
  }, [text]);
  if (!shown) return null;
  return (
    <div className={`toast ${tone ?? ''}`} role="status" onClick={() => setShown(false)}>
      {text}
    </div>
  );
}
