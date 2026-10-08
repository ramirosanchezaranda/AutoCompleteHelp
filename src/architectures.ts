/**
 * Arquitecturas y diseño de sistemas. Antes de escribir código se decide
 * CÓMO se organiza: dónde vive cada pieza y quién puede depender de quién.
 * Esa decisión guía el plan (rutas de archivo), el dictado (cada archivo
 * explica en qué parte de la arquitectura vive) y queda escrita en
 * docs/ARQUITECTURA.md como registro de decisión.
 *
 * El catálogo y la recomendación son algoritmo, sin LLM: funcionan sin API
 * key. Son independientes del stack: las carpetas son orientativas y el plan
 * las adapta a las convenciones de cada tecnología.
 */

export type AppKind = 'api' | 'web-servidor' | 'frontend' | 'otra';

export type ArchId =
  | 'capas'
  | 'mvc'
  | 'modular'
  | 'hexagonal'
  | 'clean'
  | 'componentes'
  | 'microservicios'
  | 'serverless'
  | 'eventos';

export interface Architecture {
  id: ArchId;
  nombre: string;
  /** En una frase. */
  resumen: string;
  /** Cómo se organiza el código. */
  como: string;
  /** Estructura orientativa; el plan la adapta al stack. */
  carpetas: string[];
  /** Reglas que el código dictado respeta (sobre todo, de dependencias). */
  reglas: string[];
  /** Recorrido de una petición de punta a punta. */
  flujo: string;
  cuandoSi: string[];
  cuandoNo: string[];
  /** Lo que se paga por elegirla. */
  costo: string;
  /** 1 = la más simple. */
  complejidad: 1 | 2 | 3 | 4 | 5;
  tipos: AppKind[];
  /** Diagrama Mermaid. */
  diagrama: string;
}

