# PRD — AutoCompleteHelp Web (móvil y escritorio)

| | |
|---|---|
| **Producto** | AutoCompleteHelp Web: la versión web app (PWA) de la extensión AutoCompleteHelp |
| **Base** | Extensión para VS Code / Cursor, versión 0.12.0 (este repositorio) |
| **Estado** | Borrador para recrear el producto |
| **Idioma del producto** | Español (todo el contenido, la interfaz y las explicaciones de la IA) |

---

## 1. Resumen

AutoCompleteHelp es una herramienta para **aprender a programar construyendo proyectos reales, escribiendo cada línea uno mismo**. El código aparece en gris, una línea a la vez, con su explicación arriba; la persona lo escribe encima. No hay autocompletado: Tab no completa nada. Cuando se cierra un bloque, un comentario `↑` resume qué hace lo que se acaba de escribir. La teoría también se escribe: antes de cada concepto nuevo hay un apunte que se completa igual que el código.

Hay tres caminos de entrada, cada uno con una caja de texto:

1. **Tengo un proyecto**: describo qué construyo y cómo quiero que me expliquen, y elijo stack y arquitectura.
2. **Quiero aprender**: escribo un tema (TypeScript, patrones de API, AWS, entrenar una IA, GSAP, shaders…) y recibo proyectos para aprenderlo.
3. **Recomiéndame un proyecto** (Ideas): escribo qué me interesa y recibo recomendaciones.

La IA es **a elección**: cualquier proveedor con la API key de la persona, una IA local (gratis, en su computadora) o **sin IA**, con lecciones ya escritas que funcionan sin conexión.

La versión web lleva todo esto al navegador, en el celular, la tablet y la computadora, sin instalar un editor.

## 2. Problema y oportunidad

- Quien aprende con asistentes de código **lee y acepta**, pero no escribe: no fija lo aprendido. Copiar y pegar tampoco enseña.
- Los cursos enseñan con proyectos de juguete y un solo stack. Quien aprende necesita **proyectos reales, en el stack que eligió**, con tests, Docker cuando hace falta y la arquitectura explicada.
- La extensión exige VS Code y una computadora. Mucha gente aprende **desde el celular o la tablet**, en ratos cortos.
- Las IAs cuestan dinero o requieren cuenta: el producto debe funcionar con **la IA que la persona ya tiene** (o ninguna).

**Oportunidad:** una web app que cualquiera abre con un link, que funciona en el celular y que mantiene la misma metodología: escribir todo, con la explicación al lado.

## 3. Objetivos y no objetivos

### Objetivos

1. Paridad con la extensión en los tres caminos, «Completamos juntos», el plan, la teoría escrita, la arquitectura y la elección de IA.
2. Que escribir código **en el celular** sea cómodo: teclado en pantalla, una línea por vez, ajuste de línea, sin scroll horizontal.
3. **Ejecutar en el navegador** lo que se pueda (tests de JavaScript/TypeScript y Python, vista previa de páginas, animaciones y shaders), y explicar con claridad lo que no (Docker, nube).
4. **Local-first**: los proyectos viven en el dispositivo; la cuenta y la sincronización son opcionales.
5. Funcionar **sin IA y sin conexión** con las lecciones escritas.

### No objetivos (v1)

- Reemplazar un IDE completo (depurador, extensiones, Git integrado completo).
- Ejecutar Docker, Kubernetes o desplegar a la nube desde el navegador.
- Colaboración en tiempo real entre varias personas.
- Hospedar o revender modelos de IA: la persona trae su clave o su IA local.
- Otros idiomas de interfaz (queda preparado para traducir).

## 4. Usuarios

| Perfil | Necesita | Ejemplo |
|---|---|---|
| **Desde cero** | Que nada quede sin explicar; ir despacio | «nunca programé, quiero aprender JavaScript» |
| **Viene de otro lenguaje** | Comparar con lo que ya sabe | «sé Python, quiero aprender TypeScript» |
| **Quiere un proyecto propio** | Construir su idea entendiendo cada capa | «e-commerce completa, explica cada código y por qué esa metodología» |
| **Diseñador/a o creativo/a** | Aprender animación, composición y shaders con código | «quiero aprender GSAP y shaders» |
| **Docente** | Proyectos guiados para su clase, sin pagar IA | lecciones sin IA, exportables |

