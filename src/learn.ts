import * as vscode from 'vscode';
import { resolveActiveConfig } from './providers/catalog';
import { complete } from './providers/client';
import { ensureApiKey } from './secrets';
import { showMarkdownPanel } from './explain';
import { architectureDoc, getArchitecture } from './architectures';
import { ProjectFile, projectRoot, writeProjectFileAt } from './projectFile';
import {
  LEARN_TOPICS,
  LearnLevel,
  LearnRequest,
  LearnSize,
  LearnTopic,
  ProjectIdea,
  TOPIC_KINDS,
  buildIdeasSystemPrompt,
  buildLearnSystemPrompt,
  curatedIdeas,
  folderNameFor,
  learnGuideDoc,
  learnProjectFile,
  matchTopic,
  parseIdeas,
  parseLearnAnswer
} from './learnTopics';

/** Valor especial de la lista de temas: pedir recomendaciones. */
const RECOMMEND = '__recommend__';

/** Proyecto creado en otra carpeta: al abrirla, se ofrece seguir. */
const PENDING_KEY = 'autocompletehelp.pendingLearnFolder';

type Pick<T> = vscode.QuickPickItem & { value: T };

/**
 * «Quiero aprender…»: tema → desde dónde arrancas → la IA RECOMIENDA tres
 * proyectos y eliges uno → tamaño y carpeta → la IA diseña el proyecto
 * completo (guía, stack, arquitectura, plan con tests y, si hace falta,
 * Docker) → se crea la carpeta → se construye completando juntos.
 *
 * Con `recommend`, se parte de lo que le interesa a la persona y la IA
 * recomienda proyectos de cualquier tema.
 */
export async function learn(
  context: vscode.ExtensionContext,
  topicId?: string,
  opts: { recommend?: boolean } = {}
): Promise<void> {
  let interes: string | undefined;
  let tema: string | undefined;
  let topic = topicId ? LEARN_TOPICS.find((t) => t.id === topicId) : undefined;
  if (opts.recommend) {
    interes = (
      await vscode.window.showInputBox({
        title: 'Recomiéndame un proyecto',
        prompt: '¿Qué te interesa o para qué quieres aprender? Ej: "quiero trabajar de backend", "me gustan los videojuegos", "automatizar mi trabajo con Excel", "entender la IA".',
        ignoreFocusOut: true
      })
    )?.trim();
    if (!interes) {
      return;
    }
  } else {
    tema = topic?.nombre ?? (await askTopic());
    if (!tema) {
      return;
    }
    if (tema === RECOMMEND) {
      return learn(context, undefined, { recommend: true });
    }
    topic ??= matchTopic(tema);
  }

  const nivel = await ask<LearnLevel>(`${tema ? `Aprender ${tema}` : 'Recomiéndame un proyecto'} — ¿Desde dónde arrancas?`, [
    { label: 'Desde cero', description: 'nunca programé', value: 'cero' },
    { label: 'Ya programo en otra cosa', description: 'otro lenguaje o herramienta', value: 'otro-lenguaje' },
    { label: 'Lo usé un poco', description: 'quiero entenderlo de verdad', value: 'algo' }
  ]);
  if (!nivel) {
    return;
  }

  const { provider, model, baseUrl } = resolveActiveConfig();
  const apiKey = await ensureApiKey(context, provider);
  if (provider.needsKey && !apiKey) {
    return;
  }
  const llm = (system: string, user: string, maxTokens: number, title: string) =>
    vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title, cancellable: true }, (_p, token) =>
      complete({ provider, baseUrl, model, apiKey, system, user, maxTokens, token })
    );

  // La IA recomienda proyectos; sin respuesta, quedan las ideas del catálogo.
  const idea = await chooseIdea(llm, { tema, nivel, interes, topic });
  if (!idea) {
    return;
  }
  if (!tema) {
    tema = idea.tema || idea.titulo;
    topic = matchTopic(`${idea.tema ?? ''} ${idea.titulo}`);
  }

  const tamano = await ask<LearnSize>(`«${idea.titulo}» — ¿Qué tamaño de proyecto?`, [
    { label: 'Corto', description: '6 a 8 pasos · una o dos horas', value: 'corto' },
    { label: 'Mediano', description: '10 a 12 pasos · un fin de semana', value: 'mediano' },
    { label: 'Completo', description: '14 a 18 pasos · un proyecto entero', value: 'completo' }
  ]);
  if (!tamano) {
    return;
  }
  const folder = await chooseFolder(tema);
  if (!folder) {
    return;
  }

  const req: LearnRequest = { tema, nivel, tamano, topic, idea };
  let answer = '';
  try {
    answer = await llm(buildLearnSystemPrompt(req), `Quiero aprender: ${tema}. Proyecto: ${idea.titulo}`, 6000, `AutoCompleteHelp: diseñando «${idea.titulo}»…`);
  } catch (err: any) {
    if (err?.name !== 'AbortError') {
      vscode.window.showErrorMessage(`AutoCompleteHelp: no se pudo diseñar el proyecto (${err?.message ?? err}).`);
    }
    return;
  }

  const { markdown, proposal } = parseLearnAnswer(answer);
  showMarkdownPanel(`AutoCompleteHelp — ${idea.titulo}`, markdown || answer);
  if (!proposal) {
    vscode.window.showWarningMessage(
      'AutoCompleteHelp: la respuesta no trajo un plan válido. Vuelve a intentarlo; la guía quedó en el panel.'
    );
    return;
  }
  const tests = proposal.plan.filter((s) => s.tipo === 'test').length;
  const docker = proposal.entorno?.docker ? ' · con Docker' : '';
  const ok = await vscode.window.showInformationMessage(
    `«${idea.titulo}» para aprender ${tema}: ${proposal.stack.resumen ?? ''} · ${proposal.plan.length} pasos (${tests} de tests)${docker}. La guía está en el panel. ¿Lo creo en ${folder.label}?`,
    'Crear el proyecto'
  );
  if (!ok) {
    return;
  }

  const project = learnProjectFile(proposal, req);
  await writeLearnProject(folder.uri, project, markdown, tema);

  if (folder.isCurrent) {
    await offerStart(tema);
    return;
  }
  await context.globalState.update(PENDING_KEY, folder.uri.toString());
  await vscode.commands.executeCommand('vscode.openFolder', folder.uri, { forceNewWindow: false });
}

