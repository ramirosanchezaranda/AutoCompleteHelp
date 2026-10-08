# Changelog

Todos los cambios notables de AutoCompleteHelp se documentan aquí.

## [0.10.0] — 2026-10-09

### Añadido

- **Con API key, local o sin IA.** «Elegir la IA» es un asistente de tres
  pasos (cómo → proveedor → modelo, con ← Atrás). IAs locales listas para
  usar: Ollama, LM Studio, llama.cpp y Jan, con **detección de los modelos
  instalados** y ayuda para ponerlas en marcha si no responden. «Agregar IA»
  acepta endpoints en la nube con API key o locales sin clave. La barra de
  estado muestra cómo se está usando la IA.
- **Modo sin IA**: funcionan las lecciones sin IA, los perfiles curados con su
  plan base, la arquitectura, la estructura, el entorno y el repaso; lo que
  necesita un modelo lo avisa y ofrece elegir uno.
- **Lecciones sin IA**: proyectos completos con el código y las explicaciones
  ya escritos, que se completan juntos línea por línea sin modelo. Dos para
  empezar: *Gestor de gastos en la terminal* (TypeScript) y *Ordenar la
  carpeta Descargas* (Python), con sus tests verificados (3/3 y 5/5).
  Aparecen en «Quiero aprender» y entre los proyectos recomendados del tema.
- **Patrones de API** como tema propio: REST, paginación por cursor,
  versionado, idempotencia, rate limiting, errores estándar (Problem Details),
  webhooks firmados, OpenAPI y BFF.
- **Asistentes paso a paso**: «Quiero aprender» y la elección de arquitectura
  muestran «Paso n de N» y ← Atrás, conservando lo ya elegido.

## [0.9.0] — 2026-10-08

### Añadido

- **AutoCompleteHelp en su propia barra lateral**, con las secciones
  **Empezar**, **Quiero aprender** y **Plan del proyecto** (antes estaban en el
  explorador). **Empezar** —y el comando del mismo nombre— deja elegir siempre
  entre «Tengo un proyecto», «Quiero aprender algo» y «Recomiéndame un
  proyecto».
- **La IA recomienda proyectos**: elegido el tema, propone tres (sencillo,
  intermedio, ambicioso) con lo que se aprende, la duración y si usan Docker o
  la nube; se pueden pedir otros o escribir una idea propia. Sin conexión, se
  ofrecen las ideas del catálogo. **«Recomiéndame un proyecto»** parte de lo
  que le interesa a la persona y recomienda proyectos de cualquier tema.
- **Catálogo ampliado a 40 temas**: Go, Rust, Java con Spring Boot,
  C# y .NET, Next.js, FastAPI, GraphQL, patrones de diseño, SOLID y código
  limpio, DDD, arquitectura orientada a eventos, AWS, Azure, Google Cloud,
  Terraform, Kubernetes, CI/CD con GitHub Actions, entrenar un modelo de IA,
  redes neuronales, apps con LLMs (RAG y agentes), análisis de datos, web
  scraping, Flutter, Unity, Git y GitHub, seguridad web y algoritmos.
- Reglas propias en el diseño del proyecto: nube con presupuesto, credenciales
  fuera del código y un último paso que destruye todo; entrenamiento de IA
  reproducible y testeado; LLMs detrás de una interfaz con tests sin tokens.
- Se reconocen archivos de Terraform, Bicep, Dart y PowerShell.

## [0.8.0] — 2026-10-08

### Añadido

- **Quiero aprender**: sección en el explorador y comando. De un tema
  («TypeScript», «Three.js», «arquitectura hexagonal», «automatizaciones con
  Python», «Docker», «SQL» o cualquier otro) a un proyecto completo para
  aprenderlo: guía en `docs/APRENDER.md`, stack, arquitectura del catálogo,
  plan y entorno. Se crea en una carpeta nueva (o en la abierta, si está
  vacía) y se construye con el flujo de siempre. Trece temas curados traen
  una semilla (stack, arquitectura, ideas de proyecto); el resto lo diseña la
  IA.
