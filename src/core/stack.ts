import type { ProjectFile } from './project';
import { parseProjectFile } from './project';
import type { StackProfile } from './stackProfiles';

export type StackProposal = Omit<ProjectFile, 'prompt'>;

/**
 * Combina la propuesta del modelo con el perfil curado. El perfil manda en
 * stack y convenciones (consistencia entre archivos); el modelo aporta el
 * plan adaptado al proyecto. Sin propuesta, el plan base del perfil.
 * Función pura: se prueba aislada.
 */
export function mergeWithProfile(
  proposal: StackProposal | undefined,
  profile: StackProfile | undefined
): (StackProposal & { stack: NonNullable<StackProposal['stack']> }) | undefined {
  if (profile) {
    return {
      perfil: profile.id,
      stack: { ...profile.stack },
      convenciones: [...profile.convenciones],
      plan: proposal?.plan?.length ? proposal.plan : profile.planBase.map((s) => ({ ...s }))
    };
  }
  if (!proposal?.stack) {
    return undefined;
  }
  return { ...proposal, stack: proposal.stack, perfil: undefined };
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
