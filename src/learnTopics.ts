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

export type TopicKind = 'lenguaje' | 'libreria' | 'arquitectura' | 'automatizacion' | 'herramienta';

export interface LearnTopic {
  id: string;
  nombre: string;
  tipo: TopicKind;
  /** Palabras que lo identifican en lo que escribe la persona. */
  palabras: string[];
  /** Stack con el que se aprende mejor. */
  stack: string;
  arquitectura: ArchId;
  /** Ideas de proyecto que ejercitan el tema. */
  ideas: string[];
  /** Advertencias o requisitos propios del tema. */
  notas?: string;
}

export const TOPIC_KINDS: { tipo: TopicKind; titulo: string }[] = [
  { tipo: 'lenguaje', titulo: 'Lenguajes' },
  { tipo: 'libreria', titulo: 'Librerías y frameworks' },
  { tipo: 'arquitectura', titulo: 'Arquitectura y diseño' },
  { tipo: 'automatizacion', titulo: 'Automatización y datos' },
  { tipo: 'herramienta', titulo: 'Herramientas' }
];

export const LEARN_TOPICS: LearnTopic[] = [
  {
    id: 'typescript',
    nombre: 'TypeScript',
    tipo: 'lenguaje',
    palabras: ['typescript', 'ts', 'tipos', 'tipado'],
    stack: 'TypeScript 5 + Node.js 22 LTS + Vitest',
    arquitectura: 'capas',
    ideas: ['gestor de gastos en la terminal', 'API de tareas con validación de tipos', 'conversor de unidades con tests'],
    notas: 'Compilar con tsc y mostrar cómo los tipos atrapan errores antes de ejecutar.'
  },
  {
    id: 'javascript',
    nombre: 'JavaScript desde cero',
    tipo: 'lenguaje',
    palabras: ['javascript', 'js', 'programar desde cero', 'empezar a programar'],
    stack: 'HTML + CSS + JavaScript (ES modules) + Vitest',
    arquitectura: 'componentes',
    ideas: ['lista de compras en el navegador', 'juego de adivinar el número', 'calculadora de propinas'],
    notas: 'Empezar sin frameworks; servir con un servidor local porque los ES modules no cargan con doble clic.'
  },
  {
    id: 'python',
    nombre: 'Python',
    tipo: 'lenguaje',
    palabras: ['python', 'py'],
    stack: 'Python 3.13 + pytest',
    arquitectura: 'capas',
    ideas: ['agenda de contactos en la terminal', 'analizador de gastos desde un CSV', 'juego de preguntas'],
    notas: 'Usar entorno virtual (venv) desde el primer paso y explicar por qué.'
  },
  {
    id: 'threejs',
    nombre: 'Three.js (3D en el navegador)',
    tipo: 'libreria',
    palabras: ['three', 'threejs', 'three.js', '3d', 'webgl'],
    stack: 'Three.js + Vite + TypeScript + Vitest',
    arquitectura: 'componentes',
    ideas: ['sistema solar animado', 'galería 3D que se recorre con el mouse', 'mini juego de esquivar obstáculos'],
    notas: 'Separar la lógica (testeable sin navegador) del render; Vite sirve los módulos.'
  },
  {
    id: 'react',
    nombre: 'React',
    tipo: 'libreria',
    palabras: ['react', 'jsx', 'hooks'],
    stack: 'React 19 + Vite + TypeScript + Vitest + Testing Library',
    arquitectura: 'componentes',
    ideas: ['tablero de tareas con filtros', 'buscador de películas con una API pública', 'carrito de compras'],
  },
  {
    id: 'node-api',
    nombre: 'APIs con Node.js',
    tipo: 'libreria',
    palabras: ['node', 'nodejs', 'express', 'api rest', 'backend'],
    stack: 'Node.js 22 + Express 5 + TypeScript + PostgreSQL + Vitest + Supertest',
    arquitectura: 'capas',
    ideas: ['API de reservas', 'API de una biblioteca con préstamos', 'acortador de URLs'],
    notas: 'La base de datos corre en Docker para no instalar PostgreSQL a mano.'
  },
  {
    id: 'hexagonal',
    nombre: 'Arquitectura hexagonal',
    tipo: 'arquitectura',
    palabras: ['hexagonal', 'puertos y adaptadores', 'ports and adapters'],
    stack: 'TypeScript + Node.js 22 + Express 5 + Vitest',
    arquitectura: 'hexagonal',
    ideas: ['sistema de pedidos con pagos simulados', 'reservas de turnos médicos', 'billetera con transferencias'],
    notas: 'Demostrar el valor cambiando un adaptador (de memoria a base de datos) sin tocar el dominio, con los tests como prueba.'
  },
  {
    id: 'clean',
    nombre: 'Clean Architecture',
    tipo: 'arquitectura',
    palabras: ['clean architecture', 'arquitectura limpia', 'clean'],
    stack: 'TypeScript + Node.js 22 + Vitest',
    arquitectura: 'clean',
    ideas: ['gestor de suscripciones', 'sistema de inscripciones a cursos'],
  },
  {
    id: 'microservicios',
    nombre: 'Microservicios',
    tipo: 'arquitectura',
    palabras: ['microservicios', 'microservices'],
    stack: 'Node.js 22 + Express 5 + Docker Compose + RabbitMQ',
    arquitectura: 'microservicios',
    ideas: ['tienda con servicios de catálogo y pedidos', 'notificaciones que reaccionan a eventos'],
    notas: 'Empezar mostrando el monolito y por qué se separa; Docker Compose levanta los servicios.'
  },
  {
    id: 'automatizacion-python',
    nombre: 'Automatizaciones con Python',
    tipo: 'automatizacion',
    palabras: ['automatizar', 'automatizaciones', 'automatizacion', 'scripts', 'bot'],
    stack: 'Python 3.13 + pytest + requests + openpyxl',
    arquitectura: 'capas',
    ideas: ['ordenar archivos de la carpeta Descargas por tipo', 'reporte diario en Excel desde una API', 'renombrador masivo de fotos'],
    notas: 'Modo «simulación» antes de tocar archivos reales; programar la tarea con el programador del sistema.'
  },
  {
    id: 'sql',
    nombre: 'SQL y bases de datos',
    tipo: 'automatizacion',
    palabras: ['sql', 'postgres', 'postgresql', 'base de datos', 'bases de datos', 'mysql'],
    stack: 'PostgreSQL 17 + Python 3.13 + pytest',
    arquitectura: 'capas',
    ideas: ['base de datos de una biblioteca con consultas reales', 'reportes de ventas'],
    notas: 'PostgreSQL corre en Docker; cada consulta se comprueba con un test.'
  },
  {
    id: 'docker',
    nombre: 'Docker',
    tipo: 'herramienta',
    palabras: ['docker', 'contenedores', 'compose', 'dockerfile'],
    stack: 'Docker + Docker Compose + Node.js 22 + PostgreSQL',
    arquitectura: 'capas',
    ideas: ['dockerizar una API con su base de datos', 'entorno de desarrollo reproducible'],
  },
  {
    id: 'testing',
    nombre: 'Testing y TDD',
    tipo: 'herramienta',
    palabras: ['tests', 'testing', 'tdd', 'pruebas', 'unit test'],
    stack: 'TypeScript + Vitest',
    arquitectura: 'capas',
    ideas: ['carrito de compras con descuentos, escrito test primero', 'validador de contraseñas'],
    notas: 'Cada paso de código va precedido de su test (rojo → verde → refactor).'
  }
];

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
    '- Cada paso de archivo crea o completa UN archivo, con una pieza que se escribe en 5 a 40 líneas.',
    '- Rutas de archivo relativas, siguiendo la arquitectura elegida y las convenciones del stack.',
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
    '  "plan": [ { "paso": "qué construir", "tipo": "codigo|test|config|docker|comando", "archivo": "ruta/relativa.ext", "concepto": "concepto que enseña", "verificar": "comando que lo comprueba (si aplica)", "comando": "solo en pasos tipo comando", "explicacion": "solo en pasos tipo comando" } ]',
    '}',
    '```',
    'Usa versiones estables actuales. El plan del JSON debe coincidir con «## Paso a paso».',
    ...seed
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
