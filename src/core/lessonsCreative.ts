import type { Lesson } from './lessons';


/** Texto multilínea → líneas (sin la primera línea vacía). */
const L = (s: string): string[] => s.replace(/^\n/, '').replace(/\n$/, '').split('\n');

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

const SHADERS_GUIA = `## Qué vas a construir
Un fondo vivo para una página: un degradado, una seda líquida, puntos que titilan, un halo de luz que sigue al mouse y la estela del cursor. Lo dibuja la GPU con la librería Shaders, capa por capa. Un control cambia el ángulo en vivo.

## Qué vas a aprender
- pensar una escena como capas (generadores y efectos), como en Figma
- uniforms: cambiar valores en vivo sin recompilar
- tiempo, coordenadas uv, ruido y fBm, modos de mezcla y máscaras
- detectar WebGPU y dejar un respaldo de CSS
- accesibilidad: prefers-reduced-motion y el fondo como decoración
- escribir un efecto propio en WGSL con defineShader

## Antes de empezar
- Node.js 22 LTS y un navegador con WebGPU: Chrome o Edge actuales, Safari 26, o Firefox en Windows. La página tiene que abrirse en https o en localhost.
- \`npm install shaders@4.0.4 && npm install -D vite typescript vitest\`.
- La versión va fija: desde la 4 la librería es MIT (las 2.x y 3.x tenían licencia propietaria) y su API todavía cambia rápido.

## Cómo está organizado
escena.ts arma la escena como datos (una lista de capas) con funciones puras y testeadas; halo.ts es el efecto propio en WGSL; main.ts es el único que toca la GPU: pregunta por WebGPU, crea el shader y conecta el control.

## Paso a paso
1. package.json y tsconfig.json: el proyecto, con la versión de Shaders fija.
2. notas/01-capas.md e index.html: qué es una escena por capas, y la página con su respaldo de CSS.
3. notas/02-uniforms.md, src/escena.ts y su test: uniforms, ruido y máscaras, y la escena como datos.
4. notas/03-wgsl.md y src/halo.ts: tu propio efecto en WGSL.
5. src/main.ts y npx vite: verlo, mover el mouse y el control, y variar un valor por vez.

## Tests
\`npx vitest run\` prueba el control, el orden de las capas, la máscara, el movimiento reducido y los mensajes de soporte, sin GPU. Lo visual se ve en el navegador con \`npx vite\`.

## Docker
No hace falta: es una página estática.

## Cómo seguir
- Cambiar FlowingGradient por FractalNoise o Aurora y comparar
- Animar una prop sin código: { type: "auto-animate", mode: "ping-pong", outputMin: 0.4, outputMax: 1, speed: 0.6 }
- Probar la misma escena en React con shaders/react: <Shader> y una etiqueta por capa
- Armar una escena en el editor de shaders.com y comparar el código que exporta`;

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
      'package.json': L(`
// Abre el manifiesto. En JSON los comentarios no van: se quitan al guardar.
{
  // El nombre del proyecto.
  "name": "aprender-gsap",
  // La versión del proyecto.
  "version": "1.0.0",
  // "module": los archivos usan import y export.
  "type": "module",
  // Abre los scripts: atajos que se corren con npm run.
  "scripts": {
    // npm run dev abre la página con Vite y recarga al guardar.
    "dev": "vite",
    // npm run build arma la versión final para publicar.
    "build": "vite build",
    // npm test corre los tests una vez.
    "test": "vitest run"
  // Cierra los scripts.
  },
  // Abre las dependencias: lo que la página necesita para funcionar.
  "dependencies": {
    // GSAP, la librería de animación.
    "gsap": "^3.15.0"
  // Cierra las dependencias.
  },
  // Abre las dependencias de desarrollo: herramientas para escribir y probar.
  "devDependencies": {
    // TypeScript, para los tipos.
    "typescript": "^5.9.3",
    // Vite, el servidor de desarrollo.
    "vite": "^6.4.4",
    // Vitest, el corredor de tests.
    "vitest": "^3.2.7"
  // Cierra las dependencias de desarrollo.
  }
// Cierra el manifiesto.
}`),
      'tsconfig.json': L(`
// Abre la configuración del compilador. tsconfig sí admite comentarios.
{
  // Abre las opciones del compilador.
  "compilerOptions": {
    // target: qué versión de JavaScript se genera.
    "target": "ES2022",
    // module: los archivos son módulos con import y export.
    "module": "ESNext",
    // moduleResolution: Bundler, como resuelve los imports Vite.
    "moduleResolution": "Bundler",
    // lib: conoce el JavaScript moderno y el DOM (la página).
    "lib": ["ES2022", "DOM"],
    // strict: el modo más estricto, el que más errores atrapa.
    "strict": true,
    // skipLibCheck: no revisa los tipos de las librerías, solo los tuyos.
    "skipLibCheck": true,
    // noEmit: solo revisa los tipos; Vite arma el código.
    "noEmit": true
  // Cierra las opciones.
  },
  // include: revisa los archivos de src.
  "include": ["src"]
// Cierra la configuración.
}`),
      'index.html': L(`
<!-- Cómo empezar: la página trae el contenido ya escrito. La animación solo cambia cómo ENTRA. -->
<!doctype html>
<!-- El documento, en español. -->
<html lang="es">
  <!-- La cabecera: datos de la página que no se ven. -->
  <head>
    <!-- utf-8: para que las tildes y la ñ se vean bien. -->
    <meta charset="utf-8">
    <!-- viewport: el ancho de la página es el de la pantalla (celulares). -->
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <!-- El título de la pestaña. -->
    <title>Tarjetas que entran en escena</title>
    <!-- Estilos mínimos: tres tarjetas en fila que bajan a columna en pantallas chicas. -->
    <style>
      /* El cuerpo: centra todo, fondo oscuro y texto claro. */
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: system-ui, sans-serif; background: #14161c; color: #f2f2f2; }
      /* El contenedor: las tarjetas en fila, y en columna si no entran. */
      .tarjetas { display: flex; flex-wrap: wrap; gap: 1rem; padding: 1rem; justify-content: center; }
      /* Cada tarjeta: ancho fijo, relleno, esquinas redondeadas y fondo. */
      .tarjeta { width: 12rem; padding: 1.2rem; border-radius: 12px; background: #23262f; }
      /* Cierra los estilos: la etiqueta de abajo termina el CSS. */
    </style>
  <!-- Cierra la cabecera. -->
  </head>
  <!-- El cuerpo: lo que se ve. -->
  <body>
    <!-- main: el contenido principal de la página. -->
    <main>
      <!-- Cada tarjeta lleva la clase tarjeta: así main.ts las encuentra a todas juntas. -->
      <div class="tarjetas">
        <!-- Tarjeta 1: timing. -->
        <article class="tarjeta"><h2>Timing</h2><p>Cuánto dura cada movimiento.</p></article>
        <!-- Tarjeta 2: easing. -->
        <article class="tarjeta"><h2>Easing</h2><p>Cómo acelera y frena.</p></article>
        <!-- Tarjeta 3: stagger. -->
        <article class="tarjeta"><h2>Stagger</h2><p>Una detrás de otra.</p></article>
      <!-- Cierra el contenedor de tarjetas. -->
      </div>
      <!-- El botón para volver a ver la entrada. -->
      <button id="repetir">Repetir</button>
    <!-- Cierra el contenido principal. -->
    </main>
    <!-- type="module": Vite carga main.ts y recarga al guardar. -->
    <script type="module" src="/src/main.ts"></script>
  <!-- Cierra el cuerpo. -->
  </body>
<!-- Cierra el documento. -->
</html>`),
      'notas/01-principios.md': L(`
> Apunte 1. Antes de animar: tres ideas que vas a usar en todo el proyecto. Todo se escribe, también las explicaciones.
## Timing
> El timing es cuánto dura un movimiento. Muy corto no se ve; muy largo aburre. Para entrar en pantalla, entre 0.3 y 0.8 segundos.
Timing: cuánto dura el movimiento.
> Ahora, la segunda idea.
## Easing
> Nada en el mundo real arranca ni frena de golpe. El easing es la curva de velocidad: power3.out sale rápido y llega suave.
Easing: la curva de velocidad.
\`\`\`ts
// Mueve .caja 200 px a la derecha en 0.6 s, saliendo rápido y llegando suave.
gsap.to(".caja", { x: 200, duration: 0.6, ease: "power3.out" });
\`\`\`
> La tercera idea.
## Stagger
> Si todo entra a la vez, el ojo no sabe dónde mirar. Escalonar (stagger) lo guía: una pieza detrás de otra.
Stagger: entrar una detrás de otra.
> Y cómo se estudia todo esto.
## Cómo estudiar animación
> Mira una animación que te guste, reprodúcela escribiéndola y cambia UN valor por vez: así aprendes qué hace cada uno.
Observar, reproducir, variar, crear.`),
      'src/movimiento.ts': L(`
// Cómo empezar: los NÚMEROS de la animación van aparte, en funciones puras.
// Así se pueden testear sin navegador y cambiar sin tocar el código que anima.

// Los valores de diseño en un solo lugar: duración, separación entre tarjetas, distancia y curva.
export const BASE = { duracion: 0.6, separacion: 0.12, desplazamiento: 40, curva: "power3.out" };

// Cómo entra cada tarjeta: cuánto dura, cuándo empieza y desde qué distancia.
export interface Entrada {
  // duracion: cuántos segundos dura la entrada.
  duracion: number;
  // retraso: cuántos segundos espera antes de empezar.
  retraso: number;
  // desplazamiento: desde cuántos píxeles más abajo sube.
  desplazamiento: number;
  // curva: el easing de GSAP.
  curva: string;
// Cierra la interface.
}
// ↑ Entrada: los cuatro números que necesita GSAP para animar una tarjeta.

// reducido: la persona pidió menos movimiento en su sistema. Entonces todo aparece sin animar.
export function entradas(cantidad: number, reducido: boolean): Entrada[] {
  // Array.from con length arma una lista de "cantidad" entradas; i es la posición.
  return Array.from({ length: cantidad }, (_, i) => ({
    // Con movimiento reducido no dura nada; si no, la duración base.
    duracion: reducido ? 0 : BASE.duracion,
    // i * separacion: cada tarjeta espera un poco más que la anterior (stagger).
    retraso: reducido ? 0 : i * BASE.separacion,
    // Con movimiento reducido no se desplaza.
    desplazamiento: reducido ? 0 : BASE.desplazamiento,
    // La curva es la misma para todas.
    curva: BASE.curva
  // Cierra el objeto de cada entrada y el Array.from.
  }));
// Cierra la función entradas.
}
// ↑ entradas: calcula cómo entra cada tarjeta, escalonadas, o sin movimiento si se pidió.

// Cuándo termina todo: el final más tardío entre todas las tarjetas.
export function duracionTotal(lista: Entrada[]): number {
  // reduce se queda con el mayor retraso + duración de la lista.
  return lista.reduce((fin, e) => Math.max(fin, e.retraso + e.duracion), 0);
// Cierra la función duracionTotal.
}
// ↑ duracionTotal: cuánto dura la animación completa, de la primera a la última tarjeta.`),
      'src/movimiento.test.ts': L(`
// Cómo empezar: probamos los números, no la pantalla. Si los números están bien, la animación también.
// Las piezas de Vitest para escribir tests.
import { describe, expect, it } from "vitest";
// Lo que se prueba: los valores base y las dos funciones.
import { BASE, duracionTotal, entradas } from "./movimiento";

// describe agrupa los tests de entradas.
describe("entradas", () => {
  // Stagger: cada tarjeta empieza un poco después que la anterior.
  it("escalona las tarjetas", () => {
    // Los retrasos de tres tarjetas: 0, una separación y dos separaciones.
    expect(entradas(3, false).map((e) => e.retraso)).toEqual([0, BASE.separacion, 2 * BASE.separacion]);
  // Cierra el caso.
  });
  // Accesibilidad: con movimiento reducido, nada se desplaza ni tarda.
  it("respeta el movimiento reducido", () => {
    // every comprueba que todas las entradas tengan duración y desplazamiento 0.
    expect(entradas(2, true).every((e) => e.duracion === 0 && e.desplazamiento === 0)).toBe(true);
  // Cierra el caso.
  });
// Cierra el grupo.
});
// ↑ entradas: prueba el escalonado y que se respete el movimiento reducido.

// La última tarjeta empieza en 0.24 y dura 0.6: todo termina en 0.84 segundos.
it("calcula cuándo termina todo", () => {
  // toBeCloseTo: los decimales pueden tener errores chicos.
  expect(duracionTotal(entradas(3, false))).toBeCloseTo(0.84);
// Cierra el caso.
});
// ↑ duracionTotal: comprueba cuándo termina la animación completa.`),
      'notas/02-timeline.md': L(`
> Apunte 2. Ahora los números se convierten en movimiento con GSAP.
## Tween
> Un tween anima propiedades de un elemento. from() anima DESDE los valores que le das hasta como está en la página.
Un tween anima propiedades; from() parte de otros valores.
\`\`\`ts
// Las tarjetas entran desde 40 px más abajo y transparentes, en 0.6 s.
gsap.from(".tarjeta", { y: 40, opacity: 0, duration: 0.6 });
\`\`\`
> Varios tweens juntos se ordenan con una timeline.
## Timeline
> Una timeline ordena varios tweens en el tiempo. El último número de cada from() es la posición: en qué segundo empieza.
Una timeline ordena tweens en el tiempo.
\`\`\`ts
// Crea una timeline vacía.
const tl = gsap.timeline();
// a aparece en el segundo 0.
tl.from(a, { opacity: 0 }, 0);
// b aparece en el segundo 0.12, un poco después.
tl.from(b, { opacity: 0 }, 0.12);
\`\`\`
> Con una timeline puedes repetir, pausar o invertir todo junto: tl.restart(), tl.pause(), tl.reverse().
Controlar todo junto: restart, pause, reverse.`),
      'src/animar.ts': L(`
// Cómo empezar: este archivo es el ÚNICO que conoce GSAP. Recibe los números de movimiento.ts y anima.
// gsap, la librería que anima.
import { gsap } from "gsap";
// Los números de cada entrada.
import { entradas } from "./movimiento";

// Devuelve la timeline: quien la llama puede repetirla, pausarla o invertirla.
export function animarTarjetas(tarjetas: HTMLElement[], reducido: boolean): gsap.core.Timeline {
  // Crea la timeline vacía.
  const tl = gsap.timeline();
  // Un from() por tarjeta, con su propia entrada. El último argumento es cuándo empieza en la timeline.
  entradas(tarjetas.length, reducido).forEach((e, i) => {
    // La tarjeta i entra desde abajo y transparente, con su duración, curva y retraso.
    tl.from(tarjetas[i], { y: e.desplazamiento, opacity: 0, duration: e.duracion, ease: e.curva }, e.retraso);
  // Cierra el forEach.
  });
  // Devuelve la timeline armada.
  return tl;
// Cierra la función.
}
// ↑ animarTarjetas: arma una timeline con la entrada escalonada de cada tarjeta.`),
      'src/main.ts': L(`
// Cómo empezar: el punto de entrada busca las tarjetas en la página y arranca la animación.
// La función que arma la animación.
import { animarTarjetas } from "./animar";

// querySelectorAll devuelve una lista que no es un arreglo: Array.from la convierte.
const tarjetas = Array.from(document.querySelectorAll<HTMLElement>(".tarjeta"));
// La preferencia del sistema operativo: si pidió menos movimiento, la respetamos.
const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
// Arma y arranca la animación; tl la controla.
const tl = animarTarjetas(tarjetas, reducido);

// restart() vuelve a reproducir la timeline desde el principio.
document.querySelector("#repetir")?.addEventListener("click", () => {
  // En cada clic, desde el principio.
  tl.restart();
// Cierra la función del clic.
});
// ↑ clic en Repetir: vuelve a ver la entrada completa, para estudiarla otra vez.`)
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
      'package.json': L(`
// Abre el manifiesto. En JSON los comentarios no van: se quitan al guardar.
{
  // El nombre del proyecto.
  "name": "aprender-shaders",
  // La versión del proyecto.
  "version": "1.0.0",
  // "module": los archivos usan import y export.
  "type": "module",
  // Abre los scripts: atajos que se corren con npm run.
  "scripts": {
    // npm run dev abre la página con Vite y recarga al guardar.
    "dev": "vite",
    // npm run build arma la versión final para publicar.
    "build": "vite build",
    // npm test corre los tests una vez.
    "test": "vitest run"
  // Cierra los scripts.
  },
  // Abre las dependencias de desarrollo: herramientas para escribir y probar.
  "devDependencies": {
    // TypeScript, para los tipos.
    "typescript": "^5.9.3",
    // Vite, el servidor de desarrollo (y el que carga los shaders como texto).
    "vite": "^6.4.4",
    // Vitest, el corredor de tests.
    "vitest": "^3.2.7"
  // Cierra las dependencias de desarrollo.
  }
// Cierra el manifiesto.
}`),
      'tsconfig.json': L(`
// Abre la configuración del compilador. tsconfig sí admite comentarios.
{
  // Abre las opciones del compilador.
  "compilerOptions": {
    // target: qué versión de JavaScript se genera.
    "target": "ES2022",
    // module: los archivos son módulos con import y export.
    "module": "ESNext",
    // moduleResolution: Bundler, como resuelve los imports Vite.
    "moduleResolution": "Bundler",
    // lib: conoce el JavaScript moderno y el DOM (la página y WebGL).
    "lib": ["ES2022", "DOM"],
    // strict: el modo más estricto, el que más errores atrapa.
    "strict": true,
    // skipLibCheck: no revisa los tipos de las librerías, solo los tuyos.
    "skipLibCheck": true,
    // noEmit: solo revisa los tipos; Vite arma el código.
    "noEmit": true
  // Cierra las opciones.
  },
  // include: revisa los archivos de src.
  "include": ["src"]
// Cierra la configuración.
}`),
      'src/vite-env.d.ts': L(`
// Cómo empezar: le dice a TypeScript que Vite puede importar archivos como texto (?raw).
// Así los shaders viven en sus propios archivos .vert y .frag, con colores y comentarios.
/// <reference types="vite/client" />`),
      'index.html': L(`
<!-- Cómo empezar: la página es solo un lienzo que ocupa toda la ventana. Lo dibuja la GPU. -->
<!doctype html>
<!-- El documento, en español. -->
<html lang="es">
  <!-- La cabecera: datos de la página que no se ven. -->
  <head>
    <!-- utf-8: para que las tildes y la ñ se vean bien. -->
    <meta charset="utf-8">
    <!-- viewport: el ancho de la página es el de la pantalla (celulares). -->
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <!-- El título de la pestaña. -->
    <title>Tu primer shader</title>
    <!-- Los estilos: el lienzo ocupa toda la ventana, sin márgenes. -->
    <style>
      /* Sin márgenes, alto completo y fondo negro mientras carga. */
      html, body { margin: 0; height: 100%; background: #000; }
      /* El lienzo ocupa todo el ancho y el alto. */
      canvas { display: block; width: 100%; height: 100%; }
      /* Cierra los estilos: la etiqueta de abajo termina el CSS. */
    </style>
  <!-- Cierra la cabecera. -->
  </head>
  <!-- El cuerpo: lo que se ve. -->
  <body>
    <!-- El lienzo donde dibuja la GPU; main.ts lo busca por su id. -->
    <canvas id="lienzo"></canvas>
    <!-- type="module": Vite carga main.ts y recarga al guardar. -->
    <script type="module" src="/src/main.ts"></script>
  <!-- Cierra el cuerpo. -->
  </body>
<!-- Cierra el documento. -->
</html>`),
      'notas/01-shader.md': L(`
> Apunte 1. Qué es un shader, antes de escribir el primero. Todo se escribe, también las explicaciones.
## Un programa por píxel
> Un fragment shader es una función que la GPU ejecuta una vez por cada píxel, todos a la vez. Recibe dónde está el píxel y devuelve su color.
Un shader decide el color de cada píxel.
> Primero hay que saber dónde está cada píxel.
## Coordenadas
> gl_FragCoord dice en qué píxel estás. Dividido por la resolución queda entre 0 y 1: (0, 0) abajo a la izquierda, (1, 1) arriba a la derecha.
uv = posición del píxel entre 0 y 1.
> Después, qué color le toca.
## Colores
> Un color es un vec3 con rojo, verde y azul, cada uno entre 0.0 y 1.0. vec3(1.0, 0.5, 0.0) es naranja.
Un color es vec3(rojo, verde, azul).
\`\`\`glsl
// Mucho rojo, la mitad de verde y nada de azul: naranja.
vec3 naranja = vec3(1.0, 0.5, 0.0);
\`\`\`
> La herramienta que más se usa.
## Mezclar
> mix(a, b, t) mezcla dos valores: con t = 0 da a, con t = 1 da b, y en el medio, una mezcla. Es la herramienta más usada.
mix(a, b, t): de a hacia b según t.
> Y cómo se estudia.
## Cómo estudiar shaders
> Cambia un número y mira qué pasa. Para depurar, muestra el valor que dudas como color: si ves rojo, vale 1.
Depurar: mostrar el valor como color.`),
      'src/color.ts': L(`
// Cómo empezar: las funciones del shader, escritas en TypeScript. Hacen lo mismo que mix y smoothstep
// de GLSL, y así podemos testear la matemática sin GPU antes de usarla en el shader.

// mezclar = mix de GLSL: con t = 0 da a, con t = 1 da b, y en el medio interpola.
// La fórmula es la misma que define GLSL: un poco de a y un poco de b, que siempre suman 1.
export function mezclar(a: number, b: number, t: number): number {
  // (1 - t) de a más t de b.
  return a * (1 - t) + b * t;
// Cierra la función mezclar.
}
// ↑ mezclar: el punto que está a una fracción t del camino entre a y b.

// suavizar = smoothstep: 0 antes de borde0, 1 después de borde1, y una curva suave en el medio.
export function suavizar(borde0: number, borde1: number, x: number): number {
  // t: cuánto avanzó x entre los dos bordes, recortado entre 0 y 1.
  const t = Math.min(Math.max((x - borde0) / (borde1 - borde0), 0), 1);
  // t * t * (3 - 2t): arranca y termina con velocidad cero, por eso no se ven cortes.
  return t * t * (3 - 2 * t);
// Cierra la función suavizar.
}
// ↑ suavizar: pasa de 0 a 1 entre dos bordes, sin saltos.

// Los dos colores del cielo, como en el shader: rojo, verde y azul entre 0 y 1.
// ABAJO: el naranja del horizonte.
export const ABAJO = [0.98, 0.55, 0.3];
// ARRIBA: el azul oscuro del cielo alto.
export const ARRIBA = [0.1, 0.12, 0.35];

// El color del cielo a una altura y (0 abajo, 1 arriba): el mismo cálculo que hace atardecer.frag.
export function cielo(y: number): number[] {
  // t: cuánto de cada color, con una transición suave.
  const t = suavizar(0, 1, y);
  // Mezcla cada canal (rojo, verde, azul) de abajo hacia arriba.
  return ABAJO.map((c, i) => mezclar(c, ARRIBA[i], t));
// Cierra la función cielo.
}
// ↑ cielo: degradado suave del naranja del horizonte al azul de arriba.`),
      'src/color.test.ts': L(`
// Cómo empezar: si la matemática está bien en TypeScript, en el shader también. Probamos los bordes.
// Las piezas de Vitest para escribir tests.
import { describe, expect, it } from "vitest";
// Lo que se prueba: los colores y las tres funciones.
import { ABAJO, ARRIBA, cielo, mezclar, suavizar } from "./color";

// describe agrupa los tests de mezclar y suavizar.
describe("mezclar y suavizar", () => {
  // mix: los extremos y la mitad exacta.
  it("mezclar da a, b y el punto medio", () => {
    // Con t = 0 da 0, con t = 1 da 10 y con t = 0.5 da 5.
    expect([mezclar(0, 10, 0), mezclar(0, 10, 1), mezclar(0, 10, 0.5)]).toEqual([0, 10, 5]);
  // Cierra el caso.
  });
  // smoothstep: fuera de los bordes queda fijo en 0 o 1.
  it("suavizar se queda en 0 y en 1 fuera de los bordes", () => {
    // Antes del borde da 0, después da 1 y en la mitad da 0.5.
    expect([suavizar(0.2, 0.8, 0), suavizar(0.2, 0.8, 1), suavizar(0, 1, 0.5)]).toEqual([0, 1, 0.5]);
  // Cierra el caso.
  });
// Cierra el grupo.
});
// ↑ mezclar y suavizar: comprueba los extremos y el medio de las dos funciones.

// El horizonte es el color de abajo y lo más alto, el de arriba.
it("el cielo va del horizonte al azul", () => {
  // Abajo del todo, ABAJO; arriba del todo, ARRIBA.
  expect([cielo(0), cielo(1)]).toEqual([ABAJO, ARRIBA]);
// Cierra el caso.
});
// ↑ cielo: comprueba que el degradado empieza en el horizonte y termina en el azul.`),
      'src/shaders/pantalla.vert': L(`
// Cómo empezar: el vertex shader ubica los vértices. Aquí solo hace falta un triángulo que tape la pantalla.
// Sin #version: WebGL la exige en la primera línea, y aquí arriba van los comentarios. La agrega webgl.ts.

// in: un dato que llega por vértice desde TypeScript (la posición de cada esquina).
in vec2 a_posicion;

// main se ejecuta una vez por cada esquina.
void main() {
  // gl_Position es la salida obligatoria: x e y entre -1 y 1 cubren la pantalla.
  gl_Position = vec4(a_posicion, 0.0, 1.0);
// Cierra main.
}
// ↑ main: pasa cada esquina del triángulo tal cual; el trabajo de color lo hace el fragment shader.`),
      'src/shaders/atardecer.frag': L(`
// Cómo empezar: el fragment shader corre una vez POR PÍXEL y decide su color.
// highp: precisión alta para los números con coma; sin esto, los degradados se ven escalonados.
precision highp float;

// uniforms: valores iguales para todos los píxeles, que manda TypeScript en cada cuadro.
// u_resolucion: el ancho y el alto del lienzo, en píxeles.
uniform vec2 u_resolucion;
// u_tiempo: los segundos desde que empezó, para animar.
uniform float u_tiempo;
// out: el color que sale de este píxel.
out vec4 color;

// main se ejecuta una vez por cada píxel.
void main() {
  // uv: dónde está el píxel, entre 0 y 1. Es lo primero que calcula casi todo shader.
  vec2 uv = gl_FragCoord.xy / u_resolucion;
  // El cielo: mix entre naranja (abajo) y azul (arriba), con smoothstep para que el paso sea suave.
  // abajo: el naranja del horizonte.
  vec3 abajo = vec3(0.98, 0.55, 0.30);
  // arriba: el azul oscuro del cielo alto.
  vec3 arriba = vec3(0.10, 0.12, 0.35);
  // Mezcla los dos según la altura del píxel (uv.y).
  vec3 cielo = mix(abajo, arriba, smoothstep(0.0, 1.0, uv.y));
  // aspecto: corrige que la pantalla no es cuadrada; sin esto, el sol sale ovalado.
  vec2 aspecto = vec2(u_resolucion.x / u_resolucion.y, 1.0);
  // El sol sube y baja despacio: sin(u_tiempo) va de -1 a 1 y lo achicamos a un movimiento chico.
  vec2 centro = vec2(0.5, 0.3 + 0.05 * sin(u_tiempo * 0.5));
  // d: qué tan lejos está el píxel del centro del sol.
  float d = distance(uv * aspecto, centro * aspecto);
  // sol: 1 dentro del círculo, 0 fuera; smoothstep entre 0.10 y 0.11 suaviza el borde.
  float sol = 1.0 - smoothstep(0.10, 0.11, d);
  // El color final: el cielo, con el amarillo del sol encima donde sol vale 1.
  color = vec4(mix(cielo, vec3(1.0, 0.85, 0.45), sol), 1.0);
// Cierra main.
}
// ↑ main: pinta un cielo en degradado y encima un sol redondo que sube y baja con el tiempo.`),
      'notas/02-uniforms.md': L(`
> Apunte 2. Cómo se conectan TypeScript y la GPU: compilar, enlazar y mandar datos.
## Compilar y enlazar
> Los shaders se compilan en la GPU mientras corre la página. Un vertex y un fragment shader juntos forman un programa.
vertex + fragment = programa.
> Después, cómo se le mandan datos.
## Uniforms
> Un uniform es un dato que TypeScript manda y todos los píxeles leen igual: el tiempo para animar, la resolución para las coordenadas.
Un uniform es igual para todos los píxeles.
\`\`\`ts
// Manda un número (1f: un float) al uniform del tiempo.
gl.uniform1f(lugarTiempo, segundos);
\`\`\`
> Y cómo se dibuja una y otra vez.
## El bucle
> requestAnimationFrame llama a dibujar unas 60 veces por segundo. En cada vuelta: actualizar el tiempo y dibujar.
Cada cuadro: actualizar uniforms y dibujar.`),
      'src/webgl.ts': L(`
// Cómo empezar: dos funciones que hacen el trabajo repetitivo de WebGL: compilar y enlazar.
// Si un shader tiene un error, lo mostramos con el mensaje de la GPU, que dice la línea.

// WebGL exige que #version sea la PRIMERA línea. Como los archivos empiezan con comentarios
// (la explicación), la versión se agrega aquí: GLSL ES 3.0, la de WebGL2.
const VERSION = "#version 300 es\\n";

// Compila un shader de un tipo (vértices o fragmentos) a partir de su texto.
export function compilar(gl: WebGL2RenderingContext, tipo: number, fuente: string): WebGLShader {
  // Crea un shader vacío del tipo pedido.
  const shader = gl.createShader(tipo)!;
  // Le carga el texto, con la versión delante.
  gl.shaderSource(shader, VERSION + fuente);
  // La GPU lo compila.
  gl.compileShader(shader);
  // Si no compiló, el log dice qué línea falló. Lanzar el error lo hace visible en la consola.
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    // El error lleva el mensaje de la GPU.
    throw new Error("El shader no compiló:\\n" + gl.getShaderInfoLog(shader));
  // Cierra el if.
  }
  // Devuelve el shader compilado.
  return shader;
// Cierra la función compilar.
}
// ↑ compilar: convierte el texto GLSL en un shader de la GPU, o explica por qué no pudo.

// Une el vertex y el fragment shader en un programa listo para dibujar.
export function crearPrograma(gl: WebGL2RenderingContext, vertice: string, fragmento: string): WebGLProgram {
  // Crea un programa vacío.
  const programa = gl.createProgram()!;
  // Le agrega el vertex shader compilado.
  gl.attachShader(programa, compilar(gl, gl.VERTEX_SHADER, vertice));
  // Le agrega el fragment shader compilado.
  gl.attachShader(programa, compilar(gl, gl.FRAGMENT_SHADER, fragmento));
  // Enlaza los dos: comprueba que encajan.
  gl.linkProgram(programa);
  // Si no enlazó, lo explica con el mensaje de la GPU.
  if (!gl.getProgramParameter(programa, gl.LINK_STATUS)) {
    // El error lleva el mensaje de la GPU.
    throw new Error("El programa no enlazó:\\n" + gl.getProgramInfoLog(programa));
  // Cierra el if.
  }
  // Devuelve el programa listo.
  return programa;
// Cierra la función crearPrograma.
}
// ↑ crearPrograma: compila los dos shaders y los enlaza en un solo programa.`),
      'src/main.ts': L(`
// Cómo empezar: preparar el lienzo, darle a la GPU un triángulo que tape la pantalla y dibujar en bucle.
// La función que compila y enlaza los shaders.
import { crearPrograma } from "./webgl";
// ?raw: Vite importa el archivo como texto. Así los shaders se escriben en sus propios archivos.
import vertice from "./shaders/pantalla.vert?raw";
// El fragment shader, también como texto.
import fragmento from "./shaders/atardecer.frag?raw";

// Busca el lienzo por su id; el ! dice que seguro existe.
const lienzo = document.querySelector<HTMLCanvasElement>("#lienzo")!;
// webgl2: el contexto que entiende GLSL ES 3.0. Si el navegador no lo tiene, avisamos.
const gl = lienzo.getContext("webgl2");
// Si no hay WebGL2, no se puede seguir.
if (!gl) {
  // El error explica qué falta.
  throw new Error("Este navegador no tiene WebGL2");
// Cierra el if.
}
// ↑ if: sin WebGL2 no hay nada que dibujar; el error lo explica.

// Compila y enlaza los dos shaders.
const programa = crearPrograma(gl, vertice, fragmento);
// Usa ese programa para dibujar.
gl.useProgram(programa);

// Tres esquinas que forman un triángulo más grande que la pantalla: la cubre entera con un solo dibujo.
const esquinas = new Float32Array([-1, -1, 3, -1, -1, 3]);
// Crea un buffer (memoria en la GPU) y lo deja activo.
gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
// Copia las esquinas al buffer; STATIC_DRAW: no van a cambiar.
gl.bufferData(gl.ARRAY_BUFFER, esquinas, gl.STATIC_DRAW);
// a_posicion lee de a 2 números (x, y) por vértice.
const lugarPosicion = gl.getAttribLocation(programa, "a_posicion");
// Activa ese dato de entrada.
gl.enableVertexAttribArray(lugarPosicion);
// Le dice cómo leer el buffer: de a 2 números con coma por vértice.
gl.vertexAttribPointer(lugarPosicion, 2, gl.FLOAT, false, 0, 0);

// Dónde viven los uniforms dentro del programa: se buscan una vez y se usan en cada cuadro.
const lugarResolucion = gl.getUniformLocation(programa, "u_resolucion");
// El lugar del uniform del tiempo.
const lugarTiempo = gl.getUniformLocation(programa, "u_tiempo");
// Con movimiento reducido, el sol queda quieto.
const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// dibujar recibe los milisegundos desde que abrió la página.
function dibujar(ms: number) {
  // El lienzo tiene que medir lo mismo que en pantalla, o la imagen se ve borrosa.
  lienzo.width = lienzo.clientWidth;
  // Lo mismo con el alto.
  lienzo.height = lienzo.clientHeight;
  // Dibuja en todo el lienzo.
  gl!.viewport(0, 0, lienzo.width, lienzo.height);
  // Manda el tamaño del lienzo al shader.
  gl!.uniform2f(lugarResolucion, lienzo.width, lienzo.height);
  // Manda el tiempo en segundos (0 con movimiento reducido).
  gl!.uniform1f(lugarTiempo, reducido ? 0 : ms / 1000);
  // Dibuja el triángulo: 3 vértices.
  gl!.drawArrays(gl!.TRIANGLES, 0, 3);
  // Pide dibujar otra vez en el próximo cuadro.
  requestAnimationFrame(dibujar);
// Cierra la función dibujar.
}
// ↑ dibujar: ajusta el tamaño, manda resolución y tiempo, dibuja y pide el siguiente cuadro.
// Arranca el bucle con el primer cuadro.
requestAnimationFrame(dibujar);`)
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
  },
  {
    id: 'shaders-fondo-vivo',
    tema: 'Efectos WebGPU por capas (Shaders)',
    topicId: 'shaders-capas',
    titulo: 'Un fondo vivo con Shaders',
    dificultad: 'media',
    duracion: '2 horas',
    proyecto: 'un fondo animado por capas con la librería Shaders (WebGPU): degradado, seda líquida, puntos con máscara, un halo propio en WGSL y la estela del cursor; explica cada capa, los uniforms y el respaldo sin WebGPU',
    stack: { resumen: 'Shaders 4.0.4 (WebGPU) + Vite + TypeScript + Vitest', lenguaje: 'TypeScript 5', framework: 'Shaders 4 + Vite 6', tests: 'Vitest' },
    convenciones: ['ES modules', 'la escena como datos en src/escena.ts, pura y testeada', 'solo src/main.ts toca la GPU', 'versión fija de shaders (4.0.4)', 'detectar WebGPU y dejar un respaldo de CSS', 'respetar prefers-reduced-motion'],
    arquitectura: 'componentes',
    objetivos: ['escenas por capas', 'uniforms y tiempo', 'máscaras y modos de mezcla', 'respaldo sin WebGPU', 'un efecto propio en WGSL'],
    entorno: {
      instalar: [{ comando: 'npm install shaders@4.0.4 && npm install -D vite typescript vitest', explicacion: 'Shaders dibuja con WebGPU; Vite sirve la página y recarga al guardar; TypeScript y Vitest para escribir y probar.' }],
      ejecutar: { comando: 'npx vite', explicacion: 'Abre http://localhost:5173 en Chrome, Edge o Safari 26 y mueve el mouse.' },
      testear: { comando: 'npx vitest run', explicacion: 'Prueba la escena y los mensajes, sin GPU.' }
    },
    plan: [
      { paso: 'Manifiesto del proyecto', tipo: 'config', archivo: 'package.json', concepto: 'versión fija de una librería' },
      { paso: 'Configurar TypeScript', tipo: 'config', archivo: 'tsconfig.json', concepto: 'modo estricto con Vite' },
      { paso: 'Apunte: capas y WebGPU', tipo: 'teoria', archivo: 'notas/01-capas.md', concepto: 'escenas por capas' },
      { paso: 'La página y su respaldo', tipo: 'codigo', archivo: 'index.html', concepto: 'respaldo de CSS sin WebGPU' },
      { paso: 'Apunte: uniforms, ruido y máscaras', tipo: 'teoria', archivo: 'notas/02-uniforms.md', concepto: 'uniforms' },
      { paso: 'La escena como datos', tipo: 'codigo', archivo: 'src/escena.ts', concepto: 'capas, máscaras y movimiento reducido' },
      { paso: 'Tests de la escena', tipo: 'test', archivo: 'src/escena.test.ts', concepto: 'testear sin GPU', verificar: 'npx vitest run' },
      { paso: 'Apunte: tu efecto en WGSL', tipo: 'teoria', archivo: 'notas/03-wgsl.md', concepto: 'WGSL' },
      { paso: 'El halo en WGSL', tipo: 'codigo', archivo: 'src/halo.ts', concepto: 'defineShader y smoothstep' },
      { paso: 'Conectar la página con la GPU', tipo: 'codigo', archivo: 'src/main.ts', concepto: 'createShader y update' },
      { paso: 'Verlo y variar un valor', tipo: 'comando', comando: 'npx vite', explicacion: 'Se ve el degradado con la seda, los puntos y el halo que sigue al mouse. Mueve el control del ángulo. Si dice «WebGPU: no», ves el respaldo de CSS: prueba en Chrome, Edge o Safari 26. Después cambia un valor por vez en src/escena.ts y compara.' }
    ],
    guia: SHADERS_GUIA,
    archivos: {
      'package.json': L(`
// Abre el manifiesto. En JSON los comentarios no van: se quitan al guardar.
{
  // El nombre del proyecto.
  "name": "fondo-vivo-con-shaders",
  // La versión del proyecto.
  "version": "1.0.0",
  // "module": los archivos usan import y export.
  "type": "module",
  // Abre los scripts: atajos que se corren con npm run.
  "scripts": {
    // npm run dev abre la página con Vite y recarga al guardar.
    "dev": "vite",
    // npm run build arma la versión final para publicar.
    "build": "vite build",
    // npm test corre los tests una vez.
    "test": "vitest run"
  // Cierra los scripts.
  },
  // Abre las dependencias: lo que la página necesita para funcionar.
  "dependencies": {
    // Shaders, versión fija: desde la 4 es MIT y la API todavía cambia rápido.
    "shaders": "4.0.4"
  // Cierra las dependencias.
  },
  // Abre las dependencias de desarrollo: herramientas para escribir y probar.
  "devDependencies": {
    // TypeScript, para los tipos.
    "typescript": "^5.9.3",
    // Vite, el servidor de desarrollo.
    "vite": "^6.4.4",
    // Vitest, el corredor de tests.
    "vitest": "^3.2.7"
  // Cierra las dependencias de desarrollo.
  }
// Cierra el manifiesto.
}`),
      'tsconfig.json': L(`
// Abre la configuración del compilador. tsconfig sí admite comentarios.
{
  // Abre las opciones del compilador.
  "compilerOptions": {
    // target: qué versión de JavaScript se genera.
    "target": "ES2022",
    // module: los archivos son módulos con import y export.
    "module": "ESNext",
    // moduleResolution: Bundler, como resuelve los imports Vite (también "shaders/js").
    "moduleResolution": "Bundler",
    // lib: conoce el JavaScript moderno y el DOM (la página).
    "lib": ["ES2022", "DOM"],
    // strict: el modo más estricto, el que más errores atrapa.
    "strict": true,
    // skipLibCheck: no revisa los tipos de las librerías, solo los tuyos.
    "skipLibCheck": true,
    // noEmit: solo revisa los tipos; Vite arma el código.
    "noEmit": true
  // Cierra las opciones.
  },
  // include: revisa los archivos de src.
  "include": ["src"]
// Cierra la configuración.
}`),
      'notas/01-capas.md': L(`
> Apunte 1. Qué es Shaders y cómo piensa una escena. Todo se escribe, también las explicaciones.
## Shaders: efectos por capas
> Shaders (paquete npm "shaders", de Shader Effects, Inc.) trae unos 200 efectos listos que dibuja la GPU. Desde la versión 4 es código abierto, con licencia MIT.
Shaders: unos 200 efectos que dibuja la GPU.
> Un shader es un programa chico que corre una vez POR PÍXEL, todos a la vez, en la placa de video. Por eso puede animar millones de píxeles sin trabarse.
Un shader corre una vez por píxel.
> La segunda idea: las capas.
## Capas, como en Figma
> Un lienzo, varias capas. La primera queda al fondo y cada una se dibuja encima de la anterior.
La primera capa queda al fondo.
> Hay dos tipos: los generadores dibujan algo (un degradado, puntos); los efectos cambian lo que ya está dibujado (una distorsión, un desenfoque).
Generadores dibujan; efectos modifican.
\`\`\`js
// Crea el shader en un lienzo, con una lista de capas.
const shader = await createShader(lienzo, {
  // Abre la lista de capas, de abajo hacia arriba.
  components: [
    // La base: un degradado del azul noche al violeta.
    { type: "LinearGradient", id: "degrade", props: { colorA: "#0f172a", colorB: "#7c3aed" } },
    // Encima: la estela que deja el mouse.
    { type: "CursorTrail", id: "estela", props: {} },
  // Cierra la lista.
  ],
// Cierra la llamada.
});
\`\`\`
> La tercera idea: solo WebGPU.
## Solo WebGPU
> La librería usa únicamente WebGPU: no tiene plan B con WebGL. Sin WebGPU el lienzo queda transparente y no avisa nada.
Sin WebGPU, el lienzo queda transparente.
> Por eso siempre: primero preguntas si hay WebGPU, y debajo del lienzo dejas un degradado de CSS de respaldo.
Primero preguntar; siempre un respaldo de CSS.
> WebGPU funciona en Chrome y Edge actuales, en Safari 26 y en Firefox de Windows, y solo en páginas https o en localhost.
Chrome, Edge, Safari 26, Firefox en Windows; https.`),
      'index.html': L(`
<!-- Cómo empezar: primero la página y su texto. El fondo animado es decoración: sin él, todo se lee igual. -->
<!doctype html>
<!-- El documento, en español. -->
<html lang="es">
  <!-- La cabecera: datos de la página que no se ven. -->
  <head>
    <!-- utf-8: para que las tildes y la ñ se vean bien. -->
    <meta charset="utf-8">
    <!-- viewport: el ancho de la página es el de la pantalla (celulares). -->
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <!-- El título de la pestaña. -->
    <title>Un fondo vivo con Shaders</title>
    <!-- Estilos: el lienzo detrás, el texto encima y un degradado CSS de respaldo. -->
    <style>
      /* El cuerpo: sin márgenes, letra del sistema y texto claro. */
      body { margin: 0; font-family: system-ui, sans-serif; color: #f5f3ff; background: #0f172a; }
      /* El escenario: llena la pantalla. Su degradado CSS es el respaldo si no hay WebGPU. */
      .escenario { position: relative; min-height: 100vh; display: grid; place-items: center; overflow: hidden; background: linear-gradient(135deg, #0f172a, #7c3aed); }
      /* El lienzo: cubre el escenario. Si no dibuja queda transparente y se ve el respaldo. */
      #fondo { position: absolute; inset: 0; width: 100%; height: 100%; }
      /* El contenido: encima del lienzo, en una caja oscura para que el texto contraste. */
      .contenido { position: relative; max-width: 30rem; margin: 1rem; padding: 1.5rem; border-radius: 16px; background: rgb(15 23 42 / 0.65); }
      /* El estado: más chico y suave. */
      #estado { font-size: 0.9rem; opacity: 0.85; }
      /* Cierra los estilos: la etiqueta de abajo termina el CSS. */
    </style>
  <!-- Cierra la cabecera. -->
  </head>
  <!-- El cuerpo: lo que se ve. -->
  <body>
    <!-- main: el escenario con el fondo y el contenido. -->
    <main class="escenario">
      <!-- El lienzo donde dibuja la GPU. aria-hidden: es decoración, un lector de pantalla no lo anuncia. -->
      <canvas id="fondo" aria-hidden="true"></canvas>
      <!-- El contenido, encima del fondo. -->
      <section class="contenido">
        <!-- El título. -->
        <h1>Un fondo vivo</h1>
        <!-- Qué es lo que se ve. -->
        <p>Capas que dibuja la GPU, una encima de otra, como en Figma. Mueve el mouse.</p>
        <!-- La etiqueta del control: dice qué cambia. -->
        <label for="angulo">Ángulo del degradado</label>
        <!-- El control: de 0 a 100; main.ts lo convierte en grados. -->
        <input id="angulo" type="range" min="0" max="100" value="25">
        <!-- El estado de WebGPU: main.ts escribe acá si dibuja o por qué no. -->
        <p id="estado">Buscando WebGPU…</p>
      <!-- Cierra el contenido. -->
      </section>
    <!-- Cierra el escenario. -->
    </main>
    <!-- type="module": Vite carga main.ts y recarga al guardar. -->
    <script type="module" src="/src/main.ts"></script>
  <!-- Cierra el cuerpo. -->
  </body>
<!-- Cierra el documento. -->
</html>`),
      'notas/02-uniforms.md': L(`
> Apunte 2. Qué pasa por dentro: uniforms, tiempo, coordenadas, ruido y máscaras.
## Uniforms
> Un uniform es un valor que la GPU lee en cada cuadro, igual para todos los píxeles: como una variable de CSS que el shader puede ver.
Uniform: un valor que la GPU lee en cada cuadro.
> Cambiar un uniform es barato: no se recompila nada. Por eso un control puede mover el ángulo en vivo.
\`\`\`js
// Cambia solo el ángulo de la capa "degrade": la GPU no recompila.
shader.update("degrade", { angle: 90 });
\`\`\`
> El tiempo también es un uniform: cada efecto animado lo lee para moverse. La prop speed lo multiplica; en 0, la capa queda quieta.
speed en 0: la capa queda quieta.
> La segunda idea: dónde está cada píxel.
## Coordenadas uv
> Cada píxel sabe dónde está con uv: x e y van de 0 a 1 a lo ancho y a lo alto del lienzo (y crece hacia abajo).
uv: de 0 a 1, de borde a borde.
> El centro del lienzo es { x: 0.5, y: 0.5 }. Así se ubican centros, focos y máscaras.
El centro es x 0.5, y 0.5.
> La tercera idea: el ruido.
## Ruido y fBm
> El ruido es azar suave: valores que cambian de a poco. FlowingGradient y FractalNoise lo usan para parecer naturales.
Ruido: azar suave.
> fBm (movimiento browniano fraccional) suma varias capas de ruido, cada una con el doble de detalle y la mitad de fuerza. Así nacen nubes, humo y seda.
fBm: ruido sobre ruido, cada vez más fino y más débil.
> La cuarta idea: cómo se juntan las capas.
## Mezcla y máscaras
> blendMode dice cómo se mezcla una capa con lo de abajo: softLight suaviza, screen aclara, multiply oscurece.
blendMode: cómo se mezcla con lo de abajo.
> Una máscara usa otra capa para decidir dónde se ve esta: con luminance, se ve más donde la otra es clara.
\`\`\`js
// Los puntos se ven según el brillo de la capa "degrade".
{ type: "DotGrid", id: "puntos", props: { maskSource: "degrade", maskType: "luminance" } }
\`\`\`
> La última: cuidar a quien mira.
## Accesibilidad y rendimiento
> Si el sistema pide reducir el movimiento (prefers-reduced-motion), la escena va quieta. La librería no lo hace sola: lo haces tú.
Movimiento reducido: la escena va quieta.
> Cada máscara o efecto que mira a sus vecinos suma una pasada más. Para ocultar una capa, visible: false; con opacity en 0 se sigue dibujando.
Ocultar con visible false, no con opacity 0.`),
      'src/escena.ts': L(`
// Cómo empezar: la escena son DATOS. createShader recibe una lista de capas
// (objetos comunes), así que se arma con funciones puras y se testea sin GPU.

// Una capa: qué componente es, su nombre (id) y sus valores (props).
export interface Capa {
  // type: el componente de la librería, con su nombre exacto (FlowingGradient).
  type: string;
  // id: el nombre de la capa, para cambiarla después o usarla de máscara.
  id: string;
  // props: los valores de la capa (colores, velocidad, modo de mezcla).
  props: Record<string, unknown>;
// Cierra la interfaz Capa.
}
// ↑ Capa: la forma de cada capa de la escena.

// La paleta en un solo lugar: noche, violeta y coral.
export const COLORES = { noche: "#0f172a", violeta: "#7c3aed", coral: "#ff6b6b" };

// Declara anguloDesdeSlider: el control va de 0 a 100; el degradado usa grados.
export function anguloDesdeSlider(valor: number): number {
  // Si llega algo fuera de 0..100, lo recorta: Math.min y Math.max.
  const recortado = Math.min(100, Math.max(0, valor));
  // 100 pasos son 360 grados: cada paso vale 3.6. Redondea para no tener decimales.
  return Math.round(recortado * 3.6);
// Cierra la función anguloDesdeSlider.
}
// ↑ anguloDesdeSlider: convierte la posición del control en grados.

// Las opciones de la escena: el ángulo inicial y si la persona pidió menos movimiento.
export interface Opciones {
  // angulo: en grados, de 0 a 360.
  angulo: number;
  // reducido: true si el sistema tiene activado "reducir movimiento".
  reducido: boolean;
// Cierra la interfaz Opciones.
}
// ↑ Opciones: lo que decide cómo se arma la escena.

// Declara capas: devuelve la escena, de abajo hacia arriba (la primera queda al fondo).
export function capas(opciones: Opciones): Capa[] {
  // Con movimiento reducido, todo lo que se mueve va en 0: la escena queda quieta.
  const movimiento = opciones.reducido ? 0 : 1;
  // Arma la lista de capas, en orden.
  const lista: Capa[] = [
    // Capa 1, la base: un degradado lineal. Su ángulo es un uniform: cambiarlo no recompila.
    { type: "LinearGradient", id: "degrade", props: { colorA: COLORES.noche, colorB: COLORES.violeta, angle: opciones.angulo, colorSpace: "oklch" } },
    // Capa 2: seda líquida encima. softLight la mezcla con la base en vez de taparla.
    { type: "FlowingGradient", id: "seda", props: { speed: 0.6 * movimiento, distortion: 0.5, blendMode: "softLight", opacity: 0.8 } },
    // Capa 3: puntos que titilan. La máscara usa el brillo del degradado: se ven más donde es claro.
    { type: "DotGrid", id: "puntos", props: { color: "#ffffff", density: 40, dotSize: 0.12, twinkle: 0.8 * movimiento, maskSource: "degrade", maskType: "luminance" } },
    // Capa 4: el halo (lo escribimos en WGSL). Con movimiento sigue al mouse; si no, queda en el centro.
    { type: "Halo", id: "halo", props: { color: COLORES.coral, radius: 0.35, blendMode: "screen", center: opciones.reducido ? { x: 0.5, y: 0.5 } : { type: "mouse-position", smoothing: 0.1 } } },
  // Cierra la lista.
  ];
  // Con movimiento reducido no agrega la estela del cursor: es puro movimiento.
  if (!opciones.reducido) {
    // Capa 5, arriba de todo: la estela que deja el mouse.
    lista.push({ type: "CursorTrail", id: "estela", props: { colorA: COLORES.coral, colorB: COLORES.violeta, length: 0.6 } });
  // Cierra el if.
  }
  // Devuelve la escena.
  return lista;
// Cierra la función capas.
}
// ↑ capas: la escena como datos; con movimiento reducido, quieta y sin estela.

// Los motivos por los que no dibuja, explicados para la persona (no para la máquina).
const MOTIVOS: Record<string, string> = {
  // El navegador no trae WebGPU.
  unsupported: "este navegador no tiene WebGPU. Prueba Chrome o Edge actuales, o Safari 26.",
  // Hay WebGPU pero no se consiguió la placa de video.
  "no-adapter": "WebGPU existe pero no dio acceso a la placa de video (aceleración por hardware apagada o driver bloqueado).",
  // Se consiguió la placa, pero no el dispositivo.
  "no-device": "la placa de video no aceptó crear el dispositivo de WebGPU.",
// Cierra los motivos.
};
// ↑ MOTIVOS: cada código de error de la librería, en palabras.

// Declara mensajeSoporte: convierte el resultado de getWebGPUSupport en una frase.
export function mensajeSoporte(info: { supported: boolean; reason?: string }): string {
  // Si hay soporte, lo dice y listo.
  if (info.supported) return "WebGPU: sí. El fondo lo dibuja la GPU.";
  // Busca el motivo; si no lo conoce, muestra el código tal cual.
  const motivo = MOTIVOS[info.reason ?? ""] ?? \`no se pudo dibujar (\${info.reason ?? "motivo desconocido"}).\`;
  // Arma la frase: se ve el degradado de respaldo y no es un error del código.
  return \`WebGPU: no — \${motivo} Ves el degradado de respaldo: no es un error de tu código.\`;
// Cierra la función mensajeSoporte.
}
// ↑ mensajeSoporte: explica si dibuja la GPU o por qué se ve el respaldo.`),
      'src/escena.test.ts': L(`
// Cómo empezar: probamos los datos de la escena, sin GPU ni navegador.
import { describe, expect, it } from "vitest";
// Trae lo que vamos a probar.
import { anguloDesdeSlider, capas, mensajeSoporte } from "./escena";

// describe agrupa los tests del control.
describe("anguloDesdeSlider", () => {
  // Los dos extremos y el medio: 0 → 0°, 50 → 180°, 100 → 360°.
  it("convierte 0..100 en 0..360 grados", () => {
    // toEqual compara la lista entera.
    expect([0, 50, 100].map(anguloDesdeSlider)).toEqual([0, 180, 360]);
  // Cierra el caso.
  });
  // El borde: lo que se pasa de rango se recorta.
  it("recorta lo que queda fuera de rango", () => {
    // -10 queda en 0 y 150 en 360.
    expect([anguloDesdeSlider(-10), anguloDesdeSlider(150)]).toEqual([0, 360]);
  // Cierra el caso.
  });
// Cierra el grupo del control.
});
// ↑ anguloDesdeSlider: el centro y los bordes.

// describe agrupa los tests de la escena.
describe("capas", () => {
  // El orden importa: la primera capa queda al fondo.
  it("arma las capas de abajo hacia arriba", () => {
    // Pide la escena con movimiento.
    const escena = capas({ angulo: 90, reducido: false });
    // Compara solo los ids, en orden.
    expect(escena.map((c) => c.id)).toEqual(["degrade", "seda", "puntos", "halo", "estela"]);
  // Cierra el caso.
  });
  // La máscara apunta a una capa que existe: si no, la librería la ignora.
  it("la máscara de los puntos usa el degradado", () => {
    // Busca la capa de los puntos.
    const puntos = capas({ angulo: 0, reducido: false }).find((c) => c.id === "puntos");
    // La fuente de la máscara es el degradado y se usa su brillo.
    expect([puntos?.props.maskSource, puntos?.props.maskType]).toEqual(["degrade", "luminance"]);
  // Cierra el caso.
  });
  // Accesibilidad: con movimiento reducido, nada se mueve.
  it("con movimiento reducido queda quieta y sin estela", () => {
    // Pide la escena con movimiento reducido.
    const escena = capas({ angulo: 0, reducido: true });
    // Junta la velocidad de la seda, el titileo de los puntos y si existe la estela.
    const valores = [escena[1].props.speed, escena[2].props.twinkle, escena.some((c) => c.id === "estela")];
    // Todo en 0 y sin estela.
    expect(valores).toEqual([0, 0, false]);
  // Cierra el caso.
  });
// Cierra el grupo de la escena.
});
// ↑ capas: el orden, la máscara y el movimiento reducido.

// describe agrupa los tests del mensaje.
describe("mensajeSoporte", () => {
  // Con soporte, avisa que dibuja la GPU.
  it("con WebGPU dice que dibuja la GPU", () => {
    // toContain busca un pedazo del texto.
    expect(mensajeSoporte({ supported: true })).toContain("WebGPU: sí");
  // Cierra el caso.
  });
  // Sin soporte, explica el motivo y aclara que no es un error del código.
  it("sin WebGPU explica el motivo", () => {
    // Arma el mensaje para un navegador sin WebGPU.
    const texto = mensajeSoporte({ supported: false, reason: "unsupported" });
    // Tiene que nombrar el navegador y aclarar que no es tu código.
    expect([texto.includes("Chrome"), texto.includes("no es un error de tu código")]).toEqual([true, true]);
  // Cierra el caso.
  });
  // Un motivo desconocido se muestra tal cual, para poder buscarlo.
  it("un motivo desconocido aparece tal cual", () => {
    // gpu-error no está en la lista.
    expect(mensajeSoporte({ supported: false, reason: "gpu-error" })).toContain("gpu-error");
  // Cierra el caso.
  });
// Cierra el grupo del mensaje.
});
// ↑ mensajeSoporte: con soporte, sin soporte y con un motivo desconocido.`),
      'notas/03-wgsl.md': L(`
> Apunte 3. Escribir tu propio efecto en WGSL, el lenguaje de los shaders de WebGPU.
## defineShader
> defineShader crea un componente propio: un nombre, sus props y un cuerpo que dice de qué color pinta cada píxel.
defineShader: nombre, props y cuerpo.
> El cuerpo se escribe en WGSL dentro de wgsl\`…\`. Ahí ya existen uv, aspect (ancho dividido alto) y cada prop por su nombre.
En el cuerpo existen uv, aspect y las props.
> La segunda idea: las herramientas.
## length, smoothstep y vec4f
> length mide la distancia de un punto al origen. Restando el centro, mide la distancia al centro.
\`\`\`wgsl
// La distancia del píxel al centro.
let d = length(uv - center);
\`\`\`
> smoothstep(a, b, x) da 0 antes de a, 1 después de b y una subida suave en el medio: bordes sin serrucho.
smoothstep: un borde suave entre a y b.
> vec4f(r, g, b, a) es un color con transparencia: a en 1 es opaco, en 0 invisible.
vec4f: rojo, verde, azul y transparencia.
> La tercera idea: por qué aspect.
## El círculo que no es óvalo
> uv va de 0 a 1 en los dos ejes aunque el lienzo sea ancho: sin corregir, un círculo sale estirado.
uv estira en un lienzo ancho.
> Multiplicar x por aspect devuelve las proporciones reales: el círculo vuelve a ser círculo.
x por aspect: el círculo vuelve a ser círculo.`),
      'src/halo.ts': L(`
// Cómo empezar: un componente propio. defineShader le da nombre y props,
// y el cuerpo en WGSL dice de qué color pinta CADA píxel.
import { defineShader, transformColor, transformPosition, wgsl } from "shaders/std";

// Declara el componente Halo: un círculo de luz con borde suave.
export const Halo = defineShader({
  // name: con este nombre se usa en la escena ({ type: "Halo" }).
  name: "Halo",
  // Abre las props: los valores que se pueden cambiar desde afuera.
  props: {
    // color: el color de la luz; transformColor acepta "#ffd166" o "coral".
    color: { default: "#ffd166", transform: transformColor },
    // center: el centro, en coordenadas uv (0 a 1). Puede seguir al mouse.
    center: { default: { x: 0.5, y: 0.5 }, transform: transformPosition },
    // radius: el tamaño, en proporción de la altura del lienzo.
    radius: { default: 0.35 },
  // Cierra las props.
  },
  // paint: el cuerpo en WGSL. Corre una vez por píxel; uv, aspect y las props ya existen.
  paint: wgsl\`
    // d: la distancia del píxel al centro, dividida por el radio (1 = el borde).
    // Se multiplica x por aspect para que en un lienzo ancho sea un círculo y no un óvalo.
    let d = length((uv - center) * vec2f(aspect, 1.0)) / radius;
    // Devuelve el color con transparencia: opaco adentro y se apaga suave entre 0.8 y 1.
    return vec4f(color.rgb, 1.0 - smoothstep(0.8, 1.0, d));
    // Cierra el cuerpo en WGSL: la comilla invertida de abajo termina el texto.
  \`,
// Cierra la definición.
});
// ↑ Halo: un círculo de luz que se dibuja píxel por píxel en la GPU.`),
      'src/main.ts': L(`
// Cómo empezar: main.ts conecta la página con la GPU. Primero pregunta si hay
// WebGPU; recién después crea el shader. Sin WebGPU, queda el respaldo de CSS.
import { createShader, getWebGPUSupport } from "shaders/js";
// Trae la escena (datos) y las funciones que ya probaste.
import { anguloDesdeSlider, capas, mensajeSoporte } from "./escena";
// Trae el componente propio escrito en WGSL.
import { Halo } from "./halo";

// El lienzo donde dibuja la GPU.
const lienzo = document.querySelector<HTMLCanvasElement>("#fondo")!;
// El control del ángulo.
const control = document.querySelector<HTMLInputElement>("#angulo")!;
// El párrafo donde se avisa si hay WebGPU.
const estado = document.querySelector<HTMLElement>("#estado")!;
// true si la persona pidió menos movimiento en su sistema.
const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Declara arrancar: async porque preguntar por la GPU y crear el shader llevan tiempo.
async function arrancar(): Promise<void> {
  // Pregunta si hay WebGPU de verdad (no solo si existe navigator.gpu).
  const soporte = await getWebGPUSupport();
  // Muestra el resultado en la página.
  estado.textContent = mensajeSoporte(soporte);
  // Sin WebGPU no crea nada: se ve el degradado de CSS.
  if (!soporte.supported) return;
  // La escena inicial, con el ángulo que tiene el control.
  const escena = capas({ angulo: anguloDesdeSlider(Number(control.value)), reducido });
  // Crea el shader: el lienzo, las capas y las opciones.
  const shader = await createShader(lienzo, { components: escena }, {
    // components: los componentes propios que usa la escena (el Halo).
    components: [Halo],
    // disableTelemetry: sin esto, en 1 de cada 20 visitas manda a shaders.com el rendimiento, el dominio y el navegador.
    disableTelemetry: true,
    // onError: si la GPU falla después de arrancar, lo cuenta en la página.
    onError: (motivo) => { estado.textContent = mensajeSoporte({ supported: false, reason: motivo }); },
  // Cierra las opciones y la llamada.
  });
  // Al mover el control, cambia solo el ángulo: es un uniform, la GPU no recompila.
  control.addEventListener("input", () => shader.update("degrade", { angle: anguloDesdeSlider(Number(control.value)) }));
  // Al irse de la página, libera la memoria de la GPU.
  window.addEventListener("pagehide", () => shader.destroy());
// Cierra la función arrancar.
}
// ↑ arrancar: comprueba WebGPU, crea el shader y conecta el control.

// Arranca. Si algo falla, lo muestra en la página en vez de dejarla en blanco.
arrancar().catch((error) => { estado.textContent = \`No se pudo arrancar: \${error}\`; });`)
    },
    conceptos: {
      'notas/01-capas.md': ['escenas por capas', 'webgpu'],
      'index.html': ['respaldo sin webgpu', 'aria-hidden'],
      'notas/02-uniforms.md': ['uniforms', 'coordenadas uv', 'fbm', 'mascaras'],
      'src/escena.ts': ['capas', 'mascaras', 'prefers-reduced-motion'],
      'src/escena.test.ts': ['tests'],
      'notas/03-wgsl.md': ['wgsl', 'smoothstep'],
      'src/halo.ts': ['defineShader', 'wgsl', 'smoothstep'],
      'src/main.ts': ['createShader', 'uniforms', 'getWebGPUSupport']
    }
  }
];
