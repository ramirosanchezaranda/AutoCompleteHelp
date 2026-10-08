import type { Lesson } from './lessons';

/**
 * Lecciones sin IA de diseño, animación y shaders. Igual que las demás: el
 * código, los apuntes de teoría y las explicaciones ya están escritos y
 * probados (tsc, Vitest, vite build y en el navegador), y se completan
 * escribiendo, línea por línea.
 */

const GSAP_GUIA = `## Qué vas a construir
Tres tarjetas que entran en escena una detrás de otra, con una timeline de GSAP. Al terminar, el botón Repetir vuelve a reproducir la entrada para estudiarla.

## Qué vas a aprender
- timing, easing y stagger: los principios detrás de cada número
- separar los números de la animación (funciones puras con tests) del código que anima
- tweens y timelines de GSAP
- accesibilidad: prefers-reduced-motion
- cómo estudiar animación: observar, reproducir, variar, crear

## Antes de empezar
- Node.js 22 LTS. Comprueba con \`node -v\`.
- \`npm install gsap && npm install -D vite typescript vitest\`: GSAP, el servidor de desarrollo, TypeScript y los tests.

## Cómo está organizado
Por componentes, mínimo: movimiento.ts calcula los números (testeable sin navegador), animar.ts es el único que conoce GSAP y main.ts conecta la página.

## Paso a paso
1. package.json, tsconfig.json e index.html: el proyecto y el contenido, que existe antes de animarse.
2. notas/01-principios.md (antes de la página) y src/movimiento.ts: timing, easing y stagger, primero como idea y después como números.
3. src/movimiento.test.ts: los números se prueban sin pantalla.
4. notas/02-timeline.md y src/animar.ts: los números se vuelven movimiento.
5. src/main.ts y npx vite: verlo, y cambiar un valor por vez.

## Tests
\`npx vitest run\` prueba el escalonado, el movimiento reducido y la duración total. Lo visual se comprueba en el navegador con \`npx vite\`.

## Docker
No hace falta: es una página estática.

## Cómo seguir
- Animar al hacer scroll con ScrollTrigger
- Probar otras curvas (back.out, elastic.out) y comparar
- Reproducir una animación que te guste de otra web`;

const SHADER_GUIA = `## Qué vas a construir
Un atardecer dibujado por la GPU: un cielo en degradado y un sol redondo que sube y baja despacio. Todo lo calcula un fragment shader, píxel por píxel.

## Qué vas a aprender
- qué es un shader y por qué corre una vez por píxel
- coordenadas normalizadas (uv) y colores como vec3
- mix, smoothstep y distance: las herramientas básicas
- uniforms: el tiempo y la resolución que manda TypeScript
- compilar, enlazar y dibujar con WebGL2
- cómo estudiar shaders: cambiar un número y mostrar valores como color

## Antes de empezar
- Node.js 22 LTS y un navegador con WebGL2 (Chrome, Firefox, Edge o Safari actuales).
- \`npm install -D vite typescript vitest\`.

## Cómo está organizado
Los shaders viven en sus propios archivos (.vert y .frag), comentados como cualquier código. color.ts replica en TypeScript la matemática del shader para testearla; webgl.ts compila y enlaza; main.ts dibuja en bucle.

## Paso a paso
1. package.json, tsconfig.json, vite-env.d.ts e index.html: el proyecto y el lienzo.
2. notas/01-shader.md y src/color.ts: qué es un shader, y mix y smoothstep en TypeScript.
3. src/color.test.ts: la matemática se prueba sin GPU.
4. pantalla.vert y atardecer.frag: los dos shaders.
5. notas/02-uniforms.md, src/webgl.ts y src/main.ts: conectar TypeScript con la GPU y dibujar.
6. npx vite: verlo y variar colores, tamaño y velocidad.

## Tests
\`npx vitest run\` prueba mezclar, suavizar y el degradado del cielo. Que el shader compile se ve en el navegador: si falla, el error dice la línea.

## Docker
No hace falta: es una página estática.

## Cómo seguir
- Agregar estrellas con ruido cuando el sol baja
- Mover el sol con el mouse (un uniform más)
- Reproducir un shader de Shadertoy línea por línea`;