export const ARCHITECTURES: Architecture[] = [
  {
    id: 'capas',
    nombre: 'Monolito en capas',
    resumen: 'Una sola aplicación dividida en capas: rutas → servicios → datos.',
    como: 'Cada capa tiene un trabajo: las rutas reciben la petición, los servicios aplican las reglas del negocio y la capa de datos habla con la base. Cada capa solo llama a la de abajo.',
    carpetas: ['routes/ (o controllers/)', 'services/', 'models/ (o repositories/)', 'config/'],
    reglas: [
      'Las rutas no hablan con la base de datos: llaman a un servicio.',
      'Los servicios no conocen HTTP (ni req ni res): reciben datos y devuelven datos.',
      'Solo la capa de datos importa el ORM o el driver de la base.'
    ],
    flujo: 'Petición HTTP → ruta (valida la entrada) → servicio (reglas del negocio) → modelo (lee o escribe en la base) → respuesta.',
    cuandoSi: ['Proyectos chicos o medianos', 'Una persona o un equipo pequeño', 'Aprender cómo se separan responsabilidades'],
    cuandoNo: [
      'Cuando el sistema tiene muchas áreas que cambian por separado: todo termina en services/ gigantes',
      'Cuando necesitas cambiar seguido la base de datos o proveedores externos sin tocar el negocio'
    ],
    costo: 'Poco: algo más de archivos que meter todo en las rutas. Con el tiempo las capas pueden engordar.',
    complejidad: 1,
    tipos: ['api', 'web-servidor', 'otra'],
    diagrama: 'flowchart LR\n  C[Cliente] --> R[Rutas]\n  R --> S[Servicios]\n  S --> M[Modelos / datos]\n  M --> DB[(Base de datos)]'
  },
  {
    id: 'mvc',
    nombre: 'Monolito MVC',
    resumen: 'Modelo, Vista y Controlador: el clásico de las webs que arman las páginas en el servidor.',
    como: 'El controlador recibe la petición, usa los modelos para los datos y elige la vista (plantilla HTML) que se devuelve.',
    carpetas: ['models/', 'views/ (plantillas)', 'controllers/', 'static/ (CSS, JS, imágenes)'],
    reglas: [
      'Las vistas solo muestran datos: sin consultas ni reglas del negocio.',
      'Los controladores coordinan; la lógica pesada va en los modelos o en servicios.',
      'Los modelos no saben nada de HTML.'
    ],
    flujo: 'Petición → controlador → modelo (datos) → vista (HTML con esos datos) → página en el navegador.',
    cuandoSi: ['Webs con páginas del servidor (Django, Rails, Laravel)', 'Paneles de administración, blogs, tiendas sencillas'],
    cuandoNo: ['APIs consumidas por apps móviles o un frontend aparte: no hay vistas', 'Interfaces muy interactivas en el navegador'],
    costo: 'Poco, y el framework ya lo trae armado. El riesgo es el «controlador gordo» que hace de todo.',
    complejidad: 1,
    tipos: ['web-servidor'],
    diagrama: 'flowchart LR\n  N[Navegador] --> C[Controlador]\n  C --> M[Modelo]\n  M --> DB[(Base de datos)]\n  C --> V[Vista / plantilla]\n  V --> N'
  },
  {
    id: 'modular',
    nombre: 'Monolito modular',
    resumen: 'Una sola aplicación, dividida por áreas del negocio (catálogo, carrito, pagos…), cada una con sus capas.',
    como: 'Cada módulo agrupa todo lo de su área y expone una pequeña interfaz pública. Los módulos se hablan solo a través de esa interfaz, nunca tocando las tablas o archivos internos del otro.',
    carpetas: ['modules/catalogo/ (rutas, servicio, datos)', 'modules/carrito/', 'modules/pedidos/', 'shared/ (lo común: config, errores)'],
    reglas: [
      'Un módulo no importa archivos internos de otro: solo su interfaz pública (index).',
      'Cada módulo es dueño de sus datos: nadie más los consulta directo.',
      'shared/ solo tiene utilidades genéricas, nunca reglas de un área.'
    ],
    flujo: 'Petición → módulo que la atiende (sus rutas → su servicio → sus datos); si necesita otra área, llama a la interfaz pública de ese módulo.',
    cuandoSi: ['Varias áreas del negocio que crecen por separado', 'Equipos que pueden repartirse por área', 'Querer la opción de separar un módulo en servicio más adelante'],
    cuandoNo: ['Proyectos con una o dos áreas: los módulos son burocracia', 'Cuando todavía no está claro dónde están los límites entre áreas'],
    costo: 'Medio: hay que decidir y cuidar los límites entre módulos.',
    complejidad: 2,
    tipos: ['api', 'web-servidor', 'otra'],
    diagrama: 'flowchart LR\n  C[Cliente] --> A[App]\n  A --> M1[Módulo catálogo]\n  A --> M2[Módulo carrito]\n  A --> M3[Módulo pedidos]\n  M3 -- interfaz pública --> M1\n  M1 --> DB[(Base de datos)]\n  M2 --> DB\n  M3 --> DB'
  },
  {
    id: 'hexagonal',
    nombre: 'Hexagonal (puertos y adaptadores)',
    resumen: 'El negocio en el centro, sin depender de nada externo; la web, la base y los servicios externos se conectan por «puertos».',
    como: 'El dominio define interfaces (puertos) de lo que necesita: «guardar un pedido», «cobrar». Afuera, los adaptadores implementan esos puertos con tecnologías concretas: Express, MongoDB, Stripe. Cambiar la base es cambiar un adaptador.',
    carpetas: ['domain/ (entidades y reglas puras)', 'application/ (casos de uso y puertos)', 'adapters/in/ (HTTP, CLI)', 'adapters/out/ (base de datos, APIs externas)'],
    reglas: [
      'El dominio no importa nada de afuera: ni framework, ni ORM, ni HTTP.',
      'Las dependencias apuntan hacia adentro: los adaptadores conocen al dominio, nunca al revés.',
      'Cada tecnología externa entra solo por un adaptador que implementa un puerto.'
    ],
    flujo: 'Petición → adaptador HTTP → caso de uso → dominio; el caso de uso usa un puerto («repositorio de pedidos») que implementa el adaptador de base de datos.',
    cuandoSi: ['Reglas de negocio importantes que hay que testear sin base ni servidor', 'Tecnologías externas que pueden cambiar (pagos, base, proveedores)', 'Aprender diseño desacoplado e inversión de dependencias'],
    cuandoNo: ['CRUD simple sin reglas de negocio: son muchas capas para pasar datos', 'Prototipos que hay que mostrar rápido'],
    costo: 'Alto al principio: interfaces, adaptadores y más archivos. Se recupera cuando el proyecto crece o cambia de tecnología.',
    complejidad: 3,
    tipos: ['api', 'otra'],
    diagrama: 'flowchart LR\n  H[Adaptador HTTP] --> UC[Casos de uso]\n  UC --> D[Dominio]\n  UC --> P{{Puerto: repositorio}}\n  A[Adaptador base de datos] -. implementa .-> P\n  A --> DB[(Base de datos)]'
  },
  {
    id: 'clean',
    nombre: 'Clean Architecture',
    resumen: 'Círculos concéntricos: entidades → casos de uso → adaptadores → frameworks. Prima hermana de la hexagonal.',
    como: 'Igual idea que la hexagonal (el negocio no depende de lo externo), con capas más nombradas: entidades, casos de uso, adaptadores de interfaz y frameworks/drivers.',
    carpetas: ['entities/', 'use-cases/', 'interface-adapters/ (controladores, presentadores, repositorios)', 'frameworks/ (servidor web, base de datos)'],
    reglas: [
      'Regla de dependencia: el código solo apunta hacia círculos más internos.',
      'Los casos de uso reciben y devuelven estructuras simples, no objetos del framework.',
      'Los frameworks son un detalle: se enchufan en el círculo externo.'
    ],
    flujo: 'Petición → controlador (adaptador) → caso de uso → entidades; la respuesta pasa por un presentador antes de salir.',
    cuandoSi: ['Sistemas con mucha lógica de negocio y larga vida', 'Equipos que ya conocen la hexagonal y quieren capas más explícitas'],
    cuandoNo: ['Proyectos chicos o para aprender lo básico: es la opción con más ceremonia', 'Cuando el valor está en la interfaz, no en reglas de negocio'],
    costo: 'El más alto en archivos y capas. Fácil caer en abstracciones que nadie necesita.',
    complejidad: 4,
    tipos: ['api', 'otra'],
    diagrama: 'flowchart LR\n  F[Frameworks y drivers] --> I[Adaptadores de interfaz]\n  I --> U[Casos de uso]\n  U --> E[Entidades]'
  },
  {
    id: 'componentes',
    nombre: 'Frontend por componentes y funcionalidades',
    resumen: 'La interfaz armada con componentes reutilizables, agrupados por funcionalidad (catálogo, carrito…).',
    como: 'Cada funcionalidad tiene su carpeta con sus componentes, su estado y sus llamadas a la API. Lo reutilizable en toda la app va en components/ compartidos.',
    carpetas: ['src/features/catalogo/', 'src/features/carrito/', 'src/components/ (botones, tarjetas…)', 'src/services/ (llamadas a la API)'],
    reglas: [
      'Un componente hace una cosa; si crece, se divide.',
      'Las llamadas a la API van en services/, no dentro de los componentes visuales.',
      'Una funcionalidad no importa los internos de otra: comparte por components/ o services/.'
    ],
    flujo: 'Clic del usuario → componente → servicio (fetch a la API) → estado → la interfaz se vuelve a dibujar.',
    cuandoSi: ['Frontends en React, Vue, Svelte o JavaScript con módulos', 'Interfaces con varias pantallas o funcionalidades'],
    cuandoNo: ['Una página estática simple: con HTML y CSS alcanza'],
    costo: 'Bajo; el riesgo es crear componentes «genéricos» antes de necesitarlos.',
    complejidad: 1,
    tipos: ['frontend'],
    diagrama: 'flowchart LR\n  U[Usuario] --> C[Componente]\n  C --> S[Servicio API]\n  S --> API[(Backend)]\n  S --> E[Estado]\n  E --> C'
  },
  {
    id: 'microservicios',
    nombre: 'Microservicios',
    resumen: 'Varias aplicaciones chicas e independientes, cada una con su base, que se comunican por red.',
    como: 'Cada servicio es un programa aparte (catálogo, pagos, usuarios) que se despliega solo y se comunica por HTTP o mensajes.',
    carpetas: ['services/catalogo/ (app completa)', 'services/pagos/', 'services/usuarios/', 'gateway/ (punto de entrada)'],
    reglas: [
      'Cada servicio es dueño de su base: nadie consulta la base de otro.',
      'La comunicación es por contratos (API o eventos) versionados.',
      'Todo puede fallar en la red: timeouts, reintentos y respuestas parciales son parte del diseño.'
    ],
    flujo: 'Petición → gateway → servicio correspondiente; si necesita datos de otro, lo llama por red o escucha sus eventos.',
    cuandoSi: ['Varios equipos que necesitan desplegar sin coordinarse', 'Partes con necesidades de escala muy distintas'],
    cuandoNo: [
      'Casi siempre al empezar: una persona o un equipo chico paga toda la complejidad sin recibir los beneficios',
      'Cuando los límites entre áreas todavía no están claros: primero un monolito modular'
    ],
    costo: 'Muy alto: despliegues, red, monitoreo, consistencia de datos entre servicios.',
    complejidad: 5,
    tipos: ['api', 'otra'],
    diagrama: 'flowchart LR\n  C[Cliente] --> G[Gateway]\n  G --> S1[Servicio catálogo]\n  G --> S2[Servicio pagos]\n  S1 --> D1[(Base catálogo)]\n  S2 --> D2[(Base pagos)]\n  S2 -- evento --> S1'
  },
  {
    id: 'serverless',
    nombre: 'Serverless (funciones)',
    resumen: 'Funciones sueltas que se ejecutan bajo demanda en la nube; no hay un servidor que administrar.',
    como: 'Cada endpoint o tarea es una función que la plataforma (Vercel, AWS Lambda, Cloudflare) ejecuta cuando llega una petición o un evento.',
    carpetas: ['api/ o functions/ (una función por endpoint)', 'lib/ (código compartido)'],
    reglas: [
      'Cada función es corta y sin estado: lo que deba persistir va a una base o almacenamiento.',
      'El código compartido va en lib/, no se copia entre funciones.',
      'Cuidar el arranque en frío: pocas dependencias por función.'
    ],
    flujo: 'Petición → la plataforma levanta la función → la función responde y se apaga.',
    cuandoSi: ['Tráfico irregular o bajo', 'Integraciones y tareas puntuales (webhooks, formularios)', 'Desplegar sin administrar servidores'],
    cuandoNo: ['Procesos largos o conexiones permanentes (WebSockets, colas propias)', 'Cuando quieres aprender cómo funciona un servidor por dentro'],
    costo: 'Medio: depende de la plataforma; probar en local y depurar es más difícil.',
    complejidad: 2,
    tipos: ['api', 'otra'],
    diagrama: 'flowchart LR\n  C[Cliente] --> P[Plataforma]\n  P --> F1[Función productos]\n  P --> F2[Función pedidos]\n  F1 --> DB[(Base de datos)]\n  F2 --> DB'
  },
  {
    id: 'eventos',
    nombre: 'Orientada a eventos',
    resumen: 'Las partes no se llaman entre sí: publican eventos («pedido creado») y quien le interesa reacciona.',
    como: 'Un bus o cola de mensajes reparte los eventos. Quien publica no sabe quién escucha, así que se pueden sumar reacciones nuevas sin tocar el código original.',
    carpetas: ['events/ (definición de eventos)', 'publishers/', 'handlers/ (quién reacciona a qué)', 'infra/ (bus o cola)'],
    reglas: [
      'Un evento describe algo que ya pasó, en pasado: «PedidoCreado».',
      'Quien publica no espera respuesta ni conoce a quien escucha.',
      'Cada handler debe tolerar recibir el mismo evento dos veces (idempotencia).'
    ],
    flujo: 'Acción → se publica el evento → el bus lo entrega → cada handler interesado reacciona (enviar mail, descontar stock…).',
    cuandoSi: ['Muchas reacciones a un mismo hecho', 'Integrar sistemas que no deben depender entre sí', 'Tareas en segundo plano'],
    cuandoNo: ['Flujos que necesitan una respuesta inmediata y simple', 'Proyectos chicos: depurar un flujo repartido en eventos es más difícil'],
    costo: 'Alto: el flujo ya no se lee de arriba a abajo; hace falta infraestructura de mensajes.',
    complejidad: 4,
    tipos: ['api', 'otra'],
    diagrama: 'flowchart LR\n  P[Pedidos] -- PedidoCreado --> B((Bus de eventos))\n  B --> H1[Enviar mail]\n  B --> H2[Descontar stock]'
  }
];

