import type { ArchId } from './architectures';

/**
 * Catálogo de «Quiero aprender»: temas curados, cada uno con una semilla
 * probada (stack, arquitectura, ideas de proyecto y advertencias propias del
 * tema). Son datos, no IA: dan consistencia al proyecto que diseña el modelo y
 * sirven de recomendación sin conexión. Cualquier tema fuera del catálogo
 * también funciona.
 */

export type TopicKind = 'fundamentos' | 'lenguaje' | 'web' | 'creativo' | 'arquitectura' | 'nube' | 'ia' | 'automatizacion' | 'movil' | 'practicas';

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
  { tipo: 'fundamentos', titulo: 'Fundamentos: programación, lógica y matemáticas' },
  { tipo: 'lenguaje', titulo: 'Lenguajes' },
  { tipo: 'web', titulo: 'Web y backend' },
  { tipo: 'creativo', titulo: 'Diseño, animación y creative coding' },
  { tipo: 'arquitectura', titulo: 'Arquitectura y patrones' },
  { tipo: 'nube', titulo: 'Nube y DevOps' },
  { tipo: 'ia', titulo: 'Inteligencia artificial y datos' },
  { tipo: 'automatizacion', titulo: 'Automatización' },
  { tipo: 'movil', titulo: 'Móvil y videojuegos' },
  { tipo: 'practicas', titulo: 'Buenas prácticas y herramientas' }
];

/**
 * Cómo se estudia diseño y animación, para todos los temas creativos: cada
 * idea de diseño se aprende escribiéndola, mirando el resultado y variándola.
 */
const CREATIVO =
  'Cómo estudiar: observar una referencia, reproducirla escribiendo, variar un parámetro por vez y después crear una pieza propia. Teoría escrita (apuntes) antes de cada principio: timing y easing, composición, color. La matemática y la configuración van en funciones puras con tests; lo visual se comprueba en el navegador con Vite. Animar transform y opacity, respetar prefers-reduced-motion, y semilla fija en lo generativo para poder repetir un resultado.';

/** Advertencias comunes de los temas de nube: costos y credenciales. */
const NUBE =
  'Costos: usar la capa gratuita y crear una alerta de presupuesto en el primer paso; el último paso destruye todo lo creado. Credenciales con el CLI (perfil o SSO), nunca en el código. La infraestructura se escribe como código, comentada.';

/** Cómo se estudian los fundamentos: teoría escrita y ejercicios con tests. */
const FUNDAMENTOS =
  'Se aprende con teoría y ejercicios: cada tema tiene un apunte que se escribe, tests que definen qué hace cada función y un ejercicio que resuelve la persona (funciones puras, en JavaScript con Vitest, que corre en el navegador). Ejemplos chicos calculados a mano; los bordes (0, vacío, negativos) siempre tienen su test.';

