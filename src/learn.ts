import * as vscode from 'vscode';
import { noAI, resolveActiveConfig } from './providers/catalog';
import { LESSONS, Lesson, getLesson, lessonProjectFile, lessonsForTopic } from './lessons';
import { BACK, Item, inputStep, pickStep, runSteps } from './wizard';
import { StartViewProvider } from './startView';
import { complete } from './providers/client';
import { ensureApiKey, prepareAI } from './secrets';
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

/** Proyecto creado en otra carpeta: al abrirla, se ofrece seguir. */
const PENDING_KEY = 'autocompletehelp.pendingLearnFolder';
const RECOMMEND = '__recommend__';
const OTHER = '__other__';

type Llm = (system: string, user: string, maxTokens: number, title: string) => Thenable<string>;

interface Target {
  uri: vscode.Uri;
  label: string;
  isCurrent: boolean;
}

/** Lo elegido en cada paso: al volver con ← Atrás, sigue marcado. */
interface LearnState {
  recommend: boolean;
  tema?: string;
  topic?: LearnTopic;
  interes?: string;
  nivel?: LearnLevel;
  ideas?: ProjectIdea[];
  ideasKey?: string;
  idea?: ProjectIdea;
  tamano?: LearnSize;
  folder?: Target;
}

/**
 * «Quiero aprender…» como asistente paso a paso (cada paso se superpone al
 * anterior, con «Paso n de N» y ← Atrás):
 *   tema (o lo que te interesa) → desde dónde arrancas → proyecto
 *   recomendado → tamaño → carpeta → la IA diseña el proyecto completo.
 * Las lecciones sin IA aparecen entre las recomendaciones y no necesitan
 * modelo: el código ya está escrito y probado. En modo sin IA, son la opción.
 */