export function getArchitecture(id: string | undefined): Architecture | undefined {
  return ARCHITECTURES.find((a) => a.id === id);
}

/** Tipo de aplicación según el perfil curado, si se conoce. */
export function appKindForProfile(profileId: string | undefined): AppKind | undefined {
  switch (profileId) {
    case 'web-basica':
    case 'react-vite':
      return 'frontend';
    case 'django':
      return 'web-servidor';
    case 'node-express':
    case 'python-fastapi':
      return 'api';
    default:
      return undefined;
  }
}

export interface ArchAnswers {
  tipo: AppKind;
  equipo: 'solo' | 'pequeno' | 'varios';
  /** ¿Pocas áreas del negocio o varias que crecen por separado? */
  areas: 'pocas' | 'varias';
  /** Aprender lo fundamental o practicar diseño desacoplado. */
  objetivo: 'fundamentos' | 'diseno';
}

export interface ArchRecommendation {
  recomendada: ArchId;
  razones: string[];
  alternativas: ArchId[];
}

/**
 * Recomienda una arquitectura con reglas explícitas, sin LLM. Empieza por lo
 * más simple que resuelve el caso: la complejidad se agrega cuando hace
 * falta, no por adelantado.
 */
export function recommendArchitecture(a: ArchAnswers): ArchRecommendation {
  if (a.tipo === 'frontend') {
    return {
      recomendada: 'componentes',
      razones: ['Es una interfaz en el navegador: se organiza por componentes y funcionalidades.'],
      alternativas: []
    };
  }
  if (a.tipo === 'web-servidor') {
    return a.areas === 'varias'
      ? {
          recomendada: 'modular',
          razones: [
            'Las páginas se arman en el servidor, y hay varias áreas que crecen por separado.',
            'Cada módulo puede seguir MVC por dentro.'
          ],
          alternativas: ['mvc', 'capas']
        }
      : {
          recomendada: 'mvc',
          razones: ['Las páginas se arman en el servidor: MVC es lo que traen Django, Rails o Laravel.'],
          alternativas: ['capas', 'modular']
        };
  }
  if (a.equipo === 'varios' && a.areas === 'varias') {
    return {
      recomendada: 'microservicios',
      razones: [
        'Varios equipos y varias áreas: cada equipo puede desplegar su parte sin coordinarse con los demás.',
        'Aun así, empezar como monolito modular y separar después es lo más seguro.'
      ],
      alternativas: ['modular', 'hexagonal']
    };
  }
  if (a.objetivo === 'diseno') {
    return {
      recomendada: 'hexagonal',
      razones: [
        'Quieres practicar diseño: la hexagonal enseña a separar el negocio de la tecnología.',
        a.areas === 'varias'
          ? 'Con varias áreas, cada una puede ser un módulo con su propio hexágono.'
          : 'Con pocas áreas, el costo extra de archivos es manejable.'
      ],
      alternativas: ['clean', 'modular', 'capas']
    };
  }
  if (a.areas === 'varias') {
    return {
      recomendada: 'modular',
      razones: [
        'Hay varias áreas que crecen por separado: agruparlas por módulo evita services/ gigantes.',
        'Sigue siendo una sola aplicación: se despliega y depura fácil.'
      ],
      alternativas: ['capas', 'hexagonal', 'microservicios']
    };
  }
  return {
    recomendada: 'capas',
    razones: [
      'Pocas áreas y foco en los fundamentos: lo más simple que separa responsabilidades.',
      'Si el proyecto crece, se pasa a monolito modular sin reescribir todo.'
    ],
    alternativas: ['modular', 'hexagonal', 'serverless']
  };
}