## 5. Principios del producto

1. **Todo se completa escribiendo**: código, configuración, infraestructura y teoría. Nada aparece de golpe.
2. **Un paso a la vez, sin scroll infinito**: cada parte es una pestaña que se superpone a la anterior, con ← Atrás que conserva lo elegido.
3. **Explicar el porqué**, no solo el qué: cada bloque tiene su comentario antes y su resumen `↑` después.
4. **La IA se elige, no se impone**: cualquier proveedor, local o sin IA; la primera vez se pregunta.
5. **Algoritmos antes que IA**: recomendaciones de arquitectura, catálogo, perfiles de stack, repaso y verificación son reglas y datos; la IA solo cuando aporta (diseñar un proyecto nuevo, explicar un error).
6. **Verificable**: tests reales (rojo → verde) y vista previa; nada se da por aprendido sin comprobarlo.
7. **Local-first y privado**: los proyectos y las claves quedan en el dispositivo.

## 6. Experiencia y flujos

### 6.1 Inicio

- Arriba, siempre visible: **la IA activa** («Anthropic · claude-…», «Ollama · qwen2.5-coder (local)», «Sin IA» o «sin elegir todavía») y el botón **Cambiar IA**.
- Tres pestañas: **Proyecto**, **Aprender**, **Ideas**. Cada una con su ayuda, una caja de texto, ejemplos para tocar y un botón. **Enter** envía; Shift+Enter hace un salto de línea.
- Lo escrito arranca ese camino **saltando los pasos ya respondidos** (si escribí el tema, voy directo a «Tu nivel»).
- Lo escrito en cada pestaña se conserva si cambio de pestaña o vuelvo atrás.

### 6.2 Pestañas por camino (sin scroll de página)

| Camino | Pestañas |
|---|---|
| Quiero aprender | Empezar › Tema › Tu nivel › Proyecto › Diseño › Completar código |
| Ideas | Empezar › Tu interés › Tu nivel › Proyecto › Diseño › Completar código |
| Tengo un proyecto | Empezar › Tu proyecto › Stack › Arquitectura › Completar código |

- Una pestaña está habilitada solo si las anteriores están completas. **Cambiar algo invalida las siguientes** (vuelven a quedar pendientes).
- Barra inferior fija: **← Atrás**, «Paso n de N · qué hacer», **Siguiente →**.
- La página nunca tiene scroll; si una pestaña tiene mucho contenido (catálogo de temas), scrollea **dentro** de su panel.

### 6.3 Tema, nivel y proyecto

- **Tema**: caja de texto arriba («Escribe lo que quieres aprender») y el catálogo debajo, agrupado por áreas en chips. Lo escrito se asocia al tema del catálogo más parecido (coincidencia de la palabra clave más larga) para usar su stack; si no hay coincidencia, la IA diseña desde cero.
- **Nivel**: Desde cero · Ya programo en otra cosa · Lo usé un poco.
- **Proyecto**: tres recomendaciones (sencilla, intermedia, ambiciosa) con duración, si usan Docker o la nube y qué se aprende. Primero las **lecciones sin IA** del tema (📗). Sin IA, el resto aparece como «necesita IA». Se puede pedir otras o escribir una idea propia.
- **Diseño**: título, tema, stack, arquitectura (con «por qué»), cantidad de pasos y de tests, tamaño (corto, mediano o completo) y la guía completa (`docs/APRENDER.md`). Botón **Crear el proyecto**.

### 6.4 Stack y arquitectura (Tengo un proyecto)

- **Stack**: perfiles curados (HTML+CSS+JS, Node+Express, FastAPI, React+Vite, Django…) o el que la persona escriba; la IA lo concreta con versiones y convenciones. Sin IA, el perfil trae su plan base.
- **Arquitectura**: tres o cuatro preguntas (tipo de app, equipo, áreas del negocio, qué quiero aprender) → **recomendación por reglas, sin IA** entre: monolito en capas, MVC, monolito modular, hexagonal, Clean Architecture, frontend por componentes, microservicios, serverless y orientada a eventos. Cada opción con cómo funciona, carpetas, reglas, cuándo sí, cuándo no, costo y diagrama. La decisión queda en `docs/ARQUITECTURA.md` (formato ADR).