- **Pasos tipados** en el plan: código, test, configuración, Docker y
  comando, con su ícono. Los tests son obligatorios en los proyectos de
  aprendizaje; Docker solo cuando aporta. Un paso de comando se escribe en la
  terminal al abrirlo.
- **Verificación al terminar un paso**: si el paso tiene `verificar`, se
  ofrece correr sus tests.
- **«Preparar el entorno»**: instalar, Docker, ejecutar y tests del
  proyecto, cada comando con su explicación, escritos en la terminal sin
  ejecutarse.
- `autocompletehelp.json` suma `entorno`, `aprender` y, en cada paso, `tipo`,
  `comando`, `explicacion` y `verificar`.
- Se reconocen `Dockerfile`, `Makefile` y `.env` para crear sus archivos con
  la instrucción del paso; los archivos JSON también se completan juntos.

## [0.7.0] — 2026-10-08

### Cambiado

- **Un solo modo: «Completamos juntos».** Se quitaron los niveles de
  aprendizaje (`edúcame`, `pista`, `guiado`, `completo`) y el autocompletado
  con Tab. La IA prepara el código del paso y se muestra en gris **una línea a
  la vez**, con los comentarios que la explican justo arriba; al terminarla
  (Enter) aparece la siguiente. El código entra al archivo a medida que
  avanzas: nunca queda escrito por adelantado lo que no tecleaste.
- Los comentarios combinan lo mejor de los niveles anteriores: definen cada
  concepto la primera vez y explican qué, en vez de qué y cuándo no.
- **Los huecos quedan solo en los repasos**: al construir el proyecto, todo el
  código se muestra en gris.
- «Entender este error» nunca da el código corregido.
- Las instrucciones `// ach: …` + Enter se detectan sin depender del
  autocompletado del editor.

### Añadido

- **Arquitectura y diseño de sistemas**: comando **«Elegir arquitectura»**,
  también dentro de «Elegir stack», antes de armar el plan. Catálogo de nueve
  estilos (monolito en capas, MVC, monolito modular, hexagonal, Clean
  Architecture, frontend por componentes, microservicios, serverless y
  orientada a eventos), cada uno con su organización, reglas, recorrido de una
  petición, cuándo sí, cuándo no y costo. Tres preguntas dan una
  recomendación calculada con reglas, sin IA.
- La arquitectura se guarda en `autocompletehelp.json`; el plan sigue su
  estructura y el código explica en qué parte de ella vive cada archivo.
- **`docs/ARQUITECTURA.md`**: registro de la decisión con contexto,
  alternativas, consecuencias y diagrama Mermaid.

### Eliminado

- Settings `learningLevel`, `interactionMode`, `dictation.gaps` y
  `debounceMs`; comandos «Elegir nivel de aprendizaje» y «Elegir modo».

## [0.6.0] — 2026-10-01

### Añadido

- **Huecos en el dictado**: en los conceptos que ya escribiste varias veces,
  algunas palabras no se dictan (se ven como un subrayado punteado) y se
  escriben de memoria; lo nuevo se dicta entero. En un hueco, el error no
  revela el carácter; Tab revela la palabra y cuenta como ayuda. Setting
  `autocompletehelp.dictation.gaps` (`auto`, `always`, `off`).
- **Repaso espaciado** (sistema Leitner): cada concepto que escribiste vuelve a
  los 1, 3, 7, 14 y 30 días. La barra de estado avisa cuántos vencen; el
  comando **«Repasar conceptos»** abre un ejercicio corto, dictado con la mitad
  de las palabras como hueco. Si sale bien, el concepto pasa al intervalo
  siguiente; si cuesta (o se completa sin escribir), vuelve al primero.
