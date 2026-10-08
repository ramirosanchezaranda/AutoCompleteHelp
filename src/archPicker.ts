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

export interface ArchChoice {
  arch: Architecture;
  razones: string[];
  alternativas: ArchId[];
}

type Pick<T> = vscode.QuickPickItem & { value: T };

async function ask<T>(title: string, items: Pick<T>[]): Promise<T | undefined> {
  const pick = await vscode.window.showQuickPick(items, { title, ignoreFocusOut: true });
  return pick?.value;
}

/**
 * Tres o cuatro preguntas → arquitectura recomendada (algoritmo, sin LLM) →
 * la persona elige, con la explicación de cada opción a la vista.
 */
export async function pickArchitecture(profileId?: string): Promise<ArchChoice | undefined> {
  const tipo =
    appKindForProfile(profileId) ??
    (await ask<AppKind>('Arquitectura 1/4 — ¿Qué tipo de aplicación es?', [
      { label: 'API o backend', description: 'datos para una app web, móvil u otro sistema', value: 'api' },
      { label: 'Web con páginas del servidor', description: 'el servidor arma el HTML (Django, Rails, Laravel)', value: 'web-servidor' },
      { label: 'Frontend', description: 'interfaz que corre en el navegador (React, Vue…)', value: 'frontend' },
      { label: 'Otra', description: 'escritorio, CLI, videojuego, script…', value: 'otra' }
    ]));
  if (!tipo) {
    return undefined;
  }

  let answers: ArchAnswers = { tipo, equipo: 'solo', areas: 'pocas', objetivo: 'fundamentos' };
  if (tipo !== 'frontend') {
    const equipo = await ask<ArchAnswers['equipo']>('Arquitectura — ¿Quiénes van a trabajar en el proyecto?', [
      { label: 'Solo yo', value: 'solo' },
      { label: 'Un equipo pequeño', description: '2 a 6 personas', value: 'pequeno' },
      { label: 'Varios equipos', description: 'cada uno a cargo de una parte', value: 'varios' }
    ]);
    if (!equipo) {
      return undefined;
    }
    const areas = await ask<ArchAnswers['areas']>('Arquitectura — ¿Cuántas áreas del negocio tiene?', [
      { label: 'Pocas (1 o 2)', description: 'ej: un blog, una lista de tareas', value: 'pocas' },
      { label: 'Varias que crecen por separado', description: 'ej: catálogo, carrito, pagos, envíos', value: 'varias' }
    ]);
    if (!areas) {
      return undefined;
    }
    const objetivo = await ask<ArchAnswers['objetivo']>('Arquitectura — ¿Qué quieres aprender con este proyecto?', [
      { label: 'Los fundamentos', description: 'lo más simple que separe bien las responsabilidades', value: 'fundamentos' },
      { label: 'Diseño de software', description: 'separar el negocio de la tecnología, testear sin base de datos', value: 'diseno' }
    ]);
    if (!objetivo) {
      return undefined;
    }
    answers = { tipo, equipo, areas, objetivo };
  }

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