### 6.5 Completar código: el editor «Completamos juntos»

Es el corazón del producto. Reglas (idénticas a la extensión; el motor es el mismo módulo):

1. **El archivo empieza con la instrucción del paso** (`// ach: Conexión a la base (enseña: pool de conexiones)`).
2. Al abrir el paso se muestra **solo la línea actual en gris**, con los comentarios que tiene arriba. Al terminarla y pulsar **Enter**, aparece la siguiente.
3. **Avanza solo** lo que no se teclea: comentarios (son la explicación, se leen), líneas en blanco y la indentación al empezar una línea.
4. Se escribe **carácter por carácter** encima del gris. Un error marca el carácter en rojo y dice qué se esperaba («esperaba `;`»); no avanza.
5. **Acentos tolerantes**: `e` vale por `é` (teclados sin acentos).
6. **Tab no completa nada** (avisa: «cada palabra la escribes tú»). **Retroceso** vuelve un carácter. **Esc** abre opciones: dictarme la línea, completar el resto, terminar y borrar lo que falta.
7. **Barra de explicación**: «Por qué:» con el comentario que corresponde a lo que se escribe; al cerrar un bloque, «↑ Lo que acabas de escribir: …».
8. **Resumen al cerrar cada bloque**: después de la `}` de una función, clase, `if`, `for` u objeto (en Python, al terminar el cuerpo), un comentario `↑` resume qué hace.
9. **Ajuste de línea**: lo que no entra en el ancho sigue abajo; nunca scroll horizontal. Comentarios de ~80 caracteres por línea.
10. Al terminar: «✓ Lo escribiste tú: N caracteres, E errores, A ayudas» + el resumen del último bloque, y acciones: **Correr los tests** / **Comprobarlo** (si el paso tiene `verificar`) y **Marcar el paso como hecho**.
11. **Instrucción libre**: escribir `// ach: lo que quiero construir` + Enter en cualquier archivo arranca una sesión con esa instrucción.
12. **Apuntes de teoría** (`notas/NN-concepto.md`): las líneas `>` son la explicación (se leen); el título, la definición y el mini ejemplo se escriben.
13. **Progreso**: porcentaje escrito, errores y ayudas por sesión; conceptos aprendidos para el repaso.

**En el celular** (≤ 900 px) el editor tiene sub-pestañas **Plan · Código · Terminal · Guía**. Para el teclado en pantalla hay un campo de texto invisible que recibe lo que se escribe y lo pasa al motor (así funcionan autocorrector apagado, mayúsculas y acentos). En **escritorio** se ven a la vez explorador + plan, editor + terminal y guía.

### 6.6 Plan, estructura, entorno y terminal

- **Plan**: lista de pasos con tipo (`teoria`, `codigo`, `test`, `config`, `docker`, `comando`), el siguiente marcado con ➜, casillas para marcar hechos.
- **Crear estructura**: crea los archivos del plan vacíos salvo su instrucción `ach:`; lo existente no se toca.
- **Preparar el entorno**: instalar, Docker, ejecutar y tests, agrupados. Los comandos **se escriben en la terminal sin ejecutarse**: los lanza la persona.
- **Terminal**: en la web ejecuta lo que el entorno del navegador permite (ver §11.3); lo demás se muestra como «cópialo y córrelo en tu computadora», con la explicación de cada comando.

### 6.7 Tests y verificación

- Los tests se escriben como cualquier archivo y se corren desde el paso: **rojo primero** (la función no existe), **verde** al escribirla.
- La vista previa (páginas, animaciones, shaders) se abre en un panel junto al código y se recarga al guardar.

### 6.8 Repaso espaciado

- Cada concepto escrito entra en un registro con fecha. Pasado un tiempo, se propone un **repaso**: un fragmento ya escrito con algunas palabras en blanco («huecos») para escribir de memoria.

### 6.9 Diseño, animación y shaders

