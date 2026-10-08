import * as vscode from 'vscode';
import { ProjectFile, getProject, openProjectFile, projectRoot } from './projectFile';
import { StackProfile, getProfile } from './stackProfiles';
import { ScaffoldEntry, scaffoldEntries } from './core/scaffold';
export * from './core/scaffold';
import { writeCommand } from './terminal';

async function exists(uri: vscode.Uri): Promise<boolean> {
  try {
    await vscode.workspace.fs.stat(uri);
    return true;
  } catch {
    return false;
  }
}

/**
 * Comando «Crear estructura del proyecto». Muestra qué va a crear y deja
 * elegir; nunca sobrescribe. El comando de instalación no se ejecuta solo:
 * queda escrito en una terminal para que lo leas y lo lances tú.
 */
export async function createStructure(_context: vscode.ExtensionContext): Promise<void> {
  const project = getProject();
  const root = projectRoot();
  if (!root) {
    vscode.window.showWarningMessage('AutoCompleteHelp: abre una carpeta para crear la estructura del proyecto.');
    return;
  }
  if (!project?.stack) {
    const action = await vscode.window.showInformationMessage(
      'AutoCompleteHelp: primero elige el stack; la estructura sale de él y de su plan.',
      'Elegir stack del proyecto'
    );
    if (action) {
      await vscode.commands.executeCommand('autocompletehelp.recommendStack');
    }
    return;
  }

  const profile = getProfile(project.perfil);
  const folderName = vscode.workspace.workspaceFolders?.[0]?.name ?? 'mi-proyecto';
  const all = scaffoldEntries(project, profile, folderName);
  const pending: ScaffoldEntry[] = [];
  for (const entry of all) {
    if (!(await exists(vscode.Uri.joinPath(root, entry.archivo)))) {
      pending.push(entry);
    }
  }

  if (!pending.length) {
    vscode.window.showInformationMessage(
      all.length
        ? 'AutoCompleteHelp: la estructura ya está completa; no hay nada que crear.'
        : 'AutoCompleteHelp: el plan no indica archivos. Agrégalos en autocompletehelp.json o elige un stack curado.'
    );
    if (profile?.nota) {
      vscode.window.showInformationMessage(profile.nota);
    }
    return;
  }

  const picked = await vscode.window.showQuickPick(
    pending.map((e) => ({ label: e.archivo, description: e.motivo, picked: true, entry: e })),
    {
      canPickMany: true,
      title: `Crear estructura · ${project.stack.resumen ?? 'tu stack'}`,
      placeHolder: 'Se crean solo los archivos marcados. Los que ya existen no se tocan.'
    }
  );
  if (!picked?.length) {
    return;
  }

  for (const { entry } of picked) {
    const uri = vscode.Uri.joinPath(root, entry.archivo);
    await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(uri, '..'));
    await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(entry.contenido));
  }

  await afterCreate(picked.length, profile, project);
}

async function afterCreate(count: number, profile: StackProfile | undefined, project: ProjectFile): Promise<void> {
  const created = `AutoCompleteHelp: ${count} ${count === 1 ? 'archivo creado' : 'archivos creados'}.`;
  if (profile?.nota) {
    vscode.window.showInformationMessage(profile.nota);
  }
  // Proyectos de «Quiero aprender»: el entorno viene en autocompletehelp.json.
  if (!profile?.instalar && project.entorno) {
    const action = await vscode.window.showInformationMessage(
      `${created} Falta preparar el entorno (instalar${project.entorno.docker ? ', Docker' : ''} y tests): cada comando con su explicación.`,
      'Preparar el entorno'
    );
    if (action) {
      await vscode.commands.executeCommand('autocompletehelp.environment');
    }
    return;
  }
  if (!profile?.instalar) {
    const action = await vscode.window.showInformationMessage(
      `${created} Abre un paso del panel «Plan del proyecto» para empezar.`,
      'Abrir autocompletehelp.json'
    );
    if (action) {
      await openProjectFile();
    }
    return;
  }

  const cmd = process.platform === 'win32' && profile.instalar.windows ? profile.instalar.windows : profile.instalar.comando;
  const action = await vscode.window.showInformationMessage(
    `${created} Falta instalar las dependencias: ${cmd}`,
    'Escribirlo en la terminal',
    '¿Qué hace este comando?'
  );
  if (action === '¿Qué hace este comando?') {
    const next = await vscode.window.showInformationMessage(
      profile.instalar.explicacion,
      { modal: true },
      'Escribirlo en la terminal'
    );
    if (next) {
      writeInTerminal(cmd, profile);
    }
  } else if (action) {
    writeInTerminal(cmd, profile);
  }
}

/** Escribe el comando en una terminal SIN ejecutarlo: lo lanzas tú con Enter. */
function writeInTerminal(cmd: string, profile: StackProfile): void {
  const run = profile.ejecutar;
  writeCommand(cmd, run ? `Después, para arrancar el proyecto: ${run.comando}. ${run.explicacion}` : undefined);
}
