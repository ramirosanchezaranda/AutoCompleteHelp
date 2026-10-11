import type { Lesson } from './lessons';

/**
 * Cursos sin IA de TEORÍA Y EJERCICIOS: fundamentos de programación, lógica,
 * matemáticas y diseño con JavaScript. Cada tema son tres pasos que se
 * completan escribiendo: el apunte de teoría, los tests (que definen qué
 * tiene que hacer cada función) y el ejercicio, que resuelve la persona.
 * La solución de referencia está escrita y comentada: da las pistas y, si
 * hace falta, se puede escribir guiada, línea por línea.
 *
 * Verificados con Vitest: con las soluciones los tests pasan; con los
 * enunciados, fallan.
 */

/** Texto multilínea → líneas (sin la primera línea vacía). */
const L = (s: string): string[] => s.replace(/^\n/, '').replace(/\n$/, '').split('\n');

const pkg = (name: string, vite = false): string[] => [
  '// Abre el manifiesto. En JSON los comentarios no van: se quitan al guardar.',
  '{',
  '  // El nombre del proyecto.',
  `  "name": "${name}",`,
  '  // La versión del proyecto.',
  '  "version": "1.0.0",',
  '  // "module": los archivos usan import y export.',
  '  "type": "module",',
  '  // Abre los scripts: atajos que se corren con npm run.',
  '  "scripts": {',
  ...(vite ? ['    // npm run dev abre la página con Vite y recarga al guardar.', '    "dev": "vite",'] : []),
  '    // npm test corre todos los tests una vez.',
  '    "test": "vitest run"',
  '  // Cierra los scripts.',
  '  },',
  '  // Abre las dependencias de desarrollo: herramientas para escribir y probar.',
  '  "devDependencies": {',
  ...(vite ? ['    // Vite, el servidor de desarrollo.', '    "vite": "^6.4.4",'] : []),
  '    // Vitest, el corredor de tests.',
  '    "vitest": "^3.2.7"',
  '  // Cierra las dependencias de desarrollo.',
  '  }',
  '// Cierra el manifiesto.',
  '}',
];

const VERDE = 'Corre los tests de todos los temas. Si alguno queda en rojo, vuelve a ese ejercicio: el mensaje dice qué esperaba y qué llegó.';

function curso(paso: string, verificar: string) {
  return { tipo: 'comando' as const, paso, comando: verificar, explicacion: VERDE };
}

// ---------------------------------------------------------------------------
// Fundamentos de programación
// ---------------------------------------------------------------------------

const FUND_GUIA = `## Qué vas a aprender
Las piezas con las que se arma cualquier programa: valores y variables, funciones, condicionales, bucles, listas y objetos. En JavaScript, pero las ideas sirven para cualquier lenguaje.

## Cómo funciona
Cada tema tiene tres pasos, y todos se completan escribiendo:
1. **El apunte** (notas/): la teoría. Las líneas con > se leen; las definiciones y los ejemplos los escribes tú.
2. **Los tests** (ejercicios/*.test.js): dicen qué tiene que hacer cada función, con ejemplos. Al escribirlos y correrlos dan rojo: la solución todavía no existe.
3. **El ejercicio** (ejercicios/*.js): lo resuelves tú. Cuando los tests pasan a verde, está resuelto. Si te trabas, pide una pista; si sigues trabado, escribe la solución guiada, línea por línea.

## Temario
1. Valores, variables y funciones: saludo(nombre), areaRectangulo(base, altura)
2. Condicionales: clasificarEdad(edad), maximo(a, b)
3. Bucles: sumarHasta(n), contarVocales(texto)
4. Listas y objetos: promedio(numeros), soloPares(numeros), totalCarrito(items)

## Tests
\`npx vitest run\` corre todos; \`npx vitest run ejercicios/02\` solo los del tema 2.

## Cómo seguir
- Lógica para programar y Matemáticas para programar, en esta misma sección
- Un proyecto chico: la calculadora de notas o el juego de adivinar el número`;

