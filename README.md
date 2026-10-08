# AutoCompleteHelp

Extensión para **VS Code, Cursor, Windsurf, VSCodium** y cualquier IDE basado en VS Code.

Construye tu proyecto desde el IDE **a partir de tu prompt**: describes qué estás construyendo y cómo quieres que te expliquen, eliges el stack y la arquitectura, y **completamos juntos** el código: la IA te muestra en gris una línea a la vez, con comentarios que explican qué hace y por qué se eligió esa forma, y **tú la escribes encima**. No hay autocompletado: nada entra a tu proyecto sin que lo teclees. El objetivo no es que la IA programe por ti: es **que aprendas y entiendas cada parte de tu proyecto**.

## 🤖 Con API key, con una IA local o sin IA

El comando **Elegir la IA** (o un clic en la barra de estado) es un asistente de tres pasos, con ← Atrás:

1. **¿Cómo quieres usarla?**
   - **Con API key**: Claude, ChatGPT, Gemini, Mistral, DeepSeek, Grok, Groq u OpenRouter. La clave se guarda cifrada en el sistema.
   - **IA local**: Ollama, LM Studio, llama.cpp o Jan. Gratis y privada, en tu PC, sin internet ni API key. AutoCompleteHelp **detecta los modelos que tienes instalados**; si la IA no responde, te dice cómo ponerla en marcha.
   - **Tus IAs**: las que agregaste con *Agregar IA* (en la nube con API key, o locales).
   - **Sin IA**: todo lo que no necesita un modelo, gratis y sin conexión.
2. El proveedor.
3. El modelo.

**Qué funciona sin IA:** las **lecciones sin IA** (proyectos completos con el código y las explicaciones ya escritos y probados, que se completan juntos igual, línea por línea), los perfiles de stack curados con su plan base, la elección de arquitectura, crear la estructura, preparar el entorno, el repaso espaciado y el progreso. Lo que necesita un modelo (diseñar un proyecto nuevo, explicar código o errores) lo avisa y ofrece elegir una IA.

## 🧭 Empezar

AutoCompleteHelp tiene su propio ícono en la barra lateral, con tres secciones: **Empezar**, **Quiero aprender** y **Plan del proyecto**. **Empezar** tiene una caja para escribir en cada camino (Enter o el botón lo arranca, ya con tu texto):

- **Tengo un proyecto**: escribes qué construyes y cómo quieres que te expliquen, y eliges stack y arquitectura.
- **Quiero aprender**: escribes el tema —«TypeScript», «patrones de API», «configurar AWS», «entrenar una IA»— y la IA te recomienda proyectos para aprenderlo.
- **Recomiéndame un proyecto**: escribes qué te interesa («quiero trabajar de backend», «me gustan los videojuegos») y la IA te recomienda proyectos de cualquier tema.

El comando *Empezar* hace lo mismo desde la paleta: escribes y eliges si es tu proyecto, lo que quieres aprender o lo que te interesa.

En los tres casos **todo se completa escribiendo**: el código, la configuración y también la **teoría**. Los pasos de teoría son apuntes (`notas/01-tipos.md`…) que aparecen antes del código que los usa: la explicación se lee (las líneas `>`) y debajo escribes, en gris, una línea a la vez, la definición y un mini ejemplo.

## 🎓 Quiero aprender

