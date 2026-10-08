import { ARCHITECTURES, ArchId, getArchitecture } from './architectures';
import {
  LearnInfo,
  PlanStep,
  ProjectEnvironment,
  ProjectFile,
  StackInfo,
  parseEnvironment,
  parseStep
} from './projectFile';

/**
 * «Quiero aprender»: de un tema (un lenguaje, una librería, una arquitectura,
 * una herramienta) a un proyecto completo para aprenderlo, explicado de
 * principio a fin, con tests y, si hace falta, Docker.
 *
 * Este archivo es puro (sin vscode). Los temas curados son algoritmo: dan al
 * modelo una semilla probada (stack, arquitectura, ideas de proyecto) para que
 * el resultado sea consistente. Cualquier otro tema también funciona: el
 * proyecto lo diseña el LLM, que es lo único que puede generar contenido para
 * un tema abierto.
 */

import { LEARN_TOPICS, LearnTopic, TOPIC_KINDS, TopicKind } from './learnCatalog';
export { LEARN_TOPICS, TOPIC_KINDS };
export type { LearnTopic, TopicKind };

function norm(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/**
 * Tema curado que mejor coincide con lo que escribió la persona. Gana la
 * palabra clave más larga que aparece como palabra completa (así «clean
 * architecture» gana a «clean», y «ts» no coincide dentro de «tests»).
 */
export function matchTopic(text: string): LearnTopic | undefined {
  const t = ` ${norm(text).replace(/[^a-z0-9.+# ]+/g, ' ')} `;
  let best: { topic: LearnTopic; len: number } | undefined;
  for (const topic of LEARN_TOPICS) {
    for (const p of topic.palabras) {
      const w = norm(p);
      if (t.includes(` ${w} `) && (!best || w.length > best.len)) {
        best = { topic, len: w.length };
      }
    }
  }
  return best?.topic;
}

export type LearnLevel = 'cero' | 'otro-lenguaje' | 'algo';
export type LearnSize = 'corto' | 'mediano' | 'completo';

export const LEVEL_TEXT: Record<LearnLevel, string> = {
  cero: 'nunca programó',
  'otro-lenguaje': 'ya programa en otro lenguaje o con otra herramienta',
  algo: 'ya lo usó un poco y quiere entenderlo de verdad'
};

const SIZE_STEPS: Record<LearnSize, string> = {
  corto: '6 a 8 pasos (una o dos horas)',
  mediano: '10 a 12 pasos (un fin de semana)',
  completo: '14 a 18 pasos (un proyecto completo)'
};

export interface LearnRequest {
  tema: string;
  nivel: LearnLevel;
  tamano: LearnSize;
  topic?: LearnTopic;
  /** Proyecto elegido entre los recomendados (o escrito por la persona). */
  idea?: ProjectIdea;
}

// ---------------------------------------------------------------------------
// Recomendación de proyectos
// ---------------------------------------------------------------------------

export interface ProjectIdea {
  titulo: string;
  descripcion: string;
  /** Qué se aprende construyéndolo. */
  aprendes: string[];
  dificultad: 'baja' | 'media' | 'alta';
  /** Ej: «2 horas», «un fin de semana». */
  duracion: string;
  docker: boolean;
  nube: boolean;
  /** Tema al que pertenece (en «Recomiéndame un proyecto», cada idea trae el suyo). */
  tema?: string;
  /** Si es una lección sin IA (src/lessons.ts), su id. */
  leccion?: string;
}

/** Ideas del catálogo, sin IA: la recomendación cuando no hay conexión. */
export function curatedIdeas(topic: LearnTopic): ProjectIdea[] {
  return topic.ideas.map((idea) => ({
    titulo: idea.charAt(0).toUpperCase() + idea.slice(1),
    descripcion: `Proyecto curado para aprender ${topic.nombre} con ${topic.stack}.`,
    aprendes: [],
    dificultad: 'media',
    duracion: '',
    docker: /docker|postgres|rabbitmq|kubernetes/i.test(topic.stack),
    nube: topic.tipo === 'nube' && topic.id !== 'docker' && topic.id !== 'terraform' && topic.id !== 'kubernetes',
    tema: topic.nombre
  }));
}

/**
 * Prompt para que la IA RECOMIENDE proyectos: para un tema, o (sin tema) a
 * partir de lo que le interesa a la persona.
 */
export function buildIdeasSystemPrompt(req: { tema?: string; nivel: LearnLevel; interes?: string; topic?: LearnTopic }): string {
  return [
    'Eres un mentor que recomienda PROYECTOS PARA APRENDER: proyectos concretos, motivadores y realistas, que la persona va a construir escribiendo cada línea.',
    req.tema
      ? `Tema a aprender: «${req.tema}».`
      : 'La persona todavía no eligió tema: recomienda proyectos de temas distintos según lo que le interesa, y di en cada uno qué tema enseña.',
    req.interes ? `Lo que le interesa o para qué quiere aprender: «${req.interes}».` : '',
    `Punto de partida: ${LEVEL_TEXT[req.nivel]}.`,
    req.topic ? `Ideas del catálogo para inspirarte (puedes mejorarlas): ${req.topic.ideas.join('; ')}. Stack recomendado: ${req.topic.stack}.` : '',
    '',
    'Recomienda 3 proyectos distintos entre sí (uno sencillo, uno intermedio y uno más ambicioso), adecuados a su punto de partida.',
    'Responde SOLO con un bloque de código con la etiqueta ach-ideas que contenga un array JSON válido:',
    '```ach-ideas',
    '[ { "titulo": "nombre corto", "descripcion": "qué se construye, en 1-2 frases", "aprendes": ["3 a 5 conceptos"], "dificultad": "baja|media|alta", "duracion": "ej: 2 horas", "docker": false, "nube": false, "tema": "tema que enseña" } ]',
    '```'
  ]
    .filter((line, i, all) => line !== '' || all[i - 1] !== '')
    .join('\n');
}

/** Lee las ideas recomendadas; descarta las incompletas. Máximo 4. */
export function parseIdeas(answer: string): ProjectIdea[] {
  const block = answer.match(/```ach-ideas\s*\n([\s\S]*?)```/);
  let data: unknown;
  try {
    data = JSON.parse(block ? block[1] : answer);
  } catch {
    return [];
  }
  if (!Array.isArray(data)) {
    return [];
  }
  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
  return data
    .filter((x: any) => x && str(x.titulo) && str(x.descripcion))
    .slice(0, 4)
    .map((x: any) => ({
      titulo: str(x.titulo),
      descripcion: str(x.descripcion),
      aprendes: Array.isArray(x.aprendes) ? x.aprendes.filter((a: unknown): a is string => typeof a === 'string').slice(0, 6) : [],
      dificultad: ['baja', 'media', 'alta'].includes(x.dificultad) ? x.dificultad : 'media',
      duracion: str(x.duracion),
      docker: x.docker === true,
      nube: x.nube === true,
      tema: str(x.tema) || undefined
    }));
}

/** Prompt de sistema para diseñar el proyecto de aprendizaje. */
export function buildLearnSystemPrompt(req: LearnRequest): string {
  const ids = ARCHITECTURES.map((a) => a.id).join(', ');
  const seed = req.topic
    ? [
        '',
        'SEMILLA CURADA para este tema (úsala salvo que el pedido diga otra cosa):',
        `  stack: ${req.topic.stack}`,
        `  arquitectura: ${req.topic.arquitectura}`,
        `  ideas de proyecto: ${req.topic.ideas.join('; ')}`,
        req.topic.notas ? `  notas: ${req.topic.notas}` : ''
      ]
    : [];
  const idea = req.idea
    ? [
        '',
        `PROYECTO ELEGIDO (diseña exactamente este): «${req.idea.titulo}» — ${req.idea.descripcion}` +
          (req.idea.aprendes.length ? ` Debe enseñar: ${req.idea.aprendes.join(', ')}.` : '')
      ]
    : [];
  return [
    'Eres un mentor que diseña PROYECTOS PARA APRENDER. La persona quiere aprender un tema y lo va a aprender construyendo un proyecto real, escribiendo ella misma cada línea (la herramienta le dicta el código línea por línea con explicaciones).',
    `Tema: «${req.tema}». Punto de partida: ${LEVEL_TEXT[req.nivel]}. Tamaño: ${SIZE_STEPS[req.tamano]}.`,
    '',
    'Diseña UN proyecto concreto, motivador y útil que ejercite el tema de punta a punta. Responde en español, en Markdown, con esta estructura exacta:',
    '## Qué vas a construir — el proyecto en 2-3 frases y cómo se ve terminado.',
    '## Qué vas a aprender — los conceptos del tema, en el orden en que aparecen.',
    '## Antes de empezar — qué instalar y por qué, con los comandos (Windows, macOS y Linux si cambian).',
    '## Cómo está organizado — la arquitectura elegida y por qué es la adecuada para aprender este tema.',
    '## Paso a paso — cada paso del plan: qué se construye, por qué en ese orden y qué concepto enseña.',
    '## Tests — qué se prueba, cómo se escriben los tests en este stack y cómo correrlos.',
    '## Docker — SOLO si el proyecto lo necesita (una base de datos, varios servicios, o el tema es Docker/despliegue): por qué conviene aquí y los pasos. Si no hace falta, di en una frase por qué no.',
    '## Cómo seguir — 3 ideas para extender el proyecto cuando termines.',
    '',
    'REGLAS DEL PLAN:',
    '- Empieza por la configuración mínima (manifiesto del proyecto, configuración del compilador o del entorno) y avanza de lo simple a lo complejo; cada paso usa solo lo que ya se construyó.',
    '- TESTS OBLIGATORIOS: cada pieza de lógica tiene un paso de test (tipo "test"). Si el tema es testing/TDD, el test va ANTES del código; si no, inmediatamente después. Indica en "verificar" el comando que corre esos tests.',
    '- Docker solo cuando aporte (ver arriba). Si se usa: pasos tipo "docker" para el Dockerfile y/o docker-compose.yml, y pasos tipo "comando" para levantarlo, explicando cada comando.',
    '- Los pasos tipo "comando" no tienen archivo: llevan "comando" y "explicacion". Nunca pidas ejecutar comandos destructivos.',
    '- TEORÍA ESCRITA: antes del primer código que usa un concepto nuevo del tema, un paso tipo "teoria" con archivo notas/NN-concepto.md (NN = 01, 02…). Es un apunte que la persona también completa escribiendo: lo que explica el lenguaje o la herramienta, con un mini ejemplo. Uno cada 2 a 4 pasos de código, no más.',
    '- Cada paso de archivo crea o completa UN archivo, con una pieza que se escribe en 5 a 40 líneas.',
    '- Rutas de archivo relativas, siguiendo la arquitectura elegida y las convenciones del stack.',
    '- Todo lo que se escribe es un archivo que la persona completa línea por línea con explicaciones: también la configuración, la infraestructura como código (Terraform, Bicep, manifiestos YAML) y los notebooks se reemplazan por archivos .py o de configuración comentados.',
    '- NUBE (AWS, Azure, Google Cloud): explica la capa gratuita y crea una alerta de presupuesto en los primeros pasos; las credenciales se configuran con el CLI (perfil o SSO) o variables de entorno, NUNCA en el código ni en el repositorio; la infraestructura se escribe como código; el ÚLTIMO paso es un comando que destruye todo lo creado para no generar costos.',
    '- ENTRENAR IA: datos chicos que entrenen en CPU en minutos, datos de entrenamiento y de prueba separados, semilla fija para resultados reproducibles, métricas explicadas en palabras, y tests del preprocesamiento y de la predicción.',
    '- LLMs: el modelo va detrás de una interfaz; los tests usan un modelo falso y no gastan tokens; las API keys van en variables de entorno.',
    '- SEGURIDAD: solo contra el propio proyecto, en local; nunca contra sistemas ajenos.',
    '',
    'Después del Markdown, cierra SIEMPRE con un bloque de código con la etiqueta ach-learn que contenga JSON válido con esta forma exacta:',
    '```ach-learn',
    '{',
    '  "proyecto": "una frase: qué se construye + cómo quiere que le expliquen (ej: «gestor de gastos en TypeScript, explica cada tipo y por qué se eligió»)",',
    '  "objetivos": ["3 a 6 conceptos que va a aprender"],',
    '  "stack": { "resumen": "frase corta", "lenguaje": "nombre y versión", "framework": "si aplica", "datos": "si aplica", "tests": "framework de tests" },',
    '  "convenciones": ["3 a 5 convenciones concretas"],',
    `  "arquitectura": "uno de: ${ids}",`,
    '  "entorno": {',
    '    "instalar": [ { "comando": "…", "windows": "solo si cambia", "explicacion": "qué hace y por qué" } ],',
    '    "ejecutar": { "comando": "…", "explicacion": "…" },',
    '    "testear": { "comando": "…", "explicacion": "…" },',
    '    "docker": { "porQue": "…", "comandos": [ { "comando": "…", "explicacion": "…" } ] } o null',
    '  },',
    '  "plan": [ { "paso": "qué construir", "tipo": "teoria|codigo|test|config|docker|comando", "archivo": "ruta/relativa.ext", "concepto": "concepto que enseña", "verificar": "comando que lo comprueba (si aplica)", "comando": "solo en pasos tipo comando", "explicacion": "solo en pasos tipo comando" } ]',
    '}',
    '```',
    'Usa versiones estables actuales. El plan del JSON debe coincidir con «## Paso a paso».',
    ...seed,
    ...idea
  ]
    .filter((line, i, all) => line !== '' || all[i - 1] !== '')
    .join('\n');
}

export interface LearnProposal {
  proyecto: string;
  objetivos: string[];
  stack: StackInfo;
  convenciones: string[];
  arquitectura?: ArchId;
  entorno?: ProjectEnvironment;
  plan: PlanStep[];
}

/**
 * Separa la guía en Markdown del bloque ```ach-learn y lo valida: tipos de
 * paso conocidos, rutas dentro del proyecto, arquitectura del catálogo.
 * Sin plan o sin stack, no hay proyecto.
 */
export function parseLearnAnswer(answer: string): { markdown: string; proposal?: LearnProposal } {
  const block = answer.match(/```ach-learn\s*\n([\s\S]*?)```/);
  if (!block) {
    return { markdown: answer.trim() };
  }
  const markdown = answer.replace(block[0], '').trim();
  let data: any;
  try {
    data = JSON.parse(block[1]);
  } catch {
    return { markdown };
  }
  const stack: StackInfo = {};
  if (data?.stack && typeof data.stack === 'object') {
    for (const [k, v] of Object.entries(data.stack)) {
      if (typeof v === 'string' && v.trim()) {
        stack[k] = v.trim();
      }
    }
  }
  const plan: PlanStep[] = Array.isArray(data?.plan)
    ? data.plan.map(parseStep).filter((s: PlanStep | undefined): s is PlanStep => !!s)
    : [];
  if (!plan.length || !Object.keys(stack).length) {
    return { markdown };
  }
  const strings = (x: unknown) => (Array.isArray(x) ? x.filter((v): v is string => typeof v === 'string' && !!v.trim()) : []);
  const arquitectura = getArchitecture(data.arquitectura)?.id;
  return {
    markdown,
    proposal: {
      proyecto: typeof data.proyecto === 'string' && data.proyecto.trim() ? data.proyecto.trim() : '',
      objetivos: strings(data.objetivos),
      stack,
      convenciones: strings(data.convenciones),
      arquitectura,
      entorno: parseEnvironment(data.entorno),
      plan
    }
  };
}

/** Proyecto completo para autocompletehelp.json. */
export function learnProjectFile(
  proposal: LearnProposal,
  req: Pick<LearnRequest, 'tema' | 'nivel'>
): ProjectFile {
  const arch = getArchitecture(proposal.arquitectura);
  const aprender: LearnInfo = { tema: req.tema, nivel: LEVEL_TEXT[req.nivel], objetivos: proposal.objetivos };
  return {
    prompt: proposal.proyecto || `Proyecto para aprender ${req.tema}; explica cada código que agregues y por qué se eligió`,
    stack: proposal.stack,
    convenciones: proposal.convenciones,
    ...(arch
      ? {
          arquitectura: {
            estilo: arch.id,
            nombre: arch.nombre,
            razones: [`Elegida para aprender ${req.tema}.`],
            carpetas: [...arch.carpetas],
            reglas: [...arch.reglas]
          }
        }
      : {}),
    ...(proposal.entorno ? { entorno: proposal.entorno } : {}),
    aprender,
    plan: proposal.plan
  };
}

/** docs/APRENDER.md: la guía del proyecto, de principio a fin. */
export function learnGuideDoc(markdown: string, tema: string, fecha: string): string {
  return [
    `# Aprender ${tema}`,
    '',
    `*Guía generada por AutoCompleteHelp · ${fecha}. Se construye paso a paso desde el panel «Plan del proyecto»: cada paso se completa juntos, línea por línea.*`,
    '',
    markdown.trim(),
    ''
  ].join('\n');
}

/** Nombre de carpeta sugerido: «aprender-three-js». */
export function folderNameFor(tema: string): string {
  const slug = norm(tema)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return `aprender-${slug || 'proyecto'}`;
}
