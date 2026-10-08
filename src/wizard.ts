import * as vscode from 'vscode';

/**
 * Asistentes paso a paso: cada paso se superpone al anterior (un QuickPick a
 * la vez), muestra «Paso n de N» y tiene el botón ← Atrás, que vuelve al
 * paso anterior con lo que ya habías elegido marcado.
 */

export const BACK = Symbol('atrás');
export type StepResult<T> = T | typeof BACK | undefined;

export type Item<T> = vscode.QuickPickItem & { value: T };

export interface StepOptions<T> {
  title: string;
  step: number;
  total: number;
  placeholder?: string;
  /** Valor elegido antes: se marca al volver con ← Atrás. */
  current?: T;
}

/** Un paso con opciones. Devuelve el valor, BACK, o undefined si se cancela. */
export function pickStep<T>(items: (Item<T> | vscode.QuickPickItem)[], o: StepOptions<T>): Promise<StepResult<T>> {
  const qp = vscode.window.createQuickPick<Item<T> | vscode.QuickPickItem>();
  qp.title = o.title;
  qp.step = o.step;
  qp.totalSteps = o.total;
  qp.placeholder = o.placeholder;
  qp.items = items;
  qp.ignoreFocusOut = true;
  qp.matchOnDescription = true;
  qp.matchOnDetail = true;
  qp.buttons = o.step > 1 ? [vscode.QuickInputButtons.Back] : [];
  const prev = items.find((i) => 'value' in i && o.current !== undefined && (i as Item<T>).value === o.current);
  if (prev) {
    qp.activeItems = [prev];
  }
  return new Promise((resolve) => {
    let settled = false;
    const finish = (v: StepResult<T>) => {
      if (!settled) {
        settled = true;
        resolve(v);
        qp.hide();
      }
    };
    qp.onDidTriggerButton((b) => b === vscode.QuickInputButtons.Back && finish(BACK));
    qp.onDidAccept(() => {
      const sel = qp.selectedItems[0];
      if (sel && 'value' in sel) {
        finish((sel as Item<T>).value);
      }
    });
    qp.onDidHide(() => {
      finish(undefined);
      qp.dispose();
    });
    qp.show();
  });
}

/** Un paso de texto libre, con ← Atrás. */
export function inputStep(o: StepOptions<string> & { prompt: string; validate?: (v: string) => string | undefined }): Promise<StepResult<string>> {
  const box = vscode.window.createInputBox();
  box.title = o.title;
  box.step = o.step;
  box.totalSteps = o.total;
  box.prompt = o.prompt;
  box.placeholder = o.placeholder;
  box.value = o.current ?? '';
  box.ignoreFocusOut = true;
  box.buttons = o.step > 1 ? [vscode.QuickInputButtons.Back] : [];
  return new Promise((resolve) => {
    let settled = false;
    const finish = (v: StepResult<string>) => {
      if (!settled) {
        settled = true;
        resolve(v);
        box.hide();
      }
    };
    box.onDidTriggerButton((b) => b === vscode.QuickInputButtons.Back && finish(BACK));
    box.onDidChangeValue((v) => (box.validationMessage = o.validate?.(v)));
    box.onDidAccept(() => {
      const v = box.value.trim();
      const err = o.validate?.(v) ?? (v ? undefined : 'Escribe algo para continuar.');
      if (err) {
        box.validationMessage = err;
        return;
      }
      finish(v);
    });
    box.onDidHide(() => {
      finish(undefined);
      box.dispose();
    });
    box.show();
  });
}

/**
 * Recorre una lista de pasos como una máquina de estados: cada paso devuelve
 * el índice del siguiente, BACK para volver al anterior visitado, o undefined
 * para cancelar. Función pura sobre las funciones de paso: se prueba aislada.
 */
export async function runSteps(steps: (() => Promise<number | typeof BACK | undefined>)[], start = 0): Promise<boolean> {
  const history: number[] = [];
  let i = start;
  while (i >= 0 && i < steps.length) {
    const r = await steps[i]();
    if (r === undefined) {
      return false;
    }
    if (r === BACK) {
      const prev = history.pop();
      if (prev === undefined) {
        return false;
      }
      i = prev;
      continue;
    }
    history.push(i);
    i = r;
  }
  return i >= steps.length;
}
