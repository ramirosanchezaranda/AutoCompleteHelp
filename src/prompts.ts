import * as vscode from 'vscode';

export type LearningLevel = 'completo' | 'guiado' | 'pista';

const PROJECT_PROMPT_KEY = 'autocompletehelp.projectPrompt';

export function getProjectPrompt(context: vscode.ExtensionContext): string {
  return context.workspaceState.get<string>(PROJECT_PROMPT_KEY, '');
}

export async function setProjectPrompt(context: vscode.ExtensionContext): Promise<void> {
  const current = getProjectPrompt(context);
  const value = await vscode.window.showInputBox({
    title: 'Prompt del proyecto',
    prompt:
      'Describe qué estás construyendo y cómo quieres que te ayude (ej: "API REST en Express con MongoDB para una tienda; explícame cada middleware").',
    value: current,
    ignoreFocusOut: true
  });
  if (value !== undefined) {
    await context.workspaceState.update(PROJECT_PROMPT_KEY, value);
    vscode.window.showInformationMessage(
      value ? 'AutoCompleteHelp: prompt del proyecto guardado.' : 'AutoCompleteHelp: prompt del proyecto borrado.'
    );
  }
}

/** Prompt de sistema para el autocompletado inline, según el nivel de aprendizaje. */
export function buildSystemPrompt(
  level: LearningLevel,
  projectPrompt: string,
  guidance: boolean
): string {
  const base = [
    'Eres AutoCompleteHelp, un motor de autocompletado de código dentro de un IDE.',
    'Recibirás el código ANTES del cursor (PREFIX) y DESPUÉS del cursor (SUFFIX).',
    'Tu respuesta se inserta literalmente en la posición del cursor, así que:',
    '- Responde SOLO con el texto a insertar. Sin markdown, sin ``` , sin explicaciones fuera de comentarios de código.',
    '- No repitas el PREFIX ni el SUFFIX.',
    '- Respeta la indentación, el estilo y el lenguaje del archivo.',
    '- Completa una unidad razonable (resto de la línea, una función, un bloque). No escribas el archivo entero.'
  ];

  if (projectPrompt) {
    base.push(
      `PROMPT DEL PROYECTO (fuente de verdad): ${projectPrompt}`,
      'TODO el autocompletado está al servicio de ese prompt: cada sugerencia debe acercar el archivo actual al objetivo del proyecto.',
      'Si el PREFIX está vacío o casi vacío, este archivo es nuevo: propone el esqueleto inicial que le corresponde SEGÚN SU NOMBRE/RUTA y el prompt del proyecto (imports, estructura base, primera pieza).'
    );
    if (guidance) {
      base.push(
        'GUÍA DEL PROYECTO: termina SIEMPRE la sugerencia con una línea de comentario (sintaxis del lenguaje) que empiece con "➜ Siguiente paso:" indicando la próxima pieza concreta que falta del proyecto según el prompt (otra ruta, otro archivo, un modelo, un test…). Una sola línea.'
      );
    }
  }

  switch (level) {
    case 'guiado':
      base.push(
        'MODO GUIADO (objetivo: que el usuario aprenda): antes de cada parte no trivial del código que sugieras, agrega un comentario corto en español (una línea) explicando POR QUÉ se hace así. Usa la sintaxis de comentarios del lenguaje del archivo.'
      );
      break;
    case 'pista':
      base.push(
        'MODO PISTA (objetivo: que el usuario escriba su propio código): NO escribas la solución. Responde ÚNICAMENTE con comentarios en español (sintaxis de comentarios del lenguaje del archivo) que den los pasos y pistas concretas para que el usuario implemente el código por sí mismo. Máximo 5 comentarios cortos. Puedes mencionar nombres de funciones o APIs relevantes, pero nunca líneas de código completas.'
      );
      break;
    case 'completo':
    default:
      base.push('MODO COMPLETO: sugiere directamente el código, limpio y idiomático.');
      break;
  }
  return base.join('\n');
}

/** Prompt de usuario con el contexto del archivo. */
export function buildUserPrompt(
  languageId: string,
  fileName: string,
  prefix: string,
  suffix: string
): string {
  return [
    `Lenguaje: ${languageId}`,
    `Archivo: ${fileName}`,
    '<PREFIX>',
    prefix,
    '</PREFIX>',
    '<SUFFIX>',
    suffix,
    '</SUFFIX>',
    'Inserta la continuación en el cursor (entre PREFIX y SUFFIX):'
  ].join('\n');
}

/** Prompt de sistema para el comando "Explicar código seleccionado". */
export function buildExplainSystemPrompt(projectPrompt: string): string {
  const parts = [
    'Eres un mentor de programación paciente. Explica el código en español, para alguien que está aprendiendo.',
    'Estructura: 1) Qué hace en una frase. 2) Explicación línea por línea o por bloques. 3) Un concepto clave que conviene estudiar. 4) Una pregunta corta para que el estudiante verifique que entendió.',
    'Usa Markdown. Sé concreto y evita jerga innecesaria.'
  ];
  if (projectPrompt) {
    parts.push(`Contexto del proyecto: ${projectPrompt}`);
  }
  return parts.join('\n');
}

/**
 * Limpia la respuesta del modelo: quita fences de markdown y
 * el eco del final del prefix si el modelo lo repitió.
 */
export function sanitizeCompletion(raw: string, prefix: string): string {
  let text = raw;

  // Quitar fences ```lang ... ```
  const fence = text.match(/^\s*```[\w-]*\n([\s\S]*?)\n?```\s*$/);
  if (fence) {
    text = fence[1];
  }
  text = text.replace(/^\s*```[\w-]*\n?/, '').replace(/\n?```\s*$/, '');

  // Si el modelo repitió el final del prefix, recortarlo.
  const tail = prefix.slice(-200);
  for (let n = Math.min(tail.length, text.length); n > 4; n--) {
    if (tail.endsWith(text.slice(0, n))) {
      text = text.slice(n);
      break;
    }
  }
  return text.replace(/\s+$/, (m) => (m.includes('\n') ? '\n' : ''));
}
