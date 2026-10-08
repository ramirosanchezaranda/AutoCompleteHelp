import { useEffect, useRef, useState } from 'react';
import { useApp } from '../store/app';
import { ProjectSummary, deleteProject, listProjects, loadProject, saveProject, uniqueName } from '../lib/projects';
import { exportZip, importZip } from '../lib/zip';

/** Mis proyectos: abrir, exportar, importar y borrar. Todo vive en este dispositivo. */
export function Projects() {
  const { openProject, notify, go } = useApp();
  const [list, setList] = useState<ProjectSummary[]>([]);
  const input = useRef<HTMLInputElement>(null);
  const refresh = () => void listProjects().then(setList);
  useEffect(refresh, []);

  const onImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      const z = await importZip(file);
      const now = Date.now();
      const p = { id: Math.random().toString(36).slice(2, 10), name: await uniqueName(z.name), files: z.files, createdAt: now, updatedAt: now };
      await saveProject(p);
      notify(z.hasProjectFile ? `Importado ${p.name}.` : `Importado ${p.name}, pero no trae autocompletehelp.json: no hay plan.`, z.hasProjectFile ? 'ok' : 'warn');
      openProject(p.id);
    } catch (e: any) {
      notify(`No se pudo leer el .zip: ${e?.message ?? e}`, 'error');
    }
  };

  return (
    <div className="panel">
      <div className="panel-inner">
        <h2>Mis proyectos</h2>
        <p className="help">Viven en este dispositivo. Exporta un .zip para abrirlo en VS Code con la extensión, o para seguir en otro lado.</p>
        <div className="row">
          <button className="btn primary" onClick={() => go('home')}>Empezar uno nuevo</button>
          <button className="btn" onClick={() => input.current?.click()}>Importar un .zip</button>
          <input ref={input} type="file" accept=".zip,application/zip" hidden onChange={(e) => void onImport(e.target.files?.[0])} />
        </div>
        {!list.length && <div className="callout info">Todavía no hay proyectos. Empieza uno: una lección sin IA tarda un minuto en crearse.</div>}
        <div className="choices">
          {list.map((p) => (
            <div key={p.id} className="choice" style={{ cursor: 'default' }}>
              <span className="t">{p.name}</span>
              <span className="d">
                {p.done} de {p.total} pasos · {new Date(p.updatedAt).toLocaleDateString('es')}
              </span>
              <span className="row" style={{ marginTop: 6 }}>
                <button className="btn small primary" onClick={() => openProject(p.id)}>Abrir</button>
                <button className="btn small" onClick={async () => { const full = await loadProject(p.id); if (full) exportZip(full); }}>Exportar .zip</button>
                <button
                  className="btn small ghost"
                  onClick={async () => {
                    if (confirm(`¿Borrar ${p.name} de este dispositivo? No se puede deshacer.`)) {
                      await deleteProject(p.id);
                      refresh();
                    }
                  }}
                >
                  Borrar
                </button>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
