# Changelog

Todos los cambios notables de AutoCompleteHelp se documentan aquí.

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