export const LESSONS_CREATIVAS: Lesson[] = [
  {
    id: 'gsap-tarjetas',
    tema: 'Animaciones con GSAP',
    topicId: 'gsap',
    titulo: 'Tarjetas que entran en escena',
    dificultad: 'baja',
    duracion: '1 a 2 horas',
    proyecto: 'tres tarjetas que entran escalonadas con una timeline de GSAP; explica cada principio de animación y por qué cada valor',
    stack: { resumen: 'GSAP 3 + Vite + TypeScript + Vitest', lenguaje: 'TypeScript 5', framework: 'GSAP 3 + Vite 6', tests: 'Vitest' },
    convenciones: ['ES modules', 'los números de la animación en src/movimiento.ts, puros y testeados', 'solo src/animar.ts importa GSAP', 'respetar prefers-reduced-motion'],
    arquitectura: 'componentes',
    objetivos: ['timing, easing y stagger', 'tweens y timelines de GSAP', 'animación accesible', 'cómo estudiar animación'],
    entorno: {
      instalar: [{ comando: 'npm install gsap && npm install -D vite typescript vitest', explicacion: 'GSAP para animar; Vite sirve la página y recarga al guardar; TypeScript y Vitest para escribir y probar.' }],
      ejecutar: { comando: 'npx vite', explicacion: 'Abre http://localhost:5173 y mira la entrada de las tarjetas.' },
      testear: { comando: 'npx vitest run', explicacion: 'Prueba los números de la animación, sin navegador.' }
    },
    plan: [
      { paso: 'Manifiesto del proyecto', tipo: 'config', archivo: 'package.json', concepto: 'scripts de Vite y Vitest' },
      { paso: 'Configurar TypeScript', tipo: 'config', archivo: 'tsconfig.json', concepto: 'modo estricto con Vite' },
      { paso: 'Apunte: timing, easing y stagger', tipo: 'teoria', archivo: 'notas/01-principios.md', concepto: 'principios de animación' },
      { paso: 'La página y su contenido', tipo: 'codigo', archivo: 'index.html', concepto: 'contenido primero, animación después' },
      { paso: 'Los números de la animación', tipo: 'codigo', archivo: 'src/movimiento.ts', concepto: 'stagger y movimiento reducido' },
      { paso: 'Tests de los números', tipo: 'test', archivo: 'src/movimiento.test.ts', concepto: 'testear sin pantalla', verificar: 'npx vitest run' },
      { paso: 'Apunte: tweens y timelines', tipo: 'teoria', archivo: 'notas/02-timeline.md', concepto: 'timeline de GSAP' },
      { paso: 'Animar con GSAP', tipo: 'codigo', archivo: 'src/animar.ts', concepto: 'timeline y from()' },
      { paso: 'Arrancar y repetir', tipo: 'codigo', archivo: 'src/main.ts', concepto: 'controlar la timeline' },
      { paso: 'Verlo y variar un valor', tipo: 'comando', comando: 'npx vite', explicacion: 'Las tarjetas suben y aparecen una detrás de otra. Cambia BASE.separacion o BASE.curva, guarda y compara: así se estudia animación.' }
    ],
    guia: GSAP_GUIA,
    archivos: {
      'package.json': [
        '{',
        '  "name": "aprender-gsap",',
        '  "version": "1.0.0",',
        '  "type": "module",',
        '  "scripts": {',
        '    "dev": "vite",',
        '    "build": "vite build",',
        '    "test": "vitest run"',
        '  },',
        '  "dependencies": {',
        '    "gsap": "^3.15.0"',
        '  },',
        '  "devDependencies": {',
        '    "typescript": "^5.9.3",',
        '    "vite": "^6.4.4",',
        '    "vitest": "^3.2.7"',
        '  }',
        '}'
      ],
      'tsconfig.json': [
        '{',
        '  "compilerOptions": {',
        '    "target": "ES2022",',
        '    "module": "ESNext",',
        '    "moduleResolution": "Bundler",',
        '    "lib": ["ES2022", "DOM"],',
        '    "strict": true,',
        '    "skipLibCheck": true,',
        '    "noEmit": true',
        '  },',
        '  "include": ["src"]',
        '}'
      ],
      'index.html': [
        '<!-- Cómo empezar: la página trae el contenido ya escrito. La animación solo cambia cómo ENTRA. -->',
        '<!doctype html>',
        '<html lang="es">',
        '  <head>',
        '    <meta charset="utf-8">',
        '    <meta name="viewport" content="width=device-width, initial-scale=1">',
        '    <title>Tarjetas que entran en escena</title>',
        '    <!-- Estilos mínimos: tres tarjetas en fila que bajan a columna en pantallas chicas. -->',
        '    <style>',
        '      body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: system-ui, sans-serif; background: #14161c; color: #f2f2f2; }',
        '      .tarjetas { display: flex; flex-wrap: wrap; gap: 1rem; padding: 1rem; justify-content: center; }',
        '      .tarjeta { width: 12rem; padding: 1.2rem; border-radius: 12px; background: #23262f; }',
        '    </style>',
        '  </head>',
        '  <body>',
        '    <main>',
        '      <!-- Cada tarjeta lleva la clase tarjeta: así main.ts las encuentra a todas juntas. -->',
        '      <div class="tarjetas">',
        '        <article class="tarjeta"><h2>Timing</h2><p>Cuánto dura cada movimiento.</p></article>',
        '        <article class="tarjeta"><h2>Easing</h2><p>Cómo acelera y frena.</p></article>',
        '        <article class="tarjeta"><h2>Stagger</h2><p>Una detrás de otra.</p></article>',
        '      </div>',
        '      <button id="repetir">Repetir</button>',
        '    </main>',
        '    <!-- type="module": Vite carga main.ts y recarga al guardar. -->',
        '    <script type="module" src="/src/main.ts"></script>',
        '  </body>',
        '</html>'
      ],
      'notas/01-principios.md': [
        '> Apunte 1. Antes de animar: tres ideas que vas a usar en todo el proyecto. Las líneas con > se leen; lo demás lo escribes tú.',
        '## Timing',
        '> El timing es cuánto dura un movimiento. Muy corto no se ve; muy largo aburre. Para entrar en pantalla, entre 0.3 y 0.8 segundos.',
        'Timing: cuánto dura el movimiento.',
        '## Easing',
        '> Nada en el mundo real arranca ni frena de golpe. El easing es la curva de velocidad: power3.out sale rápido y llega suave.',
        'Easing: la curva de velocidad.',
        '```ts',
        'gsap.to(".caja", { x: 200, duration: 0.6, ease: "power3.out" });',
        '```',
        '## Stagger',
        '> Si todo entra a la vez, el ojo no sabe dónde mirar. Escalonar (stagger) lo guía: una pieza detrás de otra.',
        'Stagger: entrar una detrás de otra.',
        '## Cómo estudiar animación',
        '> Mira una animación que te guste, reprodúcela escribiéndola y cambia UN valor por vez: así aprendes qué hace cada uno.',
        'Observar, reproducir, variar, crear.'
      ],
      'src/movimiento.ts': [
        '// Cómo empezar: los NÚMEROS de la animación van aparte, en funciones puras.',
        '// Así se pueden testear sin navegador y cambiar sin tocar el código que anima.',
        '',
        '// Los valores de diseño en un solo lugar: duración, separación entre tarjetas, distancia y curva.',
        'export const BASE = { duracion: 0.6, separacion: 0.12, desplazamiento: 40, curva: "power3.out" };',
        '',
        '// Cómo entra cada tarjeta: cuánto dura, cuándo empieza y desde qué distancia.',
        'export interface Entrada {',
        '  duracion: number;',
        '  retraso: number;',
        '  desplazamiento: number;',
        '  curva: string;',
        '}',
        '// ↑ Entrada: los cuatro números que necesita GSAP para animar una tarjeta.',
        '',
        '// reducido: la persona pidió menos movimiento en su sistema. Entonces todo aparece sin animar.',
        'export function entradas(cantidad: number, reducido: boolean): Entrada[] {',
        '  return Array.from({ length: cantidad }, (_, i) => ({',
        '    duracion: reducido ? 0 : BASE.duracion,',
        '    // i * separacion: cada tarjeta espera un poco más que la anterior (stagger).',
        '    retraso: reducido ? 0 : i * BASE.separacion,',
        '    desplazamiento: reducido ? 0 : BASE.desplazamiento,',
        '    curva: BASE.curva',
        '  }));',
        '}',
        '// ↑ entradas: calcula cómo entra cada tarjeta, escalonadas, o sin movimiento si se pidió.',
        '',
        '// Cuándo termina todo: el final más tardío entre todas las tarjetas.',
        'export function duracionTotal(lista: Entrada[]): number {',
        '  return lista.reduce((fin, e) => Math.max(fin, e.retraso + e.duracion), 0);',
        '}',
        '// ↑ duracionTotal: cuánto dura la animación completa, de la primera a la última tarjeta.'
      ],
      'src/movimiento.test.ts': [
        '// Cómo empezar: probamos los números, no la pantalla. Si los números están bien, la animación también.',
        'import { describe, expect, it } from "vitest";',
        'import { BASE, duracionTotal, entradas } from "./movimiento";',
        '',
        'describe("entradas", () => {',
        '  // Stagger: cada tarjeta empieza un poco después que la anterior.',
        '  it("escalona las tarjetas", () => {',
        '    expect(entradas(3, false).map((e) => e.retraso)).toEqual([0, BASE.separacion, 2 * BASE.separacion]);',
        '  });',
        '  // Accesibilidad: con movimiento reducido, nada se desplaza ni tarda.',
        '  it("respeta el movimiento reducido", () => {',
        '    expect(entradas(2, true).every((e) => e.duracion === 0 && e.desplazamiento === 0)).toBe(true);',
        '  });',
        '});',
        '// ↑ entradas: prueba el escalonado y que se respete el movimiento reducido.',
        '',
        '// La última tarjeta empieza en 0.24 y dura 0.6: todo termina en 0.84 segundos.',
        'it("calcula cuándo termina todo", () => {',
        '  expect(duracionTotal(entradas(3, false))).toBeCloseTo(0.84);',
        '});',
        '// ↑ duracionTotal: comprueba cuándo termina la animación completa.'
      ],
      'notas/02-timeline.md': [
        '> Apunte 2. Ahora los números se convierten en movimiento con GSAP.',
        '## Tween',
        '> Un tween anima propiedades de un elemento. from() anima DESDE los valores que le das hasta como está en la página.',
        'Un tween anima propiedades; from() parte de otros valores.',
        '```ts',
        'gsap.from(".tarjeta", { y: 40, opacity: 0, duration: 0.6 });',
        '```',
        '## Timeline',
        '> Una timeline ordena varios tweens en el tiempo. El último número de cada from() es la posición: en qué segundo empieza.',
        'Una timeline ordena tweens en el tiempo.',
        '```ts',
        'const tl = gsap.timeline();',
        'tl.from(a, { opacity: 0 }, 0);',
        'tl.from(b, { opacity: 0 }, 0.12);',
        '```',
        '> Con una timeline puedes repetir, pausar o invertir todo junto: tl.restart(), tl.pause(), tl.reverse().',
        'Controlar todo junto: restart, pause, reverse.'
      ],
      'src/animar.ts': [
        '// Cómo empezar: este archivo es el ÚNICO que conoce GSAP. Recibe los números de movimiento.ts y anima.',
        'import { gsap } from "gsap";',
        'import { entradas } from "./movimiento";',
        '',
        '// Devuelve la timeline: quien la llama puede repetirla, pausarla o invertirla.',
        'export function animarTarjetas(tarjetas: HTMLElement[], reducido: boolean): gsap.core.Timeline {',
        '  const tl = gsap.timeline();',
        '  // Un from() por tarjeta, con su propia entrada. El último argumento es cuándo empieza en la timeline.',
        '  entradas(tarjetas.length, reducido).forEach((e, i) => {',
        '    tl.from(tarjetas[i], { y: e.desplazamiento, opacity: 0, duration: e.duracion, ease: e.curva }, e.retraso);',
        '  });',
        '  return tl;',
        '}',
        '// ↑ animarTarjetas: arma una timeline con la entrada escalonada de cada tarjeta.'
      ],
      'src/main.ts': [
        '// Cómo empezar: el punto de entrada busca las tarjetas en la página y arranca la animación.',
        'import { animarTarjetas } from "./animar";',
        '',
        '// querySelectorAll devuelve una lista que no es un arreglo: Array.from la convierte.',
        'const tarjetas = Array.from(document.querySelectorAll<HTMLElement>(".tarjeta"));',
        '// La preferencia del sistema operativo: si pidió menos movimiento, la respetamos.',
        'const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;',
        'const tl = animarTarjetas(tarjetas, reducido);',
        '',
        '// restart() vuelve a reproducir la timeline desde el principio.',
        'document.querySelector("#repetir")?.addEventListener("click", () => {',
        '  tl.restart();',
        '});',
        '// ↑ clic en Repetir: vuelve a ver la entrada completa, para estudiarla otra vez.'
      ]
    },
    conceptos: {
      'notas/01-principios.md': ['timing', 'easing', 'stagger'],
      'src/movimiento.ts': ['funciones puras', 'stagger', 'prefers-reduced-motion'],
      'src/movimiento.test.ts': ['tests'],
      'notas/02-timeline.md': ['gsap timeline'],
      'src/animar.ts': ['gsap timeline', 'gsap from'],
      'src/main.ts': ['matchMedia']
    }
  },
  {
    id: 'shader-atardecer',
    tema: 'Shaders con GLSL (WebGL)',
    topicId: 'shaders-glsl',
    titulo: 'Tu primer shader: un atardecer animado',
    dificultad: 'media',
    duracion: '2 horas',
    proyecto: 'un atardecer animado dibujado por un fragment shader; explica cada línea de GLSL y cómo se conecta con TypeScript',
    stack: { resumen: 'WebGL2 + GLSL ES 3.0 + TypeScript + Vite + Vitest', lenguaje: 'TypeScript 5 y GLSL ES 3.0', framework: 'Vite 6', tests: 'Vitest' },
    convenciones: ['shaders en src/shaders/*.vert y *.frag, importados con ?raw', 'la matemática del shader replicada en src/color.ts y testeada', 'webgl.ts agrega #version al compilar', 'respetar prefers-reduced-motion'],
    arquitectura: 'componentes',
    objetivos: ['qué es un shader', 'coordenadas y colores', 'mix, smoothstep y distance', 'uniforms y el bucle de dibujo'],
    entorno: {
      instalar: [{ comando: 'npm install -D vite typescript vitest', explicacion: 'Vite sirve la página (y carga los shaders como texto); TypeScript y Vitest para escribir y probar.' }],
      ejecutar: { comando: 'npx vite', explicacion: 'Abre http://localhost:5173 y mira el atardecer.' },
      testear: { comando: 'npx vitest run', explicacion: 'Prueba la matemática del shader, sin GPU.' }
    },
    plan: [
      { paso: 'Manifiesto del proyecto', tipo: 'config', archivo: 'package.json', concepto: 'scripts de Vite y Vitest' },
      { paso: 'Configurar TypeScript', tipo: 'config', archivo: 'tsconfig.json', concepto: 'modo estricto con Vite' },
      { paso: 'Importar shaders como texto', tipo: 'config', archivo: 'src/vite-env.d.ts', concepto: 'importar con ?raw' },
      { paso: 'Apunte: qué es un shader', tipo: 'teoria', archivo: 'notas/01-shader.md', concepto: 'un programa por píxel' },
      { paso: 'La página con el lienzo', tipo: 'codigo', archivo: 'index.html', concepto: 'canvas a pantalla completa' },
      { paso: 'mix y smoothstep en TypeScript', tipo: 'codigo', archivo: 'src/color.ts', concepto: 'interpolar y suavizar' },
      { paso: 'Tests de la matemática', tipo: 'test', archivo: 'src/color.test.ts', concepto: 'testear sin GPU', verificar: 'npx vitest run' },
      { paso: 'Vertex shader', tipo: 'codigo', archivo: 'src/shaders/pantalla.vert', concepto: 'un triángulo que tapa la pantalla' },
      { paso: 'Fragment shader: el atardecer', tipo: 'codigo', archivo: 'src/shaders/atardecer.frag', concepto: 'uv, mix, smoothstep y distance' },
      { paso: 'Apunte: uniforms y bucle', tipo: 'teoria', archivo: 'notas/02-uniforms.md', concepto: 'uniforms' },
      { paso: 'Compilar y enlazar', tipo: 'codigo', archivo: 'src/webgl.ts', concepto: 'compilar shaders y ver sus errores' },
      { paso: 'Dibujar en bucle', tipo: 'codigo', archivo: 'src/main.ts', concepto: 'requestAnimationFrame y uniforms' },
      { paso: 'Verlo y variar un valor', tipo: 'comando', comando: 'npx vite', explicacion: 'Un cielo en degradado y un sol que sube y baja. Cambia un color o el 0.10 del tamaño del sol, guarda y mira qué pasa: así se estudian shaders.' }
    ],
    guia: SHADER_GUIA,
    archivos: {
      'package.json': [
        '{',
        '  "name": "aprender-shaders",',
        '  "version": "1.0.0",',
        '  "type": "module",',
        '  "scripts": {',
        '    "dev": "vite",',
        '    "build": "vite build",',
        '    "test": "vitest run"',
        '  },',
        '  "devDependencies": {',
        '    "typescript": "^5.9.3",',
        '    "vite": "^6.4.4",',
        '    "vitest": "^3.2.7"',
        '  }',
        '}'
      ],
      'tsconfig.json': [
        '{',
        '  "compilerOptions": {',
        '    "target": "ES2022",',
        '    "module": "ESNext",',
        '    "moduleResolution": "Bundler",',
        '    "lib": ["ES2022", "DOM"],',
        '    "strict": true,',
        '    "skipLibCheck": true,',
        '    "noEmit": true',
        '  },',
        '  "include": ["src"]',
        '}'
      ],
      'src/vite-env.d.ts': [
        '// Cómo empezar: le dice a TypeScript que Vite puede importar archivos como texto (?raw).',
        '// Así los shaders viven en sus propios archivos .vert y .frag, con colores y comentarios.',
        '/// <reference types="vite/client" />'
      ],
      'index.html': [
        '<!-- Cómo empezar: la página es solo un lienzo que ocupa toda la ventana. Lo dibuja la GPU. -->',
        '<!doctype html>',
        '<html lang="es">',
        '  <head>',
        '    <meta charset="utf-8">',
        '    <meta name="viewport" content="width=device-width, initial-scale=1">',
        '    <title>Tu primer shader</title>',
        '    <style>',
        '      html, body { margin: 0; height: 100%; background: #000; }',
        '      canvas { display: block; width: 100%; height: 100%; }',
        '    </style>',
        '  </head>',
        '  <body>',
        '    <canvas id="lienzo"></canvas>',
        '    <script type="module" src="/src/main.ts"></script>',
        '  </body>',
        '</html>'
      ],
      'notas/01-shader.md': [
        '> Apunte 1. Qué es un shader, antes de escribir el primero. Las líneas con > se leen; lo demás lo escribes tú.',
        '## Un programa por píxel',
        '> Un fragment shader es una función que la GPU ejecuta una vez por cada píxel, todos a la vez. Recibe dónde está el píxel y devuelve su color.',
        'Un shader decide el color de cada píxel.',
        '## Coordenadas',
        '> gl_FragCoord dice en qué píxel estás. Dividido por la resolución queda entre 0 y 1: (0, 0) abajo a la izquierda, (1, 1) arriba a la derecha.',
        'uv = posición del píxel entre 0 y 1.',
        '## Colores',
        '> Un color es un vec3 con rojo, verde y azul, cada uno entre 0.0 y 1.0. vec3(1.0, 0.5, 0.0) es naranja.',
        'Un color es vec3(rojo, verde, azul).',
        '```glsl',
        'vec3 naranja = vec3(1.0, 0.5, 0.0);',
        '```',
        '## Mezclar',
        '> mix(a, b, t) mezcla dos valores: con t = 0 da a, con t = 1 da b, y en el medio, una mezcla. Es la herramienta más usada.',
        'mix(a, b, t): de a hacia b según t.',
        '## Cómo estudiar shaders',
        '> Cambia un número y mira qué pasa. Para depurar, muestra el valor que dudas como color: si ves rojo, vale 1.',
        'Depurar: mostrar el valor como color.'
      ],
      'src/color.ts': [
        '// Cómo empezar: las funciones del shader, escritas en TypeScript. Hacen lo mismo que mix y smoothstep',
        '// de GLSL, y así podemos testear la matemática sin GPU antes de usarla en el shader.',
        '',
        '// mezclar = mix de GLSL: con t = 0 da a, con t = 1 da b, y en el medio interpola.',
        '// La fórmula es la misma que define GLSL: un poco de a y un poco de b, que siempre suman 1.',
        'export function mezclar(a: number, b: number, t: number): number {',
        '  return a * (1 - t) + b * t;',
        '}',
        '// ↑ mezclar: el punto que está a una fracción t del camino entre a y b.',
        '',
        '// suavizar = smoothstep: 0 antes de borde0, 1 después de borde1, y una curva suave en el medio.',
        'export function suavizar(borde0: number, borde1: number, x: number): number {',
        '  const t = Math.min(Math.max((x - borde0) / (borde1 - borde0), 0), 1);',
        '  // t * t * (3 - 2t): arranca y termina con velocidad cero, por eso no se ven cortes.',
        '  return t * t * (3 - 2 * t);',
        '}',
        '// ↑ suavizar: pasa de 0 a 1 entre dos bordes, sin saltos.',
        '',
        '// Los dos colores del cielo, como en el shader: rojo, verde y azul entre 0 y 1.',
        'export const ABAJO = [0.98, 0.55, 0.3];',
        'export const ARRIBA = [0.1, 0.12, 0.35];',
        '',
        '// El color del cielo a una altura y (0 abajo, 1 arriba): el mismo cálculo que hace atardecer.frag.',
        'export function cielo(y: number): number[] {',
        '  const t = suavizar(0, 1, y);',
        '  return ABAJO.map((c, i) => mezclar(c, ARRIBA[i], t));',
        '}',
        '// ↑ cielo: degradado suave del naranja del horizonte al azul de arriba.'
      ],
      'src/color.test.ts': [
        '// Cómo empezar: si la matemática está bien en TypeScript, en el shader también. Probamos los bordes.',
        'import { describe, expect, it } from "vitest";',
        'import { ABAJO, ARRIBA, cielo, mezclar, suavizar } from "./color";',
        '',
        'describe("mezclar y suavizar", () => {',
        '  // mix: los extremos y la mitad exacta.',
        '  it("mezclar da a, b y el punto medio", () => {',
        '    expect([mezclar(0, 10, 0), mezclar(0, 10, 1), mezclar(0, 10, 0.5)]).toEqual([0, 10, 5]);',
        '  });',
        '  // smoothstep: fuera de los bordes queda fijo en 0 o 1.',
        '  it("suavizar se queda en 0 y en 1 fuera de los bordes", () => {',
        '    expect([suavizar(0.2, 0.8, 0), suavizar(0.2, 0.8, 1), suavizar(0, 1, 0.5)]).toEqual([0, 1, 0.5]);',
        '  });',
        '});',
        '// ↑ mezclar y suavizar: comprueba los extremos y el medio de las dos funciones.',
        '',
        '// El horizonte es el color de abajo y lo más alto, el de arriba.',
        'it("el cielo va del horizonte al azul", () => {',
        '  expect([cielo(0), cielo(1)]).toEqual([ABAJO, ARRIBA]);',
        '});',
        '// ↑ cielo: comprueba que el degradado empieza en el horizonte y termina en el azul.'
      ],
      'src/shaders/pantalla.vert': [
        '// Cómo empezar: el vertex shader ubica los vértices. Aquí solo hace falta un triángulo que tape la pantalla.',
        '// Sin #version: WebGL la exige en la primera línea, y aquí arriba van los comentarios. La agrega webgl.ts.',
        '',
        '// in: un dato que llega por vértice desde TypeScript (la posición de cada esquina).',
        'in vec2 a_posicion;',
        '',
        'void main() {',
        '  // gl_Position es la salida obligatoria: x e y entre -1 y 1 cubren la pantalla.',
        '  gl_Position = vec4(a_posicion, 0.0, 1.0);',
        '}',
        '// ↑ main: pasa cada esquina del triángulo tal cual; el trabajo de color lo hace el fragment shader.'
      ],
      'src/shaders/atardecer.frag': [
        '// Cómo empezar: el fragment shader corre una vez POR PÍXEL y decide su color.',
        '// highp: precisión alta para los números con coma; sin esto, los degradados se ven escalonados.',
        'precision highp float;',
        '',
        '// uniforms: valores iguales para todos los píxeles, que manda TypeScript en cada cuadro.',
        'uniform vec2 u_resolucion;',
        'uniform float u_tiempo;',
        '// out: el color que sale de este píxel.',
        'out vec4 color;',
        '',
        'void main() {',
        '  // uv: dónde está el píxel, entre 0 y 1. Es lo primero que calcula casi todo shader.',
        '  vec2 uv = gl_FragCoord.xy / u_resolucion;',
        '  // El cielo: mix entre naranja (abajo) y azul (arriba), con smoothstep para que el paso sea suave.',
        '  vec3 abajo = vec3(0.98, 0.55, 0.30);',
        '  vec3 arriba = vec3(0.10, 0.12, 0.35);',
        '  vec3 cielo = mix(abajo, arriba, smoothstep(0.0, 1.0, uv.y));',
        '  // aspecto: corrige que la pantalla no es cuadrada; sin esto, el sol sale ovalado.',
        '  vec2 aspecto = vec2(u_resolucion.x / u_resolucion.y, 1.0);',
        '  // El sol sube y baja despacio: sin(u_tiempo) va de -1 a 1 y lo achicamos a un movimiento chico.',
        '  vec2 centro = vec2(0.5, 0.3 + 0.05 * sin(u_tiempo * 0.5));',
        '  float d = distance(uv * aspecto, centro * aspecto);',
        '  // sol: 1 dentro del círculo, 0 fuera; smoothstep entre 0.10 y 0.11 suaviza el borde.',
        '  float sol = 1.0 - smoothstep(0.10, 0.11, d);',
        '  color = vec4(mix(cielo, vec3(1.0, 0.85, 0.45), sol), 1.0);',
        '}',
        '// ↑ main: pinta un cielo en degradado y encima un sol redondo que sube y baja con el tiempo.'
      ],
      'notas/02-uniforms.md': [
        '> Apunte 2. Cómo se conectan TypeScript y la GPU: compilar, enlazar y mandar datos.',
        '## Compilar y enlazar',
        '> Los shaders se compilan en la GPU mientras corre la página. Un vertex y un fragment shader juntos forman un programa.',
        'vertex + fragment = programa.',
        '## Uniforms',
        '> Un uniform es un dato que TypeScript manda y todos los píxeles leen igual: el tiempo para animar, la resolución para las coordenadas.',
        'Un uniform es igual para todos los píxeles.',
        '```ts',
        'gl.uniform1f(lugarTiempo, segundos);',
        '```',
        '## El bucle',
        '> requestAnimationFrame llama a dibujar unas 60 veces por segundo. En cada vuelta: actualizar el tiempo y dibujar.',
        'Cada cuadro: actualizar uniforms y dibujar.'
      ],
      'src/webgl.ts': [
        '// Cómo empezar: dos funciones que hacen el trabajo repetitivo de WebGL: compilar y enlazar.',
        '// Si un shader tiene un error, lo mostramos con el mensaje de la GPU, que dice la línea.',
        '',
        '// WebGL exige que #version sea la PRIMERA línea. Como los archivos empiezan con comentarios',
        '// (la explicación), la versión se agrega aquí: GLSL ES 3.0, la de WebGL2.',
        'const VERSION = "#version 300 es\\n";',
        '',
        '// Compila un shader de un tipo (vértices o fragmentos) a partir de su texto.',
        'export function compilar(gl: WebGL2RenderingContext, tipo: number, fuente: string): WebGLShader {',
        '  const shader = gl.createShader(tipo)!;',
        '  gl.shaderSource(shader, VERSION + fuente);',
        '  gl.compileShader(shader);',
        '  // Si no compiló, el log dice qué línea falló. Lanzar el error lo hace visible en la consola.',
        '  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {',
        '    throw new Error("El shader no compiló:\\n" + gl.getShaderInfoLog(shader));',
        '  }',
        '  return shader;',
        '}',
        '// ↑ compilar: convierte el texto GLSL en un shader de la GPU, o explica por qué no pudo.',
        '',
        '// Une el vertex y el fragment shader en un programa listo para dibujar.',
        'export function crearPrograma(gl: WebGL2RenderingContext, vertice: string, fragmento: string): WebGLProgram {',
        '  const programa = gl.createProgram()!;',
        '  gl.attachShader(programa, compilar(gl, gl.VERTEX_SHADER, vertice));',
        '  gl.attachShader(programa, compilar(gl, gl.FRAGMENT_SHADER, fragmento));',
        '  gl.linkProgram(programa);',
        '  if (!gl.getProgramParameter(programa, gl.LINK_STATUS)) {',
        '    throw new Error("El programa no enlazó:\\n" + gl.getProgramInfoLog(programa));',
        '  }',
        '  return programa;',
        '}',
        '// ↑ crearPrograma: compila los dos shaders y los enlaza en un solo programa.'
      ],
      'src/main.ts': [
        '// Cómo empezar: preparar el lienzo, darle a la GPU un triángulo que tape la pantalla y dibujar en bucle.',
        'import { crearPrograma } from "./webgl";',
        '// ?raw: Vite importa el archivo como texto. Así los shaders se escriben en sus propios archivos.',
        'import vertice from "./shaders/pantalla.vert?raw";',
        'import fragmento from "./shaders/atardecer.frag?raw";',
        '',
        'const lienzo = document.querySelector<HTMLCanvasElement>("#lienzo")!;',
        '// webgl2: el contexto que entiende GLSL ES 3.0. Si el navegador no lo tiene, avisamos.',
        'const gl = lienzo.getContext("webgl2");',
        'if (!gl) {',
        '  throw new Error("Este navegador no tiene WebGL2");',
        '}',
        '// ↑ if: sin WebGL2 no hay nada que dibujar; el error lo explica.',
        '',
        'const programa = crearPrograma(gl, vertice, fragmento);',
        'gl.useProgram(programa);',
        '',
        '// Tres esquinas que forman un triángulo más grande que la pantalla: la cubre entera con un solo dibujo.',
        'const esquinas = new Float32Array([-1, -1, 3, -1, -1, 3]);',
        'gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());',
        'gl.bufferData(gl.ARRAY_BUFFER, esquinas, gl.STATIC_DRAW);',
        '// a_posicion lee de a 2 números (x, y) por vértice.',
        'const lugarPosicion = gl.getAttribLocation(programa, "a_posicion");',
        'gl.enableVertexAttribArray(lugarPosicion);',
        'gl.vertexAttribPointer(lugarPosicion, 2, gl.FLOAT, false, 0, 0);',
        '',
        '// Dónde viven los uniforms dentro del programa: se buscan una vez y se usan en cada cuadro.',
        'const lugarResolucion = gl.getUniformLocation(programa, "u_resolucion");',
        'const lugarTiempo = gl.getUniformLocation(programa, "u_tiempo");',
        '// Con movimiento reducido, el sol queda quieto.',
        'const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;',
        '',
        'function dibujar(ms: number) {',
        '  // El lienzo tiene que medir lo mismo que en pantalla, o la imagen se ve borrosa.',
        '  lienzo.width = lienzo.clientWidth;',
        '  lienzo.height = lienzo.clientHeight;',
        '  gl!.viewport(0, 0, lienzo.width, lienzo.height);',
        '  gl!.uniform2f(lugarResolucion, lienzo.width, lienzo.height);',
        '  gl!.uniform1f(lugarTiempo, reducido ? 0 : ms / 1000);',
        '  gl!.drawArrays(gl!.TRIANGLES, 0, 3);',
        '  requestAnimationFrame(dibujar);',
        '}',
        '// ↑ dibujar: ajusta el tamaño, manda resolución y tiempo, dibuja y pide el siguiente cuadro.',
        'requestAnimationFrame(dibujar);'
      ]
    },
    conceptos: {
      'notas/01-shader.md': ['shaders', 'coordenadas uv', 'mix'],
      'src/color.ts': ['mix', 'smoothstep'],
      'src/color.test.ts': ['tests'],
      'src/shaders/pantalla.vert': ['vertex shader'],
      'src/shaders/atardecer.frag': ['fragment shader', 'smoothstep', 'distance', 'uniforms'],
      'notas/02-uniforms.md': ['uniforms'],
      'src/webgl.ts': ['webgl2', 'compilar shaders'],
      'src/main.ts': ['requestAnimationFrame', 'uniforms']
    }
  }
];
