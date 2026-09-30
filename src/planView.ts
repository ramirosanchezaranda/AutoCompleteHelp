import * as vscode from 'vscode';
import {
  PROJECT_FILE,
  PlanStep,
  getProject,
  markStep,
  nextStep,
  onDidChangeProject,
  projectRoot
} from './projectFile';
import { findStepLine, insertInstruction, stepFileContent, stepInstruction } from './instructions';

/**
 * Panel «Plan del proyecto» en el explorador. Convierte la guía
 * «➜ Siguiente paso» en algo accionable:
 *  - la casilla marca el paso como hecho (se guarda en autocompletehelp.json);
 *  - un clic abre el archivo del paso, o lo crea vacío con la instrucción del
 *    paso lista para que el autocompletado arranque.
 */

class StepItem extends vscode.TreeItem {
  constructor(
    readonly index: number,
    step: PlanStep,
    isCurrent: boolean
  ) {
    super(`${index + 1}. ${step.paso}`, vscode.TreeItemCollapsibleState.None);
    this.description = step.archivo ?? '';
    this.checkboxState = step.hecho
      ? vscode.TreeItemCheckboxState.Checked
      : vscode.TreeItemCheckboxState.Unchecked;
    if (isCurrent) {
      this.iconPath = new vscode.ThemeIcon('arrow-right', new vscode.ThemeColor('charts.yellow'));
      this.description = `${step.archivo ?? ''}  ← siguiente`;
    }
    this.tooltip = new vscode.MarkdownString(
      [
        `**${step.paso}**`,
        step.concepto ? `Concepto: ${step.concepto}` : '',
        step.archivo ? `Archivo: \`${step.archivo}\`` : '',
        '',
        'Clic: abrir el archivo del paso con su instrucción `ach:`.',
        'Casilla: marcar como hecho.'
      ]
        .filter(Boolean)
        .join('\n\n')
    );
    this.command = {
      command: 'autocompletehelp.openStep',
      title: 'Abrir paso del plan',
      arguments: [index]
    };
  }
}

class PlanProvider implements vscode.TreeDataProvider<StepItem> {
  private readonly emitter = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this.emitter.event;

  refresh(): void {
    this.emitter.fire();
  }

  getTreeItem(item: StepItem): vscode.TreeItem {
    return item;
  }

  getChildren(): StepItem[] {
    const project = getProject();
    const plan = project?.plan ?? [];
    const current = nextStep(project);
    return plan.map((step, i) => new StepItem(i, step, step === current));
  }

  dispose(): void {
    this.emitter.dispose();
  }
}

export function registerPlanView(context: vscode.ExtensionContext): void {
  const provider = new PlanProvider();
  const view = vscode.window.createTreeView('autocompletehelp.plan', {
    treeDataProvider: provider
  });

  const updateMessage = () => {
    const plan = getProject()?.plan ?? [];
    if (!plan.length) {
      view.message = undefined;
      return;
    }
    const done = plan.filter((s) => s.hecho).length;
    view.message =
      done === plan.length
        ? `✓ Plan completo (${done}/${plan.length}). Agrega pasos en ${PROJECT_FILE} para seguir.`
        : `${done}/${plan.length} pasos hechos`;
  };
  updateMessage();

  context.subscriptions.push(
    provider,
    view,
    onDidChangeProject(() => {
      provider.refresh();
      updateMessage();
    }),
    view.onDidChangeCheckboxState(async (e) => {
      for (const [item, state] of e.items) {
        await markStep(context, item.index, state === vscode.TreeItemCheckboxState.Checked);
      }
    }),
    vscode.commands.registerCommand('autocompletehelp.openStep', (index: number) => openStep(index))
  );
}

async function exists(uri: vscode.Uri): Promise<boolean> {
  try {
    await vscode.workspace.fs.stat(uri);
    return true;
  } catch {
    return false;
  }
}

async function openStep(index: number): Promise<void> {
  const step = getProject()?.plan?.[index];
  const root = projectRoot();
  if (!step || !root) {
    return;
  }
  if (!step.archivo) {
    vscode.window.showInformationMessage(
      `Este paso no indica archivo. Escribe «ach: ${stepInstruction(step)}» donde quieras construirlo.`
    );
    return;
  }

  const uri = vscode.Uri.joinPath(root, step.archivo);
  if (!(await exists(uri))) {
    // Archivo nuevo: vacío salvo la instrucción del paso. El código llega con
    // el autocompletado, en tu nivel, y lo aceptas línea a línea.
    const content = stepFileContent(step.archivo, step);
    await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(uri, '..'));
    await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(content));
    const editor = await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(uri));
    if (content) {
      const end = editor.document.lineAt(editor.document.lineCount - 1).range.end;
      editor.selection = new vscode.Selection(end, end);
      await vscode.commands.executeCommand('editor.action.inlineSuggest.trigger');
    }
    return;
  }

  const document = await vscode.workspace.openTextDocument(uri);
  const editor = await vscode.window.showTextDocument(document);

  // ¿El archivo ya tiene la instrucción de este paso (p. ej. lo creó «Crear
  // estructura»)? Entonces no se duplica: vamos a ella.
  const found = findStepLine(document.getText(), step);
  if (found) {
    if (found.hasCodeAfter) {
      const pos = new vscode.Position(found.line, 0);
      editor.selection = new vscode.Selection(pos, pos);
      editor.revealRange(new vscode.Range(pos, pos), vscode.TextEditorRevealType.InCenter);
      vscode.window.showInformationMessage(
        `Paso ${index + 1}: ya tiene código debajo de su instrucción. Si lo terminaste, márcalo como hecho en el plan.`
      );
      return;
    }
    // Sin empezar: cursor en una línea en blanco debajo de la instrucción.
    if (found.line === document.lineCount - 1) {
      await editor.edit((e) => e.insert(document.lineAt(found.line).range.end, '\n'));
    }
    const pos = new vscode.Position(found.line + 1, 0);
    editor.selection = new vscode.Selection(pos, pos);
    await vscode.commands.executeCommand('editor.action.inlineSuggest.trigger');
    return;
  }

  // Archivo existente sin la instrucción: no lo tocamos sin permiso. Ofrecemos
  // insertarla donde esté el cursor.
  const action = await vscode.window.showInformationMessage(
    `Paso ${index + 1}: ${step.paso}. Ubica el cursor donde quieras construirlo.`,
    'Insertar la instrucción aquí'
  );
  if (action) {
    await insertInstruction(stepInstruction(step));
  }
}
