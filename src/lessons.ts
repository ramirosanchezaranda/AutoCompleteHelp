import type { ArchId } from './architectures';
import { getArchitecture } from './architectures';
import type { PlanStep, ProjectEnvironment, ProjectFile, StackInfo } from './projectFile';

/**
 * Lecciones sin IA: proyectos completos con el código y las explicaciones ya
 * escritos y revisados. Se completan juntos, línea por línea, igual que los
 * que diseña la IA, pero sin API key ni modelo local: gratis y sin conexión.
 * También se usan cuando hay IA configurada: el contenido revisado gana.
 */
export interface Lesson {
  id: string;
  tema: string;
  /** Tema del catálogo de «Quiero aprender». */
  topicId: string;
  titulo: string;
  dificultad: 'baja' | 'media' | 'alta';
  duracion: string;
  proyecto: string;
  stack: StackInfo;
  convenciones: string[];
  arquitectura: ArchId;
  objetivos: string[];
  entorno: ProjectEnvironment;
  plan: PlanStep[];
  /** docs/APRENDER.md */
  guia: string;
  /** Código de cada archivo del plan (lo que se escribe debajo de la instrucción). */
  archivos: Record<string, string[]>;
  /** Conceptos de cada archivo, para el registro de progreso. */
  conceptos: Record<string, string[]>;
}

const TS_GUIA = `## Qué vas a construir
Un programa de terminal que registra gastos por categoría y calcula el total y el resumen por categoría. Terminado, escribes \`npx tsx src/main.ts comida 1200\` y ves el resumen.

## Qué vas a aprender
- tipos y uniones de texto
- interfaces y propiedades opcionales
- funciones tipadas
- reduce y Record
- tests con Vitest (rojo → verde)
- validar lo que llega de afuera

## Antes de empezar
- Node.js 22 LTS (trae npm). Comprueba con \`node -v\`.
- \`npm install -D typescript vitest tsx @types/node\`: el compilador, el corredor de tests, tsx (ejecuta TypeScript sin compilar a mano) y los tipos de Node.

## Cómo está organizado
Monolito en capas, mínimo: los tipos (gasto.ts), la lógica pura y testeada (gastos.ts) y la entrada desde la terminal (main.ts). La lógica no sabe nada de la terminal: por eso se puede testear sola.

## Paso a paso
1. package.json y tsconfig.json: el proyecto y el compilador en modo estricto.
2. notas/01-tipos.md y src/gasto.ts: primero el apunte sobre tipos (lo escribes tú), después los tipos del proyecto.
3. notas/02-tests.md y src/gastos.test.ts: por qué los tests van primero, y los tests ANTES que la función. Fallan (rojo): es lo esperado.
4. src/gastos.ts: lo justo para que pasen (verde).
5. src/main.ts: la entrada desde la terminal, validando lo que llega.

## Tests
Vitest corre los archivos \`*.test.ts\` con \`npx vitest run\`. Primero fallan porque la función no existe; al escribirla, pasan.

## Docker
No hace falta: no hay base de datos ni servicios.

## Cómo seguir
- Guardar los gastos en un archivo JSON entre ejecuciones
- Agregar fechas y un resumen por mes
- Convertirlo en una API con Express`;