Área propia del catálogo con 11 temas: **GSAP**, **animación con CSS y Web Animations API**, **principios de animación y motion design**, **composición y diseño con JavaScript** (grillas, jerarquía, color, tipografía en canvas), **creative coding y arte generativo (p5.js)**, **shaders con GLSL (WebGL2)**, **shaders en Three.js (ShaderMaterial)**, **React Three Fiber**, **WebGPU y WGSL**, **SVG e ilustración animada** y **Motion para React**.

**Metodología de estudio (también escribiendo):**

1. **Observar** una referencia (una animación, un póster, un shader).
2. **Reproducirla escribiéndola**, línea por línea, con la explicación de cada valor.
3. **Variar un parámetro por vez** y mirar el cambio en la vista previa.
4. **Crear** una pieza propia con lo aprendido.

**Requisitos propios de esta área:**

- **Apunte de teoría antes de cada principio**: timing, easing, stagger, anticipación, composición (jerarquía, contraste, ritmo, regla de tercios), color (HSL/OKLCH), coordenadas de un shader, `mix`/`smoothstep`/`distance`, uniforms.
- **Los números van en funciones puras con tests** (duraciones, retrasos, posiciones de la grilla, paletas, `mix` y `smoothstep` replicadas en TypeScript); el código que anima o dibuja solo los usa.
- **Vista previa en vivo** junto al editor: la animación se reproduce al guardar; botón «Repetir»; control de velocidad (0.25×, 0.5×, 1×) para estudiar el movimiento.
- **Shaders**: archivos `.frag`/`.vert`/`.wgsl` propios, comentados. `#version` no va en el archivo (WebGL la exige en la primera línea y el archivo empieza con comentarios): la agrega el código que compila. Si un shader no compila, se muestra el error de la GPU **con la línea marcada en el editor**.
- **Depurar como color**: una opción para mostrar un valor del shader como color.
- **Accesibilidad**: animar `transform` y `opacity`; respetar `prefers-reduced-motion`.
- **Generativo**: semilla fija para reproducir una obra; exportar como imagen.
- WebGPU: comprobar `navigator.gpu` y explicar qué navegadores lo soportan.

**Lecciones sin IA de esta área** (incluidas en la extensión 0.12.0, verificadas con tsc, Vitest, vite build y en el navegador):

- *Tarjetas que entran en escena* (GSAP): `notas/01-principios.md`, `src/movimiento.ts` (números puros: stagger y movimiento reducido), tests, `notas/02-timeline.md`, `src/animar.ts` (timeline), `src/main.ts`.
- *Tu primer shader: un atardecer animado* (GLSL + WebGL2): `notas/01-shader.md`, `src/color.ts` (mix y smoothstep en TS), tests, `pantalla.vert`, `atardecer.frag`, `notas/02-uniforms.md`, `src/webgl.ts`, `src/main.ts`.

## 7. Requisitos funcionales

Prioridad: **P0** imprescindible para el lanzamiento · **P1** poco después · **P2** más adelante.