type Llm = (system: string, user: string, maxTokens: number, title: string) => Thenable<string>;

/**
 * Proyectos recomendados por la IA para el tema (o para lo que le interesa a
 * la persona). «Otras recomendaciones» vuelve a pedir; «mi propia idea» deja
 * escribirla. Si la IA no responde, se ofrecen las ideas del catálogo.
 */
async function chooseIdea(
  llm: Llm,
  req: { tema?: string; nivel: LearnLevel; interes?: string; topic?: LearnTopic }
): Promise<ProjectIdea | undefined> {
  const OWN = '__own__';
  const MORE = '__more__';
  let previous: string[] = [];
  for (;;) {
    let ideas: ProjectIdea[] = [];
    let offline = false;
    try {
      const answer = await llm(
        buildIdeasSystemPrompt(req),
        previous.length ? `Recomiéndame otros, distintos de: ${previous.join('; ')}` : 'Recomiéndame proyectos.',
        1500,
        'AutoCompleteHelp: buscando proyectos para recomendarte…'
      );
      ideas = parseIdeas(answer);
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return undefined;
      }
    }
    if (!ideas.length && req.topic) {
      ideas = curatedIdeas(req.topic);
      offline = true;
    }
    if (!ideas.length && !req.tema) {
      vscode.window.showWarningMessage('AutoCompleteHelp: no pude obtener recomendaciones. Prueba eligiendo un tema en «Quiero aprender».');
      return undefined;
    }
    previous = previous.concat(ideas.map((i) => i.titulo));
    const icon = { baja: '$(circle-large-outline)', media: '$(circle-large-filled)', alta: '$(flame)' };
    const items: (Pick<ProjectIdea | string> | vscode.QuickPickItem)[] = [
      ...ideas.map((i) => ({
        label: `${icon[i.dificultad]} ${i.titulo}`,
        description: [i.tema && !req.tema ? i.tema : '', i.duracion, i.docker ? 'Docker' : '', i.nube ? 'nube' : ''].filter(Boolean).join(' · '),
        detail: i.descripcion + (i.aprendes.length ? ` Aprendes: ${i.aprendes.join(', ')}.` : ''),
        value: i
      })),
      { label: '', kind: vscode.QuickPickItemKind.Separator },
      ...(offline ? [] : [{ label: '$(refresh) Otras recomendaciones', value: MORE }]),
      ...(req.tema ? [{ label: '$(edit) Tengo mi propia idea de proyecto…', value: OWN }] : [])
    ];
    const pick = (await vscode.window.showQuickPick(items, {
      title: offline
        ? `Proyectos para aprender ${req.tema} (ideas del catálogo: la IA no respondió)`
        : `Proyectos recomendados${req.tema ? ` para aprender ${req.tema}` : ''}`,
      matchOnDetail: true,
      ignoreFocusOut: true
    })) as Pick<ProjectIdea | string> | undefined;
    if (!pick) {
      return undefined;
    }
    if (pick.value === MORE) {
      continue;
    }
    if (pick.value === OWN) {
      const text = await vscode.window.showInputBox({
        title: `Tu proyecto para aprender ${req.tema}`,
        prompt: 'Describe qué quieres construir. Ej: "un bot de Telegram que me recuerde tomar agua".',
        ignoreFocusOut: true
      });
      if (!text?.trim()) {
        continue;
      }
      return { titulo: text.trim(), descripcion: text.trim(), aprendes: [], dificultad: 'media', duracion: '', docker: false, nube: false, tema: req.tema };
    }
    return pick.value as ProjectIdea;
  }
}