const PY_GUIA = `## Qué vas a construir
Un script que mira tu carpeta Descargas y mueve cada archivo a Imágenes, Documentos, Música… según su extensión. Primero muestra qué haría (modo simulación) y solo después mueve de verdad.

## Qué vas a aprender
- diccionarios y funciones
- pathlib para trabajar con rutas
- dataclasses
- separar «decidir» de «hacer»
- tests con carpetas temporales (tmp_path)
- argumentos de línea de comandos con argparse

## Antes de empezar
- Python 3.12 o más nuevo. Comprueba con \`python --version\`.
- Entorno virtual: \`python -m venv .venv\`, activarlo, y \`pip install pytest\`.

## Cómo está organizado
En capas: reglas.py (qué extensión va a qué carpeta), plan.py (calcula los movimientos sin tocar nada) y ejecutar.py (mueve de verdad). Lo peligroso queda aislado y al final; __main__.py solo conecta las piezas.

## Paso a paso
1. pyproject.toml y ordenar/__init__.py: el proyecto y el paquete.
2. notas/01-diccionarios.md (el apunte, lo escribes tú), ordenar/reglas.py y su test.
3. notas/02-rutas.md, ordenar/plan.py y su test con una carpeta temporal.
4. ordenar/ejecutar.py: la única parte que mueve archivos.
5. ordenar/__main__.py: la línea de comandos, con --simular.

## Tests
\`pytest\` corre los tests. Usan carpetas temporales que pytest crea y borra: nunca se tocan tus archivos reales.

## Docker
No hace falta: es un script local que trabaja con tus carpetas.

## Cómo seguir
- Programarlo con el Programador de tareas (Windows) o cron
- Reglas configurables en un archivo TOML
- Deshacer el último orden`;