const FUNDAMENTOS: Lesson = {
  id: 'fundamentos-js',
  tipo: 'curso',
  tema: 'Fundamentos de programación',
  topicId: 'fundamentos-programacion',
  titulo: 'Fundamentos de programación: teoría y ejercicios',
  dificultad: 'baja',
  duracion: '2 a 3 horas',
  proyecto: 'curso de fundamentos de programación en JavaScript: teoría escrita y ejercicios con tests; explica cada concepto la primera vez que aparece',
  stack: { resumen: 'JavaScript (ES modules) + Vitest', lenguaje: 'JavaScript', tests: 'Vitest' },
  convenciones: ['ES modules (import/export)', 'apuntes en notas/', 'cada ejercicio en ejercicios/NN-tema.js con sus tests al lado', 'funciones puras: reciben datos y devuelven un resultado'],
  objetivos: ['valores, variables y funciones', 'condicionales', 'bucles y acumuladores', 'listas y objetos', 'leer y usar tests'],
  entorno: {
    instalar: [{ comando: 'npm install -D vitest', explicacion: 'Instala Vitest, el corredor de tests, como dependencia de desarrollo (-D).' }],
    testear: { comando: 'npx vitest run', explicacion: 'Corre todos los tests una vez. Agrega una ruta (ejercicios/02) para correr solo un tema.' }
  },
  plan: [
    { paso: 'Manifiesto del proyecto', tipo: 'config', archivo: 'package.json', concepto: 'scripts y Vitest' },
    { paso: 'Apunte: valores, variables y funciones', tipo: 'teoria', archivo: 'notas/01-valores.md', concepto: 'variables y funciones' },
    { paso: 'Tests: saludo y área', tipo: 'test', archivo: 'ejercicios/01-valores.test.js', concepto: 'leer un test', verificar: 'npx vitest run ejercicios/01' },
    { paso: 'Ejercicio: saludo y área', tipo: 'ejercicio', archivo: 'ejercicios/01-valores.js', concepto: 'funciones y return', verificar: 'npx vitest run ejercicios/01' },
    { paso: 'Apunte: condicionales', tipo: 'teoria', archivo: 'notas/02-condicionales.md', concepto: 'condicionales' },
    { paso: 'Tests: edades y máximo', tipo: 'test', archivo: 'ejercicios/02-condicionales.test.js', concepto: 'probar los bordes', verificar: 'npx vitest run ejercicios/02' },
    { paso: 'Ejercicio: edades y máximo', tipo: 'ejercicio', archivo: 'ejercicios/02-condicionales.js', concepto: 'if, else if y else', verificar: 'npx vitest run ejercicios/02' },
    { paso: 'Apunte: bucles', tipo: 'teoria', archivo: 'notas/03-bucles.md', concepto: 'bucles' },
    { paso: 'Tests: sumas y vocales', tipo: 'test', archivo: 'ejercicios/03-bucles.test.js', concepto: 'resultados calculados a mano', verificar: 'npx vitest run ejercicios/03' },
    { paso: 'Ejercicio: sumas y vocales', tipo: 'ejercicio', archivo: 'ejercicios/03-bucles.js', concepto: 'for y acumuladores', verificar: 'npx vitest run ejercicios/03' },
    { paso: 'Apunte: listas y objetos', tipo: 'teoria', archivo: 'notas/04-listas.md', concepto: 'arreglos y objetos' },
    { paso: 'Tests: promedio, pares y carrito', tipo: 'test', archivo: 'ejercicios/04-listas.test.js', concepto: 'toEqual', verificar: 'npx vitest run ejercicios/04' },
    { paso: 'Ejercicio: promedio, pares y carrito', tipo: 'ejercicio', archivo: 'ejercicios/04-listas.js', concepto: 'filter y recorrer objetos', verificar: 'npx vitest run ejercicios/04' },
    curso('Correr todos los tests', 'npx vitest run')
  ],
  guia: FUND_GUIA,
  archivos: {
    'package.json': pkg('fundamentos-de-programacion'),
    'notas/01-valores.md': L(`
> Apunte 1. Un programa trabaja con valores. Todo se escribe: también las explicaciones.
> Las líneas con > explican; las de código llevan arriba su comentario.
## Valores y variables
> Un valor es un dato: un número, un texto o verdadero/falso. Cada valor tiene un tipo.
Un valor es un dato con un tipo.
> Una variable es un nombre que guarda un valor para usarlo después. const no deja cambiarlo; let sí.
\`\`\`js
// nombre guarda el texto "Ana" y no se puede cambiar (const).
const nombre = "Ana";
// edad guarda el número 30 y se puede cambiar después (let).
let edad = 30;
\`\`\`
> Una función recibe valores (los parámetros), hace algo con ellos y devuelve un resultado con return.
\`\`\`js
// Declara la función doble, que recibe un número n.
function doble(n) {
  // Devuelve n multiplicado por 2.
  return n * 2;
// Cierra la función.
}
\`\`\`
> Para recordar: una función es una receta. Los parámetros son los ingredientes y return es el plato.
Una función recibe valores y devuelve un resultado.`),
    'ejercicios/01-valores.test.js': L(`
// Cómo empezar: los tests dicen qué tiene que hacer cada función, con ejemplos
// concretos. Primero los escribes; después resuelves el ejercicio para que pasen.
// describe, it y expect: las tres piezas de un test, desde Vitest.
import { describe, it, expect } from "vitest";
// Las funciones que vas a programar en el ejercicio.
import { saludo, areaRectangulo } from "./01-valores.js";

// describe agrupa los tests de saludo.
describe("saludo", () => {
  // El caso normal: el nombre va entre el saludo y el signo de cierre.
  it("saluda por el nombre", () => {
    // Con "Ana" tiene que devolver exactamente "¡Hola, Ana!".
    expect(saludo("Ana")).toBe("¡Hola, Ana!");
  // Cierra el caso.
  });
// Cierra el grupo de saludo.
});
// ↑ saludo: comprueba que arma el texto exacto, con coma, espacio y signos.

// describe agrupa los tests de areaRectangulo.
describe("areaRectangulo", () => {
  // Base por altura: con números chicos se calcula a mano y se compara.
  it("multiplica base por altura", () => {
    // 3 por 4 es 12.
    expect(areaRectangulo(3, 4)).toBe(12);
  // Cierra el caso.
  });
  // El borde: si un lado mide 0, el área es 0.
  it("con un lado en 0 da 0", () => {
    // 0 por 5 es 0.
    expect(areaRectangulo(0, 5)).toBe(0);
  // Cierra el caso.
  });
// Cierra el grupo de areaRectangulo.
});
// ↑ areaRectangulo: comprueba el caso normal y el borde de un lado en 0.`),
    'ejercicios/01-valores.js': L(`
// Ejercicio 1: saludo(nombre) devuelve el texto "¡Hola, <nombre>!".
// Ejercicio 2: areaRectangulo(base, altura) devuelve el área del rectángulo.
// Corre los tests: cuando pasen en verde, lo resolviste.

// Pista: el operador + une textos. Va el saludo, después el nombre y el cierre.

// Declara saludo: recibe el nombre de la persona.
export function saludo(nombre) {
  // Une "¡Hola, ", el nombre y "!" en un solo texto y lo devuelve.
  return "¡Hola, " + nombre + "!";
// Cierra la función saludo.
}
// ↑ saludo: une tres textos en uno y lo devuelve.

// Pista: el área de un rectángulo es base por altura, y * multiplica.

// Declara areaRectangulo: recibe la base y la altura.
export function areaRectangulo(base, altura) {
  // Multiplica los dos lados y devuelve el resultado.
  return base * altura;
// Cierra la función areaRectangulo.
}
// ↑ areaRectangulo: multiplica los dos lados y devuelve el resultado.`),
    'notas/02-condicionales.md': L(`
> Apunte 2. Decidir: el programa elige qué camino seguir según una condición.
## Condicionales
> Una condición es una pregunta que vale true (verdadero) o false (falso). Se arma comparando.
Una condición vale true o false.
> Los comparadores: === igual, !== distinto, < menor, > mayor, <= menor o igual, >= mayor o igual.
\`\`\`js
// puedeVotar vale true si la edad es 16 o más; si no, false.
const puedeVotar = edad >= 16;
\`\`\`
> if ejecuta un bloque solo si la condición es true. else if prueba otra condición; else es todo lo demás.
\`\`\`js
// Si la nota es 6 o más...
if (nota >= 6) {
  // ...el resultado es aprobado.
  resultado = "aprobado";
// Si no (else)...
} else {
  // ...el resultado es desaprobado.
  resultado = "desaprobado";
// Cierra el if.
}
\`\`\`
> El orden importa: se prueba de arriba hacia abajo y gana la primera condición que se cumple.
Gana la primera condición que se cumple.`),
    'ejercicios/02-condicionales.test.js': L(`
// Cómo empezar: cada test prueba un tramo de edades y sus bordes (17, 18,
// 64, 65). Los bordes son donde más se equivocan las condiciones.
// describe, it y expect: las tres piezas de un test, desde Vitest.
import { describe, it, expect } from "vitest";
// Las funciones que vas a programar en el ejercicio.
import { clasificarEdad, maximo } from "./02-condicionales.js";

// describe agrupa los tests de clasificarEdad.
describe("clasificarEdad", () => {
  // Un caso por tramo, y los bordes exactos: 18 ya es adulto, 65 ya es mayor.
  it("menor de 18", () => {
    // 17 todavía es menor.
    expect(clasificarEdad(17)).toBe("menor");
  // Cierra el caso.
  });
  // El tramo del medio, con sus dos bordes.
  it("adulto desde 18 hasta 64", () => {
    // 18 ya es adulto.
    expect(clasificarEdad(18)).toBe("adulto");
    // 64 todavía es adulto.
    expect(clasificarEdad(64)).toBe("adulto");
  // Cierra el caso.
  });
  // El último tramo.
  it("mayor desde 65", () => {
    // 65 ya es mayor.
    expect(clasificarEdad(65)).toBe("mayor");
  // Cierra el caso.
  });
// Cierra el grupo de clasificarEdad.
});
// ↑ clasificarEdad: comprueba los tres tramos y los bordes entre ellos.

// describe agrupa los tests de maximo.
describe("maximo", () => {
  // Sin importar el orden en que lleguen, gana el más grande.
  it("devuelve el mayor de dos números", () => {
    // El mayor llega segundo.
    expect(maximo(3, 9)).toBe(9);
    // El mayor llega primero.
    expect(maximo(9, 3)).toBe(9);
  // Cierra el caso.
  });
  // El borde: si son iguales, el máximo es ese número.
  it("con números iguales devuelve ese número", () => {
    // 4 y 4: el máximo es 4.
    expect(maximo(4, 4)).toBe(4);
  // Cierra el caso.
  });
// Cierra el grupo de maximo.
});
// ↑ maximo: comprueba los dos órdenes posibles y el empate.`),
    'ejercicios/02-condicionales.js': L(`
// Ejercicio 1: clasificarEdad(edad) devuelve "menor" (menos de 18), "adulto"
// (de 18 a 64) o "mayor" (65 o más).
// Ejercicio 2: maximo(a, b) devuelve el mayor de los dos, sin usar Math.max.
// Corre los tests: cuando pasen en verde, lo resolviste.

// Pista: empieza por el tramo más chico. Si no es menor, ya sabes que tiene
// 18 o más: la condición siguiente solo tiene que mirar el tope de 65.

// Declara clasificarEdad: recibe una edad.
export function clasificarEdad(edad) {
  // Si tiene menos de 18...
  if (edad < 18) {
    // ...es menor.
    return "menor";
  // Si no, y tiene menos de 65...
  } else if (edad < 65) {
    // ...es adulto.
    return "adulto";
  // Cierra el if.
  }
  // Si no entró en ninguno, tiene 65 o más: es mayor.
  return "mayor";
// Cierra la función clasificarEdad.
}
// ↑ clasificarEdad: prueba los tramos de menor a mayor y devuelve el primero que encaja.

// Pista: compara a con b. Si a es mayor o igual, ganó a; si no, ganó b.

// Declara maximo: recibe dos números.
export function maximo(a, b) {
  // Si a es mayor o igual que b...
  if (a >= b) {
    // ...el máximo es a.
    return a;
  // Cierra el if.
  }
  // Si no, el máximo es b.
  return b;
// Cierra la función maximo.
}
// ↑ maximo: devuelve a si es mayor o igual que b; si no, b.`),
    'notas/03-bucles.md': L(`
> Apunte 3. Repetir: un bucle hace lo mismo muchas veces sin escribirlo muchas veces.
## Bucles
> for tiene tres partes: dónde empieza el contador, hasta cuándo sigue y cómo avanza.
Un bucle repite un bloque mientras se cumple una condición.
\`\`\`js
// i empieza en 1, sigue mientras sea 3 o menos y suma 1 en cada vuelta.
for (let i = 1; i <= 3; i++) {
  // Muestra el número de esta vuelta: 1, 2 y 3.
  console.log(i);
// Cierra el bucle.
}
\`\`\`
> Un acumulador es una variable que empieza en un valor neutro (0 para sumar) y cambia en cada vuelta.
\`\`\`js
// El acumulador empieza en 0, el neutro de la suma.
let suma = 0;
// En cada vuelta se le agrega algo: aquí, 5.
suma = suma + 5;
\`\`\`
> for...of recorre cada elemento de una lista, o cada letra de un texto, sin contador.
\`\`\`js
// letra toma, una por una, cada letra de "hola".
for (const letra of "hola") {
  // Muestra la letra de esta vuelta.
  console.log(letra);
// Cierra el bucle.
}
\`\`\`
> Para recordar: antes del bucle, el valor inicial; adentro, el cambio; después, el resultado.
Inicial antes, cambio adentro, resultado después.`),
    'ejercicios/03-bucles.test.js': L(`
// Cómo empezar: los resultados se calculan a mano (1 + 2 + 3 + 4 = 10) y el
// test los compara con lo que devuelve la función.
// describe, it y expect: las tres piezas de un test, desde Vitest.
import { describe, it, expect } from "vitest";
// Las funciones que vas a programar en el ejercicio.
import { sumarHasta, contarVocales } from "./03-bucles.js";

// describe agrupa los tests de sumarHasta.
describe("sumarHasta", () => {
  // El caso normal, calculado a mano.
  it("suma de 1 hasta n", () => {
    // 1 + 2 + 3 + 4 = 10.
    expect(sumarHasta(4)).toBe(10);
  // Cierra el caso.
  });
  // El borde: con 0 no hay nada que sumar y queda el valor inicial.
  it("con 0 devuelve 0", () => {
    // Sin vueltas, la suma queda en 0.
    expect(sumarHasta(0)).toBe(0);
  // Cierra el caso.
  });
// Cierra el grupo de sumarHasta.
});
// ↑ sumarHasta: comprueba una suma conocida y el caso sin vueltas.

// describe agrupa los tests de contarVocales.
describe("contarVocales", () => {
  // Mayúsculas y tildes también cuentan: «Árbol» tiene dos vocales.
  it("cuenta vocales sin importar mayúsculas ni tildes", () => {
    // Á y o: dos vocales.
    expect(contarVocales("Árbol")).toBe(2);
    // o, a y a: tres vocales.
    expect(contarVocales("programar")).toBe(3);
  // Cierra el caso.
  });
  // El borde: un texto sin vocales.
  it("sin vocales devuelve 0", () => {
    // x, y, z: ninguna vocal.
    expect(contarVocales("xyz")).toBe(0);
  // Cierra el caso.
  });
// Cierra el grupo de contarVocales.
});
// ↑ contarVocales: comprueba mayúsculas, tildes y un texto sin vocales.`),
    'ejercicios/03-bucles.js': L(`
// Ejercicio 1: sumarHasta(n) devuelve 1 + 2 + ... + n (0 si n es menor que 1).
// Ejercicio 2: contarVocales(texto) cuenta las vocales, con o sin tilde, en
// mayúsculas o minúsculas.
// Corre los tests: cuando pasen en verde, lo resolviste.

// Pista: un acumulador que empieza en 0 y un for de 1 hasta n que le suma i.
// Si n es 0, el for no da ninguna vuelta y queda el 0 inicial.

// Declara sumarHasta: recibe hasta qué número sumar.
export function sumarHasta(n) {
  // El acumulador empieza en 0.
  let suma = 0;
  // i va de 1 hasta n, de a uno.
  for (let i = 1; i <= n; i++) {
    // Suma el número de esta vuelta al total.
    suma = suma + i;
  // Cierra el for.
  }
  // ↑ for: en cada vuelta suma el número actual al total.
  // Devuelve el total.
  return suma;
// Cierra la función sumarHasta.
}
// ↑ sumarHasta: acumula los números de 1 a n y devuelve el total.

// Pista: pasa el texto a minúsculas con toLowerCase y recorre cada letra con
// for...of. includes dice si una letra está dentro de un texto.

// Declara contarVocales: recibe un texto.
export function contarVocales(texto) {
  // Las vocales que cuentan, con y sin tilde.
  const vocales = "aeiouáéíóú";
  // El contador empieza en 0.
  let cantidad = 0;
  // Recorre cada letra del texto pasado a minúsculas.
  for (const letra of texto.toLowerCase()) {
    // Si la letra está entre las vocales...
    if (vocales.includes(letra)) {
      // ...suma 1 al contador.
      cantidad++;
    // Cierra el if.
    }
  // Cierra el for.
  }
  // ↑ for...of: mira cada letra y suma 1 si es vocal.
  // Devuelve cuántas vocales encontró.
  return cantidad;
// Cierra la función contarVocales.
}
// ↑ contarVocales: recorre el texto en minúsculas y cuenta las vocales.`),
    'notas/04-listas.md': L(`
> Apunte 4. Agrupar datos: listas (arreglos) y fichas (objetos).
## Arreglos y objetos
> Un arreglo es una lista ordenada. Cada elemento tiene una posición, y la primera es 0.
Un arreglo es una lista; la primera posición es 0.
\`\`\`js
// notas: una lista con tres números.
const notas = [7, 9, 5];
// length: cuántos elementos tiene (3).
notas.length;
\`\`\`
> Un objeto agrupa datos con nombre: cada propiedad tiene una clave y un valor.
\`\`\`js
// producto: un objeto con dos propiedades, nombre y precio.
const producto = { nombre: "pan", precio: 900 };
// Lee la propiedad precio: 900.
producto.precio;
\`\`\`
> filter arma una lista nueva con los elementos que cumplen una condición. No cambia la original.
\`\`\`js
// altas: solo las notas de 7 o más (7 y 9).
const altas = notas.filter((n) => n >= 7);
\`\`\`
> Para recordar: un arreglo guarda muchos datos parecidos; un objeto describe una cosa.
Arreglo para muchos; objeto para describir una cosa.`),
    'ejercicios/04-listas.test.js': L(`
// Cómo empezar: los datos de prueba son fijos y chicos, así el resultado
// esperado se calcula a mano.
// describe, it y expect: las tres piezas de un test, desde Vitest.
import { describe, it, expect } from "vitest";
// Las funciones que vas a programar en el ejercicio.
import { promedio, soloPares, totalCarrito } from "./04-listas.js";

// describe agrupa los tests de promedio.
describe("promedio", () => {
  // (6 + 8 + 10) / 3 = 8.
  it("suma y divide por la cantidad", () => {
    // El promedio de 6, 8 y 10 es 8.
    expect(promedio([6, 8, 10])).toBe(8);
  // Cierra el caso.
  });
  // El borde: dividir por 0 da NaN; una lista vacía tiene que dar 0.
  it("lista vacía da 0", () => {
    // Sin números, el promedio es 0.
    expect(promedio([])).toBe(0);
  // Cierra el caso.
  });
// Cierra el grupo de promedio.
});
// ↑ promedio: comprueba el caso normal y la lista vacía.

// toEqual compara el contenido de las listas, no si son la misma lista.
it("soloPares deja solo los números pares", () => {
  // De 1, 2, 3 y 4 quedan 2 y 4.
  expect(soloPares([1, 2, 3, 4])).toEqual([2, 4]);
// Cierra el caso.
});

// Cada ítem cuesta precio por cantidad: 2 x 900 + 1 x 1500 = 3300.
it("totalCarrito suma precio por cantidad", () => {
  // Abre la lista del carrito.
  const carrito = [
    // Dos panes de 900.
    { nombre: "pan", precio: 900, cantidad: 2 },
    // Una leche de 1500.
    { nombre: "leche", precio: 1500, cantidad: 1 }
  // Cierra la lista.
  ];
  // El total tiene que ser 3300.
  expect(totalCarrito(carrito)).toBe(3300);
// Cierra el caso.
});
// ↑ totalCarrito: comprueba un carrito con dos productos y cantidades distintas.`),
    'ejercicios/04-listas.js': L(`
// Ejercicio 1: promedio(numeros) devuelve el promedio (0 si la lista está vacía).
// Ejercicio 2: soloPares(numeros) devuelve una lista nueva solo con los pares.
// Ejercicio 3: totalCarrito(items) suma precio por cantidad de cada ítem.
// Corre los tests: cuando pasen en verde, lo resolviste.

// Pista: primero el caso de la lista vacía (su length es 0). Después, suma con
// un for...of y divide por la cantidad de elementos.

// Declara promedio: recibe una lista de números.
export function promedio(numeros) {
  // Si la lista no tiene elementos...
  if (numeros.length === 0) {
    // ...devuelve 0 en vez de dividir por 0.
    return 0;
  // Cierra el if.
  }
  // El acumulador empieza en 0.
  let suma = 0;
  // Recorre cada número de la lista.
  for (const n of numeros) {
    // Lo suma al total.
    suma = suma + n;
  // Cierra el for.
  }
  // Divide la suma por la cantidad de números.
  return suma / numeros.length;
// Cierra la función promedio.
}
// ↑ promedio: evita dividir por 0 y divide la suma por la cantidad.

// Pista: filter con una condición. Un número es par si el resto de dividirlo
// por 2 es 0, y el resto se calcula con %.

// Declara soloPares: recibe una lista de números.
export function soloPares(numeros) {
  // Se queda con los números cuyo resto al dividir por 2 es 0.
  return numeros.filter((n) => n % 2 === 0);
// Cierra la función soloPares.
}
// ↑ soloPares: se queda con los números cuyo resto al dividir por 2 es 0.

// Pista: un acumulador que suma item.precio * item.cantidad en cada vuelta.

// Declara totalCarrito: recibe la lista de ítems.
export function totalCarrito(items) {
  // El total empieza en 0.
  let total = 0;
  // Recorre cada ítem del carrito.
  for (const item of items) {
    // Suma lo que cuesta ese ítem: precio por cantidad.
    total = total + item.precio * item.cantidad;
  // Cierra el for.
  }
  // Devuelve el total.
  return total;
// Cierra la función totalCarrito.
}
// ↑ totalCarrito: suma lo que cuesta cada ítem según su cantidad.`)
  },
  conceptos: {
    'notas/01-valores.md': ['variables', 'funciones'],
    'ejercicios/01-valores.test.js': ['tests'],
    'ejercicios/01-valores.js': ['funciones', 'return'],
    'notas/02-condicionales.md': ['condicionales'],
    'ejercicios/02-condicionales.test.js': ['tests de bordes'],
    'ejercicios/02-condicionales.js': ['condicionales', 'comparadores'],
    'notas/03-bucles.md': ['bucles', 'acumuladores'],
    'ejercicios/03-bucles.test.js': ['tests'],
    'ejercicios/03-bucles.js': ['bucles', 'acumuladores'],
    'notas/04-listas.md': ['arreglos', 'objetos'],
    'ejercicios/04-listas.test.js': ['toEqual'],
    'ejercicios/04-listas.js': ['arreglos', 'objetos', 'filter']
  }
};

// ---------------------------------------------------------------------------
// Lógica para programar
// ---------------------------------------------------------------------------

const LOGICA_GUIA = `## Qué vas a aprender
A razonar condiciones sin equivocarte: booleanos, tablas de verdad, cómo negar una condición (De Morgan), reglas con excepciones y el orden de los casos.

## Cómo funciona
Cada tema: el apunte (teoría que escribes), los tests (la especificación) y el ejercicio (lo resuelves tú hasta que los tests pasen a verde). Pistas y solución guiada si te trabas.

## Temario
1. Booleanos y tablas de verdad: xor(a, b), implica(a, b)
2. Negar condiciones: dentroDeRango, fueraDeRango, puedeEntrar
3. Reglas con excepciones: esBisiesto(anio), diasDelMes(mes, anio)
4. Casos y su orden: fizzBuzz(n), todosPositivos(numeros)

## Tests
\`npx vitest run\` corre todos; \`npx vitest run ejercicios/03\` solo el tema 3.

## Cómo seguir
- Matemáticas para programar
- Algoritmos y estructuras de datos`;