async function ask<T>(title: string, items: Pick<T>[]): Promise<T | undefined> {
  return (await vscode.window.showQuickPick(items, { title, ignoreFocusOut: true }))?.value;
}

/** Temas curados agrupados, u otro escrito a mano. */
async function askTopic(): Promise<string | undefined> {
  const OTHER = '__other__';
  const items: (Pick<string> | vscode.QuickPickItem)[] = [
    { label: '$(lightbulb) Recomiéndame un proyecto', description: 'según lo que te interesa', value: RECOMMEND }
  ];
  for (const kind of TOPIC_KINDS) {
    items.push({ label: kind.titulo, kind: vscode.QuickPickItemKind.Separator });
    for (const t of LEARN_TOPICS.filter((x) => x.tipo === kind.tipo)) {
      items.push({ label: t.nombre, description: t.stack, value: t.nombre });
    }
  }
  items.push({ label: '', kind: vscode.QuickPickItemKind.Separator }, { label: '$(edit) Otro tema…', description: 'escribe lo que quieras aprender', value: OTHER });
  const pick = (await vscode.window.showQuickPick(items, {
    title: '¿Qué quieres aprender?',
    placeHolder: 'Un lenguaje, una librería, una arquitectura, una herramienta…',
    matchOnDescription: true,
    ignoreFocusOut: true
  })) as Pick<string> | undefined;
  if (!pick) {
    return undefined;
  }
  if (pick.value !== OTHER) {
    return pick.value;
  }
  // (RECOMMEND también vuelve tal cual: learn() lo reconoce.)
  const text = await vscode.window.showInputBox({
    title: '¿Qué quieres aprender?',
    prompt: 'Ej: "Rust", "GraphQL", "Unity con C#", "scraping con Python", "patrones de diseño", "Kubernetes".',
    ignoreFocusOut: true
  });
  return text?.trim() || undefined;
}

interface Target {
  uri: vscode.Uri;
  label: string;
  isCurrent: boolean;
}

/**
 * Dónde crear el proyecto. La carpeta abierta solo si está vacía (o casi):
 * nunca se mezcla un proyecto nuevo con uno existente.
 */
