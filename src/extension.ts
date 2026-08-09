import * as vscode from 'vscode';
import { allProviders, getProvider, resolveActiveConfig } from './providers/catalog';
import { addProvider } from './addProvider';
import { AutoCompleteHelpProvider } from './inlineProvider';
import { setApiKeyCommand, ensureApiKey } from './secrets';
import { setProjectPrompt, LearningLevel } from './prompts';
import { explainSelection } from './explain';
import { recommendStack } from './stackAdvisor';

let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext): void {
  const output = vscode.window.createOutputChannel('AutoCompleteHelp');
  context.subscriptions.push(output);

  // Autocompletado inline en todos los lenguajes.
  context.subscriptions.push(
    vscode.languages.registerInlineCompletionItemProvider(
      { pattern: '**' },
      new AutoCompleteHelpProvider(context, output)
    )
  );

  // Barra de estado con proveedor/modelo/nivel activos.
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.command = 'autocompletehelp.selectModel';
  context.subscriptions.push(statusBarItem);
  refreshStatusBar();
  statusBarItem.show();

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('autocompletehelp')) {
        refreshStatusBar();
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('autocompletehelp.setProjectPrompt', () =>
      setProjectPrompt(context)
    ),
    vscode.commands.registerCommand('autocompletehelp.setApiKey', () =>
      setApiKeyCommand(context)
    ),
    vscode.commands.registerCommand('autocompletehelp.explainSelection', () =>
      explainSelection(context)
    ),
    vscode.commands.registerCommand('autocompletehelp.recommendStack', () =>
      recommendStack(context)
    ),
    vscode.commands.registerCommand('autocompletehelp.addProvider', () =>
      addProvider(context)
    ),
    vscode.commands.registerCommand('autocompletehelp.selectModel', () =>
      selectModel(context)
    ),
    vscode.commands.registerCommand('autocompletehelp.selectLearningLevel', selectLearningLevel),
    vscode.commands.registerCommand('autocompletehelp.toggle', toggleEnabled)
  );
}

export function deactivate(): void {
  /* nada que limpiar: todo está en context.subscriptions */
}

function refreshStatusBar(): void {
  const cfg = vscode.workspace.getConfiguration('autocompletehelp');
  const enabled = cfg.get<boolean>('enabled', true);
  const { provider, model } = resolveActiveConfig();
  const level = cfg.get<string>('learningLevel', 'guiado');
  statusBarItem.text = `${enabled ? '$(sparkle)' : '$(circle-slash)'} ACH: ${model}`;
  statusBarItem.tooltip = new vscode.MarkdownString(
    [
      `**AutoCompleteHelp** ${enabled ? '(activo)' : '(desactivado)'}`,
      `- Proveedor: ${provider.label}`,
      `- Modelo: ${model}`,
      `- Nivel de aprendizaje: ${level}`,
      '',
      'Haz clic para cambiar proveedor/modelo.'
    ].join('\n')
  );
}

/** QuickPick en dos pasos: proveedor → modelo (con opción de escribir otro ID). */
async function selectModel(context: vscode.ExtensionContext): Promise<void> {
  const cfg = vscode.workspace.getConfiguration('autocompletehelp');
  const currentProviderId = cfg.get<string>('provider', 'anthropic');

  const ADD_AI = '__add_ai__';
  const providerPick = await vscode.window.showQuickPick(
    [
      ...allProviders().map((p) => ({
        label: p.label,
        description: p.id === currentProviderId ? '(actual)' : undefined,
        id: p.id
      })),
      { label: '$(add) Agregar IA (endpoint + API key)…', id: ADD_AI }
    ],
    { title: 'Paso 1/2 — Elige el proveedor de LLM' }
  );
  if (!providerPick) {
    return;
  }
  if (providerPick.id === ADD_AI) {
    await vscode.commands.executeCommand('autocompletehelp.addProvider');
    refreshStatusBar();
    return;
  }
  const provider = getProvider(providerPick.id);

  const OTHER = '$(edit) Escribir otro ID de modelo…';
  const items = [...provider.models, OTHER];
  const modelPick = await vscode.window.showQuickPick(items, {
    title: `Paso 2/2 — Elige el modelo de ${provider.label}`
  });
  if (!modelPick) {
    return;
  }

  let model = modelPick;
  if (modelPick === OTHER) {
    const typed = await vscode.window.showInputBox({
      title: `ID de modelo de ${provider.label}`,
      prompt: 'Escribe el identificador exacto del modelo (ej: el nombre que aparece en la documentación del proveedor).',
      ignoreFocusOut: true
    });
    if (!typed) {
      return;
    }
    model = typed;
  }

  await cfg.update('provider', provider.id, vscode.ConfigurationTarget.Global);
  await cfg.update('model', model, vscode.ConfigurationTarget.Global);

  if (provider.needsKey) {
    await ensureApiKey(context, provider);
  }
  refreshStatusBar();
  vscode.window.showInformationMessage(`AutoCompleteHelp: usando ${provider.label} → ${model}`);
}

async function selectLearningLevel(): Promise<void> {
  const pick = await vscode.window.showQuickPick(
    [
      {
        label: 'educame',
        description: 'Desde cero 🌱 — cada línea explicada como un profesor paciente',
        detail: 'Para quien está empezando: conceptos definidos la primera vez, una idea nueva por sugerencia.'
      },
      {
        label: 'pista',
        description: 'Solo pistas en comentarios — tú escribes el código (máximo aprendizaje)',
        detail: 'Ideal para practicar: la IA te guía paso a paso pero nunca resuelve por ti.'
      },
      {
        label: 'guiado',
        description: 'Código + comentarios que explican el porqué (recomendado)',
        detail: 'Aprendes mientras avanzas: cada sugerencia viene explicada.'
      },
      {
        label: 'completo',
        description: 'Código directo, sin explicaciones (máxima velocidad)',
        detail: 'Como un autocompletado clásico.'
      }
    ],
    { title: '¿Cuánto quieres que te ayude la IA?' }
  );
  if (!pick) {
    return;
  }
  await vscode.workspace
    .getConfiguration('autocompletehelp')
    .update('learningLevel', pick.label as LearningLevel, vscode.ConfigurationTarget.Global);
  refreshStatusBar();
}

async function toggleEnabled(): Promise<void> {
  const cfg = vscode.workspace.getConfiguration('autocompletehelp');
  const next = !cfg.get<boolean>('enabled', true);
  await cfg.update('enabled', next, vscode.ConfigurationTarget.Global);
  refreshStatusBar();
  vscode.window.showInformationMessage(
    `AutoCompleteHelp: autocompletado ${next ? 'activado' : 'desactivado'}.`
  );
}