const LOGICA: Lesson = {
  id: 'logica-js',
  tipo: 'curso',
  tema: 'Lógica para programar',
  topicId: 'logica',
  titulo: 'Lógica para programar: teoría y ejercicios',
  dificultad: 'baja',
  duracion: '2 horas',
  proyecto: 'curso de lógica para programar en JavaScript: teoría escrita y ejercicios con tests; explica cada regla lógica con una tabla o un ejemplo',
  stack: { resumen: 'JavaScript (ES modules) + Vitest', lenguaje: 'JavaScript', tests: 'Vitest' },
  convenciones: ['ES modules (import/export)', 'apuntes en notas/', 'cada ejercicio en ejercicios/NN-tema.js con sus tests al lado', 'funciones que devuelven booleanos o textos, sin imprimir'],
  objetivos: ['booleanos y tablas de verdad', 'leyes de De Morgan', 'reglas con excepciones', 'el orden de los casos'],
  entorno: {
    instalar: [{ comando: 'npm install -D vitest', explicacion: 'Instala Vitest, el corredor de tests, como dependencia de desarrollo (-D).' }],
    testear: { comando: 'npx vitest run', explicacion: 'Corre todos los tests una vez.' }
  },
  plan: [
    { paso: 'Manifiesto del proyecto', tipo: 'config', archivo: 'package.json', concepto: 'scripts y Vitest' },
    { paso: 'Apunte: booleanos y tablas de verdad', tipo: 'teoria', archivo: 'notas/01-booleanos.md', concepto: 'tablas de verdad' },
    { paso: 'Tests: xor e implicación', tipo: 'test', archivo: 'ejercicios/01-booleanos.test.js', concepto: 'probar todas las filas', verificar: 'npx vitest run ejercicios/01' },
    { paso: 'Ejercicio: xor e implicación', tipo: 'ejercicio', archivo: 'ejercicios/01-booleanos.js', concepto: '&&, || y !', verificar: 'npx vitest run ejercicios/01' },
    { paso: 'Apunte: negar condiciones', tipo: 'teoria', archivo: 'notas/02-de-morgan.md', concepto: 'De Morgan' },
    { paso: 'Tests: rangos y entrada', tipo: 'test', archivo: 'ejercicios/02-de-morgan.test.js', concepto: 'bordes de un rango', verificar: 'npx vitest run ejercicios/02' },
    { paso: 'Ejercicio: rangos y entrada', tipo: 'ejercicio', archivo: 'ejercicios/02-de-morgan.js', concepto: 'condiciones compuestas', verificar: 'npx vitest run ejercicios/02' },
    { paso: 'Apunte: reglas con excepciones', tipo: 'teoria', archivo: 'notas/03-reglas.md', concepto: 'excepciones primero' },
    { paso: 'Tests: años bisiestos', tipo: 'test', archivo: 'ejercicios/03-reglas.test.js', concepto: 'casos especiales', verificar: 'npx vitest run ejercicios/03' },
    { paso: 'Ejercicio: años bisiestos', tipo: 'ejercicio', archivo: 'ejercicios/03-reglas.js', concepto: 'reglas encadenadas', verificar: 'npx vitest run ejercicios/03' },
    { paso: 'Apunte: casos y su orden', tipo: 'teoria', archivo: 'notas/04-casos.md', concepto: 'el orden de los casos' },
    { paso: 'Tests: FizzBuzz y todos positivos', tipo: 'test', archivo: 'ejercicios/04-casos.test.js', concepto: 'verdad vacía', verificar: 'npx vitest run ejercicios/04' },
    { paso: 'Ejercicio: FizzBuzz y todos positivos', tipo: 'ejercicio', archivo: 'ejercicios/04-casos.js', concepto: 'casos específicos primero', verificar: 'npx vitest run ejercicios/04' },
    curso('Correr todos los tests', 'npx vitest run')
  ],
  guia: LOGICA_GUIA,
  archivos: {
    'package.json': pkg('logica-para-programar'),
    'notas/01-booleanos.md': L(`
> Apunte 1. La lógica está detrás de cada decisión de un programa. Todo se escribe: también las explicaciones.
> Las líneas con > explican; las de código llevan arriba su comentario.
## Booleanos
> Un booleano tiene solo dos valores posibles: true (verdadero) y false (falso).
Un booleano vale true o false.
> && (y) es true solo si las dos partes son true. || (o) es true si al menos una lo es. ! (no) invierte.
\`\`\`js
// y: las dos tienen que ser true; como una es false, da false.
true && false;
// o: alcanza con una; da true.
true || false;
// no: invierte true y da false.
!true;
\`\`\`
> Una tabla de verdad prueba todas las combinaciones. Con dos booleanos hay cuatro filas:
\`\`\`js
// Fila 1: verdadero y verdadero da true.
true && true;
// Fila 2: verdadero y falso da false.
true && false;
// Fila 3: falso y verdadero da false.
false && true;
// Fila 4: falso y falso da false.
false && false;
\`\`\`
> El o exclusivo (xor) es true cuando exactamente uno de los dos es true.
xor: true si exactamente uno es true.
> La implicación (si a, entonces b) solo es falsa cuando a es true y b es false.
Si a entonces b: solo falla con a true y b false.`),
    'ejercicios/01-booleanos.test.js': L(`
// Cómo empezar: con dos booleanos hay cuatro combinaciones. Si las cuatro
// filas de la tabla de verdad pasan, la función es correcta: no hay otras.
// describe, it y expect: las tres piezas de un test, desde Vitest.
import { describe, it, expect } from "vitest";
// Las funciones que vas a programar en el ejercicio.
import { xor, implica } from "./01-booleanos.js";

// describe agrupa los tests de xor.
describe("xor", () => {
  // Las dos filas donde los valores son distintos.
  it("es true cuando exactamente uno es true", () => {
    // Solo a es true.
    expect(xor(true, false)).toBe(true);
    // Solo b es true.
    expect(xor(false, true)).toBe(true);
  // Cierra el caso.
  });
  // Las dos filas donde son iguales.
  it("es false cuando los dos son iguales", () => {
    // Los dos true.
    expect(xor(true, true)).toBe(false);
    // Los dos false.
    expect(xor(false, false)).toBe(false);
  // Cierra el caso.
  });
// Cierra el grupo de xor.
});
// ↑ xor: recorre las cuatro filas de la tabla de verdad.

// describe agrupa los tests de implica.
describe("implica", () => {
  // La única fila falsa: a verdadero y b falso.
  it("solo falla con a true y b false", () => {
    // Si a es true y b es false, la implicación no se cumple.
    expect(implica(true, false)).toBe(false);
  // Cierra el caso.
  });
  // Si a es false, la implicación se cumple sin importar b.
  it("las otras tres filas son true", () => {
    // a y b true: se cumple.
    expect(implica(true, true)).toBe(true);
    // a false, b true: se cumple.
    expect(implica(false, true)).toBe(true);
    // a y b false: se cumple.
    expect(implica(false, false)).toBe(true);
  // Cierra el caso.
  });
// Cierra el grupo de implica.
});
// ↑ implica: comprueba la fila falsa y las tres verdaderas.`),
    'ejercicios/01-booleanos.js': L(`
// Ejercicio 1: xor(a, b) devuelve true si exactamente uno de los dos es true.
// Ejercicio 2: implica(a, b) devuelve el valor de «si a, entonces b».
// Corre los tests: cuando pasen en verde, lo resolviste.

// Pista: xor es «a o b, pero no los dos». Con dos booleanos eso es lo mismo
// que preguntar si son distintos, y !== compara si son distintos.

// Declara xor: recibe dos booleanos.
export function xor(a, b) {
  // Son distintos solo cuando uno es true y el otro false.
  return a !== b;
// Cierra la función xor.
}
// ↑ xor: es true cuando a y b tienen valores distintos.

// Pista: la implicación solo falla con a true y b false. Eso es lo mismo que
// «no a, o b»: si a es false ya se cumple; si a es true, depende de b.

// Declara implica: recibe dos booleanos.
export function implica(a, b) {
  // Se cumple si a es false, o si b es true.
  return !a || b;
// Cierra la función implica.
}
// ↑ implica: se cumple si a es falso o si b es verdadero.`),
    'notas/02-de-morgan.md': L(`
> Apunte 2. Condiciones compuestas, y cómo negarlas sin equivocarse.
## Leyes de De Morgan
> Negar un && lo convierte en un || de las negaciones, y negar un || lo convierte en un &&.
!(a && b) es lo mismo que !a || !b.
> La otra ley, al revés.
!(a || b) es lo mismo que !a && !b.
> Ejemplo: estar dentro de un rango es min <= x && x <= max. Estar fuera es la negación de eso.
\`\`\`js
// dentro: x no es menor que min y no es mayor que max.
const dentro = min <= x && x <= max;
// fuera: la negación, con De Morgan: menor que min o mayor que max.
const fuera = x < min || x > max;
\`\`\`
> Al negar una comparación se da vuelta: la negación de x >= min es x < min.
Al negar, && cambia por || y cada comparación se invierte.`),
    'ejercicios/02-de-morgan.test.js': L(`
// Cómo empezar: en los rangos, los bordes (exactamente min o max) deciden si
// la condición usa <= o <. Por eso cada test prueba los dos bordes.
// describe, it y expect: las tres piezas de un test, desde Vitest.
import { describe, it, expect } from "vitest";
// Las funciones que vas a programar en el ejercicio.
import { dentroDeRango, fueraDeRango, puedeEntrar } from "./02-de-morgan.js";

// describe agrupa los tests de los rangos.
describe("rangos", () => {
  // Los bordes cuentan como dentro: el rango es cerrado.
  it("dentroDeRango incluye los bordes", () => {
    // 5 está en el medio de 1 y 10.
    expect(dentroDeRango(5, 1, 10)).toBe(true);
    // 1 es el borde de abajo: cuenta.
    expect(dentroDeRango(1, 1, 10)).toBe(true);
    // 10 es el borde de arriba: cuenta.
    expect(dentroDeRango(10, 1, 10)).toBe(true);
    // 11 se pasa: no está.
    expect(dentroDeRango(11, 1, 10)).toBe(false);
  // Cierra el caso.
  });
  // fueraDeRango es exactamente lo contrario, también en los bordes.
  it("fueraDeRango es lo contrario", () => {
    // 0 queda por debajo.
    expect(fueraDeRango(0, 1, 10)).toBe(true);
    // 11 queda por encima.
    expect(fueraDeRango(11, 1, 10)).toBe(true);
    // 1 es borde: está dentro, así que no está fuera.
    expect(fueraDeRango(1, 1, 10)).toBe(false);
  // Cierra el caso.
  });
// Cierra el grupo de rangos.
});
// ↑ rangos: comprueba el medio, los dos bordes y los valores de afuera.

// describe agrupa los tests de puedeEntrar.
describe("puedeEntrar", () => {
  // Entra con 18 o más y entrada, o si es VIP aunque no cumpla lo demás.
  it("adulto con entrada entra", () => {
    // 18 años, con entrada, sin VIP: entra.
    expect(puedeEntrar(18, true, false)).toBe(true);
  // Cierra el caso.
  });
  // Si falta una de las dos condiciones, no entra.
  it("sin entrada o menor no entra", () => {
    // Adulto sin entrada.
    expect(puedeEntrar(30, false, false)).toBe(false);
    // Menor con entrada.
    expect(puedeEntrar(16, true, false)).toBe(false);
  // Cierra el caso.
  });
  // El VIP pasa por el otro lado del ||.
  it("un VIP entra siempre", () => {
    // Menor y sin entrada, pero VIP: entra.
    expect(puedeEntrar(16, false, true)).toBe(true);
  // Cierra el caso.
  });
// Cierra el grupo de puedeEntrar.
});
// ↑ puedeEntrar: comprueba cada camino de la condición compuesta.`),
    'ejercicios/02-de-morgan.js': L(`
// Ejercicio 1: dentroDeRango(x, min, max) es true si min <= x <= max.
// Ejercicio 2: fueraDeRango(x, min, max) es lo contrario, escrito sin usar !.
// Ejercicio 3: puedeEntrar(edad, tieneEntrada, esVip): entra quien tiene 18 o
// más y entrada, o quien es VIP.
// Corre los tests: cuando pasen en verde, lo resolviste.

// Pista: dos comparaciones unidas con &&: x no es menor que min y no es mayor
// que max.

// Declara dentroDeRango: recibe el valor y los dos bordes.
export function dentroDeRango(x, min, max) {
  // Está dentro si es mayor o igual que min y menor o igual que max.
  return min <= x && x <= max;
// Cierra la función dentroDeRango.
}
// ↑ dentroDeRango: true si x está entre min y max, bordes incluidos.

// Pista: aplica De Morgan a la función anterior: el && pasa a ser || y cada
// comparación se da vuelta (<= pasa a ser >, y al revés).

// Declara fueraDeRango: recibe el valor y los dos bordes.
export function fueraDeRango(x, min, max) {
  // Está fuera si es menor que min o mayor que max.
  return x < min || x > max;
// Cierra la función fueraDeRango.
}
// ↑ fueraDeRango: true si x queda por debajo de min o por encima de max.

// Pista: los paréntesis agrupan la condición del adulto con entrada; después,
// || esVip deja pasar al VIP en cualquier caso.

// Declara puedeEntrar: recibe la edad, si tiene entrada y si es VIP.
export function puedeEntrar(edad, tieneEntrada, esVip) {
  // Entra el adulto con entrada, o el VIP.
  return (edad >= 18 && tieneEntrada) || esVip;
// Cierra la función puedeEntrar.
}
// ↑ puedeEntrar: deja pasar al adulto con entrada o al VIP.`),
    'notas/03-reglas.md': L(`
> Apunte 3. Reglas con excepciones: cuando «siempre» tiene un «salvo que».
## Excepciones primero
> Un año es bisiesto si es divisible por 4, salvo que sea divisible por 100, salvo que sea divisible por 400.
Bisiesto: divisible por 4, salvo por 100, salvo por 400.
> % calcula el resto de una división. Si el resto es 0, el número es divisible.
a % b === 0 significa que a es divisible por b.
> Con excepciones, se prueba de lo más específico a lo más general: primero el 400, después el 100, al final el 4.
\`\`\`js
// Si el año se divide exacto por 400...
if (anio % 400 === 0) {
  // ...es bisiesto, sin mirar más.
  return true;
// Cierra el if.
}
\`\`\`
> Si se prueba primero la regla general, las excepciones nunca llegan a mirarse.
Primero la excepción, después la regla.`),
    'ejercicios/03-reglas.test.js': L(`
// Cómo empezar: un año para cada rama de la regla. 2024 es el caso común;
// 1900 y 2000 son las excepciones, que es donde fallan las soluciones apuradas.
// describe, it y expect: las tres piezas de un test, desde Vitest.
import { describe, it, expect } from "vitest";
// Las funciones que vas a programar en el ejercicio.
import { esBisiesto, diasDelMes } from "./03-reglas.js";

// describe agrupa los tests de esBisiesto.
describe("esBisiesto", () => {
  // Divisible por 4 y no por 100: bisiesto.
  it("cada cuatro años", () => {
    // 2024 se divide por 4: bisiesto.
    expect(esBisiesto(2024)).toBe(true);
    // 2023 no: común.
    expect(esBisiesto(2023)).toBe(false);
  // Cierra el caso.
  });
  // Las dos excepciones: los siglos no lo son, salvo cada 400 años.
  it("los siglos solo cada 400 años", () => {
    // 1900 se divide por 100 y no por 400: no es bisiesto.
    expect(esBisiesto(1900)).toBe(false);
    // 2000 se divide por 400: sí es bisiesto.
    expect(esBisiesto(2000)).toBe(true);
  // Cierra el caso.
  });
// Cierra el grupo de esBisiesto.
});
// ↑ esBisiesto: comprueba la regla y sus dos excepciones.

// describe agrupa los tests de diasDelMes.
describe("diasDelMes", () => {
  // Febrero depende del año; los demás meses, no.
  it("febrero tiene 29 días en los bisiestos", () => {
    // Febrero de 2024: 29.
    expect(diasDelMes(2, 2024)).toBe(29);
    // Febrero de 2023: 28.
    expect(diasDelMes(2, 2023)).toBe(28);
  // Cierra el caso.
  });
  // Un mes de 30 y uno de 31.
  it("abril tiene 30 y enero 31", () => {
    // Abril: 30.
    expect(diasDelMes(4, 2023)).toBe(30);
    // Enero: 31.
    expect(diasDelMes(1, 2023)).toBe(31);
  // Cierra el caso.
  });
// Cierra el grupo de diasDelMes.
});
// ↑ diasDelMes: comprueba febrero en los dos casos y un mes de 30 y uno de 31.`),
    'ejercicios/03-reglas.js': L(`
// Ejercicio 1: esBisiesto(anio) devuelve true si el año es bisiesto.
// Ejercicio 2: diasDelMes(mes, anio) devuelve cuántos días tiene el mes (1 a
// 12) en ese año.
// Corre los tests: cuando pasen en verde, lo resolviste.

// Pista: de lo específico a lo general. Divisible por 400: sí. Si no, divisible
// por 100: no. Si no, divisible por 4: sí. Si no, no.

// Declara esBisiesto: recibe un año.
export function esBisiesto(anio) {
  // Si se divide exacto por 400...
  if (anio % 400 === 0) {
    // ...es bisiesto.
    return true;
  // Cierra el if.
  }
  // Si se divide exacto por 100 (y no por 400)...
  if (anio % 100 === 0) {
    // ...no es bisiesto.
    return false;
  // Cierra el if.
  }
  // En el resto de los casos, es bisiesto si se divide por 4.
  return anio % 4 === 0;
// Cierra la función esBisiesto.
}
// ↑ esBisiesto: aplica primero las excepciones y al final la regla general.

// Pista: febrero es el único que depende del año, y ya tienes esBisiesto. Los
// meses de 30 días son abril (4), junio (6), septiembre (9) y noviembre (11).

// Declara diasDelMes: recibe el mes (1 a 12) y el año.
export function diasDelMes(mes, anio) {
  // Si es febrero...
  if (mes === 2) {
    // El operador ? elige entre dos valores: condición ? si es true : si es false.
    return esBisiesto(anio) ? 29 : 28;
  // Cierra el if.
  }
  // Si es uno de los cuatro meses de 30 días...
  if (mes === 4 || mes === 6 || mes === 9 || mes === 11) {
    // ...tiene 30.
    return 30;
  // Cierra el if.
  }
  // Todos los demás tienen 31.
  return 31;
// Cierra la función diasDelMes.
}
// ↑ diasDelMes: febrero según el año, los cuatro meses de 30 y el resto 31.`),
    'notas/04-casos.md': L(`
> Apunte 4. Pensar en casos: antes de programar, lista los casos y decide en qué orden se prueban.
## Casos y su orden
> FizzBuzz: los múltiplos de 3 dicen Fizz, los de 5 dicen Buzz, los de los dos dicen FizzBuzz y el resto, el número.
Primero el caso más específico: múltiplo de 3 y de 5.
> Si se prueba primero «múltiplo de 3», el 15 diría Fizz y nunca llegaría a FizzBuzz.
El orden de los casos cambia el resultado.
> Para saber si todos cumplen, alcanza con encontrar uno que no cumple. Una lista vacía cumple: no hay ninguno que falle.
\`\`\`js
// Recorre cada número de la lista.
for (const n of numeros) {
  // Si encuentra uno que no es positivo...
  if (n <= 0) {
    // ...ya sabe la respuesta: no todos cumplen.
    return false;
  // Cierra el if.
  }
// Cierra el for.
}
// Si terminó sin encontrar ninguno, todos cumplen.
return true;
\`\`\`
> A eso se le llama verdad vacía: «todos los elementos de una lista vacía cumplen» es verdadero.
Una lista vacía cumple "todos".`),
    'ejercicios/04-casos.test.js': L(`
// Cómo empezar: un test por caso de FizzBuzz, incluido el 15, que es el que
// detecta si los casos se prueban en el orden equivocado.
// describe, it y expect: las tres piezas de un test, desde Vitest.
import { describe, it, expect } from "vitest";
// Las funciones que vas a programar en el ejercicio.
import { fizzBuzz, todosPositivos } from "./04-casos.js";

// describe agrupa los tests de fizzBuzz.
describe("fizzBuzz", () => {
  // Un número de cada caso.
  it("Fizz, Buzz y el número", () => {
    // 9 es múltiplo de 3.
    expect(fizzBuzz(9)).toBe("Fizz");
    // 10 es múltiplo de 5.
    expect(fizzBuzz(10)).toBe("Buzz");
    // 7 no es múltiplo de ninguno: el número, como texto.
    expect(fizzBuzz(7)).toBe("7");
  // Cierra el caso.
  });
  // El caso que decide el orden: múltiplo de 3 y de 5.
  it("múltiplos de 15 dicen FizzBuzz", () => {
    // 15 es múltiplo de los dos.
    expect(fizzBuzz(15)).toBe("FizzBuzz");
  // Cierra el caso.
  });
// Cierra el grupo de fizzBuzz.
});
// ↑ fizzBuzz: comprueba los cuatro casos, incluido el que depende del orden.

// describe agrupa los tests de todosPositivos.
describe("todosPositivos", () => {
  // El caso normal.
  it("true si todos son mayores que 0", () => {
    // 1, 5 y 3 son positivos.
    expect(todosPositivos([1, 5, 3])).toBe(true);
  // Cierra el caso.
  });
  // El 0 no es positivo: alcanza con uno que no cumple.
  it("false si alguno no es positivo", () => {
    // El 0 hace que no todos cumplan.
    expect(todosPositivos([1, 0, 3])).toBe(false);
  // Cierra el caso.
  });
  // Verdad vacía: en una lista vacía no hay ninguno que falle.
  it("una lista vacía da true", () => {
    // Sin elementos, ninguno falla.
    expect(todosPositivos([])).toBe(true);
  // Cierra el caso.
  });
// Cierra el grupo de todosPositivos.
});
// ↑ todosPositivos: comprueba el caso normal, el que falla y la lista vacía.`),
    'ejercicios/04-casos.js': L(`
// Ejercicio 1: fizzBuzz(n) devuelve "FizzBuzz" si n es múltiplo de 3 y de 5,
// "Fizz" si es múltiplo de 3, "Buzz" si es múltiplo de 5, y si no, el número
// como texto.
// Ejercicio 2: todosPositivos(numeros) es true si todos son mayores que 0,
// sin usar every.
// Corre los tests: cuando pasen en verde, lo resolviste.

// Pista: empieza por el caso más específico (múltiplo de 15) y termina con el
// número. String(n) convierte el número en texto.

// Declara fizzBuzz: recibe un número.
export function fizzBuzz(n) {
  // Si es múltiplo de 15 (de 3 y de 5 a la vez)...
  if (n % 15 === 0) {
    // ...dice FizzBuzz.
    return "FizzBuzz";
  // Cierra el if.
  }
  // Si es múltiplo de 3...
  if (n % 3 === 0) {
    // ...dice Fizz.
    return "Fizz";
  // Cierra el if.
  }
  // Si es múltiplo de 5...
  if (n % 5 === 0) {
    // ...dice Buzz.
    return "Buzz";
  // Cierra el if.
  }
  // Si no, el número convertido en texto.
  return String(n);
// Cierra la función fizzBuzz.
}
// ↑ fizzBuzz: prueba los casos de lo específico a lo general.

// Pista: recorre la lista y devuelve false apenas encuentres uno que no sea
// positivo. Si el bucle termina sin encontrar ninguno, devuelve true.

// Declara todosPositivos: recibe una lista de números.
export function todosPositivos(numeros) {
  // Recorre cada número.
  for (const n of numeros) {
    // Si es 0 o negativo...
    if (n <= 0) {
      // ...no todos son positivos.
      return false;
    // Cierra el if.
    }
  // Cierra el for.
  }
  // ↑ for...of: corta apenas encuentra un número que no es positivo.
  // No apareció ninguno que falle: todos cumplen.
  return true;
// Cierra la función todosPositivos.
}
// ↑ todosPositivos: busca un contraejemplo; si no lo hay, todos cumplen.`)
  },
  conceptos: {
    'notas/01-booleanos.md': ['booleanos', 'tablas de verdad'],
    'ejercicios/01-booleanos.test.js': ['tests'],
    'ejercicios/01-booleanos.js': ['operadores lógicos', 'xor'],
    'notas/02-de-morgan.md': ['De Morgan'],
    'ejercicios/02-de-morgan.test.js': ['tests de bordes'],
    'ejercicios/02-de-morgan.js': ['De Morgan', 'condiciones compuestas'],
    'notas/03-reglas.md': ['resto de la división', 'excepciones primero'],
    'ejercicios/03-reglas.test.js': ['tests'],
    'ejercicios/03-reglas.js': ['condicionales', 'operador ternario'],
    'notas/04-casos.md': ['orden de los casos', 'verdad vacía'],
    'ejercicios/04-casos.test.js': ['tests'],
    'ejercicios/04-casos.js': ['orden de los casos', 'retorno temprano']
  }
};