| ID | Requisito | Prioridad |
|---|---|---|
| RF-01 | Inicio con tres pestañas y caja de texto; IA activa y «Cambiar IA» arriba | P0 |
| RF-02 | Recorridos por pestañas con ← Atrás, invalidación de pasos siguientes y sin scroll de página | P0 |
| RF-03 | Motor «Completamos juntos» con todas las reglas de §6.5 | P0 |
| RF-04 | Teclado en pantalla en móvil (campo invisible) y acentos tolerantes | P0 |
| RF-05 | Ajuste de línea en el editor y comentarios de ~80 caracteres | P0 |
| RF-06 | Resumen `↑` al cerrar bloques y su barra «Lo que acabas de escribir» | P0 |
| RF-07 | Pasos de teoría (`notas/*.md`) que se completan escribiendo | P0 |
| RF-08 | Elegir la IA: proveedor con API key, IA local, IA propia (endpoint OpenAI-compatible), sin IA; la primera vez se pregunta | P0 |
| RF-09 | Catálogo de 52 temas en 9 áreas con búsqueda por texto libre | P0 |
| RF-10 | Lecciones sin IA (4) que funcionan sin conexión | P0 |
| RF-11 | Recomendación de proyectos por la IA (bloque `ach-ideas`) con respaldo del catálogo | P0 |
| RF-12 | Diseño del proyecto por la IA (bloque `ach-learn`): guía, stack, arquitectura, entorno y plan tipado | P0 |
| RF-13 | Arquitectura: preguntas → recomendación por reglas → `docs/ARQUITECTURA.md` | P0 |
| RF-14 | Plan con tipos de paso, crear estructura y preparar el entorno | P0 |
| RF-15 | Ejecutar tests JS/TS en el navegador (rojo → verde) | P0 |
| RF-16 | Vista previa en vivo de páginas, animaciones y shaders, con errores de shader en el editor | P0 |
| RF-17 | Ejecutar Python y pytest en el navegador | P1 |
| RF-18 | Exportar el proyecto (.zip) y abrirlo en VS Code / la extensión (mismo `autocompletehelp.json`) | P0 |
| RF-19 | Importar un proyecto (.zip o carpeta) con su `autocompletehelp.json` | P1 |
| RF-20 | Explicar un error (seleccionar la salida de la terminal) | P1 |
| RF-21 | Repaso espaciado con huecos | P1 |
| RF-22 | Cuenta opcional y sincronización entre dispositivos | P2 |
| RF-23 | Publicar a GitHub (crear repo y subir) | P2 |
| RF-24 | Modo docente: compartir una lección propia por link | P2 |

## 8. Inteligencia artificial

### 8.1 Cómo se usa (a elección)

| Modo | Proveedores | Notas |
|---|---|---|
| **Con API key** | Anthropic (Claude), OpenAI (ChatGPT), Google (Gemini), Mistral, DeepSeek, xAI (Grok), Groq, OpenRouter | La persona pega su clave; se guarda cifrada en el dispositivo |
| **IA local** | Ollama, LM Studio, llama.cpp (server), Jan | Gratis y privada; se detectan los modelos instalados (`/v1/models` o `/api/tags`) |
| **Tus IAs** | Cualquier endpoint compatible con OpenAI | Nombre, URL base, modelo y clave opcional |
| **Sin IA** | — | Lecciones escritas, perfiles curados, arquitectura, estructura, repaso |

- **La primera vez** que algo necesita IA se abre «Elegir la IA»; nunca se pide la clave de un proveedor por defecto.
- Si falta la clave del proveedor activo: **escribirla** o **elegir otra IA**.
- Lo que necesita IA y no la tiene lo dice y ofrece elegir una.

### 8.2 Llamadas desde el navegador

- Llamadas **directas** desde el navegador cuando el proveedor lo permite (CORS); por ejemplo, Anthropic requiere el encabezado `anthropic-dangerous-direct-browser-access: true`.
- Para proveedores que no permiten CORS: **proxy opcional** sin estado (reenvía la petición con la clave que manda el navegador, no la guarda ni la registra). Se puede autohospedar.
- **IA local**: la página llama a `http://localhost:<puerto>`. Requiere habilitar el origen en la IA local (Ollama: variable `OLLAMA_ORIGINS`; LM Studio: activar CORS). La app muestra cómo hacerlo si no responde. Validar en Safari, que puede bloquear `localhost` desde HTTPS.
- Respuestas en streaming para que el dictado empiece mientras llega el código.

### 8.3 Reglas que se le dan a la IA (mismas que la extensión)

- **Dictado** (`buildDictationSystemPrompt`): solo código; bloques de 1 a 4 líneas con comentarios de línea completa ANTES; primer comentario «cómo empezar» y en qué parte de la arquitectura vive el archivo; explicar metodología, no solo sintaxis; definir cada concepto la primera vez; contrastar con alternativas; código completo, sin «…»; máx. ~60 líneas; comentarios de ~80 caracteres; **resumen `↑` al cerrar cada bloque**; tests explicados (normal, borde, error); apuntes `.md` con `>` para la explicación; **GLSL sin `#version`**; marcador `@ach-concepts` en la primera línea; «➜ Siguiente paso» al final; no repetir lo que el alumno ya domina.
- **Aprender** (`buildLearnSystemPrompt`): guía con secciones fijas; plan de lo simple a lo complejo; tests obligatorios; Docker solo si aporta; teoría escrita antes de cada concepto nuevo; reglas de nube (presupuesto, credenciales fuera del código, destruir al final), de IA (datos chicos, semilla fija), de LLMs (interfaz y modelo falso en tests), de seguridad (solo en local) y de **diseño/animación/shaders** (§6.9).
- **Formatos de respuesta**: bloques JSON etiquetados `ach-project` (stack, convenciones, plan), `ach-learn` (proyecto, guía, entorno, plan) y `ach-ideas` (recomendaciones). Se validan; si fallan, se recurre al catálogo.