async function chooseFolder(tema: string): Promise<Target | undefined> {
  const current = projectRoot();
  let currentUsable = false;
  if (current) {
    const entries = await vscode.workspace.fs.readDirectory(current);
    currentUsable = entries.filter(([name]) => !name.startsWith('.')).length === 0;
  }
  const NEW = 'new';
  const HERE = 'here';
  const choice = await ask<string>(`Aprender ${tema} — ¿Dónde lo creo?`, [
    { label: '$(new-folder) En una carpeta nueva', description: folderNameFor(tema), value: NEW },
    ...(currentUsable
      ? [{ label: '$(folder-opened) En la carpeta abierta', description: 'está vacía', value: HERE }]
      : [])
  ]);
  if (!choice) {
    return undefined;
  }
  if (choice === HERE && current) {
    return { uri: current, label: 'la carpeta abierta', isCurrent: true };
  }
  const parent = await vscode.window.showOpenDialog({
    canSelectFolders: true,
    canSelectFiles: false,
    canSelectMany: false,
    openLabel: 'Crear el proyecto aquí',
    title: '¿En qué carpeta creo el proyecto?'
  });
  if (!parent?.[0]) {
    return undefined;
  }
  const name = await vscode.window.showInputBox({
    title: 'Nombre de la carpeta del proyecto',
    value: folderNameFor(tema),
    validateInput: (v) => (/^[\w.-]+$/.test(v) ? undefined : 'Usa letras, números, guiones o puntos, sin espacios.')
  });
  if (!name) {
    return undefined;
  }
  const uri = vscode.Uri.joinPath(parent[0], name);
  try {
    const entries = await vscode.workspace.fs.readDirectory(uri);
    if (entries.length) {
      vscode.window.showWarningMessage(`AutoCompleteHelp: ${name} ya existe y no está vacía. Elige otro nombre.`);
      return undefined;
    }
  } catch {
    // no existe: se crea
  }
  return { uri, label: name, isCurrent: false };
}

async function writeLearnProject(folder: vscode.Uri, project: ProjectFile, markdown: string, tema: string): Promise<void> {
  const fecha = new Date().toISOString().slice(0, 10);
  const docs = vscode.Uri.joinPath(folder, 'docs');
  await vscode.workspace.fs.createDirectory(docs);
  const write = (uri: vscode.Uri, text: string) => vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(text));
  await write(vscode.Uri.joinPath(docs, 'APRENDER.md'), learnGuideDoc(markdown, tema, fecha));
  const arch = getArchitecture(project.arquitectura?.estilo);
  if (arch) {
    await write(
      vscode.Uri.joinPath(docs, 'ARQUITECTURA.md'),
      architectureDoc(arch, {
        prompt: project.prompt,
        stack: project.stack?.resumen,
        razones: project.arquitectura?.razones ?? [],
        alternativas: [],
        fecha
      })
    );
  }
  await writeProjectFileAt(folder, project);
}

async function offerStart(tema: string): Promise<void> {
  const action = await vscode.window.showInformationMessage(
    `Tu proyecto para aprender ${tema} está listo: guía en docs/APRENDER.md y plan en el panel «Plan del proyecto». ¿Creo los archivos y empezamos?`,
    'Crear estructura',
    'Abrir la guía'
  );
  if (action === 'Crear estructura') {
    await vscode.commands.executeCommand('autocompletehelp.createStructure');
  } else if (action) {
    const root = projectRoot();
    if (root) {
      await vscode.window.showTextDocument(vscode.Uri.joinPath(root, 'docs', 'APRENDER.md'));
    }
  }
}

/** Al abrir la carpeta recién creada, retomar donde quedó. */
export async function resumePendingLearn(context: vscode.ExtensionContext, tema: string | undefined): Promise<void> {
  const pending = context.globalState.get<string>(PENDING_KEY);
  const root = projectRoot();
  if (!pending || !root || pending !== root.toString()) {
    return;
  }
  await context.globalState.update(PENDING_KEY, undefined);
  await offerStart(tema ?? 'el tema');
}

// ---------------------------------------------------------------------------
// Sección «Quiero aprender» en el explorador
// ---------------------------------------------------------------------------

type LearnNode =
  | { kind: 'group'; titulo: string; tipo: LearnTopic['tipo'] }
  | { kind: 'topic'; topic: LearnTopic }
  | { kind: 'other' }
  | { kind: 'recommend' };