export const LESSONS: Lesson[] = [
  {
    id: 'typescript-gastos',
    tema: 'TypeScript',
    topicId: 'typescript',
    titulo: 'Gestor de gastos en la terminal',
    dificultad: 'baja',
    duracion: '1 a 2 horas',
    proyecto: 'gestor de gastos en TypeScript; explica cada tipo que agregues y por qué se eligió',
    stack: { resumen: 'TypeScript 5 + Node.js 22 LTS + Vitest', lenguaje: 'TypeScript 5', tests: 'Vitest' },
    convenciones: ['ES modules (import/export)', 'tipos en src/gasto.ts', 'lógica pura en src/gastos.ts, sin entrada ni salida', 'tests junto al archivo que prueban'],
    arquitectura: 'capas',
    objetivos: ['tipos y uniones de texto', 'interfaces', 'funciones tipadas', 'tests con Vitest'],
    entorno: {
      instalar: [{ comando: 'npm install -D typescript vitest tsx @types/node', explicacion: 'Instala el compilador, el corredor de tests, tsx y los tipos de Node (para que TypeScript conozca process) como dependencias de desarrollo (-D).' }],
      ejecutar: { comando: 'npx tsx src/main.ts comida 1200', explicacion: 'Ejecuta main.ts directamente; los argumentos son la categoría y el monto.' },
      testear: { comando: 'npx vitest run', explicacion: 'Corre todos los tests una vez.' }
    },
    plan: [
      { paso: 'Manifiesto del proyecto', tipo: 'config', archivo: 'package.json', concepto: 'scripts y módulos ES' },
      { paso: 'Configurar el compilador', tipo: 'config', archivo: 'tsconfig.json', concepto: 'modo estricto' },
      { paso: 'Apunte: qué es un tipo', tipo: 'teoria', archivo: 'notas/01-tipos.md', concepto: 'tipos, uniones e interfaces' },
      { paso: 'Tipos de un gasto', tipo: 'codigo', archivo: 'src/gasto.ts', concepto: 'type, union e interface' },
      { paso: 'Apunte: tests primero', tipo: 'teoria', archivo: 'notas/02-tests.md', concepto: 'rojo, verde' },
      { paso: 'Tests del total y por categoría', tipo: 'test', archivo: 'src/gastos.test.ts', concepto: 'tests primero (rojo)', verificar: 'npx vitest run' },
      { paso: 'Calcular total y por categoría', tipo: 'codigo', archivo: 'src/gastos.ts', concepto: 'reduce y Record (verde)', verificar: 'npx vitest run' },
      { paso: 'Usarlo desde la terminal', tipo: 'codigo', archivo: 'src/main.ts', concepto: 'validar la entrada' },
      { paso: 'Correr la app', tipo: 'comando', comando: 'npx tsx src/main.ts comida 1200', explicacion: 'tsx ejecuta TypeScript sin compilar a mano.' }
    ],
    guia: TS_GUIA,
    archivos: {
      'notas/01-tipos.md': [
        '> Apunte 1. Antes de escribir los tipos del proyecto, la idea. Las líneas con > se leen; lo demás lo escribes tú.',
        '## Tipos en TypeScript',
        '> Un tipo describe la forma de un dato. TypeScript lo revisa mientras escribes, ANTES de ejecutar.',
        'Un tipo dice qué forma tiene un dato.',
        '> Los tipos básicos tienen nombre: string (texto), number (número) y boolean (verdadero o falso).',
        '```ts',
        'let nombre: string = "Ana";',
        'let monto: number = 1200;',
        '```',
        '> Una unión de textos limita los valores posibles: solo esos, ningún otro. Un error de tipeo ya no pasa.',
        '```ts',
        'type Categoria = "comida" | "transporte";',
        '```',
        '> Una interface describe un objeto: qué propiedades tiene y de qué tipo es cada una. El ? marca una opcional.',
        '```ts',
        'interface Gasto {',
        '  monto: number;',
        '  categoria: Categoria;',
        '  nota?: string;',
        '}',
        '```',
        '> Para recordar: el error aparece en el editor, no cuando el programa ya falló.',
        'Los errores de tipo se ven al escribir, no al ejecutar.'
      ],
      'notas/02-tests.md': [
        '> Apunte 2. Vas a escribir los tests ANTES que la función. Por qué conviene, en tres ideas.',
        '## Tests primero',
        '> Un test es código que usa tu función con un caso concreto y comprueba el resultado.',
        'Un test comprueba un caso concreto.',
        '> Rojo: escribes el test y falla, porque la función todavía no existe. Eso prueba que el test sirve.',
        'Rojo: el test falla primero.',
        '> Verde: escribes lo justo para que pase. Ni más ni menos.',
        'Verde: lo justo para que pase.',
        '> Así se ve un test en Vitest: describe agrupa, it nombra el caso y expect compara.',
        '```ts',
        'it("suma los montos", () => {',
        '  expect(total([])).toBe(0);',
        '});',
        '```'
      ],
      'package.json': [
        '{',
        '  "name": "aprender-typescript",',
        '  "version": "1.0.0",',
        '  "type": "module",',
        '  "scripts": {',
        '    "test": "vitest run",',
        '    "start": "tsx src/main.ts"',
        '  }',
        '}'
      ],
      'tsconfig.json': [
        '{',
        '  "compilerOptions": {',
        '    "target": "ES2022",',
        '    "module": "ESNext",',
        '    "moduleResolution": "Bundler",',
        '    "strict": true,',
        '    "noEmit": true',
        '  },',
        '  "include": ["src"]',
        '}'
      ],
      'src/gasto.ts': [
        '// Cómo empezar: primero los TIPOS. Describen los datos antes de escribir la',
        '// lógica, y el compilador te avisa si algo no encaja. Esta es la base de las capas.',
        '// Una unión de textos en vez de string: solo se aceptan estas categorías.',
        "export type Categoria = 'comida' | 'transporte' | 'ocio' | 'otros';",
        '',
        '// interface en vez de type para objetos: se lee como «la forma de un gasto»',
        '// y se puede extender después (ej: un gasto con fecha).',
        'export interface Gasto {',
        '  categoria: Categoria;',
        '  // number y no string: así se puede sumar sin convertir.',
        '  monto: number;',
        '  // El ? la vuelve opcional: un gasto puede no tener descripción.',
        '  descripcion?: string;',
        '}',
        '// ↑ Gasto: la forma de cada gasto: una categoría válida, un monto numérico y una descripción opcional.'
      ],
      'src/gastos.test.ts': [
        '// Cómo empezar: los tests van ANTES que la función. Fallan (rojo) porque',
        '// gastos.ts todavía no existe: eso confirma que prueban algo real.',
        "import { describe, it, expect } from 'vitest';",
        "import { total, porCategoria } from './gastos';",
        "import type { Gasto } from './gasto';",
        '',
        '// Datos de prueba fijos: el resultado esperado se calcula a mano.',
        'const gastos: Gasto[] = [',
        "  { categoria: 'comida', monto: 1200 },",
        "  { categoria: 'transporte', monto: 300 },",
        "  { categoria: 'comida', monto: 800 }",
        '];',
        '// ↑ gastos: tres gastos de ejemplo; los resultados esperados (2300 en total) se calculan a mano.',
        '',
        "describe('total', () => {",
        '  // El caso normal: la suma de todos los montos.',
        "  it('suma todos los montos', () => {",
        '    expect(total(gastos)).toBe(2300);',
        '  });',
        '  // El caso borde: sin gastos el total es 0, no undefined ni NaN.',
        "  it('sin gastos devuelve 0', () => {",
        '    expect(total([])).toBe(0);',
        '  });',
        '});',
        '// ↑ total: comprueba la suma normal y que una lista vacía dé 0.',
        '',
        '// toEqual y no toBe: compara el contenido del objeto, no si es el mismo objeto.',
        "it('agrupa por categoría', () => {",
        '  expect(porCategoria(gastos)).toEqual({ comida: 2000, transporte: 300 });',
        '});',
        '// ↑ porCategoria: comprueba que agrupa los gastos y suma los montos de cada categoría.'
      ],
      'src/gastos.ts': [
        '// Cómo empezar: lo justo para que los tests pasen (verde). Esta es la capa',
        '// de lógica: no lee la terminal ni imprime nada, por eso se testea sola.',
        "import type { Gasto, Categoria } from './gasto';",
        '',
        '// reduce en vez de un for: recorre la lista y acumula en un solo valor.',
        '// El 0 inicial es lo que hace que una lista vacía devuelva 0.',
        'export function total(gastos: Gasto[]): number {',
        '  return gastos.reduce((suma, g) => suma + g.monto, 0);',
        '}',
        '// ↑ total: suma los montos de todos los gastos; sin gastos devuelve 0.',
        '',
        '// Partial<Record<…>>: un objeto con categorías como claves, donde puede',
        '// faltar alguna (las que no tienen gastos).',
        'export function porCategoria(gastos: Gasto[]): Partial<Record<Categoria, number>> {',
        '  const resultado: Partial<Record<Categoria, number>> = {};',
        '  for (const g of gastos) {',
        '    // ?? 0: si la categoría todavía no tiene suma, arranca en 0.',
        '    resultado[g.categoria] = (resultado[g.categoria] ?? 0) + g.monto;',
        '  }',
        '  // ↑ for: va sumando cada monto en la categoría que le corresponde.',
        '  return resultado;',
        '}',
        '// ↑ porCategoria: devuelve cuánto se gastó en cada categoría.'
      ],
      'src/main.ts': [
        '// Cómo empezar: este archivo conecta la lógica con el mundo: lee lo que',
        '// escribes en la terminal. La lógica quedó en gastos.ts, separada y testeada.',
        "import { total, porCategoria } from './gastos';",
        "import type { Categoria } from './gasto';",
        '',
        "const categorias: Categoria[] = ['comida', 'transporte', 'ocio', 'otros'];",
        '// process.argv trae lo escrito después del comando; los dos primeros son',
        '// node y el archivo, por eso empezamos en el índice 2.',
        'const [categoria, montoTexto] = process.argv.slice(2);',
        'const monto = Number(montoTexto);',
        '',
        '// Validamos en el borde del programa: lo que llega de afuera es texto y',
        '// puede venir mal. Mejor fallar con un mensaje claro que calcular basura.',
        'if (!categorias.includes(categoria as Categoria) || Number.isNaN(monto)) {',
        "  console.error('Uso: npx tsx src/main.ts <comida|transporte|ocio|otros> <monto>');",
        '  process.exit(1);',
        '}',
        '// ↑ if: si la categoría o el monto no son válidos, muestra cómo se usa y termina con error (código 1).',
        '',
        '// as Categoria le pide al compilador que confíe: es seguro porque lo validamos arriba.',
        'const gastos = [{ categoria: categoria as Categoria, monto }];',
        "console.log('Total:', total(gastos));",
        "console.log('Por categoría:', porCategoria(gastos));"
      ]
    },
    conceptos: {
      'notas/01-tipos.md': ['tipos', 'uniones de texto', 'interfaces'],
      'notas/02-tests.md': ['tests'],
      'src/gasto.ts': ['tipos', 'interfaces', 'uniones de texto'],
      'src/gastos.test.ts': ['tests con Vitest'],
      'src/gastos.ts': ['funciones tipadas', 'reduce'],
      'src/main.ts': ['validar la entrada', 'process.argv']
    }
  },
  {
    id: 'python-descargas',
    tema: 'Automatizaciones con Python',
    topicId: 'automatizacion-python',
    titulo: 'Ordenar la carpeta Descargas',
    dificultad: 'baja',
    duracion: '2 horas',
    proyecto: 'script que ordena Descargas por tipo de archivo; explica cada parte y por qué es seguro',
    stack: { resumen: 'Python 3.12+ + pytest', lenguaje: 'Python 3.12+', tests: 'pytest' },
    convenciones: ['paquete ordenar/ con una capa por archivo', 'tests en tests/', 'pathlib para las rutas', 'nada se mueve sin pasar por el plan'],
    arquitectura: 'capas',
    objetivos: ['diccionarios y funciones', 'pathlib', 'dataclasses', 'tests con tmp_path', 'argparse'],
    entorno: {
      instalar: [
        { comando: 'python -m venv .venv', explicacion: 'Crea un entorno aislado: los paquetes del proyecto no se mezclan con los del sistema.' },
        { comando: 'source .venv/bin/activate && pip install pytest', windows: '.venv\\Scripts\\activate && pip install pytest', explicacion: 'Activa el entorno e instala pytest dentro de él.' }
      ],
      ejecutar: { comando: 'python -m ordenar ~/Downloads --simular', windows: 'python -m ordenar %USERPROFILE%\\Downloads --simular', explicacion: 'Muestra qué movería, sin mover nada.' },
      testear: { comando: 'pytest', explicacion: 'Corre los tests sobre carpetas temporales.' }
    },
    plan: [
      { paso: 'Configuración del proyecto', tipo: 'config', archivo: 'pyproject.toml', concepto: 'un archivo para el proyecto y sus herramientas' },
      { paso: 'El paquete ordenar', tipo: 'config', archivo: 'ordenar/__init__.py', concepto: 'paquetes de Python' },
      { paso: 'Apunte: diccionarios y funciones', tipo: 'teoria', archivo: 'notas/01-diccionarios.md', concepto: 'diccionarios y funciones puras' },
      { paso: 'Reglas por extensión', tipo: 'codigo', archivo: 'ordenar/reglas.py', concepto: 'diccionarios' },
      { paso: 'Tests de las reglas', tipo: 'test', archivo: 'tests/test_reglas.py', concepto: 'pytest', verificar: 'pytest' },
      { paso: 'Apunte: rutas y dataclasses', tipo: 'teoria', archivo: 'notas/02-rutas.md', concepto: 'pathlib y dataclasses' },
      { paso: 'Planificar sin tocar nada', tipo: 'codigo', archivo: 'ordenar/plan.py', concepto: 'pathlib y dataclasses' },
      { paso: 'Tests con carpetas temporales', tipo: 'test', archivo: 'tests/test_plan.py', concepto: 'tmp_path', verificar: 'pytest' },
      { paso: 'Mover de verdad', tipo: 'codigo', archivo: 'ordenar/ejecutar.py', concepto: 'efectos al final' },
      { paso: 'Línea de comandos', tipo: 'codigo', archivo: 'ordenar/__main__.py', concepto: 'argparse' },
      { paso: 'Probar en modo simulación', tipo: 'comando', comando: 'python -m ordenar ~/Downloads --simular', explicacion: 'Muestra el plan sin mover nada.' }
    ],
    guia: PY_GUIA,
    archivos: {
      'notas/01-diccionarios.md': [
        '> Apunte 1. Las reglas del proyecto son un diccionario y una función. Primero la idea; las líneas con > se leen.',
        '## Diccionarios',
        '> Un diccionario guarda pares clave → valor. Buscar por la clave es directo: no recorre nada.',
        'Un diccionario relaciona una clave con un valor.',
        '```python',
        'precios = {"pan": 900, "leche": 1200}',
        'precios["pan"]',
        '```',
        '> Con corchetes, una clave que no existe da KeyError. .get(clave, defecto) devuelve el defecto en su lugar.',
        '```python',
        'precios.get("queso", 0)',
        '```',
        '## Funciones puras',
        '> Una función pura solo calcula: misma entrada, misma salida, sin tocar el disco ni la pantalla. Por eso se testea fácil.',
        'Una función pura no tiene efectos: solo calcula.',
        '```python',
        'def doble(n: int) -> int:',
        '    return n * 2',
        '```'
      ],
      'notas/02-rutas.md': [
        '> Apunte 2. Para planificar qué mover, dos herramientas de la biblioteca estándar.',
        '## pathlib',
        '> Path representa una ruta como objeto: sirve igual en Windows, macOS y Linux, sin pegar textos con barras.',
        'Path es una ruta que entiende cualquier sistema.',
        '```python',
        'from pathlib import Path',
        'foto = Path("Descargas") / "foto.PNG"',
        'foto.suffix.lower()',
        '```',
        '## dataclasses',
        '> @dataclass arma una clase para guardar datos sin escribir __init__ a mano. frozen=True la vuelve inmutable.',
        'Una dataclass es una clase solo para datos.',
        '```python',
        '@dataclass(frozen=True)',
        'class Movimiento:',
        '    origen: Path',
        '    destino: Path',
        '```'
      ],
      'pyproject.toml': [
        '# Cómo empezar: la configuración del proyecto y de sus herramientas en un solo archivo.',
        '[project]',
        'name = "ordenar-descargas"',
        'version = "1.0.0"',
        'requires-python = ">=3.12"',
        '',
        '# pythonpath = ["."]: pytest encuentra el paquete ordenar/ sin instalarlo.',
        '[tool.pytest.ini_options]',
        'pythonpath = ["."]'
      ],
      'ordenar/__init__.py': [
        '# Este archivo convierte la carpeta ordenar/ en un paquete de Python:',
        '# así «from ordenar.reglas import ...» y «python -m ordenar» la encuentran.',
        '# Puede quedar vacío: solo con existir ya cumple su función.'
      ],
      'ordenar/reglas.py': [
        '# Cómo empezar: las REGLAS van primero y aparte: deciden a qué carpeta va cada',
        '# archivo, sin tocar el disco. Así se testean solas y se cambian sin riesgo.',
        '# Un diccionario en vez de muchos if: agregar una extensión es agregar una línea.',
        'CARPETAS = {',
        '    ".jpg": "Imágenes",',
        '    ".png": "Imágenes",',
        '    ".pdf": "Documentos",',
        '    ".docx": "Documentos",',
        '    ".xlsx": "Documentos",',
        '    ".mp3": "Música",',
        '    ".mp4": "Videos",',
        '    ".zip": "Comprimidos",',
        '}',
        '# ↑ CARPETAS: a qué carpeta va cada extensión.',
        '',
        '# Lo que no reconocemos va a «Otros» en vez de quedarse suelto o dar error.',
        'OTROS = "Otros"',
        '',
        '',
        'def carpeta_para(nombre: str) -> str:',
        '    # lower() para que «FOTO.JPG» y «foto.jpg» vayan al mismo lugar.',
        '    # rpartition separa por el ÚLTIMO punto: «informe.final.pdf» da «pdf».',
        '    _, punto, extension = nombre.lower().rpartition(".")',
        '    if not punto:',
        '        return OTROS',
        '    return CARPETAS.get("." + extension, OTROS)',
        '# ↑ carpeta_para: mira la extensión del nombre y devuelve su carpeta, u Otros si no la conoce.'
      ],
      'tests/test_reglas.py': [
        '# Cómo empezar: probamos las reglas con nombres inventados; ningún archivo real.',
        'from ordenar.reglas import OTROS, carpeta_para',
        '',
        '',
        '# El caso normal: la extensión decide la carpeta.',
        'def test_imagen_va_a_imagenes():',
        '    assert carpeta_para("vacaciones.jpg") == "Imágenes"',
        '',
        '',
        '# Mayúsculas y varios puntos: casos que en la vida real aparecen.',
        'def test_mayusculas_y_varios_puntos():',
        '    assert carpeta_para("INFORME.final.PDF") == "Documentos"',
        '',
        '',
        '# Lo desconocido y lo que no tiene extensión van a Otros, sin error.',
        'def test_desconocido_y_sin_extension():',
        '    assert carpeta_para("datos.xyz") == OTROS',
        '    assert carpeta_para("LEEME") == OTROS'
      ],
      'ordenar/plan.py': [
        '# Cómo empezar: esta capa PLANIFICA sin mover nada: devuelve la lista de',
        '# movimientos. Separar «decidir» de «hacer» es lo que permite simular.',
        'from dataclasses import dataclass',
        'from pathlib import Path',
        '',
        'from ordenar.reglas import carpeta_para',
        '',
        '',
        '# dataclass en vez de una tupla: cada movimiento tiene nombres claros.',
        '# frozen=True la vuelve inmutable: un plan no se modifica por accidente.',
        '@dataclass(frozen=True)',
        'class Movimiento:',
        '    origen: Path',
        '    destino: Path',
        '# ↑ Movimiento: un archivo y adónde iría; solo datos, sin lógica.',
        '',
        '',
        'def planificar(carpeta: Path) -> list[Movimiento]:',
        '    movimientos = []',
        '    # sorted para que el plan salga siempre en el mismo orden (y los tests también).',
        '    for archivo in sorted(carpeta.iterdir()):',
        '        # Solo archivos: las carpetas (incluidas las que ya creamos) se dejan.',
        '        if not archivo.is_file():',
        '            continue',
        '        destino = carpeta / carpeta_para(archivo.name) / archivo.name',
        '        movimientos.append(Movimiento(archivo, destino))',
        '    # ↑ for: arma un movimiento por cada archivo, saltando las carpetas.',
        '    return movimientos',
        '# ↑ planificar: devuelve qué se movería y adónde, sin mover nada.'
      ],
      'tests/test_plan.py': [
        '# Cómo empezar: tmp_path es una carpeta temporal que pytest crea y borra:',
        '# nunca tocamos tus archivos reales.',
        'from ordenar.plan import planificar',
        '',
        '',
        'def test_planifica_sin_mover_nada(tmp_path):',
        '    (tmp_path / "foto.png").write_text("x")',
        '    (tmp_path / "notas.pdf").write_text("x")',
        '    plan = planificar(tmp_path)',
        '    # Dos movimientos, en orden alfabético, cada uno a su carpeta.',
        '    assert [m.destino.parent.name for m in plan] == ["Imágenes", "Documentos"]',
        '    # Y lo más importante: los archivos siguen donde estaban.',
        '    assert (tmp_path / "foto.png").exists()',
        '# ↑ test: con dos archivos, el plan manda cada uno a su carpeta y no mueve ninguno.',
        '',
        '',
        '# Las subcarpetas no se mueven: el plan solo mira archivos.',
        'def test_ignora_carpetas(tmp_path):',
        '    (tmp_path / "Imágenes").mkdir()',
        '    assert planificar(tmp_path) == []'
      ],
      'ordenar/ejecutar.py': [
        '# Cómo empezar: la única capa que toca el disco va al final y es pequeña:',
        '# lo peligroso queda aislado y fácil de revisar.',
        'import shutil',
        '',
        'from ordenar.plan import Movimiento',
        '',
        '',
        'def ejecutar(plan: list[Movimiento]) -> int:',
        '    movidos = 0',
        '    for m in plan:',
        '        # parents=True crea la carpeta si falta; exist_ok evita el error si ya existe.',
        '        m.destino.parent.mkdir(parents=True, exist_ok=True)',
        '        # Si ya hay un archivo con ese nombre, no lo pisamos: lo saltamos.',
        '        if m.destino.exists():',
        '            continue',
        '        # shutil.move y no rename: también funciona entre discos distintos.',
        '        shutil.move(m.origen, m.destino)',
        '        movidos += 1',
        '    # ↑ for: crea la carpeta destino y mueve cada archivo, sin pisar los que ya existen.',
        '    return movidos',
        '# ↑ ejecutar: aplica el plan en el disco y devuelve cuántos archivos movió.'
      ],
      'ordenar/__main__.py': [
        '# Cómo empezar: el punto de entrada. «python -m ordenar» ejecuta este archivo.',
        '# Lee los argumentos, muestra el plan y solo mueve si no es una simulación.',
        'import argparse',
        'from pathlib import Path',
        '',
        'from ordenar.ejecutar import ejecutar',
        'from ordenar.plan import planificar',
        '',
        '# argparse en vez de leer sys.argv a mano: valida y genera la ayuda (--help).',
        'parser = argparse.ArgumentParser(description="Ordena una carpeta por tipo de archivo.")',
        'parser.add_argument("carpeta", type=Path)',
        '# store_true: --simular no lleva valor; si aparece, vale True.',
        'parser.add_argument("--simular", action="store_true", help="muestra el plan sin mover nada")',
        'args = parser.parse_args()',
        '',
        '# expanduser convierte «~» en tu carpeta personal.',
        'plan = planificar(args.carpeta.expanduser())',
        'for m in plan:',
        '    print(f"{m.origen.name} -> {m.destino.parent.name}/")',
        '',
        '# Primero se mira, después se hace: el mismo plan, ahora de verdad.',
        'if args.simular:',
        '    print(f"Simulación: {len(plan)} archivos se moverían.")',
        'else:',
        '    print(f"Movidos: {ejecutar(plan)} archivos.")',
        '# ↑ if/else: con --simular solo cuenta los archivos; sin él, los mueve de verdad.'
      ]
    },
    conceptos: {
      'notas/01-diccionarios.md': ['diccionarios', 'funciones'],
      'notas/02-rutas.md': ['pathlib', 'dataclasses'],
      'ordenar/reglas.py': ['diccionarios', 'funciones'],
      'tests/test_reglas.py': ['pytest'],
      'ordenar/plan.py': ['pathlib', 'dataclasses'],
      'tests/test_plan.py': ['tmp_path'],
      'ordenar/ejecutar.py': ['shutil'],
      'ordenar/__main__.py': ['argparse']
    }
  }
];