/** Explicación en Markdown de una arquitectura (para el panel). */
export function explainArchitecture(arch: Architecture, razones: string[] = []): string {
  const out = [
    `# ${arch.nombre}`,
    '',
    `> ${arch.resumen}`,
    ''
  ];
  if (razones.length) {
    out.push('## Por qué para tu proyecto', ...razones.map((r) => `- ${r}`), '');
  }
  out.push(
    '## Cómo se organiza',
    arch.como,
    '',
    '## Estructura orientativa',
    ...arch.carpetas.map((c) => `- \`${c}\``),
    '',
    '## Reglas que vas a respetar',
    ...arch.reglas.map((r) => `- ${r}`),
    '',
    '## Recorrido de una petición',
    arch.flujo,
    '',
    '## Cuándo sí',
    ...arch.cuandoSi.map((c) => `- ${c}`),
    '',
    '## Cuándo no',
    ...arch.cuandoNo.map((c) => `- ${c}`),
    '',
    '## Lo que se paga',
    arch.costo,
    '',
    `Complejidad: ${'●'.repeat(arch.complejidad)}${'○'.repeat(5 - arch.complejidad)}`
  );
  return out.join('\n');
}

/**
 * Registro de decisión de arquitectura (ADR) para docs/ARQUITECTURA.md:
 * contexto, decisión, alternativas y consecuencias. Escribir por qué se
 * eligió algo es parte de diseñar.
 */