export async function learn(
  context: vscode.ExtensionContext,
  topicId?: string,
  opts: { recommend?: boolean; tema?: string; interes?: string } = {}
): Promise<void> {
  const st: LearnState = { recommend: !!opts.recommend, interes: opts.interes?.trim() || undefined };
  st.topic = topicId ? LEARN_TOPICS.find((t) => t.id === topicId) : undefined;
  st.tema = st.topic?.nombre;
  // Escrito en «Empezar»: el tema tal cual lo escribiste (si coincide con el catálogo, se usa su stack).
  if (opts.tema?.trim()) {
    st.tema = opts.tema.trim();
    st.topic = matchTopic(st.tema);
  }

  // La primera vez se elige cómo usar la IA (cualquier proveedor, local o sin IA).
  if (!(await prepareAI())) {
    return;
  }
  const sinIA = noAI();
  let llm: Llm | undefined;
  if (!sinIA) {
    const { provider, model, baseUrl } = resolveActiveConfig();
    const apiKey = await ensureApiKey(context, provider);
    if (provider.needsKey && !apiKey) {
      return;
    }
    llm = (system, user, maxTokens, title) =>
      vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title, cancellable: true }, (_p, token) =>
        complete({ provider, baseUrl, model, apiKey, system, user, maxTokens, token })
      );
  }

  const total = () => (st.idea?.leccion ? 4 : 5);
  const head = () => (st.recommend ? 'Recomiéndame un proyecto' : `Aprender ${st.tema ?? '…'}`);

  const steps: (() => Promise<number | typeof BACK | undefined>)[] = [
    // 0 · tema
    async () => {
      const items: (Item<string> | vscode.QuickPickItem)[] = [
        { label: '$(lightbulb) Recomiéndame un proyecto', description: 'según lo que te interesa', value: RECOMMEND }
      ];
      if (LESSONS.length) {
        items.push({ label: 'Lecciones sin IA', kind: vscode.QuickPickItemKind.Separator });
        for (const l of LESSONS) {
          items.push({ label: `$(book) ${l.tema}`, description: `${l.titulo} · sin IA`, value: `lesson:${l.id}` });
        }
      }
      for (const kind of TOPIC_KINDS) {
        items.push({ label: kind.titulo, kind: vscode.QuickPickItemKind.Separator });
        for (const t of LEARN_TOPICS.filter((x) => x.tipo === kind.tipo)) {
          items.push({ label: t.nombre, description: t.stack, value: t.id });
        }
      }
      items.push({ label: '', kind: vscode.QuickPickItemKind.Separator }, { label: '$(edit) Otro tema…', description: 'escribe lo que quieras aprender', value: OTHER });
      const r = await pickStep(items, {
        title: '¿Qué quieres aprender?',
        step: 1,
        total: total(),
        current: st.topic?.id,
        value: st.topic ? undefined : st.tema,
        placeholder: 'Escribe lo que quieras aprender (Rust, patrones de API, Kubernetes…) o elige un tema',
        freeText: (t) => ({ label: `$(edit) Aprender «${t}»`, description: matchTopic(t) ? `con el stack de ${matchTopic(t)!.nombre}` : 'la IA diseña el proyecto', value: `free:${t}` })
      });
      if (r === undefined || r === BACK) {
        return r;
      }
      if (r === RECOMMEND) {
        st.recommend = true;
        return 2;
      }
      st.recommend = false;
      if (r === OTHER) {
        return 1;
      }
      if (r.startsWith('free:')) {
        st.tema = r.slice(5);
        st.topic = matchTopic(st.tema);
        return 3;
      }
      if (r.startsWith('lesson:')) {
        const lesson = getLesson(r.slice(7))!;
        st.topic = LEARN_TOPICS.find((t) => t.id === lesson.topicId);
        st.tema = lesson.tema;
        st.idea = lessonIdea(lesson);
        return 6;
      }
      st.topic = LEARN_TOPICS.find((t) => t.id === r);
      st.tema = st.topic?.nombre;
      return 3;
    },
    // 1 · otro tema
    async () => {
      const r = await inputStep({ title: '¿Qué quieres aprender?', step: 1, total: total(), current: st.topic ? undefined : st.tema, prompt: 'Ej: "Rust", "patrones de API", "Kubernetes", "scraping con Python", "entrenar una IA".' });
      if (r === undefined || r === BACK) {
        return r;
      }
      st.tema = r;
      st.topic = matchTopic(r);
      return 3;
    },
    // 2 · lo que te interesa
    async () => {
      const r = await inputStep({ title: 'Recomiéndame un proyecto', step: 1, total: total(), current: st.interes, prompt: '¿Qué te interesa o para qué quieres aprender? Ej: "quiero trabajar de backend", "me gustan los videojuegos", "entender la IA", "automatizar mi trabajo con Excel".' });
      if (r === undefined || r === BACK) {
        return r;
      }
      st.interes = r;
      return 3;
    },
    // 3 · nivel
    async () => {
      const r = await pickStep<LearnLevel>(
        [
          { label: 'Desde cero', description: 'nunca programé', value: 'cero' },
          { label: 'Ya programo en otra cosa', description: 'otro lenguaje o herramienta', value: 'otro-lenguaje' },
          { label: 'Lo usé un poco', description: 'quiero entenderlo de verdad', value: 'algo' }
        ],
        { title: `${head()} — ¿Desde dónde arrancas?`, step: 2, total: total(), current: st.nivel }
      );
      if (r === undefined || r === BACK) {
        return r;
      }
      st.nivel = r;
      return 4;
    },
    // 4 · proyecto recomendado
    async () => {
      const key = `${st.recommend ? st.interes : st.tema}|${st.nivel}`;
      if (st.ideasKey !== key) {
        st.ideas = await loadIdeas(llm, st, []);
        st.ideasKey = key;
      }
      const ideas = st.ideas ?? [];
      const MORE = -1;
      const OWN = -2;
      const nivelTxt = { baja: 'básico', media: 'intermedio', alta: 'avanzado' };
      const items: (Item<number> | vscode.QuickPickItem)[] = ideas.map((i, n) => ({
        label: `${i.leccion ? '$(book) ' : ''}${i.titulo}`,
        description: [i.leccion ? 'sin IA' : '', st.recommend ? i.tema : '', nivelTxt[i.dificultad], i.duracion, i.docker ? 'Docker' : '', i.nube ? 'nube' : '', !i.leccion && !llm ? 'necesita IA' : '']
          .filter(Boolean)
          .join(' · '),
        detail: i.descripcion + (i.aprendes.length ? ` Aprendes: ${i.aprendes.join(', ')}.` : ''),
        value: n
      }));
      if (!ideas.length) {
        items.push({ label: sinIA ? 'Sin IA no hay proyectos para este tema todavía' : 'No llegaron recomendaciones', description: sinIA ? 'elige una lección sin IA o activa una IA' : '', value: MORE });
      }
      items.push({ label: '', kind: vscode.QuickPickItemKind.Separator });
      if (llm) {
        items.push({ label: '$(refresh) Otras recomendaciones', value: MORE });
        if (!st.recommend) {
          items.push({ label: '$(edit) Tengo mi propia idea de proyecto…', value: OWN });
        }
      }
      const r = await pickStep(items, {
        title: `${head()} — Proyectos recomendados`,
        step: 3,
        total: total(),
        current: st.idea ? ideas.indexOf(st.idea) : undefined,
        placeholder: llm ? 'La IA los eligió para tu nivel; las lecciones sin IA ya están escritas y probadas' : 'Modo sin IA: las lecciones están completas; el resto necesita una IA'
      });
      if (r === undefined || r === BACK) {
        return r;
      }
      if (r === MORE) {
        if (llm) {
          st.ideas = await loadIdeas(llm, st, ideas.map((i) => i.titulo));
        }
        return 4;
      }
      if (r === OWN) {
        const own = await inputStep({ title: `Tu proyecto para aprender ${st.tema}`, step: 3, total: total(), prompt: 'Describe qué quieres construir. Ej: "un bot que me recuerde tomar agua".' });
        if (own === undefined) {
          return undefined;
        }
        if (own === BACK) {
          return 4;
        }
        st.idea = { titulo: own, descripcion: own, aprendes: [], dificultad: 'media', duracion: '', docker: false, nube: false, tema: st.tema };
        return 5;
      }
      const idea = ideas[r];
      if (!idea.leccion && !llm) {
        const action = await vscode.window.showInformationMessage(
          `«${idea.titulo}» lo diseña la IA: en modo sin IA solo están las lecciones ya escritas. Activa una IA con API key o una IA local (gratis, en tu PC).`,
          'Elegir IA'
        );
        if (action) {
          await vscode.commands.executeCommand('autocompletehelp.selectModel');
          return undefined;
        }
        return 4;
      }
      st.idea = idea;
      if (st.recommend || !st.tema) {
        st.tema = idea.tema || idea.titulo;
        st.topic = matchTopic(`${idea.tema ?? ''} ${idea.titulo}`);
      }
      return idea.leccion ? 6 : 5;
    },
    // 5 · tamaño
    async () => {
      const r = await pickStep<LearnSize>(
        [
          { label: 'Corto', description: '6 a 8 pasos · una o dos horas', value: 'corto' },
          { label: 'Mediano', description: '10 a 12 pasos · un fin de semana', value: 'mediano' },
          { label: 'Completo', description: '14 a 18 pasos · un proyecto entero', value: 'completo' }
        ],
        { title: `«${st.idea?.titulo}» — ¿Qué tamaño de proyecto?`, step: 4, total: total(), current: st.tamano }
      );
      if (r === undefined || r === BACK) {
        return r;
      }
      st.tamano = r;
      return 6;
    },
    // 6 · carpeta
    async () => {
      const r = await chooseFolder(st.tema ?? 'proyecto', total(), total());
      if (r === undefined || r === BACK) {
        return r;
      }
      st.folder = r;
      return 7;
    }
  ];

  const start = st.tema || (st.recommend && st.interes) ? 3 : st.recommend ? 2 : 0;
  if (!(await runSteps(steps, start)) || !st.folder || !st.idea || !st.tema) {
    return;
  }
  const lesson = getLesson(st.idea.leccion);
  if (lesson) {
    await createFromLesson(context, lesson, st.folder);
    return;
  }
  if (!llm || !st.nivel || !st.tamano) {
    return;
  }
  await design(context, llm, { tema: st.tema, nivel: st.nivel, tamano: st.tamano, topic: st.topic, idea: st.idea }, st.folder);
}

