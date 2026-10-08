import * as vscode from 'vscode';
import { EnvCommand, environmentSteps, getProject } from './projectFile';

/**
 * Los comandos se ESCRIBEN en la terminal, nunca se ejecutan solos: los lees,
 * entiendes qué hacen y los lanzas tú con Enter.
 */
export function writeCommand(cmd: EnvCommand | string, after?: string): void {
  const c = typeof cmd === 'string' ? { comando: cmd, explicacion: '' } : cmd;
  const text = process.platform === 'win32' && c.windows ? c.windows : c.comando;
  const terminal =
    vscode.window.terminals.find((t) => t.name === 'AutoCompleteHelp') ?? vscode.window.createTerminal('AutoCompleteHelp');
  terminal.show();
  terminal.sendText(text, false);
  vscode.window.showInformationMessage(
    ['Revisa el comando y pulsa Enter en la terminal para ejecutarlo.', c.explicacion, after].filter(Boolean).join(' ')
  );
}

/**
 * Comando «Preparar el entorno»: instalar, Docker, ejecutar y tests del
 * proyecto, cada uno con su explicación. El elegido se escribe en la terminal.
 */
export async function prepareEnvironment(): Promise<void> {
  const steps = environmentSteps(getProject()?.entorno);
  if (!steps.length) {
    vscode.window.showInformationMessage(
      'AutoCompleteHelp: este proyecto no tiene comandos de entorno en autocompletehelp.json. Los proyectos de «Quiero aprender» los traen; en los perfiles curados, los ofrece «Crear estructura».'
    );
    return;
  }
  const docker = getProject()?.entorno?.docker;
  const items: (vscode.QuickPickItem & { cmd?: EnvCommand })[] = [];
  let group = '';
  for (const s of steps) {
    if (s.grupo !== group) {
      group = s.grupo;
      items.push({ label: group, kind: vscode.QuickPickItemKind.Separator });
    }
    items.push({ label: `$(terminal) ${s.comando}`, detail: s.explicacion, cmd: s });
  }
  const pick = await vscode.window.showQuickPick(items, {
    title: 'Preparar el entorno — se escribe en la terminal, sin ejecutarse',
    placeHolder: docker?.porQue ? `Docker: ${docker.porQue}` : 'Elige un comando: instalar, ejecutar o correr los tests',
    matchOnDetail: true
  });
  if (pick?.cmd) {
    writeCommand(pick.cmd);
  }
}