export function getLesson(id: string | undefined): Lesson | undefined {
  return LESSONS.find((l) => l.id === id);
}

/** Lecciones de un tema del catálogo. */
export function lessonsForTopic(topicId: string | undefined): Lesson[] {
  return LESSONS.filter((l) => l.topicId === topicId);
}

/** autocompletehelp.json de una lección. */
export function lessonProjectFile(lesson: Lesson): ProjectFile {
  const arch = getArchitecture(lesson.arquitectura);
  return {
    prompt: lesson.proyecto,
    leccion: lesson.id,
    stack: { ...lesson.stack },
    convenciones: [...lesson.convenciones],
    ...(arch
      ? { arquitectura: { estilo: arch.id, nombre: arch.nombre, razones: [`Elegida para aprender ${lesson.tema}.`], carpetas: [...arch.carpetas], reglas: [...arch.reglas] } }
      : {}),
    entorno: lesson.entorno,
    aprender: { tema: lesson.tema, nivel: 'lección sin IA', objetivos: [...lesson.objetivos] },
    plan: lesson.plan.map((s) => ({ ...s, hecho: false }))
  };
}

/** Código ya escrito de un archivo de la lección (si lo hay). */
export function lessonCode(lessonId: string | undefined, path: string): { text: string; concepts: string[] } | undefined {
  const lesson = getLesson(lessonId);
  const lines = lesson?.archivos[path.replace(/^\.?\//, '')];
  return lines ? { text: lines.join('\n'), concepts: lesson!.conceptos[path] ?? [] } : undefined;
}
