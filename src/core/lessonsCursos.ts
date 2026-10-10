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

const pkg = (name: string, extra = '') =>
  L(`
{
  "name": "${name}",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
${extra}    "test": "vitest run"
  },
  "devDependencies": {
${extra ? '    "vite": "^6.4.4",\n' : ''}    "vitest": "^3.2.7"
  }
}`);

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
> Apunte 1. Un programa trabaja con valores. Las líneas con > se leen; lo demás lo escribes tú.
## Valores y variables
> Un valor es un dato: un número, un texto o verdadero/falso. Cada valor tiene un tipo.
Un valor es un dato con un tipo.
> Una variable es un nombre que guarda un valor para usarlo después. const no deja cambiarlo; let sí.
\`\`\`js
const nombre = "Ana";
let edad = 30;
\`\`\`
> Una función recibe valores (los parámetros), hace algo con ellos y devuelve un resultado con return.
\`\`\`js
function doble(n) {
  return n * 2;
}
\`\`\`
> Para recordar: una función es una receta. Los parámetros son los ingredientes y return es el plato.
Una función recibe valores y devuelve un resultado.`),
    'ejercicios/01-valores.test.js': L(`
// Cómo empezar: los tests dicen qué tiene que hacer cada función, con ejemplos
// concretos. Primero los escribes; después resuelves el ejercicio para que pasen.
import { describe, it, expect } from "vitest";
import { saludo, areaRectangulo } from "./01-valores.js";

describe("saludo", () => {
  // El caso normal: el nombre va entre el saludo y el signo de cierre.
  it("saluda por el nombre", () => {
    expect(saludo("Ana")).toBe("¡Hola, Ana!");
  });
});
// ↑ saludo: comprueba que arma el texto exacto, con coma, espacio y signos.

describe("areaRectangulo", () => {
  // Base por altura: con números chicos se calcula a mano y se compara.
  it("multiplica base por altura", () => {
    expect(areaRectangulo(3, 4)).toBe(12);
  });
  // El borde: si un lado mide 0, el área es 0.
  it("con un lado en 0 da 0", () => {
    expect(areaRectangulo(0, 5)).toBe(0);
  });
});
// ↑ areaRectangulo: comprueba el caso normal y el borde de un lado en 0.`),
    'ejercicios/01-valores.js': L(`
// Ejercicio 1: saludo(nombre) devuelve el texto "¡Hola, <nombre>!".
// Ejercicio 2: areaRectangulo(base, altura) devuelve el área del rectángulo.
// Corre los tests: cuando pasen en verde, lo resolviste.

// Pista: el operador + une textos. Va el saludo, después el nombre y el cierre.
export function saludo(nombre) {
  return "¡Hola, " + nombre + "!";
}
// ↑ saludo: une tres textos en uno y lo devuelve.

// Pista: el área de un rectángulo es base por altura, y * multiplica.
export function areaRectangulo(base, altura) {
  return base * altura;
}
// ↑ areaRectangulo: multiplica los dos lados y devuelve el resultado.`),
    'notas/02-condicionales.md': L(`
> Apunte 2. Decidir: el programa elige qué camino seguir según una condición.
## Condicionales
> Una condición es una pregunta que vale true (verdadero) o false (falso). Se arma comparando.
Una condición vale true o false.
> Los comparadores: === igual, !== distinto, < menor, > mayor, <= menor o igual, >= mayor o igual.
\`\`\`js
const puedeVotar = edad >= 16;
\`\`\`
> if ejecuta un bloque solo si la condición es true. else if prueba otra condición; else es todo lo demás.
\`\`\`js
if (nota >= 6) {
  resultado = "aprobado";
} else {
  resultado = "desaprobado";
}
\`\`\`
> El orden importa: se prueba de arriba hacia abajo y gana la primera condición que se cumple.
Gana la primera condición que se cumple.`),
    'ejercicios/02-condicionales.test.js': L(`
// Cómo empezar: cada test prueba un tramo de edades y sus bordes (17, 18,
// 64, 65). Los bordes son donde más se equivocan las condiciones.
import { describe, it, expect } from "vitest";
import { clasificarEdad, maximo } from "./02-condicionales.js";

describe("clasificarEdad", () => {
  // Un caso por tramo, y los bordes exactos: 18 ya es adulto, 65 ya es mayor.
  it("menor de 18", () => {
    expect(clasificarEdad(17)).toBe("menor");
  });
  it("adulto desde 18 hasta 64", () => {
    expect(clasificarEdad(18)).toBe("adulto");
    expect(clasificarEdad(64)).toBe("adulto");
  });
  it("mayor desde 65", () => {
    expect(clasificarEdad(65)).toBe("mayor");
  });
});
// ↑ clasificarEdad: comprueba los tres tramos y los bordes entre ellos.

describe("maximo", () => {
  // Sin importar el orden en que lleguen, gana el más grande.
  it("devuelve el mayor de dos números", () => {
    expect(maximo(3, 9)).toBe(9);
    expect(maximo(9, 3)).toBe(9);
  });
  // El borde: si son iguales, el máximo es ese número.
  it("con números iguales devuelve ese número", () => {
    expect(maximo(4, 4)).toBe(4);
  });
});
// ↑ maximo: comprueba los dos órdenes posibles y el empate.`),
    'ejercicios/02-condicionales.js': L(`
// Ejercicio 1: clasificarEdad(edad) devuelve "menor" (menos de 18), "adulto"
// (de 18 a 64) o "mayor" (65 o más).
// Ejercicio 2: maximo(a, b) devuelve el mayor de los dos, sin usar Math.max.
// Corre los tests: cuando pasen en verde, lo resolviste.

// Pista: empieza por el tramo más chico. Si no es menor, ya sabes que tiene
// 18 o más: la condición siguiente solo tiene que mirar el tope de 65.
export function clasificarEdad(edad) {
  if (edad < 18) {
    return "menor";
  } else if (edad < 65) {
    return "adulto";
  }
  return "mayor";
}
// ↑ clasificarEdad: prueba los tramos de menor a mayor y devuelve el primero que encaja.

// Pista: compara a con b. Si a es mayor o igual, ganó a; si no, ganó b.
export function maximo(a, b) {
  if (a >= b) {
    return a;
  }
  return b;
}
// ↑ maximo: devuelve a si es mayor o igual que b; si no, b.`),
    'notas/03-bucles.md': L(`
> Apunte 3. Repetir: un bucle hace lo mismo muchas veces sin escribirlo muchas veces.
## Bucles
> for tiene tres partes: dónde empieza el contador, hasta cuándo sigue y cómo avanza.
Un bucle repite un bloque mientras se cumple una condición.
\`\`\`js
for (let i = 1; i <= 3; i++) {
  console.log(i);
}
\`\`\`
> Un acumulador es una variable que empieza en un valor neutro (0 para sumar) y cambia en cada vuelta.
\`\`\`js
let suma = 0;
suma = suma + 5;
\`\`\`
> for...of recorre cada elemento de una lista, o cada letra de un texto, sin contador.
\`\`\`js
for (const letra of "hola") {
  console.log(letra);
}
\`\`\`
> Para recordar: antes del bucle, el valor inicial; adentro, el cambio; después, el resultado.
Inicial antes, cambio adentro, resultado después.`),
    'ejercicios/03-bucles.test.js': L(`
// Cómo empezar: los resultados se calculan a mano (1 + 2 + 3 + 4 = 10) y el
// test los compara con lo que devuelve la función.
import { describe, it, expect } from "vitest";
import { sumarHasta, contarVocales } from "./03-bucles.js";

describe("sumarHasta", () => {
  // El caso normal, calculado a mano.
  it("suma de 1 hasta n", () => {
    expect(sumarHasta(4)).toBe(10);
  });
  // El borde: con 0 no hay nada que sumar y queda el valor inicial.
  it("con 0 devuelve 0", () => {
    expect(sumarHasta(0)).toBe(0);
  });
});
// ↑ sumarHasta: comprueba una suma conocida y el caso sin vueltas.

describe("contarVocales", () => {
  // Mayúsculas y tildes también cuentan: «Árbol» tiene dos vocales.
  it("cuenta vocales sin importar mayúsculas ni tildes", () => {
    expect(contarVocales("Árbol")).toBe(2);
    expect(contarVocales("programar")).toBe(3);
  });
  // El borde: un texto sin vocales.
  it("sin vocales devuelve 0", () => {
    expect(contarVocales("xyz")).toBe(0);
  });
});
// ↑ contarVocales: comprueba mayúsculas, tildes y un texto sin vocales.`),
    'ejercicios/03-bucles.js': L(`
// Ejercicio 1: sumarHasta(n) devuelve 1 + 2 + ... + n (0 si n es menor que 1).
// Ejercicio 2: contarVocales(texto) cuenta las vocales, con o sin tilde, en
// mayúsculas o minúsculas.
// Corre los tests: cuando pasen en verde, lo resolviste.

// Pista: un acumulador que empieza en 0 y un for de 1 hasta n que le suma i.
// Si n es 0, el for no da ninguna vuelta y queda el 0 inicial.
export function sumarHasta(n) {
  let suma = 0;
  for (let i = 1; i <= n; i++) {
    suma = suma + i;
  }
  // ↑ for: en cada vuelta suma el número actual al total.
  return suma;
}
// ↑ sumarHasta: acumula los números de 1 a n y devuelve el total.

// Pista: pasa el texto a minúsculas con toLowerCase y recorre cada letra con
// for...of. includes dice si una letra está dentro de un texto.
export function contarVocales(texto) {
  const vocales = "aeiouáéíóú";
  let cantidad = 0;
  for (const letra of texto.toLowerCase()) {
    if (vocales.includes(letra)) {
      cantidad++;
    }
  }
  // ↑ for...of: mira cada letra y suma 1 si es vocal.
  return cantidad;
}
// ↑ contarVocales: recorre el texto en minúsculas y cuenta las vocales.`),
    'notas/04-listas.md': L(`
> Apunte 4. Agrupar datos: listas (arreglos) y fichas (objetos).
## Arreglos y objetos
> Un arreglo es una lista ordenada. Cada elemento tiene una posición, y la primera es 0.
Un arreglo es una lista; la primera posición es 0.
\`\`\`js
const notas = [7, 9, 5];
notas.length;
\`\`\`
> Un objeto agrupa datos con nombre: cada propiedad tiene una clave y un valor.
\`\`\`js
const producto = { nombre: "pan", precio: 900 };
producto.precio;
\`\`\`
> filter arma una lista nueva con los elementos que cumplen una condición. No cambia la original.
\`\`\`js
const altas = notas.filter((n) => n >= 7);
\`\`\`
> Para recordar: un arreglo guarda muchos datos parecidos; un objeto describe una cosa.
Arreglo para muchos; objeto para describir una cosa.`),
    'ejercicios/04-listas.test.js': L(`
// Cómo empezar: los datos de prueba son fijos y chicos, así el resultado
// esperado se calcula a mano.
import { describe, it, expect } from "vitest";
import { promedio, soloPares, totalCarrito } from "./04-listas.js";

describe("promedio", () => {
  // (6 + 8 + 10) / 3 = 8.
  it("suma y divide por la cantidad", () => {
    expect(promedio([6, 8, 10])).toBe(8);
  });
  // El borde: dividir por 0 da NaN; una lista vacía tiene que dar 0.
  it("lista vacía da 0", () => {
    expect(promedio([])).toBe(0);
  });
});
// ↑ promedio: comprueba el caso normal y la lista vacía.

// toEqual compara el contenido de las listas, no si son la misma lista.
it("soloPares deja solo los números pares", () => {
  expect(soloPares([1, 2, 3, 4])).toEqual([2, 4]);
});

// Cada ítem cuesta precio por cantidad: 2 x 900 + 1 x 1500 = 3300.
it("totalCarrito suma precio por cantidad", () => {
  const carrito = [
    { nombre: "pan", precio: 900, cantidad: 2 },
    { nombre: "leche", precio: 1500, cantidad: 1 }
  ];
  expect(totalCarrito(carrito)).toBe(3300);
});
// ↑ totalCarrito: comprueba un carrito con dos productos y cantidades distintas.`),
    'ejercicios/04-listas.js': L(`
// Ejercicio 1: promedio(numeros) devuelve el promedio (0 si la lista está vacía).
// Ejercicio 2: soloPares(numeros) devuelve una lista nueva solo con los pares.
// Ejercicio 3: totalCarrito(items) suma precio por cantidad de cada ítem.
// Corre los tests: cuando pasen en verde, lo resolviste.

// Pista: primero el caso de la lista vacía (su length es 0). Después, suma con
// un for...of y divide por la cantidad de elementos.
export function promedio(numeros) {
  if (numeros.length === 0) {
    return 0;
  }
  let suma = 0;
  for (const n of numeros) {
    suma = suma + n;
  }
  return suma / numeros.length;
}
// ↑ promedio: evita dividir por 0 y divide la suma por la cantidad.

// Pista: filter con una condición. Un número es par si el resto de dividirlo
// por 2 es 0, y el resto se calcula con %.
export function soloPares(numeros) {
  return numeros.filter((n) => n % 2 === 0);
}
// ↑ soloPares: se queda con los números cuyo resto al dividir por 2 es 0.

// Pista: un acumulador que suma item.precio * item.cantidad en cada vuelta.
export function totalCarrito(items) {
  let total = 0;
  for (const item of items) {
    total = total + item.precio * item.cantidad;
  }
  return total;
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
> Apunte 1. La lógica está detrás de cada decisión de un programa.
## Booleanos
> Un booleano tiene solo dos valores posibles: true (verdadero) y false (falso).
Un booleano vale true o false.
> && (y) es true solo si las dos partes son true. || (o) es true si al menos una lo es. ! (no) invierte.
\`\`\`js
true && false;
true || false;
!true;
\`\`\`
> Una tabla de verdad prueba todas las combinaciones. Con dos booleanos hay cuatro filas:
\`\`\`text
true  && true  = true
true  && false = false
false && true  = false
false && false = false
\`\`\`
> El o exclusivo (xor) es true cuando exactamente uno de los dos es true.
xor: true si exactamente uno es true.
> La implicación (si a, entonces b) solo es falsa cuando a es true y b es false.
Si a entonces b: solo falla con a true y b false.`),
    'ejercicios/01-booleanos.test.js': L(`
// Cómo empezar: con dos booleanos hay cuatro combinaciones. Si las cuatro
// filas de la tabla de verdad pasan, la función es correcta: no hay otras.
import { describe, it, expect } from "vitest";
import { xor, implica } from "./01-booleanos.js";

describe("xor", () => {
  // Las dos filas donde los valores son distintos.
  it("es true cuando exactamente uno es true", () => {
    expect(xor(true, false)).toBe(true);
    expect(xor(false, true)).toBe(true);
  });
  // Las dos filas donde son iguales.
  it("es false cuando los dos son iguales", () => {
    expect(xor(true, true)).toBe(false);
    expect(xor(false, false)).toBe(false);
  });
});
// ↑ xor: recorre las cuatro filas de la tabla de verdad.

describe("implica", () => {
  // La única fila falsa: a verdadero y b falso.
  it("solo falla con a true y b false", () => {
    expect(implica(true, false)).toBe(false);
  });
  // Si a es false, la implicación se cumple sin importar b.
  it("las otras tres filas son true", () => {
    expect(implica(true, true)).toBe(true);
    expect(implica(false, true)).toBe(true);
    expect(implica(false, false)).toBe(true);
  });
});
// ↑ implica: comprueba la fila falsa y las tres verdaderas.`),
    'ejercicios/01-booleanos.js': L(`
// Ejercicio 1: xor(a, b) devuelve true si exactamente uno de los dos es true.
// Ejercicio 2: implica(a, b) devuelve el valor de «si a, entonces b».
// Corre los tests: cuando pasen en verde, lo resolviste.

// Pista: xor es «a o b, pero no los dos». Con dos booleanos eso es lo mismo
// que preguntar si son distintos, y !== compara si son distintos.
export function xor(a, b) {
  return a !== b;
}
// ↑ xor: es true cuando a y b tienen valores distintos.

// Pista: la implicación solo falla con a true y b false. Eso es lo mismo que
// «no a, o b»: si a es false ya se cumple; si a es true, depende de b.
export function implica(a, b) {
  return !a || b;
}
// ↑ implica: se cumple si a es falso o si b es verdadero.`),
    'notas/02-de-morgan.md': L(`
> Apunte 2. Condiciones compuestas, y cómo negarlas sin equivocarse.
## Leyes de De Morgan
> Negar un && lo convierte en un || de las negaciones, y negar un || lo convierte en un &&.
!(a && b) es lo mismo que !a || !b.
!(a || b) es lo mismo que !a && !b.
> Ejemplo: estar dentro de un rango es min <= x && x <= max. Estar fuera es la negación de eso.
\`\`\`js
const dentro = min <= x && x <= max;
const fuera = x < min || x > max;
\`\`\`
> Al negar una comparación se da vuelta: la negación de x >= min es x < min.
Al negar, && cambia por || y cada comparación se invierte.`),
    'ejercicios/02-de-morgan.test.js': L(`
// Cómo empezar: en los rangos, los bordes (exactamente min o max) deciden si
// la condición usa <= o <. Por eso cada test prueba los dos bordes.
import { describe, it, expect } from "vitest";
import { dentroDeRango, fueraDeRango, puedeEntrar } from "./02-de-morgan.js";

describe("rangos", () => {
  // Los bordes cuentan como dentro: el rango es cerrado.
  it("dentroDeRango incluye los bordes", () => {
    expect(dentroDeRango(5, 1, 10)).toBe(true);
    expect(dentroDeRango(1, 1, 10)).toBe(true);
    expect(dentroDeRango(10, 1, 10)).toBe(true);
    expect(dentroDeRango(11, 1, 10)).toBe(false);
  });
  // fueraDeRango es exactamente lo contrario, también en los bordes.
  it("fueraDeRango es lo contrario", () => {
    expect(fueraDeRango(0, 1, 10)).toBe(true);
    expect(fueraDeRango(11, 1, 10)).toBe(true);
    expect(fueraDeRango(1, 1, 10)).toBe(false);
  });
});
// ↑ rangos: comprueba el medio, los dos bordes y los valores de afuera.

describe("puedeEntrar", () => {
  // Entra con 18 o más y entrada, o si es VIP aunque no cumpla lo demás.
  it("adulto con entrada entra", () => {
    expect(puedeEntrar(18, true, false)).toBe(true);
  });
  it("sin entrada o menor no entra", () => {
    expect(puedeEntrar(30, false, false)).toBe(false);
    expect(puedeEntrar(16, true, false)).toBe(false);
  });
  it("un VIP entra siempre", () => {
    expect(puedeEntrar(16, false, true)).toBe(true);
  });
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
export function dentroDeRango(x, min, max) {
  return min <= x && x <= max;
}
// ↑ dentroDeRango: true si x está entre min y max, bordes incluidos.

// Pista: aplica De Morgan a la función anterior: el && pasa a ser || y cada
// comparación se da vuelta (<= pasa a ser >, y al revés).
export function fueraDeRango(x, min, max) {
  return x < min || x > max;
}
// ↑ fueraDeRango: true si x queda por debajo de min o por encima de max.

// Pista: los paréntesis agrupan la condición del adulto con entrada; después,
// || esVip deja pasar al VIP en cualquier caso.
export function puedeEntrar(edad, tieneEntrada, esVip) {
  return (edad >= 18 && tieneEntrada) || esVip;
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
if (anio % 400 === 0) {
  return true;
}
\`\`\`
> Si se prueba primero la regla general, las excepciones nunca llegan a mirarse.
Primero la excepción, después la regla.`),
    'ejercicios/03-reglas.test.js': L(`
// Cómo empezar: un año para cada rama de la regla. 2024 es el caso común;
// 1900 y 2000 son las excepciones, que es donde fallan las soluciones apuradas.
import { describe, it, expect } from "vitest";
import { esBisiesto, diasDelMes } from "./03-reglas.js";

describe("esBisiesto", () => {
  // Divisible por 4 y no por 100: bisiesto.
  it("cada cuatro años", () => {
    expect(esBisiesto(2024)).toBe(true);
    expect(esBisiesto(2023)).toBe(false);
  });
  // Las dos excepciones: los siglos no lo son, salvo cada 400 años.
  it("los siglos solo cada 400 años", () => {
    expect(esBisiesto(1900)).toBe(false);
    expect(esBisiesto(2000)).toBe(true);
  });
});
// ↑ esBisiesto: comprueba la regla y sus dos excepciones.

describe("diasDelMes", () => {
  // Febrero depende del año; los demás meses, no.
  it("febrero tiene 29 días en los bisiestos", () => {
    expect(diasDelMes(2, 2024)).toBe(29);
    expect(diasDelMes(2, 2023)).toBe(28);
  });
  it("abril tiene 30 y enero 31", () => {
    expect(diasDelMes(4, 2023)).toBe(30);
    expect(diasDelMes(1, 2023)).toBe(31);
  });
});
// ↑ diasDelMes: comprueba febrero en los dos casos y un mes de 30 y uno de 31.`),
    'ejercicios/03-reglas.js': L(`
// Ejercicio 1: esBisiesto(anio) devuelve true si el año es bisiesto.
// Ejercicio 2: diasDelMes(mes, anio) devuelve cuántos días tiene el mes (1 a
// 12) en ese año.
// Corre los tests: cuando pasen en verde, lo resolviste.

// Pista: de lo específico a lo general. Divisible por 400: sí. Si no, divisible
// por 100: no. Si no, divisible por 4: sí. Si no, no.
export function esBisiesto(anio) {
  if (anio % 400 === 0) {
    return true;
  }
  if (anio % 100 === 0) {
    return false;
  }
  return anio % 4 === 0;
}
// ↑ esBisiesto: aplica primero las excepciones y al final la regla general.

// Pista: febrero es el único que depende del año, y ya tienes esBisiesto. Los
// meses de 30 días son abril (4), junio (6), septiembre (9) y noviembre (11).
export function diasDelMes(mes, anio) {
  if (mes === 2) {
    // El operador ? elige entre dos valores: condición ? si es true : si es false.
    return esBisiesto(anio) ? 29 : 28;
  }
  if (mes === 4 || mes === 6 || mes === 9 || mes === 11) {
    return 30;
  }
  return 31;
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
for (const n of numeros) {
  if (n <= 0) {
    return false;
  }
}
return true;
\`\`\`
> A eso se le llama verdad vacía: «todos los elementos de una lista vacía cumplen» es verdadero.
Una lista vacía cumple "todos".`),
    'ejercicios/04-casos.test.js': L(`
// Cómo empezar: un test por caso de FizzBuzz, incluido el 15, que es el que
// detecta si los casos se prueban en el orden equivocado.
import { describe, it, expect } from "vitest";
import { fizzBuzz, todosPositivos } from "./04-casos.js";

describe("fizzBuzz", () => {
  // Un número de cada caso.
  it("Fizz, Buzz y el número", () => {
    expect(fizzBuzz(9)).toBe("Fizz");
    expect(fizzBuzz(10)).toBe("Buzz");
    expect(fizzBuzz(7)).toBe("7");
  });
  // El caso que decide el orden: múltiplo de 3 y de 5.
  it("múltiplos de 15 dicen FizzBuzz", () => {
    expect(fizzBuzz(15)).toBe("FizzBuzz");
  });
});
// ↑ fizzBuzz: comprueba los cuatro casos, incluido el que depende del orden.

describe("todosPositivos", () => {
  it("true si todos son mayores que 0", () => {
    expect(todosPositivos([1, 5, 3])).toBe(true);
  });
  // El 0 no es positivo: alcanza con uno que no cumple.
  it("false si alguno no es positivo", () => {
    expect(todosPositivos([1, 0, 3])).toBe(false);
  });
  // Verdad vacía: en una lista vacía no hay ninguno que falle.
  it("una lista vacía da true", () => {
    expect(todosPositivos([])).toBe(true);
  });
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
export function fizzBuzz(n) {
  if (n % 15 === 0) {
    return "FizzBuzz";
  }
  if (n % 3 === 0) {
    return "Fizz";
  }
  if (n % 5 === 0) {
    return "Buzz";
  }
  return String(n);
}
// ↑ fizzBuzz: prueba los casos de lo específico a lo general.

// Pista: recorre la lista y devuelve false apenas encuentres uno que no sea
// positivo. Si el bucle termina sin encontrar ninguno, devuelve true.
export function todosPositivos(numeros) {
  for (const n of numeros) {
    if (n <= 0) {
      return false;
    }
  }
  // ↑ for...of: corta apenas encuentra un número que no es positivo.
  return true;
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
> Apunte 1. Dividir en programación: el cociente entero y el resto.
## División entera y resto
> Al dividir 17 entre 5 entran 3 enteros y sobran 2. El 3 es el cociente; el 2, el resto.
17 = 5 x 3 + 2
> En JavaScript, / da el resultado con decimales; Math.floor lo redondea hacia abajo; % da el resto.
\`\`\`js
Math.floor(17 / 5);
17 % 5;
\`\`\`
> Si el resto es 0, la división es exacta: el número es divisible. El último dígito de un número es su resto al dividir por 10.
a % b === 0 significa que b divide a a.
> Para recorrer los dígitos: % 10 da el último y Math.floor(n / 10) lo saca.
% 10 da el último dígito; dividir por 10 lo quita.`),
    'ejercicios/01-division.test.js': L(`
// Cómo empezar: cada resultado esperado se calcula a mano, con números chicos.
import { describe, it, expect } from "vitest";
import { esDivisible, ultimoDigito, sumaDigitos } from "./01-division.js";

describe("esDivisible", () => {
  // 12 entre 3 da exacto; 12 entre 5 sobra 2.
  it("true si la división es exacta", () => {
    expect(esDivisible(12, 3)).toBe(true);
    expect(esDivisible(12, 5)).toBe(false);
  });
});
// ↑ esDivisible: comprueba una división exacta y una con resto.

describe("dígitos", () => {
  it("ultimoDigito es el resto al dividir por 10", () => {
    expect(ultimoDigito(1234)).toBe(4);
    expect(ultimoDigito(7)).toBe(7);
  });
  // 1 + 2 + 3 + 4 = 10. El borde: un número de un solo dígito.
  it("sumaDigitos suma cada dígito", () => {
    expect(sumaDigitos(1234)).toBe(10);
    expect(sumaDigitos(9)).toBe(9);
  });
});
// ↑ dígitos: comprueba el último dígito y la suma de todos.`),
    'ejercicios/01-division.js': L(`
// Ejercicio 1: esDivisible(a, b) es true si a se divide exacto por b.
// Ejercicio 2: ultimoDigito(n) devuelve el último dígito de n (n entero, 0 o más).
// Ejercicio 3: sumaDigitos(n) devuelve la suma de los dígitos de n.
// Corre los tests: cuando pasen en verde, lo resolviste.

// Pista: una división es exacta cuando el resto es 0.
export function esDivisible(a, b) {
  return a % b === 0;
}
// ↑ esDivisible: mira si el resto de dividir a por b es 0.

// Pista: el último dígito es lo que sobra al dividir por 10.
export function ultimoDigito(n) {
  return n % 10;
}
// ↑ ultimoDigito: devuelve el resto de dividir por 10.

// Pista: mientras n sea mayor que 0, suma su último dígito y sácalo dividiendo
// por 10 con Math.floor.
export function sumaDigitos(n) {
  let suma = 0;
  while (n > 0) {
    suma = suma + (n % 10);
    n = Math.floor(n / 10);
  }
  // ↑ while: en cada vuelta suma el último dígito y lo quita.
  return suma;
}
// ↑ sumaDigitos: recorre los dígitos de derecha a izquierda y los suma.`),
    'notas/02-porcentajes.md': L(`
> Apunte 2. Porcentajes y redondeo: lo de todos los días en precios y estadísticas.
## Porcentajes
> Un porcentaje es una fracción de 100: el 15% de algo es ese algo multiplicado por 15 / 100.
El 15% de 1000 es 1000 x 15 / 100 = 150.
> Un descuento del 15% deja el 85%: precio x (1 - 15 / 100).
\`\`\`js
const final = 1000 * (1 - 15 / 100);
\`\`\`
> La computadora guarda los decimales en binario y a veces quedan errores chicos: 0.1 + 0.2 da 0.30000000000000004.
Los decimales tienen errores chicos: se redondea al mostrar.
> Para redondear a 2 decimales: multiplicar por 100, redondear al entero y dividir por 100.
\`\`\`js
Math.round(3.14159 * 100) / 100;
\`\`\``),
    'ejercicios/02-porcentajes.test.js': L(`
// Cómo empezar: los resultados con decimales se comparan con toBeCloseTo, que
// acepta los errores chicos de la computadora.
import { describe, it, expect } from "vitest";
import { redondear, aplicarDescuento, porcentajeDe } from "./02-porcentajes.js";

describe("redondear", () => {
  it("redondea a la cantidad de decimales pedida", () => {
    expect(redondear(3.14159, 2)).toBeCloseTo(3.14);
    expect(redondear(2.5, 0)).toBe(3);
  });
});
// ↑ redondear: comprueba dos decimales y el redondeo a entero.

describe("porcentajes", () => {
  // 1000 con 15% de descuento: 850. Con centavos, se redondea a 2 decimales.
  it("aplicarDescuento resta el porcentaje y redondea", () => {
    expect(aplicarDescuento(1000, 15)).toBe(850);
    expect(aplicarDescuento(999.99, 10)).toBeCloseTo(899.99);
  });
  // 25 de 200 es el 12.5%.
  it("porcentajeDe dice qué parte es del total", () => {
    expect(porcentajeDe(25, 200)).toBe(12.5);
  });
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
export function redondear(x, decimales) {
  const factor = 10 ** decimales;
  return Math.round(x * factor) / factor;
}
// ↑ redondear: corre la coma, redondea al entero y la vuelve a su lugar.

// Pista: con descuento queda (1 - porcentaje / 100) del precio. Después usa
// redondear, que ya escribiste, con 2 decimales.
export function aplicarDescuento(precio, porcentaje) {
  return redondear(precio * (1 - porcentaje / 100), 2);
}
// ↑ aplicarDescuento: calcula lo que queda después del descuento y lo redondea.

// Pista: la parte dividida por el total da una fracción; por 100 es porcentaje.
export function porcentajeDe(parte, total) {
  return (parte / total) * 100;
}
// ↑ porcentajeDe: convierte la fracción parte / total en porcentaje.`),
    'notas/03-primos.md': L(`
> Apunte 3. Números primos y máximo común divisor: dos clásicos que aparecen en todas partes.
## Primos
> Un número primo es mayor que 1 y solo se divide exacto por 1 y por sí mismo: 2, 3, 5, 7, 11…
Un primo solo se divide por 1 y por sí mismo.
> Para saber si n es primo alcanza con probar divisores hasta la raíz de n: si i x i ya pasó a n, no hay más que probar.
\`\`\`js
for (let i = 2; i * i <= n; i++) {
}
\`\`\`
## Máximo común divisor
> El MCD de dos números es el divisor más grande que comparten. El de 12 y 18 es 6.
> Euclides: el MCD de a y b es el MCD de b y el resto de a entre b. Cuando el resto es 0, el MCD es b.
mcd(12, 18) = mcd(18, 12) = mcd(12, 6) = mcd(6, 0) = 6`),
    'ejercicios/03-primos.test.js': L(`
// Cómo empezar: los bordes de esPrimo son 0, 1 y 2 (el único primo par), y un
// número como 9, que tiene divisores pero no es par.
import { describe, it, expect } from "vitest";
import { esPrimo, mcd } from "./03-primos.js";

describe("esPrimo", () => {
  it("reconoce primos", () => {
    expect(esPrimo(2)).toBe(true);
    expect(esPrimo(17)).toBe(true);
  });
  // 0 y 1 no son primos por definición; 9 = 3 x 3.
  it("descarta los que no lo son", () => {
    expect(esPrimo(0)).toBe(false);
    expect(esPrimo(1)).toBe(false);
    expect(esPrimo(9)).toBe(false);
  });
});
// ↑ esPrimo: comprueba primos chicos y grandes, y los bordes 0, 1 y 9.

describe("mcd", () => {
  it("encuentra el divisor común más grande", () => {
    expect(mcd(12, 18)).toBe(6);
    expect(mcd(7, 5)).toBe(1);
  });
  // El borde: el MCD de un número y 0 es ese número.
  it("con 0 devuelve el otro número", () => {
    expect(mcd(10, 0)).toBe(10);
  });
});
// ↑ mcd: comprueba números con divisor común, sin él y el borde con 0.`),
    'ejercicios/03-primos.js': L(`
// Ejercicio 1: esPrimo(n) es true si n es primo.
// Ejercicio 2: mcd(a, b) devuelve el máximo común divisor, con el algoritmo de
// Euclides.
// Corre los tests: cuando pasen en verde, lo resolviste.

// Pista: los menores que 2 no son primos. Después prueba cada i desde 2
// mientras i * i <= n: si alguno divide a n, no es primo.
export function esPrimo(n) {
  if (n < 2) {
    return false;
  }
  for (let i = 2; i * i <= n; i++) {
    if (n % i === 0) {
      return false;
    }
  }
  // ↑ for: busca un divisor hasta la raíz de n; si lo encuentra, no es primo.
  return true;
}
// ↑ esPrimo: descarta los menores que 2 y busca divisores hasta la raíz.

// Pista: mientras b no sea 0, el nuevo par es (b, a % b). Guarda a % b en una
// variable antes de pisar los valores.
export function mcd(a, b) {
  while (b !== 0) {
    const resto = a % b;
    a = b;
    b = resto;
  }
  // ↑ while: reemplaza el par por (b, resto) hasta que el resto es 0.
  return a;
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
let producto = 1;
\`\`\`
## Fibonacci
> En la sucesión de Fibonacci cada número es la suma de los dos anteriores: 0, 1, 1, 2, 3, 5, 8, 13…
Cada número es la suma de los dos anteriores.`),
    'ejercicios/04-sucesiones.test.js': L(`
// Cómo empezar: los casos base (exponente 0, 0!, los primeros Fibonacci) son
// los que más se olvidan. Por eso cada test tiene uno.
import { describe, it, expect } from "vitest";
import { potencia, factorial, fibonacci } from "./04-sucesiones.js";

describe("potencia", () => {
  it("multiplica la base tantas veces como el exponente", () => {
    expect(potencia(2, 3)).toBe(8);
    expect(potencia(5, 2)).toBe(25);
  });
  it("exponente 0 da 1", () => {
    expect(potencia(7, 0)).toBe(1);
  });
});
// ↑ potencia: comprueba dos potencias y el exponente 0.

describe("factorial", () => {
  it("5! es 120 y 0! es 1", () => {
    expect(factorial(5)).toBe(120);
    expect(factorial(0)).toBe(1);
  });
});
// ↑ factorial: comprueba un caso normal y el caso base.

describe("fibonacci", () => {
  // La sucesión empieza 0, 1, 1, 2, 3, 5…: fibonacci(0) es 0.
  it("los primeros términos", () => {
    expect(fibonacci(0)).toBe(0);
    expect(fibonacci(1)).toBe(1);
    expect(fibonacci(2)).toBe(1);
  });
  it("el término 10 es 55", () => {
    expect(fibonacci(10)).toBe(55);
  });
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
export function potencia(base, exponente) {
  let resultado = 1;
  for (let i = 0; i < exponente; i++) {
    resultado = resultado * base;
  }
  return resultado;
}
// ↑ potencia: multiplica la base por sí misma tantas veces como el exponente.

// Pista: igual que potencia, pero multiplicando por 2, 3, … hasta n.
export function factorial(n) {
  let producto = 1;
  for (let i = 2; i <= n; i++) {
    producto = producto * i;
  }
  return producto;
}
// ↑ factorial: multiplica los números de 2 a n; con 0 o 1 queda en 1.

// Pista: guarda los dos últimos términos (a = 0, b = 1). En cada vuelta, el
// siguiente es a + b y los dos avanzan un lugar.
export function fibonacci(n) {
  let a = 0;
  let b = 1;
  for (let i = 0; i < n; i++) {
    const siguiente = a + b;
    a = b;
    b = siguiente;
  }
  // ↑ for: corre el par de términos n lugares hacia adelante.
  return a;
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
Los fundamentos del diseño gráfico escritos como código: jerarquía con una escala tipográfica modular, grilla de columnas, color en HSL y contraste legible (WCAG). Al final, un póster en canvas que usa todo.

## Cómo funciona
Cada principio tiene su apunte (teoría que escribes), sus tests y un ejercicio: una función pura que calcula los números del diseño (tamaños, posiciones, colores). El canvas solo dibuja lo que calculan. Así se estudia diseño: entender el principio, escribirlo y después variar un valor por vez.

## Temario
1. Jerarquía: escalaModular, alinearA
2. Grilla: columnas, abarcar
3. Color: complementario, paleta
4. Contraste: hexARgb, luminancia, contraste, esLegible
5. El póster: index.html y src/main.js, y verlo con \`npx vite\`

## Tests
\`npx vitest run\` prueba los números sin pantalla. Lo visual se mira en la vista previa: cambia la razón de la escala, la cantidad de columnas o el tono, y compara.

## Cómo seguir
- Tipografía cinética con GSAP
- Paletas en OKLCH
- Creative coding con p5.js`;

const DISENO: Lesson = {
  id: 'diseno-js',
  tipo: 'curso',
  tema: 'Composición y diseño con JavaScript',
  topicId: 'composicion-diseno',
  titulo: 'Diseño con JavaScript: teoría y ejercicios',
  dificultad: 'media',
  duracion: '3 horas',
  proyecto: 'curso de diseño con JavaScript: jerarquía, grilla, color y contraste como funciones puras con tests, y un póster en canvas; explica cada principio de diseño y por qué cada valor',
  stack: { resumen: 'JavaScript (ES modules) + Canvas 2D + Vite + Vitest', lenguaje: 'JavaScript', framework: 'Canvas 2D + Vite', tests: 'Vitest' },
  convenciones: ['ES modules (import/export)', 'los números del diseño en ejercicios/, puros y testeados', 'src/main.js solo dibuja', 'apuntes en notas/'],
  arquitectura: 'componentes',
  objetivos: ['jerarquía y escala modular', 'grilla de columnas', 'color en HSL', 'contraste legible'],
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
    { paso: 'La página con el lienzo', tipo: 'codigo', archivo: 'index.html', concepto: 'canvas a pantalla completa' },
    { paso: 'Dibujar el póster', tipo: 'codigo', archivo: 'src/main.js', concepto: 'el canvas solo dibuja' },
    { paso: 'Verlo y variar un valor', tipo: 'comando', comando: 'npx vite', explicacion: 'Un póster con título, bloques de color en la grilla y un subtítulo. Cambia la razón de la escala, la cantidad de columnas o el tono, guarda y compara: así se estudia diseño.' }
  ],
  guia: DISENO_GUIA,
  archivos: {
    'package.json': pkg('diseno-con-javascript', '    "dev": "vite",\n'),
    'notas/01-jerarquia.md': L(`
> Apunte 1. Jerarquía: el ojo lee primero lo más grande. Los tamaños no se eligen al azar.
## Escala modular
> Una escala modular parte de un tamaño base y multiplica siempre por la misma razón: 16, 20, 25, 31…
Cada tamaño es el anterior por la misma razón.
> Razones comunes: 1.25 (tercera mayor, suave) y 1.5 (quinta justa, contrastada). Más razón, más jerarquía.
\`\`\`js
16 * 1.25 ** 2;
\`\`\`
> La línea base es una grilla vertical invisible (por ejemplo, cada 8 px). Alinear las medidas a ella da ritmo.
Las medidas se alinean a la línea base para dar ritmo.`),
    'ejercicios/01-escala.test.js': L(`
// Cómo empezar: los tamaños de la escala se calculan a mano y se redondean a
// píxeles enteros: 16, 20, 25 y 31,25, que queda en 31.
import { describe, it, expect } from "vitest";
import { escalaModular, alinearA } from "./01-escala.js";

describe("escalaModular", () => {
  it("multiplica por la razón y redondea", () => {
    expect(escalaModular(16, 1.25, 4)).toEqual([16, 20, 25, 31]);
  });
  // Con más razón, los saltos son más grandes: más jerarquía.
  it("una razón mayor da saltos mayores", () => {
    expect(escalaModular(16, 1.5, 3)).toEqual([16, 24, 36]);
  });
});
// ↑ escalaModular: comprueba dos razones y el redondeo a enteros.

describe("alinearA", () => {
  // 23 queda más cerca de 24 que de 16: se alinea a 24.
  it("lleva una medida al múltiplo más cercano", () => {
    expect(alinearA(23, 8)).toBe(24);
    expect(alinearA(19, 8)).toBe(16);
  });
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
export function escalaModular(base, razon, pasos) {
  const tamanos = [];
  for (let i = 0; i < pasos; i++) {
    tamanos.push(Math.round(base * razon ** i));
  }
  return tamanos;
}
// ↑ escalaModular: arma la lista de tamaños multiplicando por la razón.

// Pista: divide por el paso, redondea al entero y vuelve a multiplicar.
export function alinearA(medida, paso) {
  return Math.round(medida / paso) * paso;
}
// ↑ alinearA: devuelve el múltiplo de paso más cercano a la medida.`),
    'notas/02-grilla.md': L(`
> Apunte 2. La grilla ordena: todo se alinea a unas pocas columnas y los espacios se repiten.
## Columnas
> Una grilla tiene márgenes a los costados, columnas del mismo ancho y medianiles (espacios) entre ellas.
Márgenes, columnas iguales y medianiles entre ellas.
> El ancho de una columna es lo que queda al restar los márgenes y los medianiles, dividido por la cantidad.
\`\`\`js
const columna = (ancho - 2 * margen - (n - 1) * medianil) / n;
\`\`\`
> La columna i empieza en margen + i x (columna + medianil). Un elemento puede abarcar varias columnas seguidas.
Un elemento abarca una o varias columnas.`),
    'ejercicios/02-grilla.test.js': L(`
// Cómo empezar: con 1000 px, 4 columnas, márgenes de 40 y medianiles de 20,
// cada columna mide (1000 - 80 - 60) / 4 = 215.
import { describe, it, expect } from "vitest";
import { columnas, abarcar } from "./02-grilla.js";

describe("columnas", () => {
  // Las x avanzan de a 215 + 20 = 235 desde el margen.
  it("calcula dónde empieza cada columna y su ancho", () => {
    expect(columnas(1000, 4, 40, 20)).toEqual([
      { x: 40, ancho: 215 },
      { x: 275, ancho: 215 },
      { x: 510, ancho: 215 },
      { x: 745, ancho: 215 }
    ]);
  });
});
// ↑ columnas: comprueba posiciones y anchos calculados a mano.

describe("abarcar", () => {
  // De la columna 1 a la 2: empieza en 275 y termina en 510 + 215 = 725.
  it("une columnas seguidas, con el medianil incluido", () => {
    const cols = columnas(1000, 4, 40, 20);
    expect(abarcar(cols, 1, 2)).toEqual({ x: 275, ancho: 450 });
  });
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
export function columnas(ancho, n, margen, medianil) {
  const columna = (ancho - 2 * margen - (n - 1) * medianil) / n;
  const lista = [];
  for (let i = 0; i < n; i++) {
    lista.push({ x: margen + i * (columna + medianil), ancho: columna });
  }
  return lista;
}
// ↑ columnas: reparte el espacio libre y ubica cada columna.

// Pista: empieza donde empieza la primera columna y termina donde termina la
// última (su x más su ancho). El ancho es el fin menos el comienzo.
export function abarcar(cols, desde, cuantas) {
  const primera = cols[desde];
  const ultima = cols[desde + cuantas - 1];
  return { x: primera.x, ancho: ultima.x + ultima.ancho - primera.x };
}
// ↑ abarcar: mide desde el borde izquierdo de la primera al derecho de la última.`),
    'notas/03-color.md': L(`
> Apunte 3. El color como números: HSL lo describe como lo pensamos.
## HSL
> H (tono) es un ángulo en la rueda de color, de 0 a 360: 0 rojo, 120 verde, 240 azul.
H es el tono: un ángulo de 0 a 360.
> S (saturación) va de gris a puro, y L (luminosidad) de negro a blanco, los dos en porcentaje.
\`\`\`css
color: hsl(220, 65%, 55%);
\`\`\`
> Armonías: el complementario está enfrente (180 grados). Repartir n colores a ángulos iguales da una paleta equilibrada.
El complementario está a 180 grados.
> Al sumar ángulos se puede pasar de 360: el resto de dividir por 360 lo devuelve a la rueda.
\`\`\`js
(300 + 180) % 360;
\`\`\``),
    'ejercicios/03-color.test.js': L(`
// Cómo empezar: los colores son textos que el navegador entiende. Los tests
// comparan el texto exacto, con espacios y porcentajes.
import { describe, it, expect } from "vitest";
import { complementario, paleta } from "./03-color.js";

describe("complementario", () => {
  it("suma 180 y vuelve a la rueda", () => {
    expect(complementario(30)).toBe(210);
    expect(complementario(270)).toBe(90);
  });
});
// ↑ complementario: comprueba un tono que pasa de 360 y uno que no.

describe("paleta", () => {
  // Tres colores a 120 grados entre sí: una tríada.
  it("reparte los tonos a ángulos iguales", () => {
    expect(paleta(0, 3)).toEqual(["hsl(0, 65%, 55%)", "hsl(120, 65%, 55%)", "hsl(240, 65%, 55%)"]);
  });
  // Partiendo de 300, el segundo color da la vuelta: 300 + 180 = 480, que es 120.
  it("los tonos nunca pasan de 360", () => {
    expect(paleta(300, 2)).toEqual(["hsl(300, 65%, 55%)", "hsl(120, 65%, 55%)"]);
  });
});
// ↑ paleta: comprueba una tríada y la vuelta a la rueda.`),
    'ejercicios/03-color.js': L(`
// Ejercicio 1: complementario(tono) devuelve el tono opuesto en la rueda.
// Ejercicio 2: paleta(tono, cantidad) devuelve "cantidad" colores HSL, con
// tonos repartidos a ángulos iguales desde "tono", saturación 65% y
// luminosidad 55%, como textos "hsl(h, 65%, 55%)".
// Corre los tests: cuando pasen en verde, lo resolviste.

// Pista: suma 180 y usa % 360 para que el resultado quede dentro de la rueda.
export function complementario(tono) {
  return (tono + 180) % 360;
}
// ↑ complementario: gira media vuelta en la rueda de color.

// Pista: el salto entre tonos es 360 / cantidad. Arma cada texto uniendo
// "hsl(", el tono, ", 65%, 55%)" con +.
export function paleta(tono, cantidad) {
  const salto = 360 / cantidad;
  const colores = [];
  for (let i = 0; i < cantidad; i++) {
    const h = Math.round((tono + i * salto) % 360);
    colores.push("hsl(" + h + ", 65%, 55%)");
  }
  return colores;
}
// ↑ paleta: reparte los tonos en la rueda y arma un texto HSL por color.`),
    'notas/04-contraste.md': L(`
> Apunte 4. Contraste: si no se lee, no sirve. Hay una medida para saber si un texto se lee bien.
## Contraste WCAG
> Un color hexadecimal como #1d3557 son tres pares: rojo, verde y azul, cada uno de 00 a ff (0 a 255).
#rrggbb: rojo, verde y azul en base 16.
> parseInt con base 16 convierte un par hexadecimal en número: parseInt("ff", 16) es 255.
\`\`\`js
parseInt("1d", 16);
\`\`\`
> La luminancia relativa mide cuánta luz percibimos: el verde pesa mucho más que el azul. Va de 0 (negro) a 1 (blanco).
> El contraste es (más clara + 0.05) / (más oscura + 0.05). Va de 1 (iguales) a 21 (negro sobre blanco).
El texto común necesita un contraste de 4.5 o más.`),
    'ejercicios/04-contraste.test.js': L(`
// Cómo empezar: los extremos se conocen (negro sobre blanco es 21, un color
// sobre sí mismo es 1). Los decimales se comparan con toBeCloseTo.
import { describe, it, expect } from "vitest";
import { hexARgb, luminancia, contraste, esLegible } from "./04-contraste.js";

it("hexARgb separa rojo, verde y azul", () => {
  expect(hexARgb("#1d3557")).toEqual({ r: 29, g: 53, b: 87 });
});

describe("luminancia y contraste", () => {
  it("negro es 0 y blanco es 1", () => {
    expect(luminancia("#000000")).toBeCloseTo(0);
    expect(luminancia("#ffffff")).toBeCloseTo(1);
  });
  // El orden no importa: siempre se divide la más clara por la más oscura.
  it("negro y blanco dan 21, un color consigo mismo da 1", () => {
    expect(contraste("#000000", "#ffffff")).toBeCloseTo(21);
    expect(contraste("#ffffff", "#000000")).toBeCloseTo(21);
    expect(contraste("#777777", "#777777")).toBeCloseTo(1);
  });
});
// ↑ luminancia y contraste: comprueba los extremos y que el orden no importa.

describe("esLegible", () => {
  // #777777 sobre blanco da 4.48: por muy poco no llega a 4.5.
  it("pide 4.5 o más", () => {
    expect(esLegible("#595959", "#ffffff")).toBe(true);
    expect(esLegible("#777777", "#ffffff")).toBe(false);
  });
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
export function hexARgb(hex) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16)
  };
}
// ↑ hexARgb: separa los tres pares y los pasa de base 16 a números.

// Pista: cada canal se divide por 255 y se «linealiza»: si es 0.03928 o menos,
// c / 12.92; si no, ((c + 0.055) / 1.055) ** 2.4. Después se suman con pesos:
// 0.2126 el rojo, 0.7152 el verde y 0.0722 el azul.
export function luminancia(hex) {
  const { r, g, b } = hexARgb(hex);
  const lineal = (canal) => {
    const c = canal / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lineal(r) + 0.7152 * lineal(g) + 0.0722 * lineal(b);
}
// ↑ luminancia: pasa cada canal a luz lineal y los suma según cuánto se perciben.

// Pista: calcula las dos luminancias; Math.max y Math.min dicen cuál es la más
// clara y cuál la más oscura.
export function contraste(hex1, hex2) {
  const l1 = luminancia(hex1);
  const l2 = luminancia(hex2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}
// ↑ contraste: divide la luminancia más clara por la más oscura (más 0.05).

// Pista: usa contraste y compara con 4.5.
export function esLegible(texto, fondo) {
  return contraste(texto, fondo) >= 4.5;
}
// ↑ esLegible: aprueba los pares de colores con contraste de 4.5 o más.`),
    'index.html': L(`
<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <!-- Cómo empezar: la página solo tiene un lienzo. Todo lo dibuja src/main.js. -->
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Póster</title>
    <!-- Sin márgenes: el lienzo ocupa toda la ventana. -->
    <style>
      body { margin: 0; background: #14213d; }
      canvas { display: block; }
    </style>
  </head>
  <body>
    <canvas></canvas>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>`),
    'src/main.js': L(`
// Cómo empezar: este archivo solo dibuja. Los números (tamaños, columnas,
// colores) salen de las funciones que ya resolviste y testeaste.
import { escalaModular, alinearA } from "../ejercicios/01-escala.js";
import { columnas, abarcar } from "../ejercicios/02-grilla.js";
import { paleta } from "../ejercicios/03-color.js";
import { esLegible } from "../ejercicios/04-contraste.js";

const lienzo = document.querySelector("canvas");
const ctx = lienzo.getContext("2d");
// El lienzo mide lo mismo que la ventana: el póster se adapta a la pantalla.
lienzo.width = window.innerWidth;
lienzo.height = window.innerHeight;

// Variar un valor por vez: la razón (1.25), las columnas (6) o el tono (220).
const tamanos = escalaModular(14, 1.25, 7);
const cols = columnas(lienzo.width, 6, 24, 12);
const colores = paleta(220, 3);
const fondo = "#14213d";

ctx.fillStyle = fondo;
ctx.fillRect(0, 0, lienzo.width, lienzo.height);

// Tres bloques que ocupan dos columnas cada uno: ritmo y repetición.
colores.forEach((color, i) => {
  const zona = abarcar(cols, i * 2, 2);
  ctx.fillStyle = color;
  ctx.fillRect(zona.x, alinearA(140 + i * 52, 8), zona.ancho, 32);
});
// ↑ forEach: un bloque por color, cada uno dos columnas más a la derecha.

// Jerarquía: el título usa uno de los tamaños más grandes; el subtítulo, uno chico.
// En pantallas angostas se baja dos pasos de la escala: la jerarquía se mantiene.
const titulo = lienzo.width < 600 ? tamanos[4] : tamanos[6];
// El color del texto se elige según el contraste con el fondo.
ctx.fillStyle = esLegible("#ffffff", fondo) ? "#ffffff" : "#000000";
ctx.font = "bold " + titulo + "px system-ui";
ctx.fillText("Diseño con código", cols[0].x, alinearA(96, 8));
ctx.font = tamanos[1] + "px system-ui";
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
    'index.html': ['canvas'],
    'src/main.js': ['canvas 2D', 'jerarquía']
  }
};

export const LESSONS_CURSOS: Lesson[] = [FUNDAMENTOS, LOGICA, MATEMATICAS, DISENO];