// ---------------------------------------------------------------------------
// Matemáticas para programar
// ---------------------------------------------------------------------------

const MATE_GUIA = `## Qué vas a aprender
La matemática que más aparece al programar: división entera y resto, porcentajes y redondeo, números primos y máximo común divisor (Euclides), potencias, factorial y sucesiones.

## Cómo funciona
Cada tema: el apunte (teoría que escribes), los tests (la especificación, con resultados calculados a mano) y el ejercicio, que resuelves tú. Pistas y solución guiada si te trabas.

## Temario
1. División y resto: esDivisible, ultimoDigito, sumaDigitos
2. Porcentajes y redondeo: redondear, aplicarDescuento, porcentajeDe
3. Primos y MCD: esPrimo, mcd
4. Potencias y sucesiones: potencia, factorial, fibonacci

## Tests
\`npx vitest run\` corre todos. Los decimales se comparan con toBeCloseTo, porque las computadoras guardan los decimales con pequeños errores.

## Cómo seguir
- Algoritmos y estructuras de datos
- Diseño con JavaScript: la matemática aplicada a tamaños, grillas y color`;

const MATEMATICAS: Lesson = {
  id: 'matematicas-js',
  tipo: 'curso',
  tema: 'Matemáticas para programar',
  topicId: 'matematicas',
  titulo: 'Matemáticas para programar: teoría y ejercicios',
  dificultad: 'media',
  duracion: '2 a 3 horas',
  proyecto: 'curso de matemáticas para programar en JavaScript: teoría escrita y ejercicios con tests; explica cada idea matemática con un ejemplo calculado a mano',
  stack: { resumen: 'JavaScript (ES modules) + Vitest', lenguaje: 'JavaScript', tests: 'Vitest' },
  convenciones: ['ES modules (import/export)', 'apuntes en notas/', 'cada ejercicio en ejercicios/NN-tema.js con sus tests al lado', 'decimales comparados con toBeCloseTo'],
  objetivos: ['división entera y resto', 'porcentajes y redondeo', 'primos y máximo común divisor', 'potencias, factorial y sucesiones'],
  entorno: {
    instalar: [{ comando: 'npm install -D vitest', explicacion: 'Instala Vitest, el corredor de tests, como dependencia de desarrollo (-D).' }],
    testear: { comando: 'npx vitest run', explicacion: 'Corre todos los tests una vez.' }
  },
  plan: [
    { paso: 'Manifiesto del proyecto', tipo: 'config', archivo: 'package.json', concepto: 'scripts y Vitest' },
    { paso: 'Apunte: división y resto', tipo: 'teoria', archivo: 'notas/01-division.md', concepto: 'división entera y resto' },
    { paso: 'Tests: divisibilidad y dígitos', tipo: 'test', archivo: 'ejercicios/01-division.test.js', concepto: 'casos calculados a mano', verificar: 'npx vitest run ejercicios/01' },
    { paso: 'Ejercicio: divisibilidad y dígitos', tipo: 'ejercicio', archivo: 'ejercicios/01-division.js', concepto: '% y Math.floor', verificar: 'npx vitest run ejercicios/01' },
    { paso: 'Apunte: porcentajes y redondeo', tipo: 'teoria', archivo: 'notas/02-porcentajes.md', concepto: 'porcentajes' },
    { paso: 'Tests: redondeo y descuentos', tipo: 'test', archivo: 'ejercicios/02-porcentajes.test.js', concepto: 'toBeCloseTo', verificar: 'npx vitest run ejercicios/02' },
    { paso: 'Ejercicio: redondeo y descuentos', tipo: 'ejercicio', archivo: 'ejercicios/02-porcentajes.js', concepto: 'Math.round', verificar: 'npx vitest run ejercicios/02' },
    { paso: 'Apunte: primos y MCD', tipo: 'teoria', archivo: 'notas/03-primos.md', concepto: 'primos y Euclides' },
    { paso: 'Tests: primos y MCD', tipo: 'test', archivo: 'ejercicios/03-primos.test.js', concepto: 'casos borde', verificar: 'npx vitest run ejercicios/03' },
    { paso: 'Ejercicio: primos y MCD', tipo: 'ejercicio', archivo: 'ejercicios/03-primos.js', concepto: 'algoritmo de Euclides', verificar: 'npx vitest run ejercicios/03' },
    { paso: 'Apunte: potencias y sucesiones', tipo: 'teoria', archivo: 'notas/04-sucesiones.md', concepto: 'sucesiones' },
    { paso: 'Tests: potencia, factorial y Fibonacci', tipo: 'test', archivo: 'ejercicios/04-sucesiones.test.js', concepto: 'casos base', verificar: 'npx vitest run ejercicios/04' },
    { paso: 'Ejercicio: potencia, factorial y Fibonacci', tipo: 'ejercicio', archivo: 'ejercicios/04-sucesiones.js', concepto: 'bucles que acumulan', verificar: 'npx vitest run ejercicios/04' },
    curso('Correr todos los tests', 'npx vitest run')
  ],
  guia: MATE_GUIA,
  archivos: {
    'package.json': pkg('matematicas-para-programar'),
    'notas/01-division.md': L(`
> Apunte 1. Dividir en programación: el cociente entero y el resto. Todo se escribe: también las explicaciones.
> Al dividir 17 entre 5 entran 3 enteros y sobran 2. El 3 es el cociente; el 2, el resto.
## División entera y resto
> Así se escribe la cuenta completa:
17 = 5 x 3 + 2
> En JavaScript, / da el resultado con decimales; Math.floor lo redondea hacia abajo; % da el resto.
\`\`\`js
// 17 / 5 es 3.4; Math.floor lo baja a 3: el cociente entero.
Math.floor(17 / 5);
// El resto de dividir 17 por 5: 2.
17 % 5;
\`\`\`
> Si el resto es 0, la división es exacta: el número es divisible. El último dígito de un número es su resto al dividir por 10.
a % b === 0 significa que b divide a a.
> Para recorrer los dígitos: % 10 da el último y Math.floor(n / 10) lo saca.
% 10 da el último dígito; dividir por 10 lo quita.`),
    'ejercicios/01-division.test.js': L(`
// Cómo empezar: cada resultado esperado se calcula a mano, con números chicos.
// describe, it y expect: las tres piezas de un test, desde Vitest.
import { describe, it, expect } from "vitest";
// Las funciones que vas a programar en el ejercicio.
import { esDivisible, ultimoDigito, sumaDigitos } from "./01-division.js";

// describe agrupa los tests de esDivisible.
describe("esDivisible", () => {
  // 12 entre 3 da exacto; 12 entre 5 sobra 2.
  it("true si la división es exacta", () => {
    // 12 = 3 x 4, sin resto.
    expect(esDivisible(12, 3)).toBe(true);
    // 12 = 5 x 2 + 2: sobra 2.
    expect(esDivisible(12, 5)).toBe(false);
  // Cierra el caso.
  });
// Cierra el grupo de esDivisible.
});
// ↑ esDivisible: comprueba una división exacta y una con resto.

// describe agrupa los tests de los dígitos.
describe("dígitos", () => {
  // El último dígito es el resto al dividir por 10.
  it("ultimoDigito es el resto al dividir por 10", () => {
    // El último dígito de 1234 es 4.
    expect(ultimoDigito(1234)).toBe(4);
    // Un número de un dígito es su propio último dígito.
    expect(ultimoDigito(7)).toBe(7);
  // Cierra el caso.
  });
  // 1 + 2 + 3 + 4 = 10. El borde: un número de un solo dígito.
  it("sumaDigitos suma cada dígito", () => {
    // 1 + 2 + 3 + 4 = 10.
    expect(sumaDigitos(1234)).toBe(10);
    // Un solo dígito: la suma es él mismo.
    expect(sumaDigitos(9)).toBe(9);
  // Cierra el caso.
  });
// Cierra el grupo de dígitos.
});
// ↑ dígitos: comprueba el último dígito y la suma de todos.`),
    'ejercicios/01-division.js': L(`
// Ejercicio 1: esDivisible(a, b) es true si a se divide exacto por b.
// Ejercicio 2: ultimoDigito(n) devuelve el último dígito de n (n entero, 0 o más).
// Ejercicio 3: sumaDigitos(n) devuelve la suma de los dígitos de n.
// Corre los tests: cuando pasen en verde, lo resolviste.

// Pista: una división es exacta cuando el resto es 0.

// Declara esDivisible: recibe el número y el divisor.
export function esDivisible(a, b) {
  // Es divisible si el resto de dividir a por b es 0.
  return a % b === 0;
// Cierra la función esDivisible.
}
// ↑ esDivisible: mira si el resto de dividir a por b es 0.

// Pista: el último dígito es lo que sobra al dividir por 10.

// Declara ultimoDigito: recibe un número.
export function ultimoDigito(n) {
  // El resto de dividir por 10 es el último dígito.
  return n % 10;
// Cierra la función ultimoDigito.
}
// ↑ ultimoDigito: devuelve el resto de dividir por 10.

// Pista: mientras n sea mayor que 0, suma su último dígito y sácalo dividiendo
// por 10 con Math.floor.

// Declara sumaDigitos: recibe un número.
export function sumaDigitos(n) {
  // El acumulador empieza en 0.
  let suma = 0;
  // Mientras queden dígitos...
  while (n > 0) {
    // ...suma el último dígito...
    suma = suma + (n % 10);
    // ...y lo quita, dividiendo por 10 y bajando al entero.
    n = Math.floor(n / 10);
  // Cierra el while.
  }
  // ↑ while: en cada vuelta suma el último dígito y lo quita.
  // Devuelve la suma de los dígitos.
  return suma;
// Cierra la función sumaDigitos.
}
// ↑ sumaDigitos: recorre los dígitos de derecha a izquierda y los suma.`),
    'notas/02-porcentajes.md': L(`
> Apunte 2. Porcentajes y redondeo: lo de todos los días en precios y estadísticas.
## Porcentajes
> Un porcentaje es una fracción de 100: el 15% de algo es ese algo multiplicado por 15 / 100.
El 15% de 1000 es 1000 x 15 / 100 = 150.
> Un descuento del 15% deja el 85%: precio x (1 - 15 / 100).
\`\`\`js
// 1000 con 15% de descuento: queda el 85%, es decir 850.
const final = 1000 * (1 - 15 / 100);
\`\`\`
> La computadora guarda los decimales en binario y a veces quedan errores chicos: 0.1 + 0.2 da 0.30000000000000004.
Los decimales tienen errores chicos: se redondea al mostrar.
> Para redondear a 2 decimales: multiplicar por 100, redondear al entero y dividir por 100.
\`\`\`js
// 3.14159 x 100 = 314.159; Math.round da 314; dividido 100 queda 3.14.
Math.round(3.14159 * 100) / 100;
\`\`\``),
    'ejercicios/02-porcentajes.test.js': L(`
// Cómo empezar: los resultados con decimales se comparan con toBeCloseTo, que
// acepta los errores chicos de la computadora.
// describe, it y expect: las tres piezas de un test, desde Vitest.
import { describe, it, expect } from "vitest";
// Las funciones que vas a programar en el ejercicio.
import { redondear, aplicarDescuento, porcentajeDe } from "./02-porcentajes.js";

// describe agrupa los tests de redondear.
describe("redondear", () => {
  // Con decimales y sin decimales.
  it("redondea a la cantidad de decimales pedida", () => {
    // 3.14159 con 2 decimales es 3.14.
    expect(redondear(3.14159, 2)).toBeCloseTo(3.14);
    // 2.5 sin decimales redondea hacia arriba: 3.
    expect(redondear(2.5, 0)).toBe(3);
  // Cierra el caso.
  });
// Cierra el grupo de redondear.
});
// ↑ redondear: comprueba dos decimales y el redondeo a entero.

// describe agrupa los tests de porcentajes.
describe("porcentajes", () => {
  // 1000 con 15% de descuento: 850. Con centavos, se redondea a 2 decimales.
  it("aplicarDescuento resta el porcentaje y redondea", () => {
    // Un descuento exacto.
    expect(aplicarDescuento(1000, 15)).toBe(850);
    // Con centavos: 999.99 menos 10% es 899.991, que queda en 899.99.
    expect(aplicarDescuento(999.99, 10)).toBeCloseTo(899.99);
  // Cierra el caso.
  });
  // 25 de 200 es el 12.5%.
  it("porcentajeDe dice qué parte es del total", () => {
    // 25 dividido 200, por 100: 12.5.
    expect(porcentajeDe(25, 200)).toBe(12.5);
  // Cierra el caso.
  });
// Cierra el grupo de porcentajes.
});
// ↑ porcentajes: comprueba un descuento exacto, uno con centavos y una proporción.`),
    'ejercicios/02-porcentajes.js': L(`
// Ejercicio 1: redondear(x, decimales) redondea x a esa cantidad de decimales.
// Ejercicio 2: aplicarDescuento(precio, porcentaje) devuelve el precio con el
// descuento, redondeado a 2 decimales.
// Ejercicio 3: porcentajeDe(parte, total) dice qué porcentaje es parte de total.
// Corre los tests: cuando pasen en verde, lo resolviste.

// Pista: 10 ** decimales es 1, 10, 100… Multiplica, redondea con Math.round y
// vuelve a dividir.

// Declara redondear: recibe el número y cuántos decimales dejar.
export function redondear(x, decimales) {
  // factor: 10 elevado a la cantidad de decimales (2 decimales: 100).
  const factor = 10 ** decimales;
  // Corre la coma, redondea al entero y la vuelve a su lugar.
  return Math.round(x * factor) / factor;
// Cierra la función redondear.
}
// ↑ redondear: corre la coma, redondea al entero y la vuelve a su lugar.

// Pista: con descuento queda (1 - porcentaje / 100) del precio. Después usa
// redondear, que ya escribiste, con 2 decimales.

// Declara aplicarDescuento: recibe el precio y el porcentaje de descuento.
export function aplicarDescuento(precio, porcentaje) {
  // Calcula lo que queda y lo redondea a 2 decimales.
  return redondear(precio * (1 - porcentaje / 100), 2);
// Cierra la función aplicarDescuento.
}
// ↑ aplicarDescuento: calcula lo que queda después del descuento y lo redondea.

// Pista: la parte dividida por el total da una fracción; por 100 es porcentaje.

// Declara porcentajeDe: recibe la parte y el total.
export function porcentajeDe(parte, total) {
  // La fracción parte / total, multiplicada por 100.
  return (parte / total) * 100;
// Cierra la función porcentajeDe.
}
// ↑ porcentajeDe: convierte la fracción parte / total en porcentaje.`),
    'notas/03-primos.md': L(`
> Apunte 3. Números primos y máximo común divisor: dos clásicos que aparecen en todas partes.
## Primos
> Un número primo es mayor que 1 y solo se divide exacto por 1 y por sí mismo: 2, 3, 5, 7, 11…
Un primo solo se divide por 1 y por sí mismo.
> Para saber si n es primo alcanza con probar divisores hasta la raíz de n: si i x i ya pasó a n, no hay más que probar.
\`\`\`js
// i va desde 2 mientras i x i no pase a n.
for (let i = 2; i * i <= n; i++) {
// Cierra el bucle (aquí iría la prueba de cada divisor).
}
\`\`\`
> Ahora, el divisor común más grande.
## Máximo común divisor
> El MCD de dos números es el divisor más grande que comparten. El de 12 y 18 es 6.
> Euclides: el MCD de a y b es el MCD de b y el resto de a entre b. Cuando el resto es 0, el MCD es b.
mcd(12, 18) = mcd(18, 12) = mcd(12, 6) = mcd(6, 0) = 6`),
    'ejercicios/03-primos.test.js': L(`
// Cómo empezar: los bordes de esPrimo son 0, 1 y 2 (el único primo par), y un
// número como 9, que tiene divisores pero no es par.
// describe, it y expect: las tres piezas de un test, desde Vitest.
import { describe, it, expect } from "vitest";
// Las funciones que vas a programar en el ejercicio.
import { esPrimo, mcd } from "./03-primos.js";

// describe agrupa los tests de esPrimo.
describe("esPrimo", () => {
  // Primos chicos y grandes.
  it("reconoce primos", () => {
    // 2 es el único primo par.
    expect(esPrimo(2)).toBe(true);
    // 17 solo se divide por 1 y por 17.
    expect(esPrimo(17)).toBe(true);
  // Cierra el caso.
  });
  // 0 y 1 no son primos por definición; 9 = 3 x 3.
  it("descarta los que no lo son", () => {
    // 0 no es primo.
    expect(esPrimo(0)).toBe(false);
    // 1 tampoco.
    expect(esPrimo(1)).toBe(false);
    // 9 se divide por 3.
    expect(esPrimo(9)).toBe(false);
  // Cierra el caso.
  });
// Cierra el grupo de esPrimo.
});
// ↑ esPrimo: comprueba primos chicos y grandes, y los bordes 0, 1 y 9.

// describe agrupa los tests de mcd.
describe("mcd", () => {
  // Con divisor común y sin él.
  it("encuentra el divisor común más grande", () => {
    // 12 y 18 comparten el 6.
    expect(mcd(12, 18)).toBe(6);
    // 7 y 5 solo comparten el 1.
    expect(mcd(7, 5)).toBe(1);
  // Cierra el caso.
  });
  // El borde: el MCD de un número y 0 es ese número.
  it("con 0 devuelve el otro número", () => {
    // mcd(10, 0) es 10.
    expect(mcd(10, 0)).toBe(10);
  // Cierra el caso.
  });
// Cierra el grupo de mcd.
});
// ↑ mcd: comprueba números con divisor común, sin él y el borde con 0.`),
    'ejercicios/03-primos.js': L(`
// Ejercicio 1: esPrimo(n) es true si n es primo.
// Ejercicio 2: mcd(a, b) devuelve el máximo común divisor, con el algoritmo de
// Euclides.
// Corre los tests: cuando pasen en verde, lo resolviste.

// Pista: los menores que 2 no son primos. Después prueba cada i desde 2
// mientras i * i <= n: si alguno divide a n, no es primo.

// Declara esPrimo: recibe un número.
export function esPrimo(n) {
  // Si es menor que 2...
  if (n < 2) {
    // ...no es primo.
    return false;
  // Cierra el if.
  }
  // Prueba cada divisor posible desde 2 hasta la raíz de n.
  for (let i = 2; i * i <= n; i++) {
    // Si i divide exacto a n...
    if (n % i === 0) {
      // ...tiene otro divisor: no es primo.
      return false;
    // Cierra el if.
    }
  // Cierra el for.
  }
  // ↑ for: busca un divisor hasta la raíz de n; si lo encuentra, no es primo.
  // No encontró divisores: es primo.
  return true;
// Cierra la función esPrimo.
}
// ↑ esPrimo: descarta los menores que 2 y busca divisores hasta la raíz.

// Pista: mientras b no sea 0, el nuevo par es (b, a % b). Guarda a % b en una
// variable antes de pisar los valores.

// Declara mcd: recibe dos números.
export function mcd(a, b) {
  // Mientras b no sea 0...
  while (b !== 0) {
    // Guarda el resto de dividir a por b.
    const resto = a % b;
    // a pasa a ser b.
    a = b;
    // b pasa a ser el resto.
    b = resto;
  // Cierra el while.
  }
  // ↑ while: reemplaza el par por (b, resto) hasta que el resto es 0.
  // Cuando b es 0, el MCD quedó en a.
  return a;
// Cierra la función mcd.
}
// ↑ mcd: aplica Euclides hasta que el resto es 0 y devuelve el último divisor.`),
    'notas/04-sucesiones.md': L(`
> Apunte 4. Potencias, factorial y sucesiones: cálculos que se arman multiplicando o sumando paso a paso.
## Potencias y factorial
> Una potencia es multiplicar un número por sí mismo varias veces: 2 a la 3 es 2 x 2 x 2 = 8. Cualquier número a la 0 es 1.
2 elevado a 3 es 2 x 2 x 2.
> El factorial de n (n!) es 1 x 2 x … x n. Por definición, 0! = 1.
5! = 120
> Para multiplicar se usa un acumulador que empieza en 1, el neutro de la multiplicación.
\`\`\`js
// producto empieza en 1: multiplicar por 1 no cambia nada.
let producto = 1;
\`\`\`
> Y una sucesión famosa.
## Fibonacci
> En la sucesión de Fibonacci cada número es la suma de los dos anteriores: 0, 1, 1, 2, 3, 5, 8, 13…
Cada número es la suma de los dos anteriores.`),
    'ejercicios/04-sucesiones.test.js': L(`
// Cómo empezar: los casos base (exponente 0, 0!, los primeros Fibonacci) son
// los que más se olvidan. Por eso cada test tiene uno.
// describe, it y expect: las tres piezas de un test, desde Vitest.
import { describe, it, expect } from "vitest";
// Las funciones que vas a programar en el ejercicio.
import { potencia, factorial, fibonacci } from "./04-sucesiones.js";

// describe agrupa los tests de potencia.
describe("potencia", () => {
  // Dos potencias conocidas.
  it("multiplica la base tantas veces como el exponente", () => {
    // 2 x 2 x 2 = 8.
    expect(potencia(2, 3)).toBe(8);
    // 5 x 5 = 25.
    expect(potencia(5, 2)).toBe(25);
  // Cierra el caso.
  });
  // El caso base.
  it("exponente 0 da 1", () => {
    // Cualquier número a la 0 es 1.
    expect(potencia(7, 0)).toBe(1);
  // Cierra el caso.
  });
// Cierra el grupo de potencia.
});
// ↑ potencia: comprueba dos potencias y el exponente 0.

// describe agrupa los tests de factorial.
describe("factorial", () => {
  // Un caso normal y el caso base.
  it("5! es 120 y 0! es 1", () => {
    // 1 x 2 x 3 x 4 x 5 = 120.
    expect(factorial(5)).toBe(120);
    // Por definición, 0! = 1.
    expect(factorial(0)).toBe(1);
  // Cierra el caso.
  });
// Cierra el grupo de factorial.
});
// ↑ factorial: comprueba un caso normal y el caso base.

// describe agrupa los tests de fibonacci.
describe("fibonacci", () => {
  // La sucesión empieza 0, 1, 1, 2, 3, 5…: fibonacci(0) es 0.
  it("los primeros términos", () => {
    // El término 0 es 0.
    expect(fibonacci(0)).toBe(0);
    // El término 1 es 1.
    expect(fibonacci(1)).toBe(1);
    // El término 2 es 0 + 1 = 1.
    expect(fibonacci(2)).toBe(1);
  // Cierra el caso.
  });
  // Un término lejano, calculado a mano.
  it("el término 10 es 55", () => {
    // 0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55.
    expect(fibonacci(10)).toBe(55);
  // Cierra el caso.
  });
// Cierra el grupo de fibonacci.
});
// ↑ fibonacci: comprueba los casos base y un término lejano.`),
    'ejercicios/04-sucesiones.js': L(`
// Ejercicio 1: potencia(base, exponente) sin usar ** ni Math.pow (exponente
// entero, 0 o más).
// Ejercicio 2: factorial(n) devuelve n! (con 0! = 1).
// Ejercicio 3: fibonacci(n) devuelve el término n de la sucesión 0, 1, 1, 2, 3…
// Corre los tests: cuando pasen en verde, lo resolviste.

// Pista: un acumulador que empieza en 1 y se multiplica por la base tantas
// veces como diga el exponente. Con exponente 0 no hay vueltas y queda 1.

// Declara potencia: recibe la base y el exponente.
export function potencia(base, exponente) {
  // El acumulador empieza en 1.
  let resultado = 1;
  // Da tantas vueltas como el exponente.
  for (let i = 0; i < exponente; i++) {
    // En cada vuelta multiplica por la base.
    resultado = resultado * base;
  // Cierra el for.
  }
  // Devuelve la potencia.
  return resultado;
// Cierra la función potencia.
}
// ↑ potencia: multiplica la base por sí misma tantas veces como el exponente.

// Pista: igual que potencia, pero multiplicando por 2, 3, … hasta n.

// Declara factorial: recibe n.
export function factorial(n) {
  // El acumulador empieza en 1.
  let producto = 1;
  // i va de 2 hasta n.
  for (let i = 2; i <= n; i++) {
    // Multiplica por el número de esta vuelta.
    producto = producto * i;
  // Cierra el for.
  }
  // Devuelve el factorial.
  return producto;
// Cierra la función factorial.
}
// ↑ factorial: multiplica los números de 2 a n; con 0 o 1 queda en 1.

// Pista: guarda los dos últimos términos (a = 0, b = 1). En cada vuelta, el
// siguiente es a + b y los dos avanzan un lugar.

// Declara fibonacci: recibe qué término calcular.
export function fibonacci(n) {
  // a: el término actual; empieza en el primero, 0.
  let a = 0;
  // b: el siguiente; empieza en 1.
  let b = 1;
  // Avanza n lugares.
  for (let i = 0; i < n; i++) {
    // El que viene después de b es a + b.
    const siguiente = a + b;
    // a avanza a b.
    a = b;
    // b avanza al siguiente.
    b = siguiente;
  // Cierra el for.
  }
  // ↑ for: corre el par de términos n lugares hacia adelante.
  // Devuelve el término que quedó en el lugar n.
  return a;
// Cierra la función fibonacci.
}
// ↑ fibonacci: avanza de a dos términos y devuelve el que quedó en el lugar n.`)
  },
  conceptos: {
    'notas/01-division.md': ['resto de la división', 'división entera'],
    'ejercicios/01-division.test.js': ['tests'],
    'ejercicios/01-division.js': ['resto de la división', 'while'],
    'notas/02-porcentajes.md': ['porcentajes', 'redondeo'],
    'ejercicios/02-porcentajes.test.js': ['toBeCloseTo'],
    'ejercicios/02-porcentajes.js': ['porcentajes', 'Math.round'],
    'notas/03-primos.md': ['números primos', 'algoritmo de Euclides'],
    'ejercicios/03-primos.test.js': ['tests de bordes'],
    'ejercicios/03-primos.js': ['números primos', 'algoritmo de Euclides'],
    'notas/04-sucesiones.md': ['potencias', 'factorial', 'Fibonacci'],
    'ejercicios/04-sucesiones.test.js': ['casos base'],
    'ejercicios/04-sucesiones.js': ['acumuladores', 'Fibonacci']
  }
};

