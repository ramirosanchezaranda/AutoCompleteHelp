import * as vscode from 'vscode';
import { resolveActiveConfig } from './providers/catalog';
import { complete } from './providers/client';
import { ensureApiKey } from './secrets';
import { buildStackSystemPrompt, getProjectPrompt, saveProjectPrompt } from './prompts';
import { showMarkdownPanel } from './explain';

/**
 * Comando "Recomendar stack para mi proyecto": a partir del prompt del proyecto,
 * el LLM propone el stack más adecuado para aprender, con alternativas,
 * estructura inicial y ruta de aprendizaje. Permite añadir la elección al prompt.
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

  const { provider, model, baseUrl } = resolveActiveConfig();
  const apiKey = await ensureApiKey(context, provider);
  if (provider.needsKey && !apiKey) {
    return;
  }

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'AutoCompleteHelp: analizando tu proyecto y eligiendo el mejor stack…'
    },
    async () => {
      try {
        const markdown = await complete({
          provider,
          baseUrl,
          model,
          apiKey,
          system: buildStackSystemPrompt(),
          user: `Mi proyecto: ${projectPrompt}\n\nRecomiéndame el stack.`,
          maxTokens: 1800
        });
        showMarkdownPanel('AutoCompleteHelp — Stack recomendado', markdown);

        // Si el modelo cerró con "STACK RECOMENDADO: …", ofrecemos fijarlo en el prompt
        // para que TODO el autocompletado a partir de ahora use ese stack.
        const match = markdown.match(/STACK RECOMENDADO:\s*(.+)/);
        if (match) {
          const stack = match[1].trim();
          const action = await vscode.window.showInformationMessage(
            `Stack recomendado: ${stack}`,
            'Añadir al prompt del proyecto'
          );
          if (action) {
            await saveProjectPrompt(context, `${projectPrompt}. Stack elegido: ${stack}`);
            vscode.window.showInformationMessage(
              'AutoCompleteHelp: el stack quedó fijado en tu prompt — el autocompletado te guiará con esas tecnologías.'
            );
          }
        }
      } catch (err: any) {
        vscode.window.showErrorMessage(`AutoCompleteHelp: ${err?.message ?? err}`);
      }
    }
  );
}
