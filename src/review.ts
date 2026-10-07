import * as vscode from 'vscode';
import { ConceptStat, Ledger, normalizeConcept, readLedger, writeLedger } from './conceptLedger';
import { getProject } from './projectFile';
import type { DictationManager } from './dictation';

/**
 * Repaso espaciado (sistema Leitner): un concepto que escribiste vuelve a
 * pedirse al cabo de 1, 3, 7, 14 y 30 días. Si el repaso sale bien, avanza a
 * la caja siguiente; si cuesta, vuelve a empezar. Repasar justo cuando estás
 * por olvidarlo es lo que lo pasa a la memoria de largo plazo.
 */
export const REVIEW_DAYS = [1, 3, 7, 14, 30];
const DAY = 24 * 60 * 60 * 1000;

export interface DueConcept {
  id: string;
  stat: ConceptStat;
  /** Días de atraso (0 = vence hoy). */
  overdue: number;
}

/** Cuándo toca repasar un concepto, o undefined si nunca lo escribiste tú. */
export function nextReviewAt(stat: ConceptStat): number | undefined {
  if (!stat.practiced) {
    return undefined;
  }
  const box = Math.min(stat.reviewBox ?? 0, REVIEW_DAYS.length - 1);
  const from = Date.parse(stat.lastReview ?? stat.lastSeen);
  return from + REVIEW_DAYS[box] * DAY;
}

/** Conceptos que vencieron, los más atrasados primero. */
export function dueConcepts(ledger: Ledger, now = Date.now()): DueConcept[] {
  const out: DueConcept[] = [];
  for (const [id, stat] of Object.entries(ledger)) {
    const at = nextReviewAt(stat);
    if (at !== undefined && at <= now) {
      out.push({ id, stat, overdue: Math.floor((now - at) / DAY) });
    }
  }
  return out.sort((a, b) => b.overdue - a.overdue || a.stat.label.localeCompare(b.stat.label));
}

/**
 * Resultado de un repaso: bien (pocos errores y sin pedir ayuda de más) sube
 * de caja; si costó, vuelve a la primera.
 */
export function applyReview(
  stat: ConceptStat,
  result: { errors: number; helped: number; gaps: number },
  now = new Date().toISOString()
): ConceptStat {
  const passed = result.errors <= 3 && result.helped <= Math.max(1, Math.floor(result.gaps / 3));
  const box = passed ? Math.min((stat.reviewBox ?? 0) + 1, REVIEW_DAYS.length - 1) : 0;
  return { ...stat, reviewBox: box, lastReview: now };
}

/** Lenguaje del ejercicio: el del proyecto. */
export function reviewLanguage(stackText: string): { languageId: string; comment: string } {
  const t = stackText.toLowerCase();
  if (/python|django|fastapi|flask/.test(t)) {
    return { languageId: 'python', comment: '#' };
  }
  if (/typescript/.test(t)) {
    return { languageId: 'typescript', comment: '//' };
  }
  return { languageId: 'javascript', comment: '//' };
}

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
  const instruction = `ejercicio corto de repaso (8 a 15 líneas) sobre «${pick.label}», con un caso del proyecto`;
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