function lessonIdea(l: Lesson): ProjectIdea {
  return {
    titulo: l.titulo,
    descripcion: `Lección sin IA: el código y las explicaciones ya están escritos y probados. ${l.proyecto.charAt(0).toUpperCase()}${l.proyecto.slice(1)}.`,
    aprendes: l.objetivos,
    dificultad: l.dificultad,
    duracion: l.duracion,
    docker: !!l.entorno.docker,
    nube: false,
    tema: l.tema,
    leccion: l.id
  };
}

/**
 * Proyectos para elegir: primero las lecciones sin IA del tema; después los
 * que recomienda la IA o, sin respuesta (o sin IA), las ideas del catálogo.
 */
async function loadIdeas(llm: Llm | undefined, st: LearnState, previous: string[]): Promise<ProjectIdea[]> {
  const lessons = (st.recommend ? LESSONS : lessonsForTopic(st.topic?.id)).map(lessonIdea);
  let ideas: ProjectIdea[] = [];
  if (llm) {
    try {
      const answer = await llm(
        buildIdeasSystemPrompt({ tema: st.recommend ? undefined : st.tema, nivel: st.nivel ?? 'cero', interes: st.interes, topic: st.topic }),
        previous.length ? `Recomiéndame otros, distintos de: ${previous.join('; ')}` : 'Recomiéndame proyectos.',
        1500,
        'AutoCompleteHelp: buscando proyectos para recomendarte…'
      );
      ideas = parseIdeas(answer);
    } catch {
      // sin respuesta: quedan las ideas del catálogo
    }
  }
  if (!ideas.length && st.topic) {
    ideas = curatedIdeas(st.topic);
  }
  return [...lessons, ...ideas];
}

