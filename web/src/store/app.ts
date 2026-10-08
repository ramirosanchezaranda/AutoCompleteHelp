/**
 * Estado de la app: qué se ve, lo elegido en cada camino (se conserva al ir
 * y volver) y el proyecto abierto. Lo elegido vive en localStorage; los
 * proyectos, en IndexedDB.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StartKind } from '@core/start';
import type { LearnLevel, LearnProposal, LearnSize, ProjectIdea } from '@core/learnTopics';
import type { ArchAnswers, ArchId } from '@core/architectures';
import { AISettings, loadAISettings, saveAISettings } from '../lib/ai';

export type View = 'home' | 'flow' | 'workspace' | 'projects';

export interface LearnFlow {
  /** Tema (Aprender) o lo que te interesa (Ideas). */
  text: string;
  nivel?: LearnLevel;
  ideas?: ProjectIdea[];
  ideasKey?: string;
  idea?: ProjectIdea;
  tamano?: LearnSize;
  design?: { markdown: string; proposal?: LearnProposal };
  designKey?: string;
  projectId?: string;
}

export interface StackChoice {
  profileId?: string;
  /** Stack escrito por la persona. */
  preferred?: string;
  /** «No sé, recomiéndame uno». */
  recommend?: boolean;
}

export interface ProjectFlow {
  text: string;
  stack?: StackChoice;
  answers?: Partial<ArchAnswers>;
  archId?: ArchId;
  projectId?: string;
}

export interface Flows {
  learn: LearnFlow;
  recommend: LearnFlow;
  project: ProjectFlow;
}

interface AppState {
  view: View;
  kind: StartKind;
  /** Pestaña de cada camino. */
  step: Record<StartKind, number>;
  flows: Flows;
  projectId?: string;
  ai: AISettings;
  aiDialog: boolean;
  /** Acción pendiente que espera elegir la IA. */
  afterAI?: () => void;
  theme: 'system' | 'light' | 'dark';
  toast?: { text: string; tone?: 'ok' | 'warn' | 'error'; id: number };

  go: (view: View) => void;
  setKind: (k: StartKind) => void;
  setStep: (k: StartKind, n: number) => void;
  setLearn: (k: 'learn' | 'recommend', changes: Partial<LearnFlow>, invalidateFrom?: keyof LearnFlow) => void;
  setProjectFlow: (changes: Partial<ProjectFlow>, invalidateFrom?: keyof ProjectFlow) => void;
  openProject: (id: string) => void;
  setAI: (s: AISettings) => void;
  openAIDialog: (after?: () => void) => void;
  closeAIDialog: (chosen: boolean) => void;
  setTheme: (t: AppState['theme']) => void;
  notify: (text: string, tone?: 'ok' | 'warn' | 'error') => void;
}

/** Orden de los campos: cambiar uno invalida los siguientes. */
const LEARN_ORDER: (keyof LearnFlow)[] = ['text', 'nivel', 'ideas', 'idea', 'tamano', 'design', 'projectId'];
const PROJECT_ORDER: (keyof ProjectFlow)[] = ['text', 'stack', 'answers', 'archId', 'projectId'];

function invalidate<T extends object>(obj: T, order: (keyof T)[], from: keyof T | undefined, keep: (keyof T)[]): T {
  if (!from) return obj;
  const i = order.indexOf(from);
  const out: any = { ...obj };
  for (const k of order.slice(i + 1)) {
    if (!keep.includes(k)) delete out[k];
  }
  for (const k of ['ideasKey', 'designKey'] as (keyof T)[]) {
    const owner = k === ('ideasKey' as keyof T) ? 'ideas' : 'design';
    if (!keep.includes(k) && order.indexOf(owner as keyof T) > i) delete out[k];
  }
  return out;
}

const emptyLearn = (): LearnFlow => ({ text: '' });

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      view: 'home',
      kind: 'learn',
      step: { learn: 0, recommend: 0, project: 0 },
      flows: { learn: emptyLearn(), recommend: emptyLearn(), project: { text: '' } },
      ai: loadAISettings(),
      aiDialog: false,
      theme: 'system',

      go: (view) => set({ view }),
      setKind: (kind) => set({ kind }),
      setStep: (k, n) => set((s) => ({ step: { ...s.step, [k]: n }, view: n === 0 ? 'home' : 'flow', kind: k })),
      setLearn: (k, changes, from) =>
        set((s) => ({
          flows: { ...s.flows, [k]: invalidate({ ...s.flows[k], ...changes }, LEARN_ORDER, from, Object.keys(changes) as (keyof LearnFlow)[]) }
        })),
      setProjectFlow: (changes, from) =>
        set((s) => ({
          flows: { ...s.flows, project: invalidate({ ...s.flows.project, ...changes }, PROJECT_ORDER, from, Object.keys(changes) as (keyof ProjectFlow)[]) }
        })),
      openProject: (id) => set({ projectId: id, view: 'workspace' }),
      setAI: (ai) => {
        saveAISettings(ai);
        set({ ai });
      },
      openAIDialog: (after) => set({ aiDialog: true, afterAI: after }),
      closeAIDialog: (chosen) => {
        const after = get().afterAI;
        set({ aiDialog: false, afterAI: undefined });
        if (chosen) after?.();
      },
      setTheme: (theme) => set({ theme }),
      notify: (text, tone = 'ok') => set({ toast: { text, tone, id: Date.now() } })
    }),
    {
      name: 'ach.app',
      partialize: (s) => ({ view: s.view, kind: s.kind, step: s.step, flows: s.flows, projectId: s.projectId, theme: s.theme })
    }
  )
);