// ---------------------------------------------------------------------------
// Diseño con JavaScript
// ---------------------------------------------------------------------------

const DISENO_GUIA = `## Qué vas a aprender
Los fundamentos del diseño gráfico escritos como código: jerarquía con una escala tipográfica modular, grilla de columnas, color en HSL, contraste legible (WCAG) y la matemática que usan los shaders (mix, smoothstep, distancia con aspecto y fBm). Al final, un póster en canvas que usa todo.

## Cómo funciona
Cada principio tiene su apunte (teoría que escribes), sus tests y un ejercicio: una función pura que calcula los números del diseño (tamaños, posiciones, colores). El canvas solo dibuja lo que calculan. Así se estudia diseño: entender el principio, escribirlo y después variar un valor por vez.

## Temario
1. Jerarquía: escalaModular, alinearA
2. Grilla: columnas, abarcar
3. Color: complementario, paleta
4. Contraste: hexARgb, luminancia, contraste, esLegible
5. Matemática de shaders: mezclar, suavizar, distanciaAlCentro, amplitudesFbm, mezclarColor
6. El póster: index.html y src/main.js, y verlo con \`npx vite\`

## Tests
\`npx vitest run\` prueba los números sin pantalla. Lo visual se mira en la vista previa: cambia la razón de la escala, la cantidad de columnas o el tono, y compara.

## Cómo seguir
- Tipografía cinética con GSAP
- Paletas en OKLCH
- Efectos WebGPU por capas: la lección «Un fondo vivo con Shaders» usa esta misma matemática en la GPU
- Creative coding con p5.js`;