### 8.4 Sin IA (algoritmos y datos)

Catálogo y búsqueda de temas, perfiles de stack con plan base, recomendación de arquitectura por reglas, estructura, entorno, repaso espaciado, verificación por tests y las lecciones escritas.

## 9. Contenido

- **Catálogo**: 52 temas en 9 áreas (lenguajes; web y backend; diseño, animación y creative coding; arquitectura y patrones; nube y DevOps; IA y datos; automatización; móvil y videojuegos; buenas prácticas). Cada tema: nombre, palabras clave, stack recomendado, arquitectura, ideas de proyecto y notas propias del tema.
- **Lecciones sin IA**: TypeScript (gestor de gastos), Python (ordenar Descargas), GSAP (tarjetas que entran en escena), GLSL (atardecer). Formato: metadatos, entorno, plan tipado, guía, archivos (líneas), conceptos por archivo.
- **Calidad del contenido**: toda lección se verifica de verdad (compilar, tests, build y navegador) antes de publicarse; todo lo que se teclea debe poder escribirse con un teclado en español.
- **Fuente única**: el catálogo, las lecciones, las arquitecturas y los prompts se comparten con la extensión (ver §11.1).

## 10. Diseño de interfaz

| Ancho | Distribución |
|---|---|
| **Móvil** (< 600 px) | Una columna; pestañas de pasos con scroll horizontal; editor con sub-pestañas Plan · Código · Terminal · Guía; barra de dictado con «Por qué», progreso, ⌫, Ver escribir, Esc; campo para el teclado |
| **Tablet** (600–1100 px) | Editor + plan; guía y terminal como sub-pestañas |
| **Escritorio** (> 1100 px) | Tres columnas: explorador + plan · editor + terminal · guía; vista previa como panel o pestaña |

- **Tipografía**: monoespaciada en el editor (JetBrains Mono o similar); gris para lo pendiente, color de sintaxis para lo escrito, ámbar para la instrucción `ach:` y el carácter siguiente, verde agua para los `↑`.
- **Tema claro y oscuro** según el sistema, con selector manual.
- **Accesibilidad**: navegable con teclado; foco visible; roles ARIA (tabs, tabpanel, dialog); `prefers-reduced-motion`; contraste AA; el dictado se puede usar con lector de pantalla (anuncia la línea y el carácter esperado).
- **Ventanas superpuestas** para elegir la IA (Cómo › Proveedor › Modelo con ← Atrás), crear estructura y preparar el entorno.

## 11. Arquitectura técnica propuesta

### 11.1 Monorepo y núcleo compartido

```
packages/
  core/        motor de dictado (typing), catálogo, lecciones, arquitecturas,
               prompts, parsers (ach-project, ach-learn, ach-ideas), esquema JSON
  extension/   la extensión actual de VS Code (usa core)
  web/         la PWA (usa core)
```

El motor actual (`src/typing.ts`, `src/learnCatalog.ts`, `src/lessons*.ts`, `src/architectures.ts`, `src/prompts.ts`, `src/projectFile.ts`) ya es puro (sin `vscode`) y tiene tests: se mueve a `core` sin cambios de lógica.

### 11.2 Frontend

- **React 19 + Vite + TypeScript**, PWA (service worker, instalable, offline).
- **Editor: CodeMirror 6** (funciona bien en móvil; decoraciones para el gris, el carácter siguiente, errores y huecos; ajuste de línea nativo). El motor de `core` decide qué se muestra; CodeMirror solo pinta.
- Estado con un store simple (Zustand o similar); las pestañas y el estado de cada camino se guardan para volver.

