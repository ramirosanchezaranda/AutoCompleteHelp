import * as vscode from 'vscode';
import {
  ARCHITECTURES,
  AppKind,
  ArchAnswers,
  ArchId,
  Architecture,
  appKindForProfile,
  architectureDoc,
  explainArchitecture,
  getArchitecture,
  recommendArchitecture
} from './architectures';
import { ProjectArchitecture, getProject, projectRoot, saveProject } from './projectFile';
import { showMarkdownPanel } from './explain';
import { BACK, pickStep, runSteps } from './wizard';

export interface ArchChoice {
  arch: Architecture;
  razones: string[];
  alternativas: ArchId[];
}

type Pick<T> = vscode.QuickPickItem & { value: T };


/**
 * Tres o cuatro preguntas → arquitectura recomendada (algoritmo, sin LLM) →
 * la persona elige, con la explicación de cada opción a la vista.
 */
export async function pickArchitecture(profileId?: string): Promise<ArchChoice | undefined> {
  const fixedTipo = appKindForProfile(profileId);
  const a: Partial<ArchAnswers> = { tipo: fixedTipo };
  // Pasos (con ← Atrás): tipo de app (si el perfil no lo dice), equipo, áreas, objetivo.
  const total = (fixedTipo ? 0 : 1) + (a.tipo === 'frontend' ? 0 : 3) + 1;
  const n = (i: number) => (fixedTipo ? i : i + 1);
  const steps = [
    async () => {
      if (fixedTipo) {
        return 1;
      }
      const r = await pickStep<AppKind>(
        [
          { label: 'API o backend', description: 'datos para una app web, móvil u otro sistema', value: 'api' },
          { label: 'Web con páginas del servidor', description: 'el servidor arma el HTML (Django, Rails, Laravel)', value: 'web-servidor' },
          { label: 'Frontend', description: 'interfaz que corre en el navegador (React, Vue…)', value: 'frontend' },
          { label: 'Otra', description: 'escritorio, CLI, videojuego, script…', value: 'otra' }
        ],
        { title: 'Arquitectura — ¿Qué tipo de aplicación es?', step: 1, total, current: a.tipo }
      );
      if (r === undefined || r === BACK) {
        return r;
      }
      a.tipo = r;
      return r === 'frontend' ? 4 : 1;
    },
    async () => {
      const r = await pickStep<ArchAnswers['equipo']>(
        [
          { label: 'Solo yo', value: 'solo' },
          { label: 'Un equipo pequeño', description: '2 a 6 personas', value: 'pequeno' },
          { label: 'Varios equipos', description: 'cada uno a cargo de una parte', value: 'varios' }
        ],
        { title: 'Arquitectura — ¿Quiénes van a trabajar en el proyecto?', step: n(1), total, current: a.equipo }
      );
      if (r === undefined || r === BACK) {
        return r;
      }
      a.equipo = r;
      return 2;
    },
    async () => {
      const r = await pickStep<ArchAnswers['areas']>(
        [
          { label: 'Pocas (1 o 2)', description: 'ej: un blog, una lista de tareas', value: 'pocas' },
          { label: 'Varias que crecen por separado', description: 'ej: catálogo, carrito, pagos, envíos', value: 'varias' }
        ],
        { title: 'Arquitectura — ¿Cuántas áreas del negocio tiene?', step: n(2), total, current: a.areas }
      );
      if (r === undefined || r === BACK) {
        return r;
      }
      a.areas = r;
      return 3;
    },
    async () => {
      const r = await pickStep<ArchAnswers['objetivo']>(
        [
          { label: 'Los fundamentos', description: 'lo más simple que separe bien las responsabilidades', value: 'fundamentos' },
          { label: 'Diseño de software', description: 'separar el negocio de la tecnología, testear sin base de datos', value: 'diseno' }
        ],
        { title: 'Arquitectura — ¿Qué quieres aprender con este proyecto?', step: n(3), total, current: a.objetivo }
      );
      if (r === undefined || r === BACK) {
        return r;
      }
      a.objetivo = r;
      return 4;
    }
  ];
  if (!(await runSteps(steps, fixedTipo ? (fixedTipo === 'frontend' ? 4 : 1) : 0))) {
    return undefined;
  }
  const tipo = a.tipo!;
  const answers: ArchAnswers = { tipo, equipo: a.equipo ?? 'solo', areas: a.areas ?? 'pocas', objetivo: a.objetivo ?? 'fundamentos' };

  const rec = recommendArchitecture(answers);
  const order = [rec.recomendada, ...rec.alternativas];
  const fits = ARCHITECTURES.filter((a) => a.tipos.includes(tipo));
  const others = fits.filter((a) => !order.includes(a.id));
  const item = (a: Architecture, tag: string): Pick<ArchId> => ({
    label: `${tag}${a.nombre}`,
    description: `complejidad ${'●'.repeat(a.complejidad)}${'○'.repeat(5 - a.complejidad)}`,
    detail: a.resumen,
    value: a.id
  });
  const items: (Pick<ArchId> | vscode.QuickPickItem)[] = [
    item(getArchitecture(rec.recomendada)!, '$(star-full) Recomendada: '),
    ...rec.alternativas.map(getArchitecture).filter((a): a is Architecture => !!a).map((a) => item(a, '')),
    ...(others.length ? [{ label: 'Otras', kind: vscode.QuickPickItemKind.Separator }, ...others.map((a) => item(a, ''))] : [])
  ];

  showMarkdownPanel('AutoCompleteHelp — Arquitectura recomendada', explainArchitecture(getArchitecture(rec.recomendada)!, rec.razones));
  const pick = (await vscode.window.showQuickPick(items, {
    title: 'Elegir arquitectura (la explicación de la recomendada está en el panel)',
    ignoreFocusOut: true,
    matchOnDetail: true
  })) as Pick<ArchId> | undefined;
  if (!pick) {
    return undefined;
  }
  const arch = getArchitecture(pick.value)!;
  if (arch.id !== rec.recomendada) {
    showMarkdownPanel('AutoCompleteHelp — Arquitectura elegida', explainArchitecture(arch));
  }
  const razones =
    arch.id === rec.recomendada ? rec.razones : [`Elección propia en lugar de ${getArchitecture(rec.recomendada)!.nombre}.`];
  const alternativas = order.filter((id) => id !== arch.id).slice(0, 3);
  return { arch, razones, alternativas };
}

