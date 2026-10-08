import * as vscode from 'vscode';
import { allProviders, getProvider, resolveActiveConfig } from './providers/catalog';
import { addProvider } from './addProvider';
import { setApiKeyCommand, ensureApiKey } from './secrets';
import { setProjectPrompt } from './prompts';
import { explainSelection } from './explain';
import { recommendStack } from './stackAdvisor';
import { showMarkdownPanel } from './explain';
import { progressReport, resetLedger } from './conceptLedger';
import { initProjectFile, openProjectFile } from './projectFile';
import { ProjectContext } from './projectContext';
import { insertInstruction } from './instructions';
import { registerPlanView } from './planView';
import { createStructure } from './scaffold';
import { DictationManager } from './dictation';
import { ReviewReminder, startReview } from './review';
import { ErrorHelpProvider, explainError } from './errorHelp';
import { chooseArchitecture } from './archPicker';

let statusBarItem: vscode.StatusBarItem;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const output = vscode.window.createOutputChannel('AutoCompleteHelp');
  context.subscriptions.push(output);

  // autocompletehelp.json: prompt, stack, convenciones y plan del proyecto.
  await initProjectFile(context);

  // Árbol de archivos, dependencias y archivos importados, para cada sugerencia.
  const projectContext = new ProjectContext();
  context.subscriptions.push(projectContext);

  // «Completamos juntos»: la línea en gris, y la escribes encima. También
  // detecta las instrucciones «// ach: …» + Enter.
  const dictation = new DictationManager(context, output, projectContext);
  context.subscriptions.push(dictation);

  // Repaso espaciado: aviso en la barra de estado cuando vence un concepto.
  const reminder = new ReviewReminder(context);
  dictation.afterFinish = () => reminder.refresh();
  context.subscriptions.push(reminder);

  // «Entender este error» en la bombita de los errores del editor.
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider({ pattern: '**' }, new ErrorHelpProvider(), {
      providedCodeActionKinds: ErrorHelpProvider.kinds
    })
  );


  // Panel «Plan del proyecto» en el explorador.
  registerPlanView(context);

  // Barra de estado con el proveedor y el modelo activos.
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
    vscode.commands.registerCommand('autocompletehelp.showProgress', () =>
      showProgress(context)
    ),
    vscode.commands.registerCommand('autocompletehelp.instruct', () => insertInstruction()),
    vscode.commands.registerCommand('autocompletehelp.createStructure', () =>
      createStructure(context)
    ),
    vscode.commands.registerCommand('autocompletehelp.openProjectFile', openProjectFile),
    vscode.commands.registerCommand('autocompletehelp.selectModel', () =>
      selectModel(context)
    ),
    vscode.commands.registerCommand('autocompletehelp.chooseArchitecture', () => chooseArchitecture(context)),
    vscode.commands.registerCommand('autocompletehelp.review', () => startReview(context, dictation)),
    vscode.commands.registerCommand(
      'autocompletehelp.explainError',
      (uri?: vscode.Uri, range?: vscode.Range, message?: string, source?: string) =>
        explainError(context, uri, range, message, source)
    ),
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
  statusBarItem.text = `${enabled ? '$(sparkle)' : '$(circle-slash)'} ACH: ${model}`;
  statusBarItem.tooltip = new vscode.MarkdownString(
    [
      `**AutoCompleteHelp** ${enabled ? '(activo)' : '(desactivado)'}`,
      `- Proveedor: ${provider.label}`,
      `- Modelo: ${model}`,
      '- Modo: completamos juntos (escribes cada línea en gris)',
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


/** Panel con los conceptos registrados y cuánto escribió el usuario por su cuenta. */
async function showProgress(context: vscode.ExtensionContext): Promise<void> {
  showMarkdownPanel('AutoCompleteHelp — Tu progreso', progressReport(context));
  const action = await vscode.window.showInformationMessage(
    'AutoCompleteHelp baja las explicaciones de los conceptos que ya repetiste.',
    'Reiniciar progreso'
  );
  if (action === 'Reiniciar progreso') {
    const confirm = await vscode.window.showWarningMessage(
      'Se borrarán todos los conceptos registrados y volverás a recibir las explicaciones completas. ¿Continuar?',
      { modal: true },
      'Reiniciar'
    );
    if (confirm === 'Reiniciar') {
      await resetLedger(context);
      vscode.window.showInformationMessage('AutoCompleteHelp: progreso reiniciado.');
    }
  }
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