### 11.3 Ejecutar en el navegador

| Qué | Cómo | Límite |
|---|---|---|
| JS/TS, Node, npm, Vitest, Vite | **WebContainers** (StackBlitz) | Requiere aislamiento de origen (encabezados COOP/COEP); revisar licencia comercial |
| Python y pytest | **Pyodide** en un Web Worker | Paquetes puros o incluidos en Pyodide |
| Páginas, GSAP, p5.js, canvas, shaders | **iframe con sandbox** y recarga al guardar | WebGPU solo en navegadores compatibles |
| Docker, nube, bases de datos reales | No se ejecutan | Se muestran los comandos explicados para copiar, y se exporta el proyecto |

### 11.4 Datos y almacenamiento

- **IndexedDB** para proyectos (archivos, plan, progreso, sesiones) y **OPFS** para archivos grandes.
- Cada proyecto incluye `autocompletehelp.json` con el **mismo esquema** que la extensión (`schemas/autocompletehelp.schema.json`): prompt, lección, stack, convenciones, arquitectura, entorno, aprender, plan con tipos. Así un proyecto se exporta de la web y se abre en VS Code, y al revés.
- Sincronización opcional (P2): backend mínimo con cuenta y almacenamiento de proyectos; las claves de IA **nunca** se sincronizan.

### 11.5 Claves de IA

- Se guardan cifradas con **WebCrypto** (clave no exportable en IndexedDB). Opción de «no guardar, pedir cada vez».
- Solo se envían al proveedor elegido (o al proxy opcional). Nunca a servidores propios ni a analítica.

## 12. Modelo de datos (resumen)

- **Proyecto**: id, nombre, carpeta, `autocompletehelp.json`, archivos (ruta → texto), creado/modificado.
- **Paso del plan**: paso, tipo (`teoria`/`codigo`/`test`/`config`/`docker`/`comando`), archivo o comando, concepto, verificar, explicación, hecho.
- **Sesión de dictado**: archivo, texto completo, máscara de lo que avanza solo, posición, mostrado hasta, errores, ayudas, conceptos.
- **Progreso**: conceptos aprendidos (con fecha), pasos hechos, tiempo escrito, repasos pendientes.
- **Configuración**: IA (modo, proveedor, modelo, URLs locales), tema, nivel, ajuste de línea.

## 13. Seguridad y privacidad

- Local-first: sin cuenta, nada sale del dispositivo salvo las llamadas a la IA elegida.
- Vista previa en iframe con `sandbox` y origen aislado; el código del proyecto no accede a la app.
- La IA nunca recibe claves ni secretos del proyecto (`.env` excluido del contexto).
- Contenido de seguridad (tema OWASP) solo contra el propio proyecto en local.
- Política de contenido de la IA: proyectos educativos; nada destructivo en los comandos.

## 14. Rendimiento y offline

- Primera carga < 300 KB de JS inicial; el editor y los entornos de ejecución se cargan al usarse.
- Teclear en el dictado: respuesta < 16 ms por tecla en un celular de gama media.
- Offline: inicio, catálogo, lecciones sin IA, editor, tests JS/TS ya instalados y vista previa.

## 15. Métricas de éxito

- **Activación**: % que termina el primer paso escrito en su primera sesión.
- **Aprendizaje**: pasos escritos por semana; % de pasos con tests en verde; repasos completados.
- **Autonomía**: errores por 100 caracteres bajando con el tiempo; ayudas (dictar línea) por paso bajando.
- **Retención**: semana 1 y semana 4.
- **IA a elección**: distribución entre API key, local y sin IA (sin datos de las claves).
- **Móvil**: % de sesiones en celular y su tasa de pasos terminados.

## 16. Plan de entregas

| Fase | Contenido | Criterio de salida |
|---|---|---|
| **0. Núcleo** | Monorepo; `core` extraído de la extensión con sus tests | La extensión sigue pasando todos sus tests usando `core` |
| **1. MVP sin IA** | Inicio, recorridos por pestañas, catálogo, 4 lecciones, editor completo, plan, vista previa, tests JS/TS, exportar | Una persona completa la lección de GSAP y la de TypeScript en el celular |
| **2. IA** | Elegir la IA (API key, local, propia), recomendaciones, diseño de proyectos, dictado con IA, explicar errores | Un proyecto nuevo de cualquier tema se diseña y se escribe completo |
| **3. Python y repaso** | Pyodide + pytest, repaso espaciado, importar proyectos | La lección de Python pasa sus tests en el navegador |
| **4. Cuenta y compartir** | Sincronización, publicar a GitHub, modo docente | Un proyecto se continúa en otro dispositivo |