/** Lo que se guarda en autocompletehelp.json. */
export function toProjectArchitecture(choice: ArchChoice): ProjectArchitecture {
  return {
    estilo: choice.arch.id,
    nombre: choice.arch.nombre,
    razones: choice.razones,
    carpetas: [...choice.arch.carpetas],
    reglas: [...choice.arch.reglas]
  };
}

/** Escribe docs/ARQUITECTURA.md (pregunta antes de reemplazar uno existente). */
export async function writeArchitectureDoc(choice: ArchChoice): Promise<vscode.Uri | undefined> {
  const root = projectRoot();
  if (!root) {
    return undefined;
  }
  const uri = vscode.Uri.joinPath(root, 'docs', 'ARQUITECTURA.md');
  try {
    await vscode.workspace.fs.stat(uri);
    const replace = await vscode.window.showWarningMessage(
      'Ya existe docs/ARQUITECTURA.md. ¿Lo reemplazo con la nueva decisión?',
      'Reemplazar'
    );
    if (!replace) {
      return undefined;
    }
  } catch {
    // no existe: se crea
  }
  const project = getProject();
  const doc = architectureDoc(choice.arch, {
    prompt: project?.prompt,
    stack: project?.stack?.resumen,
    razones: choice.razones,
    alternativas: choice.alternativas,
    fecha: new Date().toISOString().slice(0, 10)
  });
  await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(root, 'docs'));
  await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(doc));
  return uri;
}

/** Comando «Elegir arquitectura»: para cambiarla después de elegir el stack. */
export async function chooseArchitecture(context: vscode.ExtensionContext): Promise<void> {
  const choice = await pickArchitecture(getProject()?.perfil);
  if (!choice) {
    return;
  }
  const previous = getProject()?.arquitectura?.estilo;
  const saved = await saveProject(context, { arquitectura: toProjectArchitecture(choice) });
  if (!saved) {
    vscode.window.showWarningMessage('AutoCompleteHelp: abre una carpeta de proyecto para guardar la arquitectura.');
    return;
  }
  const doc = await writeArchitectureDoc(choice);
  const hasPlan = !!getProject()?.plan?.length;
  const changed = previous && previous !== choice.arch.id;
  const action = await vscode.window.showInformationMessage(
    `Arquitectura: ${choice.arch.nombre}.` +
      (doc ? ' La decisión quedó en docs/ARQUITECTURA.md.' : '') +
      (hasPlan && changed ? ' El plan actual se armó con otra arquitectura: vuelve a «Elegir stack» para rehacerlo.' : ''),
    ...(doc ? ['Abrir docs/ARQUITECTURA.md'] : [])
  );
  if (action && doc) {
    await vscode.window.showTextDocument(doc);
  }
}
