import * as vscode from 'vscode';

export type LearningLevel = 'completo' | 'guiado' | 'pista' | 'educame';

const PROJECT_PROMPT_KEY = 'autocompletehelp.projectPrompt';

export function getProjectPrompt(context: vscode.ExtensionContext): string {
  return context.workspaceState.get<string>(PROJECT_PROMPT_KEY, '');
}

export async function saveProjectPrompt(
  context: vscode.ExtensionContext,
  value: string
): Promise<void> {
  await context.workspaceState.update(PROJECT_PROMPT_KEY, value);
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

/**
 * Plantilla del comentario pedagógico. El "por qué" real es CONTRASTIVO:
 * un comentario que solo describe lo que ya se lee en el código no enseña nada.
 */
const CONTRASTIVE_RULE = [
  'FORMATO OBLIGATORIO DEL COMENTARIO (para cada decisión no trivial), en 1-3 líneas con estos movimientos:',
  '  1. QUÉ hace, en pocas palabras.',
  '  2. EN VEZ DE QUÉ: la alternativa obvia que descartaste y por qué esta gana aquí. Este movimiento es OBLIGATORIO.',
  '  3. CUÁNDO NO: en qué situación esta misma elección sería incorrecta. Inclúyelo cuando aporte criterio.',
  'Ejemplo del tono buscado:',
  '  // Devolvemos 201 y no 200: 200 dice "salió bien" pero no que ahora existe algo nuevo.',
  '  // Si esta ruta actualizara en vez de crear, 200 sería lo correcto.',
  'PROHIBIDO: comentarios que repiten el código en castellano ("// guardamos el producto" sobre producto.save()).',
  'Si no encuentras una alternativa real que contrastar, no escribas el comentario: el código va solo.'
].join('\n');

/** Prompt de sistema para el autocompletado inline, según el nivel de aprendizaje. */
export function buildSystemPrompt(
  level: LearningLevel,
  projectPrompt: string,
  guidance: boolean,
  known: string[] = []
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

  // Marcador de conceptos: primera línea de la respuesta (va primero para que
  // sobreviva al corte temprano del streaming). La extensión lo elimina antes
  // de insertar y lo usa para saber qué ya te explicó.
  base.push(
    'PRIMERA LÍNEA OBLIGATORIA de tu respuesta: un comentario (sintaxis del lenguaje) con el formato exacto',
    '  @ach-concepts: concepto-1, concepto-2',
    'listando de 1 a 4 conceptos de programación que usa tu sugerencia, con nombres canónicos y estables',
    '(ej: async/await, try/catch, destructuring, middleware, códigos de estado HTTP, promesas).',
    'Esa línea se elimina antes de insertar el código: no la comentes ni la expliques.'
  );

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

  // Andamiaje decreciente: lo que ya se repitió no se vuelve a explicar.
  if (known.length && (level === 'guiado' || level === 'educame')) {
    base.push(
      'MEMORIA DEL APRENDIZ — el usuario YA DOMINA estos conceptos porque los repitió varias veces:',
      `  ${known.join(', ')}`,
      'NO vuelvas a explicarlos: da ese código sin comentario, como se lo darías a alguien con experiencia.',
      'Reserva los comentarios para lo que sea nuevo o poco frecuente en esta sugerencia.',
      'Explicar de más a quien ya sabe entorpece la lectura y hace que deje de leer los comentarios que sí importan.'
    );
  }

  switch (level) {
    case 'educame':
      base.push(
        'MODO EDÚCAME (el usuario está empezando desde cero): asume que todavía NO sabe programar.',
        'Sugiere el código en pasos muy pequeños y comenta cada parte nueva como un profesor paciente.',
        'La primera vez que aparezca un concepto, defínelo en una frase sencilla. Nada de jerga sin explicar.',
        'Introduce como máximo una idea nueva por sugerencia: mejor corto y entendido que largo y mágico.',
        CONTRASTIVE_RULE,
        'Adaptación para este nivel: en el movimiento 2 contrasta contra lo que alguien haría por intuición, no contra tecnicismos que el usuario aún no conoce.',
        '  // Guardamos el resultado en una variable en vez de usarlo suelto:',
        '  // así podemos volver a usarlo más abajo sin repetir el trabajo.'
      );
      break;
    case 'guiado':
      base.push(
        'MODO GUIADO (objetivo: que el usuario aprenda el criterio, no que copie):',
        'comenta cada decisión no trivial del código que sugieras, en español y con la sintaxis de comentarios del lenguaje.',
        CONTRASTIVE_RULE
      );
      break;
    case 'pista':
      base.push(
        'MODO PISTA (objetivo: que el usuario escriba su propio código): NO escribas la solución.',
        'Responde ÚNICAMENTE con comentarios en español (sintaxis del lenguaje) que den los pasos y pistas concretas para que el usuario lo implemente por sí mismo. Máximo 5 comentarios cortos.',
        'Puedes mencionar nombres de funciones o APIs relevantes, pero nunca líneas de código completas.',
        'En al menos una pista, plantea la decisión como una elección: menciona la alternativa obvia y pregunta cuál conviene aquí y por qué (sin dar la respuesta).'
      );
      break;
    case 'completo':
    default:
      base.push('MODO COMPLETO: sugiere directamente el código, limpio y idiomático, sin comentarios pedagógicos.');
      break;
  }
  return base.join('\n');
}

/** Marcador que el modelo emite en la primera línea con los conceptos usados. */
const CONCEPT_MARKER = /^[^\n]*@ach-concepts:[ \t]*([^\n]*)\n?/m;

/**
 * Separa el marcador de conceptos del texto que realmente se inserta.
 * Tolera que falte (streaming cortado, modelo desobediente): en ese caso
 * simplemente no hay conceptos que registrar.
 */
export function extractConcepts(raw: string): { text: string; concepts: string[] } {
  const match = raw.match(CONCEPT_MARKER);
  if (!match) {
    return { text: raw, concepts: [] };
  }
  const concepts = match[1]
    .split(',')
    .map((s) => s.replace(/[*\/#<>-]+$/, '').trim())
    .filter(Boolean)
    .slice(0, 4);
  return { text: raw.replace(CONCEPT_MARKER, ''), concepts };
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

/** Prompt de sistema para el comando "Recomendar stack para mi proyecto". */
export function buildStackSystemPrompt(): string {
  return [
    'Eres un mentor de arquitectura de software especializado en personas que están aprendiendo a programar.',
    'Te darán la descripción de un proyecto. Recomienda el stack tecnológico más adecuado priorizando: curva de aprendizaje amable, comunidad y documentación en español, y que sirva para aprender fundamentos transferibles.',
    'Responde en español, en Markdown, con esta estructura exacta:',
    '## Recomendación principal — el stack elegido y POR QUÉ es el mejor para aprender con este proyecto',
    '## Alternativas — 2 opciones con sus pros y contras en una línea cada uno',
    '## Estructura inicial — los primeros 4-6 archivos/carpetas del proyecto y qué va en cada uno',
    '## Ruta de aprendizaje — 4-5 pasos ordenados: qué construir primero y qué concepto aprendes en cada paso',
    'Cierra SIEMPRE con una última línea que empiece exactamente con "STACK RECOMENDADO:" seguida del stack en una sola frase corta.'
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
