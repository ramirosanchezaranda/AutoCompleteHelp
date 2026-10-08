import * as vscode from 'vscode';
import {
  PROJECT_FILE,
  formatProjectForPrompt,
  getProject,
  openProjectFile,
  saveProject
} from './projectFile';
import type { StackProfile } from './stackProfiles';
import type { Architecture } from './architectures';

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

export async function setProjectPrompt(context: vscode.ExtensionContext, preset?: string): Promise<void> {
  // Escrito en «Empezar»: se guarda y se sigue directo a elegir el stack.
  if (typeof preset === 'string' && preset.trim()) {
    await saveProject(context, { prompt: preset.trim() });
    await vscode.commands.executeCommand('autocompletehelp.recommendStack');
    return;
  }
  const value = await vscode.window.showInputBox({
    title: 'Prompt del proyecto',
    prompt:
      'Qué construyes + cómo quieres que te explique. Ej: "e-commerce completa, explica cada código que agregues y por qué elegiste esa metodología".',
    placeHolder: 'e-commerce completa, explica cada código que agregues y por qué elegiste esa metodología',
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

/**
 * Prompt de sistema de «COMPLETAMOS JUNTOS», el único modo: la IA no
 * autocompleta, dicta. Genera la pieza completa que la persona escribirá a
 * mano, línea por línea, encima del texto en gris. Los comentarios van ANTES
 * de cada línea o bloque, porque se muestran justo antes de escribirlo.
 */
/**
 * Apuntes de teoría (.md): se completan escribiendo igual que el código. Las
 * citas (>) son la explicación que se lee; lo demás lo escribe la persona.
 */
export const TEORIA_RULE = [
  '- Si el archivo es Markdown (.md), es un APUNTE DE TEORÍA que el alumno completa escribiendo. Aquí SÍ usas Markdown:',
  '  · la línea @ach-concepts va como comentario HTML: <!-- @ach-concepts: … -->',
  '  · las explicaciones van en líneas que empiezan con "> " (se leen, no se escriben): qué es, para qué sirve, por qué así;',
  '  · justo debajo de cada explicación, 1 a 3 líneas CORTAS que el alumno escribe para fijar la idea: un título "## …", una definición en una frase, o un mini ejemplo en un bloque ``` con su lenguaje;',
  '  · sin líneas en blanco entre una explicación y lo que se escribe debajo; entre 15 y 40 líneas en total.'
].join('\n');

/** Al cerrar cada bloque, un comentario «↑» que resume qué hace lo que se acaba de escribir. */
export const SUMMARY_RULE = [
  '- AL CERRAR UN BLOQUE (la llave } de una función, clase, método, if, for, try u objeto de configuración; en Python, al terminar el cuerpo de una función o clase), agrega en la línea siguiente un comentario de línea completa, con la indentación del bloque, que empiece con "↑ " y resuma en una frase QUÉ HACE ese bloque y para qué sirve (ej: "// ↑ reservar: rechaza la cancha ocupada y, si está libre, la guarda").',
  '  Después del comentario ↑, una línea en blanco antes del siguiente bloque. No lo agregues para bloques de una sola línea.'
].join('\n');

export function buildDictationSystemPrompt(
  projectBlock: string,
  guidance: boolean,
  known: string[] = [],
  workspaceSnapshot = ''
): string {
  const base = [
    'Eres AutoCompleteHelp en el modo «COMPLETAMOS JUNTOS», dentro de un IDE.',
    'No es un autocompletado: generas el código de una pieza del proyecto y el ALUMNO lo va a ESCRIBIR A MANO, línea por línea, encima de tu texto en gris.',
    'Se le muestra UNA línea de código a la vez, con los comentarios que tiene justo encima. Por eso cada comentario debe preparar la línea o el bloque que viene a continuación.',
    'Tu respuesta se inserta literalmente en el cursor, así que:',
    '- Responde SOLO con el código. Sin markdown, sin ``` , sin texto fuera de comentarios.',
    '- No repitas el PREFIX ni el SUFFIX, ni la línea de la instrucción "ach:".',
    '- Indenta con espacios, siguiendo el estilo del archivo.',
    'PRIMERA LÍNEA OBLIGATORIA: un comentario con el formato exacto "@ach-concepts: concepto-1, concepto-2" (1 a 4 conceptos con nombres canónicos). Se elimina antes de insertar.',
    '',
    'CÓMO SE DICTA:',
    '- Divide el código en BLOQUES pequeños (1 a 4 líneas) en el orden en que se escriben.',
    '- ANTES de cada bloque van comentarios de línea completa que dicen qué se escribe y POR QUÉ. Nunca comentarios al final de una línea de código: el alumno los tendría que escribir.',
    '- Cada línea de comentario tiene como máximo unos 80 caracteres: si la explicación es más larga, sigue en otra línea de comentario. Así se lee entera sin salirse de la pantalla.',
    '- El PRIMER comentario dice cómo empezar: qué se escribe primero en este archivo y por qué se empieza por ahí.',
    '- Si hay una ARQUITECTURA en el proyecto, el primer comentario también dice en qué parte de ella vive este archivo y qué regla respeta (ej: «esta es la capa de servicios: no conoce req ni res»).',
    '- Explica la METODOLOGÍA y el diseño, no solo la sintaxis: por qué esta forma de organizar o resolver y no otra.',
    '- La primera vez que aparece un concepto, defínelo en una frase sencilla. Nada de jerga sin explicar.',
    SUMMARY_RULE,
    CONTRASTIVE_RULE,
    '- Código completo y funcional. PROHIBIDO abreviar con "..." o "// resto igual": el alumno escribirá exactamente lo que dictes.',
    '- Extensión: lo necesario para la instrucción, como máximo unas 60 líneas de código (sin contar comentarios).',
    '- Si el archivo es JSON u otro formato que no admite comentarios, no escribas comentarios ni la línea @ach-concepts como comentario: escribe "@ach-concepts: …" sola en la primera línea y después el contenido válido.',
    '- Si el paso es un TEST, explica qué comportamiento comprueba cada test y por qué ese caso importa (el caso normal, el borde, el error).',
    TEORIA_RULE,
    '- Si el archivo es un shader GLSL (.frag, .vert, .glsl): NO escribas #version. WebGL la exige en la primera línea y el archivo empieza con comentarios; el código que compila el shader la antepone. Comenta cada uniform, varying y función como cualquier otro código.'
  ];

  if (projectBlock) {
    base.push(
      '',
      'PROYECTO (fuente de verdad, definido por el usuario en autocompletehelp.json):',
      projectBlock,
      'El texto del objetivo también dice CÓMO quiere el usuario que le expliques (ej: "explica cada código que agregues y por qué elegiste esa metodología"): cúmplelo al pie de la letra.',
      'Usa EXACTAMENTE el stack indicado, con APIs propias de esas versiones, y respeta las convenciones y las reglas de la arquitectura.'
    );
    if (guidance) {
      base.push('Termina con una línea de comentario que empiece con "➜ Siguiente paso:" con la próxima pieza concreta del plan.');
    }
  }

  if (workspaceSnapshot) {
    base.push(
      '',
      'ESTADO REAL DEL PROYECTO (no inventes archivos ni dependencias que no estén aquí):',
      workspaceSnapshot,
      'Importa solo archivos que existen o que el plan crea. Si falta una dependencia, dilo en un comentario con el comando para instalarla.'
    );
  }

  if (known.length) {
    base.push(
      '',
      `El alumno YA DOMINA: ${known.join(', ')}. No le expliques eso de nuevo: una línea de porqué basta. Reserva las explicaciones largas para lo nuevo.`
    );
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
export function buildStackSystemPrompt(
  preferredStack?: string,
  profile?: Pick<StackProfile, 'stack' | 'convenciones' | 'planBase' | 'crearArchivosDelPlan'>,
  architecture?: Pick<Architecture, 'nombre' | 'carpetas' | 'reglas'>
): string {
  const arch = architecture
    ? [
        '',
        `ARQUITECTURA ELEGIDA: ${architecture.nombre}. Es obligatoria para el plan:`,
        `  estructura orientativa: ${architecture.carpetas.join('; ')}`,
        `  reglas: ${architecture.reglas.join(' ')}`,
        'Las rutas de archivo del plan siguen esa estructura, adaptada a las convenciones del stack.',
        'Ordena los pasos para que cada capa o módulo se construya antes que lo que depende de él, y nombra en "concepto" la idea de arquitectura que enseña cada paso cuando aplique.',
        'En "## Estructura inicial" explica en qué parte de la arquitectura va cada archivo.'
      ]
    : [];
  const base = profile
    ? [
        '',
        'PERFIL CURADO de este stack (úsalo como base obligatoria):',
        `  stack: ${JSON.stringify(profile.stack)}`,
        `  convenciones: ${JSON.stringify(profile.convenciones)}`,
        `  plan de ejemplo: ${JSON.stringify(profile.planBase)}`,
        'En el bloque ach-project copia "stack" y "convenciones" tal cual. Adapta el plan a ESTE proyecto',
        '(nombres de archivos y recursos del dominio del usuario), siguiendo esas convenciones y estructura de carpetas.',
        profile.crearArchivosDelPlan
          ? ''
          : 'Las rutas de archivo del plan deben coincidir con la estructura que genera la propia herramienta del stack.'
      ]
    : [];
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
    '  "plan": [ { "paso": "qué construir", "tipo": "teoria|codigo|test|config", "archivo": "ruta/relativa.ext", "concepto": "concepto que enseña" } ]',
    '}',
    '```',
    'Cuando un paso introduce un concepto que el usuario probablemente no conoce, agrega antes un paso tipo "teoria" con archivo notas/NN-concepto.md: un apunte que también completa escribiendo.',
    'El plan debe coincidir con la Ruta de aprendizaje. Omite en "stack" las claves que no apliquen (ej: sin base de datos). Usa versiones estables actuales.',
    ...base,
    ...arch
  ]
    .filter((line, i, all) => line !== '' || all[i - 1] !== '')
    .join('\n');
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
  // Fence abierto sin cerrar (streaming cortado). Un apunte .md puede terminar
  // en un bloque de código: su ``` final se respeta si no empezó con uno.
  else if (/^\s*```/.test(text)) {
    text = text.replace(/^\s*```[\w-]*\n?/, '').replace(/\n?```\s*$/, '');
  }

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