41 temas curados, agrupados en lenguajes (TypeScript, Python, Go, Rust, Java, C#…), web y backend (React, Next.js, Node, FastAPI, GraphQL, Three.js), **arquitectura y patrones** (patrones de API —REST, paginación, versionado, idempotencia, rate limiting, webhooks, OpenAPI—, patrones de diseño, SOLID y código limpio, hexagonal, Clean Architecture, DDD, microservicios, eventos), **nube y DevOps** (AWS, Azure, Google Cloud, Terraform, Docker, Kubernetes, CI/CD), **inteligencia artificial y datos** (entrenar un modelo de IA, redes neuronales, apps con LLMs, análisis de datos, SQL), automatización, móvil y videojuegos (Flutter, Unity) y buenas prácticas (testing, Git, seguridad, algoritmos). O cualquier otro tema escrito a mano.

El flujo es un **asistente paso a paso**: cada paso aparece sobre el anterior, con «Paso n de N» y ← Atrás para volver sin perder lo elegido.

1. Eliges el tema y desde dónde arrancas (desde cero, ya programo en otra cosa, lo usé un poco).
2. **La IA te recomienda tres proyectos** —y, si el tema tiene, primero las **lecciones sin IA**— —uno sencillo, uno intermedio y uno más ambicioso— con lo que aprendes en cada uno, la duración y si usan Docker o la nube. Puedes pedir otras recomendaciones o escribir tu propia idea. Sin conexión, se ofrecen las ideas del catálogo.
3. Eliges el tamaño (corto, mediano o completo) y la carpeta.
4. La IA diseña **ese proyecto, explicado de principio a fin**:
   - **guía** en `docs/APRENDER.md`: qué vas a construir, qué vas a aprender, qué instalar, cómo está organizado, el paso a paso, los tests, Docker y cómo seguir;
   - **stack** y **arquitectura** del catálogo (con `docs/ARQUITECTURA.md`);
   - **plan con pasos tipados**: código, **tests** (obligatorios: cada pieza de lógica tiene el suyo; en temas de testing, el test va primero), configuración, **Docker** solo cuando aporta (una base de datos, varios servicios, o el tema es Docker) y comandos;
   - **entorno**: cómo instalar, ejecutar, correr los tests y levantar Docker, cada comando con su explicación.
5. Se crea en una carpeta nueva (o en la abierta, si está vacía) y la abre. Desde ahí es el flujo de siempre: crear estructura, plan y completamos juntos.
6. Al terminar un paso que tiene verificación, AutoCompleteHelp ofrece **correr sus tests**; **Preparar el entorno** lista los comandos de instalar, Docker, ejecutar y tests. Todos se escriben en la terminal **sin ejecutarse**: los lanzas tú.

Los temas curados traen una semilla probada (stack, arquitectura e ideas de proyecto) para que el resultado sea consistente; cualquier otro tema lo diseña la IA desde cero.

Reglas que siguen todos los proyectos de aprendizaje:

- **Todo se escribe**: también la configuración y la infraestructura como código (Terraform, Bicep, manifiestos de Kubernetes), archivo por archivo y comentada.
- **Nube** (AWS, Azure, Google Cloud): capa gratuita y alerta de presupuesto al empezar, credenciales con el CLI (nunca en el código) y un **último paso que destruye todo** lo creado para no generar costos.
- **Entrenar IA**: datos chicos que entrenan en CPU en minutos, entrenamiento y prueba separados, semilla fija, métricas explicadas y tests del preprocesamiento y de la predicción.
- **Apps con LLMs**: el modelo va detrás de una interfaz y los tests usan uno falso, sin gastar tokens.
- **Seguridad**: solo contra el propio proyecto, en local.

## 🧭 Cómo se construye un proyecto con AutoCompleteHelp

1. **Describe el proyecto** (*Definir prompt del proyecto*) en una frase: **qué construyes + cómo quieres que te expliquen**. Por ejemplo:
   > e-commerce completa, explica cada código que agregues y por qué elegiste esa metodología

   La segunda mitad no es decorativa: la IA la cumple en cada comentario.
2. **Elige el stack** (*Elegir stack del proyecto*): uno de los perfiles curados para aprender (HTML + CSS + JS, Node + Express, Python + FastAPI, React + Vite, Django), el que tú quieras, o una recomendación.
3. **Elige la arquitectura**: monolito en capas, MVC, monolito modular, hexagonal, Clean Architecture, frontend por componentes, microservicios, serverless u orientada a eventos.
   - Tres preguntas (quiénes trabajan, cuántas áreas tiene el negocio, qué quieres aprender) dan una **recomendación**, calculada con reglas, sin IA.
   - Cada opción se explica: cómo se organiza, sus reglas, el recorrido de una petición, cuándo sí, cuándo no y lo que se paga.
   - La decisión queda en `docs/ARQUITECTURA.md` como registro de decisión (contexto, alternativas, consecuencias y diagrama), y el plan se arma con esa estructura.
4. **Crea la estructura** (*Crear estructura del proyecto*): manifiesto, `.gitignore` y los archivos del plan, **vacíos salvo su instrucción `ach:`**. Nunca sobrescribe. El comando de instalación se escribe en la terminal con su explicación, y lo ejecutas tú.
5. **Sigue el plan** desde el panel **Plan del proyecto** del explorador: un clic abre (o crea) el archivo del paso, por ejemplo `server.js`, y **completamos juntos**; la casilla marca el paso como hecho.
6. **Completamos juntos, línea por línea**:
   - Se ve en gris **solo la línea que vas a escribir**, con los comentarios que la explican justo arriba. El primero te dice cómo empezar y en qué parte de la arquitectura vive el archivo.
   - Lo que tecleas bien se vuelve código; un error marca el carácter en rojo y no avanza. Al terminar la línea pulsas Enter y aparece la siguiente.
   - Los comentarios y la indentación avanzan solos (se leen, no se copian); el código y cada Enter los escribes tú.
   - **Tab no completa nada**: cada palabra la escribes tú. **Retroceso** vuelve atrás y **Esc** abre las opciones: dictarte la línea, completar el resto o terminar borrando lo que falta.
   - **Al cerrar cada bloque** (la `}` de una función, un `if`, una clase; en Python, al terminar su cuerpo) aparece un comentario `↑` que resume qué hace lo que acabas de escribir. La barra de estado lo muestra mientras empiezas lo siguiente.
   - El código conoce tu stack, tu arquitectura, los archivos que existen, tus dependencias y lo que exportan los archivos que importas: no inventa rutas ni campos.
7. **Pide lo que quieras con un comentario**:
   ```js
   // ach: ruta para listar productos con paginación
   ```
   Pulsa Enter y completamos juntos esa instrucción.
8. **Repasa cuando toca**: cada concepto que escribiste vuelve a los 1, 3, 7, 14 y 30 días (repaso espaciado). La barra de estado avisa «N para repasar»; **Repasar conceptos** abre un ejercicio corto con **huecos**: palabras que no se muestran y escribes de memoria. Si sale bien, el intervalo se alarga; si cuesta, vuelve a empezar.
9. **Entiende los errores**: sobre un error del editor, la bombita ofrece **Entender este error**: qué dice, por qué pasa en esa línea y cómo encontrar la solución. Nunca te da el código corregido: leer errores se aprende resolviéndolos.

`autocompletehelp.json` vive en la raíz del proyecto y se versiona con tu código:

```json
{
  "prompt": "e-commerce completa, explica cada código que agregues y por qué elegiste esa metodología",
  "stack": { "resumen": "Node.js + Express 5 + MongoDB", "framework": "Express 5", "datos": "MongoDB con Mongoose 8" },
  "convenciones": ["CommonJS", "rutas en routes/"],
  "arquitectura": { "estilo": "capas", "nombre": "Monolito en capas", "reglas": ["Las rutas no hablan con la base de datos: llaman a un servicio."] },
  "plan": [{ "paso": "Modelo de producto", "archivo": "models/producto.js", "concepto": "esquemas" }]
}
```

## ✨ Características

- **Completamos juntos**: el único modo. Una línea en gris a la vez, que escribes encima; sin autocompletado.
- **Quiero aprender**: cualquier tema (lenguaje, librería, arquitectura, herramienta) se convierte en un proyecto explicado de principio a fin, con tests y Docker cuando hace falta.
- **Arquitectura y diseño de sistemas**: elección guiada, explicación de cada estilo y registro de decisión en `docs/ARQUITECTURA.md`.
- **Comentarios que dan criterio, no descripciones**: cada explicación dice qué hace, **en vez de qué** alternativa, y **cuándo no** convendría — que es lo que separa entender de memorizar.
- **La explicación se acorta a medida que aprendes**: AutoCompleteHelp anota cada concepto que escribes y, cuando lo repetiste varias veces, deja de explicártelo en detalle. **Ver mi progreso** muestra qué dominas y qué proporción escribiste tú.
- **Repaso espaciado** con huecos y **Entender este error**.
- **Multi-LLM**: elige empresa y modelo desde la barra de estado:
  - Anthropic (Claude Opus 4.8, Sonnet 5, Sonnet 4.6, Haiku 4.5)
  - OpenAI (GPT-5.1, GPT-5, GPT-4.1…)
  - Google (Gemini 3 Pro, Gemini 2.5 Pro/Flash)
  - Mistral (Codestral, Mistral Large, Devstral)
  - DeepSeek, xAI (Grok), Groq
  - OpenRouter (acceso a cientos de modelos con una sola clave)
  - **Ollama** (modelos locales, gratis y sin API key)
  - **Tus propias IAs**: el comando *Agregar IA* registra cualquier endpoint OpenAI-compatible (vLLM, LM Studio, Azure OpenAI, proxys corporativos…) con su API key
- **API keys seguras**: se guardan en el `SecretStorage` del IDE (keychain del sistema), nunca en settings.json.

## 🚀 Uso rápido

1. `npm install && npm run compile`
2. Abre la carpeta en VS Code y pulsa `F5` (Run Extension) — o empaqueta con `npx vsce package` e instala el `.vsix` en Cursor/VS Code (`Extensions → Install from VSIX`).
3. Paleta de comandos (`Ctrl/Cmd+Shift+P`):
   - **AutoCompleteHelp: Elegir proveedor y modelo** → elige LLM y guarda tu API key.
   - **AutoCompleteHelp: Definir prompt del proyecto** → ej. *"e-commerce completa, explica cada código que agregues y por qué elegiste esa metodología"*.
   - **AutoCompleteHelp: Elegir stack del proyecto** → stack, arquitectura y plan.
4. Abre un paso desde el panel **Plan del proyecto** y escribe encima de la línea en gris.

## 🧱 Stack técnico

| Capa | Elección | Por qué |
|---|---|---|
| Lenguaje | **TypeScript** | Lenguaje oficial de la API de extensiones de VS Code |
| Integración IDE | **VS Code Extension API** (decoraciones, comando `type`, TreeView) | Una sola base de código funciona en VS Code, Cursor, Windsurf y VSCodium (todos son forks de VS Code) |
| Build | `tsc` (sin bundler) | Cero dependencias de runtime; empaquetado con `vsce` |
| LLMs | `fetch` nativo (Node 18+ del extension host) | Un cliente ligero neutral entre proveedores: Messages API (Anthropic), Chat Completions (OpenAI y compatibles), generateContent (Gemini) |
| Secretos | `context.secrets` (SecretStorage) | Claves cifradas por el sistema operativo |
| Proyecto | `autocompletehelp.json` en la raíz | Prompt, stack, arquitectura y plan versionados con el código |

### Estructura del código

```
src/
├── extension.ts       # activación, comandos, barra de estado
├── dictation.ts       # «Completamos juntos»: sesión, teclado, línea por línea
├── typing.ts          # motor de tipeo puro (avance, errores, huecos, qué se muestra)
├── architectures.ts   # catálogo de arquitecturas, recomendación y registro de decisión
├── archPicker.ts      # preguntas y elección de arquitectura en el IDE
├── learnCatalog.ts    # «Quiero aprender»: catálogo de temas curados
├── learnTopics.ts     # «Quiero aprender»: recomendaciones, prompt, lectura del proyecto
├── learn.ts           # «Quiero aprender»: comando y sección del explorador
├── lessons.ts        # lecciones sin IA: código y explicaciones ya escritos y probados
├── wizard.ts         # asistentes paso a paso con ← Atrás
├── modelPicker.ts    # «Elegir la IA»: API key, local o sin IA
├── terminal.ts        # comandos escritos en la terminal (sin ejecutarse) y «Preparar el entorno»
├── stackAdvisor.ts    # elegir stack + arquitectura → plan
├── stackProfiles.ts   # perfiles de stack curados
├── planView.ts        # panel «Plan del proyecto»
├── scaffold.ts        # crear estructura
├── review.ts          # repaso espaciado
├── errorHelp.ts       # «Entender este error»
├── conceptLedger.ts   # registro de conceptos y progreso
├── projectFile.ts     # autocompletehelp.json
├── projectContext.ts  # árbol de archivos, dependencias, imports
├── prompts.ts         # prompts de sistema
├── explain.ts         # panel «Explicar código seleccionado»
├── secrets.ts         # API keys en SecretStorage
└── providers/
    ├── catalog.ts     # catálogo de empresas/modelos y resolución de config
    └── client.ts      # cliente HTTP: anthropic | openai-compatible | gemini
```

## ⚙️ Configuración

| Setting | Default | Descripción |
|---|---|---|
| `autocompletehelp.provider` | `anthropic` | Proveedor de LLM |
| `autocompletehelp.model` | *(default del proveedor)* | ID del modelo |
| `autocompletehelp.enabled` | `true` | Detectar las instrucciones `// ach: …` + Enter |
| `autocompletehelp.dictation.typeComments` | `false` | Escribir también los comentarios |
| `autocompletehelp.maxTokens` | `2400` | Tokens máximos al preparar el código de un paso |
| `autocompletehelp.ollamaUrl` | `http://localhost:11434/v1` | URL de Ollama local |
| `autocompletehelp.customBaseUrl` | — | Endpoint OpenAI-compatible propio |

## 🗺️ Roadmap

- [ ] Paquetes de stack en JSON (cualquier tecnología, creados con ayuda de la IA)
- [ ] Capa sin IA: conceptos con tree-sitter, Bayesian Knowledge Tracing, FSRS, catálogo de errores
- [ ] Desarrollo guiado por especificaciones (spec → tareas → tests de aceptación)
- [ ] Verificar cada paso automáticamente con las herramientas del stack
- [ ] Agentes con permisos y autonomía según lo que ya dominas
- [ ] IDE descargable (.exe) y publicación en VS Code Marketplace y Open VSX

## Licencia

MIT