export function architectureDoc(
  arch: Architecture,
  ctx: { prompt?: string; stack?: string; razones: string[]; alternativas: ArchId[]; fecha: string }
): string {
  const alts = ctx.alternativas.map(getArchitecture).filter((x): x is Architecture => !!x);
  return [
    `# Arquitectura: ${arch.nombre}`,
    '',
    `*Registro de decisión · ${ctx.fecha} · generado por AutoCompleteHelp; edítalo si la decisión cambia.*`,
    '',
    '## Contexto',
    ctx.prompt ? `Proyecto: ${ctx.prompt}` : '',
    ctx.stack ? `Stack: ${ctx.stack}` : '',
    '',
    '## Decisión',
    `Usamos **${arch.nombre}**: ${arch.resumen}`,
    '',
    ...(ctx.razones.length ? ['## Por qué', ...ctx.razones.map((r) => `- ${r}`), ''] : []),
    '## Alternativas consideradas',
    ...(alts.length
      ? alts.map((a) => `- **${a.nombre}**: convendría ${a.cuandoSi[0].charAt(0).toLowerCase()}${a.cuandoSi[0].slice(1)}.`)
      : ['- Ninguna relevante para este tipo de aplicación.']),
    '',
    '## Consecuencias',
    `- Lo que se gana: ${arch.cuandoSi.join('; ').toLowerCase()}.`,
    `- Lo que se paga: ${arch.costo}`,
    `- Cuándo revisar esta decisión: ${arch.cuandoNo[0].charAt(0).toLowerCase()}${arch.cuandoNo[0].slice(1)}.`,
    '',
    '## Estructura',
    ...arch.carpetas.map((c) => `- \`${c}\``),
    '',
    '## Reglas',
    ...arch.reglas.map((r) => `- ${r}`),
    '',
    '## Recorrido de una petición',
    arch.flujo,
    '',
    '## Diagrama',
    '```mermaid',
    arch.diagrama,
    '```',
    ''
  ]
    .filter((line, i, all) => line !== '' || all[i - 1] !== '')
    .join('\n');
}