class LearnViewProvider implements vscode.TreeDataProvider<LearnNode> {
  getTreeItem(node: LearnNode): vscode.TreeItem {
    if (node.kind === 'group') {
      const item = new vscode.TreeItem(node.titulo, vscode.TreeItemCollapsibleState.Collapsed);
      item.contextValue = 'group';
      return item;
    }
    if (node.kind === 'recommend') {
      const item = new vscode.TreeItem('Recomiéndame un proyecto', vscode.TreeItemCollapsibleState.None);
      item.iconPath = new vscode.ThemeIcon('lightbulb');
      item.description = 'según lo que te interesa';
      item.command = { command: 'autocompletehelp.recommendProject', title: 'Recomiéndame un proyecto' };
      return item;
    }
    if (node.kind === 'other') {
      const item = new vscode.TreeItem('Otro tema…', vscode.TreeItemCollapsibleState.None);
      item.iconPath = new vscode.ThemeIcon('edit');
      item.description = 'escribe lo que quieras aprender';
      item.command = { command: 'autocompletehelp.learn', title: 'Quiero aprender…' };
      return item;
    }
    const t = node.topic;
    const item = new vscode.TreeItem(t.nombre, vscode.TreeItemCollapsibleState.None);
    item.iconPath = new vscode.ThemeIcon('mortar-board');
    item.description = t.stack;
    item.tooltip = new vscode.MarkdownString(
      [`**${t.nombre}**`, `Stack: ${t.stack}`, `Ideas: ${t.ideas.join('; ')}`, t.notas ?? ''].filter(Boolean).join('\n\n')
    );
    item.command = { command: 'autocompletehelp.learn', title: 'Aprender', arguments: [t.id] };
    return item;
  }

  getChildren(node?: LearnNode): LearnNode[] {
    if (!node) {
      return [
        { kind: 'recommend' as const },
        ...TOPIC_KINDS.map((k) => ({ kind: 'group' as const, titulo: k.titulo, tipo: k.tipo })),
        { kind: 'other' as const }
      ];
    }
    if (node.kind === 'group') {
      return LEARN_TOPICS.filter((t) => t.tipo === node.tipo).map((topic) => ({ kind: 'topic' as const, topic }));
    }
    return [];
  }
}

export function registerLearnView(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.window.createTreeView('autocompletehelp.learn', { treeDataProvider: new LearnViewProvider() }),
    vscode.commands.registerCommand('autocompletehelp.learn', (topicId?: string) =>
      learn(context, typeof topicId === 'string' ? topicId : undefined)
    ),
    vscode.commands.registerCommand('autocompletehelp.recommendProject', () => learn(context, undefined, { recommend: true })),
    vscode.commands.registerCommand('autocompletehelp.start', () => start(context)),
    // La sección «Empezar» solo muestra su bienvenida con los botones.
    vscode.window.createTreeView('autocompletehelp.start', { treeDataProvider: { getTreeItem: (x: never) => x, getChildren: () => [] } })
  );
}

/**
 * «Empezar»: la puerta de entrada. Siempre se puede elegir entre construir
 * un proyecto propio, aprender un tema o pedir una recomendación.
 */
export async function start(context: vscode.ExtensionContext): Promise<void> {
  const pick = await ask<string>('AutoCompleteHelp — ¿Qué quieres hacer?', [
    { label: '$(rocket) Tengo un proyecto', description: 'lo describo y elijo stack y arquitectura', value: 'project' },
    { label: '$(mortar-board) Quiero aprender algo', description: 'un lenguaje, una librería, la nube, patrones, IA…', value: 'learn' },
    { label: '$(lightbulb) Recomiéndame un proyecto', description: 'según lo que me interesa', value: 'recommend' }
  ]);
  if (pick === 'project') {
    await vscode.commands.executeCommand('autocompletehelp.setProjectPrompt');
  } else if (pick === 'learn') {
    await learn(context);
  } else if (pick === 'recommend') {
    await learn(context, undefined, { recommend: true });
  }
}