- **«Entender este error»**: acción rápida (bombita) sobre errores y avisos del
  editor, también en el menú contextual. Explica qué dice el error, por qué
  ocurre en esa línea, cómo encontrar la solución y cómo reconocerlo la próxima
  vez. No da el código corregido, salvo en nivel `completo`.

## [0.5.0] — 2026-10-01

### Añadido

- **Modo dictado** (nuevo modo predeterminado): la IA no autocompleta, dicta.
  Al abrir un paso del plan (o escribir `ach: …` + Enter) el código aparece en
  gris y lo escribes encima: lo correcto se vuelve código normal y un error
  marca el carácter sin avanzar. Los comentarios van antes de cada bloque y
  dictan qué escribir y por qué esa metodología; el primero dice cómo empezar.
  Comentarios, indentación y líneas en blanco avanzan solos; el código y cada
  Enter se teclean. Tab dicta una palabra, Retroceso vuelve, Esc ofrece
  dictar la línea, completar el resto o terminar borrando lo que falta. Al
  terminar muestra caracteres, errores y ayudas, y ofrece marcar el paso como
  hecho. Lo escrito en el dictado cuenta como practicado en «Ver mi progreso».
- Comando **«Elegir modo»** (`autocompletehelp.interactionMode`): `dictado` o
  `autocompletar` (el comportamiento anterior, con Tab).
- El prompt del proyecto se describe como **qué construyes + cómo quieres que
  te expliquen** (ej: «e-commerce completa, explica cada código que agregues y
  por qué elegiste esa metodología»), y el dictado cumple esa segunda parte.

## [0.4.0] — 2026-09-30

### Añadido

- **Panel «Plan del proyecto»** en el explorador: los pasos del plan con una
  casilla para marcarlos como hechos (se guarda en `autocompletehelp.json`) y el
  paso siguiente destacado. Un clic abre el archivo del paso; si no existe, lo
  crea vacío con la instrucción `ach:` del paso y dispara la sugerencia.
- **Perfiles de stack curados** para aprender: HTML + CSS + JavaScript,
  Node.js + Express 5 + MongoDB, Python + FastAPI + SQLite, React 19 + Vite y
  Python + Django 5.2. El perfil fija el stack y las convenciones (consistencia
  entre archivos) y el modelo adapta el plan al proyecto. Sin conexión con el
  modelo, se puede guardar el plan base del perfil.
- **Comando «Crear estructura del proyecto»**: crea el manifiesto, `.gitignore`,
  las variables de entorno y los archivos del plan, **vacíos salvo su
  instrucción `ach:`**. Muestra la lista para elegir y nunca sobrescribe. El
  comando de instalación se escribe en una terminal **sin ejecutarlo**, con la
  explicación de qué hace. Las dependencias se instalan por nombre para obtener
  la versión estable actual, en vez de fijar versiones que envejecen.
- «Elegir stack del proyecto» ahora ofrece los perfiles curados, un stack a
  elección o una recomendación, y al guardar propone crear la estructura.

## [0.3.0] — 2026-09-30

### Añadido

- **`autocompletehelp.json`**: el proyecto pasa a ser un archivo en la raíz,
  versionado con el código: prompt, stack con versiones, convenciones y plan.
  Antes el prompt vivía en el estado interno del IDE, invisible y sin
  versiones. Incluye esquema JSON para validarlo y autocompletarlo a mano; el
  prompt de versiones anteriores se sigue leyendo.
- **Contexto del proyecto en cada sugerencia**: árbol de archivos, manifiesto
  de dependencias (`package.json`, `requirements.txt`, `pyproject.toml`,
  `go.mod`, `Cargo.toml`) y lo que exportan los archivos que importa el actual.
  La IA deja de inventar rutas, APIs y campos. Setting
  `autocompletehelp.projectContext`.