/** La IA diseña el proyecto elegido y se crea en la carpeta. */
async function design(context: vscode.ExtensionContext, llm: Llm, req: LearnRequest, folder: Target): Promise<void> {
  let answer = '';
  try {
    answer = await llm(buildLearnSystemPrompt(req), `Quiero aprender: ${req.tema}. Proyecto: ${req.idea?.titulo}`, 6000, `AutoCompleteHelp: diseñando «${req.idea?.titulo}»…`);
  } catch (err: any) {
    if (err?.name !== 'AbortError') {
      vscode.window.showErrorMessage(`AutoCompleteHelp: no se pudo diseñar el proyecto (${err?.message ?? err}).`);
    }
    return;
  }
  const { markdown, proposal } = parseLearnAnswer(answer);
  showMarkdownPanel(`AutoCompleteHelp — ${req.idea?.titulo}`, markdown || answer);
  if (!proposal) {
    vscode.window.showWarningMessage('AutoCompleteHelp: la respuesta no trajo un plan válido. Vuelve a intentarlo; la guía quedó en el panel.');
    return;
  }
  const tests = proposal.plan.filter((s) => s.tipo === 'test').length;
  const docker = proposal.entorno?.docker ? ' · con Docker' : '';
  const ok = await vscode.window.showInformationMessage(
    `«${req.idea?.titulo}» para aprender ${req.tema}: ${proposal.stack.resumen ?? ''} · ${proposal.plan.length} pasos (${tests} de tests)${docker}. La guía está en el panel. ¿Lo creo en ${folder.label}?`,
    'Crear el proyecto'
  );
  if (!ok) {
    return;
  }
  await writeLearnProject(folder.uri, learnProjectFile(proposal, req), markdown, req.tema);
  await afterCreate(context, folder, req.tema);
}

/** Una lección sin IA: se escribe tal cual, sin modelo. */
async function createFromLesson(context: vscode.ExtensionContext, lesson: Lesson, folder: Target): Promise<void> {
  showMarkdownPanel(`AutoCompleteHelp — ${lesson.titulo}`, `# ${lesson.titulo}\n\n${lesson.guia}`);
  await writeLearnProject(folder.uri, lessonProjectFile(lesson), lesson.guia, lesson.tema);
  await afterCreate(context, folder, lesson.tema);
}

async function afterCreate(context: vscode.ExtensionContext, folder: Target, tema: string): Promise<void> {
  if (folder.isCurrent) {
    await offerStart(tema);
    return;
  }
  await context.globalState.update(PENDING_KEY, folder.uri.toString());
  await vscode.commands.executeCommand('vscode.openFolder', folder.uri, { forceNewWindow: false });
}

/** Lección elegida desde la sección: solo falta la carpeta. */
async function learnLesson(context: vscode.ExtensionContext, id: string): Promise<void> {
  const lesson = getLesson(id);
  if (!lesson) {
    return;
  }
  const folder = await chooseFolder(lesson.tema, 1, 1);
  if (folder && folder !== BACK) {
    await createFromLesson(context, lesson, folder);
  }
}

/**
 * Dónde crear el proyecto. La carpeta abierta solo si está vacía (o casi):
 * nunca se mezcla un proyecto nuevo con uno existente.
 */
