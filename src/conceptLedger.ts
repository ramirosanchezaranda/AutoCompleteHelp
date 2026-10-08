import * as vscode from 'vscode';
import { Ledger, knownIn, progressMarkdown, stagesIn, withAccepted, ConceptStages } from './core/concepts';
export { FADE, normalizeConcept } from './core/concepts';
export type { ConceptStat, Ledger, ConceptStages } from './core/concepts';

const LEDGER_KEY = 'autocompletehelp.conceptLedger';

export function readLedger(context: vscode.ExtensionContext): Ledger {
  return context.globalState.get<Ledger>(LEDGER_KEY, {});
}

export async function writeLedger(context: vscode.ExtensionContext, ledger: Ledger): Promise<void> {
  await context.globalState.update(LEDGER_KEY, ledger);
}

/** Clasifica los conceptos según cuántas veces se vieron antes (ver core/concepts). */
export function stagesFor(context: vscode.ExtensionContext, concepts: string[]): ConceptStages {
  return stagesIn(readLedger(context), concepts);
}

/** Los conceptos que el aprendiz ya domina. */
export function knownConcepts(context: vscode.ExtensionContext, limit = 25): string[] {
  return knownIn(readLedger(context), limit);
}

/** Registra que los conceptos entraron al código: escritos por la persona o completados sin escribir. */
export async function recordAccepted(
  context: vscode.ExtensionContext,
  concepts: string[],
  level: string
): Promise<void> {
  if (!concepts?.length) {
    return;
  }
  await writeLedger(context, withAccepted(readLedger(context), concepts, level));
}

export async function resetLedger(context: vscode.ExtensionContext): Promise<void> {
  await context.globalState.update(LEDGER_KEY, {});
}

/** Informe en Markdown del progreso del aprendiz. */
export function progressReport(context: vscode.ExtensionContext): string {
  return progressMarkdown(readLedger(context));
}