- **Instrucciones en línea `ach:`**: un comentario como
  `// ach: ruta para listar productos con paginación` seguido de Enter hace que
  la sugerencia implemente esa instrucción, con el stack del proyecto y el nivel
  de aprendizaje activo. Comando «Construir aquí con una instrucción» en el menú
  contextual para quien no recuerde el prefijo.
- **«Elegir stack del proyecto»** (antes «Recomendar stack»): acepta el stack
  que ya elegiste y lo concreta con versiones, convenciones y plan; o recomienda
  uno si no lo sabes. El resultado se guarda estructurado en
  `autocompletehelp.json`.
- La guía «➜ Siguiente paso» sigue el plan del proyecto.
- Prompt de sistema cacheado con Anthropic: el contexto del proyecto cambia poco
  entre sugerencias y se lee de caché.
- Pruebas unitarias de la lógica pura (`npm test`), ejecutadas en el CI.

## [0.2.0] — 2026-07-22

### Añadido

- **Streaming de sugerencias (SSE)** para Anthropic, Gemini y APIs
  OpenAI-compatibles, con corte temprano y progreso en la barra de estado
  (`autocompletehelp.streaming`).
- **Guía del proyecto basada en el prompt**: los archivos vacíos reciben su
  esqueleto inicial según su ruta y el prompt, y cada sugerencia termina con
  un comentario «➜ Siguiente paso» (`autocompletehelp.projectGuidance`).
- **Nivel «edúcame»**: para empezar desde cero — cada línea explicada con
  conceptos básicos, una idea nueva por sugerencia.
- **Comando «Recomendar stack para mi proyecto»**: el LLM propone el stack más
  adecuado para aprender (con alternativas, estructura inicial y ruta de
  aprendizaje) y permite fijarlo en el prompt del proyecto.
- **Comando «Agregar IA»**: registra cualquier endpoint OpenAI-compatible
  propio (vLLM, LM Studio, Azure OpenAI, proxys corporativos…) con nombre,
  URL, modelo y API key cifrada; queda disponible en el selector como
  «Nombre (tu IA)».
- **Comentarios contrastivos**: cada explicación ahora dice qué hace el código,
  **en vez de qué** alternativa se eligió y **cuándo no** convendría. Un comentario
  que solo repite el código en castellano quedó prohibido en el prompt.
- **Registro de conceptos y andamiaje decreciente**: la extensión recuerda qué
  conceptos entraron a tu código y deja de explicarlos cuando ya los repetiste,
  igual que un profesor que suelta la mano. Configurable con
  `autocompletehelp.fadingScaffolding`.
- **Comando «Ver mi progreso»**: conceptos agrupados por etapa (recién vistos,
  en práctica, ya dominados) y qué proporción escribiste tú en vez de aceptar
  con Tab, con opción de reiniciar el progreso.
- Aviso único para definir el prompt del proyecto si aún no existe.

## [0.1.0] — 2026-07-22

### Añadido

- Autocompletado inline multi-lenguaje mediante `InlineCompletionItemProvider`
  (compatible con VS Code, Cursor, Windsurf y VSCodium).
- Prompt del proyecto por workspace: el usuario describe qué construye y cómo
  quiere que le ayude la IA.
- Tres niveles de aprendizaje: `pista` (solo comentarios-guía, el usuario
  escribe el código), `guiado` (código con comentarios que explican el porqué)
  y `completo` (código directo).
- Comando "Explicar código seleccionado" con panel pedagógico en español.
- Soporte multi-proveedor: Anthropic (Claude), OpenAI, Google Gemini, Mistral,
  DeepSeek, xAI (Grok), Groq, OpenRouter, Ollama local y endpoints
  OpenAI-compatibles personalizados.
- Selección de proveedor/modelo desde la barra de estado, con opción de
  escribir cualquier ID de modelo.
- API keys almacenadas en el `SecretStorage` del IDE.
- Debounce, cancelación de peticiones y caché de la última sugerencia.
