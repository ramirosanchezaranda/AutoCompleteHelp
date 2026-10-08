/**
 * Registro de conceptos y repaso espaciado (puro, compartido con la web app).
 * La extensión lo guarda en globalState; la web, en IndexedDB.
 */

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
  /** Veces completadas sin escribirlas (la IA escribió). */
  accepted: number;
  /** Veces que el usuario lo escribió (completamos juntos o repaso). */
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

/**
 * Clasifica los conceptos de la sugerencia actual según cuántas veces se
 * vieron antes. Es lo que permite que la explicación se desvanezca sola.
 */
export function stagesIn(ledger: Ledger, concepts: string[]): ConceptStages {
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

/** Los conceptos que el aprendiz ya domina: el modelo no vuelve a explicarlos. */
export function knownIn(ledger: Ledger, limit = 25): string[] {
  return Object.values(ledger)
    .filter((c) => c.seen >= FADE.PRACTICING)
    .sort((a, b) => b.seen - a.seen)
    .slice(0, limit)
    .map((c) => c.label);
}

/**
 * Registra que los conceptos entraron al código: escritos por la persona
 * («dictado») o completados sin escribir. Devuelve un registro nuevo.
 */
export function withAccepted(ledger: Ledger, concepts: string[], level: string, now = new Date().toISOString()): Ledger {
  const next: Ledger = { ...ledger };
  // Lo que la persona tecleó al completar juntos cuenta como práctica; lo que
  // se completó sin escribir, como código aceptado.
  const userWroteIt = level === 'dictado';
  for (const raw of concepts ?? []) {
    const { id, label } = normalizeConcept(raw);
    if (!id) {
      continue;
    }
    const prev = next[id];
    next[id] = {
      ...prev,
      label: prev?.label ?? label,
      seen: (prev?.seen ?? 0) + 1,
      accepted: (prev?.accepted ?? 0) + (userWroteIt ? 0 : 1),
      practiced: (prev?.practiced ?? 0) + (userWroteIt ? 1 : 0),
      firstSeen: prev?.firstSeen ?? now,
      lastSeen: now
    };
  }
  return next;
}

/** Informe en Markdown del progreso del aprendiz. */
export function progressMarkdown(ledger: Ledger): string {
  const all = Object.values(ledger);
  if (!all.length) {
    return [
      '# Tu progreso',
      '',
      'Todavía no hay conceptos registrados. Completa algún paso del plan y vuelve:',
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
  out.push(`Conceptos en total: **${all.length}** · escritos por ti: **${ownRate}%** de las veces.`, '');
  if (ownRate < 25 && totalTouches >= 10) {
    out.push('> Muchas veces completaste sin escribir. Escribir tú cada línea', '> es lo que fija el aprendizaje.', '');
  }
  if (known.length) {
    out.push(`## Ya los dominas (${known.length})`, 'Dejé de explicártelos.', ...known.map(line), '');
  }
  if (practicing.length) {
    out.push(`## En práctica (${practicing.length})`, 'Te doy solo una línea de porqué.', ...practicing.map(line), '');
  }
  if (fresh.length) {
    out.push(`## Recién vistos (${fresh.length})`, ...fresh.map(line), '');
  }
  return out.join('\n');
}

// ---------------------------------------------------------------------------
// Repaso espaciado (sistema Leitner): un concepto que escribiste vuelve a
// pedirse al cabo de 1, 3, 7, 14 y 30 días. Si el repaso sale bien, avanza a
// la caja siguiente; si cuesta, vuelve a empezar.
// ---------------------------------------------------------------------------

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

/** ¿El repaso hizo avanzar el concepto? */
export function reviewAdvanced(before: ConceptStat, after: ConceptStat): boolean {
  return (after.reviewBox ?? 0) > (before.reviewBox ?? 0) || (before.reviewBox ?? 0) === REVIEW_DAYS.length - 1;
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

/** Instrucción de un ejercicio de repaso sobre un concepto. */
export function reviewInstruction(label: string): string {
  return `ejercicio corto de repaso (8 a 15 líneas) sobre «${label}», con un caso del proyecto`;
}
