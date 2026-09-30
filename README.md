# AutoCompleteHelp

Extensión para **VS Code, Cursor, Windsurf, VSCodium** y cualquier IDE basado en VS Code.

Autocompletado guiado por **tu prompt**: describes qué estás construyendo y la IA completa el código mientras escribes — pero con un objetivo distinto al de un copilot clásico: **que aprendas y entiendas cada parte de tu proyecto**, no que dependas de la IA.

## 🧭 Cómo se construye un proyecto con AutoCompleteHelp

1. **Describe el proyecto** (*Definir prompt del proyecto*): con tus palabras, sin saber de tecnología.
2. **Elige el stack** (*Elegir stack del proyecto*): uno de los perfiles curados para aprender (HTML + CSS + JS, Node + Express, Python + FastAPI, React + Vite, Django), el que tú quieras, o una recomendación. Queda en `autocompletehelp.json` con convenciones y un plan paso a paso.
3. **Crea la estructura** (*Crear estructura del proyecto*): manifiesto, `.gitignore` y los archivos del plan, **vacíos salvo su instrucción `ach:`**. Nunca sobrescribe. El comando de instalación se escribe en la terminal con su explicación, y lo ejecutas tú.
4. **Sigue el plan** desde el panel **Plan del proyecto** del explorador: un clic abre el archivo del paso y el autocompletado arranca; la casilla lo marca como hecho.
5. **Escribe código**: cada sugerencia conoce tu stack, los archivos que existen, tus dependencias y lo que exportan los archivos que importas — no inventa rutas ni campos.
6. **Pide lo que quieras con un comentario**:
   ```js
   // ach: ruta para listar productos con paginación
   ```
   Pulsa Enter y la sugerencia implementa la instrucción, en tu stack y en tu nivel de aprendizaje (en `pista` recibes los pasos, no el código).

`autocompletehelp.json` vive en la raíz del proyecto y se versiona con tu código:

```json
{
  "prompt": "API REST para una tienda; explícame cada middleware",
  "stack": { "resumen": "Node.js + Express 5 + MongoDB", "framework": "Express 5", "datos": "MongoDB con Mongoose 8" },
  "convenciones": ["CommonJS", "rutas en routes/"],
  "plan": [{ "paso": "Modelo de producto", "archivo": "models/producto.js", "concepto": "esquemas" }]
}
```

## ✨ Características

- **Autocompletado inline** (texto fantasma) en cualquier lenguaje, aceptas con `Tab`.
- **Prompt del proyecto**: define qué estás construyendo y cómo quieres que te ayude; cada sugerencia usa ese contexto.
- **4 niveles de aprendizaje** (el corazón de la extensión):
  | Nivel | Qué hace | Para qué |
  |---|---|---|
  | `educame` | Cada línea explicada desde cero, una idea nueva por sugerencia | Empezar sin saber programar |
  | `pista` | Solo comentarios con pasos y pistas — **tú escribes el código** | Máximo aprendizaje |
  | `guiado` *(por defecto)* | Código + comentarios que explican el **porqué** | Aprender mientras avanzas |
  | `completo` | Código directo | Máxima velocidad |
- **La ayuda baja a medida que aprendes**: AutoCompleteHelp anota cada concepto que entra en tu código y, cuando lo repetiste varias veces, deja de explicártelo. Consulta el comando **Ver mi progreso** para ver qué dominas y qué proporción escribiste tú.
- **Comentarios que dan criterio, no descripciones**: cada explicación dice qué hace, **en vez de qué** alternativa, y **cuándo no** convendría — que es lo que separa entender de memorizar.
- **Guía del proyecto**: los archivos vacíos reciben su esqueleto según tu prompt, y cada sugerencia termina con «➜ Siguiente paso», la próxima pieza que falta del proyecto.
- **Streaming (SSE)** con corte temprano: sugerencias más rápidas y menos tokens.
- **Recomendar stack**: ¿no sabes con qué tecnologías hacer tu proyecto? El comando analiza tu prompt y propone el mejor stack para aprender, con alternativas, estructura inicial y ruta de aprendizaje — y lo fija en tu prompt si lo aceptas.
- **Explicar código seleccionado**: clic derecho → obtén una explicación pedagógica en español con una pregunta de comprensión.
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
   - **AutoCompleteHelp: Definir prompt del proyecto** → ej. *"API REST en Express con MongoDB para una tienda; explícame cada middleware"*.
   - **AutoCompleteHelp: Elegir nivel de aprendizaje** → `pista`, `guiado` o `completo`.
4. Escribe código: las sugerencias aparecen como texto gris; `Tab` para aceptar.

## 🧱 Stack técnico

| Capa | Elección | Por qué |
|---|---|---|
| Lenguaje | **TypeScript** | Lenguaje oficial de la API de extensiones de VS Code |
| Integración IDE | **VS Code Extension API** (`InlineCompletionItemProvider`) | Una sola base de código funciona en VS Code, Cursor, Windsurf y VSCodium (todos son forks de VS Code) |
| Build | `tsc` (sin bundler) | Cero dependencias de runtime; empaquetado con `vsce` |
| LLMs | `fetch` nativo (Node 18+ del extension host) | Un cliente ligero neutral entre proveedores: Messages API (Anthropic), Chat Completions (OpenAI y compatibles), generateContent (Gemini) |
| Secretos | `context.secrets` (SecretStorage) | Claves cifradas por el sistema operativo |
| Estado | `workspaceState` | El prompt del proyecto se guarda por workspace |

### Arquitectura

```
src/
├── extension.ts            # activación, comandos, barra de estado
├── inlineProvider.ts       # InlineCompletionItemProvider (debounce, caché, cancelación)
├── prompts.ts              # prompts de sistema por nivel de aprendizaje + sanitizado
├── explain.ts              # panel "Explicar código seleccionado"
├── secrets.ts              # API keys en SecretStorage
└── providers/
    ├── catalog.ts          # catálogo de empresas/modelos y resolución de config
    └── client.ts           # cliente HTTP: anthropic | openai-compatible | gemini
```

## ⚙️ Configuración

| Setting | Default | Descripción |
|---|---|---|
| `autocompletehelp.provider` | `anthropic` | Proveedor de LLM |
| `autocompletehelp.model` | *(default del proveedor)* | ID del modelo |
| `autocompletehelp.learningLevel` | `guiado` | `pista` / `guiado` / `completo` |
| `autocompletehelp.maxTokens` | `400` | Tokens máximos por sugerencia |
| `autocompletehelp.debounceMs` | `350` | Espera tras dejar de teclear |
| `autocompletehelp.ollamaUrl` | `http://localhost:11434/v1` | URL de Ollama local |
| `autocompletehelp.customBaseUrl` | — | Endpoint OpenAI-compatible propio |

## 🗺️ Roadmap

- [ ] Streaming de sugerencias (mostrar el texto fantasma a medida que llega)
- [ ] FIM (fill-in-the-middle) nativo para Codestral/StarCoder
- [ ] Métricas de aprendizaje: cuántas sugerencias aceptas vs. escribes tras una pista
- [ ] Quiz automático al final de una sesión de código
- [ ] Publicación en VS Code Marketplace y Open VSX

## Licencia

MIT
