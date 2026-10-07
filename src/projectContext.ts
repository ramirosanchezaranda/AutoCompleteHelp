import * as vscode from 'vscode';

/**
 * Contexto del proyecto para cada sugerencia. Sin esto la IA completa un
 * archivo viendo solo ese archivo, y adivina qué otros existen y qué exportan.
 *
 * Dos partes con ritmos distintos:
 *  - snapshot(): árbol de archivos + manifiesto de dependencias. Cambia poco,
 *    va en el prompt de sistema (cacheable).
 *  - relatedFiles(): lo que exportan los archivos que el actual importa.
 *    Depende del archivo abierto, va en el mensaje de usuario.
 */

const EXCLUDE =
  '{**/node_modules/**,**/.git/**,**/out/**,**/dist/**,**/build/**,**/.venv/**,**/venv/**,' +
  '**/__pycache__/**,**/target/**,**/.next/**,**/coverage/**,**/*.lock,**/package-lock.json}';
const MAX_TREE_FILES = 150;
const MAX_MANIFEST_CHARS = 1500;
const MAX_FILE_CHARS = 2500;
const MAX_RELATED_CHARS = 6000;
const MAX_RELATED_FILES = 4;

const JS_EXT = ['', '.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs', '/index.js', '/index.ts'];

export class ProjectContext implements vscode.Disposable {
  private cachedSnapshot: string | undefined;
  private readonly watcher: vscode.FileSystemWatcher;

  constructor() {
    // Solo crear/borrar archivos cambia el árbol; los manifiestos también por contenido.
    this.watcher = vscode.workspace.createFileSystemWatcher('**/*');
    const invalidate = () => (this.cachedSnapshot = undefined);
    this.watcher.onDidCreate(invalidate);
    this.watcher.onDidDelete(invalidate);
    this.watcher.onDidChange((uri) => {
      if (/(package\.json|requirements\.txt|pyproject\.toml|go\.mod|Cargo\.toml)$/.test(uri.path)) {
        invalidate();
      }
    });
  }

  dispose(): void {
    this.watcher.dispose();
  }

  async snapshot(): Promise<string> {
    if (this.cachedSnapshot !== undefined) {
      return this.cachedSnapshot;
    }
    const folder = vscode.workspace.workspaceFolders?.[0];
    if (!folder) {
      return (this.cachedSnapshot = '');
    }
    const files = await vscode.workspace.findFiles('**/*', EXCLUDE, MAX_TREE_FILES + 1);
    const paths = files.map((f) => vscode.workspace.asRelativePath(f, false)).sort();
    const parts: string[] = [];
    if (paths.length) {
      parts.push(
        'Archivos del proyecto:',
        ...paths.slice(0, MAX_TREE_FILES).map((p) => `  ${p}`),
        ...(paths.length > MAX_TREE_FILES ? ['  … (más archivos omitidos)'] : [])
      );
    } else {
      parts.push('Archivos del proyecto: ninguno todavía (proyecto recién creado).');
    }
    const manifest = await readManifest(folder.uri);
    if (manifest) {
      parts.push('', manifest);
    }
    return (this.cachedSnapshot = parts.join('\n'));
  }

  /** Contenido (o firmas) de los archivos locales que importa el documento actual. */
  async relatedFiles(document: vscode.TextDocument): Promise<string> {
    const specs = parseLocalImports(document.getText(), document.languageId);
    if (!specs.length) {
      return '';
    }
    const baseDir = vscode.Uri.joinPath(document.uri, '..');
    const root = vscode.workspace.workspaceFolders?.[0]?.uri;
    const out: string[] = [];
    let budget = MAX_RELATED_CHARS;

    for (const spec of specs.slice(0, MAX_RELATED_FILES)) {
      const uri = await resolveImport(spec, baseDir, root, document.languageId);
      if (!uri || uri.toString() === document.uri.toString()) {
        continue;
      }
      let text: string;
      try {
        text = new TextDecoder().decode(await vscode.workspace.fs.readFile(uri));
      } catch {
        continue;
      }
      const body = summarizeFile(text, document.languageId);
      const block = `--- ${vscode.workspace.asRelativePath(uri, false)} ---\n${body}`;
      if (block.length > budget) {
        break;
      }
      budget -= block.length;
      out.push(block);
    }
    return out.join('\n\n');
  }
}

/** Manifiesto de dependencias: lo que realmente está instalado y en qué versión. */
async function readManifest(root: vscode.Uri): Promise<string> {
  const read = async (name: string): Promise<string | undefined> => {
    try {
      return new TextDecoder().decode(
        await vscode.workspace.fs.readFile(vscode.Uri.joinPath(root, name))
      );
    } catch {
      return undefined;
    }
  };

  const pkg = await read('package.json');
  if (pkg) {
    try {
      const json = JSON.parse(pkg);
      const deps = (o: Record<string, string> | undefined) =>
        Object.entries(o ?? {}).map(([n, v]) => `${n}@${v}`).join(', ');
      return [
        'package.json:',
        json.type ? `  módulos: ${json.type === 'module' ? 'ES modules (import/export)' : 'CommonJS (require)'}` : '  módulos: CommonJS (require)',
        json.engines?.node ? `  node: ${json.engines.node}` : '',
        json.dependencies ? `  dependencias: ${deps(json.dependencies)}` : '  dependencias: ninguna',
        json.devDependencies ? `  desarrollo: ${deps(json.devDependencies)}` : ''
      ]
        .filter(Boolean)
        .join('\n');
    } catch {
      /* package.json inválido: seguimos con los demás */
    }
  }
  for (const name of ['requirements.txt', 'pyproject.toml', 'go.mod', 'Cargo.toml']) {
    const text = await read(name);
    if (text) {
      return `${name}:\n${text.slice(0, MAX_MANIFEST_CHARS)}`;
    }
  }
  return '';
}