async function chooseFolder(tema: string, step: number, total: number): Promise<Target | typeof BACK | undefined> {
  const current = projectRoot();
  let currentUsable = false;
  if (current) {
    const entries = await vscode.workspace.fs.readDirectory(current);
    currentUsable = entries.filter(([name]) => !name.startsWith('.')).length === 0;
  }
  const choice = await pickStep<string>(
    [
      { label: '$(new-folder) En una carpeta nueva', description: folderNameFor(tema), value: 'new' },
      ...(currentUsable ? [{ label: '$(folder-opened) En la carpeta abierta', description: 'está vacía', value: 'here' }] : [])
    ],
    { title: `Aprender ${tema} — ¿Dónde lo creo?`, step, total }
  );
  if (choice === undefined || choice === BACK) {
    return choice;
  }
  if (choice === 'here' && current) {
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
  | { kind: 'recommend' }
  | { kind: 'lessons' }
  | { kind: 'lesson'; lesson: Lesson };

class LearnViewProvider implements vscode.TreeDataProvider<LearnNode> {
  getTreeItem(node: LearnNode): vscode.TreeItem {
    if (node.kind === 'group') {
      const item = new vscode.TreeItem(node.titulo, vscode.TreeItemCollapsibleState.Collapsed);
      item.contextValue = 'group';
      return item;
    }
    if (node.kind === 'lessons') {
      const item = new vscode.TreeItem('Lecciones sin IA', vscode.TreeItemCollapsibleState.Collapsed);
      item.description = 'completas, gratis, sin conexión';
      item.iconPath = new vscode.ThemeIcon('book');
      return item;
    }
    if (node.kind === 'lesson') {
      const l = node.lesson;
      const item = new vscode.TreeItem(l.titulo, vscode.TreeItemCollapsibleState.None);
      item.iconPath = new vscode.ThemeIcon('book');
      item.description = `${l.tema} · ${l.duracion}`;
      item.tooltip = new vscode.MarkdownString(`**${l.titulo}** (sin IA)\n\nEl código y las explicaciones ya están escritos y probados: completamos juntos cada línea sin API key ni modelo.\n\nAprendes: ${l.objetivos.join(', ')}`);
      item.command = { command: 'autocompletehelp.learnLesson', title: 'Empezar la lección', arguments: [l.id] };
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
        ...(LESSONS.length ? [{ kind: 'lessons' as const }] : []),
        ...TOPIC_KINDS.map((k) => ({ kind: 'group' as const, titulo: k.titulo, tipo: k.tipo })),
        { kind: 'other' as const }
      ];
    }
    if (node.kind === 'lessons') {
      return LESSONS.map((lesson) => ({ kind: 'lesson' as const, lesson }));
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
    vscode.commands.registerCommand('autocompletehelp.learnLesson', (id: string) => learnLesson(context, id)),
    vscode.commands.registerCommand('autocompletehelp.start', () => start(context)),
    // «Empezar»: tres cajas para escribir (proyecto, aprender, interés).
    vscode.window.registerWebviewViewProvider(StartViewProvider.id, new StartViewProvider(context), { webviewOptions: { retainContextWhenHidden: true } })
  );
}

/**
 * «Empezar»: la puerta de entrada. Siempre se puede elegir entre construir
 * un proyecto propio, aprender un tema o pedir una recomendación.
 */
export async function start(context: vscode.ExtensionContext): Promise<void> {
  const pick = await pickStep<string>([
    { label: '$(rocket) Tengo un proyecto', description: 'lo describo y elijo stack y arquitectura', value: 'project' },
    { label: '$(mortar-board) Quiero aprender algo', description: 'un lenguaje, una librería, la nube, patrones, IA…', value: 'learn' },
    { label: '$(lightbulb) Recomiéndame un proyecto', description: 'según lo que me interesa', value: 'recommend' }
  ], {
    title: 'AutoCompleteHelp — ¿Qué quieres hacer?',
    step: 1,
    total: 1,
    placeholder: 'Escribe tu proyecto, lo que quieres aprender o lo que te interesa… o elige',
    freeText: (t) => [
      { label: `$(mortar-board) Aprender «${t}»`, description: 'proyectos para aprenderlo', value: `learn:${t}` },
      { label: `$(rocket) Mi proyecto: «${t}»`, description: 'elegir stack y arquitectura', value: `project:${t}` },
      { label: `$(lightbulb) Me interesa: «${t}»`, description: 'recomiéndame proyectos', value: `recommend:${t}` }
    ]
  });
  if (!pick || pick === BACK) {
    return;
  }
  const [what, ...rest] = pick.split(':');
  const text = rest.join(':');
  await startWith(context, what as StartKind, text);
}

export type StartKind = 'project' | 'learn' | 'recommend';

/** Arranca un camino con lo que la persona ya escribió (desde «Empezar» o la paleta). */
export async function startWith(context: vscode.ExtensionContext, what: StartKind, text = ''): Promise<void> {
  if (what === 'project') {
    await vscode.commands.executeCommand('autocompletehelp.setProjectPrompt', text || undefined);
  } else if (what === 'learn') {
    await learn(context, undefined, { tema: text });
  } else {
    await learn(context, undefined, { recommend: true, interes: text });
  }
}