## 17. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Escribir código en el celular cansa | Una línea por vez, pasos cortos (5–40 líneas), sesiones que se retoman, acentos tolerantes |
| CORS de proveedores de IA | Llamadas directas donde se pueda; proxy opcional sin estado y autohospedable |
| IA local inaccesible desde HTTPS en algunos navegadores | Guía para habilitar el origen; probar Chrome, Firefox, Safari; alternativa con proxy local |
| Licencia o límites de WebContainers | Evaluar antes de la fase 1; alternativa: ejecutar tests con esbuild + un runner en Web Worker |
| La IA genera código que no compila o rompe el formato | Validar bloques JSON; tests del proyecto; reglas del prompt; botón «rehacer el paso» |
| Shaders o WebGPU no soportados | Detectar y explicar; la teoría y los tests siguen funcionando |
| Costos de IA para la persona | Sin IA y local como opciones de primera clase; mostrar qué acciones usan IA |

## 18. Criterios de aceptación (muestras)

- **Inicio**: en un celular de 390 px, las tres pestañas y «Cambiar IA» se ven sin scroll; escribir «TypeScript» + Enter lleva a «Tu nivel».
- **Pestañas**: ← Atrás desde «Proyecto» vuelve a «Tu nivel» con la opción marcada; cambiar el nivel invalida «Proyecto».
- **Dictado**: Tab no avanza; un error no avanza y dice qué esperaba; `e` vale por `é`; al cerrar una función aparece su `↑` y la barra lo muestra; ninguna línea genera scroll horizontal.
- **Teoría**: en `notas/01-tipos.md` las líneas `>` avanzan solas y el título se escribe.
- **Tests**: en la lección de TypeScript, correr los tests antes de escribir `gastos.ts` da rojo y después, verde.
- **Shaders**: la lección del atardecer compila y se ve; si se borra un `;` en el `.frag`, el error aparece en el editor en esa línea.
- **IA**: la primera vez que se pide diseñar un proyecto se abre «Elegir la IA»; con Ollama sin CORS, la app explica cómo habilitarlo; con «Sin IA», las lecciones funcionan sin conexión.
- **Exportar**: el .zip abierto en VS Code con la extensión muestra el mismo plan y los mismos pasos hechos.

## 19. Preguntas abiertas

1. ¿Marca y dominio propios, o «AutoCompleteHelp» también en la web?
2. ¿WebContainers (licencia) o un runner propio para los tests JS/TS?
3. ¿Se ofrece un proxy de IA hospedado por el proyecto, o solo autohospedado?
4. ¿Modelo de negocio: gratis con IA propia, plan con IA incluida, licencias para escuelas?
5. ¿Qué lecciones sin IA siguen? (propuesta: composición con canvas, p5.js generativo, CSS animations, React básico)

---

### Apéndice A — De la extensión a la web

| Extensión (VS Code) | Web app |
|---|---|
| Sección Empezar (webview) | Pantalla de inicio con tres pestañas |
| QuickPicks paso a paso con ← Atrás | Pestañas de pasos que se superponen |
| Editor de VS Code + decoraciones | CodeMirror 6 + decoraciones del mismo motor |
| `editor.action.toggleWordWrap` durante el dictado | Ajuste de línea siempre activo en el editor |
| Terminal integrada (escribe sin ejecutar) | Terminal de WebContainers / Pyodide, o comandos para copiar |
| SecretStorage | WebCrypto + IndexedDB |
| `autocompletehelp.json` en la carpeta | El mismo archivo dentro del proyecto en IndexedDB, exportable |
| Ollama / LM Studio por HTTP local | Igual, con CORS habilitado en la IA local |
| Paleta de comandos | Menú de acciones y atajos de teclado |
