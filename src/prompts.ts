import * as vscode from 'vscode';
import {
  PROJECT_FILE,
  formatProjectForPrompt,
  getProject,
  openProjectFile,
  saveProject
} from './projectFile';

export type LearningLevel = 'completo' | 'guiado' | 'pista' | 'educame';

/** El prompt del proyecto (texto libre). Vive en autocompletehelp.json. */
export function getProjectPrompt(_context?: vscode.ExtensionContext): string {
  return getProject()?.prompt ?? '';
}

/** Proyecto completo formateado para los prompts: objetivo, stack, convenciones, plan. */
export function getProjectBlock(): string {
  return formatProjectForPrompt(getProject());
}

export async function saveProjectPrompt(
  context: vscode.ExtensionContext,
  value: string
): Promise<void> {
  await saveProject(context, { prompt: value });
}

export async function setProjectPrompt(context: vscode.ExtensionContext): Promise<void> {
  const value = await vscode.window.showInputBox({
    title: 'Prompt del proyecto',
    prompt:
      'Describe qué estás construyendo y cómo quieres que te ayude (ej: "API REST para una tienda; explícame cada middleware").',
    value: getProjectPrompt(),
    ignoreFocusOut: true
  });
  if (value === undefined) {
    return;
  }
  const inFile = await saveProject(context, { prompt: value });
  if (!inFile) {
    vscode.window.showInformationMessage(
      'AutoCompleteHelp: prompt guardado. Abre una carpeta para guardarlo en autocompletehelp.json y versionarlo con tu código.'
    );
    return;
  }
  const action = await vscode.window.showInformationMessage(
    `AutoCompleteHelp: prompt guardado en ${PROJECT_FILE}.`,
    'Abrir archivo',
    'Elegir stack'
  );
  if (action === 'Abrir archivo') {
    await openProjectFile();
  } else if (action === 'Elegir stack') {
    await vscode.commands.executeCommand('autocompletehelp.recommendStack');
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
  projectBlock: string,
  guidance: boolean,
  known: string[] = [],
  workspaceSnapshot = ''
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

  if (projectBlock) {
    base.push(
      'PROYECTO (fuente de verdad, definido por el usuario en autocompletehelp.json):',
      projectBlock,
      'TODO el autocompletado está al servicio de este proyecto: cada sugerencia debe acercar el archivo actual al objetivo.',
      'Usa EXACTAMENTE el stack indicado, con APIs propias de esas versiones (no mezcles sintaxis de versiones anteriores) y respeta las convenciones.',
      'Si el PREFIX está vacío o casi vacío, este archivo es nuevo: propone el esqueleto inicial que le corresponde SEGÚN SU NOMBRE/RUTA, el stack y el objetivo (imports, estructura base, primera pieza).'
    );
    if (guidance) {
      base.push(
        'GUÍA DEL PROYECTO: termina SIEMPRE la sugerencia con una línea de comentario (sintaxis del lenguaje) que empiece con "➜ Siguiente paso:" indicando la próxima pieza concreta que falta. Si hay un "Paso actual del plan" y ya está resuelto en este archivo, apunta al siguiente del plan; si no, a lo que falte para completarlo. Una sola línea.'
      );
    }
  }

  if (workspaceSnapshot) {
    base.push(
      'ESTADO REAL DEL PROYECTO (no inventes archivos ni dependencias que no estén aquí):',
      workspaceSnapshot,
      'Importa solo archivos que existen en esta lista o que el usuario está creando ahora. Si falta una dependencia necesaria, indícalo en un comentario con el comando para instalarla, en vez de asumirla.',
      'Cuando uses un archivo que aparece en ARCHIVOS RELACIONADOS, usa sus nombres, exports y campos reales.'
    );
  }

  base.push(
    'INSTRUCCIONES EN LÍNEA: si el mensaje trae una INSTRUCCIÓN DEL USUARIO (escrita en el código como un comentario "ach: …"),',
    'implementa exactamente eso debajo de ese comentario, con el nivel de ayuda de este modo. No repitas ni modifiques la línea de la instrucción.'
  );

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
  suffix: string,
  related = '',
  instruction?: string
): string {
  const parts = [`Lenguaje: ${languageId}`, `Archivo: ${fileName}`];
  if (related) {
    parts.push(
      '<ARCHIVOS RELACIONADOS (importados por este archivo)>',
      related,
      '</ARCHIVOS RELACIONADOS>'
    );
  }
  parts.push('<PREFIX>', prefix, '</PREFIX>', '<SUFFIX>', suffix, '</SUFFIX>');
  if (instruction) {
    parts.push(
      `INSTRUCCIÓN DEL USUARIO (prioridad máxima): ${instruction}`,
      'Implementa la instrucción en el cursor, debajo del comentario que la contiene.'
    );
  } else {
    parts.push('Inserta la continuación en el cursor (entre PREFIX y SUFFIX):');
  }
  return parts.join('\n');
}

/** Prompt de sistema para el comando "Recomendar stack para mi proyecto". */
export function buildStackSystemPrompt(preferredStack?: string): string {
  const intro = preferredStack
    ? [
        'Eres un mentor de arquitectura de software especializado en personas que están aprendiendo a programar.',
        `El usuario YA ELIGIÓ su stack: "${preferredStack}". Respeta esa elección: tu trabajo es concretarla (versiones actuales y estables, piezas que faltan, convenciones) y planificar el proyecto con ella.`,
        'Solo si esa elección tiene un problema serio para este proyecto, menciónalo con respeto en una línea dentro de "Alternativas", sin cambiarla.',
        'Responde en español, en Markdown, con esta estructura exacta:',
        '## Tu stack — el stack concretado (con versiones) y POR QUÉ encaja con el proyecto'
      ]
    : [
        'Eres un mentor de arquitectura de software especializado en personas que están aprendiendo a programar.',
        'Te darán la descripción de un proyecto. Recomienda el stack tecnológico más adecuado priorizando: curva de aprendizaje amable, comunidad y documentación en español, y que sirva para aprender fundamentos transferibles.',
        'Responde en español, en Markdown, con esta estructura exacta:',
        '## Recomendación principal — el stack elegido y POR QUÉ es el mejor para aprender con este proyecto'
      ];
  return [
    ...intro,
    '## Alternativas — 2 opciones con sus pros y contras en una línea cada uno',
    '## Estructura inicial — los primeros 4-6 archivos/carpetas del proyecto y qué va en cada uno',
    '## Ruta de aprendizaje — 4-6 pasos ordenados: qué construir primero y qué concepto aprendes en cada paso',
    '',
    'Después del Markdown, cierra SIEMPRE con un bloque de código con la etiqueta ach-project que contenga JSON válido con esta forma exacta:',
    '```ach-project',
    '{',
    '  "stack": { "resumen": "frase corta", "lenguaje": "nombre y versión", "framework": "nombre y versión", "datos": "base de datos y librería", "tests": "framework de tests" },',
    '  "convenciones": ["3 a 5 convenciones concretas: sistema de módulos, dónde van rutas/componentes, estilo de manejo de errores…"],',
    '  "plan": [ { "paso": "qué construir", "archivo": "ruta/relativa.ext", "concepto": "concepto que enseña" } ]',
    '}',
    '```',
    'El plan debe coincidir con la Ruta de aprendizaje. Omite en "stack" las claves que no apliquen (ej: sin base de datos). Usa versiones estables actuales.'
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