const DISENO: Lesson = {
  id: 'diseno-js',
  tipo: 'curso',
  tema: 'Composición y diseño con JavaScript',
  topicId: 'composicion-diseno',
  titulo: 'Diseño con JavaScript: teoría y ejercicios',
  dificultad: 'media',
  duracion: '3 horas',
  proyecto: 'curso de diseño con JavaScript: jerarquía, grilla, color, contraste y la matemática de los shaders como funciones puras con tests, y un póster en canvas; explica cada principio de diseño y por qué cada valor',
  stack: { resumen: 'JavaScript (ES modules) + Canvas 2D + Vite + Vitest', lenguaje: 'JavaScript', framework: 'Canvas 2D + Vite', tests: 'Vitest' },
  convenciones: ['ES modules (import/export)', 'los números del diseño en ejercicios/, puros y testeados', 'src/main.js solo dibuja', 'apuntes en notas/'],
  arquitectura: 'componentes',
  objetivos: ['jerarquía y escala modular', 'grilla de columnas', 'color en HSL', 'contraste legible', 'mix, smoothstep y fBm'],
  entorno: {
    instalar: [{ comando: 'npm install -D vite vitest', explicacion: 'Vite sirve la página y recarga al guardar; Vitest prueba los números del diseño.' }],
    ejecutar: { comando: 'npx vite', explicacion: 'Abre http://localhost:5173 y mira el póster.' },
    testear: { comando: 'npx vitest run', explicacion: 'Prueba los números del diseño, sin pantalla.' }
  },
  plan: [
    { paso: 'Manifiesto del proyecto', tipo: 'config', archivo: 'package.json', concepto: 'scripts de Vite y Vitest' },
    { paso: 'Apunte: jerarquía y escala', tipo: 'teoria', archivo: 'notas/01-jerarquia.md', concepto: 'escala modular' },
    { paso: 'Tests: escala y línea base', tipo: 'test', archivo: 'ejercicios/01-escala.test.js', concepto: 'números del diseño', verificar: 'npx vitest run ejercicios/01' },
    { paso: 'Ejercicio: escala y línea base', tipo: 'ejercicio', archivo: 'ejercicios/01-escala.js', concepto: 'escala modular', verificar: 'npx vitest run ejercicios/01' },
    { paso: 'Apunte: la grilla', tipo: 'teoria', archivo: 'notas/02-grilla.md', concepto: 'grilla de columnas' },
    { paso: 'Tests: columnas', tipo: 'test', archivo: 'ejercicios/02-grilla.test.js', concepto: 'posiciones calculadas a mano', verificar: 'npx vitest run ejercicios/02' },
    { paso: 'Ejercicio: columnas', tipo: 'ejercicio', archivo: 'ejercicios/02-grilla.js', concepto: 'grilla', verificar: 'npx vitest run ejercicios/02' },
    { paso: 'Apunte: color en HSL', tipo: 'teoria', archivo: 'notas/03-color.md', concepto: 'HSL y armonías' },
    { paso: 'Tests: paletas', tipo: 'test', archivo: 'ejercicios/03-color.test.js', concepto: 'colores como datos', verificar: 'npx vitest run ejercicios/03' },
    { paso: 'Ejercicio: paletas', tipo: 'ejercicio', archivo: 'ejercicios/03-color.js', concepto: 'rueda de color', verificar: 'npx vitest run ejercicios/03' },
    { paso: 'Apunte: contraste', tipo: 'teoria', archivo: 'notas/04-contraste.md', concepto: 'contraste WCAG' },
    { paso: 'Tests: contraste', tipo: 'test', archivo: 'ejercicios/04-contraste.test.js', concepto: 'toBeCloseTo', verificar: 'npx vitest run ejercicios/04' },
    { paso: 'Ejercicio: contraste', tipo: 'ejercicio', archivo: 'ejercicios/04-contraste.js', concepto: 'luminancia relativa', verificar: 'npx vitest run ejercicios/04' },
    { paso: 'Apunte: la matemática de los shaders', tipo: 'teoria', archivo: 'notas/05-shaders.md', concepto: 'mix, smoothstep y fBm' },
    { paso: 'Tests: matemática de shaders', tipo: 'test', archivo: 'ejercicios/05-shaders.test.js', concepto: 'bordes y puntos calculados a mano', verificar: 'npx vitest run ejercicios/05' },
    { paso: 'Ejercicio: matemática de shaders', tipo: 'ejercicio', archivo: 'ejercicios/05-shaders.js', concepto: 'mix y smoothstep', verificar: 'npx vitest run ejercicios/05' },
    { paso: 'La página con el lienzo', tipo: 'codigo', archivo: 'index.html', concepto: 'canvas a pantalla completa' },
    { paso: 'Dibujar el póster', tipo: 'codigo', archivo: 'src/main.js', concepto: 'el canvas solo dibuja' },
    { paso: 'Verlo y variar un valor', tipo: 'comando', comando: 'npx vite', explicacion: 'Un póster con título, bloques de color en la grilla y un subtítulo. Cambia la razón de la escala, la cantidad de columnas o el tono, guarda y compara: así se estudia diseño.' }
  ],
  guia: DISENO_GUIA,
  archivos: {
    'package.json': pkg('diseno-con-javascript', true),
    'notas/01-jerarquia.md': L(`
> Apunte 1. Jerarquía: el ojo lee primero lo más grande. Los tamaños no se eligen al azar. Todo se escribe: también las explicaciones.
## Escala modular
> Una escala modular parte de un tamaño base y multiplica siempre por la misma razón: 16, 20, 25, 31…
Cada tamaño es el anterior por la misma razón.
> Razones comunes: 1.25 (tercera mayor, suave) y 1.5 (quinta justa, contrastada). Más razón, más jerarquía.
\`\`\`js
// El tercer tamaño de la escala: 16 por 1.25 dos veces (25).
16 * 1.25 ** 2;
\`\`\`
> La línea base es una grilla vertical invisible (por ejemplo, cada 8 px). Alinear las medidas a ella da ritmo.
Las medidas se alinean a la línea base para dar ritmo.`),
    'ejercicios/01-escala.test.js': L(`
// Cómo empezar: los tamaños de la escala se calculan a mano y se redondean a
// píxeles enteros: 16, 20, 25 y 31,25, que queda en 31.
// describe, it y expect: las tres piezas de un test, desde Vitest.
import { describe, it, expect } from "vitest";
// Las funciones que vas a programar en el ejercicio.
import { escalaModular, alinearA } from "./01-escala.js";

// describe agrupa los tests de escalaModular.
describe("escalaModular", () => {
  // Cuatro pasos con razón 1.25.
  it("multiplica por la razón y redondea", () => {
    // 16, 20, 25 y 31,25 redondeado a 31.
    expect(escalaModular(16, 1.25, 4)).toEqual([16, 20, 25, 31]);
  // Cierra el caso.
  });
  // Con más razón, los saltos son más grandes: más jerarquía.
  it("una razón mayor da saltos mayores", () => {
    // 16, 24 y 36.
    expect(escalaModular(16, 1.5, 3)).toEqual([16, 24, 36]);
  // Cierra el caso.
  });
// Cierra el grupo de escalaModular.
});
// ↑ escalaModular: comprueba dos razones y el redondeo a enteros.

// describe agrupa los tests de alinearA.
describe("alinearA", () => {
  // 23 queda más cerca de 24 que de 16: se alinea a 24.
  it("lleva una medida al múltiplo más cercano", () => {
    // 23 sube a 24.
    expect(alinearA(23, 8)).toBe(24);
    // 19 baja a 16.
    expect(alinearA(19, 8)).toBe(16);
  // Cierra el caso.
  });
// Cierra el grupo de alinearA.
});
// ↑ alinearA: comprueba que redondea hacia el múltiplo más cercano.`),
    'ejercicios/01-escala.js': L(`
// Ejercicio 1: escalaModular(base, razon, pasos) devuelve una lista con
// "pasos" tamaños: base, base x razon, base x razon x razon… redondeados.
// Ejercicio 2: alinearA(medida, paso) lleva la medida al múltiplo de paso más
// cercano (la línea base).
// Corre los tests: cuando pasen en verde, lo resolviste.

// Pista: un for de 0 a pasos. El tamaño i es base * razon ** i, redondeado con
// Math.round, y se agrega a la lista con push.

// Declara escalaModular: recibe el tamaño base, la razón y cuántos pasos.
export function escalaModular(base, razon, pasos) {
  // La lista de tamaños empieza vacía.
  const tamanos = [];
  // Una vuelta por cada paso.
  for (let i = 0; i < pasos; i++) {
    // Agrega el tamaño i: la base por la razón i veces, redondeado.
    tamanos.push(Math.round(base * razon ** i));
  // Cierra el for.
  }
  // Devuelve la escala.
  return tamanos;
// Cierra la función escalaModular.
}
// ↑ escalaModular: arma la lista de tamaños multiplicando por la razón.

// Pista: divide por el paso, redondea al entero y vuelve a multiplicar.

// Declara alinearA: recibe la medida y el paso de la línea base.
export function alinearA(medida, paso) {
  // Cuántos pasos entran (redondeado), por el tamaño del paso.
  return Math.round(medida / paso) * paso;
// Cierra la función alinearA.
}
// ↑ alinearA: devuelve el múltiplo de paso más cercano a la medida.`),
    'notas/02-grilla.md': L(`
> Apunte 2. La grilla ordena: todo se alinea a unas pocas columnas y los espacios se repiten.
## Columnas
> Una grilla tiene márgenes a los costados, columnas del mismo ancho y medianiles (espacios) entre ellas.
Márgenes, columnas iguales y medianiles entre ellas.
> El ancho de una columna es lo que queda al restar los márgenes y los medianiles, dividido por la cantidad.
\`\`\`js
// El ancho total, menos dos márgenes y los medianiles, repartido entre n columnas.
const columna = (ancho - 2 * margen - (n - 1) * medianil) / n;
\`\`\`
> La columna i empieza en margen + i x (columna + medianil). Un elemento puede abarcar varias columnas seguidas.
Un elemento abarca una o varias columnas.`),
    'ejercicios/02-grilla.test.js': L(`
// Cómo empezar: con 1000 px, 4 columnas, márgenes de 40 y medianiles de 20,
// cada columna mide (1000 - 80 - 60) / 4 = 215.
// describe, it y expect: las tres piezas de un test, desde Vitest.
import { describe, it, expect } from "vitest";
// Las funciones que vas a programar en el ejercicio.
import { columnas, abarcar } from "./02-grilla.js";

// describe agrupa los tests de columnas.
describe("columnas", () => {
  // Las x avanzan de a 215 + 20 = 235 desde el margen.
  it("calcula dónde empieza cada columna y su ancho", () => {
    // Abre la comparación con las cuatro columnas esperadas.
    expect(columnas(1000, 4, 40, 20)).toEqual([
      // La primera empieza en el margen: 40.
      { x: 40, ancho: 215 },
      // La segunda, 235 más a la derecha: 275.
      { x: 275, ancho: 215 },
      // La tercera: 510.
      { x: 510, ancho: 215 },
      // La cuarta: 745.
      { x: 745, ancho: 215 }
    // Cierra la lista esperada y la comparación.
    ]);
  // Cierra el caso.
  });
// Cierra el grupo de columnas.
});
// ↑ columnas: comprueba posiciones y anchos calculados a mano.

// describe agrupa los tests de abarcar.
describe("abarcar", () => {
  // De la columna 1 a la 2: empieza en 275 y termina en 510 + 215 = 725.
  it("une columnas seguidas, con el medianil incluido", () => {
    // Calcula la grilla de ejemplo.
    const cols = columnas(1000, 4, 40, 20);
    // Dos columnas desde la 1: x 275 y ancho 725 - 275 = 450.
    expect(abarcar(cols, 1, 2)).toEqual({ x: 275, ancho: 450 });
  // Cierra el caso.
  });
// Cierra el grupo de abarcar.
});
// ↑ abarcar: comprueba que el ancho incluye el medianil del medio.`),
    'ejercicios/02-grilla.js': L(`
// Ejercicio 1: columnas(ancho, n, margen, medianil) devuelve una lista de n
// objetos { x, ancho }: dónde empieza cada columna y cuánto mide.
// Ejercicio 2: abarcar(cols, desde, cuantas) devuelve { x, ancho } de un
// elemento que ocupa "cuantas" columnas a partir de la columna "desde".
// Corre los tests: cuando pasen en verde, lo resolviste.

// Pista: primero el ancho de una columna (está en el apunte). Después, un for
// de 0 a n que agrega { x: margen + i * (columna + medianil), ancho: columna }.

// Declara columnas: recibe el ancho total, cuántas columnas, el margen y el medianil.
export function columnas(ancho, n, margen, medianil) {
  // El ancho de cada columna: el espacio libre repartido en n.
  const columna = (ancho - 2 * margen - (n - 1) * medianil) / n;
  // La lista de columnas empieza vacía.
  const lista = [];
  // Una vuelta por columna.
  for (let i = 0; i < n; i++) {
    // Agrega la columna i: dónde empieza y cuánto mide.
    lista.push({ x: margen + i * (columna + medianil), ancho: columna });
  // Cierra el for.
  }
  // Devuelve la grilla.
  return lista;
// Cierra la función columnas.
}
// ↑ columnas: reparte el espacio libre y ubica cada columna.

// Pista: empieza donde empieza la primera columna y termina donde termina la
// última (su x más su ancho). El ancho es el fin menos el comienzo.

// Declara abarcar: recibe la grilla, la primera columna y cuántas ocupa.
export function abarcar(cols, desde, cuantas) {
  // La primera columna que ocupa.
  const primera = cols[desde];
  // La última columna que ocupa.
  const ultima = cols[desde + cuantas - 1];
  // Empieza en la primera y mide hasta el borde derecho de la última.
  return { x: primera.x, ancho: ultima.x + ultima.ancho - primera.x };
// Cierra la función abarcar.
}
// ↑ abarcar: mide desde el borde izquierdo de la primera al derecho de la última.`),
    'notas/03-color.md': L(`
> Apunte 3. El color como números: HSL lo describe como lo pensamos.
## HSL
> H (tono) es un ángulo en la rueda de color, de 0 a 360: 0 rojo, 120 verde, 240 azul.
H es el tono: un ángulo de 0 a 360.
> S (saturación) va de gris a puro, y L (luminosidad) de negro a blanco, los dos en porcentaje.
\`\`\`css
/* Tono 220 (azul), saturación 65% y luminosidad 55%. */
color: hsl(220, 65%, 55%);
\`\`\`
> Armonías: el complementario está enfrente (180 grados). Repartir n colores a ángulos iguales da una paleta equilibrada.
El complementario está a 180 grados.
> Al sumar ángulos se puede pasar de 360: el resto de dividir por 360 lo devuelve a la rueda.
\`\`\`js
// 300 + 180 = 480; el resto de dividir por 360 es 120.
(300 + 180) % 360;
\`\`\``),
    'ejercicios/03-color.test.js': L(`
// Cómo empezar: los colores son textos que el navegador entiende. Los tests
// comparan el texto exacto, con espacios y porcentajes.
// describe, it y expect: las tres piezas de un test, desde Vitest.
import { describe, it, expect } from "vitest";
// Las funciones que vas a programar en el ejercicio.
import { complementario, paleta } from "./03-color.js";

// describe agrupa los tests de complementario.
describe("complementario", () => {
  // Un tono que pasa de 360 y uno que no.
  it("suma 180 y vuelve a la rueda", () => {
    // 30 + 180 = 210.
    expect(complementario(30)).toBe(210);
    // 270 + 180 = 450, que en la rueda es 90.
    expect(complementario(270)).toBe(90);
  // Cierra el caso.
  });
// Cierra el grupo de complementario.
});
// ↑ complementario: comprueba un tono que pasa de 360 y uno que no.

// describe agrupa los tests de paleta.
describe("paleta", () => {
  // Tres colores a 120 grados entre sí: una tríada.
  it("reparte los tonos a ángulos iguales", () => {
    // Desde 0: 0, 120 y 240.
    expect(paleta(0, 3)).toEqual(["hsl(0, 65%, 55%)", "hsl(120, 65%, 55%)", "hsl(240, 65%, 55%)"]);
  // Cierra el caso.
  });
  // Partiendo de 300, el segundo color da la vuelta: 300 + 180 = 480, que es 120.
  it("los tonos nunca pasan de 360", () => {
    // 300 y, dando la vuelta, 120.
    expect(paleta(300, 2)).toEqual(["hsl(300, 65%, 55%)", "hsl(120, 65%, 55%)"]);
  // Cierra el caso.
  });
// Cierra el grupo de paleta.
});
// ↑ paleta: comprueba una tríada y la vuelta a la rueda.`),
    'ejercicios/03-color.js': L(`
// Ejercicio 1: complementario(tono) devuelve el tono opuesto en la rueda.
// Ejercicio 2: paleta(tono, cantidad) devuelve "cantidad" colores HSL, con
// tonos repartidos a ángulos iguales desde "tono", saturación 65% y
// luminosidad 55%, como textos "hsl(h, 65%, 55%)".
// Corre los tests: cuando pasen en verde, lo resolviste.

// Pista: suma 180 y usa % 360 para que el resultado quede dentro de la rueda.

// Declara complementario: recibe un tono.
export function complementario(tono) {
  // Media vuelta, y el resto de 360 para no pasarse.
  return (tono + 180) % 360;
// Cierra la función complementario.
}
// ↑ complementario: gira media vuelta en la rueda de color.

// Pista: el salto entre tonos es 360 / cantidad. Arma cada texto uniendo
// "hsl(", el tono, ", 65%, 55%)" con +.

// Declara paleta: recibe el tono de partida y cuántos colores.
export function paleta(tono, cantidad) {
  // Cuántos grados separan un color del siguiente.
  const salto = 360 / cantidad;
  // La lista de colores empieza vacía.
  const colores = [];
  // Una vuelta por color.
  for (let i = 0; i < cantidad; i++) {
    // El tono i: el de partida más i saltos, dentro de la rueda y redondeado.
    const h = Math.round((tono + i * salto) % 360);
    // Arma el texto HSL y lo agrega.
    colores.push("hsl(" + h + ", 65%, 55%)");
  // Cierra el for.
  }
  // Devuelve la paleta.
  return colores;
// Cierra la función paleta.
}
// ↑ paleta: reparte los tonos en la rueda y arma un texto HSL por color.`),
    'notas/04-contraste.md': L(`
> Apunte 4. Contraste: si no se lee, no sirve. Hay una medida para saber si un texto se lee bien.
## Contraste WCAG
> Un color hexadecimal como #1d3557 son tres pares: rojo, verde y azul, cada uno de 00 a ff (0 a 255).
#rrggbb: rojo, verde y azul en base 16.
> parseInt con base 16 convierte un par hexadecimal en número: parseInt("ff", 16) es 255.
\`\`\`js
// "1d" en base 16 es 29.
parseInt("1d", 16);
\`\`\`
> La luminancia relativa mide cuánta luz percibimos: el verde pesa mucho más que el azul. Va de 0 (negro) a 1 (blanco).
> El contraste es (más clara + 0.05) / (más oscura + 0.05). Va de 1 (iguales) a 21 (negro sobre blanco).
El texto común necesita un contraste de 4.5 o más.`),
    'ejercicios/04-contraste.test.js': L(`
// Cómo empezar: los extremos se conocen (negro sobre blanco es 21, un color
// sobre sí mismo es 1). Los decimales se comparan con toBeCloseTo.
// describe, it y expect: las tres piezas de un test, desde Vitest.
import { describe, it, expect } from "vitest";
// Las funciones que vas a programar en el ejercicio.
import { hexARgb, luminancia, contraste, esLegible } from "./04-contraste.js";

// Separar un color en sus tres canales.
it("hexARgb separa rojo, verde y azul", () => {
  // 1d es 29, 35 es 53 y 57 es 87.
  expect(hexARgb("#1d3557")).toEqual({ r: 29, g: 53, b: 87 });
// Cierra el caso.
});

// describe agrupa los tests de luminancia y contraste.
describe("luminancia y contraste", () => {
  // Los extremos de la luminancia.
  it("negro es 0 y blanco es 1", () => {
    // Negro: nada de luz.
    expect(luminancia("#000000")).toBeCloseTo(0);
    // Blanco: toda la luz.
    expect(luminancia("#ffffff")).toBeCloseTo(1);
  // Cierra el caso.
  });
  // El orden no importa: siempre se divide la más clara por la más oscura.
  it("negro y blanco dan 21, un color consigo mismo da 1", () => {
    // Negro y blanco: el máximo, 21.
    expect(contraste("#000000", "#ffffff")).toBeCloseTo(21);
    // Al revés, lo mismo.
    expect(contraste("#ffffff", "#000000")).toBeCloseTo(21);
    // Un color consigo mismo: 1, sin contraste.
    expect(contraste("#777777", "#777777")).toBeCloseTo(1);
  // Cierra el caso.
  });
// Cierra el grupo.
});
// ↑ luminancia y contraste: comprueba los extremos y que el orden no importa.

// describe agrupa los tests de esLegible.
describe("esLegible", () => {
  // #777777 sobre blanco da 4.48: por muy poco no llega a 4.5.
  it("pide 4.5 o más", () => {
    // Un gris oscuro sobre blanco: se lee.
    expect(esLegible("#595959", "#ffffff")).toBe(true);
    // Un gris medio sobre blanco: no alcanza.
    expect(esLegible("#777777", "#ffffff")).toBe(false);
  // Cierra el caso.
  });
// Cierra el grupo de esLegible.
});
// ↑ esLegible: comprueba un gris que alcanza y uno que no, cerca del límite.`),
    'ejercicios/04-contraste.js': L(`
// Ejercicio 1: hexARgb(hex) convierte "#rrggbb" en { r, g, b } (0 a 255).
// Ejercicio 2: luminancia(hex) devuelve la luminancia relativa (0 a 1).
// Ejercicio 3: contraste(hex1, hex2) devuelve el contraste entre dos colores.
// Ejercicio 4: esLegible(texto, fondo) es true si el contraste es 4.5 o más.
// Corre los tests: cuando pasen en verde, lo resolviste.

// Pista: slice(1, 3) toma los caracteres 1 y 2 (sin el #). parseInt con base 16
// los convierte en número. Lo mismo con (3, 5) y (5, 7).

// Declara hexARgb: recibe un color "#rrggbb".
export function hexARgb(hex) {
  // Abre el objeto con los tres canales.
  return {
    // r: el primer par, de base 16 a número.
    r: parseInt(hex.slice(1, 3), 16),
    // g: el segundo par.
    g: parseInt(hex.slice(3, 5), 16),
    // b: el tercer par.
    b: parseInt(hex.slice(5, 7), 16)
  // Cierra el objeto.
  };
// Cierra la función hexARgb.
}
// ↑ hexARgb: separa los tres pares y los pasa de base 16 a números.

// Pista: cada canal se divide por 255 y se «linealiza»: si es 0.03928 o menos,
// c / 12.92; si no, ((c + 0.055) / 1.055) ** 2.4. Después se suman con pesos:
// 0.2126 el rojo, 0.7152 el verde y 0.0722 el azul.

// Declara luminancia: recibe un color "#rrggbb".
export function luminancia(hex) {
  // Separa el color en sus tres canales.
  const { r, g, b } = hexARgb(hex);
  // lineal convierte un canal (0 a 255) en luz lineal (0 a 1).
  const lineal = (canal) => {
    // Pasa el canal a una fracción entre 0 y 1.
    const c = canal / 255;
    // Los valores muy oscuros se dividen; el resto sigue la curva de 2.4.
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  // Cierra la función lineal.
  };
  // Suma los tres canales con su peso: el verde es el que más se percibe.
  return 0.2126 * lineal(r) + 0.7152 * lineal(g) + 0.0722 * lineal(b);
// Cierra la función luminancia.
}
// ↑ luminancia: pasa cada canal a luz lineal y los suma según cuánto se perciben.

// Pista: calcula las dos luminancias; Math.max y Math.min dicen cuál es la más
// clara y cuál la más oscura.

// Declara contraste: recibe dos colores.
export function contraste(hex1, hex2) {
  // La luminancia del primer color.
  const l1 = luminancia(hex1);
  // La luminancia del segundo.
  const l2 = luminancia(hex2);
  // La más clara más 0.05, dividida por la más oscura más 0.05.
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
// Cierra la función contraste.
}
// ↑ contraste: divide la luminancia más clara por la más oscura (más 0.05).

// Pista: usa contraste y compara con 4.5.

// Declara esLegible: recibe el color del texto y el del fondo.
export function esLegible(texto, fondo) {
  // Se lee bien si el contraste llega a 4.5.
  return contraste(texto, fondo) >= 4.5;
// Cierra la función esLegible.
}
// ↑ esLegible: aprueba los pares de colores con contraste de 4.5 o más.`),
    'notas/05-shaders.md': L(`
> Apunte 5. La matemática de los shaders: las mismas cuentas que hace la GPU, una vez por píxel, ahora escritas en JavaScript.
## Mezclar: mix
> mix (o lerp) mezcla dos valores: con t en 0 da el primero, con t en 1 el segundo y en el medio, algo entre los dos.
mix(a, b, t) = a + (b - a) * t
\`\`\`js
// Mitad de camino entre 10 y 20: 15.
10 + (20 - 10) * 0.5;
\`\`\`
> La segunda herramienta.
## Bordes suaves: smoothstep
> smoothstep(borde0, borde1, x) da 0 antes del primer borde, 1 después del segundo, y en el medio sube con una curva suave.
smoothstep: 0, una subida suave y 1.
> La curva es t * t * (3 - 2 * t), con t recortado entre 0 y 1. Así un círculo no tiene borde de serrucho.
t * t * (3 - 2 * t)
> La tercera.
## Distancia con aspecto
> Las coordenadas uv van de 0 a 1 en los dos ejes, aunque el lienzo sea más ancho que alto. Si no se corrige, un círculo sale estirado.
Multiplicar x por el aspecto (ancho / alto) corrige el estiramiento.
> La cuarta: el ruido fractal.
## fBm: ruido sobre ruido
> fBm suma varias capas (octavas) de ruido. Cada octava tiene el doble de detalle y la mitad de fuerza: 1, 0.5, 0.25…
Cada octava: la mitad de fuerza que la anterior.
> La última: mezclar colores.
## Mezclar colores
> Un color RGB son tres números. Mezclar dos colores es aplicar mix a cada canal por separado.
Mezclar colores: mix en rojo, verde y azul.`),
    'ejercicios/05-shaders.test.js': L(`
// Cómo empezar: cada función se prueba en sus bordes (t en 0 y en 1) y en un
// punto del medio que se calcula a mano.
// describe, it y expect: las tres piezas de un test, desde Vitest.
import { describe, it, expect } from "vitest";
// Las funciones que vas a programar en el ejercicio.
import { mezclar, suavizar, distanciaAlCentro, amplitudesFbm, mezclarColor } from "./05-shaders.js";

// describe agrupa los tests de mezclar.
describe("mezclar", () => {
  // Los bordes y el medio: 0 da el primero, 1 el segundo y 0.5 la mitad.
  it("con t en 0, 0.5 y 1", () => {
    // De 10 a 20: 10, 15 y 20.
    expect([mezclar(10, 20, 0), mezclar(10, 20, 0.5), mezclar(10, 20, 1)]).toEqual([10, 15, 20]);
  // Cierra el caso.
  });
// Cierra el grupo de mezclar.
});
// ↑ mezclar: los dos bordes y la mitad.

// describe agrupa los tests de suavizar.
describe("suavizar", () => {
  // Antes del primer borde es 0 y después del segundo es 1.
  it("recorta fuera de los bordes", () => {
    // 0.1 está antes de 0.2; 0.9 está después de 0.8.
    expect([suavizar(0.2, 0.8, 0.1), suavizar(0.2, 0.8, 0.9)]).toEqual([0, 1]);
  // Cierra el caso.
  });
  // En el medio exacto, la curva pasa por 0.5; a un cuarto, por 0.15625.
  it("sube con la curva t * t * (3 - 2 * t)", () => {
    // 0.5 está en el medio de 0 y 1.
    expect(suavizar(0, 1, 0.5)).toBeCloseTo(0.5);
    // 0.25 * 0.25 * (3 - 0.5) es 0.15625.
    expect(suavizar(0, 1, 0.25)).toBeCloseTo(0.15625);
  // Cierra el caso.
  });
// Cierra el grupo de suavizar.
});
// ↑ suavizar: los recortes y dos puntos de la curva.

// describe agrupa los tests de distanciaAlCentro.
describe("distanciaAlCentro", () => {
  // En un lienzo cuadrado (aspecto 1), es la distancia de siempre.
  it("en un lienzo cuadrado", () => {
    // De (0.5, 0.5) a (0.8, 0.9): 0.3 y 0.4, distancia 0.5.
    expect(distanciaAlCentro(0.8, 0.9, 0.5, 0.5, 1)).toBeCloseTo(0.5);
  // Cierra el caso.
  });
  // En un lienzo el doble de ancho, la x cuenta el doble.
  it("con aspecto 2, la x pesa el doble", () => {
    // 0.25 en x por 2 es 0.5; en y no hay diferencia.
    expect(distanciaAlCentro(0.75, 0.5, 0.5, 0.5, 2)).toBeCloseTo(0.5);
  // Cierra el caso.
  });
// Cierra el grupo de distanciaAlCentro.
});
// ↑ distanciaAlCentro: sin aspecto y con aspecto 2.

// describe agrupa los tests del ruido y del color.
describe("fBm y color", () => {
  // Cada octava, la mitad de la anterior.
  it("amplitudesFbm parte a la mitad en cada octava", () => {
    // Cuatro octavas: 1, 0.5, 0.25 y 0.125.
    expect(amplitudesFbm(4)).toEqual([1, 0.5, 0.25, 0.125]);
  // Cierra el caso.
  });
  // Mezclar negro y blanco a la mitad da gris (redondeado).
  it("mezclarColor mezcla cada canal y redondea", () => {
    // 0 y 255 a la mitad es 127.5: redondea a 128.
    expect(mezclarColor([0, 0, 0], [255, 255, 255], 0.5)).toEqual([128, 128, 128]);
    // Con t en 0 queda el primer color.
    expect(mezclarColor([124, 58, 237], [255, 107, 107], 0)).toEqual([124, 58, 237]);
  // Cierra el caso.
  });
// Cierra el grupo del ruido y el color.
});
// ↑ fBm y color: las amplitudes de cuatro octavas y una mezcla de colores.`),
    'ejercicios/05-shaders.js': L(`
// Ejercicio 1: mezclar(a, b, t) devuelve a + (b - a) * t (el mix de los shaders).
// Ejercicio 2: suavizar(borde0, borde1, x) es smoothstep: 0, una subida suave y 1.
// Ejercicio 3: distanciaAlCentro(u, v, cx, cy, aspecto) mide la distancia corrigiendo x.
// Ejercicio 4: amplitudesFbm(octavas) devuelve la fuerza de cada octava: 1, 0.5, 0.25…
// Ejercicio 5: mezclarColor(c1, c2, t) mezcla dos colores [r, g, b] y redondea.
// Corre los tests: cuando pasen en verde, lo resolviste.

// Pista: es una sola cuenta. La distancia de a a b es (b - a); avanza t de ese camino.

// Declara mezclar: recibe los dos valores y cuánto avanzar (t, de 0 a 1).
export function mezclar(a, b, t) {
  // Parte de a y avanza la parte t del camino hasta b.
  return a + (b - a) * t;
// Cierra la función mezclar.
}
// ↑ mezclar: un punto entre a y b según t.

// Pista: primero calcula t = (x - borde0) / (borde1 - borde0) y recórtalo entre 0
// y 1 con Math.min y Math.max. Después aplica t * t * (3 - 2 * t).

// Declara suavizar: recibe los dos bordes y el valor.
export function suavizar(borde0, borde1, x) {
  // Dónde está x entre los bordes, recortado entre 0 y 1.
  const t = Math.min(1, Math.max(0, (x - borde0) / (borde1 - borde0)));
  // La curva suave: empieza y termina despacio.
  return t * t * (3 - 2 * t);
// Cierra la función suavizar.
}
// ↑ suavizar: recorta t y le aplica la curva suave.

// Pista: la diferencia en x se multiplica por el aspecto. Después, Math.hypot(dx, dy)
// da la distancia (la raíz de dx² + dy²).

// Declara distanciaAlCentro: recibe el punto (u, v), el centro (cx, cy) y el aspecto.
export function distanciaAlCentro(u, v, cx, cy, aspecto) {
  // La diferencia en x, corregida por el aspecto del lienzo.
  const dx = (u - cx) * aspecto;
  // La diferencia en y.
  const dy = v - cy;
  // La distancia: la hipotenusa del triángulo dx, dy.
  return Math.hypot(dx, dy);
// Cierra la función distanciaAlCentro.
}
// ↑ distanciaAlCentro: corrige la x y mide la distancia.

// Pista: empieza en 1 y en cada vuelta guarda la amplitud y la divide por 2.

// Declara amplitudesFbm: recibe cuántas octavas.
export function amplitudesFbm(octavas) {
  // La lista de amplitudes, vacía al empezar.
  const lista = [];
  // La primera octava tiene toda la fuerza.
  let amplitud = 1;
  // Una vuelta por octava.
  for (let i = 0; i < octavas; i++) {
    // Guarda la amplitud de esta octava.
    lista.push(amplitud);
    // La siguiente tiene la mitad de fuerza.
    amplitud = amplitud / 2;
  // Cierra el for.
  }
  // Devuelve las amplitudes.
  return lista;
// Cierra la función amplitudesFbm.
}
// ↑ amplitudesFbm: la fuerza de cada octava, cada una la mitad de la anterior.

// Pista: map recorre los tres canales de c1; con el índice tomas el mismo canal de
// c2. Usa mezclar y Math.round.

// Declara mezclarColor: recibe dos colores [r, g, b] y t.
export function mezclarColor(c1, c2, t) {
  // Mezcla cada canal con el mismo canal del otro color y redondea.
  return c1.map((canal, i) => Math.round(mezclar(canal, c2[i], t)));
// Cierra la función mezclarColor.
}
// ↑ mezclarColor: aplica mezclar a rojo, verde y azul.`),
    'index.html': L(`
<!doctype html>
<!-- El documento, en español. -->
<html lang="es">
  <!-- La cabecera: datos de la página que no se ven. -->
  <head>
    <!-- Cómo empezar: la página solo tiene un lienzo. Todo lo dibuja src/main.js. -->
    <!-- utf-8: para que las tildes y la ñ se vean bien. -->
    <meta charset="utf-8" />
    <!-- viewport: el ancho de la página es el de la pantalla (celulares). -->
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <!-- El título de la pestaña. -->
    <title>Póster</title>
    <!-- Sin márgenes: el lienzo ocupa toda la ventana. -->
    <style>
      /* El cuerpo sin margen y con el mismo fondo que el póster. */
      body { margin: 0; background: #14213d; }
      /* El lienzo como bloque: sin el espacio que deja una línea de texto. */
      canvas { display: block; }
      /* Cierra los estilos: la etiqueta de abajo termina el CSS. */
    </style>
  <!-- Cierra la cabecera. -->
  </head>
  <!-- El cuerpo: lo que se ve. -->
  <body>
    <!-- El lienzo donde dibuja main.js. -->
    <canvas></canvas>
    <!-- type="module": el script usa import; Vite lo carga y recarga al guardar. -->
    <script type="module" src="/src/main.js"></script>
  <!-- Cierra el cuerpo. -->
  </body>
<!-- Cierra el documento. -->
</html>`),
    'src/main.js': L(`
// Cómo empezar: este archivo solo dibuja. Los números (tamaños, columnas,
// colores) salen de las funciones que ya resolviste y testeaste.
// La escala de tamaños y la línea base.
import { escalaModular, alinearA } from "../ejercicios/01-escala.js";
// La grilla de columnas.
import { columnas, abarcar } from "../ejercicios/02-grilla.js";
// La paleta de colores.
import { paleta } from "../ejercicios/03-color.js";
// La prueba de contraste.
import { esLegible } from "../ejercicios/04-contraste.js";

// Busca el lienzo en la página.
const lienzo = document.querySelector("canvas");
// ctx: el contexto 2D, con el que se dibuja.
const ctx = lienzo.getContext("2d");
// El lienzo mide lo mismo que la ventana: el póster se adapta a la pantalla.
lienzo.width = window.innerWidth;
// Lo mismo con el alto.
lienzo.height = window.innerHeight;

// Variar un valor por vez: la razón (1.25), las columnas (6) o el tono (220).
// Siete tamaños desde 14 con razón 1.25.
const tamanos = escalaModular(14, 1.25, 7);
// Seis columnas con márgenes de 24 y medianiles de 12.
const cols = columnas(lienzo.width, 6, 24, 12);
// Tres colores repartidos en la rueda desde el tono 220.
const colores = paleta(220, 3);
// El color de fondo del póster.
const fondo = "#14213d";

// Elige el color de fondo para pintar.
ctx.fillStyle = fondo;
// Pinta todo el lienzo con ese color.
ctx.fillRect(0, 0, lienzo.width, lienzo.height);

// Tres bloques que ocupan dos columnas cada uno: ritmo y repetición.
colores.forEach((color, i) => {
  // La zona del bloque i: dos columnas, empezando en la columna i x 2.
  const zona = abarcar(cols, i * 2, 2);
  // Elige el color del bloque.
  ctx.fillStyle = color;
  // Dibuja el bloque, cada uno un poco más abajo, alineado a la línea base.
  ctx.fillRect(zona.x, alinearA(140 + i * 52, 8), zona.ancho, 32);
// Cierra el forEach.
});
// ↑ forEach: un bloque por color, cada uno dos columnas más a la derecha.

// Jerarquía: el título usa uno de los tamaños más grandes; el subtítulo, uno chico.
// En pantallas angostas se baja dos pasos de la escala: la jerarquía se mantiene.
const titulo = lienzo.width < 600 ? tamanos[4] : tamanos[6];
// El color del texto se elige según el contraste con el fondo.
ctx.fillStyle = esLegible("#ffffff", fondo) ? "#ffffff" : "#000000";
// La letra del título: negrita y del tamaño elegido.
ctx.font = "bold " + titulo + "px system-ui";
// Escribe el título alineado a la primera columna.
ctx.fillText("Diseño con código", cols[0].x, alinearA(96, 8));
// La letra del subtítulo: un tamaño chico de la escala.
ctx.font = tamanos[1] + "px system-ui";
// Escribe el subtítulo, también en la primera columna.
ctx.fillText("Escala, grilla, color y contraste", cols[0].x, alinearA(330, 8));`)
  },
  conceptos: {
    'notas/01-jerarquia.md': ['jerarquía', 'escala modular'],
    'ejercicios/01-escala.test.js': ['toEqual'],
    'ejercicios/01-escala.js': ['escala modular', 'línea base'],
    'notas/02-grilla.md': ['grilla'],
    'ejercicios/02-grilla.test.js': ['tests'],
    'ejercicios/02-grilla.js': ['grilla', 'objetos'],
    'notas/03-color.md': ['HSL', 'armonías de color'],
    'ejercicios/03-color.test.js': ['tests'],
    'ejercicios/03-color.js': ['HSL', 'resto de la división'],
    'notas/04-contraste.md': ['contraste WCAG'],
    'ejercicios/04-contraste.test.js': ['toBeCloseTo'],
    'ejercicios/04-contraste.js': ['contraste WCAG', 'luminancia'],
    'notas/05-shaders.md': ['mix', 'smoothstep', 'fbm'],
    'ejercicios/05-shaders.test.js': ['toBeCloseTo'],
    'ejercicios/05-shaders.js': ['mix', 'smoothstep', 'distancia con aspecto', 'fbm'],
    'index.html': ['canvas'],
    'src/main.js': ['canvas 2D', 'jerarquía']
  }
};

export const LESSONS_CURSOS: Lesson[] = [FUNDAMENTOS, LOGICA, MATEMATICAS, DISENO];
