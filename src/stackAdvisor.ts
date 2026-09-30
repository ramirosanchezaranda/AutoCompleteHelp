import * as vscode from 'vscode';
import { resolveActiveConfig } from './providers/catalog';
import { complete } from './providers/client';
import { ensureApiKey } from './secrets';
import { buildStackSystemPrompt, getProjectPrompt, saveProjectPrompt } from './prompts';
import { showMarkdownPanel } from './explain';
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

  const preferred = await vscode.window.showInputBox({
    title: '¿Ya tienes un stack en mente?',
    prompt:
      'Escríbelo si ya lo elegiste (ej: "Python con FastAPI y PostgreSQL"). Déjalo vacío y te recomiendo el mejor para aprender con este proyecto.',
    value: getProject()?.stack?.resumen ?? '',
    ignoreFocusOut: true
  });
  if (preferred === undefined) {
    return;
  }

  const { provider, model, baseUrl } = resolveActiveConfig();
  const apiKey = await ensureApiKey(context, provider);
  if (provider.needsKey && !apiKey) {
    return;
  }

  let answer = '';
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: preferred.trim()
        ? `AutoCompleteHelp: preparando el proyecto con ${preferred.trim()}…`
        : 'AutoCompleteHelp: analizando tu proyecto y eligiendo el mejor stack…'
    },
    async () => {
      try {
        answer = await complete({
          provider,
          baseUrl,
          model,
          apiKey,
          system: buildStackSystemPrompt(preferred.trim() || undefined),
          user: `Mi proyecto: ${projectPrompt}\n\n${
            preferred.trim() ? 'Concreta y planifica mi stack.' : 'Recomiéndame el stack.'
          }`,
          maxTokens: 2500
        });
      } catch (err: any) {
        vscode.window.showErrorMessage(`AutoCompleteHelp: ${err?.message ?? err}`);
      }
    }
  );
  if (!answer) {
    return;
  }

  const { markdown, proposal } = splitStackAnswer(answer);
  showMarkdownPanel('AutoCompleteHelp — Stack del proyecto', markdown);

  if (!proposal?.stack) {
    vscode.window.showWarningMessage(
      'AutoCompleteHelp: no pude leer el stack estructurado de la respuesta. Vuelve a intentarlo o edita autocompletehelp.json a mano.'
    );
    return;
  }

  const summary = proposal.stack.resumen ?? Object.values(proposal.stack).join(' + ');
  const steps = proposal.plan?.length ?? 0;
  const action = await vscode.window.showInformationMessage(
    `Stack: ${summary}${steps ? ` · plan de ${steps} pasos` : ''}`,
    `Guardar en ${PROJECT_FILE}`
  );
  if (!action) {
    return;
  }
  const inFile = await saveProject(context, {
    stack: proposal.stack,
    convenciones: proposal.convenciones,
    plan: proposal.plan
  });
  if (!inFile) {
    vscode.window.showWarningMessage(
      'AutoCompleteHelp: abre una carpeta de proyecto para guardar el stack en autocompletehelp.json.'
    );
    return;
  }
  const next = await vscode.window.showInformationMessage(
    'AutoCompleteHelp: stack y plan guardados. Desde ahora cada sugerencia usa estas versiones y convenciones.',
    'Abrir archivo'
  );
  if (next) {
    await openProjectFile();
  }
}

/**
 * Separa el Markdown legible del bloque ```ach-project con el JSON
 * estructurado. Función pura: se prueba aislada.
 */
export function splitStackAnswer(answer: string): {
  markdown: string;
  proposal?: Omit<ProjectFile, 'prompt'>;
} {
  const block = answer.match(/```ach-project\s*\n([\s\S]*?)```/);
  if (!block) {
    return { markdown: answer.trim() };
  }
  const markdown = answer.replace(block[0], '').trim();
  // parseProjectFile valida y normaliza; el prompt no viene en la propuesta.
  const parsed = parseProjectFile(block[1]);
  if (!parsed) {
    return { markdown };
  }
  const { prompt: _ignored, ...proposal } = parsed;
  return { markdown, proposal };
}