export const LEARN_TOPICS: LearnTopic[] = [
  // Fundamentos
  {
    id: 'fundamentos-programacion', nombre: 'Fundamentos de programación', tipo: 'fundamentos',
    palabras: ['fundamentos', 'fundamentos de programacion', 'variables', 'condicionales', 'bucles', 'pensamiento computacional'],
    stack: 'JavaScript (ES modules) + Vitest', arquitectura: 'capas',
    ideas: ['ejercicios de variables, condicionales y bucles', 'calculadora de notas de un curso', 'juego de adivinar el número'],
    notas: FUNDAMENTOS
  },
  {
    id: 'logica', nombre: 'Lógica para programar', tipo: 'fundamentos',
    palabras: ['logica', 'logica de programacion', 'logica proposicional', 'booleanos', 'tablas de verdad', 'de morgan'],
    stack: 'JavaScript (ES modules) + Vitest', arquitectura: 'capas',
    ideas: ['validador de reglas de acceso', 'calendario con años bisiestos', 'evaluador de tablas de verdad'],
    notas: FUNDAMENTOS
  },
  {
    id: 'matematicas', nombre: 'Matemáticas para programar', tipo: 'fundamentos',
    palabras: ['matematicas', 'matematica', 'aritmetica', 'numeros primos', 'porcentajes', 'matematica discreta'],
    stack: 'JavaScript (ES modules) + Vitest', arquitectura: 'capas',
    ideas: ['calculadora de descuentos y cuotas', 'explorador de números primos', 'sucesiones y gráficos simples'],
    notas: FUNDAMENTOS + ' Los decimales se comparan con toBeCloseTo.'
  },
  // Lenguajes
  {
    id: 'typescript', nombre: 'TypeScript', tipo: 'lenguaje',
    palabras: ['typescript', 'ts', 'tipos', 'tipado'],
    stack: 'TypeScript 5 + Node.js 22 LTS + Vitest', arquitectura: 'capas',
    ideas: ['gestor de gastos en la terminal', 'API de tareas con validación de tipos', 'conversor de unidades con tests'],
    notas: 'Compilar con tsc y mostrar cómo los tipos atrapan errores antes de ejecutar.'
  },
  {
    id: 'javascript', nombre: 'JavaScript desde cero', tipo: 'lenguaje',
    palabras: ['javascript', 'js', 'programar desde cero', 'empezar a programar'],
    stack: 'HTML + CSS + JavaScript (ES modules) + Vitest', arquitectura: 'componentes',
    ideas: ['lista de compras en el navegador', 'juego de adivinar el número', 'calculadora de propinas'],
    notas: 'Empezar sin frameworks; servir con un servidor local porque los ES modules no cargan con doble clic.'
  },
  {
    id: 'python', nombre: 'Python', tipo: 'lenguaje',
    palabras: ['python', 'py'],
    stack: 'Python 3.13 + pytest', arquitectura: 'capas',
    ideas: ['agenda de contactos en la terminal', 'analizador de gastos desde un CSV', 'juego de preguntas'],
    notas: 'Usar entorno virtual (venv) desde el primer paso y explicar por qué.'
  },
  {
    id: 'go', nombre: 'Go', tipo: 'lenguaje',
    palabras: ['go', 'golang'],
    stack: 'Go (estable) + paquete testing', arquitectura: 'capas',
    ideas: ['acortador de URLs con su API', 'monitor de sitios web concurrente', 'buscador de texto en archivos'],
    notas: 'Mostrar goroutines y canales en un caso real; los tests usan el paquete testing incluido.'
  },
  {
    id: 'rust', nombre: 'Rust', tipo: 'lenguaje',
    palabras: ['rust', 'cargo'],
    stack: 'Rust (estable) + cargo test', arquitectura: 'capas',
    ideas: ['gestor de tareas en la terminal', 'contador de palabras muy rápido', 'servidor web con Axum'],
    notas: 'Ownership y préstamos explicados a partir de errores reales del compilador.'
  },
  {
    id: 'java', nombre: 'Java con Spring Boot', tipo: 'lenguaje',
    palabras: ['java', 'spring', 'spring boot'],
    stack: 'Java 21 + Spring Boot 3 + JUnit 5', arquitectura: 'capas',
    ideas: ['API de una biblioteca con préstamos', 'sistema de turnos', 'inventario de un comercio']
  },
  {
    id: 'csharp', nombre: 'C# y .NET', tipo: 'lenguaje',
    palabras: ['c#', 'csharp', '.net', 'dotnet', 'asp.net'],
    stack: 'C# + .NET (LTS) + ASP.NET Core + xUnit', arquitectura: 'capas',
    ideas: ['API de reservas con ASP.NET Core', 'gestor de gastos de consola', 'lista de tareas con Blazor']
  },
  // Web y backend
  {
    id: 'react', nombre: 'React', tipo: 'web',
    palabras: ['react', 'jsx', 'hooks'],
    stack: 'React 19 + Vite + TypeScript + Vitest + Testing Library', arquitectura: 'componentes',
    ideas: ['tablero de tareas con filtros', 'buscador de películas con una API pública', 'carrito de compras']
  },
  {
    id: 'nextjs', nombre: 'Next.js', tipo: 'web',
    palabras: ['next', 'nextjs', 'next.js'],
    stack: 'Next.js (App Router) + TypeScript + Vitest + Playwright', arquitectura: 'componentes',
    ideas: ['blog con páginas generadas', 'tienda con carrito y checkout simulado', 'panel con autenticación']
  },
  {
    id: 'node-api', nombre: 'APIs con Node.js', tipo: 'web',
    palabras: ['node', 'nodejs', 'express', 'api rest', 'backend'],
    stack: 'Node.js 22 + Express 5 + TypeScript + PostgreSQL + Vitest + Supertest', arquitectura: 'capas',
    ideas: ['API de reservas', 'API de una biblioteca con préstamos', 'acortador de URLs'],
    notas: 'La base de datos corre en Docker para no instalar PostgreSQL a mano.'
  },
  {
    id: 'fastapi', nombre: 'APIs con Python (FastAPI)', tipo: 'web',
    palabras: ['fastapi', 'api con python', 'apis con python'],
    stack: 'Python 3.13 + FastAPI + SQLite + pytest', arquitectura: 'capas',
    ideas: ['API de recetas con búsqueda', 'gestor de gastos con API', 'API de encuestas']
  },
  {
    id: 'graphql', nombre: 'GraphQL', tipo: 'web',
    palabras: ['graphql', 'apollo'],
    stack: 'Node.js + Apollo Server + TypeScript + Vitest', arquitectura: 'capas',
    ideas: ['API de una red de libros y reseñas', 'catálogo de películas con relaciones']
  },
  {
    id: 'threejs', nombre: 'Three.js (3D en el navegador)', tipo: 'web',
    palabras: ['three', 'threejs', 'three.js', '3d', 'webgl'],
    stack: 'Three.js + Vite + TypeScript + Vitest', arquitectura: 'componentes',
    ideas: ['sistema solar animado', 'galería 3D que se recorre con el mouse', 'mini juego de esquivar obstáculos'],
    notas: 'Separar la lógica (testeable sin navegador) del render; Vite sirve los módulos.'
  },
  // Diseño, animación y creative coding
  {
    id: 'gsap', nombre: 'Animaciones con GSAP', tipo: 'creativo',
    palabras: ['gsap', 'greensock', 'scrolltrigger', 'timeline', 'animaciones web', 'animar una web'],
    stack: 'GSAP 3 + Vite + TypeScript + Vitest', arquitectura: 'componentes',
    ideas: ['tarjetas que entran en escena con una timeline', 'landing que se anima al hacer scroll (ScrollTrigger)', 'menú con transiciones encadenadas'],
    notas: CREATIVO + ' GSAP: tweens, timelines, easing, stagger y ScrollTrigger; la configuración de cada animación (duraciones, retrasos, curvas) en un módulo puro y testeable.'
  },
  {
    id: 'animacion-web', nombre: 'Animación web con CSS y Web Animations API', tipo: 'creativo',
    palabras: ['animacion css', 'animaciones css', 'keyframes', 'transiciones', 'web animations api', 'waapi'],
    stack: 'HTML + CSS + TypeScript + Vite + Vitest', arquitectura: 'componentes',
    ideas: ['botones y tarjetas con microinteracciones', 'loader animado solo con CSS', 'galería con transiciones de vista (View Transitions)'],
    notas: CREATIVO + ' Primero transiciones y keyframes en CSS, después la Web Animations API para controlarlas desde código.'
  },
  {
    id: 'motion-design', nombre: 'Principios de animación y motion design', tipo: 'creativo',
    palabras: ['motion design', 'principios de animacion', '12 principios', 'easing', 'timing', 'animacion'],
    stack: 'GSAP 3 + Vite + TypeScript', arquitectura: 'componentes',
    ideas: ['los 12 principios de la animación, uno por escena', 'pelota que rebota con squash and stretch', 'biblioteca de curvas de easing comparadas'],
    notas: CREATIVO + ' Cada principio (timing, anticipación, seguimiento, arcos, exageración…) tiene su apunte y su escena para variar.'
  },
  {
    id: 'composicion-diseno', nombre: 'Composición y diseño con JavaScript', tipo: 'creativo',
    palabras: ['composicion', 'diseno', 'diseno grafico', 'grilla', 'retícula', 'reticula', 'tipografia', 'teoria del color', 'paletas', 'layout'],
    stack: 'Canvas 2D + TypeScript + Vite + Vitest', arquitectura: 'componentes',
    ideas: ['generador de pósters con grilla modular', 'paletas de color armónicas (HSL y OKLCH)', 'tipografía cinética en canvas'],
    notas: CREATIVO + ' Jerarquía, contraste, ritmo, proporción y regla de tercios como funciones puras (dónde va cada elemento) que se testean; el canvas solo dibuja lo que calculan.'
  },
  {
    id: 'creative-coding', nombre: 'Creative coding y arte generativo (p5.js)', tipo: 'creativo',
    palabras: ['creative coding', 'arte generativo', 'generativo', 'p5', 'p5.js', 'processing', 'ruido perlin', 'particulas'],
    stack: 'p5.js + Vite + TypeScript + Vitest', arquitectura: 'componentes',
    ideas: ['flow field con ruido de Perlin', 'sistema de partículas que reacciona al mouse', 'patrones de Truchet exportables como imagen'],
    notas: CREATIVO + ' Semilla fija (randomSeed y noiseSeed) para reproducir cada obra; reglas del sistema separadas del dibujo.'
  },
  {
    id: 'shaders-glsl', nombre: 'Shaders con GLSL (WebGL)', tipo: 'creativo',
    palabras: ['shader', 'shaders', 'glsl', 'fragment shader', 'vertex shader', 'webgl2', 'sdf', 'shadertoy'],
    stack: 'WebGL2 + GLSL ES 3.0 + TypeScript + Vite + Vitest', arquitectura: 'componentes',
    ideas: ['tu primer shader: un atardecer animado', 'formas con funciones de distancia (SDF)', 'patrones con ruido que se mueven en el tiempo'],
    notas: CREATIVO + ' Un shader corre una vez por píxel: coordenadas normalizadas, mix, smoothstep, fract, uniforms (tiempo, resolución, mouse). Los .frag y .vert van en archivos propios, comentados como cualquier código; para depurar, mostrar el valor como color. La matemática se replica en TypeScript y se testea.'
  },
  {
    id: 'shaders-threejs', nombre: 'Shaders en Three.js (ShaderMaterial)', tipo: 'creativo',
    palabras: ['shadermaterial', 'shaders three', 'shaders en three', 'vertex displacement', 'materiales personalizados'],
    stack: 'Three.js + GLSL + Vite + TypeScript + Vitest', arquitectura: 'componentes',
    ideas: ['esfera que ondula con un vertex shader', 'material holográfico con fresnel', 'transición entre dos imágenes con ruido'],
    notas: CREATIVO + ' Primero la escena de Three.js, después el ShaderMaterial: qué calcula el vertex shader y qué el fragment shader, y cómo pasan los uniforms y varyings.'
  },
  {
    id: 'r3f', nombre: 'React Three Fiber', tipo: 'creativo',
    palabras: ['react three fiber', 'r3f', 'drei', 'three con react'],
    stack: 'React 19 + @react-three/fiber + @react-three/drei + Vite + TypeScript', arquitectura: 'componentes',
    ideas: ['portfolio 3D con cámara que sigue el scroll', 'configurador de producto con materiales', 'escena interactiva con física'],
    notas: CREATIVO + ' La escena como componentes de React; useFrame para animar sin re-renderizar React en cada cuadro.'
  },
  {
    id: 'webgpu', nombre: 'WebGPU y WGSL', tipo: 'creativo',
    palabras: ['webgpu', 'wgsl', 'compute shader', 'compute shaders'],
    stack: 'WebGPU + WGSL + TypeScript + Vite', arquitectura: 'componentes',
    ideas: ['triángulo y degradado con WebGPU', 'simulación de partículas con compute shaders', 'juego de la vida en la GPU'],
    notas: CREATIVO + ' Comprobar soporte (navigator.gpu) y explicar qué navegadores lo tienen; adaptador, dispositivo, pipeline y buffers, cada uno en su paso.'
  },
  {
    id: 'shaders-capas', nombre: 'Efectos WebGPU por capas (librería Shaders)', tipo: 'creativo',
    palabras: ['shaders.com', 'shader effects', 'libreria shaders', 'efectos webgpu', 'shaders webgpu', 'flowinggradient', 'fractalnoise', 'createshader', 'efectos de shader', 'fondos animados'],
    stack: 'Shaders 4.0.4 (WebGPU) + Vite + TypeScript + Vitest', arquitectura: 'componentes',
    ideas: ['un fondo vivo por capas para una landing', 'hero con degradado líquido que sigue al mouse', 'transición entre secciones con un efecto de la librería'],
    notas: CREATIVO + ' Librería «shaders» (npm, Shader Effects, Inc.), MIT desde la 4: fijar "shaders": "4.0.4" (las 2.x y 3.x tenían licencia propietaria y la API cambia rápido). Es SOLO WebGPU, sin respaldo WebGL: sin soporte el lienzo queda transparente y no avisa, así que primero getWebGPUSupport() (de "shaders/js") y siempre un degradado de CSS debajo del lienzo. En JS vanilla: createShader(canvas, { components: [{ type, id, props }] }, { disableTelemetry: true, onError }); la escena (lista de capas) va en un módulo puro con tests. Props comunes de capa: blendMode, opacity, visible, maskSource (id de otra capa) y maskType (alpha, luminance…). update(id, props) cambia uniforms sin recompilar; destroy() al salir. Animar sin código: { type: "auto-animate", … } o { type: "mouse-position", smoothing } en una prop. Efecto propio: defineShader + wgsl de "shaders/std" (uv, aspect y las props existen en el cuerpo). prefers-reduced-motion no lo maneja la librería: speed y twinkle en 0 y sin capas de cursor. Funciona en Chrome/Edge 113+, Safari 26 y Firefox en Windows, solo en https o localhost. El editor visual y los presets de shaders.com no son código abierto: no los uses en el plan.'
  },
  {
    id: 'svg-animacion', nombre: 'SVG e ilustración animada', tipo: 'creativo',
    palabras: ['svg', 'animar svg', 'ilustracion animada', 'path', 'morphing', 'trazos'],
    stack: 'SVG + GSAP 3 + Vite + TypeScript', arquitectura: 'componentes',
    ideas: ['logo que se dibuja trazo a trazo', 'ícono que cambia de forma (morphing)', 'ilustración con capas en parallax'],
    notas: CREATIVO + ' Leer un SVG como código: viewBox, path y sus comandos; animar stroke-dasharray y atributos con GSAP.'
  },
  {
    id: 'motion-react', nombre: 'Animaciones en React con Motion', tipo: 'creativo',
    palabras: ['framer motion', 'motion react', 'animaciones react', 'animatepresence'],
    stack: 'React 19 + Motion + Vite + TypeScript + Vitest', arquitectura: 'componentes',
    ideas: ['lista que reordena con animación de layout', 'modal con entrada y salida (AnimatePresence)', 'gestos de arrastrar con resorte'],
    notas: CREATIVO + ' Animaciones declarativas: estados initial, animate y exit; resortes (spring) en vez de duraciones fijas.'
  },
  // Arquitectura y patrones
  {
    id: 'patrones-diseno', nombre: 'Patrones de diseño', tipo: 'arquitectura',
    palabras: ['patrones de diseno', 'patrones', 'design patterns', 'gof', 'singleton', 'factory', 'strategy', 'observer'],
    stack: 'TypeScript + Vitest', arquitectura: 'capas',
    ideas: ['sistema de pagos con Strategy y Factory', 'notificaciones con Observer', 'editor con deshacer (Command)'],
    notas: 'Cada patrón aparece cuando el código lo necesita: primero el problema sin el patrón, después el cambio, y los mismos tests siguen pasando.'
  },
  {
    id: 'patrones-api', nombre: 'Patrones de API', tipo: 'arquitectura',
    palabras: ['patrones de api', 'patrones api', 'diseno de apis', 'diseno de api', 'api design', 'rest', 'idempotencia', 'paginacion', 'versionado', 'rate limiting', 'webhooks', 'openapi', 'api gateway'],
    stack: 'Node.js 22 + Express 5 + TypeScript + OpenAPI + Vitest + Supertest', arquitectura: 'capas',
    ideas: [
      'API de pedidos con paginación, filtros, versionado e idempotencia',
      'API pública con OpenAPI, rate limiting y errores estándar (Problem Details, RFC 9457)',
      'webhooks firmados con reintentos y un gateway que agrega dos servicios (BFF)'
    ],
    notas: 'Cada patrón resuelve un problema que primero se ve: listas enormes (paginación por cursor), reintentos que duplican cobros (clave de idempotencia), clientes que se rompen al cambiar la API (versionado), abuso (rate limiting), errores inconsistentes (Problem Details), avisos entre sistemas (webhooks con firma). Cada uno con su test.'
  },
  {
    id: 'solid', nombre: 'Principios SOLID y código limpio', tipo: 'arquitectura',
    palabras: ['solid', 'codigo limpio', 'clean code', 'refactor', 'refactorizar', 'refactorizacion'],
    stack: 'TypeScript + Vitest', arquitectura: 'capas',
    ideas: ['refactorizar un sistema de facturación enredado', 'calculadora de envíos extensible'],
    notas: 'Partir de código que funciona pero está mal organizado; cada principio es un refactor con tests que lo protegen.'
  },
  {
    id: 'hexagonal', nombre: 'Arquitectura hexagonal', tipo: 'arquitectura',
    palabras: ['hexagonal', 'puertos y adaptadores', 'ports and adapters'],
    stack: 'TypeScript + Node.js 22 + Express 5 + Vitest', arquitectura: 'hexagonal',
    ideas: ['sistema de pedidos con pagos simulados', 'reservas de turnos médicos', 'billetera con transferencias'],
    notas: 'Demostrar el valor cambiando un adaptador (de memoria a base de datos) sin tocar el dominio, con los tests como prueba.'
  },
  {
    id: 'clean', nombre: 'Clean Architecture', tipo: 'arquitectura',
    palabras: ['clean architecture', 'arquitectura limpia', 'clean'],
    stack: 'TypeScript + Node.js 22 + Vitest', arquitectura: 'clean',
    ideas: ['gestor de suscripciones', 'sistema de inscripciones a cursos']
  },
  {
    id: 'ddd', nombre: 'Diseño guiado por el dominio (DDD)', tipo: 'arquitectura',
    palabras: ['ddd', 'domain driven design', 'diseno guiado por el dominio'],
    stack: 'TypeScript + Node.js 22 + Vitest', arquitectura: 'hexagonal',
    ideas: ['sistema de reservas de hotel', 'carrito y pedidos de una tienda'],
    notas: 'Lenguaje ubicuo, entidades, objetos de valor y agregados, cada uno con un test que expresa una regla del negocio.'
  },
  {
    id: 'microservicios', nombre: 'Microservicios', tipo: 'arquitectura',
    palabras: ['microservicios', 'microservices'],
    stack: 'Node.js 22 + Express 5 + Docker Compose + RabbitMQ', arquitectura: 'microservicios',
    ideas: ['tienda con servicios de catálogo y pedidos', 'notificaciones que reaccionan a eventos'],
    notas: 'Empezar mostrando el monolito y por qué se separa; Docker Compose levanta los servicios.'
  },
  {
    id: 'eventos', nombre: 'Arquitectura orientada a eventos', tipo: 'arquitectura',
    palabras: ['eventos', 'event driven', 'colas', 'mensajeria', 'kafka', 'rabbitmq'],
    stack: 'Node.js + TypeScript + RabbitMQ (en Docker) + Vitest', arquitectura: 'eventos',
    ideas: ['pedidos que disparan mail y descuento de stock', 'procesamiento de imágenes en segundo plano']
  },
  // Nube y DevOps
  {
    id: 'aws', nombre: 'AWS: configurar y desplegar', tipo: 'nube',
    palabras: ['aws', 'amazon web services', 's3', 'ec2', 'cloudfront'],
    stack: 'AWS (capa gratuita) + Terraform + AWS CLI', arquitectura: 'serverless',
    ideas: ['sitio web estático en S3 + CloudFront', 'API serverless con Lambda y API Gateway', 'tarea programada con EventBridge'],
    notas: NUBE
  },
  {
    id: 'azure', nombre: 'Azure: configurar y desplegar', tipo: 'nube',
    palabras: ['azure', 'microsoft azure', 'app service', 'azure functions'],
    stack: 'Azure (cuenta gratuita) + Bicep + Azure CLI', arquitectura: 'serverless',
    ideas: ['web en Azure App Service', 'API con Azure Functions', 'sitio estático en Static Web Apps'],
    notas: NUBE + ' En Azure, todo va en un grupo de recursos: borrarlo (az group delete) limpia todo.'
  },
  {
    id: 'gcp', nombre: 'Google Cloud: configurar y desplegar', tipo: 'nube',
    palabras: ['gcp', 'google cloud', 'cloud run'],
    stack: 'Google Cloud (capa gratuita) + Terraform + gcloud', arquitectura: 'serverless',
    ideas: ['API en Cloud Run', 'función que procesa archivos subidos a Cloud Storage'],
    notas: NUBE
  },
  {
    id: 'terraform', nombre: 'Infraestructura como código (Terraform)', tipo: 'nube',
    palabras: ['terraform', 'infraestructura como codigo', 'iac'],
    stack: 'Terraform + proveedor de Docker (sin nube, sin costos)', arquitectura: 'capas',
    ideas: ['levantar una web y su base de datos con Terraform en tu PC', 'módulos reutilizables para varios entornos'],
    notas: 'Aprender plan, apply y destroy contra Docker local: los mismos conceptos que en la nube, gratis.'
  },
  {
    id: 'docker', nombre: 'Docker', tipo: 'nube',
    palabras: ['docker', 'contenedores', 'compose', 'dockerfile'],
    stack: 'Docker + Docker Compose + Node.js 22 + PostgreSQL', arquitectura: 'capas',
    ideas: ['dockerizar una API con su base de datos', 'entorno de desarrollo reproducible']
  },
  {
    id: 'kubernetes', nombre: 'Kubernetes', tipo: 'nube',
    palabras: ['kubernetes', 'k8s', 'kubectl'],
    stack: 'Kubernetes local (kind o minikube) + kubectl + Docker', arquitectura: 'microservicios',
    ideas: ['desplegar una API con réplicas y un balanceador', 'actualizar sin cortes (rolling update)'],
    notas: 'Clúster local: sin costos. Cada manifiesto YAML se escribe comentado.'
  },
  {
    id: 'cicd', nombre: 'CI/CD con GitHub Actions', tipo: 'nube',
    palabras: ['ci cd', 'cicd', 'github actions', 'integracion continua', 'despliegue continuo', 'pipeline', 'pipelines'],
    stack: 'GitHub Actions + Node.js + Vitest', arquitectura: 'capas',
    ideas: ['tests y lint en cada pull request', 'publicar una web estática al hacer merge']
  },
  // Inteligencia artificial y datos
  {
    id: 'ml-entrenar', nombre: 'Entrenar un modelo de IA (machine learning)', tipo: 'ia',
    palabras: ['entrenar ia', 'entrenar una ia', 'entrenar un modelo', 'machine learning', 'aprendizaje automatico', 'ml', 'scikit-learn', 'sklearn', 'inteligencia artificial'],
    stack: 'Python 3.13 + scikit-learn + pandas + pytest', arquitectura: 'capas',
    ideas: ['clasificador de reseñas positivas y negativas', 'predecir precios de casas', 'detector de spam'],
    notas: 'Datos chicos que entrenan en CPU en minutos; entrenamiento y prueba separados; semilla fija; métricas explicadas; tests del preprocesamiento y de la predicción.'
  },
  {
    id: 'deep-learning', nombre: 'Redes neuronales (deep learning)', tipo: 'ia',
    palabras: ['redes neuronales', 'red neuronal', 'deep learning', 'pytorch', 'tensorflow', 'vision por computadora'],
    stack: 'Python 3.13 + PyTorch + pytest', arquitectura: 'capas',
    ideas: ['reconocer dígitos escritos a mano (MNIST)', 'clasificar prendas de ropa (Fashion-MNIST)'],
    notas: 'Modelos chicos que entrenan en CPU; GPU opcional. Tensores, capas, pérdida y épocas explicados con lo que se ve al entrenar.'
  },
  {
    id: 'llm-apps', nombre: 'Apps con LLMs (RAG y agentes)', tipo: 'ia',
    palabras: ['llm', 'llms', 'rag', 'agentes', 'agente', 'chatbot', 'embeddings', 'apps con ia'],
    stack: 'Python 3.13 + API de un LLM (Claude, OpenAI u Ollama local) + pytest', arquitectura: 'hexagonal',
    ideas: ['chat con tus apuntes (RAG)', 'agente que organiza tareas con herramientas', 'resumidor de PDFs'],
    notas: 'El LLM detrás de un puerto: los tests usan un modelo falso y no gastan tokens. API keys en variables de entorno; Ollama como opción gratuita.'
  },
  {
    id: 'analisis-datos', nombre: 'Análisis de datos con Python', tipo: 'ia',
    palabras: ['pandas', 'analisis de datos', 'data science', 'ciencia de datos', 'visualizacion'],
    stack: 'Python 3.13 + pandas + matplotlib + pytest', arquitectura: 'capas',
    ideas: ['tablero de tus gastos con gráficos', 'análisis de datos abiertos de tu ciudad']
  },
  {
    id: 'sql', nombre: 'SQL y bases de datos', tipo: 'ia',
    palabras: ['sql', 'postgres', 'postgresql', 'base de datos', 'bases de datos', 'mysql'],
    stack: 'PostgreSQL 17 + Python 3.13 + pytest', arquitectura: 'capas',
    ideas: ['base de datos de una biblioteca con consultas reales', 'reportes de ventas'],
    notas: 'PostgreSQL corre en Docker; cada consulta se comprueba con un test.'
  },
  // Automatización
  {
    id: 'automatizacion-python', nombre: 'Automatizaciones con Python', tipo: 'automatizacion',
    palabras: ['automatizar', 'automatizaciones', 'automatizacion', 'scripts', 'bot'],
    stack: 'Python 3.13 + pytest + requests + openpyxl', arquitectura: 'capas',
    ideas: ['ordenar archivos de la carpeta Descargas por tipo', 'reporte diario en Excel desde una API', 'renombrador masivo de fotos'],
    notas: 'Modo «simulación» antes de tocar archivos reales; programar la tarea con el programador del sistema.'
  },
  {
    id: 'scraping', nombre: 'Web scraping', tipo: 'automatizacion',
    palabras: ['scraping', 'scraper', 'web scraping'],
    stack: 'Python 3.13 + httpx + BeautifulSoup + pytest', arquitectura: 'capas',
    ideas: ['comparador de precios', 'monitor de ofertas de empleo'],
    notas: 'Respetar robots.txt y los términos de uso; los tests usan HTML guardado, sin pedir la web real.'
  },
  // Móvil y videojuegos
  {
    id: 'flutter', nombre: 'Apps móviles con Flutter', tipo: 'movil',
    palabras: ['flutter', 'dart', 'app movil', 'apps moviles', 'android', 'ios'],
    stack: 'Flutter (estable) + Dart + flutter_test', arquitectura: 'componentes',
    ideas: ['lista de hábitos con recordatorios', 'app de recetas con favoritos']
  },
  {
    id: 'unity', nombre: 'Videojuegos con Unity', tipo: 'movil',
    palabras: ['unity', 'videojuego', 'videojuegos', 'juegos'],
    stack: 'Unity (LTS) + C# + Unity Test Framework', arquitectura: 'componentes',
    ideas: ['plataformas 2D con un nivel', 'juego de esquivar con puntaje'],
    notas: 'Separar la lógica del juego (C# puro, testeable) de los componentes de Unity.'
  },
  // Buenas prácticas y herramientas
  {
    id: 'testing', nombre: 'Testing y TDD', tipo: 'practicas',
    palabras: ['tests', 'testing', 'tdd', 'pruebas', 'unit test'],
    stack: 'TypeScript + Vitest', arquitectura: 'capas',
    ideas: ['carrito de compras con descuentos, escrito test primero', 'validador de contraseñas'],
    notas: 'Cada paso de código va precedido de su test (rojo → verde → refactor).'
  },
  {
    id: 'git', nombre: 'Git y GitHub en equipo', tipo: 'practicas',
    palabras: ['git', 'github', 'ramas', 'pull request', 'control de versiones'],
    stack: 'Git + GitHub + un proyecto pequeño de práctica', arquitectura: 'capas',
    ideas: ['flujo de ramas con pull requests y revisión', 'resolver conflictos en una web compartida'],
    notas: 'Muchos pasos son comandos de git, cada uno explicado: qué cambia y cómo deshacerlo.'
  },
  {
    id: 'seguridad', nombre: 'Seguridad web (OWASP)', tipo: 'practicas',
    palabras: ['seguridad', 'owasp', 'vulnerabilidades', 'autenticacion', 'jwt'],
    stack: 'Node.js + Express 5 + TypeScript + Vitest', arquitectura: 'capas',
    ideas: ['login seguro con contraseñas hasheadas', 'API protegida contra inyección y XSS'],
    notas: 'Primero la vulnerabilidad en un entorno local propio, después la defensa y un test que la comprueba. Nunca contra sistemas ajenos.'
  },
  {
    id: 'algoritmos', nombre: 'Algoritmos y estructuras de datos', tipo: 'practicas',
    palabras: ['algoritmos', 'estructuras de datos', 'big o', 'recursion'],
    stack: 'Python 3.13 + pytest', arquitectura: 'capas',
    ideas: ['buscador de rutas en un mapa (grafos)', 'autocompletado con un trie', 'ordenamientos comparados']
  }
];
