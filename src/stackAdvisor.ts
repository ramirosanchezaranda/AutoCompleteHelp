import * as vscode from 'vscode';
import { noAI, resolveActiveConfig } from './providers/catalog';
import { complete } from './providers/client';
import { ensureApiKey, prepareAI } from './secrets';
import { buildStackSystemPrompt, getProjectPrompt, saveProjectPrompt } from './prompts';
import { showMarkdownPanel } from './explain';
import { StackProposal, mergeWithProfile, splitStackAnswer } from './core/stack';
export * from './core/stack';
import { PROFILES, StackProfile, getProfile, matchProfile } from './stackProfiles';
import { pickArchitecture, toProjectArchitecture, writeArchitectureDoc } from './archPicker';
import {
  PROJECT_FILE,
  ProjectFile,
  getProject,
  openProjectFile,
  parseProjectFile,
  saveProject
} from './projectFile';

/**
 * Comando "Elegir stack del proyecto". Dos caminos:
 *  - Ya sabes qué stack quieres → lo concreta (versiones, convenciones) y planifica.
 *  - No lo sabes → recomienda el más adecuado para aprender con este proyecto.
 * En ambos, el resultado queda ESTRUCTURADO en autocompletehelp.json, y desde
 * ahí guía todo el autocompletado.
 */
export async function recommendStack(context: vscode.ExtensionContext): Promise<void> {
  // La primera vez se elige cómo usar la IA (cualquier proveedor, local o sin IA).
  if (!(await prepareAI())) {
    return;
  }
  let projectPrompt = getProjectPrompt(context);
  if (!projectPrompt) {
    const value = await vscode.window.showInputBox({
      title: '¿Qué proyecto quieres construir?',
      prompt:
        'Describe tu idea con tus palabras (ej: "una app para reservar canchas de fútbol con mis amigos"). No hace falta saber de tecnología.',
      ignoreFocusOut: true
    });
    if (!value) {
      return;
    }
    projectPrompt = value;
    await saveProjectPrompt(context, value);
  }

  const choice = await chooseStack();
  if (!choice) {
    return;
  }
  const { preferred } = choice;
  let profile = choice.profile;

  // Antes del plan, la arquitectura: decide dónde vive cada archivo.
  const arch = await pickArchitecture(profile?.id);
  if (!arch) {
    return;
  }

  let answer = '';
  let failure = '';
  const sinIA = noAI();
  if (sinIA && !profile) {
    vscode.window.showInformationMessage(
      'AutoCompleteHelp: sin IA, el stack sale de los perfiles curados (traen su plan base). Elige uno, o activa una IA para cualquier otro stack.'
    );
    return;
  }
  const { provider, model, baseUrl } = resolveActiveConfig();
  const apiKey = sinIA ? undefined : await ensureApiKey(context, provider);
  if (!sinIA && provider.needsKey && !apiKey) {
    return;
  }
  if (sinIA) {
    failure = 'modo sin IA';
  } else await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: preferred
        ? `AutoCompleteHelp: planificando el proyecto con ${preferred}…`
        : 'AutoCompleteHelp: analizando tu proyecto y eligiendo el mejor stack…'
    },
    async () => {
      try {
        answer = await complete({
          provider,
          baseUrl,
          model,
          apiKey,
          system: buildStackSystemPrompt(preferred, profile, arch.arch),
          user: `Mi proyecto: ${projectPrompt}\n\n${
            preferred ? 'Concreta y planifica mi stack.' : 'Recomiéndame el stack.'
          }`,
          maxTokens: 2500
        });
      } catch (err: any) {
        failure = err?.message ?? String(err);
      }
    }
  );

  let proposal: StackProposal | undefined;
  if (answer) {
    const split = splitStackAnswer(answer);
    showMarkdownPanel('AutoCompleteHelp — Stack del proyecto', split.markdown);
    proposal = split.proposal;
    // Recomendación libre: si coincide con un perfil curado, lo adoptamos.
    profile ??= matchProfile(
      [proposal?.stack?.resumen, proposal?.stack?.framework].filter(Boolean).join(' ')
    );
  } else if (profile) {
    // Sin conexión con el modelo, un perfil curado igual sirve: su plan base.
    const action = await vscode.window.showWarningMessage(
      `AutoCompleteHelp: no pude consultar al modelo (${failure}). ¿Guardo ${profile.nombre} con su plan base?` +
        (['capas', 'mvc', 'componentes'].includes(arch.arch.id)
          ? ''
          : ` Ojo: el plan base sigue la estructura del perfil, no ${arch.arch.nombre}; ajusta las rutas en autocompletehelp.json o reintenta con conexión.`),
      'Usar el plan base'
    );
    if (!action) {
      return;
    }
  } else {
    vscode.window.showErrorMessage(`AutoCompleteHelp: ${failure || 'el modelo no respondió.'}`);
    return;
  }

  const merged = mergeWithProfile(proposal, profile);
  const final = merged && { ...merged, arquitectura: toProjectArchitecture(arch) };
  if (!final) {
    vscode.window.showWarningMessage(
      'AutoCompleteHelp: no pude leer el stack estructurado de la respuesta. Vuelve a intentarlo o edita autocompletehelp.json a mano.'
    );
    return;
  }

  const summary = final.stack.resumen ?? Object.values(final.stack).join(' + ');
  const steps = final.plan?.length ?? 0;
  const action = await vscode.window.showInformationMessage(
    `Stack: ${summary} · ${arch.arch.nombre}${steps ? ` · plan de ${steps} pasos` : ''}${profile ? ' · perfil curado' : ''}`,
    `Guardar en ${PROJECT_FILE}`
  );
  if (!action) {
    return;
  }
  const inFile = await saveProject(context, final);
  if (!inFile) {
    vscode.window.showWarningMessage(
      'AutoCompleteHelp: abre una carpeta de proyecto para guardar el stack en autocompletehelp.json.'
    );
    return;
  }
  await writeArchitectureDoc(arch);
  const next = await vscode.window.showInformationMessage(
    'AutoCompleteHelp: stack, arquitectura y plan guardados (la decisión de arquitectura está en docs/ARQUITECTURA.md). ¿Creo la estructura de carpetas y archivos?',
    'Crear estructura',
    'Abrir archivo'
  );
  if (next === 'Crear estructura') {
    await vscode.commands.executeCommand('autocompletehelp.createStructure');
  } else if (next) {
    await openProjectFile();
  }
}

