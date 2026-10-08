import * as vscode from 'vscode';
import { ConceptStat, Ledger, normalizeConcept, readLedger, writeLedger } from './conceptLedger';
import { getProject } from './projectFile';
import type { DictationManager } from './dictation';

export { REVIEW_DAYS, nextReviewAt, dueConcepts, applyReview, reviewLanguage } from './core/concepts';
export type { DueConcept } from './core/concepts';
import { REVIEW_DAYS, applyReview, dueConcepts, reviewLanguage, reviewInstruction } from './core/concepts';

// ---------------------------------------------------------------------------
// IDE
// ---------------------------------------------------------------------------

export class ReviewReminder implements vscode.Disposable {
  private readonly item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 49);

  constructor(private readonly context: vscode.ExtensionContext) {
    this.item.command = 'autocompletehelp.review';
    this.refresh();
  }

  refresh(): void {
    const due = dueConcepts(readLedger(this.context));
    if (!due.length) {
      this.item.hide();
      return;
    }
    this.item.text = `$(mortar-board) ${due.length} para repasar`;
    this.item.tooltip = `Repaso espaciado: ${due.map((d) => d.stat.label).join(', ')}`;
    this.item.show();
  }

  dispose(): void {
    this.item.dispose();
  }
}

/** Comando «Repasar conceptos»: un ejercicio corto, dictado con huecos. */
export async function startReview(
  context: vscode.ExtensionContext,
  dictation: DictationManager
): Promise<void> {
  const ledger = readLedger(context);
  const due = dueConcepts(ledger);
  const practiced = Object.entries(ledger).filter(([, s]) => s.practiced > 0);
  if (!practiced.length) {
    vscode.window.showInformationMessage(
      'AutoCompleteHelp: todavía no hay conceptos para repasar. Escribe algún paso con el dictado y vuelve: lo que escribas entra al repaso.'
    );
    return;
  }
  const dueIds = new Set(due.map((d) => d.id));
  const items = [
    ...due.map((d) => ({
      label: d.stat.label,
      description: d.overdue ? `vencido hace ${d.overdue} ${d.overdue === 1 ? 'día' : 'días'}` : 'toca hoy',
      id: d.id
    })),
    ...practiced
      .filter(([id]) => !dueIds.has(id))
      .map(([id, s]) => ({ label: s.label, description: 'repasar antes de tiempo', id }))
  ];
  const pick = await vscode.window.showQuickPick(items, {
    title: due.length ? `Repaso espaciado: ${due.length} para hoy` : 'Nada vence hoy: puedes adelantar un repaso'
  });
  if (!pick) {
    return;
  }

  const project = getProject();
  const stackText = project?.stack ? JSON.stringify(project.stack) : '';
  const { languageId, comment } = reviewLanguage(stackText);
  const instruction = reviewInstruction(pick.label);
  const doc = await vscode.workspace.openTextDocument({
    language: languageId,
    content: `${comment} ach: ${instruction}\n`
  });
  const editor = await vscode.window.showTextDocument(doc);
  const end = doc.lineAt(doc.lineCount - 1).range.end;
  editor.selection = new vscode.Selection(end, end);
  await dictation.start(editor, instruction, undefined, { reviewConcept: pick.id, gapRatio: 0.5 });
}

/** Guarda el resultado de un repaso en el registro de conceptos. */
export async function recordReview(
  context: vscode.ExtensionContext,
  conceptId: string,
  result: { errors: number; helped: number; gaps: number }
): Promise<boolean> {
  const ledger = readLedger(context);
  const stat = ledger[conceptId] ?? ledger[normalizeConcept(conceptId).id];
  if (!stat) {
    return false;
  }
  const next = applyReview(stat, result);
  ledger[conceptId] = next;
  await writeLedger(context, ledger);
  return (next.reviewBox ?? 0) > (stat.reviewBox ?? 0) || (stat.reviewBox ?? 0) === REVIEW_DAYS.length - 1;
}
