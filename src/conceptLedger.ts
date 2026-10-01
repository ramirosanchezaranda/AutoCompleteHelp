import * as vscode from 'vscode';

const LEDGER_KEY = 'autocompletehelp.conceptLedger';

/**
 * Umbrales del andamiaje decreciente. La ayuda baja a medida que un concepto
 * se repite: lo que ayuda a un novato estorba a quien ya lo sabe.
 */
export const FADE = {
  /** seen < NEW  → concepto nuevo: explicación completa. */
  NEW: 2,
  /** seen < PRACTICING → en práctica: una sola línea de porqué. */
  PRACTICING: 4
};

export interface ConceptStat {
  /** Etiqueta legible tal como la nombró el modelo (ej: "async/await"). */
  label: string;
  /** Veces que el concepto entró al código del usuario. */
  seen: number;
  /** Veces aceptadas con Tab (la IA escribió). */
  accepted: number;
  /** Veces que el usuario lo escribió por su cuenta (modo pista). */
  practiced: number;
  firstSeen: string;
  lastSeen: string;
  /** Repaso espaciado: caja de Leitner (0 = repasar al día siguiente). */
  reviewBox?: number;
  lastReview?: string;
}

export type Ledger = Record<string, ConceptStat>;

/** Conceptos agrupados por etapa de aprendizaje, para inyectar en el prompt. */
export interface ConceptStages {
  nuevos: string[];
  enPractica: string[];
  conocidos: string[];
}

/** Normaliza "async/await" → id "async-await" + etiqueta legible. */
export function normalizeConcept(raw: string): { id: string; label: string } {
  const label = raw.trim().replace(/\s+/g, ' ').slice(0, 60);
  const id = label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return { id, label };
}

export function readLedger(context: vscode.ExtensionContext): Ledger {
  return context.globalState.get<Ledger>(LEDGER_KEY, {});
}

export async function writeLedger(context: vscode.ExtensionContext, ledger: Ledger): Promise<void> {
  await context.globalState.update(LEDGER_KEY, ledger);
}

/**
 * Clasifica los conceptos de la sugerencia actual según cuántas veces se
 * vieron antes. Es lo que permite que la explicación se desvanezca sola.
 */
export function stagesFor(
  context: vscode.ExtensionContext,
  concepts: string[]
): ConceptStages {
  const ledger = readLedger(context);
  const stages: ConceptStages = { nuevos: [], enPractica: [], conocidos: [] };
  for (const raw of concepts) {
    const { id, label } = normalizeConcept(raw);
    if (!id) {
      continue;
    }
    const seen = ledger[id]?.seen ?? 0;
    if (seen < FADE.NEW) {
      stages.nuevos.push(label);
    } else if (seen < FADE.PRACTICING) {
      stages.enPractica.push(label);
    } else {
      stages.conocidos.push(label);
    }
  }
  return stages;
}

/**
 * Los conceptos que el aprendiz ya domina, para avisarle al modelo que no
 * vuelva a explicarlos aunque aparezcan en una sugerencia nueva.
 */
export function knownConcepts(context: vscode.ExtensionContext, limit = 25): string[] {
  const ledger = readLedger(context);
  return Object.values(ledger)
    .filter((c) => c.seen >= FADE.PRACTICING)
    .sort((a, b) => b.seen - a.seen)
    .slice(0, limit)
    .map((c) => c.label);
}

/** Registra que los conceptos entraron al código (al aceptar con Tab). */
export async function recordAccepted(
  context: vscode.ExtensionContext,
  concepts: string[],
  level: string
): Promise<void> {
  if (!concepts?.length) {
    return;
  }
  const ledger = readLedger(context);
  const now = new Date().toISOString();
  // En modo pista la IA no escribió la solución, y en el dictado la tecleó el
  // usuario: cuenta como práctica, no como código aceptado.
  const userWroteIt = level === 'pista' || level === 'dictado';

  for (const raw of concepts) {
    const { id, label } = normalizeConcept(raw);
    if (!id) {
      continue;
    }
    const prev = ledger[id];
    ledger[id] = {
      ...prev,
      label: prev?.label ?? label,
      seen: (prev?.seen ?? 0) + 1,
      accepted: (prev?.accepted ?? 0) + (userWroteIt ? 0 : 1),
      practiced: (prev?.practiced ?? 0) + (userWroteIt ? 1 : 0),
      firstSeen: prev?.firstSeen ?? now,
      lastSeen: now
    };
  }
  await context.globalState.update(LEDGER_KEY, ledger);
}

export async function resetLedger(context: vscode.ExtensionContext): Promise<void> {
  await context.globalState.update(LEDGER_KEY, {});
}

/** Informe en Markdown del progreso del aprendiz. */
export function progressReport(context: vscode.ExtensionContext): string {
  const all = Object.values(readLedger(context));
  if (!all.length) {
    return [
      '# Tu progreso',
      '',
      'Todavía no hay conceptos registrados. Acepta algunas sugerencias y vuelve:',
      'AutoCompleteHelp anota cada concepto que entra en tu código y va bajando',
      'las explicaciones a medida que lo repites.'
    ].join('\n');
  }

  const known = all.filter((c) => c.seen >= FADE.PRACTICING).sort((a, b) => b.seen - a.seen);
  const practicing = all.filter((c) => c.seen >= FADE.NEW && c.seen < FADE.PRACTICING);
  const fresh = all.filter((c) => c.seen < FADE.NEW);

  const totalAccepted = all.reduce((n, c) => n + c.accepted, 0);
  const totalPracticed = all.reduce((n, c) => n + c.practiced, 0);
  const totalTouches = totalAccepted + totalPracticed;
  const ownRate = totalTouches ? Math.round((totalPracticed / totalTouches) * 100) : 0;

  const line = (c: ConceptStat) =>
    `- **${c.label}** — ${c.seen} ${c.seen === 1 ? 'vez' : 'veces'}` +
    (c.practiced ? ` (${c.practiced} escritas por ti)` : '');

  const out = ['# Tu progreso', ''];
  out.push(
    `Conceptos en total: **${all.length}** · escritos por ti: **${ownRate}%** de las veces.`,
    ''
  );
  if (ownRate < 25 && totalTouches >= 10) {
    out.push(
      '> La IA está escribiendo casi todo. Prueba el nivel **pista** un rato:',
      '> escribir el código tú es lo que fija el aprendizaje.',
      ''
    );
  }
  if (known.length) {
    out.push(`## Ya los dominas (${known.length})`, 'Dejé de explicártelos.', ...known.map(line), '');
  }
  if (practicing.length) {
    out.push(
      `## En práctica (${practicing.length})`,
      'Te doy solo una línea de porqué.',
      ...practicing.map(line),
      ''
    );
  }
  if (fresh.length) {
    out.push(`## Recién vistos (${fresh.length})`, ...fresh.map(line), '');
  }
  return out.join('\n');
}