/**
 * Primer paso del comando: stacks curados, uno escrito por el usuario, o
 * "recomiéndame". Devuelve undefined si se cancela.
 */
async function chooseStack(): Promise<
  { preferred?: string; profile?: StackProfile } | undefined
> {
  const OTHER = 'other';
  const RECOMMEND = 'recommend';
  const items: (vscode.QuickPickItem & { id: string })[] = [
    ...PROFILES.map((p) => ({ label: p.nombre, description: p.para, detail: p.porQue, id: p.id })),
    { label: '', kind: vscode.QuickPickItemKind.Separator, id: '' },
    { label: '$(edit) Otro stack…', description: 'escribe el que quieras usar', id: OTHER },
    { label: '$(lightbulb) No sé, recomiéndame uno', description: 'según tu proyecto, para aprender', id: RECOMMEND }
  ];
  const pick = await vscode.window.showQuickPick(items, {
    title: 'Elegir stack del proyecto',
    placeHolder: 'Stacks curados para aprender, otro a tu elección, o una recomendación',
    matchOnDescription: true
  });
  if (!pick) {
    return undefined;
  }
  if (pick.id === RECOMMEND) {
    return {};
  }
  if (pick.id === OTHER) {
    const text = await vscode.window.showInputBox({
      title: '¿Qué stack quieres usar?',
      prompt: 'Ej: "Go con Gin y PostgreSQL", "Vue 3 con Vite". Lo concreto con versiones, convenciones y un plan.',
      value: getProject()?.stack?.resumen ?? '',
      ignoreFocusOut: true
    });
    if (!text?.trim()) {
      return undefined;
    }
    return { preferred: text.trim(), profile: matchProfile(text) };
  }
  const profile = getProfile(pick.id);
  return profile ? { preferred: profile.nombre, profile } : undefined;
}