async function exists(uri: vscode.Uri): Promise<boolean> {
  try {
    const stat = await vscode.workspace.fs.stat(uri);
    return stat.type === vscode.FileType.File;
  } catch {
    return false;
  }
}

async function resolveImport(
  spec: string,
  baseDir: vscode.Uri,
  root: vscode.Uri | undefined,
  languageId: string
): Promise<vscode.Uri | undefined> {
  if (languageId === 'python') {
    // ".modelos" relativo al archivo; "app.modelos" relativo a la raíz.
    const dots = spec.match(/^\.+/)?.[0].length ?? 0;
    let dir = dots ? baseDir : root;
    if (!dir) {
      return undefined;
    }
    for (let i = 1; i < dots; i++) {
      dir = vscode.Uri.joinPath(dir, '..');
    }
    const rel = spec.slice(dots).replace(/\./g, '/');
    if (!rel) {
      return undefined;
    }
    for (const candidate of [`${rel}.py`, `${rel}/__init__.py`]) {
      const uri = vscode.Uri.joinPath(dir, candidate);
      if (await exists(uri)) {
        return uri;
      }
    }
    return undefined;
  }
  for (const ext of JS_EXT) {
    const uri = vscode.Uri.joinPath(baseDir, spec + ext);
    if (await exists(uri)) {
      return uri;
    }
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Funciones puras (sin vscode): se prueban aisladas.
// ---------------------------------------------------------------------------

/** Rutas de import locales del archivo (ignora paquetes de npm/pip). */
export function parseLocalImports(text: string, languageId: string): string[] {
  const found = new Set<string>();
  if (languageId === 'python') {
    for (const m of text.matchAll(/^\s*from\s+([.\w]+)\s+import\b/gm)) {
      found.add(m[1]);
    }
    for (const m of text.matchAll(/^\s*import\s+([\w.]+)/gm)) {
      found.add(m[1]);
    }
    return [...found];
  }
  const patterns = [
    /require\(\s*['"](\.{1,2}\/[^'"]+)['"]\s*\)/g,
    /\bfrom\s+['"](\.{1,2}\/[^'"]+)['"]/g,
    /\bimport\s+['"](\.{1,2}\/[^'"]+)['"]/g,
    /\bimport\(\s*['"](\.{1,2}\/[^'"]+)['"]\s*\)/g
  ];
  for (const re of patterns) {
    for (const m of text.matchAll(re)) {
      found.add(m[1]);
    }
  }
  return [...found];
}

/**
 * Un archivo chico va completo (así se ven los campos de un esquema, que es
 * justo lo que la IA necesita para no inventarlos). Uno grande se resume a
 * sus declaraciones de nivel superior.
 */
export function summarizeFile(text: string, languageId: string): string {
  if (text.length <= MAX_FILE_CHARS) {
    return text.trimEnd();
  }
  const lines = text.split('\n');
  const keep =
    languageId === 'python'
      ? /^(async\s+def |def |class |[A-Z_][A-Z0-9_]*\s*=)/
      : /^\s*(export\b|module\.exports|exports\.\w+\s*=|(async\s+)?function\b|class\b|const\s+\w+\s*=\s*(new\s+)?[\w.]*Schema\b)/;
  const signatures = lines.filter((l) => keep.test(l)).map((l) => l.trimEnd());
  const summary = signatures.length ? signatures.join('\n') : lines.slice(0, 40).join('\n');
  return `${summary.slice(0, MAX_FILE_CHARS)}\n(… archivo resumido a sus declaraciones)`;
}

/** Comentario que abre una instrucción en línea, por lenguaje. */
export function commentSyntax(languageId: string): { open: string; close: string } {
  if (
    [
      'python', 'ruby', 'shellscript', 'yaml', 'r', 'perl', 'toml', 'dockerfile',
      'makefile', 'elixir', 'powershell', 'coffeescript', 'julia', 'nim'
    ].includes(languageId)
  ) {
    return { open: '#', close: '' };
  }
  if (['sql', 'lua', 'haskell', 'ada'].includes(languageId)) {
    return { open: '--', close: '' };
  }
  if (['html', 'xml', 'markdown', 'vue-html', 'svg'].includes(languageId)) {
    return { open: '<!--', close: ' -->' };
  }
  if (['css', 'scss', 'less'].includes(languageId)) {
    return { open: '/*', close: ' */' };
  }
  return { open: '//', close: '' };
}

const INSTRUCTION_LINE =
  /^\s*(?:\/\/|#|--|\/\*|<!--)\s*ach:\s*(.+?)\s*(?:\*\/|-->)?\s*$/i;

/**
 * Detecta una instrucción `ach:` justo encima del cursor: la última línea no
 * vacía del texto previo, con solo espacios entre ella y el cursor.
 * Es el gesto más directo de "prompt → código" dentro del editor.
 *
 * Exige que el cursor esté en una línea nueva (el usuario pulsó Enter): si
 * sigue escribiendo la instrucción, no se dispara con un pedido a medias.
 */
export function detectInstruction(prefix: string): string | undefined {
  const lines = prefix.split('\n');
  if (lines.length < 2 || lines[lines.length - 1].trim() !== '') {
    return undefined;
  }
  for (let i = lines.length - 2; i >= 0 && i >= lines.length - 3; i--) {
    const line = lines[i];
    if (!line.trim()) {
      continue;
    }
    const m = line.match(INSTRUCTION_LINE);
    return m ? m[1].trim() : undefined;
  }
  return undefined;
}
